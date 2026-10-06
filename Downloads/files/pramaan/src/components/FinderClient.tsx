"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search } from "lucide-react";
import { PROFILE_SCHEME_TO_CERT, categoryLabel, standardHref } from "@/lib/format";
import { EmptyState, Notice, ObligationTag, Spinner, StandardCode, TierLabel } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

type Std = {
  id: number;
  code: string;
  title: string;
  summary: string;
  mandatory: boolean;
  scheme: string;
  qco: string | null;
};
type Lab = {
  id: number;
  name: string;
  city: string;
  state: string;
  kind: string;
  standards: string[];
  phone: string | null;
};
type Result = {
  profile: {
    id: string;
    label: string;
    category: string;
    mandatory: boolean;
    scheme: string;
    schemeLabel: string;
    standards: string[];
    note: string;
    steps: { title: string; desc: string }[];
    timeline: string;
  };
  standards: Std[];
  labs: Lab[];
};
type Response = { matched: true; results: Result[] } | { matched: false; standards: Std[] };

const PRESETS = [
  "Electric ceiling fan",
  "Gold bangle",
  "Laptop adapter",
  "TMT steel bar",
  "Packaged drinking water",
  "Pressure cooker",
  "LED bulb",
  "Toys for children",
  "HDPE water pipe",
  "इस्पात सरिया",
];

function Stage({
  n,
  title,
  why,
  next,
  children,
  last = false,
}: {
  n: number;
  title: string;
  why: string;
  next?: ReactNode;
  children: ReactNode;
  last?: boolean;
}) {
  return (
    <li className="relative grid grid-cols-[36px_minmax(0,1fr)] gap-x-4 sm:grid-cols-[44px_minmax(0,1fr)] sm:gap-x-6">
      <div className="relative flex justify-center">
        <span className="z-10 grid size-8 place-items-center rounded-full border border-navy bg-canvas font-heading text-sm font-bold text-ink">
          {n}
        </span>
        {!last && <span aria-hidden="true" className="absolute bottom-0 top-8 w-px bg-rule-strong" />}
      </div>
      <section className={last ? "pb-2" : "pb-12"} aria-labelledby={`stage-${n}`}>
        <h3 id={`stage-${n}`} className="pt-1 text-lg font-semibold">
          {title}
        </h3>
        <p className="mt-1 max-w-[62ch] text-sm text-muted">{why}</p>
        <div className="mt-4">{children}</div>
        {next && <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">{next}</div>}
      </section>
    </li>
  );
}

function Pathway({ r, query, primary, locale }: { r: Result; query: string; primary: boolean; locale: "en" | "hi" }) {
  const p = r.profile;
  const certId = PROFILE_SCHEME_TO_CERT[p.scheme];
  const missing = p.standards.filter((c) => !r.standards.some((s) => s.code.includes(c.split(" ")[1] ?? c)));

  return (
    <div>
      {/* verdict */}
      <div className="border-b border-rule pb-8">
        <p className="text-sm text-muted">
          {tx(locale, "Pathway for")} “{query}”
        </p>
        <h2 className="mt-1 text-2xl font-bold tracking-[-0.025em] sm:text-[2rem] sm:leading-[2.5rem]">{p.label}</h2>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <ObligationTag mandatory={p.mandatory} long />
          <span className="tag">{p.schemeLabel}</span>
        </div>
        <p className="mt-4 max-w-[68ch] text-md text-body">{tx(locale, p.note)}</p>
        <p className="mt-3 text-sm text-muted">{tx(locale, "Indicative timeline:")} {tx(locale, p.timeline)}</p>
      </div>

      <ol className="mt-10">
        <Stage
          n={1}
          title={tx(locale, "Product identified")}
          why={tx(locale, "Everything that follows depends on the product being classified correctly. If this is not your product, describe it more specifically.")}
          next={
            <Link href={`/assistant?q=${encodeURIComponent(`Which standard applies to ${query}?`)}`} className="link">
              {tx(locale, "Not quite right? Ask the assistant")}
            </Link>
          }
        >
          <div className="ev ev-extract">
            <TierLabel tier="extract" note={tx(locale, "Curated product profile")} />
            <p className="mt-1 text-base text-body">
              {tx(locale, "Matched to the")} <span className="font-medium text-ink">{tx(locale, p.label)}</span> {tx(locale, "profile in the")} {tx(locale, categoryLabel(p.category).toLowerCase())} {tx(locale, "family.")}
            </p>
          </div>
        </Stage>

        <Stage
          n={2}
          title={tx(locale, "Applicable standards")}
          why={tx(locale, "The Indian Standard sets the requirements, test methods and marking your product must meet.")}
          next={
            r.standards[0] && (
              <Link href={standardHref(r.standards[0].code)} className="link">
                {tx(locale, "Read")} {r.standards[0].code} {tx(locale, "in full")}
              </Link>
            )
          }
        >
          {r.standards.length > 0 ? (
            <div className="ev ev-record">
              <TierLabel tier="record" />
              <ul className="mt-2 divide-y divide-rule">
                {r.standards.map((s) => (
                  <li key={s.id} className="py-3 first:pt-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StandardCode code={s.code} />
                      <ObligationTag mandatory={s.mandatory} />
                    </div>
                    <p className="mt-1 text-base font-medium text-ink">{s.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-sm text-muted">{s.summary}</p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          {missing.length > 0 && (
            <p className="mt-3 text-sm text-muted">
              {tx(locale, "Also referenced by the profile but not in the catalogue:")} <span className="id">{missing.join(", ")}</span>.
            </p>
          )}
        </Stage>

        <Stage
          n={3}
          title={tx(locale, p.mandatory ? "Certification scheme (compulsory)" : "Certification scheme (voluntary)")}
          why={
            p.mandatory
              ? tx(locale, "A Quality Control Order applies, so the product needs certification before it is sold or imported.")
              : tx(locale, "No Quality Control Order applies; certification is optional but often expected by buyers and tenders.")
          }
          next={
            certId && (
              <Link href={`/certification?scheme=${certId}`} className="link">
                {tx(locale, "Open the full")} {tx(locale, p.schemeLabel.split(" — ")[0].split(" (")[0])} {tx(locale, "walkthrough")}
              </Link>
            )
          }
        >
          <p className="text-base font-medium text-ink">{p.schemeLabel}</p>
          {p.steps.length > 0 && (
            <ol className="mt-3 divide-y divide-rule border-y border-rule">
              {p.steps.map((st, i) => (
                <li key={st.title} className="grid grid-cols-[28px_1fr] gap-2 py-3">
                  <span className="text-sm tabular-nums text-muted">{i + 1}.</span>
                  <div>
                    <p className="text-base font-medium text-ink">{tx(locale, st.title)}</p>
                    <p className="mt-0.5 text-sm text-body">{tx(locale, st.desc)}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </Stage>

        <Stage
          n={4}
          title={tx(locale, "Testing")}
          why={tx(locale, "Samples are tested against every clause of the standard at a BIS or BIS-recognized laboratory.")}
          next={
            <Link href={`/labs?capability=${p.category}`} className="link">
              {tx(locale, "All laboratories with")} {tx(locale, categoryLabel(p.category).toLowerCase())} {tx(locale, "capability")}
            </Link>
          }
        >
          {/* the API selects labs for the first (closest) profile only */}
          {primary && r.labs.length > 0 ? (
            <div className="ev ev-record">
              <TierLabel tier="record" note={`${tx(locale, "Facilities listing")} ${tx(locale, categoryLabel(p.category).toLowerCase())} ${tx(locale, "testing")}`} />
              <ul className="mt-2 divide-y divide-rule">
                {r.labs.map((l) => (
                  <li key={l.id} className="grid gap-x-4 py-2.5 sm:grid-cols-[1fr_auto] sm:items-baseline">
                    <span className="text-base text-ink">{l.name}</span>
                    <span className="text-sm text-muted">
                      {l.kind} · {l.city}, {l.state}
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-muted">
                {tx(locale, "Confirm the laboratory's scope of recognition covers your standard before sending samples.")}
              </p>
            </div>
          ) : (
            <p className="text-base text-muted">
              {primary
                ? tx(locale, "No laboratory in the directory lists this capability yet.")
                : tx(locale, "Use the directory link below to see laboratories for this product family.")}
            </p>
          )}
        </Stage>

        <Stage
          n={5}
          title={tx(locale, "Prepare the application")}
          why={tx(locale, "Most rejections come from incomplete documents. Assemble the dossier before you file.")}
          last
          next={
            <>
              {certId && (
                <Link href={`/certification?scheme=${certId}#documents`} className="link">
                  {tx(locale, "Document checklist")}
                </Link>
              )}
              <Link
                href={`/assistant?q=${encodeURIComponent(`What fees apply for ${p.label} certification?`)}`}
                className="link"
              >
                {tx(locale, "Ask about fees and concessions")}
              </Link>
            </>
          }
        >
          <p className="text-base text-body">
            {tx(locale, "The certification walkthrough lists the documents, indicative fees, marking rules and common reasons for rejection for this scheme. Ticked checklist items are saved in your browser.")}
          </p>
        </Stage>
      </ol>
    </div>
  );
}

export function FinderClient() {
  const { locale } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">("idle");
  const [data, setData] = useState<Response | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState(0);
  const inputId = useId();
  const ran = useRef<string | null>(null);

  const run = useCallback(async (raw: string) => {
    const text = raw.trim();
    if (!text) return;
    setStatus("loading");
    setQuery(text);
    setTab(0);
    try {
      const res = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: text }),
      });
      if (!res.ok) throw new Error(String(res.status));
      setData(await res.json());
      setStatus("ready");
    } catch {
      setStatus("error");
    }
  }, []);

  const urlQ = params.get("q");
  useEffect(() => {
    if (!urlQ || ran.current === urlQ) return;
    ran.current = urlQ;
    run(urlQ);
  }, [urlQ, run]);

  const submit = (text: string) => {
    if (!text.trim()) return;
    setQ(text);
    ran.current = text.trim();
    router.replace(`/finder?q=${encodeURIComponent(text.trim())}`, { scroll: false });
    run(text);
  };

  return (
    <div className="grid gap-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-16">
      <aside className="lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit(q);
          }}
        >
          <label htmlFor={inputId} className="text-sm font-semibold text-ink">
            {tx(locale, "Describe your product")}
          </label>
          <p className="mt-1 text-sm text-muted">{tx(locale, "Use the everyday name, its material or what it does.")}</p>
          <div className="relative mt-3">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id={inputId}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx(locale, "PVC insulated house wiring cable")}
              className="field py-2.5 pl-9"
              autoComplete="off"
            />
          </div>
          <button type="submit" disabled={status === "loading" || !q.trim()} className="btn btn-primary mt-3 w-full">
            {tx(locale, "Identify standards and route")}
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </form>
        <div className="mt-8">
          <h2 className="text-sm font-semibold">{tx(locale, "Examples")}</h2>
          <ul className="mt-2 flex flex-wrap gap-1.5 lg:flex-col lg:gap-0.5">
            {PRESETS.map((p) => (
              <li key={p}>
                <button
                  type="button"
                  onClick={() => submit(p)}
                  className="choice lg:min-h-0 lg:w-full lg:border-transparent lg:bg-transparent lg:px-0 lg:py-1 lg:hover:text-select-ink"
                >
                  {tx(locale, p)}
                </button>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      <section aria-live="polite" aria-busy={status === "loading"} className="min-w-0 max-w-[780px]">
        {status === "idle" && (
          <EmptyState title={tx(locale, "Start with a product description")}>
            {tx(locale, "Pramaan matches it to a product profile, then lays out the route in order: the applicable Indian Standards, whether certification is compulsory, the scheme and its steps, laboratories that test the product family, and what to prepare before you apply.")}
          </EmptyState>
        )}

        {status === "loading" && (
          <div className="space-y-4">
            <Spinner label={`${tx(locale, "Mapping")} “${query}” ${tx(locale, "to standards and schemes")}`} />
            <div className="skeleton h-8 w-2/3" />
            <div className="skeleton h-4 w-full" />
            <div className="skeleton h-4 w-5/6" />
          </div>
        )}

        {status === "error" && (
          <Notice
            tone="danger"
            title={tx(locale, "The product could not be mapped.")}
            action={
              <button type="button" onClick={() => run(query)} className="btn btn-secondary btn-sm">
                {tx(locale, "Try again")}
              </button>
            }
          >
            {tx(locale, "The finder service did not respond. Your description is kept.")}
          </Notice>
        )}

        {status === "ready" && data && !data.matched && (
          <div className="space-y-8">
            <Notice tone="attention" title={`${tx(locale, "No product profile matches")} “${query}”`}>
              {tx(locale, "Pramaan has curated profiles for around twenty regulated product families. Try the everyday product name (“cement”, “helmet”, “smart meter”), or ask the assistant to work through an unusual case.")}
            </Notice>
            {data.standards.length > 0 && (
              <section className="ev ev-record">
                <TierLabel tier="record" note={tx(locale, "Keyword matches in the catalogue, not a confirmed mapping")} />
                <ul className="mt-2 divide-y divide-rule">
                  {data.standards.map((s) => (
                    <li key={s.id} className="grid gap-x-5 py-3 sm:grid-cols-[160px_1fr]">
                      <StandardCode code={s.code} className="text-sm" />
                      <span className="text-base text-body">{s.title}</span>
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <div className="flex flex-wrap gap-3">
              <Link href={`/assistant?q=${encodeURIComponent(`Which standard applies to ${query}?`)}`} className="btn btn-primary">
                {tx(locale, "Ask the assistant")}
              </Link>
              <Link href={`/standards?q=${encodeURIComponent(query)}`} className="btn btn-secondary">
                {tx(locale, "Search the catalogue")}
              </Link>
            </div>
          </div>
        )}

        {status === "ready" && data && data.matched && data.results.length > 0 && (
          <div>
            {data.results.length > 1 && (
              <div className="mb-8">
                <p id="match-label" className="text-sm text-muted">
                  {data.results.length} {tx(locale, "product profiles match this description")}
                </p>
                <div role="group" aria-labelledby="match-label" className="mt-2 flex flex-wrap gap-1.5">
                  {data.results.map((r, i) => (
                    <button
                      key={r.profile.id}
                      type="button"
                      aria-pressed={tab === i}
                      onClick={() => setTab(i)}
                      className="choice"
                    >
                      {r.profile.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <Pathway key={data.results[tab].profile.id} r={data.results[tab]} query={query} primary={tab === 0} locale={locale} />
          </div>
        )}
      </section>
    </div>
  );
}
