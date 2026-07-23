"use client";

import { useState } from "react";

export function SubscribeButton({ label, variant }: { label: string; variant: "primary" | "secondary" }) {
  const [clicked, setClicked] = useState(false);

  return (
    <div>
      <button
        onClick={() => setClicked(true)}
        className={
          variant === "primary"
            ? "w-full rounded-md px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90"
            : "w-full rounded-md border px-4 py-2.5 text-sm font-semibold text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-1)]"
        }
        style={variant === "primary" ? { background: "var(--series-1)" } : { borderColor: "var(--border)" }}
      >
        {label}
      </button>
      {clicked && (
        <p className="mt-2 text-center text-xs text-[var(--text-muted)]">
          This is a demo tier switcher — no payment is processed and no card is charged.
        </p>
      )}
    </div>
  );
}
