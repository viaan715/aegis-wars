import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import IntakeWizard from "./IntakeWizard";

export default async function UploadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return <IntakeWizard project={project} />;
}
