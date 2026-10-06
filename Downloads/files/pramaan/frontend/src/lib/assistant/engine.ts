import { db } from "@/db";
import { knowledgeDocs, labs, standards, type Citation } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";
import { detectLocale, type Locale } from "@/lib/i18n";
import {
  matchProducts,
  SCHEME_LABEL,
  SCHEME_LABEL_HI,
  type ProductProfile,
} from "@/lib/assistant/products";

export type Intent =
  | "greeting"
  | "standard_lookup"
  | "find_standard"
  | "scheme"
  | "process"
  | "hallmarking"
  | "labs"
  | "consumer"
  | "fees"
  | "about"
  | "fallback";

export type EngineAnswer = {
  intent: Intent;
  text: string;
  citations: Citation[];
  suggestions: string[];
  locale: Locale;
};

type StandardRow = typeof standards.$inferSelect;
type DocRow = typeof knowledgeDocs.$inferSelect;
type LabRow = typeof labs.$inferSelect;

const IS_RE = /(?:is|आईएस)[\s:/-]*(\d{2,6})(?:\s*[-–]\s*(\d+))?/i;

/* ------------------------------- helpers ------------------------------- */

function normalizeCode(num: string, part?: string): string {
  return part ? `IS ${num}-${part}` : `IS ${num}`;
}

async function findByCodeCodeFragment(fragment: string): Promise<StandardRow[]> {
  const rows = await db
    .select()
    .from(standards)
    .where(like(standards.code, `%${fragment}%`))
    .limit(5);
  return rows;
}

async function fullTextStandards(query: string): Promise<StandardRow[]> {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2)
    .slice(0, 6);
  if (!tokens.length) return [];
  const conds = tokens.flatMap((w) => [
    like(sql`lower(${standards.title})`, `%${w}%`),
    like(sql`lower(${standards.summary})`, `%${w}%`),
    like(sql`lower(array_to_string(${standards.keywords}, ' '))`, `%${w}%`),
  ]);
  const rows = await db
    .select()
    .from(standards)
    .where(or(...conds))
    .limit(8);

  // score rows
  const scored = rows
    .map((r) => {
      const hay = `${r.title} ${r.summary} ${(r.keywords ?? []).join(" ")}`.toLowerCase();
      let s = 0;
      for (const w of tokens) if (hay.includes(w)) s += hay.split(w).length - 1;
      if (r.mandatory) s += 0.5;
      return { r, s };
    })
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 5).map((x) => x.r);
}

async function docsByKind(...kinds: string[]): Promise<DocRow[]> {
  const rows = await db.select().from(knowledgeDocs);
  return rows.filter((d) => kinds.includes(d.kind));
}

async function labsFor(categories: string[], limit = 4): Promise<LabRow[]> {
  const rows = await db.select().from(labs).limit(200);
  const scored = rows
    .map((r) => {
      let s = 0;
      for (const c of categories)
        if ((r.capabilities ?? []).includes(c)) s += 2;
      if (s > 0) return { r, s };
      return null;
    })
    .filter(Boolean) as { r: LabRow; s: number }[];
  return scored
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.r);
}

/* --------------------------- intent detection -------------------------- */

const INTENT_KEYS: { intent: Intent; keys: string[] }[] = [
  {
    intent: "hallmarking",
    keys: ["hallmark", "huid", "purity", "fineness", "22k", "18k", "carat", "karat", "jeweller", "assay", "हॉलमार्क", "शुद्धता", "सोने की"],
  },
  {
    intent: "labs",
    keys: ["lab", "laboratory", "testing", "test report", "where to test", "प्रयोगशाला", "परीक्षण कहाँ"],
  },
  {
    intent: "consumer",
    keys: ["complaint", "fake", "duplicate", "verify", "genuine", "consumer", "care app", "misuse", "शिकायत", "नकली", "उपभोक्ता", "असली"],
  },
  {
    intent: "fees",
    keys: ["fee", "fees", "cost", "charge", "concession", "price", "शुल्क", "लागत", "कितना खर्च"],
  },
  {
    intent: "process",
    keys: ["how to", "process", "apply", "application", "step", "licence", "license", "register", "registration process", "get bis", "obtain", "प्रक्रिया", "आवेदन", "लाइसेंस कैसे", "कैसे मिलेगा"],
  },
  {
    intent: "scheme",
    keys: ["scheme", "isi", "crs", "fmcs", "certificate of conformity", "qco", "quality control order", "mark", "योजना", "स्कीम", "आईएसआई", "सीआरएस"],
  },
  {
    intent: "find_standard",
    keys: ["which standard", "applicable", "standard for", "bis for", "certification for", "need bis", "do i need", "कौन सा मानक", "कौन-सा मानक", "मानक बताओ"],
  },
  {
    intent: "greeting",
    keys: ["hello", "hi", "hey", "namaste", "namaskar", "good morning", "नमस्ते", "प्रणाम", "हैलो"],
  },
  {
    intent: "about",
    keys: ["what is bis", "about bis", "bureau", "who are you", "what can you do", "help", "بیس", "बीआईएस क्या", "indian standard is"],
  },
];

function classify(query: string): Intent {
  const q = query.toLowerCase().trim();
  if (IS_RE.test(q) && q.replace(IS_RE, "").trim().length < 30)
    return "standard_lookup";
  let best: { intent: Intent; score: number } | null = null;
  for (const { intent, keys } of INTENT_KEYS) {
    let score = 0;
    for (const k of keys) if (q.includes(k)) score += k.length > 5 ? 2 : 1;
    if (score > 0 && (!best || score > best.score)) best = { intent, score };
  }
  if (best) return best.intent;
  if (IS_RE.test(q)) return "standard_lookup";
  if (matchProducts(query).length > 0) return "find_standard";
  return "fallback";
}

/* ------------------------------ templates ------------------------------ */

const L = (locale: Locale, en: string, hi: string) => (locale === "hi" ? hi : en);

function schemeLabel(locale: Locale, key: string): string {
  return locale === "hi"
    ? (SCHEME_LABEL_HI[key] ?? SCHEME_LABEL[key] ?? key)
    : (SCHEME_LABEL[key] ?? key);
}

function stdLine(s: StandardRow): string {
  const flags = [
    s.mandatory ? "**mandatory (QCO)** certification" : "voluntary certification",
    `scheme: ${s.scheme}`,
  ];
  return `- **${s.code}** — ${s.title} _(${flags.join(" · ")})_`;
}

function stdCitation(s: StandardRow, clause?: string): Citation {
  return { kind: "standard", ref: s.code, label: s.title, clause };
}

/* ------------------------------ composers ------------------------------ */

async function answerGreeting(locale: Locale): Promise<EngineAnswer> {
  const text = L(
    locale,
    `**Namaste.** I am Pramaan — the AI intelligent assistant for Indian Standards and BIS services.\n\nI can help you with:\n- Finding the **applicable Indian Standard** for any product\n- Guidance on **BIS certification schemes** (ISI, CRS, Hallmarking, FMCS)\n- Step-by-step **licensing process** and fees\n- **Hallmark & licence verification** guidance for consumers\n- Suggesting **BIS-recognized testing laboratories**\n\nAsk me in English or हिन्दी — every answer cites its source document.`,
    `**नमस्ते।** मैं प्रमाण हूँ — भारतीय मानकों एवं BIS सेवाओं के लिए AI सहायक।\n\nमैं आपकी मदद कर सकता हूँ:\n- किसी भी उत्पाद के लिए **लागू भारतीय मानक** खोजने में\n- **BIS प्रमाणन योजनाओं** (ISI, CRS, हॉलमार्किंग, FMCS) की जानकारी में\n- **लाइसेंस प्रक्रिया** एवं शुल्क के चरणबद्ध मार्गदर्शन में\n- उपभोक्ताओं के लिए **हॉलमार्क व लाइसेंस सत्यापन** में\n- **BIS-मान्यता प्राप्त परीक्षण प्रयोगशालाओं** के सुझाव में\n\nअंग्रेज़ी या हिन्दी में पूछें — हर उत्तर स्रोत-उद्धरण सहित।`,
  );
  return {
    intent: "greeting",
    text,
    citations: [{ kind: "doc", ref: "concept-what-is-bis", label: "What is BIS — knowledge base" }],
    suggestions:
      locale === "hi"
        ? ["सीमेंट के लिए कौन-सा मानक लागू है?", "ISI लाइसेंस कैसे मिलेगा?", "गोल्ड की हॉलमार्किंग कैसे जाँचें?"]
        : ["Which standard applies to cement?", "How do I get an ISI licence?", "How can I verify a gold hallmark?"],
    locale,
  };
}

async function answerStandardLookup(query: string, locale: Locale): Promise<EngineAnswer> {
  const m = query.match(IS_RE);
  const fragment = m ? normalizeCode(m[1], m[2]) : query.trim();
  const rows = await findByCodeCodeFragment(fragment.replace(/^IS\s*/i, "IS ").slice(3));
  if (!rows.length) {
    const alt = await fullTextStandards(query);
    if (alt.length) return answerFindStandard(query, locale, matchProducts(query));
    return {
      intent: "standard_lookup",
      text: L(
        locale,
        `I could not find **${fragment}** in the built-in standards catalogue. Try the Standard Finder with a product description, or ask for a related standard number.\n\n_Tip: codes look like "IS 456:2000" — number, optionally part (IS 302-2) and year._`,
        `**${fragment}** अंतर्निहित मानक-सूची में नहीं मिला। उत्पाद विवरण से स्टैंडर्ड फाइंडर का उपयोग करें, या संबंधित मानक संख्या पूछें।`,
      ),
      citations: [],
      suggestions:
        locale === "hi"
          ? ["IS 456:2000 क्या है?", "TMT सरिया का मानक बताओ"]
          : ["What is IS 456:2000?", "Standard for TMT steel bars"],
      locale,
    };
  }

  const s = rows[0];
  const sectionLines = (s.sections as { clause: string; title: string }[])
    .slice(0, 6)
    .map((x) => `- **Clause ${x.clause}** — ${x.title}`)
    .join("\n");
  const relatedLines = (s.related ?? []).map((r: string) => `- ${r}`).join("\n");

  const text = L(
    locale,
    `**${s.code} — ${s.title}**\n\n${s.summary}\n\n**Status:** ${s.status} · **${s.editions}** published revision(s)\n**Certification:** ${s.mandatory ? "Mandatory (Quality Control Order)" : "Voluntary"}${s.qco ? ` · ${s.qco}` : ""}\n**Scheme:** ${s.scheme}\n\n**Key clauses & provisions**\n${sectionLines}\n\n**Related standards**\n${relatedLines || "- None recorded"}\n\n_Ask me about the certification process, labs that test against this standard, or a related product._`,
    `**${s.code} — ${s.title}**\n\n${s.summary}\n\n**स्थिति:** ${s.status} · ${s.editions} संशोधन प्रकाशित\n**प्रमाणन:** ${s.mandatory ? "अनिवार्य (QCO)" : "स्वैच्छिक"}${s.qco ? ` · ${s.qco}` : ""}\n**योजना:** ${s.scheme}`,
  );

  const citations: Citation[] = [stdCitation(s)];
  for (const sec of (s.sections as { clause: string; title: string }[]).slice(0, 3))
    citations.push({ kind: "standard", ref: s.code, label: sec.title, clause: `Clause ${sec.clause}` });

  return {
    intent: "standard_lookup",
    text,
    citations,
    suggestions: L(locale, "How do I get certified against this standard?,Which labs test this standard?,What is a Quality Control Order?", "इस मानक हेतु प्रमाणन कैसे मिलेगा?,कौन-सी प्रयोगशाला परीक्षण करती है?,QCO क्या है?").split(","),
    locale,
  };
}

function productBlock(p: ProductProfile, locale: Locale): { body: string; cites: Citation[] } {
  const scheme = schemeLabel(locale, p.scheme);
  const status = p.mandatory
    ? L(locale, "**Mandatory** — a Quality Control Order applies.", "**अनिवार्य** — गुणवत्ता नियंत्रण आदेश लागू।")
    : L(locale, "**Voluntary** — certification optional but mark inspires trust.", "**स्वैच्छिक** — प्रमाणन वैकल्पिक, परन्तु चिह्न विश्वास दिलाता है।");
  const stds = p.standards.map((c) => `- **${c}**`).join("\n");
  const body = L(
    locale,
    `**${p.label}**\n${p.note.en}\n\n**Applicable Indian Standards**\n${stds}\n\n**Certification scheme:** ${scheme}\n**Status:** ${status}`,
    `**${p.labelHi}**\n${p.note.hi}\n\n**लागू भारतीय मानक**\n${stds}\n\n**प्रमाणन योजना:** ${scheme}\n**स्थिति:** ${status}`,
  );
  return {
    body,
    cites: p.standards.map((c) => ({ kind: "standard" as const, ref: c, label: `Applicable standard for ${p.label}` })),
  };
}

async function answerFindStandard(
  query: string,
  locale: Locale,
  profiles: ProductProfile[],
): Promise<EngineAnswer> {
  const blocks: string[] = [];
  const citations: Citation[] = [];

  if (profiles.length) {
    for (const p of profiles) {
      const blk = productBlock(p, locale);
      blocks.push(blk.body);
      citations.push(...blk.cites);
    }
  } else {
    const rows = await fullTextStandards(query);
    if (rows.length) {
      blocks.push(
        L(
          locale,
          `Based on your description, these Indian Standards are the closest matches:`,
          `आपके विवरण के आधार पर ये भारतीय मानक निकटतम हैं:`,
        ) + "\n\n" + rows.map(stdLine).join("\n"),
      );
      citations.push(...rows.slice(0, 4).map((r) => stdCitation(r)));
    }
  }

  if (!blocks.length) {
    return {
      intent: "find_standard",
      text: L(
        locale,
        `I could not confidently map that product to an Indian Standard yet. Try naming the product concretely — e.g. "cement", "LED bulb", "gold bangle", "HDPE pipe" — or open the **Standard Finder** wizard for a guided search.`,
        `इस उत्पाद को मैं अभी किसी भारतीय मानक से जोड़ नहीं पाया। उत्पाद का स्पष्ट नाम बताएँ — जैसे "सीमेंट", "LED बल्ब", "सोने की चूड़ी", "HDPE पाइप" — या गाइडेड खोज हेतु **स्टैंडर्ड फाइंडर** खोलें।`,
      ),
      citations: [],
      suggestions:
        locale === "hi" ? ["LED बल्ब पर कौन-सा मानक?", "प्रेशर कुकर का मानक"] : ["Standard for LED bulbs", "Which standard for pressure cookers?"],
      locale,
    };
  }

  blocks.push(
    L(
      locale,
      `**Next step** — use the Standard Finder to get the full certification path (fees, timeline, labs), or ask me "how to get certified".`,
      `**अगला कदम** — पूर्ण प्रमाणन मार्ग (शुल्क, समय, प्रयोगशालाएँ) जानने हेतु स्टैंडर्ड फाइंडर खोलें, या पूछें "प्रमाणन कैसे मिलेगा"।`,
    ),
  );

  return {
    intent: "find_standard",
    text: blocks.join("\n\n---\n\n"),
    citations,
    suggestions:
      locale === "hi"
        ? ["ISI लाइसेंस की प्रक्रिया बताओ", "प्रमाणन शुल्क कितना है?", "नजदीकी प्रयोगशाला बताओ"]
        : ["Explain the ISI licensing process", "What are the certification fees?", "Suggest a testing lab"],
    locale,
  };
}

async function answerScheme(locale: Locale): Promise<EngineAnswer> {
  const docs = await docsByKind("scheme");
  const text = L(
    locale,
    `BIS operates four main **conformity assessment schemes** under the BIS (Conformity Assessment) Regulations, 2018:\n\n**Scheme-I — ISI Mark (Product Certification)**\nFor manufacturers of products under Indian Standards — mandatory where a QCO applies, voluntary otherwise. Factory audit + independent sample testing → licence with a **CM/L-** number.\n\n**Scheme-II — Compulsory Registration Scheme (CRS)**\nFor electronics & IT goods (laptops, adapters, LED lamps, batteries). Test report from a BIS-recognized lab → online **R-registration**; no factory audit.\n\n**Scheme-IV — Certificate of Conformity (CoC)**\nFor products needing type-approval style conformity against a standard, granted on testing + conformity assessment.\n\n**Hallmarking — Gold & Silver Jewellery**\nJewellers register with BIS; articles are assayed & hallmarked at recognized **AHCs** with fineness + HUID. Mandatory for gold in notified districts.\n\n**FMCS — Foreign Manufacturers**\nOverseas plants get an ISI licence to export certified products into India; an Authorized Indian Representative is required.`,
    `BIS (Conformity Assessment) Regulations, 2018 के अंतर्गत चार प्रमुख **अनुरूपता मूल्यांकन योजनाएँ** हैं:\n\n**योजना-I — ISI चिह्न (उत्पाद प्रमाणन)**\nभारतीय मानकों के अंतर्गत उत्पाद बनाने वाले निर्माताओं हेतु — QCO होने पर अनिवार्य, अन्यथा स्वैच्छिक। फैक्ट्री ऑडिट + स्वतंत्र परीक्षण → **CM/L-** संख्या सहित लाइसेंस।\n\n**योजना-II — अनिवार्य पंजीकरण योजना (CRS)**\nइलेक्ट्रॉनिक्स व IT उत्पाद (लैपटॉप, एडॉप्टर, LED लैंप, बैटरी)। BIS-मान्यता प्राप्त लैब की टेस्ट रिपोर्ट → ऑनलाइन **R-पंजीकरण**; फैक्ट्री ऑडिट नहीं।\n\n**योजना-IV — अनुरूपता प्रमाणपत्र (CoC)**\nमानक के विरुद्ध टाइप-अप्रूवल प्रकार की अनुरूपता हेतु परीक्षण + मूल्यांकन पर प्रदान।\n\n**हॉलमार्किंग — स्वर्ण व रजत आभूषण**\nजॉइलर्स BIS में पंजीकृत होते हैं; मान्यता प्राप्त **AHC** पर शुद्धता + HUID सहित हॉलमार्क। अधिसूचित जिलों में सोने हेतु अनिवार्य।\n\n**FMCS — विदेशी निर्माता**\nविदेशी संयंत्र भारत में प्रमाणित उत्पाद निर्यात हेतु ISI लाइसेंस लेते हैं; अधिकृत भारतीय प्रतिनिधि आवश्यक।`,
  );
  return {
    intent: "scheme",
    text,
    citations: docs.slice(0, 5).map((d) => ({ kind: "doc", ref: d.slug, label: d.title })),
    suggestions:
      locale === "hi"
        ? ["ISI लाइसेंस की चरणवार प्रक्रिया", "CRS पंजीकरण कैसे करें?", "शुल्क और रियायतें"]
        : ["Step-by-step ISI licensing process", "How does CRS registration work?", "What are the fees and concessions?"],
    locale,
  };
}

async function answerProcess(locale: Locale): Promise<EngineAnswer> {
  const docs = await docsByKind("process");
  const text = L(
    locale,
    `**ISI licence (Scheme-I) — the standard journey for an Indian manufacturer:**\n\n1. **Confirm applicability** — identify the Indian Standard for your product and check whether a QCO makes certification mandatory.\n2. **Prepare test infrastructure** — arrange in-house lab or tie up with a BIS-recognized laboratory for routine testing.\n3. **Apply online** — file the application on the BIS portal with factory documents, quality-control plan, test reports and the application fee.\n4. **Factory audit** — BIS officers inspect manufacturing process, QC manpower and testing facilities.\n5. **Independent sample testing** — sealed samples are tested at BIS/recognized labs against every clause of the standard.\n6. **Grant of licence** — on conformity, a licence with a unique **CM/L-** number is issued; the ISI Standard Mark may then be applied.\n7. **Surveillance** — periodic factory inspections plus market/factory sample testing keep the licence alive; renewals are usually for 1–5 years.\n\n**Typical timeline:** ~30–90 days depending on product complexity and test duration.\n\nFor electronics (CRS), steps 4–7 are replaced by online registration against a lab test report — usually 2–4 weeks.`,
    `**ISI लाइसेंस (योजना-I) — भारतीय निर्माता की मानक यात्रा:**\n\n1. **लागूता की पुष्टि** — अपने उत्पाद का भारतीय मानक पहचानें व QCO से अनिवार्यता जाँचें।\n2. **परीक्षण व्यवस्था** — इन-हाउस लैब बनाएँ या BIS-मान्यता प्राप्त प्रयोगशाला से समझौता करें।\n3. **ऑनलाइन आवेदन** — BIS पोर्टल पर फैक्ट्री दस्तावेज़, गुणवत्ता-नियंत्रण योजना, टेस्ट रिपोर्ट व शुल्क सहित आवेदन करें।\n4. **फैक्ट्री ऑडिट** — BIS अधिकारी निर्माण प्रक्रिया, QC जनशक्ति व परीक्षण सुविधाओं का निरीक्षण करते हैं।\n5. **स्वतंत्र परीक्षण** — सील किए नमूने BIS/मान्यता प्राप्त लैब में प्रत्येक खंड के विरुद्ध परीक्षित होते हैं।\n6. **लाइसेंस प्रदान** — अनुरूपता पर अद्वितीय **CM/L-** संख्या वाला लाइसेंस जारी; फिर ISI मानक चिह्न लगाया जा सकता है।\n7. **निगरानी** — आवधिक निरीक्षण व बाज़ार/फैक्ट्री नमूना परीक्षण; नवीनीकरण सामान्यतः 1–5 वर्ष हेतु।\n\n**सामान्य समय:** उत्पाद जटिलता पर निर्भर — लगभग 30–90 दिन।\n\nइलेक्ट्रॉनिक्स (CRS) में चरण 4–7 के स्थान पर लैब टेस्ट रिपोर्ट के आधार पर ऑनलाइन पंजीकरण — सामान्यतः 2–4 सप्ताह।`,
  );
  return {
    intent: "process",
    text,
    citations: docs.map((d) => ({ kind: "doc", ref: d.slug, label: d.title })),
    suggestions:
      locale === "hi"
        ? ["क्या शुल्क में कोई रियायत है?", "मेरे उत्पाद के लिए कौन-सी योजना?", "नमूना परीक्षण कहाँ कराऊँ?"]
        : ["Any fee concessions for MSMEs?", "Which scheme fits my product?", "Where do I get samples tested?"],
    locale,
  };
}

async function answerHallmark(query: string, locale: Locale): Promise<EngineAnswer> {
  const docs = await docsByKind("hallmark");
  const goldStds = await findByCodeCodeFragment("1417");
  const silverStds = await findByCodeCodeFragment("2112");

  const wantsVerify = /verify|check|genuine|huid|जाँच|पहचान/.test(query.toLowerCase());
  const verifyBlock = wantsVerify
    ? L(
        locale,
        `\n\n**To verify a hallmarked piece (3 checks, 30 seconds)**\n1. Look for the **BIS Standard Mark** (triangle) laser-etched on the article.\n2. Check the **fineness grade** — e.g. 22K916 (91.6% pure), 18K750, 14K585.\n3. Enter the **6-digit HUID** in the **BIS Care App** → it reveals the jeweller, AHC, purity and article type. Mismatch = complaint.`,
        `\n\n**हॉलमार्क सत्यापन (3 जाँचें, 30 सेकंड)**\n1. वस्तु पर लेज़र-अंकित **BIS मानक चिह्न** (त्रिभुज) देखें।\n2. **शुद्धता ग्रेड** जाँचें — जैसे 22K916 (91.6% शुद्ध), 18K750, 14K585।\n3. **BIS Care ऐप** में **6-अंकों का HUID** डालें → जॉइलर, AHC, शुद्धता व वस्तु प्रकार दिखेगा। मेल न खाएँ तो शिकायत करें।`,
      )
    : "";

  const text = L(
    locale,
    `**BIS Hallmarking — how gold & silver purity is certified in India**\n\n- Hallmarking of **gold jewellery/artefacts** is **mandatory** in notified districts under IS 1417:2016; silver (IS 2112:2014) remains voluntary.\n- A genuine hallmark has **three elements**: the BIS Standard Mark, the **fineness/purity grade** (22K916, 18K750, 20K833, 23K958, 24K999, 14K585), and a **6-digit alphanumeric HUID** unique to each piece.\n- Jewellers must hold a **BIS registration**; hallmarking itself is done only at BIS-recognized **Assaying & Hallmarking Centres (AHCs)** on a fire-assay / XRF basis.\n- Selling non-hallmarked gold in notified districts is a punishable violation of the BIS Act, 2016.` +
      verifyBlock,
    `**BIS हॉलमार्किंग — भारत में स्वर्ण/रजत शुद्धता प्रमाणन**\n\n- अधिसूचित जिलों में **स्वर्ण आभूषण/वस्तुओं** की हॉलमार्किंग IS 1417:2016 के अंतर्गत **अनिवार्य** है; रजत (IS 2112:2014) स्वैच्छिक।\n- असली हॉलमार्क के **तीन तत्व**: BIS मानक चिह्न, **शुद्धता ग्रेड** (22K916, 18K750, 20K833, 23K958, 24K999, 14K585), और प्रत्येक वस्तु का अद्वितीय **6-अंकों का HUID**।\n- जॉइलर्स के पास **BIS पंजीकरण** होना चाहिए; हॉलमार्किंग केवल BIS-मान्यता प्राप्त **AHC** पर फायर-एस्से / XRF से होती है।\n- अधिसूचित जिलों में बिना हॉलमार्क सोना बेचना BIS अधिनियम, 2016 का दंडनीय उल्लंघन है।` +
      verifyBlock,
  );
  const citations: Citation[] = docs.map((d) => ({ kind: "doc", ref: d.slug, label: d.title }));
  for (const s of [...goldStds, ...silverStds]) citations.push(stdCitation(s));
  return {
    intent: "hallmarking",
    text,
    citations: citations.slice(0, 6),
    suggestions:
      locale === "hi"
        ? ["चांदी की हॉलमार्किंग अनिवार्य है?", "HUID कहाँ मिलेगा?", "नकली हॉलमार्क की शिकायत कैसे करें?"]
        : ["Is silver hallmarking mandatory?", "Where do I find the HUID?", "How do I report a fake hallmark?"],
    locale,
  };
}

async function answerLabs(query: string, locale: Locale): Promise<EngineAnswer> {
  const profiles = matchProducts(query);
  const cats = profiles.length ? profiles.map((p) => p.category) : ["electrical"];
  const found = await labsFor(cats, 4);
  const lines = found
    .map(
      (l) =>
        `- **${l.name}** — ${l.city}, ${l.state} _(${l.kind})_\n  Tests: ${(l.standards ?? []).slice(0, 4).join(", ")}`,
    )
    .join("\n");
  const text = L(
    locale,
    `Matching BIS lab network for your query:\n\n${lines}\n\nYour product's **first sample testing** is usually arranged by BIS during licensing; routine tests can also be outsourced to these recognized laboratories. Open the **Labs directory** to filter by state and capability.`,
    `आपके प्रश्न हेतु उपयुक्त BIS प्रयोगशाला नेटवर्क:\n\n${lines}\n\nलाइसेंसिंद के दौरान **प्रथम नमूना परीक्षण** सामान्यतः BIS कराता है; दिनचर्या के परीक्षण इन मान्यता प्राप्त प्रयोगशालाओं में कराए जा सकते हैं। राज्य व क्षमता अनुसार छाँटने हेतु **प्रयोगशाला निर्देशिका** खोलें।`,
  );
  return {
    intent: "labs",
    text,
    citations: found.map((l) => ({ kind: "lab", ref: `${l.city}`, label: l.name })),
    suggestions:
      locale === "hi" ? ["AHC क्या होता है?", "लैब मान्यता कैसे मिलती है?"] : ["What is an AHC?", "How does a lab get BIS recognition?"],
    locale,
  };
}

async function answerConsumer(query: string, locale: Locale): Promise<EngineAnswer> {
  const docs = await docsByKind("consumer");
  const text = L(
    locale,
    `**As a consumer, BIS gives you three shields:**\n\n1. **Verify before you buy** — use the **BIS Care App** (or this app's Consumer Corner) to check any ISI licence number (CM/L-), CRS R-number, jeweller registration or gold **HUID**. An invalid or mismatched number means the mark is being misused.\n2. **Know the genuine marks** — the ISI mark always carries the standard number and the licence number below it; CRS products show the R-number; hallmarked gold shows Standard Mark + fineness + HUID.\n3. **Complain and get action** — file complaints with BIS through the Consumer Corner here, the BIS Care App, or the National Consumer Helpline **1915** / nch.gov.in. Misuse of the Standard Mark is punishable under the **BIS Act, 2016** (fine up to ₹5 lakh and/or imprisonment).\n\nTip: For products under QCO (helmets, pressure cookers, toys, cables), **no ISI mark = illegal to sell**. You can report it directly.`,
    `**उपभोक्ता के रूप में BIS आपको तीन सुरक्षाएँ देता है:**\n\n1. **खरीदने से पहले सत्यापन** — **BIS Care ऐप** (या इस ऐप का उपभोक्ता कॉर्नर) से किसी भी ISI लाइसेंस (CM/L-), CRS R-संख्या, जॉइलर पंजीकरण या गोल्ड **HUID** की जाँच करें। अमान्य/बेमेल संख्या यानी चिह्न का दुरुपयोग।\n2. **असली चिह्न पहचानें** — ISI चिह्न के नीचे मानक संख्या व लाइसेंस संख्या अंकित होती है; CRS उत्पादों पर R-संख्या; हॉलमार्क सोने पर मानक चिह्न + शुद्धता + HUID।\n3. **शिकायत करें, कार्रवाई पाएँ** — यहाँ के उपभोक्ता कॉर्नर, BIS Care ऐप, या राष्ट्रीय उपभोक्ता हेल्पलाइन **1915** / nch.gov.in पर शिकायत दर्ज करें। मानक चिह्न का दुरुपयोग **BIS अधिनियम, 2016** में दंडनीय (₹5 लाख तक जुर्माना और/या कारावास)।\n\nसुझाव: QCO वाले उत्पाद (हेलमेट, प्रेशर कुकर, खिलौने, केबल) पर **ISI चिह्न न हो = बेचना अवैध**। सीधे रिपोर्ट करें।`,
  );
  return {
    intent: "consumer",
    text,
    citations: docs.map((d) => ({ kind: "doc", ref: d.slug, label: d.title })),
    suggestions:
      locale === "hi" ? ["HUID से हॉलमार्क कैसे जाँचूँ?", "ISI लाइसेंस नंबर सत्यापित करना है"]
        : ["How do I verify a HUID?", "I want to verify an ISI licence number"],
    locale,
  };
}

async function answerFees(locale: Locale): Promise<EngineAnswer> {
  const docs = await docsByKind("fees");
  const text = L(
    locale,
    `**BIS certification cost structure (Scheme-I, ISI):**\n\n- **Application fee** — a fixed fee is payable with every application (per product/standard).\n- **Audit/inspection charges** — per man-day for the BIS officers visiting your factory.\n- **Sample testing charges** — actual lab charges for testing at BIS/recognized labs, varying by product (a few thousand to tens of thousands of rupees).\n- **Licence fee + marking fee** — annual licence fee plus a unit-rate marking fee on production (as per the product's fee schedule).\n\n**Concessions available:**\n- **Micro & small enterprises** and recognized **startups** get substantial concessions (up to 80% on certification/marking fee for micro units; ~50% for small).\n- Additional relief for **women entrepreneurs** and **North-Eastern units**.\n\n**CRS (electronics):** registration fee per application + one-time lab testing cost per model/series.\n**Hallmarking:** jeweller registration fee + per-article hallmarking charge at the AHC.\n\n_Exact current figures are notified on bis.gov.in — always confirm there before budgeting._`,
    `**BIS प्रमाणन लागत संरचना (योजना-I, ISI):**\n\n- **आवेदन शुल्क** — प्रत्येक आवेदन के साथ नियत शुल्क (प्रति उत्पाद/मानक)।\n- **ऑडिट/निरीक्षण शुल्क** — फैक्ट्री आने वाले BIS अधिकारियों का प्रति मैन-डे शुल्क।\n- **नमूना परीक्षण शुल्क** — BIS/मान्यता प्राप्त लैब में वास्तविक परीक्षण लागत, उत्पाद अनुसार (कुछ हज़ार से दसियों हज़ार रुपये)।\n- **लाइसेंस शुल्क + मार्किंग शुल्क** — वार्षिक लाइसेंस शुल्क व उत्पादन पर यूनिट-दर मार्किंग शुल्क।\n\n**उपलब्ध रियायतें:**\n- **सूक्ष्म व लघु उद्यम** और मान्यता प्राप्त **स्टार्टअप** को पर्याप्त छूट (सूक्ष्म इकाइयों हेतु प्रमाणन/मार्किंग शुल्क पर 80% तक; लघु हेतु ~50%)।\n- **महिला उद्यमियों** व **पूर्वोत्तर इकाइयों** को अतिरिक्त राहत।\n\n**CRS (इलेक्ट्रॉनिक्स):** प्रति आवेदन पंजीकरण शुल्क + प्रति मॉडल/सीरीज़ एकमुश्त लैब परीक्षण लागत।\n**हॉलमार्किंग:** जॉइलर पंजीकरण शुल्क + AHC पर प्रति-वस्तु हॉलमार्किंग शुल्क।\n\n_सटीक वर्तमान दरें bis.gov.in पर अधिसूचित हैं — बजट बनाने से पहले वहाँ अवश्य जाँचें।_`,
  );
  return {
    intent: "fees",
    text,
    citations: docs.map((d) => ({ kind: "doc", ref: d.slug, label: d.title })),
    suggestions:
      locale === "hi" ? ["ISI लाइसेंस की प्रक्रिया बताओ", "मेरी इकाई सूक्ष्म है — छूट कैसे मिलेगी?"]
        : ["Walk me through the ISI application", "My unit is micro — how do I claim the concession?"],
    locale,
  };
}

async function answerAbout(locale: Locale): Promise<EngineAnswer> {
  const text = L(
    locale,
    `**The Bureau of Indian Standards (BIS)** is India's National Standards Body, established under the **BIS Act, 2016**. It:\n\n- Publishes **thousands of Indian Standards (IS)** prepared by expert technical committees across electrotechnical, civil, food, chemical, textile, mechanical and service sectors.\n- Runs **conformity assessment**: product certification (ISI), compulsory registration (CRS), hallmarking of precious metals, management-system certification and laboratory recognition.\n- Operates **Quality Control Orders (QCOs)** with ministries so that critical products cannot be sold without certification.\n- Protects consumers through the **BIS Care App**, complaint handling and enforcement against misuse of the Standard Mark.\n\nI am trained on this platform's curated knowledge base of standards, schemes, processes and labs — ask me anything about them, and I will always show my sources.`,
    `**भारतीय मानक ब्यूरो (BIS)** भारत का राष्ट्रीय मानक निकाय है, जो **BIS अधिनियम, 2016** के अंतर्गत स्थापित हुआ। यह:\n\n- विशेषज्ञ तकनीकी समितियों द्वारा तैयार **हज़ारों भारतीय मानक (IS)** प्रकाशित करता है — इलेक्ट्रोटेक्निकल, सिविल, खाद्य, रासायनिक, वस्त्र, यांत्रिक व सेवा क्षेत्रों में।\n- **अनुरूपता मूल्यांकन** चलाता है: उत्पाद प्रमाणन (ISI), अनिवार्य पंजीकरण (CRS), बहुमूल्य धातुओं की हॉलमार्किंग, प्रबंधन-प्रणाली प्रमाणन व प्रयोगशाला मान्यता।\n- मंत्रालयों के साथ **गुणवत्ता नियंत्रण आदेश (QCO)** लागू करता है जिससे महत्वपूर्ण उत्पाद बिना प्रमाणन न बिक सकें।\n- **BIS Care ऐप**, शिकायत निपटान व मानक चिह्न के दुरुपयोग के विरुद्ध प्रवर्तन से उपभोक्ता संरक्षण करता है।\n\nमैं इस प्लेटफ़ॉर्म के क्युरेटेड ज्ञान-आधार (मानक, योजनाएँ, प्रक्रियाएँ, प्रयोगशालाएँ) पर प्रशिक्षित हूँ — कुछ भी पूछें, स्रोत सहित उत्तर मिलेगा।`,
  );
  return {
    intent: "about",
    text,
    citations: [{ kind: "doc", ref: "concept-what-is-bis", label: "What is BIS — knowledge base" }],
    suggestions:
      locale === "hi" ? ["ISI मार्क क्या होता है?", "BIS कितनी योजनाएँ चलाता है?"] : ["What does the ISI mark mean?", "How many schemes does BIS run?"],
    locale,
  };
}

async function answerFallback(query: string, locale: Locale): Promise<EngineAnswer> {
  const rows = await fullTextStandards(query);
  if (rows.length) {
    const text =
      L(
        locale,
        `I'm not fully certain of your intent, but these standards look related:\n\n`,
        `आपका आशय पूरी तरह स्पष्ट नहीं, पर ये मानक संबंधित लगते हैं:\n\n`,
      ) +
      rows.map(stdLine).join("\n") +
      L(
        locale,
        `\n\nTry rephrasing, or ask directly: "certification for <product>", "process for ISI licence", "verify hallmark".`,
        `\n\nदोबारा पूछने का प्रयास करें, या सीधे पूछें: "<उत्पाद> का प्रमाणन", "ISI लाइसेंस प्रक्रिया", "हॉलमार्क जाँच"।`,
      );
    return {
      intent: "fallback",
      text,
      citations: rows.slice(0, 4).map((r) => stdCitation(r)),
      suggestions:
        locale === "hi" ? ["IS 456:2000 की जानकारी दो", "BIS की योजनाएँ समझाओ"] : ["Tell me about IS 456:2000", "Explain BIS schemes"],
      locale,
    };
  }
  return {
    intent: "fallback",
    text: L(
      locale,
      `I specialise in **Indian Standards and BIS services** — applicable standards for products, certification schemes & processes, fees, hallmarking, labs and consumer verification.\n\nCould you rephrase around one of those? For example:\n- "Which standard applies to an HDPE water pipe?"\n- "How do I get CRS registration for bluetooth speakers?"\n- "How can I check if a gold hallmark is genuine?"`,
      `मेरी विशेषज्ञता **भारतीय मानकों व BIS सेवाओं** में है — उत्पादों के लागू मानक, प्रमाणन योजनाएँ व प्रक्रियाएँ, शुल्क, हॉलमार्किंग, प्रयोगशालाएँ तथा उपभोक्ता सत्यापन।\n\nकृपया इन्हीं में से कोई प्रश्न पूछें। जैसे:\n- "HDPE पाइप पर कौन-सा मानक लागू है?"\n- "ब्लूटूथ स्पीकर का CRS पंजीकरण कैसे होगा?"\n- "सोने का हॉलमार्क असली है या नहीं, कैसे जाँचूँ?"`,
    ),
    citations: [],
    suggestions:
      locale === "hi" ? ["सीमेंट का मानक", "हॉलमार्क कैसे जाँचें", "प्रयोगशाला सूची"] : ["Standard for cement", "How to verify hallmark", "List testing labs"],
    locale,
  };
}

/* -------------------------------- entry -------------------------------- */

export async function answer(query: string, localeHint: Locale = "en"): Promise<EngineAnswer> {
  const locale = detectLocale(query, localeHint);
  const intent = classify(query);
  const profiles = matchProducts(query);

  // Strong signal: product found + scheme/process intent enriched answers
  if (intent === "find_standard") return answerFindStandard(query, locale, profiles);
  if (intent === "standard_lookup") return answerStandardLookup(query, locale);
  if (intent === "greeting") return answerGreeting(locale);
  if (intent === "scheme") {
    const a = await answerScheme(locale);
    if (profiles.length) {
      const blk = productBlock(profiles[0], locale);
      a.text += `\n\n---\n\n${L(locale, "**For your product specifically:**", "**आपके उत्पाद के लिए विशेष रूप से:**")}\n\n${blk.body}`;
      a.citations.push(...blk.cites);
    }
    return a;
  }
  if (intent === "process") return answerProcess(locale);
  if (intent === "hallmarking") return answerHallmark(query, locale);
  if (intent === "labs") return answerLabs(query, locale);
  if (intent === "consumer") return answerConsumer(query, locale);
  if (intent === "fees") return answerFees(locale);
  if (intent === "about") return answerAbout(locale);
  // fallback: if a product matched, prefer product answer
  if (profiles.length) return answerFindStandard(query, locale, profiles);
  return answerFallback(query, locale);
}
