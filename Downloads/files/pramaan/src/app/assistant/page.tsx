import { Suspense } from "react";
import { Nav } from "@/components/Chrome";
import { ChatClient } from "@/components/ChatClient";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Assistant",
  description:
    "Ask about Indian Standards, certification schemes, testing laboratories and hallmarking. Every answer lists its sources and separates catalogue records from model-written summaries.",
};

const GREETINGS = new Set(["hello", "hi", "hey", "नमस्ते", "namaste"]);

export default async function AssistantPage() {
  let recent: string[] = [];
  try {
    const rows = await db
      .select({ content: chatMessages.content })
      .from(chatMessages)
      .where(eq(chatMessages.role, "user"))
      .orderBy(desc(chatMessages.createdAt))
      .limit(20);
    /* distinct, and without the bare greetings older sessions sent automatically */
    recent = [...new Set(rows.map((r) => r.content.trim()))]
      .filter((c) => !GREETINGS.has(c.toLowerCase()))
      .slice(0, 5);
  } catch {
    /* the assistant still works without the recent list */
  }

  return (
    <>
      <Nav />
      <main id="main" className="pt-8 sm:pt-12">
        <Suspense>
          <ChatClient recent={recent} />
        </Suspense>
      </main>
    </>
  );
}
