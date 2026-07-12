import { NextRequest, NextResponse } from "next/server";
import { createProject, saveProject } from "@/lib/store";
import { ProjectType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const projectType: unknown = body?.projectType;

  if (projectType !== "kitchen" && projectType !== "bathroom") {
    return NextResponse.json(
      { error: "projectType must be 'kitchen' or 'bathroom'." },
      { status: 400 }
    );
  }

  const project = await createProject();
  project.projectType = projectType as ProjectType;
  await saveProject(project);

  return NextResponse.json({ project });
}
