"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav, Footer } from "@/components/Chrome";
import {
  ScanSearch,
  ShieldAlert,
  BadgeCheck,
  Gem,
  CircleAlert,
  SendHorizonal,
  Loader2,
  TicketCheck,
  Phone,
} from "lucide-react";

type VerifyResult = {
  markNo: string;
  type: string;
  holder: string;
  product: string;
  standardCode: string | null;
  status: string;
  issuedOn: string;
  validTill: string;
  city: string;
};

const TYPE_LABEL: Record<string, string> = {
  isi: "ISI Product Licence",
  crs: "CRS Registration",
  jeweller: "BIS-registered Jeweller",
  huid: "Gold/Silver HUID",
};

const SAMPLES = ["CM/L-7200045182", "R-41008720411", "HM/C-729001188", "A3K9P2"];

function Verify() {
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [state, setState] = useState<{ found: boolean; results?: VerifyResult[]; number?: string } | null>(null);

  async function run(n: string) {
    if (!n.trim() || busy) return;
    setBusy(true);
    setState(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: n }),
      });
      setState(await res.json());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel p-7">
      <div className="kicker mb-2 flex items-center gap-2">
        <ScanSearch className="size-4" /> VERIFY A MARK
      </div>
      <h2 className="font-display text-2xl font-semibold text-white">Is that mark genuine?</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ash-400">
        Enter an ISI licence (CM/L-…), CRS number (R-…), jeweller registration (HM/C-…) or a gold HUID.
        This demo registry mirrors what the BIS Care App validates.
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          run(number);
        }}
        className="mt-5 flex items-center gap-2 rounded-xl border border-line bg-ink-900 p-1.5 focus-within:border-gold-500/60"
      >
        <input
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          placeholder="e.g. A3K9P2 or CM/L-7200045182"
          className="mono w-full bg-transparent px-3 py-2.5 text-sm tracking-wider text-white placeholder:text-ash-500"
        />
        <button type="submit" disabled={busy} className="btn-gold shrink-0 px-4 py-2.5 text-[13px] disabled:opacity-40">
          {busy ? <Loader2 className="size-4 animate-spin" /> : "Verify"}
        </button>
      </form>
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SAMPLES.map((s) => (
          <button
            key={s}
            onClick={() => {
              setNumber(s);
              run(s);
            }}
            className="chip py-1 text-[10.5px] text-ash-400 hover:text-gold-200"
          >
            {s}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {state && (
          <motion.div
            key={state.found ? "found" : "missing"}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6"
          >
            {state.found ? (
              <div className="space-y-3">
                {state.results!.map((r) => (
                  <div key={r.markNo} className="rounded-xl border border-jade-500/40 bg-jade-500/5 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="mono text-[13px] font-semibold text-jade-300">{r.markNo}</span>
                      <span
                        className={`chip py-1 text-[10px] ${
                          r.status === "valid" ? "chip-jade" : "chip-coral"
                        }`}
                      >
                        {r.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-1 text-[14px] font-semibold text-white">{r.holder}</div>
                    <div className="mt-1 text-[13px] text-ash-300">{r.product}</div>
                    <div className="mono mt-3 grid gap-1.5 text-[11px] text-ash-500 sm:grid-cols-2">
                      <span>TYPE · {TYPE_LABEL[r.type] ?? r.type}</span>
                      <span>STANDARD · {r.standardCode ?? "—"}</span>
                      <span>ISSUED · {r.issuedOn}</span>
                      <span>VALID TILL · {r.validTill === "9999-12-31" ? "Perpetual (article)" : r.validTill}</span>
                      <span>LOCATION · {r.city}</span>
                    </div>
                    {r.status !== "valid" && (
                      <div className="mt-3 flex items-center gap-2 rounded-lg border border-coral-400/40 bg-coral-400/10 px-3 py-2 text-[12px] text-coral-400">
                        <CircleAlert className="size-4" />
                        This mark is not currently valid — do not rely on the product&apos;s claim; report it below.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-xl border border-coral-400/40 bg-coral-400/5 p-5">
                <ShieldAlert className="mt-0.5 size-5 shrink-0 text-coral-400" />
                <div>
                  <div className="text-[14px] font-semibold text-white">No record for “{state.number}”</div>
                  <p className="mt-1 text-[13px] leading-relaxed text-ash-400">
                    The mark could not be verified. For QCO products this means the claim is likely
                    misused — file a complaint below or via the BIS Care App / helpline 1915.
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ComplaintForm() {
  const [form, setForm] = useState({ name: "", email: "", category: "fake-mark", product: "", description: "" });
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed");
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to register");
    } finally {
      setBusy(false);
    }
  }

  if (ticket) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel grid place-items-center p-10 text-center"
      >
        <TicketCheck className="size-9 text-jade-400" strokeWidth={1.5} />
        <h3 className="font-display mt-4 text-2xl font-semibold text-white">Complaint registered</h3>
        <p className="mt-2 max-w-sm text-[13.5px] text-ash-400">
          Your grievance is now in the BIS enforcement workflow. Quote this ticket in follow-ups.
        </p>
        <div className="mono mt-5 rounded-xl border border-jade-500/40 bg-jade-500/10 px-5 py-3 text-lg tracking-[0.18em] text-jade-300">
          {ticket}
        </div>
        <button onClick={() => { setTicket(null); setForm({ name: "", email: "", category: "fake-mark", product: "", description: "" }); }} className="btn-ghost mt-6 px-5 py-2.5 text-[13px]">
          File another complaint
        </button>
      </motion.div>
    );
  }

  return (
    <div className="panel p-7">
      <div className="kicker mb-2 flex items-center gap-2">
        <ShieldAlert className="size-4" /> REPORT MISUSE
      </div>
      <h2 className="font-display text-2xl font-semibold text-white">File a consumer complaint</h2>
      <p className="mt-2 text-[13px] leading-relaxed text-ash-400">
        Fake ISI marks, non-hallmarked gold in notified districts, QCO products sold without certification —
        details go straight to the enforcement log.
      </p>

      <form onSubmit={submit} className="mt-5 space-y-3.5">
        <div className="grid gap-3.5 sm:grid-cols-2">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Your name"
            className="rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-ash-500"
          />
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Email address"
            className="rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-ash-500"
          />
        </div>
        <div className="grid gap-3.5 sm:grid-cols-2">
          <select
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
            className="rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-ash-300"
          >
            <option value="fake-mark">Suspected fake ISI / CRS mark</option>
            <option value="hallmark">Hallmarking / HUID issue</option>
            <option value="qco-uncertified">QCO product sold without certification</option>
            <option value="quality">Quality failure of certified product</option>
            <option value="other">Other BIS-related grievance</option>
          </select>
          <input
            required
            value={form.product}
            onChange={(e) => setForm({ ...form, product: e.target.value })}
            placeholder="Product & brand (e.g. 'XYZ cables 1.5 sq mm')"
            className="rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-ash-500"
          />
        </div>
        <textarea
          required
          minLength={20}
          rows={4}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Describe what you observed — where purchased, photographs, licence/HUID numbers seen…"
          className="w-full rounded-xl border border-line bg-ink-900 px-4 py-3 text-sm text-white placeholder:text-ash-500"
        />
        {error && <div className="text-[13px] text-coral-400">{error}</div>}
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-[12px] text-ash-500">
            <Phone className="size-3.5" /> Also: NCH 1915 · BIS Care App
          </span>
          <button type="submit" disabled={busy} className="btn-gold px-5 py-3 text-sm disabled:opacity-40">
            {busy ? <Loader2 className="size-4 animate-spin" /> : <SendHorizonal className="size-4" />}
            Register complaint
          </button>
        </div>
      </form>
    </div>
  );
}

const MARK_GUIDE = [
  {
    title: "ISI Standard Mark",
    body: "Always carries the standard number and the CM/L licence number beneath the mark. If either is missing, the mark is being misused.",
    tag: "SCHEME-I",
  },
  {
    title: "CRS Mark",
    body: "Electronics show the Standard Mark with an R-XXXXXXXX registration number on the product and packaging. Cross-check model names.",
    tag: "SCHEME-II",
  },
  {
    title: "Gold Hallmark",
    body: "Three laser marks: BIS triangle, fineness (22K916 / 18K750 / 14K585) and the unique 6-character HUID. Verify HUID before paying.",
    tag: "IS 1417",
  },
];

export default function ConsumerPage() {
  return (
    <>
      <Nav />
      <main className="relative min-h-screen pb-24 pt-36">
        <div className="blueprint pointer-events-none fixed inset-0 opacity-60" />
        <div className="glow-gold pointer-events-none fixed -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 opacity-50" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10">
            <div className="kicker mb-3">CONSUMER CORNER</div>
            <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
              Trust, but <span className="text-gold-300">verify</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ash-400">
              Validation of ISI licences, CRS registrations, jeweller registrations and gold HUIDs —
              plus a direct grievance channel, mirroring the BIS Care experience.
            </p>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Verify />
            <ComplaintForm />
          </div>

          {/* how to read marks */}
          <div className="mt-12">
            <div className="kicker mb-4 flex items-center gap-2">
              <Gem className="size-4" /> READ THE MARKS LIKE AN INSPECTOR
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {MARK_GUIDE.map((m) => (
                <div key={m.title} className="panel-flat card-hover p-6">
                  <div className="mono text-[10px] tracking-[0.26em] text-gold-400">{m.tag}</div>
                  <h3 className="mt-3 text-[15.5px] font-semibold text-white">{m.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ash-400">{m.body}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel-flat mt-6 flex flex-wrap items-center gap-4 p-6">
            <BadgeCheck className="size-6 text-gold-400" strokeWidth={1.6} />
            <p className="max-w-3xl text-[13px] leading-relaxed text-ash-400">
              <strong className="text-gold-200">Rule of thumb:</strong> for helmets, pressure cookers, toys,
              cables, plugs, fans and packaged water — <strong className="text-white">no ISI mark means it cannot legally be sold.</strong>{" "}
              Spot one? Verify the number above, then report. Misuse of the Standard Mark is punishable under
              the BIS Act, 2016 (fine up to ₹5 lakh and/or imprisonment).
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
