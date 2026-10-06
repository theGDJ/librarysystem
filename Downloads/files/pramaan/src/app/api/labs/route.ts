import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { labs } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const kind = req.nextUrl.searchParams.get("kind");
  const capability = req.nextUrl.searchParams.get("capability");
  const q = (req.nextUrl.searchParams.get("q") ?? "").trim().toLowerCase();

  const rows = await db.select().from(labs).orderBy(labs.state, labs.city).limit(1000);
  const filtered = rows.filter((r) => {
    if (state && state !== "all" && r.state !== state) return false;
    if (kind && kind !== "all" && r.kind !== kind) return false;
    if (capability && capability !== "all" && !(r.capabilities ?? []).includes(capability))
      return false;
    if (q && !(r.name.toLowerCase().includes(q) || r.city.toLowerCase().includes(q) || r.state.toLowerCase().includes(q)))
      return false;
    return true;
  });

  const states = [...new Set(rows.map((r) => r.state))].sort();
  const byKind = rows.reduce<Record<string, number>>((a, r) => {
    a[r.kind] = (a[r.kind] ?? 0) + 1;
    return a;
  }, {});
  return NextResponse.json({ labs: filtered, states, total: rows.length, byKind });
}
