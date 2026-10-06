import { Nav, Footer, PageShell } from "@/components/Chrome";
import { StandardsClient, type Std } from "@/components/StandardsClient";
import { db } from "@/db";
import { standards } from "@/db/schema";

export const dynamic = "force-dynamic";

export default async function StandardsPage() {
  const rows = await db.select().from(standards).orderBy(standards.code).limit(100);
  return (
    <>
      <Nav />
      <PageShell
        kicker="CATALOGUE"
        title="Indian Standards Explorer"
        sub="Search the curated catalogue of Indian Standards — with QCO status, certification scheme, key clauses and related codes, structured for machine retrieval by the assistant."
      >
        <StandardsClient initial={rows as Std[]} />
      </PageShell>
      <Footer />
    </>
  );
}
