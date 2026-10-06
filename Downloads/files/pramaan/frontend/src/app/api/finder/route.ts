import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { labs, standards } from "@/db/schema";
import { ilike, or } from "drizzle-orm";
import { matchProducts, SCHEME_LABEL } from "@/lib/assistant/products";

export const dynamic = "force-dynamic";

const PROCESS_STEPS: Record<string, { title: string; desc: string }[]> = {
  scheme1: [
    { title: "Confirm standard & QCO", desc: "Identify the applicable Indian Standard and whether certification is mandatory for your product line." },
    { title: "Set up QC & test facilities", desc: "Establish in-house testing or tie up with a BIS-recognized laboratory for routine tests." },
    { title: "Apply on BIS portal", desc: "File the application with plant documents, quality plan, test reports and application fee." },
    { title: "Factory audit", desc: "BIS officers audit manufacturing process, manpower and testing infrastructure." },
    { title: "Independent sample testing", desc: "Sealed samples are tested against every clause of the standard at BIS/recognized labs." },
    { title: "Licence + ISI marking", desc: "On conformity you receive a CM/L licence number and may apply the ISI Standard Mark." },
  ],
  scheme2: [
    { title: "Confirm CRS applicability", desc: "Check the notified electronics list and the applicable Indian Standard for your product." },
    { title: "Test at recognized lab", desc: "Get the product tested in a BIS-recognized laboratory (domestic or overseas for foreign brands)." },
    { title: "Online application", desc: "Register on the CRS portal with test report, brand declarations and fee." },
    { title: "Grant of registration", desc: "Receive an R-registration number; apply the Standard Mark with the R-number on product and packaging." },
  ],
  hallmark: [
    { title: "Jeweller registration", desc: "Register jewellery outlets with BIS — online, per outlet, minimal documentation." },
    { title: "Tie-up with AHC", desc: "Engage a BIS-recognized Assaying & Hallmarking Centre for fineness testing." },
    { title: "Assay + hallmark", desc: "Articles are assayed (fire assay/XRF) and laser-marked with Standard Mark + fineness + HUID." },
    { title: "Sell hallmarked stock", desc: "Only hallmarked articles (with HUID) may be sold in notified districts." },
  ],
  scheme4: [
    { title: "Scope the certificate", desc: "Define the lot/batch or production model and applicable standard." },
    { title: "Testing + inspection", desc: "Product is tested and production inspected against the standard." },
    { title: "Certificate of Conformity", desc: "CoC issued for the assessed scope with surveillance conditions." },
  ],
  voluntary: [
    { title: "Confirm the standard", desc: "Identify the applicable Indian Standard for your product." },
    { title: "Apply for certification", desc: "Voluntary Scheme-I application follows the same audit + testing route." },
    { title: "Licence + marking", desc: "Use the ISI mark to signal assured quality and win tenders/trust." },
  ],
};

export async function POST(req: NextRequest) {
  const body = await req.json();
  const query: string = (body.query ?? "").toString();
  const profiles = matchProducts(query);
  const primary = profiles[0] ?? null;

  if (!primary) {
    const tokens = query.toLowerCase().split(/\s+/).filter((w) => w.length > 2).slice(0, 4);
    const conds = tokens.flatMap((w) => [
      ilike(standards.title, `%${w}%`),
      ilike(standards.code, `%${w}%`),
    ]);
    const fallback = tokens.length
      ? await db.select().from(standards).where(or(...conds)).limit(6)
      : [];
    return NextResponse.json({ matched: false, profiles: [], standards: fallback, labs: [] });
  }

  const stdRows = await db.select().from(standards).where(
    or(...profiles.flatMap((p) => p.standards.map((c) => ilike(standards.code, `%${c.split(" ")[1]}%`)))),
  );

  const labRows = (await db.select().from(labs).limit(200))
    .filter((l) => (l.capabilities ?? []).includes(primary.category))
    .slice(0, 6);

  const results = profiles.map((p) => {
    return {
      profile: {
        id: p.id,
        label: p.label,
        labelHi: p.labelHi,
        category: p.category,
        mandatory: p.mandatory,
        scheme: p.scheme,
        schemeLabel: SCHEME_LABEL[p.scheme],
        standards: p.standards,
        note: p.note.en,
        noteHi: p.note.hi,
        steps: PROCESS_STEPS[p.scheme] ?? [],
        timeline:
          p.scheme === "scheme1"
            ? "≈ 30–90 days end-to-end"
            : p.scheme === "scheme2"
              ? "≈ 15–30 days after test report"
              : p.scheme === "hallmark"
                ? "Jeweller registration ~1 week; same-day hallmarking at AHC"
                : "Varies by assessment",
      },
      standards: stdRows.filter((s) => p.standards.some((c) => s.code.includes(c.split(" ")[1]))),
      labs: labRows,
    };
  });

  return NextResponse.json({ matched: true, results, labs: labRows });
}
