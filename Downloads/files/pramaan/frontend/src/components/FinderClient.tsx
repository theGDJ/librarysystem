"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  PackageSearch,
  ShieldCheck,
  AlertTriangle,
  FlaskConical,
  MapPin,
  BadgeCheck,
  ArrowRight,
  CircleCheck,
  Loader2,
} from "lucide-react";

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
    label: string;
    mandatory: boolean;
    schemeLabel: string;
    note: string;
    steps: { title: string; desc: string }[];
    timeline: string;
  };
  standards: Std[];
  labs: Lab[];
};

const PRESETS = [
  "electric ceiling fan",
  "gold bangle",
  "laptop adapter",
  "TMT steel bar",
  "packaged drinking water",
  "pressure cooker",
  "LED bulb",
  "toys for children",
  "HDPE water pipe",
  "इस्पात सरिया",
];

export function FinderClient() {
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [data, setData] = useState<{ matched: boolean; results: Result[] } | null>(null);

  async function run(query: string) {
    if (!query.trim() || busy) return;
    setBusy(true);
    setData(null);
    try {
      const res = await fetch("/api/finder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query }),
      });
      setData(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      {/* search */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(q);
        }}
        className="flex w-full items-center gap-2 rounded-2xl border border-line bg-ink-850/90 p-2 backdrop-blur focus-within:border-gold-500/60"
      >
        <PackageSearch className="ml-3 size-5 shrink-0 text-gold-400" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Describe your product — material, use, sector… e.g. “PVC insulated house wiring cable”"
          className="w-full bg-transparent px-2 py-3 text-[15px] text-white placeholder:text-ash-500"
        />
        <button type="submit" disabled={busy} className="btn-gold shrink-0 px-5 py-3 text-sm disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
          Identify
        </button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => {
              setQ(p);
              run(p);
            }}
            className="chip card-hover py-1.5 text-[12px] text-ash-300 hover:border-gold-500/50 hover:text-gold-200"
          >
            {p}
          </button>
        ))}
      </div>

      {/* results */}
      <AnimatePresence mode="wait">
        {data && !data.matched && (
          <motion.div
            key="nomatch"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="panel mt-10 flex items-start gap-4 p-6"
          >
            <AlertTriangle className="mt-0.5 size-5 text-coral-400" />
            <div>
              <h3 className="font-semibold text-white">No confident mapping found</h3>
              <p className="mt-1 text-sm text-ash-400">
                Try a concrete product name (e.g. “cement”, “helmet”, “smart meter”) — the engine caches
                20+ regulated product families. You can also ask the assistant directly for ambiguous cases.
              </p>
            </div>
          </motion.div>
        )}

        {data?.matched &&
          data.results.map((r, idx) => (
            <motion.div
              key={r.profile.label + idx}
              initial={{ opacity: 0, y: 28, filter: "blur(6px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              transition={{ duration: 0.7, delay: idx * 0.12, ease: [0.22, 1, 0.36, 1] }}
              className="mt-10 space-y-4"
            >
              {/* verdict */}
              <div className="panel relative overflow-hidden p-7">
                <div className="glow-gold absolute -right-20 -top-24 h-64 w-64" />
                <div className="relative flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="kicker mb-2">PRODUCT VERDICT</div>
                    <h2 className="font-display text-3xl font-semibold text-white">{r.profile.label}</h2>
                    <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-ash-300">{r.profile.note}</p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {r.profile.mandatory ? (
                      <span className="chip chip-coral inline-flex items-center gap-1.5 py-1.5">
                        <AlertTriangle className="size-3.5" /> MANDATORY · QCO APPLIES
                      </span>
                    ) : (
                      <span className="chip chip-jade inline-flex items-center gap-1.5 py-1.5">
                        <CircleCheck className="size-3.5" /> VOLUNTARY CERTIFICATION
                      </span>
                    )}
                    <span className="chip chip-gold inline-flex items-center gap-1.5 py-1.5">
                      <ShieldCheck className="size-3.5" /> {r.profile.schemeLabel}
                    </span>
                    <span className="mono text-[11px] text-ash-500">{r.profile.timeline}</span>
                  </div>
                </div>
              </div>

              {/* standards */}
              <div className="grid gap-4 lg:grid-cols-2">
                <div className="panel-flat p-6">
                  <div className="kicker mb-4">APPLICABLE INDIAN STANDARDS</div>
                  {r.standards.length === 0 ? (
                    <p className="text-sm text-ash-400">
                      Referenced in the profile but not present in the seeded catalogue — query the
                      Standards explorer for full text once synced with the BIS catalogue.
                    </p>
                  ) : (
                    <div className="space-y-3">
                      {r.standards.map((s) => (
                        <div key={s.id} className="rounded-xl border border-line bg-ink-900/70 p-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <span className="mono text-[13px] font-semibold text-gold-200">{s.code}</span>
                            {s.mandatory && <span className="chip chip-coral py-0.5 text-[10px]">MANDATORY</span>}
                          </div>
                          <div className="mt-1.5 text-[13.5px] font-medium text-white">{s.title}</div>
                          <p className="mt-1.5 line-clamp-2 text-[12.5px] leading-relaxed text-ash-400">{s.summary}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* steps */}
                <div className="panel-flat p-6">
                  <div className="kicker mb-5">CERTIFICATION PATH</div>
                  <ol className="relative space-y-5">
                    {r.profile.steps.map((s, i) => (
                      <li key={s.title} className="relative flex gap-4">
                        {i < r.profile.steps.length - 1 && (
                          <span className="absolute left-[13px] top-8 h-[calc(100%-8px)] w-px bg-line" />
                        )}
                        <span className="mono z-10 grid size-7 shrink-0 place-items-center rounded-lg border border-gold-500/40 bg-ink-900 text-[11px] text-gold-300">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <div>
                          <div className="text-[13.5px] font-semibold text-white">{s.title}</div>
                          <div className="mt-0.5 text-[12.5px] leading-relaxed text-ash-400">{s.desc}</div>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>
              </div>

              {/* labs */}
              <div className="panel-flat p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="kicker">LABS THAT TEST THIS FAMILY</div>
                  <a href="/labs" className="mono flex items-center gap-1 text-[11px] text-gold-300">
                    ALL LABS <ArrowRight className="size-3" />
                  </a>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {r.labs.map((l) => (
                    <div key={l.id} className="card-hover rounded-xl border border-line bg-ink-900/70 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <FlaskConical className="size-4 text-gold-400" />
                        <span className="chip py-0.5 text-[10px]">{l.kind}</span>
                      </div>
                      <div className="mt-2.5 text-[13.5px] font-semibold text-white">{l.name}</div>
                      <div className="mt-1 flex items-center gap-1 text-[12px] text-ash-400">
                        <MapPin className="size-3" /> {l.city}, {l.state}
                      </div>
                      <div className="mono mt-2 truncate text-[10.5px] text-ash-500">
                        {(l.standards ?? []).slice(0, 3).join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>

      {!data && !busy && (
        <div className="mt-14 grid place-items-center rounded-2xl border border-dashed border-line py-16 text-center">
          <BadgeCheck className="size-8 text-ash-500" strokeWidth={1.4} />
          <p className="mt-4 max-w-md text-sm text-ash-500">
            Type a product description above — Pramaan maps it to applicable Indian Standards,
            the correct certification scheme, the step-by-step path and compatible test labs.
          </p>
        </div>
      )}
    </div>
  );
}
