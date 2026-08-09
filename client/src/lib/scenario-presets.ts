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
  | "labourPct";

export type ScenarioState = Record<ScenarioKey, number>;

export const ZERO_SCENARIO: ScenarioState = {
  yieldPct: 0,
  pricePct: 0,
  fertiliserPct: 0,
  cropProtectionPct: 0,
  irrigationPct: 0,
  machineryPct: 0,
  labourPct: 0,
};

export const SCENARIO_SLIDERS: { key: ScenarioKey; label: string }[] = [
  { key: "yieldPct", label: "Yield" },
  { key: "pricePct", label: "Price" },
  { key: "fertiliserPct", label: "Fertiliser cost" },
  { key: "cropProtectionPct", label: "Crop protection cost" },
  { key: "irrigationPct", label: "Irrigation energy cost" },
  { key: "machineryPct", label: "Machinery & fuel cost" },
  { key: "labourPct", label: "Field labour cost" },
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
    deltas: { fertiliserPct: -20 },
  },
  {
    id: "reduced-tillage",
    label: "Reduced / zero tillage",
    description:
      "Machinery & fuel cost -23%, field labour +13%, crop protection +15% (herbicide use typically rises when tillage is removed). Net effect is still cost-saving overall. Based on a zero-tillage potato production cost study.",
    sourceLabel: "Taylor & Francis — zero tillage potato cost study",
    sourceUrl: "https://www.tandfonline.com/doi/full/10.1080/14735903.2023.2270191",
    deltas: { machineryPct: -23, labourPct: 13, cropProtectionPct: 15 },
  },
  {
    id: "ipm",
    label: "Integrated Pest Management",
    description:
      "Crop protection cost -45%, from cutting 3-4 sprays per crop. Based on an Australian vegetable-industry IPM benefit-cost trial reporting $200-300/ha savings and a 5-6.5% gross margin lift.",
    sourceLabel: "AUSVEG — IPM vs conventional pest control (PT538)",
    sourceUrl: "https://ausveg.com.au/app/data/technical-insights/docs/PT538.pdf",
    deltas: { cropProtectionPct: -45 },
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
