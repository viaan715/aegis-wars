"use client";

import { useState } from "react";
import { PRICING_TIERS, formatPrice } from "@/lib/pricing";
import { PricingTier } from "@/lib/types";

export default function PricingCards({ projectId }: { projectId: string }) {
  const [loadingTier, setLoadingTier] = useState<PricingTier | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function checkout(tier: PricingTier) {
    setLoadingTier(tier);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tier }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not start checkout.");
      window.location.assign(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoadingTier(null);
    }
  }

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-3">
        {Object.values(PRICING_TIERS).map((tier) => (
          <div
            key={tier.id}
            className={`flex flex-col rounded-xl border p-6 ${
              tier.id === "full" ? "border-gold bg-gold-soft shadow-md" : "border-line bg-paper"
            }`}
          >
            {tier.id === "full" && (
              <span className="mb-2 self-start rounded-full bg-gold px-2 py-0.5 text-xs font-semibold text-on-accent">
                Most popular
              </span>
            )}
            <h3 className="font-display text-lg font-semibold text-ink">{tier.name}</h3>
            <p className="text-sm text-ink-soft">{tier.tagline}</p>
            <p className="mt-3 text-3xl font-bold text-ink">{formatPrice(tier.priceCents)}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-ink-soft">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-teal">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => checkout(tier.id)}
              disabled={loadingTier !== null}
              className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${
                tier.id === "full"
                  ? "bg-gold text-on-accent font-semibold hover:bg-gold-dark"
                  : "border border-line text-ink hover:bg-paper-soft"
              }`}
            >
              {loadingTier === tier.id ? "Redirecting…" : `Get ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-coral">{error}</p>}
    </div>
  );
}
