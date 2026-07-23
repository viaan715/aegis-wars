import type { DimensionKey, Grade } from "./types";

export function scoreToGrade(score: number): Grade {
  if (score >= 90) return "A";
  if (score >= 80) return "B";
  if (score >= 70) return "C";
  if (score >= 60) return "D";
  return "F";
}

export function clampScore(score: number): number {
  return Math.max(0, Math.min(100, Math.round(score)));
}

export const DIMENSION_WEIGHTS: Record<DimensionKey, number> = {
  repetition: 0.3,
  diversity: 0.25,
  drift: 0.2,
  corruption: 0.25,
};

export const GRADE_DESCRIPTIONS: Record<Grade, string> = {
  A: "High variety, low duplication — safe to train on.",
  B: "Solid overall, minor issues worth spot-checking.",
  C: "Usable but noisy — review flagged records before training.",
  D: "Significant repetition or corruption — clean before training.",
  F: "Heavily repetitive or corrupted — not recommended for training.",
};
