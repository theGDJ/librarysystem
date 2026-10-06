import Link from "next/link";
import { Nav, Footer, PageShell } from "@/components/Chrome";
import { EmptyState } from "@/components/ui";
import { db } from "@/db";
import { chatMessages, complaints, labs, licences, standards } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { categoryLabel, formatCount, standardHref } from "@/lib/format";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Insights",
  description: "How the assistant is used: question types, most-cited standards, catalogue coverage and recent questions.",
};

const INTENT_LABEL: Record<string, string> = {
  greeting: "Greetings",
  standard_lookup: "Standard lookups",
  find_standard: "Product to standard",
  scheme: "Scheme guidance",
  process: "Process help",
  hallmarking: "Hallmarking",
  labs: "Laboratory questions",
  consumer: "Consumer and verification",
  fees: "Fees and concessions",
  about: "About BIS",
  general: "General",
  fallback: "Not matched",
};

function Bar({ label, value, max, href, mono = false }: { label: string; value: number; max: number; href?: string; mono?: boolean }) {
  const text = mono ? <span className="id">{label}</span> : label;
  return (
    <li className="grid grid-cols-[minmax(0,180px)_minmax(0,1fr)_48px] items-center gap-3 py-1.5 text-sm">
      <span className="truncate text-ink">
        {href ? (
          <Link href={href} className="hover:text-select-ink">
            {text}
          </Link>
        ) : (
          text
        )}
      </span>
      <span className="h-2 overflow-hidden rounded-xs bg-sunken" aria-hidden="true">
        <span className="block h-full bg-navy" style={{ width: `${Math.max(2, (value / max) * 100)}%` }} />
      </span>
      <span className="text-right tabular-nums text-muted">{formatCount(value)}</span>
    </li>
  );
}

export default async function DashboardPage() {
  const locale = await getLocale();
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

  const counts = [
    { n: Number(qCount.c), l: "Answers given" },
    { n: Number(stdCount.c), l: "Standards in catalogue" },
    { n: Number(mandCount.c), l: "Under a QCO" },
    { n: Number(labCount.c), l: "Laboratories and AHCs" },
    { n: Number(licCount.c), l: "Marks in demo registry" },
    { n: Number(cmpCount.c), l: "Complaints logged" },
  ];
  const catMax = Math.max(1, ...catRows.map((r) => r.c));

  return (
    <>
      <Nav />
      <PageShell
        title={tx(locale, "Insights")}
        description={tx(locale, "How the assistant is being used on this server: the kinds of questions asked, the standards cited most often, catalogue coverage and the latest questions.")}
      >
        <dl className="grid grid-cols-2 border-y border-rule sm:grid-cols-3 xl:grid-cols-6">
          {counts.map((c, i) => (
            <div key={c.l} className={`px-1 py-5 sm:px-4 ${i > 0 ? "xl:border-l xl:border-rule" : ""}`}>
              <dt className="text-sm text-muted">{tx(locale, c.l)}</dt>
              <dd className="mt-1 font-heading text-2xl font-bold tabular-nums tracking-[-0.02em] text-ink">
                {formatCount(c.n)}
              </dd>
            </div>
          ))}
        </dl>

        <div className="mt-14 grid gap-14 lg:grid-cols-2">
          <section aria-labelledby="intent-h">
            <h2 id="intent-h" className="text-lg font-semibold">{tx(locale, "Questions by type")}</h2>
            <p className="mt-1 text-sm text-muted">{tx(locale, "Classified from the wording of each question.")}</p>
            {intentRows.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={tx(locale, "No questions yet")}>{tx(locale, "Ask the assistant something and the breakdown appears here.")}</EmptyState>
              </div>
            ) : (
              <ul className="mt-4">
                {intentRows.map((r) => (
                  <Bar key={r.intent} label={tx(locale, INTENT_LABEL[r.intent] ?? r.intent)} value={r.c} max={intentMax} />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="cited-h">
            <h2 id="cited-h" className="text-lg font-semibold">{tx(locale, "Most cited standards")}</h2>
            <p className="mt-1 text-sm text-muted">{tx(locale, "Across the last 300 answers.")}</p>
            {topStandards.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={tx(locale, "No citations yet")}>{tx(locale, "Citations are counted as people ask about specific products and standards.")}</EmptyState>
              </div>
            ) : (
              <ul className="mt-4">
                {topStandards.map(([code, n]) => (
                  <Bar key={code} label={code} value={n} max={topMax} href={standardHref(code)} mono />
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="cat-h">
            <h2 id="cat-h" className="text-lg font-semibold">{tx(locale, "Catalogue coverage")}</h2>
            <p className="mt-1 text-sm text-muted">{tx(locale, "Standards per category")}, {formatCount(catTotal)}.</p>
            <ul className="mt-4">
              {[...catRows]
                .sort((a, b) => b.c - a.c)
                .map((r) => (
                  <Bar key={r.cat} label={tx(locale, categoryLabel(r.cat))} value={r.c} max={catMax} href={`/standards?category=${r.cat}`} />
                ))}
            </ul>
          </section>

          <section aria-labelledby="recent-h">
            <h2 id="recent-h" className="text-lg font-semibold">{tx(locale, "Latest questions")}</h2>
            <p className="mt-1 text-sm text-muted">{tx(locale, "Most recent first.")}</p>
            {recent.length === 0 ? (
              <div className="mt-4">
                <EmptyState title={tx(locale, "Nothing asked yet")} />
              </div>
            ) : (
              <ul className="mt-4 divide-y divide-rule border-y border-rule">
                {recent.map((r, i) => (
                  <li key={i} className="flex items-baseline justify-between gap-4 py-2.5">
                    <span className="min-w-0 truncate text-sm text-ink" title={r.content}>{r.content}</span>
                    <time dateTime={new Date(r.createdAt).toISOString()} className="shrink-0 text-xs tabular-nums text-muted">
                      {new Date(r.createdAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </time>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </PageShell>
      <Footer />
    </>
  );
}
