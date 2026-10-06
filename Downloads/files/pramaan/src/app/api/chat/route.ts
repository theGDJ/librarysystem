import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { chatMessages, chatSessions } from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { answer } from "@/lib/assistant/engine";
import type { Locale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = (body.message ?? "").toString().trim();
    let sessionId: string | undefined = body.sessionId;
    const locale: Locale = body.locale === "hi" ? "hi" : "en";

    if (!message || message.length > 2000) {
      return NextResponse.json({ error: "Invalid message" }, { status: 400 });
    }

    if (!sessionId) {
      const [s] = await db.insert(chatSessions).values({ locale }).returning();
      sessionId = s.id;
    }

    await db.insert(chatMessages).values({
      sessionId,
      role: "user",
      content: message,
    });

    const result = await answer(message, locale);

    await db.insert(chatMessages).values({
      sessionId,
      role: "assistant",
      content: result.text,
      intent: result.intent,
      citations: result.citations,
    });

    return NextResponse.json({ sessionId, ...result });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Assistant failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("sessionId");
  if (!sessionId) return NextResponse.json({ messages: [] });
  const messages = await db
    .select()
    .from(chatMessages)
    .where(eq(chatMessages.sessionId, sessionId))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);
  return NextResponse.json({ messages: messages.reverse() });
}
