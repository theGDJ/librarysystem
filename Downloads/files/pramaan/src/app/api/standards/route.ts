import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { standards } from "@/db/schema";
import { and, eq, ilike, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  const category = req.nextUrl.searchParams.get("category");
  const mandatory = req.nextUrl.searchParams.get("mandatory");
  const code = req.nextUrl.searchParams.get("code");

  const conds = [];
  if (code) conds.push(ilike(standards.code, `%${code}%`));
  if (category && category !== "all") conds.push(eq(standards.category, category));
  if (mandatory === "true") conds.push(eq(standards.mandatory, true));
  if (q) {
    const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1).slice(0, 6);
    for (const w of tokens) {
      conds.push(
        or(
          ilike(standards.code, `%${w}%`),
          ilike(standards.title, `%${w}%`),
          ilike(standards.summary, `%${w}%`),
          ilike(standards.qco, `%${w}%`),
          sql`EXISTS (SELECT 1 FROM unnest(${standards.keywords}) k WHERE lower(k) LIKE ${"%" + w + "%"})`,
        )!,
      );
    }
  }

  const rows = await db
    .select()
    .from(standards)
    .where(conds.length ? and(...conds) : undefined)
    .limit(250);

  // Rank: code/title/keyword hits before incidental summary substring hits
  if (q) {
    const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
    const weight = (s: (typeof rows)[number]) => {
      let wgt = 0;
      const code = s.code.toLowerCase();
      const title = s.title.toLowerCase();
      const keys = (s.keywords ?? []).join(" ").toLowerCase();
      for (const w of tokens) {
        if (code.includes(w)) wgt += 8;
        if (title.includes(w)) wgt += 5;
        if (keys.includes(w)) wgt += 4;
        if ((s.qco ?? "").toLowerCase().includes(w)) wgt += 2;
        if (s.summary.toLowerCase().includes(w)) wgt += 1;
      }
      if (s.mandatory) wgt += 0.5;
      return wgt;
    };
    rows.sort((a, b) => weight(b) - weight(a));
  } else {
    rows.sort((a, b) => a.code.localeCompare(b.code));
  }

  return NextResponse.json({ standards: rows });
}
