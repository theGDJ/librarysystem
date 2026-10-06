"use client";

import { useId, useState } from "react";
import { Copy, Check } from "lucide-react";
import { Notice, Spinner, TierLabel } from "@/components/ui";
import { useLocale } from "@/lib/locale-context";
import { tx } from "@/lib/i18n";
import { ScanMark } from "@/components/ScanMark";

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
  isi: "ISI product licence",
  crs: "CRS registration",
  jeweller: "BIS-registered jeweller",
  huid: "Gold or silver HUID",
};

const STATUS: Record<string, { label: string; cls: string; advice?: string }> = {
  valid: { label: "Valid", cls: "tag-ok" },
  suspended: {
    label: "Suspended",
    cls: "tag-qco",
    advice: "Marking must stop while a licence is suspended. Do not rely on the product's claim, and report it.",
  },
  expired: {
    label: "Expired",
    cls: "tag-danger",
    advice: "The licence is no longer in force. Products marked after expiry are not certified. Report it.",
  },
};

const SAMPLES = ["CM/L-7200045182", "R-41008720411", "HM/C-729001188", "A3K9P2"];

export function Verify() {
  const { locale } = useLocale();
  const [number, setNumber] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<{ found: boolean; results?: VerifyResult[]; number?: string } | null>(null);
  const inputId = useId();

  async function run(n: string) {
    const v = n.trim();
    if (busy) return;
    if (v.length < 4) {
      setError(tx(locale, "Enter at least 4 characters of the number printed on the product."));
      return;
    }
    setBusy(true);
    setError(null);
    setState(null);
    try {
      const res = await fetch("/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ number: v }),
      });
      if (!res.ok) throw new Error();
      setState(await res.json());
    } catch {
      setError(tx(locale, "The registry did not respond. Try again in a moment."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="verify-h">
      <h2 id="verify-h" className="text-xl font-bold tracking-[-0.02em]">
        {tx(locale, "Check a licence, registration or HUID")}
      </h2>
      <p className="mt-2 max-w-[56ch] text-base text-muted">
        {tx(locale, "Enter the number printed with the mark: an ISI licence (CM/L-…), a CRS registration (R-…), a jeweller registration (HM/C-…) or a six-character gold HUID.")}
      </p>
      <form
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          run(number);
        }}
        className="mt-5"
      >
        <label htmlFor={inputId} className="text-sm font-semibold text-ink">
          {tx(locale, "Mark number")}
        </label>
        <div className="mt-1.5 flex flex-col gap-2 sm:flex-row">
          <input
            id={inputId}
            value={number}
            onChange={(e) => {
              setNumber(e.target.value);
              if (error) setError(null);
            }}
            placeholder="CM/L-7200045182"
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-err` : undefined}
            autoCapitalize="characters"
            spellCheck={false}
            className="field id text-base tracking-wide"
          />
          <button type="submit" disabled={busy} className="btn btn-primary shrink-0">
            {busy ? tx(locale, "Checking…") : tx(locale, "Check number")}
          </button>
        </div>
        {error && (
          <p id={`${inputId}-err`} className="mt-1.5 text-sm text-danger">
            {error}
          </p>
        )}
      </form>
      <ScanMark />
      <p className="mt-3 text-sm text-muted">
        {tx(locale, "Sample numbers from the demo registry:")} {" "}
        {SAMPLES.map((s, i) => (
          <span key={s}>
            <button
              type="button"
              onClick={() => {
                setNumber(s);
                run(s);
              }}
              className="id underline decoration-rule-strong underline-offset-[3px] hover:decoration-select"
            >
              {s}
            </button>
            {i < SAMPLES.length - 1 ? ", " : ""}
          </span>
        ))}
      </p>

      <div aria-live="polite" className="mt-6">
        {busy && <Spinner label={tx(locale, "Checking the registry")} />}
        {state?.found &&
          state.results!.map((r) => {
            const st = STATUS[r.status] ?? { label: r.status, cls: "" };
            return (
              <div key={r.markNo} className="sheet mb-3 px-5 py-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <TierLabel tier="record" note={tx(locale, "Demo registry, not the official BIS database")} />
                  <span className={`tag ${st.cls}`}>{st.label}</span>
                </div>
                <p className="id mt-3 text-base">{r.markNo}</p>
                <p className="mt-1 text-base font-semibold text-ink">{r.holder}</p>
                <p className="text-sm text-body">{r.product}</p>
                <dl className="mt-3 grid grid-cols-[100px_1fr] gap-x-3 gap-y-1 text-sm">
                  <dt className="text-muted">{tx(locale, "Type")}</dt>
                  <dd className="text-ink">{tx(locale, TYPE_LABEL[r.type] ?? r.type)}</dd>
                  <dt className="text-muted">{tx(locale, "Standard")}</dt>
                  <dd className="id">{r.standardCode ?? tx(locale, "Not recorded")}</dd>
                  <dt className="text-muted">{tx(locale, "Issued")}</dt>
                  <dd className="text-ink">{r.issuedOn}</dd>
                  <dt className="text-muted">{tx(locale, "Valid until")}</dt>
                  <dd className="text-ink">{r.validTill === "9999-12-31" ? tx(locale, "Life of the article") : r.validTill}</dd>
                  <dt className="text-muted">{tx(locale, "Location")}</dt>
                  <dd className="text-ink">{r.city}</dd>
                </dl>
                {st.advice && (
                  <div className="mt-4">
                    <Notice tone={r.status === "expired" ? "danger" : "attention"} title={tx(locale, "This mark is not currently valid.")}>
                      {tx(locale, st.advice)}
                    </Notice>
                  </div>
                )}
              </div>
            );
          })}
        {state && !state.found && (
          <Notice tone="attention" title={`${tx(locale, "No record for")} “${state.number ?? number.trim().toUpperCase()}”`}>
            {tx(locale, "Check the number for typing errors. If it is correct and the product falls under a Quality Control Order, the mark may be misused: report it below, in the BIS Care app or on the consumer helpline 1915.")}
          </Notice>
        )}
      </div>
    </section>
  );
}

type Form = { name: string; email: string; category: string; product: string; description: string };
const EMPTY: Form = { name: "", email: "", category: "fake-mark", product: "", description: "" };

function validate(f: Form, locale: "en" | "hi"): Partial<Record<keyof Form, string>> {
  const e: Partial<Record<keyof Form, string>> = {};
  if (!f.name.trim()) e.name = tx(locale, "Enter your name.");
  if (!/^\S+@\S+\.\S+$/.test(f.email.trim())) e.email = tx(locale, "Enter an email address, like name@example.com.");
  if (!f.product.trim()) e.product = tx(locale, "Name the product and brand.");
  if (f.description.trim().length < 20)
    e.description = `${tx(locale, "Describe what you observed in at least 20 characters")} (${f.description.trim().length} ${tx(locale, "so far")}).`;
  return e;
}

export function ComplaintForm() {
  const { locale } = useLocale();
  const [form, setForm] = useState<Form>(EMPTY);
  const [touched, setTouched] = useState<Partial<Record<keyof Form, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [ticket, setTicket] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const base = useId();

  const errors = validate(form, locale);
  const show = (k: keyof Form) => (submitted || touched[k]) && errors[k];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    if (busy || Object.keys(errors).length) {
      const firstBad = (Object.keys(errors) as (keyof Form)[])[0];
      if (firstBad) document.getElementById(`${base}-${firstBad}`)?.focus();
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/complaints", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? tx(locale, "The complaint could not be registered."));
      setTicket(data.ticket);
    } catch (err) {
      setError(err instanceof Error ? tx(locale, err.message) : tx(locale, "The complaint could not be registered."));
    } finally {
      setBusy(false);
    }
  }

  if (ticket) {
    return (
      <section aria-labelledby="ticket-h" className="sheet px-6 py-6" role="status">
        <h2 id="ticket-h" className="text-xl font-bold tracking-[-0.02em]">
          {tx(locale, "Complaint registered")}
        </h2>
        <p className="mt-2 text-base text-body">{tx(locale, "Quote this ticket number in any follow-up.")}</p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="id rounded-md bg-ok-soft px-4 py-2 text-lg text-ok-ink">{ticket}</span>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => {
              navigator.clipboard?.writeText(ticket).then(() => setCopied(true), () => {});
            }}
          >
            {copied ? <Check className="size-3.5" aria-hidden="true" /> : <Copy className="size-3.5" aria-hidden="true" />}
            {copied ? tx(locale, "Copied") : tx(locale, "Copy number")}
          </button>
        </div>
        <p className="mt-4 text-sm text-muted">
          {tx(locale, "In this demonstration the complaint is stored in Pramaan's database. For an official grievance, also use the BIS Care app or call 1915.")}
        </p>
        <button
          type="button"
          onClick={() => {
            setTicket(null);
            setForm(EMPTY);
            setTouched({});
            setSubmitted(false);
            setCopied(false);
          }}
          className="link mt-5 text-sm"
        >
          {tx(locale, "Report another product")}
        </button>
      </section>
    );
  }

  const field = (k: keyof Form, label: string, input: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`${base}-${k}`} className="text-sm font-semibold text-ink">
        {label}
      </label>
      {hint && (
        <p id={`${base}-${k}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
      <div className="mt-1.5">{input}</div>
      {show(k) && (
        <p id={`${base}-${k}-err`} className="mt-1 text-sm text-danger">
          {errors[k]}
        </p>
      )}
    </div>
  );

  const common = (k: keyof Form) => ({
    id: `${base}-${k}`,
    value: form[k],
    onBlur: () => setTouched((t) => ({ ...t, [k]: true })),
    "aria-invalid": !!show(k),
    "aria-describedby": show(k) ? `${base}-${k}-err` : undefined,
    className: "field",
  });

  return (
    <section aria-labelledby="complaint-h">
      <h2 id="complaint-h" className="text-xl font-bold tracking-[-0.02em]">
        {tx(locale, "Report a product")}
      </h2>
      <p className="mt-2 max-w-[56ch] text-base text-muted">
        {tx(locale, "Fake ISI or CRS marks, unhallmarked gold in a notified district, or a Sold without certification.")}
      </p>
      <form noValidate onSubmit={submit} className="mt-5 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          {field("name", tx(locale, "Your name"), <input {...common("name")} autoComplete="name" onChange={(e) => setForm({ ...form, name: e.target.value })} />)}
          {field(
            "email",
            tx(locale, "Email"),
            <input {...common("email")} type="email" autoComplete="email" onChange={(e) => setForm({ ...form, email: e.target.value })} />,
          )}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {field(
            "category",
            tx(locale, "What is the problem?"),
            <select {...common("category")} onChange={(e) => setForm({ ...form, category: e.target.value })}>
              <option value="fake-mark">{tx(locale, "Fake ISI or CRS mark")}</option>
              <option value="hallmark">{tx(locale, "Hallmark or HUID issue")}</option>
              <option value="qco-uncertified">{tx(locale, "Sold without certification")}</option>
              <option value="quality">{tx(locale, "Certified product failed")}</option>
              <option value="other">{tx(locale, "Something else")}</option>
            </select>,
          )}
          {field(
            "product",
            tx(locale, "Product and brand"),
            <input {...common("product")} placeholder="XYZ cables, 1.5 sq mm" onChange={(e) => setForm({ ...form, product: e.target.value })} />,
          )}
        </div>
        {field(
          "description",
          tx(locale, "What did you observe?"),
          <textarea
            {...common("description")}
            rows={5}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />,
          tx(locale, "Where you bought it, the licence or HUID number you saw, and what looked wrong."),
        )}
        {error && <Notice tone="danger" title={error} />}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-sm text-muted">{tx(locale, "You can also call the consumer helpline 1915.")}</p>
          <button type="submit" disabled={busy} className="btn btn-primary">
            {busy ? tx(locale, "Registering…") : tx(locale, "Register complaint")}
          </button>
        </div>
      </form>
    </section>
  );
}
