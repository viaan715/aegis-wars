import type { Metadata } from "next";
import { SubscribeButton } from "@/components/SubscribeButton";

export const metadata: Metadata = {
  title: "Pricing — Aegis Audit",
};

const FREE_FEATURES = [
  "Unlimited audits, up to 1,000 records per file",
  "All four checks: repetition, diversity, drift, corruption",
  "A–F quality grade with full breakdown",
  "CSV / JSON / JSONL upload",
];

const PRO_FEATURES = [
  "Up to 20,000 records per file",
  "Full flagged-record export (not capped at 500 rows)",
  "Adjustable grading thresholds per project",
  "CI integration — fail a build on a grade below your bar",
  "Priority support",
];

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-4xl py-16">
      <div className="text-center">
        <h1 className="text-2xl font-semibold text-[var(--text-primary)]">Pricing</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Audit synthetic datasets before they train your next model. Start free, upgrade when you need scale.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="rounded-xl border p-6" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
          <h2 className="text-sm font-semibold text-[var(--text-muted)]">Developer</h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
            $0<span className="text-sm font-normal text-[var(--text-muted)]"> / month</span>
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-sm text-[var(--text-secondary)]">
            {FREE_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden style={{ color: "var(--status-good)" }}>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <SubscribeButton label="Current plan" variant="secondary" />
          </div>
        </div>

        <div
          className="relative rounded-xl border-2 p-6"
          style={{ background: "var(--surface-1)", borderColor: "var(--series-1)" }}
        >
          <span
            className="absolute -top-3 left-6 rounded-full px-2.5 py-0.5 text-xs font-semibold text-white"
            style={{ background: "var(--series-1)" }}
          >
            Professional
          </span>
          <h2 className="text-sm font-semibold text-[var(--text-muted)]">Pro</h2>
          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
            $49<span className="text-sm font-normal text-[var(--text-muted)]"> / month</span>
          </p>
          <ul className="mt-6 flex flex-col gap-2.5 text-sm text-[var(--text-secondary)]">
            <li className="flex gap-2 font-medium text-[var(--text-primary)]">
              <span aria-hidden style={{ color: "var(--status-good)" }}>
                ✓
              </span>
              Everything in Developer, plus:
            </li>
            {PRO_FEATURES.map((f) => (
              <li key={f} className="flex gap-2">
                <span aria-hidden style={{ color: "var(--status-good)" }}>
                  ✓
                </span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-6">
            <SubscribeButton label="Upgrade to Pro" variant="primary" />
          </div>
        </div>
      </div>

      <p className="mt-8 text-center text-xs text-[var(--text-muted)]">
        This pricing page is a demo — no billing provider is connected, so upgrading does not charge a card.
      </p>
    </div>
  );
}
