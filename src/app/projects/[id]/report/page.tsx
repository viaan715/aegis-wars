import { notFound, redirect } from "next/navigation";
import { getProject } from "@/lib/store";
import { PRICING_TIERS } from "@/lib/pricing";
import RestartReportView from "@/components/RestartReportView";

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

  const tierDef = project.payment.tier ? PRICING_TIERS[project.payment.tier] : null;

  return (
    <RestartReportView
      report={project.report}
      kicker="Unlocked"
      manualReviewNote={tierDef?.isManualReview}
      headerAction={
        <a
          href={`/api/projects/${id}/download`}
          className="shrink-0 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper hover:bg-ink-soft"
        >
          Download PDF
        </a>
      }
    />
  );
}
