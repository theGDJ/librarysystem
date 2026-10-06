import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { labs } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const state = req.nextUrl.searchParams.get("state");
  const kind = req.nextUrl.searchParams.get("kind");
  const capability = req.nextUrl.searchParams.get("capability");

  const rows = await db.select().from(labs).orderBy(labs.state, labs.city).limit(200);
  const filtered = rows.filter((r) => {
    if (state && state !== "all" && r.state !== state) return false;
    if (kind && kind !== "all" && r.kind !== kind) return false;
    if (capability && capability !== "all" && !(r.capabilities ?? []).includes(capability))
      return false;
    return true;
  });

  const states = [...new Set(rows.map((r) => r.state))].sort();
  return NextResponse.json({ labs: filtered, states });
}
