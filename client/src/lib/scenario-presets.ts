// Practice-change scenario modeling.
//
// These sliders and presets model the *implication* of a practice change on a
// region's published baseline gross margin. They are NOT verified regional
// data points — they are indicative deltas drawn from published trial and
// industry literature, applied as percentage adjustments on top of the
// region's own baseline. Always compared against the baseline, never against
// whatever the user has typed into the manual calculator inputs above.

export type ScenarioKey =
  | "yieldPct"
  | "pricePct"
  | "fertiliserPct"
  | "cropProtectionPct"
  | "irrigationPct"
  | "machineryPct"
  | "labourPct"
  | "nitrogenPct"
  | "phosphorusPct"
  | "potassiumPct"
  | "otherFertPct"
  | "herbicidePct"
  | "fungicidePct"
  | "insecticidePct"
  | "otherChemPct";

export type ScenarioState = Record<ScenarioKey, number>;

export const ZERO_SCENARIO: ScenarioState = {
  yieldPct: 0,
  pricePct: 0,
  fertiliserPct: 0,
  cropProtectionPct: 0,
  irrigationPct: 0,
  machineryPct: 0,
  labourPct: 0,
  nitrogenPct: 0,
  phosphorusPct: 0,
  potassiumPct: 0,
  otherFertPct: 0,
  herbicidePct: 0,
  fungicidePct: 0,
  insecticidePct: 0,
  otherChemPct: 0,
};

// Core sliders — always shown. "Fertiliser cost" and "Crop protection cost"
// apply to the unspecified/not-yet-broken-down portion of that region's cost
// (i.e. all of it, until a region has real N/P/K or chemical-category data
// entered in Admin — see the breakdown sliders below).
export const SCENARIO_SLIDERS: { key: ScenarioKey; label: string }[] = [
  { key: "yieldPct", label: "Yield" },
  { key: "pricePct", label: "Price" },
  { key: "fertiliserPct", label: "Fertiliser cost — unspecified" },
  { key: "cropProtectionPct", label: "Crop protection cost — unspecified" },
  { key: "irrigationPct", label: "Irrigation energy cost" },
  { key: "machineryPct", label: "Machinery & fuel cost" },
  { key: "labourPct", label: "Field labour cost" },
];

// Granular fertiliser sliders — only move a region's N/P/K/Other cost once
// that region has a real breakdown entered in Admin. Lets a practice change
// model a shift in fertiliser *type/mix* (e.g. cut N, hold P/K) rather than
// just an overall cost change, and feeds the per-nutrient lifecycle-emissions
// figures below.
export const FERTILISER_BREAKDOWN_SLIDERS: { key: ScenarioKey; label: string }[] = [
  { key: "nitrogenPct", label: "Nitrogen (N)" },
  { key: "phosphorusPct", label: "Phosphorus (P)" },
  { key: "potassiumPct", label: "Potassium (K)" },
  { key: "otherFertPct", label: "Other (S, lime, trace)" },
];

// Granular chemical sliders — same idea for crop protection categories.
export const CHEMICAL_BREAKDOWN_SLIDERS: { key: ScenarioKey; label: string }[] = [
  { key: "herbicidePct", label: "Herbicide" },
  { key: "fungicidePct", label: "Fungicide" },
  { key: "insecticidePct", label: "Insecticide" },
  { key: "otherChemPct", label: "Other (nematicide, desiccant, etc.)" },
];

export interface ScenarioPreset {
  id: string;
  label: string;
  description: string;
  sourceLabel: string;
  sourceUrl: string;
  deltas: Partial<ScenarioState>;
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: "vri",
    label: "Variable-rate irrigation",
    description:
      "Irrigation energy cost -20%, based on published variable-rate irrigation potato trials averaging ~20% water/energy savings versus uniform irrigation (range ~9-26%).",
    sourceLabel: "Farm & Food Care Ontario — VRI potato trial",
    sourceUrl: "https://www.farmfoodcareon.org/wp-content/uploads/2016/04/WRAMI-Final-Report-6.pdf",
    deltas: { irrigationPct: -20 },
  },
  {
    id: "precision-fertiliser",
    label: "Precision fertiliser (VRA)",
    description:
      "Fertiliser cost -20% with no yield penalty, based on variable-rate nitrogen application trials in Idaho and Manitoba showing 10-30% input savings.",
    sourceLabel: "Potato News Today — VRA fertiliser trials",
    sourceUrl:
      "https://www.potatonewstoday.com/2025/05/11/next-gen-fertilization-techniques-advancing-potato-nutrition-through-precision-organics-and-reduced-synthetic-inputs/",
    // Applied uniformly across the unspecified total and every N/P/K/Other
    // sub-field so the preset still works once a region has real breakdown
    // data entered (VRA typically cuts N most, but -20% flat is the modeled
    // assumption from the cited trials, applied evenly across nutrients).
    deltas: {
      fertiliserPct: -20,
      nitrogenPct: -20,
      phosphorusPct: -20,
      potassiumPct: -20,
      otherFertPct: -20,
    },
  },
  {
    id: "reduced-tillage",
    label: "Reduced / zero tillage",
    description:
      "Machinery & fuel cost -23%, field labour +13%, crop protection +15% (herbicide use typically rises when tillage is removed). Net effect is still cost-saving overall. Based on a zero-tillage potato production cost study.",
    sourceLabel: "Taylor & Francis — zero tillage potato cost study",
    sourceUrl: "https://www.tandfonline.com/doi/full/10.1080/14735903.2023.2270191",
    deltas: {
      machineryPct: -23,
      labourPct: 13,
      cropProtectionPct: 15,
      herbicidePct: 15,
      fungicidePct: 15,
      insecticidePct: 15,
      otherChemPct: 15,
    },
  },
  {
    id: "ipm",
    label: "Integrated Pest Management",
    description:
      "Crop protection cost -45%, from cutting 3-4 sprays per crop. Based on an Australian vegetable-industry IPM benefit-cost trial reporting $200-300/ha savings and a 5-6.5% gross margin lift.",
    sourceLabel: "AUSVEG — IPM vs conventional pest control (PT538)",
    sourceUrl: "https://ausveg.com.au/app/data/technical-insights/docs/PT538.pdf",
    deltas: {
      cropProtectionPct: -45,
      herbicidePct: -45,
      fungicidePct: -45,
      insecticidePct: -45,
      otherChemPct: -45,
    },
  },
  {
    id: "improved-variety",
    label: "Improved variety",
    description:
      "Yield +11%, based on a multi-year University of Florida variety trial comparing a newer cultivar's marketable yield against the industry-standard variety.",
    sourceLabel: "UF/IFAS Potato Variety Trial Program",
    sourceUrl: "https://ask.ifas.ufl.edu/publication/HS1253",
    deltas: { yieldPct: 11 },
  },
];
