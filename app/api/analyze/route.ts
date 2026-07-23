import { NextResponse } from "next/server";
import { analyzeDataset } from "@/lib/analysis";

export const runtime = "nodejs";

const MAX_FILE_BYTES = 15 * 1024 * 1024;

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart/form-data with a 'file' field." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file uploaded. Attach a CSV or JSON file as 'file'." }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ error: "The uploaded file is empty." }, { status: 400 });
  }

  if (file.size > MAX_FILE_BYTES) {
    return NextResponse.json(
      { error: `File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max size is 15MB.` },
      { status: 413 }
    );
  }

  const name = file.name.toLowerCase();
  if (!/\.(csv|json|jsonl|ndjson)$/.test(name)) {
    return NextResponse.json({ error: "Unsupported file type. Upload a .csv, .json, or .jsonl file." }, { status: 400 });
  }

  let text: string;
  try {
    text = await file.text();
  } catch {
    return NextResponse.json({ error: "Could not read the uploaded file as text." }, { status: 400 });
  }

  try {
    const report = analyzeDataset(text, file.name);
    return NextResponse.json(report);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to analyze the dataset.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
