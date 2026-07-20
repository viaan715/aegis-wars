import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const sessionId = request.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id." }, { status: 400 });
  }

  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  if (project.payment.status === "paid") {
    return NextResponse.json({ payment: project.payment });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json({ error: "Payments aren't configured." }, { status: 503 });
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (
    session.metadata?.projectId === id &&
    session.payment_status === "paid" &&
    project.payment.stripeSessionId === session.id
  ) {
    project.payment.status = "paid";
    project.payment.paidAt = new Date().toISOString();
    await saveProject(project);
  }

  return NextResponse.json({ payment: project.payment });
}
