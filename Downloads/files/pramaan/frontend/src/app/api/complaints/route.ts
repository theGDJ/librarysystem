import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { complaints } from "@/db/schema";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = (body.name ?? "").toString().trim();
    const email = (body.email ?? "").toString().trim();
    const category = (body.category ?? "other").toString();
    const product = (body.product ?? "").toString().trim();
    const description = (body.description ?? "").toString().trim();

    if (!name || !email.includes("@") || !product || description.length < 20) {
      return NextResponse.json(
        { error: "Please complete all fields (description ≥ 20 characters)." },
        { status: 400 },
      );
    }

    const ticket = `BISC-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const [row] = await db
      .insert(complaints)
      .values({ ticket, name, email, category, product, description })
      .returning();

    return NextResponse.json({ ok: true, ticket: row.ticket });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Could not register complaint" }, { status: 500 });
  }
}
