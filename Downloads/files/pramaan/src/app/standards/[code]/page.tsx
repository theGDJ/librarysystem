import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { and, eq, inArray, ne, sql } from "drizzle-orm";
import { ArrowRight, MessageSquareText } from "lucide-react";
import { Nav, Footer } from "@/components/Chrome";
import { ObligationTag, StandardCode, TierLabel } from "@/components/ui";
import { db } from "@/db";
import { labs, standards } from "@/db/schema";
import { SCHEMES } from "@/app/certification/data";
import { categoryLabel, certificationIdForScheme, codeFromParam, formatCount, standardHref } from "@/lib/format";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ code: string }> };

async function getStandard(param: string) {
  const code = codeFromParam(param);
  const [row] = await db.select().from(standards).where(eq(standards.code, code)).limit(1);
  return row ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const s = await getStandard((await params).code);
  if (!s) return { title: "Standard not found" };
  return { title: `${s.code} — ${s.title}`, description: s.summary.slice(0, 160) };
}

const SECTIONS = [
  { id: "scope", label: "Scope" },
  { id: "obligation", label: "Obligation" },
  { id: "clauses", label: "Key clauses" },
  { id: "related", label: "Related standards" },
  { id: "testing", label: "Testing" },
  { id: "route", label: "Certification route" },
];

export default async function StandardPage({ params }: Props) {
  const locale = await getLocale();
  const s = await getStandard((await params).code);
  if (!s) notFound();

  const [related, labRows, [labCount], sameQco] = await Promise.all([
    s.related.length
      ? db
          .select({ code: standards.code, title: standards.title, mandatory: standards.mandatory })
          .from(standards)
          .where(inArray(standards.code, s.related))
      : Promise.resolve([]),
    db
      .select()
      .from(labs)
      .where(sql`${s.category} = ANY(${labs.capabilities})`)
      .orderBy(sql`case ${labs.kind} when 'BIS Laboratory' then 0 when 'Recognized Laboratory' then 1 else 2 end`, labs.state)
      .limit(6),
    db
      .select({ c: sql<number>`count(*)::int` })
      .from(labs)
      .where(sql`${s.category} = ANY(${labs.capabilities})`),
    s.qco
      ? db
          .select({ code: standards.code, title: standards.title })
          .from(standards)
          .where(and(eq(standards.qco, s.qco), ne(standards.code, s.code)))
          .orderBy(standards.code)
          .limit(8)
      : Promise.resolve([]),
  ]);

  const unresolved = s.related.filter((r) => !related.some((x) => x.code === r));
  const certId = certificationIdForScheme(s.scheme);
  const route = certId ? SCHEMES.find((x) => x.id === certId) : null;
  const totalLabs = Number(labCount?.c ?? 0);

  return (
    <>
      <Nav />
      <main id="main">
        {/* ------------------------------------------------ identification */}
        <header className="border-b border-rule">
          <div className="mx-auto max-w-[1240px] px-5 pb-10 pt-8 sm:px-8 sm:pt-10">
            <nav aria-label="Breadcrumb" className="text-sm text-muted">
              <Link href="/standards" className="hover:text-ink">
                {tx(locale, "Standards")}
              </Link>
              <span aria-hidden="true" className="mx-2">
                /
              </span>
              <Link href={`/standards?category=${s.category}`} className="hover:text-ink">
                {categoryLabel(s.category)}
              </Link>
            </nav>
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <span className="id text-xl text-ink sm:text-[1.6rem]">{s.code}</span>
              <ObligationTag mandatory={s.mandatory} long />
            </div>
            <h1 className="mt-3 max-w-[30ch] text-2xl font-bold leading-tight tracking-[-0.025em] sm:text-[2.25rem] sm:leading-[2.7rem]">
              {s.title}
            </h1>
          </div>
        </header>

        <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pt-10 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px] lg:gap-16">
          {/* ------------------------------------------------- reference */}
          <article className="min-w-0 max-w-[720px] space-y-12">
            <section id="scope" aria-labelledby="scope-h">
              <h2 id="scope-h" className="text-lg font-semibold">
                {tx(locale, "Scope")}
              </h2>
              <div className="ev ev-record mt-3">
                <p className="reading">{s.summary}</p>
              </div>
            </section>

            <section id="obligation" aria-labelledby="obl-h">
              <h2 id="obl-h" className="text-lg font-semibold">
                {tx(locale, "Obligation")}
              </h2>
              {s.mandatory ? (
                <div className="mt-3 rounded-md border-l-2 border-attention bg-attention-soft px-5 py-4">
                  <p className="font-semibold text-ink">{tx(locale, "Certification is compulsory.")}</p>
                  <p className="mt-1 text-base text-body">
                    {s.qco
                      ? `${s.qco} names this standard. Under a QCO, covered products generally cannot be manufactured, imported, sold or stored for sale without the Standard Mark under a valid BIS licence or registration.`
                      : "A Quality Control Order covers this standard. Products it covers need the Standard Mark under a valid BIS licence."}
                  </p>
                </div>
              ) : (
                <p className="mt-3 text-base text-body">
                  No Quality Control Order in the catalogue makes this standard compulsory. Manufacturers can still seek
                  voluntary certification, and buyers and tenders often ask for it.
                </p>
              )}
              {sameQco.length > 0 && (
                <div className="mt-5">
                  <h3 className="text-sm font-semibold">{tx(locale, "Other standards under the same order")}</h3>
                  <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
                    {sameQco.map((r) => (
                      <li key={r.code}>
                        <StandardCode code={r.code} />
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>

            <section id="clauses" aria-labelledby="cl-h">
              <h2 id="cl-h" className="text-lg font-semibold">
                {tx(locale, "Key clauses")}
              </h2>
              {s.sections.length === 0 ? (
                <p className="mt-3 text-base text-muted">{tx(locale, "No clauses are recorded for this standard in the catalogue.")}</p>
              ) : (
                <ol className="mt-4 divide-y divide-rule border-y border-rule">
                  {s.sections.map((sec) => (
                    <li key={sec.clause} className="grid gap-x-6 gap-y-1 py-4 sm:grid-cols-[72px_1fr]">
                      <span className="id text-sm text-muted">cl. {sec.clause}</span>
                      <div>
                        <h3 className="text-base font-semibold">{sec.title}</h3>
                        <p className="mt-1 text-base text-body">{sec.summary}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
              <p className="mt-3 text-xs text-muted">
                {tx(locale, "Clause summaries are paraphrased for navigation. Read the published standard for the normative text.")}
              </p>
            </section>

            <section id="related" aria-labelledby="rel-h">
              <h2 id="rel-h" className="text-lg font-semibold">
                {tx(locale, "Related standards")}
              </h2>
              {s.related.length === 0 ? (
                <p className="mt-3 text-base text-muted">{tx(locale, "No related standards are recorded.")}</p>
              ) : (
                <ul className="mt-4 divide-y divide-rule border-y border-rule">
                  {related.map((r) => (
                    <li key={r.code} className="grid gap-x-6 gap-y-1 py-3 sm:grid-cols-[170px_1fr_auto] sm:items-baseline">
                      <StandardCode code={r.code} className="text-sm" />
                      <span className="text-base text-body">{r.title}</span>
                      <ObligationTag mandatory={r.mandatory} />
                    </li>
                  ))}
                  {unresolved.map((code) => (
                    <li key={code} className="grid gap-x-6 py-3 sm:grid-cols-[170px_1fr]">
                      <span className="id text-sm">{code}</span>
                      <span className="text-sm text-muted">{tx(locale, "Referenced, but not in this catalogue.")}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="testing" aria-labelledby="test-h">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h2 id="test-h" className="text-lg font-semibold">
                  {tx(locale, "Testing")}
                </h2>
                {totalLabs > 0 && (
                  <Link href={`/labs?capability=${s.category}`} className="link text-sm">
                    {tx(locale, "All")} {formatCount(totalLabs)} {tx(locale, "facilities")}
                  </Link>
                )}
              </div>
              <p className="mt-2 text-base text-body">
                {totalLabs > 0
                  ? `${formatCount(totalLabs)} facilities in the directory list ${categoryLabel(s.category).toLowerCase()} testing capability. Confirm with the laboratory that its scope of recognition covers ${s.code} before sending samples.`
                  : `No facility in the directory lists ${categoryLabel(s.category).toLowerCase()} testing capability. Ask the BIS branch office for a recognized laboratory.`}
              </p>
              {labRows.length > 0 && (
                <ul className="mt-4 divide-y divide-rule border-y border-rule">
                  {labRows.map((l) => (
                    <li key={l.id} className="grid gap-x-6 py-3 sm:grid-cols-[1fr_auto] sm:items-baseline">
                      <span className="text-base text-ink">{l.name}</span>
                      <span className="text-sm text-muted">
                        {l.kind} · {l.city}, {l.state}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section id="route" aria-labelledby="route-h">
              <h2 id="route-h" className="text-lg font-semibold">
                {tx(locale, "Certification route")}
              </h2>
              <p className="mt-2 text-base text-body">
                The catalogue lists this standard under <span className="font-medium text-ink">{s.scheme}</span>.
              </p>
              {route && (
                <Link
                  href={`/certification?scheme=${route.id}`}
                  className="group mt-4 flex items-start justify-between gap-6 rounded-lg border border-rule bg-surface px-5 py-4 hover:border-rule-strong"
                >
                  <span>
                    <span className="block font-heading text-base font-semibold text-ink">{route.name}</span>
                    <span className="mt-1 block text-sm text-body">{route.tagline}</span>
                    <span className="mt-1 block text-sm text-muted">{tx(locale, "Typical timeline")}: {route.timeline}</span>
                  </span>
                  <ArrowRight className="mt-1 size-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              )}
            </section>
          </article>

          {/* ---------------------------------------------------- margin */}
          <aside className="lg:sticky lg:top-[calc(var(--header-h)+32px)] lg:self-start">
            <div className="space-y-8">
              <section aria-labelledby="meta-h">
                <h2 id="meta-h" className="sr-only">
                  Record details
                </h2>
                <TierLabel tier="record" />
                <dl className="mt-3 text-sm">
                  {[
                    [tx(locale, "Code"), <span key="c" className="id">{s.code}</span>],
                    [tx(locale, "Category"), categoryLabel(s.category)],
                    [tx(locale, "Status"), `${tx(locale, s.status.charAt(0).toUpperCase() + s.status.slice(1))} ${tx(locale, "in catalogue")}`],
                    [tx(locale, "Revisions"), s.editions === 1 ? `1 ${tx(locale, "edition recorded")}` : `${s.editions} ${tx(locale, "editions recorded")}`],
                    [tx(locale, "Scheme"), s.scheme],
                    ...(s.qco ? [[tx(locale, "Legal basis"), s.qco] as const] : []),
                  ].map(([k, v]) => (
                    <div key={String(k)} className="grid grid-cols-[92px_1fr] gap-3 border-t border-rule py-2.5">
                      <dt className="text-muted">{k}</dt>
                      <dd className="min-w-0 break-words text-ink">{v}</dd>
                    </div>
                  ))}
                </dl>
                <p className="mt-3 text-xs text-muted">
                  {tx(locale, "From Pramaan's curated catalogue. Check the current edition and amendments on")}{" "}
                  <a href="https://www.bis.gov.in/" target="_blank" rel="noreferrer" className="link font-normal">
                    bis.gov.in
                  </a>
                  .
                </p>
              </section>

              <nav aria-label={tx(locale, "On this page")} className="hidden lg:block">
                <h2 className="text-sm font-semibold">{tx(locale, "On this page")}</h2>
                <ul className="mt-2 space-y-1 text-sm">
                  {SECTIONS.map((x) => (
                    <li key={x.id}>
                      <a href={`#${x.id}`} className="text-muted hover:text-ink">
                        {x.label}
                      </a>
                    </li>
                  ))}
                </ul>
              </nav>

              <div className="space-y-2">
                <Link
                  href={`/assistant?q=${encodeURIComponent(`Explain ${s.code}`)}`}
                  className="btn btn-primary w-full"
                >
                  <MessageSquareText className="size-4" aria-hidden="true" />
                  {tx(locale, "Ask about")} {s.code}
                </Link>
                <Link href={`/standards?category=${s.category}`} className="btn btn-secondary w-full">
                  {tx(locale, "More")} {categoryLabel(s.category).toLowerCase()} {tx(locale, "standards")}
                </Link>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Footer />
    </>
  );
}
