"use client";

import { useState } from "react";
import type { HistogramBucket } from "@/lib/analysis/types";

const CHART_HEIGHT = 140;

export function ScoreHistogram({ buckets }: { buckets: HistogramBucket[] }) {
  const [active, setActive] = useState<number | null>(null);
  const maxCount = Math.max(1, ...buckets.map((b) => b.count));
  const modeIndex = buckets.reduce((best, b, i) => (b.count > buckets[best].count ? i : best), 0);

  const ticks = [0, 0.5, 1].map((f) => Math.round(maxCount * f));

  return (
    <div>
      <div className="flex gap-3">
        <div
          className="flex flex-col justify-between py-0 text-right text-[10px] text-[var(--text-muted)]"
          style={{ height: CHART_HEIGHT, fontVariantNumeric: "tabular-nums" }}
        >
          {[...ticks].reverse().map((t, i) => (
            <span key={i}>{t}</span>
          ))}
        </div>
        <div className="relative flex-1">
          <div className="absolute inset-0 flex flex-col justify-between" aria-hidden>
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-px w-full" style={{ background: "var(--gridline)" }} />
            ))}
          </div>
          <div className="relative flex items-end gap-1.5" style={{ height: CHART_HEIGHT }}>
            {buckets.map((b, i) => {
              const heightPx = (b.count / maxCount) * CHART_HEIGHT;
              const isMode = i === modeIndex && b.count > 0;
              return (
                <div key={b.bucket} className="group relative flex-1">
                  {isMode && (
                    <span
                      className="absolute -top-5 left-1/2 -translate-x-1/2 text-[11px] font-medium text-[var(--text-secondary)]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {b.count}
                    </span>
                  )}
                  <button
                    type="button"
                    className="block w-full rounded-t-[4px] transition-opacity"
                    style={{
                      height: Math.max(heightPx, b.count > 0 ? 2 : 0),
                      background: "var(--seq-400)",
                      opacity: active === i ? 0.75 : 1,
                    }}
                    onPointerEnter={() => setActive(i)}
                    onPointerLeave={() => setActive(null)}
                    onFocus={() => setActive(i)}
                    onBlur={() => setActive(null)}
                    aria-label={`${b.bucket}: ${b.count} records`}
                  />
                  <div
                    role="tooltip"
                    className={`pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border px-2 py-1 text-xs shadow-lg transition-opacity ${
                      active === i ? "opacity-100" : "opacity-0"
                    }`}
                    style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
                  >
                    <span className="font-medium text-[var(--text-primary)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {b.count}
                    </span>{" "}
                    <span className="text-[var(--text-secondary)]">records scored {b.bucket}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="mt-1.5 flex gap-1.5 pl-[26px]">
        {buckets.map((b) => (
          <div key={b.bucket} className="flex-1 text-center text-[10px] text-[var(--text-muted)]">
            {b.min}
          </div>
        ))}
      </div>
    </div>
  );
}
