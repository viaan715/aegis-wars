import { notFound } from "next/navigation";
import { getProject } from "@/lib/store";
import ProcessingRunner from "./ProcessingRunner";

export default async function ProcessingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) notFound();

  return <ProcessingRunner projectId={id} />;
}
