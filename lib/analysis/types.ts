export type SourceFormat = "csv" | "json" | "jsonl";

export interface ParsedRecord {
  index: number;
  raw: Record<string, unknown>;
  text: string;
}

export interface ParseIssue {
  index: number;
  message: string;
}

export interface ParseResult {
  records: ParsedRecord[];
  fields: string[];
  textField: string | null;
  format: SourceFormat;
  issues: ParseIssue[];
}

export type FlagCategory =
  | "exact-duplicate"
  | "near-duplicate"
  | "repetition"
  | "low-diversity"
  | "semantic-outlier"
  | "corruption"
  | "schema";

export type Severity = "warning" | "serious" | "critical";

export interface FlaggedPoint {
  index: number;
  category: FlagCategory;
  severity: Severity;
  message: string;
  preview: string;
  recordScore: number;
}

export type DimensionKey = "repetition" | "diversity" | "drift" | "corruption";

export interface DimensionScore {
  key: DimensionKey;
  label: string;
  score: number;
  summary: string;
  metrics: { label: string; value: string }[];
}

export type Grade = "A" | "B" | "C" | "D" | "F";

export interface HistogramBucket {
  bucket: string;
  min: number;
  max: number;
  count: number;
}

export interface AnalysisReport {
  fileName: string;
  format: SourceFormat;
  recordCount: number;
  fields: string[];
  textField: string | null;
  overallScore: number;
  grade: Grade;
  dimensions: DimensionScore[];
  flagged: FlaggedPoint[];
  totalFlaggedCount: number;
  histogram: HistogramBucket[];
  recordScores: number[];
  parseIssues: ParseIssue[];
  truncated: boolean;
}
