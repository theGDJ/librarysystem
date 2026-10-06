import Link from "next/link";
import { Nav, Footer } from "@/components/Chrome";

export default function NotFound() {
  return (
    <>
      <Nav />
      <main id="main" className="mx-auto max-w-[1240px] px-5 pb-10 pt-16 sm:px-8">
        <h1 className="text-2xl font-bold tracking-[-0.025em]">This page is not in the register</h1>
        <p className="mt-3 max-w-[56ch] text-md text-muted">
          The address may be mistyped, or the standard is not part of Pramaan&apos;s catalogue. Search the catalogue by
          number or keyword instead.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/standards" className="btn btn-primary">
            Search the catalogue
          </Link>
          <Link href="/" className="btn btn-secondary">
            Go to the home page
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
