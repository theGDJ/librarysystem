"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Nav, Footer } from "@/components/Chrome";
import {
  ShieldCheck,
  Gem,
  Cpu,
  Globe2,
  Clock3,
  IndianRupee,
  CircleCheck,
  ArrowRight,
} from "lucide-react";

type Guide = {
  id: string;
  tab: string;
  icon: React.ElementType;
  title: string;
  audience: string;
  timeline: string;
  costNotes: string[];
  steps: { title: string; desc: string }[];
  after: string[];
};

const GUIDES: Guide[] = [
  {
    id: "isi",
    tab: "ISI · Scheme-I",
    icon: ShieldCheck,
    title: "ISI Product Certification for Indian Manufacturers",
    audience: "Domestic manufacturers of products with an applicable Indian Standard — mandatory where a QCO applies.",
    timeline: "≈ 30–90 days end-to-end",
    costNotes: [
      "Application fee + factory audit charges (per man-day)",
      "Sample testing charges at BIS / recognized labs (product-specific)",
      "Annual licence fee + unit marking fee on production",
      "Up to 80% concession for micro units & recognized startups; ~50% for small units",
    ],
    steps: [
      { title: "Confirm applicable standard & QCO", desc: "Identify the exact Indian Standard for the product and check whether a Quality Control Order makes certification mandatory." },
      { title: "Prepare factory & QC infrastructure", desc: "Documented manufacturing process, calibrated test equipment (in-house or tied-up recognized lab) and trained QC manpower." },
      { title: "File application on the BIS portal", desc: "Submit factory documents, quality-control plan, test reports and the application fee against the chosen standard." },
      { title: "Factory audit by BIS officers", desc: "Inspection of raw materials, process control, testing facilities and record-keeping." },
      { title: "Independent sample testing", desc: "Sealed samples are drawn and tested against every clause of the standard at BIS or recognized laboratories." },
      { title: "Grant of licence (CM/L- number)", desc: "On conformity, BIS issues the licence — the ISI Standard Mark with the licence number may now be applied to the product." },
    ],
    after: [
      "Surveillance via periodic factory inspections and market/factory sample testing.",
      "Renewals typically granted for 1–5 years based on performance.",
      "Non-conformity can suspend or cancel the licence — marking must stop immediately.",
    ],
  },
  {
    id: "crs",
    tab: "CRS · Electronics",
    icon: Cpu,
    title: "Compulsory Registration Scheme (Scheme-II)",
    audience: "Manufacturers & importers of notified electronics — laptops, adapters, TVs, LED lamps, batteries, mobile phones.",
    timeline: "≈ 15–30 days after receiving the test report",
    costNotes: [
      "One-time lab testing cost per model/series at a BIS-recognized lab",
      "Government registration fee per application",
      "No factory audit; registration is brand & model specific",
    ],
    steps: [
      { title: "Confirm product is CRS-notified", desc: "Check the Electronics & IT Goods (CRS) Order list and the applicable Indian Standard (e.g. IS 13252-1, IS 616, IS 16046)." },
      { title: "Test at a BIS-recognized laboratory", desc: "Get the model tested for safety against the standard; report validity typically 90 days." },
      { title: "Register on the CRS portal", desc: "Declare brand, models and factory details; upload the test report and fee." },
      { title: "Obtain R-registration number", desc: "BIS grants a registration number of the form R-XXXXXXXX for the declared brand + models." },
      { title: "Apply the Standard Mark", desc: "Product and packaging must display the Standard Mark with the R-number before sale in India." },
    ],
    after: [
      "New models require fresh/additional registration against test reports.",
      "Market surveillance by BIS — non-conforming registrations are cancelled.",
    ],
  },
  {
    id: "hallmark",
    tab: "Hallmarking",
    icon: Gem,
    title: "Gold & Silver Hallmarking",
    audience: "Jewellery retailers, manufacturers and consumers of gold & silver articles.",
    timeline: "Jeweller registration ~1 week · hallmarking same-day at an AHC",
    costNotes: [
      "Jeweller registration fee per outlet (online)",
      "Per-article hallmarking charge at the AHC (a few tens of rupees)",
      "No cost for consumers to verify a HUID in the BIS Care App",
    ],
    steps: [
      { title: "Register the jewellery outlet with BIS", desc: "Online application with KYC and premises details; registration is granted per retail outlet." },
      { title: "Partner with an Assaying & Hallmarking Centre", desc: "AHCs are BIS-recognized third-party centres equipped for fire-assay / XRF testing." },
      { title: "Assay the articles", desc: "Fineness is tested per IS 1417 (gold grades 14K585–24K999) or IS 2112 for silver." },
      { title: "Laser hallmarking + HUID", desc: "Each conforming article is marked with the BIS Standard Mark, fineness grade and a unique 6-digit HUID." },
      { title: "Sell with confidence", desc: "In notified districts only hallmarked gold may be sold; consumers verify instantly via HUID." },
    ],
    after: [
      "Selling non-hallmarked gold in notified districts is a BIS Act violation.",
      "Consumers should match article weight & purity on the invoice with the HUID lookup.",
    ],
  },
  {
    id: "fmcs",
    tab: "FMCS · Imports",
    icon: Globe2,
    title: "Foreign Manufacturers Certification Scheme",
    audience: "Overseas manufacturers exporting QCO/voluntary products to India, via an Authorized Indian Representative.",
    timeline: "≈ 90–180 days (includes overseas audit)",
    costNotes: [
      "Application + overseas factory audit expenses",
      "Sample testing charges (in India)",
      "Annual licence + marking fee as per product schedule",
    ],
    steps: [
      { title: "Appoint an Authorized Indian Representative (AIR)", desc: "Mandatory local representative for regulatory liaison and compliance undertakings." },
      { title: "Apply to BIS FMCS", desc: "Application with factory profile, process documents and undertaking through the AIR." },
      { title: "Overseas factory audit", desc: "BIS officers inspect the manufacturing unit abroad." },
      { title: "Sample testing in India", desc: "Sealed samples travel to BIS/recognized labs in India for clause-wise testing." },
      { title: "Licence for ISI marking on imports", desc: "Grant of licence allows ISI-marked products to be exported to India; consignments must carry the CM/L number." },
    ],
    after: [
      "Surveillance visits and drawal of samples from Indian markets continue.",
      "For electronics, foreign brands use CRS instead of FMCS with an AIR.",
    ],
  },
];

export default function GuidePage() {
  const [active, setActive] = useState("isi");
  const g = GUIDES.find((x) => x.id === active)!;

  return (
    <>
      <Nav />
      <main className="relative min-h-screen pb-24 pt-36">
        <div className="blueprint pointer-events-none fixed inset-0 opacity-60" />
        <div className="glow-gold pointer-events-none fixed -top-40 left-1/2 h-[480px] w-[820px] -translate-x-1/2 opacity-50" />
        <div className="relative mx-auto max-w-[1400px] px-4 sm:px-6">
          <div className="mb-10">
            <div className="kicker mb-3">CERTIFICATION GUIDE</div>
            <h1 className="font-display text-4xl font-semibold text-white sm:text-5xl">
              The road to the <span className="text-gold-300">Standard Mark</span>
            </h1>
            <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ash-400">
              Interactive walkthroughs of every major BIS conformity-assessment route — the same
              step-by-step guidance the assistant narrates in chat.
            </p>
          </div>

          {/* tabs */}
          <div className="mb-8 flex flex-wrap gap-2">
            {GUIDES.map((x) => (
              <button
                key={x.id}
                onClick={() => setActive(x.id)}
                className={`chip inline-flex items-center gap-2 px-4 py-2.5 text-[12px] transition-colors ${
                  active === x.id ? "chip-gold" : "text-ash-400 hover:text-gold-200"
                }`}
              >
                <x.icon className="size-3.5" />
                {x.tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={g.id}
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="grid gap-5 lg:grid-cols-[1fr_380px]"
            >
              {/* steps */}
              <div className="panel p-7">
                <div className="mb-2 flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl font-semibold text-white">{g.title}</h2>
                  <span className="chip chip-gold inline-flex items-center gap-1.5 py-1">
                    <Clock3 className="size-3.5" /> {g.timeline}
                  </span>
                </div>
                <p className="max-w-2xl text-[13.5px] leading-relaxed text-ash-400">{g.audience}</p>

                <div className="mt-8 space-y-0">
                  {g.steps.map((s, i) => (
                    <div key={s.title} className="relative flex gap-5 pb-8 last:pb-0">
                      {i < g.steps.length - 1 && (
                        <span className="absolute left-[15px] top-9 h-[calc(100%-18px)] w-px bg-gradient-to-b from-gold-500/50 to-line" />
                      )}
                      <span className="mono z-10 grid size-8 shrink-0 place-items-center rounded-lg border border-gold-500/40 bg-ink-900 text-[11px] text-gold-300">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="pt-1">
                        <div className="text-[15px] font-semibold text-white">{s.title}</div>
                        <p className="mt-1.5 text-[13.5px] leading-relaxed text-ash-400">{s.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* side */}
              <div className="space-y-5">
                <div className="panel-flat p-6">
                  <div className="kicker mb-4 flex items-center gap-2">
                    <IndianRupee className="size-4" /> COST STRUCTURE
                  </div>
                  <ul className="space-y-2.5">
                    {g.costNotes.map((c) => (
                      <li key={c} className="flex gap-2.5 text-[13px] leading-relaxed text-ash-300">
                        <span className="mt-[7px] size-1.5 shrink-0 rounded-[3px] bg-gold-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="panel-flat p-6">
                  <div className="kicker mb-4">AFTER CERTIFICATION</div>
                  <ul className="space-y-2.5">
                    {g.after.map((c) => (
                      <li key={c} className="flex gap-2.5 text-[13px] leading-relaxed text-ash-300">
                        <CircleCheck className="mt-0.5 size-4 shrink-0 text-jade-400" />
                        {c}
                      </li>
                    ))}
                  </ul>
                </div>
                <a href="/assistant" className="panel card-hover flex items-center justify-between p-6 text-sm">
                  <span className="text-ash-300">
                    Have a specific situation? <span className="text-gold-200">Ask Pramaan</span>
                  </span>
                  <ArrowRight className="size-4 text-gold-300" />
                </a>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      <Footer />
    </>
  );
}
