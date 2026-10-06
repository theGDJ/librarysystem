import { Nav, Footer, PageShell } from "@/components/Chrome";
import { LabsClient, type Lab } from "@/components/LabsClient";
import { db } from "@/db";
import { labs } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function LabsPage() {
  const rows = await db.select().from(labs).orderBy(labs.state, labs.city).limit(200);
  const states = [...new Set(rows.map((r) => r.state))].sort();
  return (
    <>
      <Nav />
      <PageShell
        kicker="TESTING NETWORK"
        title="Laboratories & AHC Directory"
        sub="BIS-owned laboratories, BIS-recognized testing labs and Assaying & Hallmarking Centres — filtered by state and testing capability, exactly as the assistant recommends them."
      >
        <LabsClient initial={rows as Lab[]} states={states} />
      </PageShell>
      <Footer />
    </>
  );
}
