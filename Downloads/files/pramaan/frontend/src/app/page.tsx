import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";
import { Reveal, AskBar } from "@/components/motion";
import { db } from "@/db";
import { standards, labs, licences, chatMessages } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import {
  ArrowUpRight,
  MessagesSquare,
  Wand2,
  BookMarked,
  FlaskConical,
  Gem,
  ShieldCheck,
  Languages,
  FileCheck2,
  ScanSearch,
  Siren,
  Database,
  BrainCircuit,
  Quote,
  CheckCircle2,
} from "lucide-react";

export const dynamic = "force-dynamic";

const MARQUEE = [
  "IS 456:2000", "IS 269:2015", "IS 1786:2008", "IS 694:2010", "IS 1417:2016 · HUID",
  "IS 13252-1:2010", "IS 4151:2015", "IS 2347:2017", "IS 14543:2016", "IS 9873-1:2019",
  "IS 16102-1:2012", "IS 16046:2018", "IS 4984:2016", "IS 374:2019", "IS 16444:2015",
];

const CAPABILITIES = [
  {
    icon: MessagesSquare,
    title: "Answers on Indian Standards",
    desc: "Plain-language, clause-cited explanations of any IS — numbering, scope, key provisions.",
    href: "/assistant",
  },
  {
    icon: Wand2,
    title: "Product → Standard recommendation",
    desc: "Describe a product; get applicable standards, QCO status and the right scheme instantly.",
    href: "/finder",
  },
  {
    icon: ShieldCheck,
    title: "Certification scheme guidance",
    desc: "ISI (Scheme-I), CRS (Scheme-II), CoC (Scheme-IV) and FMCS — which one fits, and why.",
    href: "/guide",
  },
  {
    icon: FileCheck2,
    title: "Process walkthroughs",
    desc: "Step-by-step licensing journeys with audits, testing, fees and MSME concessions.",
    href: "/guide",
  },
  {
    icon: Gem,
    title: "Hallmarking, decoded",
    desc: "Gold & silver fineness grades, HUID, jeweller registration and AHC workflows.",
    href: "/consumer",
  },
  {
    icon: FlaskConical,
    title: "Testing laboratory finder",
    desc: "BIS-owned and recognized labs filterable by state and testing capability.",
    href: "/labs",
  },
  {
    icon: ScanSearch,
    title: "Consumer verification",
    desc: "Validate CM/L licences, CRS R-numbers, jeweller registrations and gold HUIDs.",
    href: "/consumer",
  },
  {
    icon: Languages,
    title: "Multilingual interaction",
    desc: "Full English and हिन्दी conversations with auto script detection — more Indic languages ready.",
    href: "/assistant",
  },
];

const PIPELINE = [
  { icon: BrainCircuit, tag: "01 · Understand", text: "Intent + entity engine reads your plain-language query — product names, IS numbers, Hindi or English." },
  { icon: Database, tag: "02 · Retrieve", text: "Scored retrieval across the standards catalogue, scheme documents, processes and lab network." },
  { icon: Quote, tag: "03 · Answer + cite", text: "Composed guidance always carries source references — standard codes, clauses and BIS documents." },
];

export default async function Home() {
  const [stdCount] = await db.select({ c: sql<number>`count(*)` }).from(standards);
  const [mandCount] = await db.select({ c: sql<number>`count(*)` }).from(standards).where(eq(standards.mandatory, true));
  const [labCount] = await db.select({ c: sql<number>`count(*)` }).from(labs);
  const [licCount] = await db.select({ c: sql<number>`count(*)` }).from(licences);
  const [qCount] = await db.select({ c: sql<number>`count(*)` }).from(chatMessages).where(eq(chatMessages.role, "user"));

  const stats = [
    { n: Number(stdCount.c), l: "Indian Standards indexed", mono: "IS CODES" },
    { n: Number(mandCount.c), l: "under mandatory QCOs", mono: "MANDATORY" },
    { n: Number(labCount.c), l: "testing labs & AHCs", mono: "LAB NETWORK" },
    { n: Number(licCount.c), l: "verifiable marks", mono: "REGISTRY" },
    { n: Number(qCount.c), l: "queries answered", mono: "LIVE" },
  ];

  return (
    <>
      <Nav />
      <main className="relative overflow-hidden">
        {/* atmosphere */}
        <div className="blueprint pointer-events-none fixed inset-0 opacity-70" />
        <div className="glow-gold pointer-events-none fixed -top-52 left-1/2 h-[640px] w-[1100px] -translate-x-1/2" />
        <div className="pointer-events-none fixed right-[-180px] top-1/3 h-[420px] w-[420px] rounded-full bg-jade-500/10 blur-[120px]" />

        {/* ------------------------------ HERO ------------------------------ */}
        <section className="relative mx-auto flex min-h-[100svh] max-w-[1400px] flex-col justify-center px-4 pb-16 pt-32 sm:px-6">
          <Reveal>
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <span className="chip chip-gold">Smart India Hackathon 2026</span>
              <span className="chip">Smart Automation</span>
              <span className="chip">Ministry of Consumer Affairs</span>
            </div>
          </Reveal>

          <h1 className="font-display font-semibold leading-[0.95] text-white">
            <Reveal i={1}>
              <span className="block text-[13vw] tracking-tight sm:text-[9vw] lg:text-[7.2vw]">
                Every product,
              </span>
            </Reveal>
            <Reveal i={2}>
              <span className="block text-[13vw] tracking-tight sm:text-[9vw] lg:text-[7.2vw]">
                <span className="bg-gradient-to-r from-gold-200 via-gold-400 to-gold-500 bg-clip-text text-transparent">
                  its pramaan.
                </span>
              </span>
            </Reveal>
          </h1>

          <Reveal i={3}>
            <p className="mt-7 max-w-xl text-base leading-relaxed text-ash-300 sm:text-lg">
              An AI-powered intelligent assistant for{" "}
              <strong className="font-semibold text-gold-200">Indian Standards and BIS services</strong> —
              conversational, source-cited and multilingual. From “which standard applies?”
              to “where do I test it?” — in one question.
            </p>
          </Reveal>

          <Reveal i={4} className="mt-9 max-w-2xl">
            <AskBar big />
            <div className="mt-3 flex flex-wrap gap-2">
              {["Standard for TMT steel", "How to get ISI licence", "Verify a gold HUID", "प्रेशर कुकर का मानक?"].map((s) => (
                <Link
                  key={s}
                  href={`/assistant?q=${encodeURIComponent(s)}`}
                  className="chip card-hover inline-flex items-center gap-1.5 py-1.5 text-ash-300 hover:text-gold-200"
                >
                  {s} <ArrowUpRight className="size-3" />
                </Link>
              ))}
            </div>
          </Reveal>

          {/* stats */}
          <Reveal i={5} className="mt-14">
            <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line sm:grid-cols-5">
              {stats.map((s) => (
                <div key={s.mono} className="bg-ink-900/90 px-5 py-5">
                  <div className="mono mb-2 text-[9px] tracking-[0.22em] text-ash-500">{s.mono}</div>
                  <div className="font-display text-3xl font-semibold text-gold-200">{s.n}</div>
                  <div className="mt-1 text-xs text-ash-400">{s.l}</div>
                </div>
              ))}
            </div>
          </Reveal>

          {/* floating demo card (desktop) */}
          <Reveal i={4} className="pointer-events-none absolute right-6 top-40 hidden w-[380px] xl:block">
            <div className="panel pointer-events-auto rotate-2 p-5" style={{ animation: "floaty 7s ease-in-out infinite" }}>
              <div className="mb-4 flex items-center justify-between">
                <span className="mono text-[10px] tracking-[0.24em] text-gold-400">LIVE ANSWER · CITED</span>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full rounded-full bg-jade-400" style={{ animation: "ping-slow 2s cubic-bezier(0,0,.2,1) infinite" }} />
                  <span className="relative inline-flex size-2.5 rounded-full bg-jade-400" />
                </span>
              </div>
              <div className="mb-3 rounded-xl border border-line bg-ink-800 px-3.5 py-2.5 text-[13px] text-ash-300">
                Which standard applies to gold bangles? Is it mandatory?
              </div>
              <div className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-400/10 to-transparent px-3.5 py-3 text-[13px] leading-relaxed text-ash-300">
                <span className="text-gold-200">IS 1417:2016</span> — gold jewellery hallmarking is{" "}
                <span className="text-gold-200">mandatory</span> in notified districts.
                Look for the Standard Mark, <span className="text-gold-200">22K916</span> fineness and a 6-digit{" "}
                <span className="text-gold-200">HUID</span>…
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                <span className="chip chip-gold py-1">IS 1417:2016 · cl. 5</span>
                <span className="chip py-1">Hallmark Guide</span>
              </div>
            </div>
          </Reveal>
        </section>

        {/* ---------------------------- MARQUEE ----------------------------- */}
        <section className="relative border-y border-line bg-ink-900/70 py-5">
          <div className="flex overflow-hidden">
            <div className="marquee-track flex shrink-0 items-center gap-10 pr-10">
              {[...MARQUEE, ...MARQUEE].map((m, i) => (
                <span key={i} className="mono flex items-center gap-3 text-[13px] tracking-wider text-ash-400">
                  <CheckCircle2 className="size-3.5 text-gold-500" /> {m}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* -------------------------- CAPABILITIES -------------------------- */}
        <section className="relative mx-auto max-w-[1400px] px-4 py-28 sm:px-6">
          <Reveal>
            <div className="kicker mb-4">WHAT THE ASSISTANT DOES</div>
            <h2 className="font-display max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
              Eight services. <span className="text-gold-300">One conversation.</span>
            </h2>
            <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ash-400">
              The assistant's capabilities are implemented as working
              modules backed by a live PostgreSQL knowledge base, not slide-ware.
            </p>
          </Reveal>

          <div className="mt-12 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {CAPABILITIES.map((c, i) => (
              <Reveal key={c.title} i={(i % 4) + 1}>
                <Link href={c.href} className="panel card-hover group block h-full p-6">
                  <c.icon className="size-6 text-gold-400" strokeWidth={1.6} />
                  <h3 className="mt-5 text-[15px] font-semibold text-white">{c.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ash-400">{c.desc}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-[12px] font-medium text-gold-300 opacity-0 transition-opacity group-hover:opacity-100">
                    Open module <ArrowUpRight className="size-3.5" />
                  </span>
                </Link>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ---------------------------- PIPELINE ----------------------------- */}
        <section className="relative border-y border-line bg-ink-900/50 py-24">
          <div className="mx-auto max-w-[1400px] px-4 sm:px-6">
            <Reveal>
              <div className="kicker mb-4">HOW ANSWERS ARE BUILT</div>
              <h2 className="font-display text-4xl font-semibold text-white sm:text-5xl">
                Understand. Retrieve. <span className="text-gold-300">Cite.</span>
              </h2>
            </Reveal>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              {PIPELINE.map((p, i) => (
                <Reveal key={p.tag} i={i + 1}>
                  <div className="panel-flat relative h-full overflow-hidden p-7">
                    <div className="mono absolute -right-3 -top-6 font-display text-[100px] font-semibold leading-none text-ink-700">
                      {i + 1}
                    </div>
                    <p.icon className="size-6 text-gold-400" strokeWidth={1.6} />
                    <div className="mono mt-5 text-[11px] uppercase tracking-[0.22em] text-gold-300">{p.tag}</div>
                    <p className="mt-3 max-w-xs text-[14px] leading-relaxed text-ash-300">{p.text}</p>
                  </div>
                </Reveal>
              ))}
            </div>
            <Reveal i={4}>
              <div className="loading-beam mt-6 h-1.5 rounded-full border border-line bg-ink-800" />
            </Reveal>
          </div>
        </section>

        {/* ---------------------------- SCHEMES ------------------------------ */}
        <section className="relative mx-auto max-w-[1400px] px-4 py-28 sm:px-6">
          <Reveal>
            <div className="kicker mb-4">CONFORMITY ASSESSMENT</div>
            <h2 className="font-display text-4xl font-semibold text-white sm:text-5xl">
              The four doors to a <span className="text-gold-300">certified India</span>
            </h2>
          </Reveal>
          <div className="mt-12 grid gap-4 lg:grid-cols-4">
            {[
              { tag: "SCHEME-I", name: "ISI Mark", body: "Product certification with factory audit & independent sample testing. Mandatory where a QCO applies.", note: "CM/L- licence number" },
              { tag: "SCHEME-II", name: "CRS Registration", body: "Compulsory registration for electronics & IT goods based on recognized-lab test reports.", note: "R-XXXXXXXX number" },
              { tag: "HALLMARK", name: "Gold & Silver", body: "Fineness certification of jewellery at recognized AHCs with a unique six-digit HUID.", note: "IS 1417 · IS 2112" },
              { tag: "FMCS / CoC", name: "Scheme-IV & X", body: "Foreign manufacturers licensing and certificates of conformity for assessed production.", note: "BIS Act, 2016" },
            ].map((s, i) => (
              <Reveal key={s.name} i={i + 1}>
                <div className="panel card-hover h-full p-7">
                  <div className="mono text-[10px] tracking-[0.28em] text-ash-500">{s.tag}</div>
                  <h3 className="font-display mt-3 text-2xl font-semibold text-gold-200">{s.name}</h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-ash-400">{s.body}</p>
                  <div className="mono mt-5 inline-flex rounded-lg border border-line bg-ink-800 px-2.5 py-1.5 text-[11px] text-gold-300">
                    {s.note}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </section>

        {/* ------------------------------ CTA ------------------------------- */}
        <section className="relative px-4 pb-28 sm:px-6">
          <Reveal>
            <div className="panel noise relative mx-auto max-w-[1400px] overflow-hidden px-8 py-16 text-center sm:py-20">
              <div className="glow-gold absolute left-1/2 top-0 h-[300px] w-[640px] -translate-x-1/2" />
              <Siren className="mx-auto size-7 text-gold-400" strokeWidth={1.6} />
              <h2 className="font-display relative mx-auto mt-5 max-w-3xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
                Ask in English <span className="text-ash-500">or</span>{" "}
                <span className="text-gold-300">हिन्दी में पूछिए</span>
              </h2>
              <p className="relative mx-auto mt-4 max-w-xl text-[15px] text-ash-400">
                MSME founder, jeweller, procurement officer or a parent buying a helmet —
                Pramaan answers with the standard, the scheme and the source.
              </p>
              <div className="relative mt-8 flex flex-wrap items-center justify-center gap-3">
                <Link href="/assistant" className="btn-gold px-6 py-3 text-sm">
                  Launch the assistant <ArrowUpRight className="size-4" />
                </Link>
                <Link href="/finder" className="btn-ghost px-6 py-3 text-sm">
                  Try the Standards Finder
                </Link>
              </div>
            </div>
          </Reveal>
        </section>
      </main>
      <Footer />
    </>
  );
}
