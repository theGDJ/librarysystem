"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, BookMarked, ChevronRight, X } from "lucide-react";

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

const CATS: { id: string; label: string }[] = [
  { id: "all", label: "All" },
  { id: "construction", label: "Construction" },
  { id: "electrical", label: "Electrical" },
  { id: "electronics", label: "Electronics / CRS" },
  { id: "hallmark", label: "Hallmarking" },
  { id: "food", label: "Food & Water" },
  { id: "plastics", label: "Plastics" },
  { id: "mechanical", label: "Mechanical" },
  { id: "consumer", label: "Consumer" },
];

export function StandardsClient({ initial }: { initial: Std[] }) {
  const [items, setItems] = useState(initial);
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("all");
  const [mandOnly, setMandOnly] = useState(false);
  const [active, setActive] = useState<Std | null>(null);

  useEffect(() => {
    const ctl = new AbortController();
    const run = async () => {
      const sp = new URLSearchParams();
      if (q.trim()) sp.set("q", q.trim());
      if (cat !== "all") sp.set("category", cat);
      if (mandOnly) sp.set("mandatory", "true");
      const res = await fetch(`/api/standards?${sp.toString()}`, { signal: ctl.signal });
      const data = await res.json();
      setItems(data.standards);
    };
    const id = setTimeout(run, 180);
    return () => {
      clearTimeout(id);
      ctl.abort();
    };
  }, [q, cat, mandOnly]);

  const counts = useMemo(() => items.length, [items]);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
      <div>
        {/* controls */}
        <div className="panel mb-5 flex flex-col gap-4 p-5">
          <div className="flex items-center gap-2 rounded-xl border border-line bg-ink-900/80 px-3 focus-within:border-gold-500/60">
            <Search className="size-4 text-ash-500" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search code, title, keyword — try “cement”, “IS 694”, “helmet”…"
              className="w-full bg-transparent py-3 text-sm text-white placeholder:text-ash-500"
            />
            <label className="chip flex cursor-pointer items-center gap-2 py-1.5">
              <input
                type="checkbox"
                checked={mandOnly}
                onChange={(e) => setMandOnly(e.target.checked)}
                className="size-3 accent-gold-400"
              />
              QCO only
            </label>
          </div>
          <div className="flex flex-wrap gap-2">
            {CATS.map((c) => (
              <button
                key={c.id}
                onClick={() => setCat(c.id)}
                className={`chip py-1.5 transition-colors ${
                  cat === c.id ? "chip-gold" : "text-ash-400 hover:text-gold-200"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mono mb-3 text-[11px] tracking-[0.18em] text-ash-500">
          {counts} STANDARD{counts === 1 ? "" : "S"} RETRIEVED
        </div>

        <div className="space-y-2.5">
          {items.map((s) => (
            <button
              key={s.id}
              onClick={() => setActive(s)}
              className={`card-hover group flex w-full items-center justify-between gap-4 rounded-xl border p-4 text-left ${
                active?.id === s.id ? "border-gold-500/60 bg-gold-400/5" : "border-line bg-ink-850/70"
              }`}
            >
              <div className="flex items-center gap-4">
                <span className="grid size-10 shrink-0 place-items-center rounded-lg border border-line bg-ink-900">
                  <BookMarked className="size-4 text-gold-400" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="mono text-[13px] font-semibold text-gold-200">{s.code}</span>
                    {s.mandatory && <span className="chip chip-coral py-0.5 text-[9.5px]">QCO</span>}
                    <span className="chip py-0.5 text-[9.5px]">{s.category}</span>
                  </div>
                  <div className="mt-1 text-[13.5px] leading-snug text-ash-300">{s.title}</div>
                </div>
              </div>
              <ChevronRight className="size-4 shrink-0 text-ash-500 transition-transform group-hover:translate-x-1 group-hover:text-gold-300" />
            </button>
          ))}
          {items.length === 0 && (
            <div className="rounded-xl border border-dashed border-line py-12 text-center text-sm text-ash-500">
              No standards match — clear filters or widen the search.
            </div>
          )}
        </div>
      </div>

      {/* detail */}
      <div className="max-lg:order-first">
        {active ? (
          <div className="panel sticky top-28 p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="mono text-[15px] font-semibold text-gold-200">{active.code}</div>
                <h3 className="mt-1.5 text-[16px] font-semibold leading-snug text-white">{active.title}</h3>
              </div>
              <button onClick={() => setActive(null)} className="btn-ghost grid size-8 shrink-0 place-items-center rounded-lg">
                <X className="size-4" />
              </button>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5">
              <span className={`chip py-1 ${active.mandatory ? "chip-coral" : "chip-jade"}`}>
                {active.mandatory ? "MANDATORY (QCO)" : "VOLUNTARY"}
              </span>
              <span className="chip py-1">{active.status}</span>
              <span className="chip py-1">{active.editions} revision(s)</span>
            </div>
            {active.qco && (
              <div className="mono mt-3 rounded-lg border border-coral-400/30 bg-coral-400/5 px-3 py-2 text-[11px] text-coral-400">
                {active.qco}
              </div>
            )}

            <p className="mt-4 text-[13.5px] leading-relaxed text-ash-300">{active.summary}</p>

            <div className="kicker mt-6 mb-3">KEY CLAUSES</div>
            <div className="space-y-2">
              {active.sections.map((sec) => (
                <div key={sec.clause} className="rounded-lg border border-line bg-ink-900/70 p-3">
                  <div className="mono text-[11px] text-gold-300">CLAUSE {sec.clause}</div>
                  <div className="mt-0.5 text-[13px] font-medium text-white">{sec.title}</div>
                  <div className="mt-1 text-[12px] leading-relaxed text-ash-400">{sec.summary}</div>
                </div>
              ))}
            </div>

            {active.related.length > 0 && (
              <>
                <div className="kicker mt-6 mb-3">RELATED</div>
                <div className="flex flex-wrap gap-1.5">
                  {active.related.map((r) => (
                    <span key={r} className="chip py-1 text-[10.5px]">{r}</span>
                  ))}
                </div>
              </>
            )}

            <div className="mono mt-6 rounded-lg border border-line bg-ink-900 p-3 text-[11px] leading-relaxed text-ash-500">
              SCHEME: {active.scheme}
            </div>
          </div>
        ) : (
          <div className="panel-flat sticky top-28 grid place-items-center p-10 text-center">
            <BookMarked className="size-8 text-ash-500" strokeWidth={1.4} />
            <p className="mt-4 max-w-xs text-sm text-ash-500">
              Select any standard to inspect its clauses, certification status and related codes.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
