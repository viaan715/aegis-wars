import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { getProject, saveProject } from "@/lib/store";
import { getStripeClient } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json({ error: "Webhook not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing stripe-signature header." }, { status: 400 });
  }

  const body = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature.";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const projectId = session.metadata?.projectId;
    if (projectId && session.payment_status === "paid") {
      const project = await getProject(projectId);
      if (project && project.payment.stripeSessionId === session.id) {
        project.payment.status = "paid";
        project.payment.paidAt = new Date().toISOString();
        await saveProject(project);
      }
    }
  }

  return NextResponse.json({ received: true });
}
