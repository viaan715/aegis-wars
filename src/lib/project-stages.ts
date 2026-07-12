import { ProjectType } from "./types";

export interface StageDefinition {
  id: string;
  label: string;
  /** Rough share of total project value this stage represents, 0-1. Stages per type sum to 1. */
  valueWeight: number;
}

export const STAGE_SEQUENCES: Record<ProjectType, StageDefinition[]> = {
  kitchen: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "demo", label: "Demolition", valueWeight: 0.1 },
    { id: "rough_in", label: "Rough-in (plumbing, electrical, HVAC)", valueWeight: 0.15 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.1 },
    { id: "cabinets", label: "Cabinet installation", valueWeight: 0.2 },
    { id: "countertops", label: "Countertop template & install", valueWeight: 0.12 },
    { id: "backsplash", label: "Backsplash", valueWeight: 0.05 },
    { id: "appliances", label: "Appliance install & hookup", valueWeight: 0.08 },
    { id: "flooring", label: "Flooring", valueWeight: 0.07 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  bathroom: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "demo", label: "Demolition", valueWeight: 0.1 },
    { id: "rough_in", label: "Rough-in (plumbing, electrical)", valueWeight: 0.17 },
    { id: "waterproofing", label: "Waterproofing / membrane", valueWeight: 0.1 },
    { id: "tile", label: "Tile work", valueWeight: 0.2 },
    { id: "vanity_fixtures", label: "Vanity, tub/shower & fixtures install", valueWeight: 0.18 },
    { id: "flooring", label: "Flooring", valueWeight: 0.08 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.09 },
  ],
};

export const STANDARD_MISSING_DOC_CHECKLIST = [
  "Signed contract",
  "Building permit",
  "Change orders (for any work added or altered after the contract was signed)",
  "Lien waivers (for each payment made)",
  "Payment receipts / invoices",
  "Inspection sign-offs",
] as const;

export const ALREADY_TRIED_OPTIONS = [
  "Called or texted the contractor",
  "Emailed the contractor",
  "Sent a written demand letter",
  "Filed a complaint with the state licensing board",
  "Filed a complaint with the Better Business Bureau",
  "Contacted a construction attorney",
  "Filed a claim against the contractor's bond or insurance",
  "Nothing yet",
] as const;

export function scopeChecklistFor(projectType: ProjectType): string[] {
  return STAGE_SEQUENCES[projectType].map((s) => s.label);
}
