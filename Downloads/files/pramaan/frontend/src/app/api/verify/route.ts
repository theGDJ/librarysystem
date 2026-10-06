import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { licences } from "@/db/schema";
import { ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const number: string = (body.number ?? "").toString().trim().toUpperCase();

  if (!number || number.length < 4) {
    return NextResponse.json({ found: false });
  }

  const rows = await db
    .select()
    .from(licences)
    .where(ilike(licences.markNo, `%${number}%`))
    .limit(3);

  if (!rows.length) {
    return NextResponse.json({ found: false, number });
  }
  return NextResponse.json({ found: true, results: rows });
}
