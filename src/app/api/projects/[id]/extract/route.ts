import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { readStoredFile } from "@/lib/storage";
import { extractDocumentFacts, isClaudeConfigured, mockDocumentFacts } from "@/lib/claude";
import { DocumentExtraction } from "@/lib/types";

export const maxDuration = 300;

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  if (project.documents.length === 0) {
    return NextResponse.json({ error: "No documents to extract." }, { status: 400 });
  }

  project.extraction.status = "processing";
  project.extraction.startedAt = new Date().toISOString();
  await saveProject(project);

  const configured = isClaudeConfigured();
  const results: DocumentExtraction[] = [];

  for (const doc of project.documents) {
    try {
      const buffer = await readStoredFile(doc.storagePath);
      const facts = configured
        ? await extractDocumentFacts(
            { buffer, mimeType: doc.mimeType, filename: doc.filename },
            doc.category
          )
        : mockDocumentFacts(doc.category, doc.filename);

      results.push({
        documentId: doc.id,
        status: "complete",
        facts,
        error: null,
        extractedAt: new Date().toISOString(),
        mocked: !configured,
      });
    } catch (err) {
      results.push({
        documentId: doc.id,
        status: "error",
        facts: null,
        error: err instanceof Error ? err.message : "Extraction failed.",
        extractedAt: new Date().toISOString(),
      });
    }
  }

  project.extraction.perDocument = results;
  project.extraction.status = results.some((r) => r.status === "error") && results.every((r) => r.status === "error")
    ? "error"
    : "complete";
  project.extraction.completedAt = new Date().toISOString();
  await saveProject(project);

  return NextResponse.json({ extraction: project.extraction });
}
