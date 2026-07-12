import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getProject } from "@/lib/store";
import CheckoutStatusHandler from "./CheckoutStatusHandler";
import PricingCards from "./PricingCards";

function severityStyle(severity: string) {
  if (severity === "high") return "border-red-200 bg-red-50";
  if (severity === "medium") return "border-amber-200 bg-amber-50";
  return "border-stone-200 bg-stone-50";
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  if (!project.report) redirect(`/projects/${id}/processing`);
  if (project.payment.status === "paid") redirect(`/projects/${id}/report`);

  const { report } = project;
  const previewFlags = report.flags.slice(0, 2);
  const lockedFlagCount = Math.max(0, report.flags.length - previewFlags.length);

  return (
    <div>
      <Suspense fallback={null}>
        <CheckoutStatusHandler projectId={id} />
      </Suspense>

      <span className="text-xs font-semibold uppercase tracking-wide text-amber-700">
        Free preview
      </span>
      <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900">
        Your report is ready — here&apos;s a preview
      </h1>
      <p className="mt-2 max-w-2xl text-stone-600">
        This is real, generated from your documents. The full Restart Report — scope comparison,
        financial breakdown, missing documents, and a downloadable PDF — unlocks at checkout below.
      </p>

      <section className="mt-8 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Timeline</h2>
        {report.timeline.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">No dated events were found in your documents.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {report.timeline.map((e, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="w-24 shrink-0 font-medium text-stone-900">{e.date}</span>
                <div>
                  <p className="text-stone-800">{e.label}</p>
                  <p className="text-xs text-stone-400">{e.source}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      {previewFlags.length > 0 && (
        <section className="mt-6 space-y-3">
          <h2 className="font-serif text-lg font-semibold text-stone-900">Flagged issues</h2>
          {previewFlags.map((f, i) => (
            <div key={i} className={`rounded-lg border p-4 ${severityStyle(f.severity)}`}>
              <p className="font-medium text-stone-900">{f.title}</p>
              <p className="mt-1 text-sm text-stone-700">{f.detail}</p>
            </div>
          ))}
          {lockedFlagCount > 0 && (
            <div className="rounded-lg border border-dashed border-stone-300 p-4 text-sm text-stone-500">
              + {lockedFlagCount} more flagged issue{lockedFlagCount === 1 ? "" : "s"} in the full report
            </div>
          )}
        </section>
      )}

      <section className="relative mt-8 overflow-hidden rounded-xl border border-stone-200 bg-white p-6">
        <div className="pointer-events-none select-none blur-sm">
          <h2 className="font-serif text-lg font-semibold text-stone-900">
            Work completed vs. contracted scope
          </h2>
          <div className="mt-4 space-y-2">
            {report.scopeStatus.slice(0, 4).map((s, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{s.stage}</span>
                <span>••••••</span>
              </div>
            ))}
          </div>
          <h2 className="mt-6 font-serif text-lg font-semibold text-stone-900">
            Money paid vs. value received
          </h2>
          <p className="mt-2 text-sm">Total contract: ••••••</p>
          <p className="text-sm">Paid to date: ••••••</p>
        </div>
        <div className="absolute inset-0 flex items-center justify-center bg-white/60">
          <div className="text-center">
            <p className="font-medium text-stone-900">Scope comparison, financials, missing documents,</p>
            <p className="font-medium text-stone-900">questions for your next contractor, and the full PDF</p>
            <Link
              href="#pricing"
              className="mt-3 inline-block rounded-lg bg-amber-700 px-5 py-2 text-sm font-medium text-white hover:bg-amber-800"
            >
              Unlock the full report
            </Link>
          </div>
        </div>
      </section>

      <section id="pricing" className="mt-12">
        <h2 className="font-serif text-2xl font-semibold text-stone-900">Unlock your report</h2>
        <p className="mt-1 text-stone-500">One-time payment. No subscription.</p>
        <div className="mt-6">
          <PricingCards projectId={id} />
        </div>
      </section>
    </div>
  );
}
