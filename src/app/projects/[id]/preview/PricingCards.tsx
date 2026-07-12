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
              tier.id === "full" ? "border-amber-600 shadow-md" : "border-stone-200"
            }`}
          >
            {tier.id === "full" && (
              <span className="mb-2 self-start rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                Most popular
              </span>
            )}
            <h3 className="font-serif text-lg font-semibold text-stone-900">{tier.name}</h3>
            <p className="text-sm text-stone-500">{tier.tagline}</p>
            <p className="mt-3 text-3xl font-bold text-stone-900">{formatPrice(tier.priceCents)}</p>
            <ul className="mt-4 flex-1 space-y-2 text-sm text-stone-600">
              {tier.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <span className="text-amber-700">✓</span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
            <button
              onClick={() => checkout(tier.id)}
              disabled={loadingTier !== null}
              className={`mt-6 rounded-lg px-4 py-2.5 text-sm font-medium disabled:opacity-60 ${
                tier.id === "full"
                  ? "bg-amber-700 text-white hover:bg-amber-800"
                  : "border border-stone-300 text-stone-800 hover:bg-stone-50"
              }`}
            >
              {loadingTier === tier.id ? "Redirecting…" : `Get ${tier.name}`}
            </button>
          </div>
        ))}
      </div>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
    </div>
  );
}
