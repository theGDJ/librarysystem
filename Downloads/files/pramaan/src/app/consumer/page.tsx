import { Nav, Footer, PageShell } from "@/components/Chrome";
import { ComplaintForm, Verify } from "./ConsumerClient";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";

export const metadata = {
  title: "Verify a mark",
  description: "Check ISI licences, CRS registrations, jeweller registrations and gold HUIDs, and report misuse of the Standard Mark.",
};

const MARKS = [
  {
    title: "ISI Standard Mark",
    scheme: "Scheme-I",
    body: "Always printed with the IS number above it and the CM/L- licence number below. If either is missing, the mark is being misused.",
  },
  {
    title: "CRS Standard Mark",
    scheme: "Scheme-II",
    body: "Electronics carry the mark with an R- registration number on the product and packaging. Check that the model name matches the registration.",
  },
  {
    title: "Gold hallmark",
    scheme: "IS 1417",
    body: "Three laser marks: the BIS logo, the fineness (such as 22K916, 18K750 or 14K585) and a unique six-character HUID. Check the HUID before paying.",
  },
];

export default async function ConsumerPage() {
  const locale = await getLocale();
  return (
    <>
      <Nav />
      <PageShell
        title={tx(locale, "Verify a mark")}
        description={tx(locale, "Check the number printed with a Standard Mark against the registry, and report products that misuse it.")}
      >
        <div className="grid gap-14 lg:grid-cols-2 lg:gap-16">
          <Verify />
          <ComplaintForm />
        </div>

        <section aria-labelledby="read-h" className="mt-20 border-t border-rule pt-10">
          <h2 id="read-h" className="text-xl font-bold tracking-[-0.02em]">
            {tx(locale, "How to read the marks")}
          </h2>
          <dl className="mt-6 grid gap-8 md:grid-cols-3">
            {MARKS.map((m) => (
              <div key={m.title}>
                <dt>
                  <span className="font-heading text-base font-semibold text-ink">{tx(locale, m.title)}</span>
                  <span className="ml-2 text-sm text-muted">{m.scheme}</span>
                </dt>
                <dd className="mt-2 text-base text-body">{tx(locale, m.body)}</dd>
              </div>
            ))}
          </dl>
          <div className="mt-10 max-w-[820px] rounded-md border-l-2 border-attention bg-attention-soft px-5 py-4">
            <p className="text-base text-body">
              {tx(locale, "For products under a Quality Control Order — helmets, pressure cookers, toys, cables, plugs, fans, packaged water and others — no valid mark means the product should not be on sale. Misuse of the Standard Mark is punishable under the BIS Act, 2016.")}
            </p>
          </div>
        </section>
      </PageShell>
      <Footer />
    </>
  );
}
