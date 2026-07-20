import type { ReactNode } from "react";
import { PROJECT_TYPE_META } from "@/lib/project-stages";
import { RestartReport } from "@/lib/types";

function severityStyle(severity: string) {
  if (severity === "high") return "border-coral bg-coral-soft";
  if (severity === "medium") return "border-gold bg-gold-soft";
  return "border-line bg-paper-soft";
}

const STAGE_STYLE: Record<string, { label: string; dot: string }> = {
  likely_done: { label: "Likely done", dot: "bg-teal" },
  in_progress: { label: "In progress / stopped here", dot: "bg-gold" },
  not_started: { label: "Not started", dot: "bg-line" },
  unclear: { label: "Unclear", dot: "bg-ink-soft/40" },
};

function money(n: number | null): string {
  if (n == null) return "—";
  return `$${n.toLocaleString()}`;
}

export default function RestartReportView({
  report,
  title = "Your Restart Report",
  kicker,
  headerAction,
  manualReviewNote,
}: {
  report: RestartReport;
  title?: string;
  kicker: string;
  headerAction?: ReactNode;
  manualReviewNote?: boolean;
}) {
  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <span className="kicker text-teal">{kicker}</span>
          <h1 className="mt-1 font-display text-3xl font-bold text-ink">{title}</h1>
          <p className="mt-1 text-ink-soft">
            {PROJECT_TYPE_META[report.projectType].reportLabel} — generated{" "}
            {new Date(report.generatedAt).toLocaleDateString()}
          </p>
        </div>
        {headerAction}
      </div>

      {manualReviewNote && (
        <div className="mt-6 rounded-lg border border-lavender bg-lavender-soft p-4 text-sm text-ink">
          You purchased the manual review add-on. A specialist will follow up by email within 2
          business days with anything the automated pass might have missed.
        </div>
      )}

      {report.flags.length > 0 && (
        <section className="mt-8">
          <h2 className="font-display text-lg font-semibold text-ink">Flagged issues</h2>
          <div className="mt-3 space-y-3">
            {report.flags.map((f, i) => (
              <div key={i} className={`rounded-lg border p-4 ${severityStyle(f.severity)}`}>
                <p className="font-medium text-ink">{f.title}</p>
                <p className="mt-1 text-sm text-ink">{f.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mt-8 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Timeline</h2>
        {report.timeline.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No dated events were found in your documents.</p>
        ) : (
          <ol className="mt-4 space-y-3">
            {report.timeline.map((e, i) => (
              <li key={i} className="flex gap-4 text-sm">
                <span className="w-24 shrink-0 font-medium text-ink">{e.date}</span>
                <div>
                  <p className="text-ink">{e.label}</p>
                  <p className="text-xs text-ink-soft">{e.source}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Work completed vs. contracted scope
        </h2>
        <div className="mt-4 space-y-2">
          {report.scopeStatus.map((s, i) => {
            const style = STAGE_STYLE[s.status];
            return (
              <div key={i} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${style.dot}`} />
                  <span className="text-ink">{s.stage}</span>
                </div>
                <span className="text-ink-soft">{style.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Money paid vs. value received
        </h2>
        <dl className="mt-4 grid gap-3 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-soft">Total contract</dt>
            <dd className="text-lg font-semibold text-ink">
              {money(report.financials.totalContractAmount)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Paid to date</dt>
            <dd className="text-lg font-semibold text-ink">
              {money(report.financials.amountPaidToDate)}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-soft">Estimated value received</dt>
            <dd className="text-lg font-semibold text-ink">
              {money(report.financials.estimatedValueReceived)}
              {report.financials.estimatedValueReceivedPct != null && (
                <span className="ml-1 text-sm font-normal text-ink-soft">
                  (~{Math.round(report.financials.estimatedValueReceivedPct * 100)}% of scope)
                </span>
              )}
            </dd>
          </div>
        </dl>
        {report.costBenchmark && (
          <p className="mt-4 border-t border-line pt-3 text-xs leading-relaxed text-ink-soft">
            Typical U.S. range for {PROJECT_TYPE_META[report.projectType].label.toLowerCase()}:{" "}
            <span className="font-medium text-ink-soft">
              {money(report.costBenchmark.low)}–{money(report.costBenchmark.high)}
            </span>
            . A rough national average — actual costs vary by region, size, and finish level.
          </p>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Missing documents</h2>
        {report.missingDocuments.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">Nothing obvious is missing — nice work staying organized.</p>
        ) : (
          <ul className="mt-3 space-y-2 text-sm text-ink">
            {report.missingDocuments.map((d, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-coral">•</span>
                <span>{d}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">
          Questions for your next contractor
        </h2>
        <ol className="mt-3 space-y-2 text-sm text-ink">
          {report.questionsForNextContractor.map((q, i) => (
            <li key={i} className="flex gap-2">
              <span className="font-medium text-lavender">{i + 1}.</span>
              <span>{q}</span>
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-6 rounded-xl border border-line bg-paper p-6">
        <h2 className="font-display text-lg font-semibold text-ink">Plain-language summary</h2>
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-ink">{report.summary}</p>
      </section>

      <p className="mt-6 rounded-lg bg-paper-soft p-4 text-xs leading-relaxed text-ink-soft">
        {report.disclaimer}
      </p>
    </div>
  );
}
