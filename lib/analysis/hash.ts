/** FNV-1a 32-bit hash, seeded by mixing the seed into the offset basis. Fast, deterministic, no crypto dependency needed for fingerprinting/MinHash. */
export function fnv1a(str: string, seed = 0): number {
  let hash = (0x811c9dc5 ^ seed) >>> 0;
  for (let i = 0; i < str.length; i++) {
    hash ^= str.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return hash >>> 0;
}

export function normalizeWhitespace(text: string): string {
  return text.trim().replace(/\s+/g, " ").toLowerCase();
}
