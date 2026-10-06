import { Suspense } from "react";
import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";
import { ChatClient } from "@/components/ChatClient";
import { Reveal } from "@/components/motion";
import { db } from "@/db";
import { chatMessages } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import {
  Wand2,
  BookMarked,
  Gem,
  FlaskConical,
  ArrowUpRight,
  History,
} from "lucide-react";

export const dynamic = "force-dynamic";

const QUICK = [
  { icon: Wand2, label: "Which standard applies to PVC cables?", href: "/assistant?q=Which standard applies to PVC cables?" },
  { icon: BookMarked, label: "Explain IS 456:2000 key clauses", href: "/assistant?q=Explain IS 456:2000" },
  { icon: Gem, label: "How do I verify a gold hallmark?", href: "/assistant?q=How do I verify a gold hallmark?" },
  { icon: FlaskConical, label: "Where can I test a pressure cooker?", href: "/assistant?q=Which labs test pressure cookers?" },
];

export default async function AssistantPage() {
  const recent = await db
    .select({ content: chatMessages.content })
    .from(chatMessages)
    .where(eq(chatMessages.role, "user"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(5);

  return (
    <>
      <Nav />
      <main className="relative min-h-screen pb-10 pt-32">
        <div className="blueprint pointer-events-none fixed inset-0 opacity-60" />
        <div className="glow-gold pointer-events-none fixed -top-40 left-1/3 h-[420px] w-[760px] -translate-x-1/2 opacity-50" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
            {/* sidebar */}
            <div className="space-y-4 max-lg:hidden">
              <Reveal>
                <div className="panel p-5">
                  <div className="kicker mb-4">TRY ASKING</div>
                  <div className="space-y-2.5">
                    {QUICK.map((q) => (
                      <Link
                        key={q.label}
                        href={q.href}
                        className="card-hover group flex items-start gap-3 rounded-xl border border-line bg-ink-850/70 p-3 text-[13px] leading-snug text-ash-300"
                      >
                        <q.icon className="mt-0.5 size-4 shrink-0 text-gold-400" strokeWidth={1.7} />
                        {q.label}
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal i={1}>
                <div className="panel p-5">
                  <div className="mono mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[0.24em] text-ash-500">
                    <History className="size-3.5" /> Recent queries
                  </div>
                  <div className="space-y-2">
                    {recent.length === 0 && (
                      <p className="text-[12px] text-ash-500">No queries yet — yours will appear here.</p>
                    )}
                    {recent.map((r, i) => (
                      <Link
                        key={i}
                        href={`/assistant?q=${encodeURIComponent(r.content)}`}
                        className="group flex items-center justify-between gap-2 truncate rounded-lg border border-transparent px-2 py-1.5 text-[12px] text-ash-400 hover:border-line hover:text-gold-200"
                      >
                        <span className="truncate">{r.content}</span>
                        <ArrowUpRight className="size-3 shrink-0 opacity-0 transition-opacity group-hover:opacity-100" />
                      </Link>
                    ))}
                  </div>
                </div>
              </Reveal>
              <Reveal i={2}>
                <div className="panel-flat p-5 text-[12px] leading-relaxed text-ash-500">
                  Answers are composed by a retrieval engine over the seeded BIS knowledge base —
                  standards, schemes, processes, fees and labs — and each response cites its sources.
                  Script detection auto-switches English ↔ हिन्दी.
                </div>
              </Reveal>
            </div>

            {/* chat */}
            <Reveal i={1} className="panel overflow-hidden p-4 sm:p-6">
              <Suspense>
                <ChatClient />
              </Suspense>
            </Reveal>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
