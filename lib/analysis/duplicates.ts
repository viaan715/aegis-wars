import { fnv1a, normalizeWhitespace } from "./hash";
import { jaccardSimilarity, shingleSet, tokenize } from "./tokenize";
import type { ParsedRecord } from "./types";

export interface DuplicateResult {
  exactGroups: number[][];
  nearPairs: { a: number; b: number; similarity: number }[];
  exactDuplicateIndices: Set<number>;
  nearDuplicateIndices: Set<number>;
  duplicateRate: number;
}

const NUM_HASHES = 16;
const BANDS = 8;
const ROWS_PER_BAND = NUM_HASHES / BANDS;
const NEAR_DUP_THRESHOLD = 0.75;
const MAX_BUCKET_SIZE = 200;

/** MinHash signature over a shingle set: for each of NUM_HASHES independent hash functions, keep the minimum hash value seen across all shingles. Two sets with high Jaccard similarity are likely to share minima. */
function minhashSignature(shingles: Set<string>): number[] {
  const sig = new Array(NUM_HASHES).fill(Infinity);
  for (const shingle of shingles) {
    for (let i = 0; i < NUM_HASHES; i++) {
      const h = fnv1a(shingle, i * 2654435761 + 1);
      if (h < sig[i]) sig[i] = h;
    }
  }
  return sig;
}

/**
 * Exact duplicates: hash of normalized text. Near duplicates: MinHash signatures
 * banded into LSH buckets (candidates only need to match in ONE band), then
 * verified with true Jaccard similarity on the candidate pairs. This avoids the
 * O(n^2) cost of comparing every record against every other record.
 */
export function detectDuplicates(records: ParsedRecord[]): DuplicateResult {
  const n = records.length;

  const exactMap = new Map<string, number[]>();
  for (const r of records) {
    const key = normalizeWhitespace(r.text);
    if (!key) continue;
    const list = exactMap.get(key) ?? [];
    list.push(r.index);
    exactMap.set(key, list);
  }
  const exactGroups = Array.from(exactMap.values()).filter((g) => g.length > 1);
  const exactDuplicateIndices = new Set<number>();
  for (const g of exactGroups) {
    for (let i = 1; i < g.length; i++) exactDuplicateIndices.add(g[i]);
  }

  const shingles: Set<string>[] = records.map((r) => shingleSet(tokenize(r.text), 3));
  const signatures: number[][] = shingles.map((s) => (s.size > 0 ? minhashSignature(s) : []));

  const bandBuckets: Map<string, number[]>[] = Array.from({ length: BANDS }, () => new Map());
  for (let i = 0; i < n; i++) {
    if (signatures[i].length === 0) continue;
    for (let b = 0; b < BANDS; b++) {
      const start = b * ROWS_PER_BAND;
      const bandKey = signatures[i].slice(start, start + ROWS_PER_BAND).join("|");
      const bucket = bandBuckets[b];
      const list = bucket.get(bandKey) ?? [];
      list.push(i);
      bucket.set(bandKey, list);
    }
  }

  const candidatePairs = new Set<string>();
  for (const bucket of bandBuckets) {
    for (const list of bucket.values()) {
      if (list.length < 2 || list.length > MAX_BUCKET_SIZE) continue;
      for (let a = 0; a < list.length; a++) {
        for (let b = a + 1; b < list.length; b++) {
          candidatePairs.add(`${list[a]}-${list[b]}`);
        }
      }
    }
  }

  const nearPairs: { a: number; b: number; similarity: number }[] = [];
  const nearDuplicateIndices = new Set<number>();
  for (const key of candidatePairs) {
    const [aStr, bStr] = key.split("-");
    const a = Number(aStr);
    const b = Number(bStr);
    if (exactDuplicateIndices.has(a) || exactDuplicateIndices.has(b)) continue;
    const sim = jaccardSimilarity(shingles[a], shingles[b]);
    if (sim >= NEAR_DUP_THRESHOLD) {
      nearPairs.push({ a, b, similarity: sim });
      nearDuplicateIndices.add(b);
    }
  }

  const duplicateRate = n === 0 ? 0 : (exactDuplicateIndices.size + nearDuplicateIndices.size) / n;

  return { exactGroups, nearPairs, exactDuplicateIndices, nearDuplicateIndices, duplicateRate };
}
