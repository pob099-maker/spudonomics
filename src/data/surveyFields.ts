// Field definitions for the in-app "Contribute" survey.
//
// This survey used to live entirely in an external Google Form. That form's
// question types could only be edited by hand in the Forms UI (no
// programmatic access to convert a free-text question into multiple choice),
// which is exactly how it ended up asking growers to type a region name from
// memory instead of picking one — a real barrier to getting responses. This
// file is the single source of truth for the native replacement: every list
// below must match the CHECK constraint on the matching column in
// `public.spudonomics_survey_responses` exactly, or a real submission will be
// rejected by the database with no useful error shown to the person filling
// it in. See the `spudonomics_survey_responses_to_public_schema` migration in the fieldnotes Supabase project.

export interface BandField {
  /** Column name in public.spudonomics_survey_responses. */
  column: string;
  /** Question label shown in the form. */
  label: string;
  /** Optional helper text shown under the label. */
  help?: string;
  /** Allowed values, in display order. Must match the DB CHECK constraint. */
  options: readonly string[];
}

export const ROLE_OPTIONS = [
  "Grower",
  "Agronomist or adviser",
  "Regional coordinator or rep",
  "Processor field staff",
  "Other",
] as const;

export const BASIS_OPTIONS = [
  "Direct observation (my own farm)",
  "Estimate from one grower I work with closely",
  "Estimate averaged across several growers I work with",
  "Industry/general knowledge estimate",
] as const;

/**
 * The banded cost/yield questions, in the order they appear on the form.
 * Banded ranges rather than exact figures, unchanged from the original
 * survey design — see memory: nobody submitting anonymously needs to give an
 * exact number for reps to spot a gap or firm up a figure.
 */
export const BAND_FIELDS: readonly BandField[] = [
  {
    column: "yield_band",
    label: "Yield (t/ha)",
    options: ["Under 20", "20-30", "30-40", "40-50", "50-60", "Over 60"],
  },
  {
    column: "price_band",
    label: "Price received ($/t)",
    options: ["Under $300", "$300-450", "$450-600", "$600-750", "Over $750"],
  },
  {
    column: "seed_cost_band",
    label: "Seed cost ($/ha)",
    options: ["Under $1,500", "$1,500-2,000", "$2,000-2,500", "$2,500-3,000", "Over $3,000"],
  },
  {
    column: "fertiliser_cost_band",
    label: "Fertiliser cost ($/ha)",
    options: [
      "Under $1,000",
      "$1,000-1,500",
      "$1,500-2,000",
      "$2,000-2,500",
      "$2,500-3,000",
      "Over $3,000",
    ],
  },
  {
    column: "crop_protection_band",
    label: "Crop protection — chemicals ($/ha)",
    options: ["Under $300", "$300-600", "$600-900", "$900-1,200", "Over $1,200"],
  },
  {
    column: "irrigation_band",
    label: "Irrigation energy/water ($/ha)",
    options: [
      "Not applicable (dryland)",
      "Under $150",
      "$150-300",
      "$300-450",
      "$450-600",
      "Over $600",
    ],
  },
  {
    column: "machinery_fuel_band",
    label: "Machinery & fuel — owned equipment ($/ha)",
    options: ["Under $500", "$500-1,000", "$1,000-1,500", "$1,500-2,000", "Over $2,000"],
  },
  {
    column: "contract_ops_band",
    label: "Contract operations — planting/harvest/spraying ($/ha)",
    options: [
      "Not applicable (owned equipment only)",
      "Under $1,000",
      "$1,000-2,000",
      "$2,000-3,000",
      "$3,000-4,000",
      "Over $4,000",
    ],
  },
  {
    column: "paid_labour_band",
    label: "Labour — paid, excluding owner-operator time ($/ha)",
    options: ["Under $500", "$500-1,000", "$1,000-1,500", "$1,500-2,000", "Over $2,000"],
  },
  {
    column: "unpaid_labour_hours_band",
    label: "Unpaid family / owner-operator labour — hours (per ha, per season)",
    help: "Combined hours worked by the owner-operator and any unpaid family members on this crop, not already counted in the paid labour figure above.",
    options: ["Not applicable", "Under 10", "10-25", "25-50", "50-100", "Over 100"],
  },
  {
    column: "unpaid_labour_value_band",
    label: "Unpaid family / owner-operator labour — imputed value ($/ha)",
    help: "What that time would have cost if paid at a casual/award horticulture rate (roughly $30-35/hr in 2025-26). Kept separate from the cash labour cost above.",
    options: [
      "Not applicable",
      "Under $500",
      "$500-1,000",
      "$1,000-2,000",
      "$2,000-3,000",
      "$3,000-5,000",
      "Over $5,000",
    ],
  },
];
