"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { categoryLabel, formatCount } from "@/lib/format";
import { EmptyState, Notice } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";

export type Lab = {
  id: number;
  name: string;
  city: string;
  state: string;
  kind: string;
  capabilities: string[];
  standards: string[];
  phone: string | null;
  email: string | null;
};

const CAPS = ["all", "electrical", "electronics", "construction", "mechanical", "plastics", "food", "chemicals", "consumer", "hallmark"];

const KINDS = [
  { id: "all", label: "All facility types" },
  { id: "BIS Laboratory", label: "BIS laboratories" },
  { id: "Recognized Laboratory", label: "Recognized laboratories" },
  { id: "AHC", label: "Assaying and hallmarking centres" },
];

const PAGE = 40;

export function LabsClient({ initial, states }: { initial: Lab[]; states: string[] }) {
  const { locale } = useLocale();
  const params = useSearchParams();
  const router = useRouter();
  const [labs, setLabs] = useState(initial);
  const [state, setState] = useState(params.get("state") ?? "all");
  const [kind, setKind] = useState(params.get("kind") ?? "all");
  const [cap, setCap] = useState(params.get("capability") ?? "all");
  const [q, setQ] = useState(params.get("q") ?? "");
  const [shown, setShown] = useState(PAGE);
  const [status, setStatus] = useState<"ready" | "loading" | "error">(
    ["state", "kind", "capability", "q"].some((k) => params.get(k)) ? "loading" : "ready",
  );
  const [attempt, setAttempt] = useState(0);
  const first = useRef(true);
  const ids = { q: useId(), state: useId(), kind: useId(), cap: useId() };

  useEffect(() => {
    const isFirst = first.current;
    first.current = false;
    const filtered = state !== "all" || kind !== "all" || cap !== "all" || q.trim();
    if (isFirst && !filtered) return;
    const ctl = new AbortController();
    const id = setTimeout(
      async () => {
        const sp = new URLSearchParams();
        if (q.trim()) sp.set("q", q.trim());
        if (state !== "all") sp.set("state", state);
        if (kind !== "all") sp.set("kind", kind);
        if (cap !== "all") sp.set("capability", cap);
        setStatus("loading");
        router.replace(sp.size ? `/labs?${sp}` : "/labs", { scroll: false });
        try {
          const res = await fetch(`/api/labs?${sp}`, { signal: ctl.signal });
          if (!res.ok) throw new Error(String(res.status));
          const d: { labs: Lab[] } = await res.json();
          setLabs(d.labs);
          setShown(PAGE);
          setStatus("ready");
        } catch (e) {
          if ((e as Error).name !== "AbortError") setStatus("error");
        }
      },
      q && !isFirst ? 220 : 0,
    );
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [state, kind, cap, q, attempt, router]);

  const counts = useMemo(
    () =>
      labs.reduce<Record<string, number>>((a, l) => {
        a[l.kind] = (a[l.kind] ?? 0) + 1;
        return a;
      }, {}),
    [labs],
  );

  const reset = () => {
    setQ("");
    setState("all");
    setKind("all");
    setCap("all");
  };

  return (
    <div>
      {/* filters */}
      <div className="grid gap-4 border-b border-rule pb-6 md:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_1fr_1fr_1fr]">
        <div>
          <label htmlFor={ids.q} className="label">
            {tx(locale, "Facility, city or state")}
          </label>
          <div className="relative mt-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden="true" />
            <input
              id={ids.q}
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={tx(locale, "Mumbai, Sahibabad, NTH…")}
              className="field pl-9"
              autoComplete="off"
            />
          </div>
        </div>
        <div>
          <label htmlFor={ids.state} className="label">
            {tx(locale, "State or union territory")}
          </label>
          <select id={ids.state} value={state} onChange={(e) => setState(e.target.value)} className="field mt-1">
            <option value="all">{tx(locale, "All")} ({states.length})</option>
            {states.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.kind} className="label">
            {tx(locale, "Facility type")}
          </label>
          <select id={ids.kind} value={kind} onChange={(e) => setKind(e.target.value)} className="field mt-1">
            {KINDS.map((k) => (
              <option key={k.id} value={k.id}>
                {tx(locale, k.label)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={ids.cap} className="label">
            {tx(locale, "Testing capability")}
          </label>
          <select id={ids.cap} value={cap} onChange={(e) => setCap(e.target.value)} className="field mt-1">
            {CAPS.map((c) => (
              <option key={c} value={c}>
                {c === "all" ? tx(locale, "All capabilities") : tx(locale, categoryLabel(c))}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline justify-between gap-3 py-4">
        <h2 className="text-sm font-semibold" aria-live="polite">
          {status === "loading"
            ? tx(locale, "Searching…")
            : status === "error"
              ? tx(locale, "Search failed")
              : `${formatCount(labs.length)} ${tx(locale, labs.length === 1 ? "facility" : "facilities")}`}
        </h2>
        {status === "ready" && labs.length > 0 && (
          <p className="text-xs text-muted">
            {Object.entries(counts)
              .sort((a, b) => b[1] - a[1])
              .map(([k, n]) => `${formatCount(n)} ${tx(locale, k === "AHC" ? "hallmarking centres" : k === "BIS Laboratory" ? "BIS laboratories" : k === "Recognized Laboratory" ? "Recognized laboratories" : k)}`)
              .join(" · ")}
          </p>
        )}
      </div>

      {status === "error" && (
        <Notice
          tone="danger"
          title={tx(locale, "The directory did not respond.")}
          action={
            <button type="button" onClick={() => setAttempt((a) => a + 1)} className="btn btn-secondary btn-sm">
              {tx(locale, "Try again")}
            </button>
          }
        >
          {tx(locale, "Your filters are kept.")}
        </Notice>
      )}

      {status === "ready" && labs.length === 0 && (
        <EmptyState title={tx(locale, "No facility matches these filters")}>
          {tx(locale, "Widen the search: choose all states, or a broader capability.")} {" "}
          <button type="button" onClick={reset} className="link">
            {tx(locale, "Reset all filters")}
          </button>
        </EmptyState>
      )}

      {labs.length > 0 && status !== "error" && (
        <div className={`overflow-hidden rounded-lg border border-rule bg-surface transition-opacity ${status === "loading" ? "opacity-50" : ""}`}>
          <table className="w-full border-collapse text-left">
            <caption className="sr-only">{tx(locale, "Testing facilities")}</caption>
            <thead className="hidden bg-sunken text-xs text-muted md:table-header-group">
              <tr className="border-b border-rule">
                <th scope="col" className="px-4 py-2.5 font-medium">{tx(locale, "Facility")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{tx(locale, "Location")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{tx(locale, "Tests")}</th>
                <th scope="col" className="px-4 py-2.5 font-medium">{tx(locale, "Contact")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-rule">
              {labs.slice(0, shown).map((l) => (
                <tr key={l.id} className="block px-4 py-4 md:table-row md:p-0">
                  <th scope="row" className="block text-left font-normal md:table-cell md:w-[30%] md:px-4 md:py-3.5 md:align-top">
                    <span className="block text-base font-medium leading-snug text-ink">{l.name}</span>
                    <span className={`tag mt-1.5 ${l.kind === "BIS Laboratory" ? "tag-select" : ""}`}>
                      {tx(locale, l.kind === "AHC" ? "Hallmarking centre" : l.kind)}
                    </span>
                  </th>
                  <td className="mt-2 block text-sm text-body md:mt-0 md:table-cell md:px-4 md:py-3.5 md:align-top">
                    {l.city}, {l.state}
                  </td>
                  <td className="mt-1 block text-sm text-body md:mt-0 md:table-cell md:px-4 md:py-3.5 md:align-top">
                    {(l.capabilities ?? []).map((c) => tx(locale, categoryLabel(c))).join(", ")}
                    {l.standards?.length > 0 && (
                      <span className="mt-1 block text-xs text-muted">
                        {tx(locale, "e.g.")} <span className="id">{l.standards.slice(0, 2).join(", ")}</span>
                      </span>
                    )}
                  </td>
                  <td className="mt-2 block text-sm md:mt-0 md:table-cell md:w-[24%] md:px-4 md:py-3.5 md:align-top">
                    {l.phone && (
                      <a href={`tel:${l.phone.replace(/[^\d+]/g, "")}`} className="block text-body hover:text-ink">
                        {l.phone}
                      </a>
                    )}
                    {l.email && (
                      <a href={`mailto:${l.email}`} className="block text-body [overflow-wrap:anywhere] hover:text-ink">
                        {l.email}
                      </a>
                    )}
                    {!l.phone && !l.email && <span className="text-muted">{tx(locale, "Not listed")}</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {status === "ready" && shown < labs.length && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <button type="button" onClick={() => setShown((n) => n + PAGE)} className="btn btn-secondary">
            {tx(locale, "Show")} {Math.min(PAGE, labs.length - shown)} {tx(locale, "more")}
          </button>
          <span className="text-xs text-muted">
            {tx(locale, "Showing")} {formatCount(shown)} {tx(locale, "of")} {formatCount(labs.length)}
          </span>
        </div>
      )}
    </div>
  );
}
