import { Suspense } from "react";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";
import { Nav, Footer, PageShell } from "@/components/Chrome";
import { FinderClient } from "@/components/FinderClient";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Product finder",
  description:
    "Describe a product and get its compliance pathway: applicable Indian Standards, whether certification is compulsory, the BIS scheme and its steps, and laboratories that test it.",
};

export default async function FinderPage() {
  const locale = await getLocale();
  return (
    <>
      <Nav />
      <PageShell
        title={tx(locale, "Product finder")}
        description={tx(locale, "Describe a product in plain words. Pramaan lays out its compliance pathway: the standards that apply, whether a Quality Control Order makes certification compulsory, the scheme and its steps, and the laboratories that can test it.")}
      >
        <Suspense>
          <FinderClient />
        </Suspense>
      </PageShell>
      <Footer />
    </>
  );
}
