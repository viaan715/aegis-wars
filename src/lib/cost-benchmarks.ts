import { ProjectType } from "./types";

export interface CostBenchmark {
  low: number;
  high: number;
}

/**
 * Rough national-average U.S. cost ranges for a full-scope project of each type, based on
 * commonly cited industry cost guides. These are illustrative, not quotes — actual costs vary
 * a lot by region, square footage, and finish level. Used only to flag contract totals that
 * look implausibly low (a common sign of a lowball bid that was never going to be finished
 * properly) or unusually high for the type of work.
 */
export const COST_BENCHMARKS: Record<ProjectType, CostBenchmark> = {
  kitchen: { low: 15_000, high: 60_000 },
  bathroom: { low: 8_000, high: 35_000 },
  open_concept: { low: 5_000, high: 30_000 },
  basement_finishing: { low: 15_000, high: 50_000 },
  attic_conversion: { low: 20_000, high: 60_000 },
  garage_conversion: { low: 10_000, high: 35_000 },
  room_addition: { low: 40_000, high: 150_000 },
  sunroom_porch: { low: 15_000, high: 60_000 },
  second_story_addition: { low: 100_000, high: 300_000 },
  siding_replacement: { low: 8_000, high: 25_000 },
  roof_remodel: { low: 8_000, high: 30_000 },
  deck_patio: { low: 5_000, high: 30_000 },
  door_window_upgrade: { low: 3_000, high: 20_000 },
  hvac_update: { low: 5_000, high: 18_000 },
  electrical_plumbing_update: { low: 3_000, high: 20_000 },
  smart_home: { low: 1_500, high: 15_000 },
  flooring_replacement: { low: 3_000, high: 18_000 },
  interior_painting: { low: 1_500, high: 8_000 },
  molding_trim: { low: 1_000, high: 8_000 },
};

export function costBenchmarkFor(projectType: ProjectType): CostBenchmark {
  return COST_BENCHMARKS[projectType];
}
