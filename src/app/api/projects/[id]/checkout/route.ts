import { NextRequest, NextResponse } from "next/server";
import { getProject, saveProject } from "@/lib/store";
import { getStripeClient, isStripeConfigured } from "@/lib/stripe";
import { PRICING_TIERS } from "@/lib/pricing";
import { PricingTier } from "@/lib/types";

function getBaseUrl(request: NextRequest): string {
  const envUrl = process.env.NEXT_PUBLIC_APP_URL;
  if (envUrl) return envUrl.replace(/\/$/, "");
  const origin = request.headers.get("origin");
  if (origin) return origin;
  const host = request.headers.get("host") ?? "localhost:3000";
  const proto = request.headers.get("x-forwarded-proto") ?? "http";
  return `${proto}://${host}`;
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const tier = body?.tier as PricingTier | undefined;
  if (!tier || !PRICING_TIERS[tier]) {
    return NextResponse.json({ error: "Invalid pricing tier." }, { status: 400 });
  }

  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Payments aren't configured yet. Set STRIPE_SECRET_KEY to enable checkout." },
      { status: 503 }
    );
  }

  const tierDef = PRICING_TIERS[tier];
  const baseUrl = getBaseUrl(request);
  const stripe = getStripeClient();

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Renovation Restart — ${tierDef.name}`,
            description: tierDef.tagline,
          },
          unit_amount: tierDef.priceCents,
        },
        quantity: 1,
      },
    ],
    metadata: { projectId: id, tier },
    success_url: `${baseUrl}/projects/${id}/preview?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/projects/${id}/preview?checkout=cancelled`,
  });

  project.payment = {
    tier,
    status: "processing",
    stripeSessionId: session.id,
    paidAt: null,
  };
  await saveProject(project);

  return NextResponse.json({ url: session.url });
}
