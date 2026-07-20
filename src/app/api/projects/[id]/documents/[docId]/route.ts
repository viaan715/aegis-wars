import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { deleteStoredFile, readStoredFile } from "@/lib/storage";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const project = await getProject(id);
  const doc = project?.documents.find((d) => d.id === docId);
  if (!project || !doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  const buffer = await readStoredFile(doc.storagePath);
  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": doc.mimeType,
      "Content-Disposition": `inline; filename="${encodeURIComponent(doc.filename)}"`,
      "Cache-Control": "private, max-age=3600",
    },
  });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; docId: string }> }
) {
  const { id, docId } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  const doc = project.documents.find((d) => d.id === docId);
  if (!doc) {
    return NextResponse.json({ error: "Document not found." }, { status: 404 });
  }

  project.documents = project.documents.filter((d) => d.id !== docId);
  project.extraction.perDocument = project.extraction.perDocument.filter(
    (e) => e.documentId !== docId
  );
  await saveProject(project);
  await deleteStoredFile(doc.storagePath);

  return NextResponse.json({ documents: project.documents });
}
