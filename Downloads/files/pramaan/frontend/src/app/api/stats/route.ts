import { NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, complaints, labs, licences, standards as stdTable } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  const [stdCount] = await db.select({ c: sql<number>`count(*)` }).from(stdTable);
  const [mandCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(stdTable)
    .where(eq(stdTable.mandatory, true));
  const [labCount] = await db.select({ c: sql<number>`count(*)` }).from(labs);
  const [licCount] = await db.select({ c: sql<number>`count(*)` }).from(licences);
  const [msgCount] = await db
    .select({ c: sql<number>`count(*)` })
    .from(chatMessages)
    .where(eq(chatMessages.role, "assistant"));
  const [complaintCount] = await db.select({ c: sql<number>`count(*)` }).from(complaints);

  const intents = await db
    .select({ intent: chatMessages.intent, c: sql<number>`count(*)` })
    .from(chatMessages)
    .where(eq(chatMessages.role, "assistant"))
    .groupBy(chatMessages.intent);

  const catRows = await db
    .select({ cat: stdTable.category, c: sql<number>`count(*)` })
    .from(stdTable)
    .groupBy(stdTable.category);

  const cited = await db
    .select({ citations: chatMessages.citations })
    .from(chatMessages)
    .where(eq(chatMessages.role, "assistant"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(200);
  const freq: Record<string, number> = {};
  for (const m of cited) {
    for (const c of (m.citations ?? []) as { kind: string; ref: string }[]) {
      if (c.kind === "standard") freq[c.ref] = (freq[c.ref] ?? 0) + 1;
    }
  }
  const topStandards = Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([code, count]) => ({ code, count }));

  const recent = await db
    .select({ content: chatMessages.content, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(eq(chatMessages.role, "user"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(7);

  return NextResponse.json({
    totals: {
      standards: Number(stdCount.c),
      mandatory: Number(mandCount.c),
      labs: Number(labCount.c),
      licences: Number(licCount.c),
      queries: Number(msgCount.c),
      complaints: Number(complaintCount.c),
    },
    intents,
    categories: catRows,
    topStandards,
    recentQueries: recent,
  });
}
