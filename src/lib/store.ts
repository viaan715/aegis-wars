import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { Project } from "./types";

const DATA_ROOT = path.join(process.cwd(), ".data");
const PROJECTS_DIR = path.join(DATA_ROOT, "projects");
export const UPLOADS_DIR = path.join(DATA_ROOT, "uploads");

async function ensureDirs() {
  await mkdir(PROJECTS_DIR, { recursive: true });
  await mkdir(UPLOADS_DIR, { recursive: true });
}

function projectPath(id: string) {
  return path.join(PROJECTS_DIR, `${id}.json`);
}

function isValidProjectId(id: string): boolean {
  return /^[0-9a-f-]{36}$/i.test(id);
}

export function newProjectSkeleton(): Project {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    projectType: null,
    questionnaire: null,
    documents: [],
    extraction: {
      status: "not_started",
      perDocument: [],
      startedAt: null,
      completedAt: null,
    },
    report: null,
    payment: {
      tier: null,
      status: "unpaid",
      stripeSessionId: null,
      paidAt: null,
    },
  };
}

export async function createProject(): Promise<Project> {
  await ensureDirs();
  const project = newProjectSkeleton();
  await writeFile(projectPath(project.id), JSON.stringify(project, null, 2), "utf-8");
  return project;
}

export async function getProject(id: string): Promise<Project | null> {
  if (!isValidProjectId(id)) return null;
  try {
    const raw = await readFile(projectPath(id), "utf-8");
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  await ensureDirs();
  project.updatedAt = new Date().toISOString();
  await writeFile(projectPath(project.id), JSON.stringify(project, null, 2), "utf-8");
}

export async function updateProject(
  id: string,
  mutate: (project: Project) => void | Promise<void>
): Promise<Project> {
  const project = await getProject(id);
  if (!project) {
    throw new Error(`Project ${id} not found`);
  }
  await mutate(project);
  await saveProject(project);
  return project;
}

export async function projectUploadDir(projectId: string): Promise<string> {
  const dir = path.join(UPLOADS_DIR, projectId);
  await mkdir(dir, { recursive: true });
  return dir;
}

export async function listProjectIds(): Promise<string[]> {
  await ensureDirs();
  const files = await readdir(PROJECTS_DIR);
  return files.filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
}
