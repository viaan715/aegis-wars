import { NextResponse } from "next/server";
import { getProject } from "@/lib/store";
import { renderReportPdf } from "@/lib/pdf";

export const runtime = "nodejs";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.payment.status !== "paid") {
    return NextResponse.json({ error: "This report hasn't been unlocked yet." }, { status: 402 });
  }
  if (!project.report) {
    return NextResponse.json({ error: "Report hasn't been generated yet." }, { status: 400 });
  }

  const pdfBuffer = await renderReportPdf(project, project.report);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="restart-report-${project.id.slice(0, 8)}.pdf"`,
    },
  });
}
