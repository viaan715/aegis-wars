import type { ParsedRecord } from "./types";

export interface CorruptionResult {
  emptyIndices: number[];
  encodingIssueIndices: number[];
  schemaMismatchIndices: number[];
  lengthOutlierIndices: number[];
  corruptionRate: number;
}

const MOJIBAKE_PATTERN = /Ã[\x80-\xBF]|â€[™œžŠ¦¢]|�/;
const CONTROL_CHAR_PATTERN = /[\x00-\x08\x0B\x0C\x0E-\x1F]/;

/**
 * Structural checks that don't need text semantics: missing/empty fields,
 * mojibake / stray control characters from bad encoding round-trips,
 * schema drift against the dataset's modal field set, and length outliers
 * via IQR (catches truncated or runaway-generation records).
 */
export function analyzeCorruption(records: ParsedRecord[], fields: string[]): CorruptionResult {
  const n = records.length;

  const signatureCounts = new Map<string, number>();
  for (const r of records) {
    const sig = Object.keys(r.raw).sort().join(",");
    signatureCounts.set(sig, (signatureCounts.get(sig) ?? 0) + 1);
  }
  let modalSig = "";
  let modalCount = -1;
  for (const [sig, count] of signatureCounts) {
    if (count > modalCount) {
      modalCount = count;
      modalSig = sig;
    }
  }

  const lengths = records.map((r) => r.text.length).sort((a, b) => a - b);
  const q1 = lengths[Math.floor(lengths.length * 0.25)] ?? 0;
  const q3 = lengths[Math.floor(lengths.length * 0.75)] ?? 0;
  const iqr = q3 - q1;
  const lowerBound = Math.max(0, q1 - 1.5 * iqr);
  const upperBound = q3 + 1.5 * iqr;

  const emptyIndices: number[] = [];
  const encodingIssueIndices: number[] = [];
  const schemaMismatchIndices: number[] = [];
  const lengthOutlierIndices: number[] = [];

  records.forEach((r) => {
    if (!r.text || r.text.trim().length === 0) {
      emptyIndices.push(r.index);
      return;
    }
    if (MOJIBAKE_PATTERN.test(r.text) || CONTROL_CHAR_PATTERN.test(r.text)) {
      encodingIssueIndices.push(r.index);
    }
    if (fields.length > 1) {
      const sig = Object.keys(r.raw).sort().join(",");
      if (sig !== modalSig) schemaMismatchIndices.push(r.index);
    }
    if (r.text.length < lowerBound || r.text.length > upperBound) {
      lengthOutlierIndices.push(r.index);
    }
  });

  const flaggedSet = new Set([
    ...emptyIndices,
    ...encodingIssueIndices,
    ...schemaMismatchIndices,
    ...lengthOutlierIndices,
  ]);
  const corruptionRate = n === 0 ? 0 : flaggedSet.size / n;

  return { emptyIndices, encodingIssueIndices, schemaMismatchIndices, lengthOutlierIndices, corruptionRate };
}
