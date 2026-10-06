import { Nav, Footer, PageShell } from "@/components/Chrome";
import { db } from "@/db";
import { chatMessages, complaints, labs, licences, standards } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import {
  MessagesSquare,
  BookMarked,
  FlaskConical,
  BadgeCheck,
  Quote,
  AlertTriangle,
} from "lucide-react";

export const dynamic = "force-dynamic";

const INTENT_LABEL: Record<string, string> = {
  greeting: "Greetings",
  standard_lookup: "Standard lookups",
  find_standard: "Product → standard",
  scheme: "Scheme guidance",
  process: "Process help",
  hallmarking: "Hallmarking",
  labs: "Lab queries",
  consumer: "Consumer / verify",
  fees: "Fees & concessions",
  about: "About BIS",
  fallback: "Unmatched",
};

const CAT_COLORS: Record<string, string> = {
  construction: "#f2b23e",
  electrical: "#4ade9b",
  electronics: "#7aa2ff",
  hallmark: "#ffd27a",
  food: "#ff9c6b",
  plastics: "#c88fff",
  mechanical: "#6bd6ff",
  consumer: "#ff8fb0",
};

export default async function DashboardPage() {
  const [stdCount] = await db.select({ c: sql<number>`count(*)` }).from(standards);
  const [mandCount] = await db.select({ c: sql<number>`count(*)` }).from(standards).where(eq(standards.mandatory, true));
  const [labCount] = await db.select({ c: sql<number>`count(*)` }).from(labs);
  const [licCount] = await db.select({ c: sql<number>`count(*)` }).from(licences);
  const [qCount] = await db.select({ c: sql<number>`count(*)` }).from(chatMessages).where(eq(chatMessages.role, "assistant"));
  const [cmpCount] = await db.select({ c: sql<number>`count(*)` }).from(complaints);

  const intents = await db
    .select({ intent: chatMessages.intent, c: sql<number>`count(*)` })
    .from(chatMessages)
    .where(eq(chatMessages.role, "assistant"))
    .groupBy(chatMessages.intent);
  const intentRows = intents
    .map((r) => ({ intent: r.intent ?? "fallback", c: Number(r.c) }))
    .sort((a, b) => b.c - a.c);
  const intentMax = Math.max(1, ...intentRows.map((r) => r.c));

  const catRows = (
    await db.select({ cat: standards.category, c: sql<number>`count(*)` }).from(standards).groupBy(standards.category)
  ).map((r) => ({ cat: r.cat, c: Number(r.c) }));
  const catTotal = Math.max(1, catRows.reduce((a, r) => a + r.c, 0));

  // donut geometry (cumulative positions computed immutably)
  const donut = catRows.reduce<{ cat: string; c: number; start: number; end: number }[]>(
    (out, r) => {
      const start = out.length ? out[out.length - 1].end : 0;
      out.push({ ...r, start, end: start + r.c / catTotal });
      return out;
    },
    [],
  );
  const arc = (a0: number, a1: number) => {
    const R = 42;
    const cx = 50;
    const cy = 50;
    const large = a1 - a0 > 0.5 ? 1 : 0;
    const x0 = cx + R * Math.cos(2 * Math.PI * a0 - Math.PI / 2);
    const y0 = cy + R * Math.sin(2 * Math.PI * a0 - Math.PI / 2);
    const x1 = cx + R * Math.cos(2 * Math.PI * a1 - Math.PI / 2);
    const y1 = cy + R * Math.sin(2 * Math.PI * a1 - Math.PI / 2);
    return `M ${cx} ${cy} L ${x0} ${y0} A ${R} ${R} 0 ${large} 1 ${x1} ${y1} Z`;
  };

  const cited = await db
    .select({ citations: chatMessages.citations })
    .from(chatMessages)
    .where(eq(chatMessages.role, "assistant"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(300);
  const freq: Record<string, number> = {};
  for (const m of cited) {
    for (const c of (m.citations ?? []) as { kind: string; ref: string }[]) {
      if (c.kind === "standard") freq[c.ref] = (freq[c.ref] ?? 0) + 1;
    }
  }
  const topStandards = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, 6);
  const topMax = Math.max(1, ...topStandards.map(([, n]) => n));

  const recent = await db
    .select({ content: chatMessages.content, createdAt: chatMessages.createdAt })
    .from(chatMessages)
    .where(eq(chatMessages.role, "user"))
    .orderBy(desc(chatMessages.createdAt))
    .limit(8);

  const tiles = [
    { icon: MessagesSquare, n: Number(qCount.c), l: "assistant answers composed" },
    { icon: BookMarked, n: Number(stdCount.c), l: "standards indexed" },
    { icon: AlertTriangle, n: Number(mandCount.c), l: "under mandatory QCOs" },
    { icon: FlaskConical, n: Number(labCount.c), l: "labs & AHCs in network" },
    { icon: BadgeCheck, n: Number(licCount.c), l: "verifiable marks in registry" },
    { icon: AlertTriangle, n: Number(cmpCount.c), l: "consumer complaints logged" },
  ];

  return (
    <>
      <Nav />
      <PageShell
        kicker="LIVE TELEMETRY"
        title="Assistant Insights"
        sub="Real utilization analytics from the PostgreSQL-backed knowledge assistant — intent mix, citation leaders, catalogue coverage and the live query stream."
      >
        {/* tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {tiles.map((t) => (
            <div key={t.l} className="panel-flat card-hover p-5">
              <t.icon className="size-4.5 text-gold-400" strokeWidth={1.7} />
              <div className="font-display mt-3 text-3xl font-semibold text-white">{t.n}</div>
              <div className="mt-1 text-[11.5px] leading-snug text-ash-500">{t.l}</div>
            </div>
          ))}
        </div>

        <div className="mt-6 grid gap-5 lg:grid-cols-3">
          {/* intents */}
          <div className="panel p-6 lg:col-span-2">
            <div className="kicker mb-5 flex items-center gap-2">
              <MessagesSquare className="size-4" /> INTENT DISTRIBUTION
            </div>
            {intentRows.length === 0 && (
              <p className="text-sm text-ash-500">No conversations yet — ask the assistant something and return here.</p>
            )}
            <div className="space-y-3.5">
              {intentRows.map((r) => (
                <div key={r.intent}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="text-ash-300">{INTENT_LABEL[r.intent] ?? r.intent}</span>
                    <span className="mono text-ash-500">{r.c}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-line bg-ink-900">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-500 to-gold-300"
                      style={{ width: `${(r.c / intentMax) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* donut */}
          <div className="panel p-6">
            <div className="kicker mb-5">CATALOGUE COVERAGE</div>
            <div className="flex items-center gap-6">
              <svg viewBox="0 0 100 100" className="size-40 shrink-0 -rotate-90">
                {donut.map((d) => (
                  <path key={d.cat} d={arc(d.start, d.end - 0.008)} fill={CAT_COLORS[d.cat] ?? "#888"} opacity={0.9} />
                ))}
                <circle cx="50" cy="50" r="26" fill="#0a0f1b" />
              </svg>
              <div className="space-y-1.5">
                {donut.map((d) => (
                  <div key={d.cat} className="flex items-center gap-2 text-[12px] text-ash-300">
                    <span className="size-2.5 rounded-[3px]" style={{ background: CAT_COLORS[d.cat] ?? "#888" }} />
                    <span className="capitalize">{d.cat}</span>
                    <span className="mono text-ash-500">{d.c}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-2">
          {/* top standards */}
          <div className="panel p-6">
            <div className="kicker mb-5 flex items-center gap-2">
              <Quote className="size-4" /> MOST CITED STANDARDS
            </div>
            {topStandards.length === 0 && (
              <p className="text-sm text-ash-500">
                Citations appear as users ask standard-specific questions — the chat always shows its sources.
              </p>
            )}
            <div className="space-y-3.5">
              {topStandards.map(([code, n]) => (
                <div key={code}>
                  <div className="mb-1.5 flex items-center justify-between text-[12px]">
                    <span className="mono text-[12.5px] text-gold-200">{code}</span>
                    <span className="mono text-ash-500">{n}×</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full border border-line bg-ink-900">
                    <div className="h-full rounded-full bg-gradient-to-r from-jade-500 to-jade-300" style={{ width: `${(n / topMax) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* recent queries */}
          <div className="panel p-6">
            <div className="kicker mb-5">LIVE QUERY STREAM</div>
            {recent.length === 0 && <p className="text-sm text-ash-500">Nothing yet — the stream populates as users chat.</p>}
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-ink-900/60 px-3.5 py-2.5">
                  <span className="truncate text-[12.5px] text-ash-300">{r.content}</span>
                  <span className="mono shrink-0 text-[10px] text-ash-500">
                    {new Date(r.createdAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageShell>
      <Footer />
    </>
  );
}
