import { Nav, Footer, PageShell } from "@/components/Chrome";
import { FinderClient } from "@/components/FinderClient";

export const dynamic = "force-dynamic";

export default function FinderPage() {
  return (
    <>
      <Nav />
      <PageShell
        kicker="PRODUCT → STANDARD → SCHEME"
        title="Standards Finder"
        sub="Describe any product in plain words. Pramaan identifies the applicable Indian Standards, whether a Quality Control Order makes certification mandatory, the right BIS scheme, the process steps and compatible testing labs."
      >
        <FinderClient />
      </PageShell>
      <Footer />
    </>
  );
}
