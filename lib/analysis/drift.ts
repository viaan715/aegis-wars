import { tokenize } from "./tokenize";
import type { ParsedRecord } from "./types";

export interface DriftResult {
  similarityToCentroid: number[];
  meanSimilarity: number;
  outlierIndices: number[];
  chunkDrift: number[];
  maxChunkDrift: number;
}

type SparseVector = Map<string, number>;

function buildTfIdfVectors(records: ParsedRecord[]): SparseVector[] {
  const n = records.length;
  const tokenLists = records.map((r) => tokenize(r.text));

  const df = new Map<string, number>();
  for (const tokens of tokenLists) {
    for (const t of new Set(tokens)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const idf = new Map<string, number>();
  for (const [term, count] of df) idf.set(term, Math.log((n + 1) / (count + 1)) + 1);

  return tokenLists.map((tokens) => {
    const tf = new Map<string, number>();
    for (const t of tokens) tf.set(t, (tf.get(t) ?? 0) + 1);
    const vec: SparseVector = new Map();
    for (const [term, count] of tf) {
      vec.set(term, (count / tokens.length) * (idf.get(term) ?? 0));
    }
    return vec;
  });
}

function vectorNorm(vec: SparseVector): number {
  let sum = 0;
  for (const w of vec.values()) sum += w * w;
  return Math.sqrt(sum);
}

function cosineSimilarity(a: SparseVector, b: SparseVector): number {
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  let dot = 0;
  for (const [term, weight] of small) {
    const otherWeight = big.get(term);
    if (otherWeight) dot += weight * otherWeight;
  }
  const na = vectorNorm(a);
  const nb = vectorNorm(b);
  return na === 0 || nb === 0 ? 0 : dot / (na * nb);
}

function centroidOf(vectors: SparseVector[]): SparseVector {
  const sum: SparseVector = new Map();
  for (const vec of vectors) {
    for (const [term, weight] of vec) sum.set(term, (sum.get(term) ?? 0) + weight);
  }
  if (vectors.length > 0) {
    for (const [term, weight] of sum) sum.set(term, weight / vectors.length);
  }
  return sum;
}

/**
 * Builds TF-IDF vectors for every record, then measures two kinds of semantic
 * drift without downloading an embedding model:
 *  - Outliers: records whose cosine similarity to the whole-dataset centroid
 *    sits well below the mean (flags off-topic / mismatched records).
 *  - Chunk drift: the dataset is split into ordered chunks and consecutive
 *    chunk centroids are compared, catching gradual topic drift across a
 *    large generation batch (e.g. a model drifting off-task over a long run).
 */
export function analyzeDrift(records: ParsedRecord[], chunkCount = 10): DriftResult {
  const n = records.length;
  if (n === 0) {
    return { similarityToCentroid: [], meanSimilarity: 1, outlierIndices: [], chunkDrift: [], maxChunkDrift: 0 };
  }

  const vectors = buildTfIdfVectors(records);
  const globalCentroid = centroidOf(vectors);
  const similarityToCentroid = vectors.map((v) => cosineSimilarity(v, globalCentroid));

  const mean = similarityToCentroid.reduce((a, b) => a + b, 0) / n;
  const variance = similarityToCentroid.reduce((a, b) => a + (b - mean) ** 2, 0) / n;
  const stddev = Math.sqrt(variance);
  const threshold = Math.max(0, mean - 1.5 * stddev);

  const outlierIndices: number[] = [];
  similarityToCentroid.forEach((sim, i) => {
    if (sim < threshold) outlierIndices.push(records[i].index);
  });

  const chunkDrift: number[] = [];
  if (n >= chunkCount * 5) {
    const chunkSize = Math.floor(n / chunkCount);
    const chunkCentroids: SparseVector[] = [];
    for (let c = 0; c < chunkCount; c++) {
      const start = c * chunkSize;
      const end = c === chunkCount - 1 ? n : start + chunkSize;
      chunkCentroids.push(centroidOf(vectors.slice(start, end)));
    }
    for (let c = 1; c < chunkCentroids.length; c++) {
      chunkDrift.push(1 - cosineSimilarity(chunkCentroids[c - 1], chunkCentroids[c]));
    }
  }
  const maxChunkDrift = chunkDrift.length ? Math.max(...chunkDrift) : 0;

  return { similarityToCentroid, meanSimilarity: mean, outlierIndices, chunkDrift, maxChunkDrift };
}
