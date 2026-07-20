import { ProjectType } from "./types";

export interface StageDefinition {
  id: string;
  label: string;
  /** Rough share of total project value this stage represents, 0-1. Stages per type sum to 1. */
  valueWeight: number;
}

export interface ProjectTypeMeta {
  /** Short label for pickers and chips. */
  label: string;
  /** Full sentence-ready label, e.g. "Kitchen renovation" for report headers. */
  reportLabel: string;
  group: string;
  /** Whether this project type typically requires a building/mechanical/electrical permit. */
  requiresPermitTypically: boolean;
  /** Whether this project type typically involves plumbing/electrical/mechanical rough-in work. */
  hasRoughIn: boolean;
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
  open_concept: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.1 },
    { id: "shoring_prep", label: "Temporary shoring & site prep", valueWeight: 0.08 },
    { id: "wall_demo", label: "Wall demolition", valueWeight: 0.15 },
    { id: "structural_beam", label: "Structural beam / header installation", valueWeight: 0.2 },
    { id: "electrical_hvac_reroute", label: "Electrical & HVAC rerouting", valueWeight: 0.15 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.15 },
    { id: "flooring_transition", label: "Flooring transition & finish work", valueWeight: 0.12 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  basement_finishing: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "waterproofing", label: "Moisture control & waterproofing prep", valueWeight: 0.1 },
    { id: "framing", label: "Framing", valueWeight: 0.15 },
    { id: "rough_in", label: "Rough-in (electrical, plumbing, HVAC)", valueWeight: 0.2 },
    { id: "insulation", label: "Insulation", valueWeight: 0.08 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.15 },
    { id: "flooring", label: "Flooring", valueWeight: 0.1 },
    { id: "trim_fixtures", label: "Trim, fixtures & built-ins", valueWeight: 0.09 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  attic_conversion: [
    {
      id: "design_permits",
      label: "Design finalized & permits pulled (structural & egress review)",
      valueWeight: 0.1,
    },
    { id: "framing_dormers", label: "Framing, dormers & skylights", valueWeight: 0.2 },
    { id: "insulation", label: "Insulation", valueWeight: 0.1 },
    { id: "electrical_rough_in", label: "Electrical rough-in", valueWeight: 0.12 },
    { id: "stairs", label: "Stairs installation", valueWeight: 0.13 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.15 },
    { id: "flooring", label: "Flooring", valueWeight: 0.15 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  garage_conversion: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.1 },
    { id: "insulation_framing", label: "Wall & ceiling insulation and framing", valueWeight: 0.15 },
    { id: "rough_in", label: "Electrical & plumbing rough-in", valueWeight: 0.15 },
    { id: "hvac_extension", label: "HVAC extension", valueWeight: 0.1 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.2 },
    { id: "flooring", label: "Flooring", valueWeight: 0.12 },
    { id: "door_conversion", label: "Garage door removal & wall/entry conversion", valueWeight: 0.13 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  room_addition: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "site_foundation", label: "Site prep & foundation", valueWeight: 0.15 },
    { id: "framing", label: "Framing & roof tie-in", valueWeight: 0.18 },
    { id: "rough_in", label: "Rough-in (electrical, plumbing, HVAC)", valueWeight: 0.15 },
    { id: "insulation", label: "Insulation", valueWeight: 0.07 },
    { id: "exterior_siding", label: "Exterior siding & roofing match", valueWeight: 0.13 },
    { id: "drywall_paint", label: "Drywall & paint", valueWeight: 0.12 },
    { id: "flooring", label: "Flooring", valueWeight: 0.07 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  sunroom_porch: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "foundation_footings", label: "Foundation & footings", valueWeight: 0.15 },
    { id: "framing", label: "Framing", valueWeight: 0.15 },
    { id: "roofing_windows", label: "Roofing & window/door installation", valueWeight: 0.22 },
    { id: "electrical_rough_in", label: "Electrical rough-in", valueWeight: 0.1 },
    { id: "insulation", label: "Insulation (if four-season)", valueWeight: 0.08 },
    { id: "interior_finish", label: "Interior finish & flooring", valueWeight: 0.17 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  second_story_addition: [
    {
      id: "design_permits",
      label: "Design finalized & permits pulled (structural engineering)",
      valueWeight: 0.1,
    },
    { id: "shoring_roof_removal", label: "Temporary shoring & roof removal", valueWeight: 0.1 },
    { id: "framing_floor_system", label: "New framing & floor system", valueWeight: 0.2 },
    { id: "roofing", label: "Roofing", valueWeight: 0.12 },
    { id: "rough_in", label: "Rough-in (electrical, plumbing, HVAC)", valueWeight: 0.15 },
    { id: "insulation", label: "Insulation", valueWeight: 0.06 },
    { id: "exterior_finish", label: "Exterior finish", valueWeight: 0.1 },
    { id: "drywall_interior_flooring", label: "Drywall, interior finish & flooring", valueWeight: 0.12 },
    { id: "final_punch", label: "Final punch list & inspection sign-off", valueWeight: 0.05 },
  ],
  siding_replacement: [
    { id: "design_material", label: "Material selection & permits (if required)", valueWeight: 0.06 },
    { id: "old_siding_removal", label: "Old siding removal", valueWeight: 0.15 },
    { id: "sheathing_repair", label: "Sheathing repair & moisture barrier", valueWeight: 0.2 },
    { id: "siding_install", label: "New siding installation", valueWeight: 0.35 },
    { id: "trim_flashing", label: "Trim & flashing", valueWeight: 0.14 },
    { id: "paint_caulk", label: "Paint & caulk", valueWeight: 0.05 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.05 },
  ],
  roof_remodel: [
    { id: "design_material", label: "Material selection & permits", valueWeight: 0.05 },
    { id: "tear_off", label: "Tear-off of old roofing", valueWeight: 0.15 },
    { id: "structural_repair", label: "Structural repairs & decking", valueWeight: 0.15 },
    { id: "underlayment", label: "Underlayment", valueWeight: 0.08 },
    { id: "roofing_install", label: "New roofing installation", valueWeight: 0.35 },
    { id: "flashing_ventilation", label: "Flashing & ventilation", valueWeight: 0.15 },
    { id: "final_inspection", label: "Final inspection", valueWeight: 0.07 },
  ],
  deck_patio: [
    { id: "design_permits", label: "Design finalized & permits pulled", valueWeight: 0.08 },
    { id: "footings_foundation", label: "Footings & foundation", valueWeight: 0.2 },
    { id: "framing", label: "Framing", valueWeight: 0.2 },
    { id: "decking_surface", label: "Decking or paving surface installation", valueWeight: 0.3 },
    { id: "railing_stairs", label: "Railing & stairs", valueWeight: 0.14 },
    { id: "staining_sealing", label: "Staining or sealing", valueWeight: 0.05 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.03 },
  ],
  door_window_upgrade: [
    { id: "measurement_ordering", label: "Measurement & ordering", valueWeight: 0.1 },
    { id: "old_unit_removal", label: "Old unit removal", valueWeight: 0.15 },
    { id: "rough_opening_prep", label: "Rough opening prep", valueWeight: 0.15 },
    { id: "new_unit_install", label: "New unit installation", valueWeight: 0.35 },
    { id: "insulation_flashing", label: "Insulation & flashing", valueWeight: 0.15 },
    { id: "trim_caulk", label: "Trim & caulk", valueWeight: 0.07 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.03 },
  ],
  hvac_update: [
    { id: "assessment_permits", label: "Assessment & permits pulled", valueWeight: 0.08 },
    { id: "old_unit_removal", label: "Old equipment removal", valueWeight: 0.12 },
    { id: "new_equipment_install", label: "New equipment installation", valueWeight: 0.35 },
    { id: "ductwork", label: "Ductwork modifications", valueWeight: 0.2 },
    { id: "electrical_gas_connection", label: "Electrical & gas line connection", valueWeight: 0.15 },
    { id: "testing_balancing", label: "System testing & balancing", valueWeight: 0.07 },
    { id: "final_inspection", label: "Final inspection", valueWeight: 0.03 },
  ],
  electrical_plumbing_update: [
    { id: "assessment_permits", label: "Assessment & permits pulled", valueWeight: 0.08 },
    { id: "demo_access", label: "Demolition & access prep", valueWeight: 0.12 },
    { id: "rough_in", label: "Rough-in (new wiring or piping)", valueWeight: 0.3 },
    { id: "panel_fixture_upgrade", label: "Panel or fixture upgrades", valueWeight: 0.15 },
    { id: "rough_in_inspection", label: "Rough-in inspection", valueWeight: 0.1 },
    { id: "finish_work", label: "Finish work (outlets, fixtures)", valueWeight: 0.18 },
    { id: "final_inspection", label: "Final inspection", valueWeight: 0.07 },
  ],
  smart_home: [
    { id: "design_system_selection", label: "System design & selection", valueWeight: 0.1 },
    { id: "structured_wiring", label: "Structured wiring rough-in", valueWeight: 0.3 },
    { id: "device_panel_install", label: "Device & panel installation", valueWeight: 0.25 },
    { id: "network_hub_config", label: "Network & hub configuration", valueWeight: 0.15 },
    { id: "automation_programming", label: "Automation programming & testing", valueWeight: 0.15 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.05 },
  ],
  flooring_replacement: [
    { id: "material_selection", label: "Material selection & ordering", valueWeight: 0.1 },
    { id: "old_flooring_removal", label: "Old flooring removal", valueWeight: 0.18 },
    { id: "subfloor_prep", label: "Subfloor prep & repair", valueWeight: 0.2 },
    { id: "new_flooring_install", label: "New flooring installation", valueWeight: 0.4 },
    { id: "trim_transitions", label: "Trim & transitions", valueWeight: 0.08 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.04 },
  ],
  interior_painting: [
    { id: "prep_color_selection", label: "Prep & color selection", valueWeight: 0.1 },
    { id: "surface_prep", label: "Surface prep (patching & sanding)", valueWeight: 0.25 },
    { id: "priming", label: "Priming", valueWeight: 0.15 },
    { id: "painting", label: "Painting (walls, trim, doors)", valueWeight: 0.4 },
    { id: "final_touch_up", label: "Final touch-up & walkthrough", valueWeight: 0.1 },
  ],
  molding_trim: [
    { id: "design_material_selection", label: "Design & material selection", valueWeight: 0.1 },
    { id: "measurement_cutting", label: "Measurement & cutting", valueWeight: 0.2 },
    { id: "installation", label: "Installation", valueWeight: 0.4 },
    { id: "caulking_filling", label: "Caulking & filling", valueWeight: 0.15 },
    { id: "painting_finishing", label: "Painting & finishing", valueWeight: 0.1 },
    { id: "final_walkthrough", label: "Final walkthrough", valueWeight: 0.05 },
  ],
};

const KITCHEN_BATH_GROUP = "Kitchen & Bathroom Renovations";
const LIVING_SPACE_GROUP = "Living Space Overhauls";
const STRUCTURAL_GROUP = "Structural & Footprint Additions";
const EXTERIOR_GROUP = "Exterior & Curb Appeal Upgrades";
const SYSTEMS_GROUP = "Systemic & Performance Upgrades";
const COSMETIC_GROUP = "Whole-House Cosmetic Refreshes";

export const PROJECT_TYPE_META: Record<ProjectType, ProjectTypeMeta> = {
  kitchen: {
    label: "Kitchen renovation",
    reportLabel: "Kitchen renovation",
    group: KITCHEN_BATH_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  bathroom: {
    label: "Bathroom renovation",
    reportLabel: "Bathroom renovation",
    group: KITCHEN_BATH_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  open_concept: {
    label: "Open-concept conversion",
    reportLabel: "Open-concept conversion",
    group: LIVING_SPACE_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  basement_finishing: {
    label: "Basement finishing",
    reportLabel: "Basement finishing",
    group: LIVING_SPACE_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  attic_conversion: {
    label: "Attic & loft conversion",
    reportLabel: "Attic & loft conversion",
    group: LIVING_SPACE_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  garage_conversion: {
    label: "Garage conversion",
    reportLabel: "Garage conversion",
    group: LIVING_SPACE_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  room_addition: {
    label: "Room addition",
    reportLabel: "Room addition",
    group: STRUCTURAL_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  sunroom_porch: {
    label: "Sunroom or porch addition",
    reportLabel: "Sunroom or porch addition",
    group: STRUCTURAL_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  second_story_addition: {
    label: "Second-story addition",
    reportLabel: "Second-story addition",
    group: STRUCTURAL_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  siding_replacement: {
    label: "Siding replacement",
    reportLabel: "Siding replacement",
    group: EXTERIOR_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
  roof_remodel: {
    label: "Roof remodel",
    reportLabel: "Roof remodel",
    group: EXTERIOR_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: false,
  },
  deck_patio: {
    label: "Deck or patio",
    reportLabel: "Deck or patio addition",
    group: EXTERIOR_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: false,
  },
  door_window_upgrade: {
    label: "Door & window upgrades",
    reportLabel: "Door & window upgrade",
    group: EXTERIOR_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
  hvac_update: {
    label: "HVAC update",
    reportLabel: "HVAC update",
    group: SYSTEMS_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  electrical_plumbing_update: {
    label: "Electrical & plumbing update",
    reportLabel: "Electrical & plumbing update",
    group: SYSTEMS_GROUP,
    requiresPermitTypically: true,
    hasRoughIn: true,
  },
  smart_home: {
    label: "Smart home integration",
    reportLabel: "Smart home integration",
    group: SYSTEMS_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
  flooring_replacement: {
    label: "Flooring replacement",
    reportLabel: "Flooring replacement",
    group: COSMETIC_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
  interior_painting: {
    label: "Interior painting",
    reportLabel: "Interior painting",
    group: COSMETIC_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
  molding_trim: {
    label: "Molding & trim work",
    reportLabel: "Molding & trim work",
    group: COSMETIC_GROUP,
    requiresPermitTypically: false,
    hasRoughIn: false,
  },
};

export const ALL_PROJECT_TYPES = Object.keys(PROJECT_TYPE_META) as ProjectType[];

export const PROJECT_TYPE_GROUP_ORDER = [
  KITCHEN_BATH_GROUP,
  LIVING_SPACE_GROUP,
  STRUCTURAL_GROUP,
  EXTERIOR_GROUP,
  SYSTEMS_GROUP,
  COSMETIC_GROUP,
];

export const PROJECT_TYPE_GROUPS: { name: string; types: ProjectType[] }[] = PROJECT_TYPE_GROUP_ORDER.map(
  (name) => ({
    name,
    types: ALL_PROJECT_TYPES.filter((t) => PROJECT_TYPE_META[t].group === name),
  })
);

export const STANDARD_MISSING_DOC_CHECKLIST = [
  "Signed contract",
  "Building permit",
  "Change orders (for any work added or altered after the contract was signed)",
  "Lien waivers (for each payment made)",
  "Payment receipts / invoices",
  "Inspection sign-offs",
] as const;

export function missingDocChecklistFor(projectType: ProjectType): string[] {
  const meta = PROJECT_TYPE_META[projectType];
  return STANDARD_MISSING_DOC_CHECKLIST.filter(
    (item) => meta.requiresPermitTypically || item !== "Building permit"
  );
}

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
