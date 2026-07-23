import type { DimensionKey, FlagCategory, Grade, Severity } from "@/lib/analysis/types";

/** Fixed categorical assignment — reused across the dimension chart and the flagged-points table so the same hue always means the same check, everywhere in the dashboard. */
export const DIMENSION_COLOR_VAR: Record<DimensionKey, string> = {
  repetition: "--series-1",
  diversity: "--series-2",
  drift: "--series-3",
  corruption: "--series-4",
};

const CATEGORY_TO_DIMENSION: Record<FlagCategory, DimensionKey> = {
  "exact-duplicate": "repetition",
  "near-duplicate": "repetition",
  repetition: "repetition",
  "low-diversity": "diversity",
  "semantic-outlier": "drift",
  corruption: "corruption",
  schema: "corruption",
};

export function categoryColorVar(category: FlagCategory): string {
  return DIMENSION_COLOR_VAR[CATEGORY_TO_DIMENSION[category]];
}

export const CATEGORY_LABEL: Record<FlagCategory, string> = {
  "exact-duplicate": "Exact duplicate",
  "near-duplicate": "Near duplicate",
  repetition: "Repetition",
  "low-diversity": "Low diversity",
  "semantic-outlier": "Semantic outlier",
  corruption: "Corruption",
  schema: "Schema mismatch",
};

export const SEVERITY_COLOR_VAR: Record<Severity, string> = {
  warning: "--status-warning",
  serious: "--status-serious",
  critical: "--status-critical",
};

export const SEVERITY_LABEL: Record<Severity, string> = {
  warning: "Warning",
  serious: "Serious",
  critical: "Critical",
};

export const GRADE_COLOR_VAR: Record<Grade, string> = {
  A: "--status-good",
  B: "--status-good",
  C: "--status-warning",
  D: "--status-serious",
  F: "--status-critical",
};

export function scoreColorVar(score: number): string {
  if (score >= 80) return "--status-good";
  if (score >= 70) return "--status-warning";
  if (score >= 60) return "--status-serious";
  return "--status-critical";
}
