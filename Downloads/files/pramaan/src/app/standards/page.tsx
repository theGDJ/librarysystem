import { Suspense } from "react";
import { Nav, Footer, PageShell } from "@/components/Chrome";
import { StandardsClient, type Std } from "@/components/StandardsClient";
import { db } from "@/db";
import { standards } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { formatCount } from "@/lib/format";
import { getLocale } from "@/lib/server-locale";
import { tx } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Standards catalogue",
  description: "Search Indian Standards by code, title or keyword, with QCO status, certification scheme and key clauses.",
};

export default async function StandardsPage() {
  const locale = await getLocale();
  const [rows, [total], [mand]] = await Promise.all([
    db.select().from(standards).orderBy(standards.code).limit(250),
    db.select({ c: sql<number>`count(*)::int` }).from(standards),
    db.select({ c: sql<number>`count(*)::int` }).from(standards).where(eq(standards.mandatory, true)),
  ]);
  return (
    <>
      <Nav />
      <PageShell
        title={tx(locale, "Standards catalogue")}
        description={tx(locale, "Search by IS number, title or keyword. Each entry shows whether a Quality Control Order makes certification compulsory, the scheme it falls under and its key clauses.")}
        aside={
          <p className="text-sm text-muted lg:text-right">
            {formatCount(Number(total?.c ?? 0))} {tx(locale, "standards")}
            <br />
            {formatCount(Number(mand?.c ?? 0))} {tx(locale, "under Quality Control Orders")}
          </p>
        }
      >
        <Suspense>
          <StandardsClient initial={rows as Std[]} />
        </Suspense>
      </PageShell>
      <Footer />
    </>
  );
}
