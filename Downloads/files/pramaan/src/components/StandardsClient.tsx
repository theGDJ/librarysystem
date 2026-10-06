"use client";

import Link from "next/link";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, Search, X } from "lucide-react";
import { categoryLabel, formatCount, standardHref } from "@/lib/format";
import { EmptyState, Notice, ObligationTag, StandardCode, TierLabel } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

export type Std = {
  id: number;
  code: string;
  title: string;
  category: string;
  status: string;
  mandatory: boolean;
  scheme: string;
  qco: string | null;
  summary: string;
  keywords: string[];
  sections: { clause: string; title: string; summary: string }[];
  related: string[];
  editions: number;
};

const CATS = [
  "all",
  "construction",
  "electrical",
  "electronics",
  "mechanical",
  "plastics",
  "chemicals",
  "food",
  "consumer",
  "hallmark",
  "services",
];

const LIMIT = 250;

/** Mirror of the ranking in /api/standards, used to explain each result. */
function matchedIn(s: Std, q: string): string[] {
  const tokens = q.toLowerCase().split(/\s+/).filter((w) => w.length > 1);
  if (!tokens.length) return [];
  const where = new Set<string>();
  const keys = s.keywords.join(" ").toLowerCase();
  for (const w of tokens) {
    if (s.code.toLowerCase().includes(w)) where.add("code");
    if (s.title.toLowerCase().includes(w)) where.add("title");
    if (keys.includes(w)) where.add("keywords");
    if ((s.qco ?? "").toLowerCase().includes(w)) where.add("legal basis");
    if (s.summary.toLowerCase().includes(w)) where.add("summary");
  }
  return [...where];
}

function Preview({ s, onClose, locale }: { s: Std; onClose: () => void; locale: "en" | "hi" }) {
  return (
    <div className="sheet">
      <div className="flex items-center justify-between border-b border-rule px-5 py-2.5">
        <TierLabel tier="record" />
        <button type="button" onClick={onClose} className="btn btn-quiet btn-sm -mr-2" aria-label={tx(locale, "Close preview")}>
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="max-h-[calc(100vh-var(--header-h)-120px)] overflow-y-auto px-5 pb-5 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <StandardCode code={s.code} link={false} className="text-[15px]" />
          <ObligationTag mandatory={s.mandatory} />
        </div>
        <h2 className="mt-2 text-lg font-semibold leading-snug">{s.title}</h2>
        <p className="mt-3 text-sm text-body">{s.summary}</p>
        <dl className="mt-4 grid grid-cols-[96px_1fr] gap-x-3 gap-y-1.5 text-sm">
          <dt className="text-muted">{tx(locale, "Scheme")}</dt>
          <dd className="text-ink">{s.scheme}</dd>
          {s.qco && (
            <>
              <dt className="text-muted">{tx(locale, "Legal basis")}</dt>
              <dd className="text-ink">{s.qco}</dd>
            </>
          )}
          <dt className="text-muted">{tx(locale, "Category")}</dt>
          <dd className="text-ink">{tx(locale, categoryLabel(s.category))}</dd>
        </dl>
        {s.sections.length > 0 && (
          <>
            <h3 className="mt-5 text-sm font-semibold">{tx(locale, "Key clauses")}</h3>
            <ol className="mt-2 space-y-2">
              {s.sections.slice(0, 4).map((sec) => (
                <li key={sec.clause} className="grid grid-cols-[40px_1fr] gap-2 text-sm">
                  <span className="id text-xs text-muted">{sec.clause}</span>
                  <span>
                    <span className="font-medium text-ink">{sec.title}</span>
                    <span className="block text-muted">{sec.summary}</span>
                  </span>
                </li>
              ))}
            </ol>
          </>
        )}
        <Link href={standardHref(s.code)} className="btn btn-primary mt-5 w-full">
          {tx(locale, "Open the full record")}
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

export function StandardsClient({ initial }: { initial: Std[] }) {
  const { locale } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [cat, setCat] = useState(params.get("category") ?? "all");
  const [mandOnly, setMandOnly] = useState(params.get("mandatory") === "true");
  const [items, setItems] = useState(initial);
  const [status, setStatus] = useState<"ready" | "loading" | "error">(
    params.get("q") || params.get("category") || params.get("mandatory") ? "loading" : "ready",
  );
  const [attempt, setAttempt] = useState(0);
  const [active, setActive] = useState<Std | null>(null);
  const [queried, setQueried] = useState(params.get("q") ?? "");
  const first = useRef(true);
  const searchId = useId();
  const catId = useId();

  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    const hasFilters = q.trim() || cat !== "all" || mandOnly;
    if (isFirst && !hasFilters) return; // the server already rendered the unfiltered list
    const ctl = new AbortController();
    const id = setTimeout(
      async () => {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (cat !== "all") sp.set("category", cat);
        if (mandOnly) sp.set("mandatory", "true");
        setStatus("loading");
        router.replace(sp.size ? `/standards?${sp}` : "/standards", { scroll: false });
        try {
          const res = await fetch(`/api/standards?${sp}`, { signal: ctl.signal });
          if (!res.ok) throw new Error(String(res.status));
          const data: { standards: Std[] } = await res.json();
          setItems(data.standards);
          setQueried(q.trim());
          setStatus("ready");
        } catch (e) {
          if ((e as Error).name !== "AbortError") setStatus("error");
        }
      },
      isFirst ? 0 : 220,
    );
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, cat, mandOnly, attempt, router]);

  const reasons = useMemo(() => new Map(items.map((s) => [s.id, matchedIn(s, queried)])), [items, queried]);

  const onRowClick = (e: React.MouseEvent, s: Std) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (window.matchMedia("(min-width: 1280px)").matches) {
      e.preventDefault();
      setActive(s);
    }
  };

  const clearAll = () => {
    setQ("");
    setCat("all");
    setMandOnly(false);
  };

  const filtersOn = q.trim() !== "" || cat !== "all" || mandOnly;

  return (
    <div className="grid gap-8 lg:grid-cols-[200px_minmax(0,1fr)] xl:grid-cols-[200px_minmax(0,1fr)_360px]">
      {/* ------------------------------------------------------ filters */}
      <aside aria-label="Filters" className="space-y-6 lg:sticky lg:top-[calc(var(--header-h)+24px)] lg:self-start">
        <div className="lg:hidden">
          <label htmlFor={catId} className="label">
            {tx(locale, "Category")}
          </label>
          <select id={catId} value={cat} onChange={(e) => setCat(e.target.value)} className="field mt-1">
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? tx(locale, "All categories") : tx(locale, categoryLabel(c))}
              </option>
            ))}
          </select>
        </div>
        <div className="hidden lg:block">
          <h2 className="text-sm font-semibold">{tx(locale, "Category")}</h2>
          <ul className="mt-2 space-y-0.5">
            {CATS.map((c) => (
              <li key={c}>
                <button
                  type="button"
                  aria-pressed={cat === c}
                  onClick={() => setCat(c)}
                  className={`w-full rounded-md px-2.5 py-1.5 text-left text-sm transition-colors ${
                    cat === c ? "bg-select-soft font-medium text-select-ink" : "text-body hover:bg-sunken"
                  }`}
                >
                  {c === "all" ? tx(locale, "All categories") : tx(locale, categoryLabel(c))}
                </button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="text-sm font-semibold max-lg:sr-only">{tx(locale, "Obligation")}</h2>
          <label className="mt-2 flex cursor-pointer items-start gap-2.5 text-sm text-body">
            <input
              type="checkbox"
              checked={mandOnly}
              onChange={(e) => setMandOnly(e.target.checked)}
              className="mt-1 size-4 accent-[#2d7778]"
            />
            {tx(locale, "Only standards under a Quality Control Order")}
          </label>
        </div>
        {filtersOn && (
          <button type="button" onClick={clearAll} className="link text-sm">
            {tx(locale, "Clear all filters")}
          </button>
        )}
      </aside>

      {/* ------------------------------------------------------ results */}
      <section aria-labelledby="results-heading" className="min-w-0">
        <label htmlFor={searchId} className="label">
          {tx(locale, "Search by code, title or keyword")}
        </label>
        <div className="relative mt-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
            aria-hidden="true"
          />
          <input
            id={searchId}
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={tx(locale, "IS 694, cement, helmet, cable…")}
            className="field py-2.5 pl-9 text-md"
            autoComplete="off"
          />
        </div>

        <div className="mt-5 flex flex-wrap items-baseline justify-between gap-2 border-b border-rule pb-2.5">
          <h2 id="results-heading" className="text-sm font-semibold" aria-live="polite">
            {status === "loading"
              ? tx(locale, "Searching…")
              : status === "error"
                ? tx(locale, "Search failed")
                : `${formatCount(items.length)} ${tx(locale, items.length === 1 ? "standard" : "standards")}`}
          </h2>
          {status === "ready" && items.length > 0 && (
            <span className="text-xs text-muted">
              {tx(locale, queried ? "Ranked by relevance to your search" : "Sorted by code")}
              {items.length >= LIMIT && ` · ${tx(locale, `showing the first ${LIMIT}, refine to narrow down`)}`}
            </span>
          )}
        </div>

        {status === "error" && (
          <div className="mt-5">
            <Notice
              tone="danger"
              title={tx(locale, "The catalogue did not respond.")}
              action={
                <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-secondary btn-sm">
                  {tx(locale, "Try again")}
                </button>
              }
            >
              {tx(locale, "Your filters are kept. Check the connection and try again.")}
            </Notice>
          </div>
        )}

        {status === "ready" && items.length === 0 && (
          <div className="mt-5">
            <EmptyState title={queried ? `${tx(locale, "No standards match")} “${queried}”` : tx(locale, "No standards match these filters")}>
              {tx(locale, "Try a broader word (“cable” rather than “PVC insulated cable”), an IS number without the year, or")} {" "}
              <button type="button" onClick={clearAll} className="link">
                {tx(locale, "clear the filters")}
              </button>
              . {tx(locale, "For product questions, the")} {" "}
              <Link href={`/finder${queried ? `?q=${encodeURIComponent(queried)}` : ""}`} className="link">
                {tx(locale, "product finder")}
              </Link>{" "}
              {tx(locale, "maps descriptions to standards.")}
            </EmptyState>
          </div>
        )}

        <ul className={`divide-y divide-rule transition-opacity ${status === "loading" ? "opacity-50" : ""}`}>
          {items.map((s) => {
            const why = reasons.get(s.id) ?? [];
            const selected = active?.id === s.id;
            return (
              <li key={s.id}>
                <Link
                  href={standardHref(s.code)}
                  onClick={(e) => onRowClick(e, s)}
                  aria-current={selected ? "true" : undefined}
                  className={`grid gap-x-5 gap-y-1 px-2 py-4 transition-colors sm:grid-cols-[170px_minmax(0,1fr)] ${
                    selected ? "bg-select-soft" : "hover:bg-sunken/70"
                  }`}
                >
                  <div className="flex flex-wrap items-start gap-2 sm:flex-col sm:gap-1.5">
                    <span className="id text-sm">{s.code}</span>
                    <ObligationTag mandatory={s.mandatory} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-base font-medium leading-snug text-ink">{s.title}</p>
                    <p className="mt-1 line-clamp-2 text-sm text-muted">{s.summary}</p>
                    <p className="mt-1.5 text-2xs text-muted">
                      {tx(locale, categoryLabel(s.category))}
                      {why.length > 0 && <> · {tx(locale, "Matched in")} {why.map((x) => tx(locale, x)).join(", ")}</>}
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      {/* ------------------------------------------- preview (wide screens) */}
      <aside aria-label="Preview" className="hidden xl:block">
        <div className="sticky top-[calc(var(--header-h)+24px)]">
          {active ? (
            <Preview s={active} locale={locale} onClose={() => setActive(null)} />
          ) : (
            <div className="rounded-lg border border-dashed border-rule-strong px-5 py-8 text-sm text-muted">
              Select a standard to preview its scope, obligation and key clauses here. Open the full record for
              related standards, laboratories and the certification route.
            </div>
          )}
        </div>
      </aside>
    </div>
  );
}
