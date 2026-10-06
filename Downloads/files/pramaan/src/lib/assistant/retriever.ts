/* Retrieval layer for the embedded-model assistant.
 *
 * Turns a free-text query into a compact, structured fact sheet from the
 * seeded PostgreSQL knowledge base (standards, knowledge docs, labs, product
 * profiles). The fact sheet is what the embedded LLM is grounded on; the
 * retrieved rows also produce the citation chips attached to every answer.
 */
import { db } from "@/db";
import { knowledgeDocs, labs, standards, type Citation } from "@/db/schema";
import { like, or, sql } from "drizzle-orm";
import { matchProducts, SCHEME_LABEL, type ProductProfile } from "@/lib/assistant/products";

export type StandardRow = typeof standards.$inferSelect;
export type DocRow = typeof knowledgeDocs.$inferSelect;
export type LabRow = typeof labs.$inferSelect;

export type Retrieved = {
  standards: StandardRow[];
  docs: DocRow[];
  labs: LabRow[];
  profiles: ProductProfile[];
  citations: Citation[];
  /** numbered `[i] ...` lines fed to the LLM as its grounding facts */
  factLines: string[];
};

/** IS-code recogniser: "IS 456:2000", "is-694", "आईएस 2347" */
const IS_RE = /(?:is|आईएस)[\s:/-]*(\d{2,6})(?:\s*[-–]\s*(\d+))?/i;

const STOPWORDS = new Set([
  "the", "and", "for", "are", "you", "your", "yours", "was", "were", "will",
  "with", "from", "this", "that", "these", "those", "when", "where", "which",
  "what", "who", "whom", "whose", "why", "how", "can", "could", "should",
  "would", "shall", "may", "might", "must", "does", "did", "done", "not",
  "last", "past", "next", "year", "month", "week", "day", "date", "time",
  "won", "win", "winner", "won't", "tell", "say", "give", "get", "got",
  "क्या", "कौन", "कैसे", "कब", "कहाँ", "यह", "वह", "में", "और", "का", "की", "के", "है", "हैं",
]);

function tokens(query: string, max = 6): string[] {
  return query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w))
    .slice(0, max);
}

async function standardsByCodeFragment(fragment: string): Promise<StandardRow[]> {
  return db.select().from(standards).where(like(standards.code, `%${fragment}%`)).limit(4);
}

async function fullTextStandards(query: string): Promise<StandardRow[]> {
  const toks = tokens(query);
  if (!toks.length) return [];
  const conds = toks.flatMap((w) => [
    like(sql`lower(${standards.title})`, `%${w}%`),
    like(sql`lower(${standards.summary})`, `%${w}%`),
    like(sql`lower(array_to_string(${standards.keywords}, ' '))`, `%${w}%`),
  ]);
  const rows = await db.select().from(standards).where(or(...conds)).limit(8);
  /* multi-word queries need a stronger match, so stray substrings ("cup" in
   * "coupler") from out-of-scope questions can't summon random standards */
  const minScore = toks.length <= 1 ? 0.5 : 2;
  return rows
    .map((r) => {
      const hay = `${r.title} ${r.summary} ${(r.keywords ?? []).join(" ")}`.toLowerCase();
      let s = 0;
      for (const w of toks) if (hay.includes(w)) s += hay.split(w).length - 1;
      if (r.mandatory) s += 0.5;
      return { r, s };
    })
    .filter((x) => x.s >= minScore)
    .sort((a, b) => b.s - a.s)
    .slice(0, 4)
    .map((x) => x.r);
}

/** Keyword-intent nudges which knowledge-doc kinds are boosted.
 *  [matcher, kinds, score-boost] — the broad last row exists mainly to keep
 *  the topicality gate honest, so it gets only a small ranking nudge. */
const DOC_KIND_HINTS: [RegExp, string[], number][] = [
  [/qco|scheme|isi|crs|fmcs|scheme-?4|योजना|आईएसआई/i, ["scheme"], 2.5],
  [/process|apply|licen[cs]e|steps|how to|register|प्रक्रिया|आवेदन/i, ["process", "scheme"], 2.5],
  [/fee|cost|charge|concession|शुल्क|लागत/i, ["fees"], 2.5],
  [/hallmark|huid|purity|gold|silver|jewel|assay|तिजोरी|हॉलमार्क|सोन|चांदी/i, ["hallmark"], 2.5],
  [/lab|test(ing)? report|where.{0,10}test|प्रयोगशाला/i, ["labs"], 2.5],
  [/complaint|fake|verify|consumer|misuse|शिकायत|नकली|उपभोक्ता/i, ["consumer", "hallmark", "labs"], 2],
  [/what is bis|about bis|bureau|बीआईएस/i, ["concept", "scheme"], 2.5],
  // broad in-domain vocabulary — also drives the topicality gate below, so
  // out-of-scope questions ("who won the world cup?") retrieve nothing
  [/standard|certif|licen[cs]e|bis|isi|मानक|प्रमाणन|लाइसेंस|चिह्न|अनिवार्य|परख|मार्क/i, ["concept", "scheme"], 0.4],
];

async function relevantDocs(query: string): Promise<DocRow[]> {
  const all = await db.select().from(knowledgeDocs);
  const toks = tokens(query, 8);
  const boosts = new Map<string, number>();
  for (const [re, kinds, weight] of DOC_KIND_HINTS) {
    if (!re.test(query)) continue;
    for (const k of kinds) boosts.set(k, Math.max(boosts.get(k) ?? 0, weight));
  }
  const scored = all
    .map((d) => {
      const hay =
        `${d.title} ${(d.keywords ?? []).join(" ")} ${d.body} ${d.bodyHi ?? ""}`.toLowerCase();
      let s = boosts.get(d.kind) ?? 0;
      for (const w of toks) {
        if (!hay.includes(w)) continue;
        s += d.title.toLowerCase().includes(w) ? 3 : 0;
        s += (d.keywords ?? []).some((k) => k.toLowerCase().includes(w)) ? 2 : 0;
        s += 1;
      }
      return { d, s };
    })
    .filter((x) => x.s > 2)
    .sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).map((x) => x.d);
}

async function labsFor(categories: string[], queryTokens: string[]): Promise<LabRow[]> {
  const rows = await db.select().from(labs).limit(200);
  return rows
    .map((r) => {
      let s = 0;
      for (const c of categories) if ((r.capabilities ?? []).includes(c)) s += 4;
      const hay = `${r.name} ${r.city} ${r.state} ${(r.capabilities ?? []).join(" ")}`.toLowerCase();
      for (const w of queryTokens) if (hay.includes(w)) s += 1;
      return { r, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, 3)
    .map((x) => x.r);
}

const stripMd = (s: string) =>
  s.replace(/[#*_`>\[\]-]/g, " ").replace(/\s+/g, " ").trim();

/* ------------------------------ fact lines ------------------------------ */

function stdFact(i: number, s: StandardRow): string {
  const parts = [
    `[${i}] ${s.code} "${s.title}". ${s.mandatory ? "Certification is MANDATORY under a QCO" : "Certification is voluntary"}; scheme: ${s.scheme}.`,
  ];
  const secs = (s.sections ?? []) as { clause?: string; summary?: string; title?: string }[];
  if (secs.length) {
    const [a, b] = [secs[0], secs[1]].filter(Boolean);
    parts.push(
      "Key clauses: " +
        [a, b]
          .map((x) => `clause ${x.clause ?? "?"} — ${stripMd(x.summary ?? x.title ?? "")}`)
          .join("; ") +
        ".",
    );
  }
  const sum = stripMd(s.summary ?? "").slice(0, 220);
  if (sum) parts.push(`About: ${sum}`);
  return parts.join(" ");
}

function docFact(i: number, d: DocRow): string {
  return `[${i}] BIS guide "${d.title}": ${stripMd(d.body).slice(0, 380)}`;
}

function labFact(i: number, l: LabRow): string {
  const caps = (l.standards ?? []).slice(0, 4).join(", ");
  return `[${i}] Testing lab: ${l.name} (${l.kind}), ${l.city}, ${l.state}. Tests: ${(l.capabilities ?? []).join(", ")}.${caps ? ` Covers ${caps}.` : ""}`;
}

function profileFact(i: number, p: ProductProfile): string {
  return `[${i}] Product "${p.label}" maps to standards ${p.standards.join(", ")} (${p.mandatory ? "mandatory" : "voluntary"}, ${SCHEME_LABEL[p.scheme] ?? p.scheme}). ${stripMd(p.note.en).slice(0, 220)}`;
}

/* --------------------------------- main --------------------------------- */

export async function retrieve(query: string): Promise<Retrieved> {
  const codeMatch = query.match(IS_RE);
  const profiles = matchProducts(query).slice(0, 2);

  const [codeRows, ftsRows, docs] = await Promise.all([
    codeMatch ? standardsByCodeFragment(codeMatch[1]) : Promise.resolve([]),
    codeMatch ? Promise.resolve([]) : fullTextStandards(query),
    relevantDocs(query),
  ]);

  /* Topicality gate: only allow this retrieval to ground an answer if the
   * query actually concerns standards/products/BIS schemes — otherwise (e.g.
   * "who won the world cup?") return nothing so the engine gives its honest
   * out-of-scope reply. Full-text rows alone are deliberately NOT evidence of
   * topicality: stray substrings ("cup" in "cupboard") are not a topic. */
  const topical =
    codeMatch != null ||
    profiles.length > 0 ||
    DOC_KIND_HINTS.some(([re]) => re.test(query));

  // exact-code hits first, then full-text hits, de-duplicated
  const seenCodes = new Set<string>();
  const stds: StandardRow[] = [];
  for (const s of [...codeRows, ...ftsRows]) {
    if (seenCodes.has(s.code)) continue;
    if (profiles.length && !codeMatch) {
      // when a product profile matched, only its own standards count —
      // unrelated full-text hits would pollute the payload
      if (!profiles.some((p) => p.standards.includes(s.code))) continue;
    }
    seenCodes.add(s.code);
    stds.push(s);
    if (stds.length >= 3) break;
  }

  // standards referenced by product profiles (pull their DB rows too)
  for (const p of profiles.slice(0, 1)) {
    for (const code of p.standards.slice(0, 3)) {
      if (seenCodes.has(code)) continue;
      const frag = code.match(/IS\s+(\d+)/)?.[1];
      if (!frag) continue;
      const hits = await standardsByCodeFragment(frag);
      const hit = hits.find((h) => h.code === code) ?? hits[0];
      if (hit && !seenCodes.has(hit.code)) {
        seenCodes.add(hit.code);
        stds.push(hit);
        if (stds.length >= 3) break;
      }
    }
    if (stds.length >= 3) break;
  }

  const labCategories = [...new Set(profiles.map((p) => p.category))];
  const labRows = topical ? await labsFor(labCategories, tokens(query, 5)) : [];
  const docRows = topical ? docs : [];
  const stdRowsFinal = topical ? stds : [];

  const factLines: string[] = [];
  const citations: Citation[] = [];
  let i = 1;
  for (const s of stdRowsFinal) {
    factLines.push(stdFact(i++, s));
    citations.push({ kind: "standard", ref: s.code, label: s.title });
  }
  for (const p of profiles.slice(0, 1)) if (topical) factLines.push(profileFact(i++, p));
  const docLimit = stdRowsFinal.length ? 1 : 3;
  for (const d of docRows.slice(0, docLimit)) {
    factLines.push(docFact(i++, d));
    citations.push({ kind: "doc", ref: d.slug, label: d.title });
  }
  for (const l of labRows) {
    factLines.push(labFact(i++, l));
    citations.push({ kind: "lab", ref: l.name, label: `${l.city} · ${l.kind}` });
  }

  return {
    standards: stdRowsFinal,
    docs: docRows,
    labs: labRows,
    profiles: topical ? profiles : [],
    citations,
    factLines,
  };
}
