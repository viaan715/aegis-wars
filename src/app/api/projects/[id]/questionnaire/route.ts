import { NextResponse } from "next/server";
import { z } from "zod";
import { updateProject } from "@/lib/store";

const QuestionnaireSchema = z.object({
  contractorName: z.string().max(200).default(""),
  contractSignedDate: z.string().max(20).default(""),
  totalContractAmount: z.number().nonnegative().nullable().default(null),
  amountPaidToDate: z.number().nonnegative().nullable().default(null),
  promisedScope: z.array(z.string().max(200)).default([]),
  promisedScopeOther: z.string().max(1000).default(""),
  stageStopped: z.string().max(200).default(""),
  lastContactDate: z.string().max(20).default(""),
  alreadyTried: z.array(z.string().max(200)).default([]),
  alreadyTriedOther: z.string().max(1000).default(""),
  additionalNotes: z.string().max(4000).default(""),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json().catch(() => null);
  const parsed = QuestionnaireSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid questionnaire data.", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  try {
    const project = await updateProject(id, (p) => {
      p.questionnaire = parsed.data;
    });
    return NextResponse.json({ project });
  } catch {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }
}
