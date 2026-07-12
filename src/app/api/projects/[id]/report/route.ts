import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { generateReportSummary, isClaudeConfigured, mockReportSummary } from "@/lib/claude";
import { buildReport } from "@/lib/report";
import { DocumentFacts } from "@/lib/types";

export const maxDuration = 120;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  return NextResponse.json({ report: project.report });
}

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.extraction.status !== "complete") {
    return NextResponse.json(
      { error: "Document extraction hasn't finished yet." },
      { status: 400 }
    );
  }

  const facts = project.extraction.perDocument
    .map((e) => e.facts)
    .filter((f): f is DocumentFacts => f !== null);

  const summary = isClaudeConfigured()
    ? await generateReportSummary(project, facts)
    : mockReportSummary();

  const report = buildReport(project, summary);
  project.report = report;
  await saveProject(project);

  return NextResponse.json({ report });
}
