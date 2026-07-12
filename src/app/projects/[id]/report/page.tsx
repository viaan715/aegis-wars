import { notFound, redirect } from "next/navigation";
import { getProject } from "@/lib/store";
import { PRICING_TIERS } from "@/lib/pricing";

function severityStyle(severity: string) {
  if (severity === "high") return "border-red-200 bg-red-50";
  if (severity === "medium") return "border-amber-200 bg-amber-50";
  return "border-stone-200 bg-stone-50";
}

const STAGE_STYLE: Record<string, { label: string; dot: string }> = {
  likely_done: { label: "Likely done", dot: "bg-green-500" },
  in_progress: { label: "In progress / stopped here", dot: "bg-amber-500" },
  not_started: { label: "Not started", dot: "bg-stone-300" },
  unclear: { label: "Unclear", dot: "bg-stone-200" },
};

function money(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();
  if (project.payment.status !== "paid") redirect(`/projects/${id}/preview`);
  if (!project.report) redirect(`/projects/${id}/processing`);

  const { report } = project;
  const tierDef = project.payment.tier ? PRICING_TIERS[project.payment.tier] : null;

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wide text-green-700">
            Unlocked
          </span>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-stone-900">Your Restart Report</h1>
          <p className="mt-1 text-stone-500">
            {project.projectType === "kitchen" ? "Kitchen" : "Bathroom"} renovation — generated{" "}
            {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>
        <a
          href={`/api/projects/${id}/download`}
          className="shrink-0 rounded-lg bg-stone-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-stone-700"
        >
          Download PDF
        </a>
      </div>

      {tierDef?.isManualReview && (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          You purchased the manual review add-on. A specialist will follow up by email within 2
          business days with anything the automated pass might have missed.
        </div>
      )}

      {report.flags.length > 0 && (
        <section className="mt-8">
          <h2 className="font-serif text-lg font-semibold text-stone-900">Flagged issues</h2>
          <div className="mt-3 space-y-3">
            {report.flags.map((f, i) => (
              <div key={i} className={`rounded-lg border p-4 ${severityStyle(f.severity)}`}>
                <p className="font-medium text-stone-900">{f.title}</p>
                <p className="mt-1 text-sm text-stone-700">{f.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

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

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">
          Work completed vs. contracted scope
        </h2>
        <div className="mt-4 space-y-2">
          {report.scopeStatus.map((s, i) => {
            const style = STAGE_STYLE[s.status];
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <span className="text-stone-800">{s.stage}</span>
                </div>
                <span className="text-stone-500">{style.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">
          Money paid vs. value received
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-stone-500">Total contract</dt>
            <dd className="text-lg font-semibold text-stone-900">
              {money(report.financials.totalContractAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Paid to date</dt>
            <dd className="text-lg font-semibold text-stone-900">
              {money(report.financials.amountPaidToDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-stone-500">Estimated value received</dt>
            <dd className="text-lg font-semibold text-stone-900">
              {money(report.financials.estimatedValueReceived)}
              {report.financials.estimatedValueReceivedPct != null && (
                <span className="ml-1 text-sm font-normal text-stone-500">
                  (~{Math.round(report.financials.estimatedValueReceivedPct * 100)}% of scope)
                </span>
              )}
            </dd>
          </div>
        </dl>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Missing documents</h2>
        {report.missingDocuments.length === 0 ? (
          <p className="mt-2 text-sm text-stone-500">Nothing obvious is missing — nice work staying organized.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-stone-700">
            {report.missingDocuments.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-amber-700">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">
          Questions for your next contractor
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-stone-700">
          {report.questionsForNextContractor.map((q, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium text-stone-400">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-stone-200 bg-white p-6">
        <h2 className="font-serif text-lg font-semibold text-stone-900">Plain-language summary</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-stone-700">{report.summary}</p>
      </section>

      <p className="mt-6 rounded-lg bg-stone-100 p-4 text-xs leading-relaxed text-stone-500">
        {report.disclaimer}
      </p>
    </div>
  );
}
