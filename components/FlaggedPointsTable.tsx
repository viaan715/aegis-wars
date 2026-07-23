import type { FlaggedPoint } from "@/lib/analysis/types";
import { CATEGORY_LABEL, SEVERITY_LABEL, categoryColorVar, SEVERITY_COLOR_VAR } from "@/lib/ui/colors";

function SeverityBadge({ severity }: { severity: FlaggedPoint["severity"] }) {
  const colorVar = SEVERITY_COLOR_VAR[severity];
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-medium text-[var(--text-primary)]" style={{ borderColor: "var(--border)" }}>
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden />
      {SEVERITY_LABEL[severity]}
    </span>
  );
}

function CategoryBadge({ category }: { category: FlaggedPoint["category"] }) {
  const colorVar = categoryColorVar(category);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-xs text-[var(--text-secondary)]">
      <span className="h-2 w-2 rounded-full" style={{ background: `var(${colorVar})` }} aria-hidden />
      {CATEGORY_LABEL[category]}
    </span>
  );
}

export function FlaggedPointsTable({ flagged, totalFlaggedCount }: { flagged: FlaggedPoint[]; totalFlaggedCount: number }) {
  if (flagged.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center text-sm text-[var(--text-secondary)]" style={{ borderColor: "var(--border)" }}>
        No records were flagged — nothing skewed, duplicated, or corrupted stood out.
      </div>
    );
  }

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "var(--border)" }}>
        <table className="w-full min-w-[640px] border-collapse text-sm">
          <thead>
            <tr className="border-b text-left text-xs text-[var(--text-muted)]" style={{ borderColor: "var(--border)" }}>
              <th className="px-3 py-2 font-medium" style={{ fontVariantNumeric: "tabular-nums" }}>
                Row
              </th>
              <th className="px-3 py-2 font-medium">Severity</th>
              <th className="px-3 py-2 font-medium">Check</th>
              <th className="px-3 py-2 font-medium">Reason</th>
              <th className="px-3 py-2 text-right font-medium">Score</th>
            </tr>
          </thead>
          <tbody>
            {flagged.map((f) => (
              <tr key={f.index} className="border-b last:border-0" style={{ borderColor: "var(--border)" }}>
                <td className="px-3 py-2 font-mono text-xs text-[var(--text-muted)]" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {f.index + 1}
                </td>
                <td className="px-3 py-2">
                  <SeverityBadge severity={f.severity} />
                </td>
                <td className="px-3 py-2">
                  <CategoryBadge category={f.category} />
                </td>
                <td className="max-w-[420px] px-3 py-2">
                  <div className="text-[var(--text-primary)]">{f.message}</div>
                  <div className="mt-0.5 truncate font-mono text-xs text-[var(--text-muted)]" title={f.preview}>
                    {f.preview || "(empty)"}
                  </div>
                </td>
                <td
                  className="px-3 py-2 text-right font-mono font-medium text-[var(--text-primary)]"
                  style={{ fontVariantNumeric: "tabular-nums" }}
                >
                  {f.recordScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {totalFlaggedCount > flagged.length && (
        <p className="mt-2 text-xs text-[var(--text-muted)]">
          Showing the {flagged.length} lowest-scoring of {totalFlaggedCount.toLocaleString()} flagged records.
        </p>
      )}
    </div>
  );
}
