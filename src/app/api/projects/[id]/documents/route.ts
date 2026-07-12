import { NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { saveUploadedFile, UploadRejectedError } from "@/lib/storage";
import { DocumentCategory } from "@/lib/types";

const VALID_CATEGORIES: DocumentCategory[] = [
  "contract",
  "receipt",
  "photo",
  "message",
  "payment",
  "permit",
  "other",
];

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
  return NextResponse.json({ documents: project.documents });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const formData = await request.formData();
  const category = String(formData.get("category") || "other") as DocumentCategory;
  if (!VALID_CATEGORIES.includes(category)) {
    return NextResponse.json({ error: "Invalid document category." }, { status: 400 });
  }

  const files = formData.getAll("files").filter((f): f is File => f instanceof File);
  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided." }, { status: 400 });
  }

  const saved = [];
  const rejected: { filename: string; reason: string }[] = [];

  for (const file of files) {
    try {
      const doc = await saveUploadedFile(id, file, category);
      project.documents.push(doc);
      saved.push(doc);
    } catch (err) {
      if (err instanceof UploadRejectedError) {
        rejected.push({ filename: file.name, reason: err.message });
      } else {
        throw err;
      }
    }
  }

  if (saved.length > 0) {
    await saveProject(project);
  }

  return NextResponse.json({ saved, rejected, documents: project.documents });
}
