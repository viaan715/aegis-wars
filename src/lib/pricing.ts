import { PricingTier } from "./types";

export interface PricingTierDef {
  id: PricingTier;
  name: string;
  priceCents: number;
  tagline: string;
  features: string[];
  isManualReview?: boolean;
}

export const PRICING_TIERS: Record<PricingTier, PricingTierDef> = {
  summary: {
    id: "summary",
    name: "Document Summary",
    priceCents: 2900,
    tagline: "Just the extracted facts.",
    features: [
      "Every date, dollar amount, and scope item pulled from your documents",
      "No timeline analysis or flags",
      "Good if you just need things organized",
    ],
  },
  full: {
    id: "full",
    name: "Restart Report",
    priceCents: 7900,
    tagline: "The complete handoff package.",
    features: [
      "Everything in Document Summary",
      "Full project timeline",
      "Work completed vs. contracted scope",
      "Money paid vs. value received, with overpayment flags",
      "Missing documents checklist",
      "Questions to hand your next contractor",
      "Downloadable PDF",
    ],
  },
  review: {
    id: "review",
    name: "Restart Report + Manual Review",
    priceCents: 19900,
    tagline: "A human double-checks the details.",
    isManualReview: true,
    features: [
      "Everything in Restart Report",
      "A specialist manually reviews your documents",
      "Follow-up within 2 business days with anything the automated pass might have missed",
    ],
  },
};

export function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(0)}`;
}
