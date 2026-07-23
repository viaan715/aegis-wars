"use client";

import type { DimensionScore } from "@/lib/analysis/types";
import { DIMENSION_COLOR_VAR } from "@/lib/ui/colors";

export function DimensionBarChart({ dimensions }: { dimensions: DimensionScore[] }) {
  return (
    <div className="flex flex-col gap-4">
      {dimensions.map((d) => {
        const colorVar = DIMENSION_COLOR_VAR[d.key];
        return (
          <div key={d.key} tabIndex={0} className="group relative outline-none">
            <div className="mb-1.5 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden />
                {d.label}
              </span>
              <span className="font-mono text-sm text-[var(--text-secondary)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                {d.score}
              </span>
            </div>
            <div className="h-5 overflow-hidden rounded-md" style={{ background: "var(--gridline)" }}>
              <div
                className="h-full rounded-r-[4px]"
                style={{ width: `${d.score}%`, background: `var(${colorVar})` }}
              />
            </div>

            <div
              role="tooltip"
              className="invisible absolute left-0 top-full z-10 mt-2 w-72 rounded-lg border p-3 opacity-0 shadow-lg transition-opacity duration-150 group-hover:visible group-hover:opacity-100 group-focus:visible group-focus:opacity-100"
              style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
            >
              <p className="mb-2 text-xs text-[var(--text-secondary)]">{d.summary}</p>
              <dl className="grid grid-cols-2 gap-x-3 gap-y-1">
                {d.metrics.map((m) => (
                  <div key={m.label} className="contents">
                    <dt className="text-xs text-[var(--text-muted)]">{m.label}</dt>
                    <dd
                      className="text-right text-xs font-medium text-[var(--text-primary)]"
                      style={{ fontVariantNumeric: "tabular-nums" }}
                    >
                      {m.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          </div>
        );
      })}
    </div>
  );
}
