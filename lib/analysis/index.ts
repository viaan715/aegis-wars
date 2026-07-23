import { parseDataset } from "./parse";
import { detectDuplicates } from "./duplicates";
import { analyzeRepetition, analyzeDiversity } from "./diversity";
import { analyzeDrift } from "./drift";
import { analyzeCorruption } from "./corruption";
import { clampScore, scoreToGrade, DIMENSION_WEIGHTS } from "./grade";
import type {
  AnalysisReport,
  DimensionScore,
  FlagCategory,
  FlaggedPoint,
  HistogramBucket,
  ParsedRecord,
  Severity,
} from "./types";

export const MAX_RECORDS = 20000;

const SEVERITY_RANK: Record<Severity, number> = { warning: 1, serious: 2, critical: 3 };

function preview(text: string, len = 140): string {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length > len ? clean.slice(0, len) + "…" : clean;
}

function addFlag(
  map: Map<number, FlaggedPoint>,
  records: ParsedRecord[],
  scores: number[],
  index: number,
  category: FlagCategory,
  severity: Severity,
  message: string
) {
  const existing = map.get(index);
  if (!existing) {
    map.set(index, {
      index,
      category,
      severity,
      message,
      preview: preview(records[index].text),
      recordScore: scores[index],
    });
    return;
  }
  existing.message = `${existing.message}; ${message}`;
  if (SEVERITY_RANK[severity] > SEVERITY_RANK[existing.severity]) {
    existing.severity = severity;
    existing.category = category;
  }
}

function buildHistogram(scores: number[]): HistogramBucket[] {
  const buckets: HistogramBucket[] = Array.from({ length: 10 }, (_, i) => ({
    bucket: i === 9 ? "90-100" : `${i * 10}-${i * 10 + 10}`,
    min: i * 10,
    max: i === 9 ? 100 : i * 10 + 10,
    count: 0,
  }));
  for (const s of scores) {
    buckets[Math.min(9, Math.floor(s / 10))].count++;
  }
  return buckets;
}

export function analyzeDataset(raw: string, fileName: string): AnalysisReport {
  const parsed = parseDataset(raw, fileName);
  const truncated = parsed.records.length > MAX_RECORDS;
  const records = truncated ? parsed.records.slice(0, MAX_RECORDS) : parsed.records;
  const n = records.length;

  if (n === 0) {
    throw new Error("No records found in the uploaded file.");
  }

  const duplicates = detectDuplicates(records);
  const repetition = analyzeRepetition(records);
  const diversity = analyzeDiversity(records);
  const drift = analyzeDrift(records);
  const corruption = analyzeCorruption(records, parsed.fields);

  const outlierSet = new Set(drift.outlierIndices);
  const emptySet = new Set(corruption.emptyIndices);
  const encodingSet = new Set(corruption.encodingIssueIndices);
  const schemaSet = new Set(corruption.schemaMismatchIndices);
  const lengthOutlierSet = new Set(corruption.lengthOutlierIndices);

  const recordScores: number[] = records.map((r) => {
    let score = 100;
    if (duplicates.exactDuplicateIndices.has(r.index)) score -= 45;
    else if (duplicates.nearDuplicateIndices.has(r.index)) score -= 30;
    score -= repetition.perRecordRepetitionRatio[r.index] * 35;
    score -= (1 - diversity.perRecordTTR[r.index]) * 15;
    if (outlierSet.has(r.index)) score -= 20;
    if (emptySet.has(r.index)) score -= 60;
    if (encodingSet.has(r.index)) score -= 25;
    if (schemaSet.has(r.index)) score -= 10;
    if (lengthOutlierSet.has(r.index)) score -= 15;
    return clampScore(score);
  });

  const flagMap = new Map<number, FlaggedPoint>();
  for (const idx of duplicates.exactDuplicateIndices) {
    addFlag(flagMap, records, recordScores, idx, "exact-duplicate", "critical", "Exact duplicate of another record");
  }
  for (const idx of duplicates.nearDuplicateIndices) {
    addFlag(
      flagMap,
      records,
      recordScores,
      idx,
      "near-duplicate",
      "serious",
      "Near-duplicate of another record (≥75% shingle overlap)"
    );
  }
  repetition.highRepetitionIndices.forEach((idx) => {
    const pct = Math.round(repetition.perRecordRepetitionRatio[idx] * 100);
    addFlag(flagMap, records, recordScores, idx, "repetition", "serious", `High internal repetition (${pct}% repeated 3-grams)`);
  });
  diversity.perRecordTTR.forEach((ttr, idx) => {
    if (diversity.tokenCounts[idx] >= 8 && ttr < 0.4) {
      addFlag(
        flagMap,
        records,
        recordScores,
        idx,
        "low-diversity",
        "warning",
        `Low vocabulary diversity (type-token ratio ${ttr.toFixed(2)})`
      );
    }
  });
  outlierSet.forEach((idx) => {
    addFlag(
      flagMap,
      records,
      recordScores,
      idx,
      "semantic-outlier",
      "warning",
      "Semantic outlier (low TF-IDF cosine similarity to dataset centroid)"
    );
  });
  emptySet.forEach((idx) => {
    addFlag(flagMap, records, recordScores, idx, "corruption", "critical", "Empty or missing text field");
  });
  encodingSet.forEach((idx) => {
    addFlag(flagMap, records, recordScores, idx, "corruption", "serious", "Possible encoding corruption (mojibake or control characters)");
  });
  lengthOutlierSet.forEach((idx) => {
    addFlag(
      flagMap,
      records,
      recordScores,
      idx,
      "corruption",
      "warning",
      `Length outlier (${records[idx].text.length} chars, outside IQR bounds)`
    );
  });
  schemaSet.forEach((idx) => {
    addFlag(flagMap, records, recordScores, idx, "schema", "warning", "Field set differs from the dataset's modal schema");
  });

  const flaggedAll = Array.from(flagMap.values()).sort((a, b) => a.recordScore - b.recordScore);
  const totalFlaggedCount = flaggedAll.length;
  const flagged = flaggedAll.slice(0, 500);

  const repetitionScore = clampScore(100 - duplicates.duplicateRate * 70 - repetition.meanRepetitionRatio * 50);
  const diversityScore = clampScore(diversity.meanTTR * 70 + Math.min(diversity.correctedTTR, 1) * 30);
  const outlierRate = drift.outlierIndices.length / n;
  const driftScore = clampScore(100 - outlierRate * 60 - drift.maxChunkDrift * 40);
  const corruptionScore = clampScore(100 - corruption.corruptionRate * 100);

  const dimensions: DimensionScore[] = [
    {
      key: "repetition",
      label: "Repetition",
      score: repetitionScore,
      summary: `${(duplicates.duplicateRate * 100).toFixed(1)}% duplicate rate, ${(repetition.meanRepetitionRatio * 100).toFixed(1)}% mean intra-record repetition.`,
      metrics: [
        { label: "Exact duplicates", value: String(duplicates.exactDuplicateIndices.size) },
        { label: "Near duplicates", value: String(duplicates.nearDuplicateIndices.size) },
        { label: "Duplicate rate", value: `${(duplicates.duplicateRate * 100).toFixed(1)}%` },
        { label: "Mean intra-record repetition", value: `${(repetition.meanRepetitionRatio * 100).toFixed(1)}%` },
      ],
    },
    {
      key: "diversity",
      label: "Token diversity",
      score: diversityScore,
      summary: `Mean type-token ratio ${diversity.meanTTR.toFixed(2)} across ${diversity.vocabularySize.toLocaleString()} unique tokens.`,
      metrics: [
        { label: "Mean type-token ratio", value: diversity.meanTTR.toFixed(2) },
        { label: "Vocabulary size", value: diversity.vocabularySize.toLocaleString() },
        { label: "Total tokens", value: diversity.totalTokens.toLocaleString() },
        { label: "Herdan's C (corrected TTR)", value: diversity.correctedTTR.toFixed(2) },
      ],
    },
    {
      key: "drift",
      label: "Semantic drift",
      score: driftScore,
      summary: `${drift.outlierIndices.length} semantic outliers, max chunk-to-chunk drift ${drift.maxChunkDrift.toFixed(2)}.`,
      metrics: [
        { label: "Mean similarity to centroid", value: drift.meanSimilarity.toFixed(2) },
        { label: "Semantic outliers", value: String(drift.outlierIndices.length) },
        { label: "Max chunk-to-chunk drift", value: drift.maxChunkDrift.toFixed(2) },
      ],
    },
    {
      key: "corruption",
      label: "Corruption",
      score: corruptionScore,
      summary: `${(corruption.corruptionRate * 100).toFixed(1)}% of records show a structural issue.`,
      metrics: [
        { label: "Empty / missing fields", value: String(corruption.emptyIndices.length) },
        { label: "Encoding issues", value: String(corruption.encodingIssueIndices.length) },
        { label: "Schema mismatches", value: String(corruption.schemaMismatchIndices.length) },
        { label: "Length outliers", value: String(corruption.lengthOutlierIndices.length) },
      ],
    },
  ];

  const overallScore = clampScore(
    dimensions.reduce((sum, d) => sum + d.score * DIMENSION_WEIGHTS[d.key], 0)
  );

  return {
    fileName,
    format: parsed.format,
    recordCount: n,
    fields: parsed.fields,
    textField: parsed.textField,
    overallScore,
    grade: scoreToGrade(overallScore),
    dimensions,
    flagged,
    totalFlaggedCount,
    histogram: buildHistogram(recordScores),
    recordScores,
    parseIssues: parsed.issues,
    truncated,
  };
}
