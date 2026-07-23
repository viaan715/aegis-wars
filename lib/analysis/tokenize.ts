export function tokenize(text: string): string[] {
  const matches = text.toLowerCase().match(/[\p{L}\p{N}']+/gu);
  return matches ?? [];
}

export function wordNgrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const grams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    grams.push(tokens.slice(i, i + n).join(" "));
  }
  return grams;
}

/** Word-level shingles used for Jaccard/MinHash near-duplicate detection. */
export function shingleSet(tokens: string[], n = 3): Set<string> {
  return new Set(wordNgrams(tokens, n));
}

export function jaccardSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 && b.size === 0) return 1;
  let intersection = 0;
  const [small, big] = a.size <= b.size ? [a, b] : [b, a];
  for (const item of small) {
    if (big.has(item)) intersection++;
  }
  const union = a.size + b.size - intersection;
  return union === 0 ? 1 : intersection / union;
}
