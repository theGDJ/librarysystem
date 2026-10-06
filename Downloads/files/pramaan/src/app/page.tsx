import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";
import { HomeSearch } from "@/components/HomeSearch";
import { ObligationTag, StandardCode, TierLabel } from "@/components/ui";
import { db } from "@/db";
import { standards, labs } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { SCHEMES } from "@/app/certification/data";
import { formatCount, standardHref } from "@/lib/format";
import { ArrowRight } from "lucide-react";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";

export const dynamic = "force-dynamic";

const AUDIENCES = [
  {
    who: "Manufacturers and MSMEs",
    question: "Does a Quality Control Order cover my product, and what does the ISI licence involve?",
    href: "/finder",
    tool: "Product finder",
  },
  {
    who: "Importers and foreign manufacturers",
    question: "Do I need CRS registration or an FMCS licence before the goods land?",
    href: "/certification?scheme=fmcs",
    tool: "Certification routes",
  },
  {
    who: "Compliance and quality teams",
    question: "Which clauses of IS 1786 matter, and which standards does it reference?",
    href: "/standards",
    tool: "Standards catalogue",
  },
  {
    who: "Buyers and consumers",
    question: "Is the licence number on this product, or the HUID on this jewellery, genuine?",
    href: "/consumer",
    tool: "Verify a mark",
  },
];

const TIERS = [
  {
    tier: "record" as const,
    body: "Standard codes, titles, obligations, schemes, clauses and laboratories are rendered directly from catalogue rows. Nothing in this layer is generated.",
  },
  {
    tier: "extract" as const,
    body: "Guidance on schemes, fees and procedures is quoted from knowledge-base articles, with the article named.",
  },
  {
    tier: "model" as const,
    body: "A short summary written by a language model running on this server, from the records above. It is marked as such and never replaces them.",
  },
];

async function loadHome() {
  const [[stdCount], [mandCount], [labCount], stateRows] = await Promise.all([
    db.select({ c: sql<number>`count(*)::int` }).from(standards),
    db.select({ c: sql<number>`count(*)::int` }).from(standards).where(eq(standards.mandatory, true)),
    db.select({ c: sql<number>`count(*)::int` }).from(labs),
    db.selectDistinct({ s: labs.state }).from(labs),
  ]);

  /* one real record for the hero: helmets if present, else any QCO standard with clauses */
  let [specimen] = await db.select().from(standards).where(eq(standards.code, "IS 4151:2015")).limit(1);
  if (!specimen) {
    [specimen] = await db
      .select()
      .from(standards)
      .where(and(eq(standards.mandatory, true), sql`jsonb_array_length(${standards.sections}) > 1`))
      .limit(1);
  }

  return {
    standards: Number(stdCount?.c ?? 0),
    mandatory: Number(mandCount?.c ?? 0),
    labs: Number(labCount?.c ?? 0),
    states: stateRows.length,
    specimen: specimen ?? null,
  };
}

export default async function Home() {
  const locale = await getLocale();
  const data = await loadHome();
  const s = data.specimen;

  return (
    <>
      <Nav />
      <main id="main">
        {/* ------------------------------------------------------------ hero */}
        <section className="border-b border-rule">
          <div className="mx-auto grid max-w-[1240px] gap-12 px-5 pb-16 pt-12 sm:px-8 sm:pt-20 lg:grid-cols-12 lg:gap-10 lg:pb-20">
            <div className="lg:col-span-7">
              <h1 className="max-w-[17ch] text-[2.25rem] font-bold leading-[1.08] tracking-[-0.035em] sm:text-4xl lg:text-[3.6rem] lg:leading-[1.04]">
                {tx(locale, "Find the Indian Standard behind any product, with the record that proves it.")}
              </h1>
              <p className="mt-6 max-w-[56ch] text-md text-muted sm:text-[1.125rem] sm:leading-[1.7]">
                {tx(locale, "Describe a product or ask a compliance question, in English or Hindi. Pramaan returns the applicable IS codes, whether a Quality Control Order makes certification compulsory, the BIS scheme to follow and the laboratories that can test it.")}
              </p>
              <div className="mt-9 max-w-[640px]">
                <HomeSearch />
              </div>
            </div>

            {/* a real catalogue row, set as a reference specimen */}
            {s && (
              <aside aria-labelledby="specimen-title" className="lg:col-span-5 lg:pt-3">
                <figure>
                  <div className="sheet overflow-hidden">
                    <div className="flex items-center justify-between border-b border-rule bg-sunken px-5 py-2.5">
                      <TierLabel tier="record" />
                      <span className="text-2xs text-muted">{tx(locale, "Live from the catalogue")}</span>
                    </div>
                    <div className="px-5 pb-5 pt-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <StandardCode code={s.code} className="text-[15px]" />
                        <ObligationTag mandatory={s.mandatory} />
                      </div>
                      <h2 id="specimen-title" className="mt-2 text-lg font-semibold leading-snug tracking-[-0.01em]">
                        {s.title}
                      </h2>
                      <dl className="mt-4 grid grid-cols-[96px_1fr] gap-x-3 gap-y-2 text-sm">
                        <dt className="text-muted">{tx(locale, "Scheme")}</dt>
                        <dd className="text-ink">{s.scheme}</dd>
                        {s.qco && (
                          <>
                            <dt className="text-muted">{tx(locale, "Legal basis")}</dt>
                            <dd className="text-ink">{s.qco}</dd>
                          </>
                        )}
                      </dl>
                      {s.sections.length > 0 && (
                        <ol className="mt-5 space-y-3 border-t border-rule pt-4">
                          {s.sections.slice(0, 2).map((sec) => (
                            <li key={sec.clause} className="grid grid-cols-[44px_1fr] gap-2 text-sm">
                              <span className="id pt-px text-xs text-muted">{sec.clause}</span>
                              <span>
                                <span className="font-semibold text-ink">{sec.title}.</span>{" "}
                                <span className="text-body">{sec.summary}</span>
                              </span>
                            </li>
                          ))}
                        </ol>
                      )}
                      <Link href={standardHref(s.code)} className="link mt-5 inline-flex items-center gap-1.5 text-sm">
                        {tx(locale, "Open the full record")}
                      </Link>
                    </div>
                  </div>
                  <figcaption className="mt-3 max-w-[46ch] text-xs text-muted">
                    {tx(locale, "Answers are assembled from records like this one. Text written by the language model is labelled separately, so you can always tell the two apart.")}
                  </figcaption>
                </figure>
              </aside>
            )}
          </div>
        </section>

        {/* ---------------------------------------------- coverage, as prose */}
        <section aria-label={tx(locale, "Catalogue coverage")} className="border-b border-rule bg-sunken">
          <p className="mx-auto max-w-[1240px] px-5 py-6 text-base text-body sm:px-8">
            The catalogue holds{" "}
            <Link href="/standards" className="link">
              {formatCount(data.standards)} {tx(locale, "Indian Standards")}
            </Link>
            , of which{" "}
            <Link href="/standards?mandatory=true" className="link">
              {formatCount(data.mandatory)} {tx(locale, "fall under Quality Control Orders")}
            </Link>
            , and{" "}
            <Link href="/labs" className="link">
              {formatCount(data.labs)} {tx(locale, "laboratories and hallmarking centres")}
            </Link>{" "}
            {tx(locale, "across")} {data.states} {tx(locale, "states and union territories.")}
          </p>
        </section>

        {/* --------------------------------------------------------- audience */}
        <section className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <h2 className="text-xl font-bold tracking-[-0.02em] sm:text-2xl">
              {tx(locale, "For anyone who has to get certification right the first time")}
            </h2>
            <p className="mt-4 max-w-[40ch] text-base text-muted">
              {tx(locale, "Each tool starts from the question people actually bring, and ends with something you can act on: a standard to read, a scheme to follow, a lab to call.")}
            </p>
          </div>
          <ul className="divide-y divide-rule border-y border-rule lg:col-span-8">
            {AUDIENCES.map((a) => (
              <li key={a.who}>
                <Link
                  href={a.href}
                  className="group grid gap-1 py-5 sm:grid-cols-[200px_1fr_auto] sm:items-baseline sm:gap-6"
                >
                  <span className="font-heading text-base font-semibold text-ink">{tx(locale, a.who)}</span>
                  <span className="text-base text-body">“{tx(locale, a.question)}”</span>
                  <span className="inline-flex items-center gap-1.5 text-sm font-medium text-select-ink">
                    {tx(locale, a.tool)}
                    <ArrowRight
                      className="size-3.5 transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* ----------------------------------------------------- trust model */}
        <section className="border-y border-rule bg-surface">
          <div className="mx-auto grid max-w-[1240px] gap-10 px-5 py-20 sm:px-8 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h2 className="text-xl font-bold tracking-[-0.02em] sm:text-2xl">
                {tx(locale, "Three kinds of text, never blended")}
              </h2>
              <p className="mt-4 max-w-[46ch] text-base text-muted">
                {tx(locale, "Your question is matched against the standards catalogue, the scheme and process articles and the laboratory network. What comes back is shown in three clearly marked layers, so you know which parts are data and which parts are interpretation.")}
              </p>
              <p className="mt-4 max-w-[46ch] text-base text-muted">
                {tx(locale, "The language model runs on this server. Your questions are not sent to an external AI service.")}
              </p>
            </div>
            <ol className="space-y-7 lg:col-span-6 lg:col-start-7">
              {TIERS.map((t) => (
                <li key={t.tier} className={`ev ev-${t.tier}`}>
                  <TierLabel tier={t.tier} />
                  <p className="mt-1.5 max-w-[56ch] text-base text-body">{tx(locale, t.body)}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* ---------------------------------------------------------- routes */}
        <section className="mx-auto max-w-[1240px] px-5 py-20 sm:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <h2 className="text-xl font-bold tracking-[-0.02em] sm:text-2xl">{tx(locale, "Certification routes")}</h2>
              <p className="mt-3 max-w-[60ch] text-base text-muted">
                {tx(locale, "BIS runs several conformity-assessment schemes. Which one applies depends on the product, where it is made and whether a Quality Control Order names it.")}
              </p>
            </div>
            <Link href="/certification" className="link shrink-0 text-sm">
              {tx(locale, "Compare all routes")}
            </Link>
          </div>
          <div className="mt-8 overflow-hidden rounded-lg border border-rule bg-surface">
            <table className="w-full border-collapse text-left">
              <thead className="hidden md:table-header-group">
                <tr className="border-b border-rule bg-sunken text-xs text-muted">
                  <th scope="col" className="px-5 py-2.5 font-medium">{tx(locale, "Route")}</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">{tx(locale, "In short")}</th>
                  <th scope="col" className="px-5 py-2.5 font-medium">{tx(locale, "Typical timeline")}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule">
                {SCHEMES.map((sc) => (
                  <tr key={sc.id} className="block px-5 py-4 md:table-row md:p-0">
                    <th scope="row" className="block text-left md:table-cell md:w-[30%] md:px-5 md:py-4 md:align-top">
                      <Link href={`/certification?scheme=${sc.id}`} className="link font-heading text-base font-semibold">
                        {tx(locale, sc.name)}
                      </Link>
                    </th>
                    <td className="mt-1 block text-sm text-body md:table-cell md:px-5 md:py-4 md:align-top">
                      {tx(locale, sc.tagline)}
                    </td>
                    <td className="mt-1 block text-sm text-muted md:table-cell md:w-[24%] md:px-5 md:py-4 md:align-top">
                      {tx(locale, sc.timeline)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
