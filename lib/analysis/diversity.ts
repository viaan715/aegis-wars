import { tokenize, wordNgrams } from "./tokenize";
import type { ParsedRecord } from "./types";

export interface RepetitionResult {
  perRecordRepetitionRatio: number[];
  highRepetitionIndices: number[];
  meanRepetitionRatio: number;
}

/** Repetition ratio = 1 - (distinct n-grams / total n-grams). A record repeating the same phrase scores close to 1. */
export function analyzeRepetition(records: ParsedRecord[], ngramSize = 3): RepetitionResult {
  const ratios: number[] = new Array(records.length).fill(0);
  const highRepetitionIndices: number[] = [];

  records.forEach((r) => {
    const tokens = tokenize(r.text);
    if (tokens.length < ngramSize + 2) return;
    const grams = wordNgrams(tokens, ngramSize);
    const distinct = new Set(grams).size;
    const ratio = 1 - distinct / grams.length;
    ratios[r.index] = ratio;
    if (ratio >= 0.5) highRepetitionIndices.push(r.index);
  });

  const meanRepetitionRatio = ratios.length ? ratios.reduce((a, b) => a + b, 0) / ratios.length : 0;
  return { perRecordRepetitionRatio: ratios, highRepetitionIndices, meanRepetitionRatio };
}

export interface DiversityResult {
  perRecordTTR: number[];
  tokenCounts: number[];
  meanTTR: number;
  vocabularySize: number;
  totalTokens: number;
  /** Herdan's C: log(vocabulary) / log(total tokens) — a length-corrected lexical diversity measure. */
  correctedTTR: number;
}

export function analyzeDiversity(records: ParsedRecord[]): DiversityResult {
  const perRecordTTR: number[] = new Array(records.length).fill(0);
  const tokenCounts: number[] = new Array(records.length).fill(0);
  const globalVocab = new Set<string>();
  let totalTokens = 0;

  records.forEach((r) => {
    const tokens = tokenize(r.text);
    tokenCounts[r.index] = tokens.length;
    totalTokens += tokens.length;
    for (const t of tokens) globalVocab.add(t);
    if (tokens.length === 0) return;
    perRecordTTR[r.index] = new Set(tokens).size / tokens.length;
  });

  const meanTTR = perRecordTTR.length ? perRecordTTR.reduce((a, b) => a + b, 0) / perRecordTTR.length : 0;
  const correctedTTR = totalTokens > 1 ? Math.log(Math.max(globalVocab.size, 1)) / Math.log(totalTokens) : 0;

  return { perRecordTTR, tokenCounts, meanTTR, vocabularySize: globalVocab.size, totalTokens, correctedTTR };
}
