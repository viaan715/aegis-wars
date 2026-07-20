import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_REPORT } from "@/lib/sample-report";
import RestartReportView from "@/components/RestartReportView";

export const metadata: Metadata = {
  title: "Sample Restart Report | Renovation Restart",
  description:
    "See exactly what a Restart Report looks like: timeline, scope vs. contract, money paid vs. value received, missing documents, and questions for your next contractor.",
};

export default function SamplePage() {
  return (
    <div className="min-h-screen bg-paper-soft">
      <header className="border-b border-line bg-paper">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-6 py-4">
          <Link href="/" className="font-display text-lg font-semibold text-ink">
            Renovation<span className="text-gold">Restart</span>
          </Link>
          <Link
            href="/start"
            className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-on-accent hover:bg-gold-dark"
          >
            Start my report
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-8 rounded-lg border border-teal bg-teal-soft p-4 text-sm text-ink">
          This is a sample report built from fictional data, so you can see exactly what you get
          before uploading anything of your own.{" "}
          <Link href="/start" className="font-medium text-teal underline hover:no-underline">
            Start my Restart Report →
          </Link>
        </div>
        <RestartReportView report={SAMPLE_REPORT} kicker="Sample report" title="Sample Restart Report" />
      </main>
    </div>
  );
}
