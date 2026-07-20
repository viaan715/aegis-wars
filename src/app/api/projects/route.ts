import { NextRequest, NextResponse } from "next/server";
import { createProject, saveProject } from "@/lib/store";
import { ALL_PROJECT_TYPES } from "@/lib/project-stages";
import { ProjectType } from "@/lib/types";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const projectType: unknown = body?.projectType;

  if (typeof projectType !== "string" || !ALL_PROJECT_TYPES.includes(projectType as ProjectType)) {
    return NextResponse.json(
      { error: `projectType must be one of: ${ALL_PROJECT_TYPES.join(", ")}` },
      { status: 400 }
    );
  }

  const project = await createProject();
  project.projectType = projectType as ProjectType;
  await saveProject(project);

  return NextResponse.json({ project });
}
