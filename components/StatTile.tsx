export function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="rounded-lg border p-4" style={{ background: "var(--surface-1)", borderColor: "var(--border)" }}>
      <div className="text-xs font-medium text-[var(--text-muted)]">{label}</div>
      <div className="mt-1.5 text-[28px] font-semibold leading-none text-[var(--text-primary)]">{value}</div>
      {hint && <div className="mt-1.5 text-xs text-[var(--text-secondary)]">{hint}</div>}
    </div>
  );
}
