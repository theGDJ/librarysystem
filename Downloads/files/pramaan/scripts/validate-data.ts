/* Data-integrity validation for the seeded knowledge base. Run with:
     DATABASE_URL=postgres://x/y npx tsx scripts/validate-data.ts   */
import {
  STD,
  STD_MORE,
  STD_WAVE3,
  DOCS,
  DOCS_MORE,
  DOCS_WAVE3,
  LABS,
  LABS_MORE,
  LABS_WAVE3,
  LICENCES,
  LICENCES_MORE,
  LICENCES_WAVE3,
  COMPLAINTS,
} from "../src/db/seed";
import { STD_WAVE4 } from "../src/db/seed-waves";
import { STD_WAVE5 } from "../src/db/seed-waves-5";
import { STD_WAVE6 } from "../src/db/seed-waves-6";
import { STD_WAVE7 } from "../src/db/seed-waves-7";
import { STD_WAVE8 } from "../src/db/seed-waves-8";
import { STD_WAVE9 } from "../src/db/seed-waves-9";
import { STD_WAVE10 } from "../src/db/seed-waves-10";
import { STD_WAVE11 } from "../src/db/seed-waves-11";
import { STD_WAVE12 } from "../src/db/seed-waves-12";
import { STD_WAVE13 } from "../src/db/seed-waves-13";
import { STD_WAVE14 } from "../src/db/seed-waves-14";
import { STD_WAVE15 } from "../src/db/seed-waves-15";
import { STD_WAVE16 } from "../src/db/seed-waves-16";
import { LABS_NETWORK_UNIQUE } from "../src/db/seed";
import { PRODUCTS, matchProducts } from "../src/lib/assistant/products";
import { MARK_PATTERNS } from "../src/lib/verify/extract";
import {
  complaints as complaintsTable,
  knowledgeDocs as docsTable,
  labs as labsTable,
  licences as licencesTable,
  standards as standardsTable,
} from "../src/db/schema";

/* ---- records must match the Drizzle table columns (no missing/extra) ---- */
const columnsOf = (t: unknown) => {
  const table = t as Record<string, { name?: string } | undefined>;
  return new Set(Object.keys(table).filter((k) => typeof table[k]?.name === "string"));
};

/* columns the database fills in itself */
const AUTO = ["id", "enableRLS"];

const checkShape = (
  label: string,
  rows: Record<string, unknown>[],
  table: unknown,
  optional: string[] = [],
) => {
  const cols = columnsOf(table);
  for (const [i, r] of rows.entries()) {
    for (const k of Object.keys(r))
      if (!cols.has(k)) problems.push(`${label}[${i}]: unknown column "${k}"`);
    for (const c of cols)
      if (!optional.includes(c) && !AUTO.includes(c) && !(c in r))
        problems.push(`${label}[${i}]: missing column "${c}"`);
  }
};


const allStandards = [
  ...STD,
  ...STD_MORE,
  ...STD_WAVE3,
  ...STD_WAVE4,
  ...STD_WAVE5,
  ...STD_WAVE6,
  ...STD_WAVE7,
  ...STD_WAVE8,
  ...STD_WAVE9,
  ...STD_WAVE10,
  ...STD_WAVE11,
  ...STD_WAVE12,
  ...STD_WAVE13,
  ...STD_WAVE14,
  ...STD_WAVE15,
  ...STD_WAVE16,
];
const allDocs = [...DOCS, ...DOCS_MORE, ...DOCS_WAVE3];
const allLabs = [...LABS, ...LABS_MORE, ...LABS_WAVE3, ...LABS_NETWORK_UNIQUE];
const allLicences = [...LICENCES, ...LICENCES_MORE, ...LICENCES_WAVE3];

const problems: string[] = [];
const dup = (xs: string[]) => {
  const seen = new Set<string>();
  for (const x of xs) {
    if (seen.has(x)) problems.push(`duplicate: ${x}`);
    seen.add(x);
  }
};

/* ---- uniqueness ---- */
dup(allStandards.map((s) => s.code));
dup(allDocs.map((d) => d.slug));
dup(allLabs.map((l) => l.name));
dup(allLicences.map((l) => l.markNo));
dup(PRODUCTS.map((p) => p.id));

/* ---- standards ---- */
const CATS = new Set([
  "construction", "electrical", "electronics", "hallmark",
  "food", "plastics", "mechanical", "consumer",
  "chemicals", "services",
]);
const stdCodes = new Set(allStandards.map((s) => s.code));
for (const s of allStandards) {
  if (!CATS.has(s.category)) problems.push(`${s.code}: unknown category "${s.category}"`);
  for (const f of ["code", "title", "summary", "scheme", "status"] as const)
    if (!s[f] || String(s[f]).trim().length === 0) problems.push(`${s.code}: empty ${f}`);
  if (!Array.isArray(s.keywords) || s.keywords.length < 3)
    problems.push(`${s.code}: fewer than 3 keywords`);
  if (!Array.isArray(s.sections) || s.sections.length === 0)
    problems.push(`${s.code}: no sections`);
  for (const sec of s.sections ?? [])
    if (!sec.clause || !sec.title || !sec.summary) problems.push(`${s.code}: incomplete section`);
  for (const r of s.related ?? [])
    if (!stdCodes.has(r)) problems.push(`${s.code}: related code "${r}" not in catalogue`);
}

/* ---- docs ---- */
const DOC_KINDS = new Set([
  "scheme", "process", "faq", "consumer", "concept", "fees", "hallmark", "labs",
]);
for (const d of allDocs) {
  if (!DOC_KINDS.has(d.kind)) problems.push(`doc ${d.slug}: unknown kind "${d.kind}"`);
  if (!d.bodyHi || d.bodyHi.trim().length < 20) problems.push(`doc ${d.slug}: missing Hindi body`);
  if (!d.keywords.length) problems.push(`doc ${d.slug}: no keywords`);
}

/* ---- labs ---- */
const CAPS = new Set([
  "electrical", "electronics", "construction", "mechanical",
  "plastics", "food", "consumer", "hallmark", "chemicals",
]);
const LAB_KINDS = new Set(["BIS Laboratory", "Recognized Laboratory", "AHC"]);
for (const l of allLabs) {
  if (!LAB_KINDS.has(l.kind)) problems.push(`lab ${l.name}: unknown kind "${l.kind}"`);
  if (!l.capabilities.length) problems.push(`lab ${l.name}: no capabilities`);
  for (const c of l.capabilities) if (!CAPS.has(c)) problems.push(`lab ${l.name}: bad capability ${c}`);
  for (const c of l.standards ?? [])
    if (!stdCodes.has(c)) problems.push(`lab ${l.name}: unknown standard ${c}`);
}

/* ---- licences ---- */
for (const l of allLicences) {
  const ok = MARK_PATTERNS[l.type as keyof typeof MARK_PATTERNS]?.test(l.markNo) ?? false;
  if (!ok) problems.push(`licence ${l.markNo}: number does not match type "${l.type}"`);
  if (!l.standardCode || !stdCodes.has(l.standardCode))
    problems.push(`licence ${l.markNo}: standard ${l.standardCode} not in catalogue`);
  if (l.issuedOn >= l.validTill && l.validTill !== "9999-12-31")
    problems.push(`licence ${l.markNo}: issuedOn >= validTill`);
}

/* ---- complaints ---- */
for (const c of COMPLAINTS) {
  if (!/^BISC-\d{4}-\d{6}$/.test(c.ticket)) problems.push(`complaint ${c.ticket}: bad ticket`);
  if (!c.email.includes("@")) problems.push(`complaint ${c.ticket}: bad email`);
  if (c.description.length < 20) problems.push(`complaint ${c.ticket}: short description`);
}

/* ---- product profiles ---- */
for (const p of PRODUCTS) {
  if (!CATS.has(p.category)) problems.push(`product ${p.id}: unknown category ${p.category}`);
  if (!p.aliases.length) problems.push(`product ${p.id}: no aliases`);
  for (const c of p.standards)
    if (!stdCodes.has(c)) problems.push(`product ${p.id}: standard ${c} not in catalogue`);
  if (p.note.en.length < 40 || p.note.hi.length < 20)
    problems.push(`product ${p.id}: thin note`);
}

/* ---- retrieval smoke test ---- */
const QUERIES = [
  "Which standard applies to cement?",
  "TMT saria ka standard",
  "washing machine standard",
  "refrigerator QCO",
  "mixer grinder ISI",
  "mobile phone BIS registration",
  "geyser",
  "microwave oven",
  "LED panel light",
  "air conditioner star rating",
  "vacuum cleaner",
  "block board",
  "marine ply",
  "water heater",
  "helmet",
  "gold bangle",
];
const misses = QUERIES.filter((q) => matchProducts(q).length === 0);
if (misses.length) problems.push(`product match missed: ${misses.join(" | ")}`);

checkShape("standards", allStandards as unknown as Record<string, unknown>[], standardsTable, []);
checkShape("docs", allDocs as unknown as Record<string, unknown>[], docsTable, ["bodyHi"]);
checkShape("labs", allLabs as unknown as Record<string, unknown>[], labsTable, ["phone", "email"]);
checkShape("licences", allLicences as unknown as Record<string, unknown>[], licencesTable, ["standardCode"]);
checkShape("complaints", COMPLAINTS as unknown as Record<string, unknown>[], complaintsTable, []);
/* ---- report ---- */
console.log(
  `catalogue: ${allStandards.length} standards · ${allDocs.length} docs · ${allLabs.length} labs · ` +
    `${allLicences.length} licences · ${COMPLAINTS.length} sample complaints · ${PRODUCTS.length} products`,
);
const byCat = allStandards.reduce<Record<string, number>>((a, s) => {
  a[s.category] = (a[s.category] ?? 0) + 1;
  return a;
}, {});
console.log("standards by category:", byCat);
console.log(
  "labs by kind:",
  allLabs.reduce<Record<string, number>>((a, l) => {
    a[l.kind] = (a[l.kind] ?? 0) + 1;
    return a;
  }, {}),
);
console.log(
  "licences by type:",
  allLicences.reduce<Record<string, number>>((a, l) => {
    a[l.type] = (a[l.type] ?? 0) + 1;
    return a;
  }, {}),
);

if (problems.length) {
  console.error(`\n✗ ${problems.length} problem(s):`);
  for (const p of problems) console.error("  - " + p);
  process.exit(1);
}
console.log("\n✓ all integrity checks passed");
