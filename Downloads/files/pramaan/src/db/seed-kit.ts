/* ------------------------------------------------------------------------
 * seed-kit — compact authoring format for catalogue expansion waves.
 *
 * Writing ~1000 more standards by hand is only practical in a terse format, so
 * each row is a `[code, title, summary, flag?, extras?]` tuple inside a
 * "block" that fixes the category (and the Quality Control Order that makes
 * certification mandatory for the block). `buildBlock()` expands a block into
 * full `standards` rows: flags pick the scheme/QCO pair, keywords are derived
 * from the title when not supplied, and clause groups come from per-category
 * templates unless a row carries explicit sections.
 * ---------------------------------------------------------------------- */
import type { StandardSection } from "@/db/schema";

export type Category =
  | "construction"
  | "electrical"
  | "electronics"
  | "hallmark"
  | "food"
  | "plastics"
  | "mechanical"
  | "consumer"
  | "chemicals"
  | "services";

export type SeedStandard = {
  code: string;
  title: string;
  category: string;
  status: string;
  mandatory: boolean;
  scheme: string;
  qco: string | null;
  summary: string;
  keywords: string[];
  sections: StandardSection[];
  related: string[];
  editions: number;
};

/** V voluntary · M mandatory (block QCO) · C CRS registration · S Scheme-IV CoC
 *  · H hallmarking · Q:<order> mandatory under a specific Quality Control Order */
export type Flag = "V" | "M" | "C" | "S" | "H" | `Q:${string}`;

/** A row of the `labs` table (testing lab, BIS lab or AHC). */
export type SeedLab = {
  name: string;
  city: string;
  state: string;
  kind: string;
  capabilities: string[];
  standards: string[];
  phone: string | null;
  email: string | null;
};

export type StdExtras = {
  keywords?: string[];
  sections?: [clause: string, title: string, summary: string][];
  related?: string[];
  editions?: number;
  scheme?: string;
};

export type StdRow = [
  code: string,
  title: string,
  summary: string,
  flag?: Flag,
  extras?: StdExtras,
];

export type Block = {
  category: Category;
  /** Quality Control Order applied to rows flagged "M" in this block */
  qco?: string;
  /** scheme applied to mandatory rows (default: ISI Mark (Scheme-I)) */
  scheme?: string;
  /** scheme applied to voluntary rows (default: Specification (voluntary)) */
  voluntaryScheme?: string;
  rows: StdRow[];
};

/* ----------------------------- section templates ----------------------------- */

const T: Record<Category, [string, string, string][]> = {
  construction: [
    ["4", "Materials & workmanship", "Materials, mixing, placing and workmanship requirements."],
    ["6", "Design & dimensional requirements", "Design basis, dimensions and tolerances for the finished work."],
    ["8", "Testing & acceptance", "Sampling, test methods and acceptance criteria for conformity."],
  ],
  electrical: [
    ["6", "Construction & ratings", "Constructional features, rating classes and marking of the equipment."],
    ["8", "Performance requirements", "Temperature rise, dielectric, breaking capacity and endurance limits."],
    ["10", "Type & routine tests", "Type tests, routine tests and sampling plan for conformity."],
  ],
  electronics: [
    ["5", "Electrical safety requirements", "Protection against electric shock, energy hazards, fire and thermal injury."],
    ["7", "Performance & EMC", "Functional performance, immunity and emission limits for the equipment."],
    ["9", "Tests & marking", "Type test schedule, marking and declaration requirements for registration."],
  ],
  hallmark: [
    ["4", "Fineness grades", "Permitted purity grades and the marking symbols that represent them."],
    ["6", "Assaying methods", "Fire assay, XRF and touchstone procedures used to establish fineness."],
    ["8", "Marking & HUID", "Hallmark components, HUID assignment and marking obligations."],
  ],
  food: [
    ["5", "Quality characteristics", "Composition, organoleptic and physico-chemical requirements of the product."],
    ["7", "Hygiene, contaminants & additives", "Hygienic practice, permitted additives and contaminant limits."],
    ["9", "Sampling & labelling", "Sampling plan, test methods and labelling/packaging requirements."],
  ],
  plastics: [
    ["5", "Material requirements", "Resin/compound composition, additives and base-material requirements."],
    ["7", "Dimensions & performance", "Dimensions, tolerances and mechanical/thermal performance limits."],
    ["9", "Tests & marking", "Test methods, sampling and marking of the finished product."],
  ],
  mechanical: [
    ["5", "Material & manufacture", "Chemical composition, grade designation and manufacturing route."],
    ["7", "Mechanical properties", "Tensile, impact, hardness and other property limits for the grade."],
    ["9", "Tests & marking", "Sampling, test methods and product marking/handling requirements."],
  ],
  consumer: [
    ["4", "Materials & construction", "Permitted materials, construction details and safety of the product."],
    ["6", "Performance requirements", "Durability, strength and functional performance limits."],
    ["8", "Tests & marking", "Sampling, test methods, marking and declaration requirements."],
  ],
  chemicals: [
    ["4", "Composition & purity", "Assay, impurity limits and reference to the grade designation."],
    ["6", "Physical & chemical properties", "Density, solubility, pH and other property requirements for the grade."],
    ["8", "Sampling, tests & marking", "Sampling plan, analytical test methods and packing/marking requirements."],
  ],
  services: [
    ["4", "Context & scope", "Organisational context, scope of the system and interested-party requirements."],
    ["6", "System requirements", "Documented processes, controls, performance evaluation and improvement."],
    ["8", "Conformity assessment", "Audit, certification and surveillance arrangements for the system."],
  ],
};

const categorySection = (c: Category): StandardSection[] =>
  T[c].map(([clause, title, summary]) => ({ clause, title, summary }));

/* ------------------------------- keywords ------------------------------- */

const STOP = new Set([
  "and", "the", "for", "with", "from", "into", "under", "part", "parts", "code",
  "practice", "specification", "specifications", "requirements", "requirement",
  "methods", "method", "test", "testing", "tests", "general", "indian", "standard",
  "standards", "guide", "guidelines", "their", "other", "used", "using", "use",
  "made", "shall", "that", "this", "which", "are", "its", "all", "any", "not",
  "grading", "grades", "class", "classes", "type", "types", "including", "covers",
]);

const titleWords = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !STOP.has(w));

/** Provided keywords first, then distinctive title words — deduplicated. */
function deriveKeywords(title: string, summary: string, category: Category, extra: string[] = []) {
  const words = [...extra, ...titleWords(title), ...titleWords(summary)];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const w of words) {
    const k = w.trim().toLowerCase();
    if (k.length < 3 || seen.has(k)) continue;
    seen.add(k);
    out.push(k);
    if (out.length === 8) break;
  }
  for (const filler of [category, "bis", "certification"]) {
    if (out.length >= 4) break;
    if (!seen.has(filler)) {
      seen.add(filler);
      out.push(filler);
    }
  }
  return out;
}

/* ------------------------------- expansion ------------------------------- */

const BASE_SCHEME = "ISI Mark (Scheme-I)";

function flagToMeta(flag: Flag | undefined, block: Block) {
  const scheme = block.scheme ?? BASE_SCHEME;
  switch (flag) {
    case "M":
      return { mandatory: true, scheme, qco: block.qco ?? null };
    case "C":
      return {
        mandatory: true,
        scheme: "Compulsory Registration Scheme (CRS)",
        qco: "Electronics & IT Goods (CRS) Order, 2012",
      };
    case "S":
      return {
        mandatory: true,
        scheme: "Scheme-IV — Certificate of Conformity",
        qco: block.qco ?? null,
      };
    case "H":
      return {
        mandatory: true,
        scheme: "BIS Hallmarking Scheme",
        qco: "Hallmarking of Gold Jewellery (mandatory in notified districts)",
      };
    case "V":
    case undefined:
      return {
        mandatory: false,
        scheme: block.voluntaryScheme ?? "Specification (voluntary)",
        qco: null,
      };
    default: {
      // "Q:<order>"
      const order = String(flag).slice(2).trim();
      return { mandatory: true, scheme, qco: order || (block.qco ?? null) };
    }
  }
}

/** Expands one authored block into full `standards` rows. */
export function buildBlock(block: Block): SeedStandard[] {
  return block.rows.map(([code, title, summary, flag, extras = {}]) => {
    const meta = flagToMeta(flag, block);
    return {
      code,
      title,
      category: block.category,
      status: "current",
      mandatory: extras.scheme ? true : meta.mandatory,
      scheme: extras.scheme ?? meta.scheme,
      qco: meta.qco,
      summary,
      keywords: deriveKeywords(title, summary, block.category, extras.keywords),
      sections: extras.sections
        ? extras.sections.map(([clause, t, s]) => ({ clause, title: t, summary: s }))
        : categorySection(block.category),
      related: extras.related ?? [],
      editions: extras.editions ?? 1,
    };
  });
}

export const buildBlocks = (...blocks: Block[]): SeedStandard[] =>
  blocks.flatMap((b) => buildBlock(b));
