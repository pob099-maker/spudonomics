// The gross margin engine.
//
// The rule this module exists to enforce: a cost the source never published is
// unknown, not zero. The prototype summed its itemised cost lines, treated every
// missing line as $0, and threw away the source's own published total. On the
// eight budgets that itemise only part of the crop that overstated the margin —
// by 63% in Tasmanian seed, and by 848% in South Australia, where a $1,438/ha
// margin was reported as $13,625/ha with a breakeven of zero.
//
// So: prefer the published total, always. Only compute a total from the parts
// when someone has taken the numbers over and made them theirs.

import type { CostProfile } from "../types";

/** What a reported cost is standing on. */
export type CostBasis =
  | "published" // the source's own total variable cost
  | "itemised" // summed from the lines the source did itemise
  | "edited" // the user has taken the numbers over
  | "absent"; // the source published no cost at all

export interface CostLine {
  key: keyof CostProfile;
  label: string;
  group: "Seed & irrigation" | "Fertiliser" | "Crop protection" | "Operations" | "Post-harvest";
  valueHa: number | null;
}

/** Every cost line the calculator knows about, in the order it presents them. */
export const COST_LINES: ReadonlyArray<Omit<CostLine, "valueHa">> = [
  { key: "seedCostHa", label: "Seed", group: "Seed & irrigation" },
  { key: "irrigationCostHa", label: "Irrigation energy", group: "Seed & irrigation" },
  { key: "fertiliserCostHa", label: "Fertiliser (not broken down)", group: "Fertiliser" },
  { key: "fertNCostHa", label: "Nitrogen (N)", group: "Fertiliser" },
  { key: "fertPCostHa", label: "Phosphorus (P)", group: "Fertiliser" },
  { key: "fertKCostHa", label: "Potassium (K)", group: "Fertiliser" },
  { key: "fertOtherCostHa", label: "Other (S, lime, trace)", group: "Fertiliser" },
  {
    key: "cropProtectionCostHa",
    label: "Crop protection (not broken down)",
    group: "Crop protection",
  },
  { key: "chemHerbicideCostHa", label: "Herbicide", group: "Crop protection" },
  { key: "chemFungicideCostHa", label: "Fungicide", group: "Crop protection" },
  { key: "chemInsecticideCostHa", label: "Insecticide", group: "Crop protection" },
  { key: "chemOtherCostHa", label: "Other (nematicide, desiccant)", group: "Crop protection" },
  { key: "machineryCostHa", label: "Machinery & fuel", group: "Operations" },
  { key: "contractCostHa", label: "Contract operations", group: "Operations" },
  { key: "labourCostHa", label: "Field labour", group: "Operations" },
  { key: "postHarvestCostHa", label: "Post-harvest, freight & packaging", group: "Post-harvest" },
] as const;

/**
 * Cost lines the user has taken over. A key being present is what matters: an
 * explicitly cleared box means a cost they do not carry, which is zero — not a
 * silent fall back to the published figure.
 */
export type CostEdits = Partial<Record<string, number | null>>;

export interface MarginInputs {
  yieldTHa: number | null;
  priceT: number | null;
  grossIncomeHa: number | null;
  overheadPct: number | null;
}

export interface MarginResult {
  revenueHa: number | null;
  costHa: number | null;
  marginHa: number | null;
  marginPerTonne: number | null;
  breakevenYieldTHa: number | null;
  breakevenPriceT: number | null;
  basis: CostBasis;
  /** Sum of the cost lines the source did itemise. */
  itemisedHa: number;
  /** Published total minus itemised lines: the part the source never broke down. */
  unitemisedHa: number | null;
  /** Cost lines this budget never published, by label. */
  missingLines: string[];
  /**
   * True when the numbers rest on an incomplete cost side and must not be
   * quoted as this region's margin. Drives every warning in the UI.
   */
  incomplete: boolean;
}

function numberOr(value: unknown, fallback: number | null): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

/** The cost lines a profile actually published, with their values. */
export function costLines(profile: CostProfile): CostLine[] {
  return COST_LINES.map((line) => ({
    ...line,
    valueHa: numberOr(profile[line.key], null),
  }));
}

/** Revenue as the source reports it: the published figure beats yield x price. */
export function revenueFor(inputs: MarginInputs): number | null {
  // Several budgets price by grade or by the bag, so gross income is published
  // directly and cannot be recovered from a single price. Where that is the
  // case the published figure is the only honest one.
  if (inputs.grossIncomeHa !== null) return inputs.grossIncomeHa;
  if (inputs.yieldTHa !== null && inputs.priceT !== null) {
    return inputs.yieldTHa * inputs.priceT;
  }
  return null;
}

/**
 * The baseline as published: no re-derivation, no zero-filling. This is what a
 * region shows before anybody touches an input.
 */
export function baselineMargin(profile: CostProfile): MarginResult {
  const lines = costLines(profile);
  const known = lines.filter((line) => line.valueHa !== null);
  const itemisedHa = known.reduce((sum, line) => sum + (line.valueHa ?? 0), 0);
  const missingLines = lines
    .filter((line) => line.valueHa === null)
    .map((line) => line.label);

  const revenueHa = revenueFor({
    yieldTHa: profile.yieldTHa,
    priceT: profile.priceT,
    grossIncomeHa: profile.grossIncomeHa,
    overheadPct: profile.overheadPct,
  });

  const published = profile.totalVariableCostHa;

  if (published !== null) {
    // The authoritative case. The published margin wins over anything we could
    // compute, because the source may include costs it never itemised.
    const marginHa =
      profile.grossMarginHa ?? (revenueHa !== null ? revenueHa - published : null);
    return finish({
      revenueHa,
      costHa: published,
      marginHa,
      basis: "published",
      itemisedHa,
      unitemisedHa: published - itemisedHa,
      missingLines,
      yieldTHa: profile.yieldTHa,
      // A published total is a complete cost side even when the breakdown is
      // partial, so the results stand on their own.
      incomplete: false,
    });
  }

  if (known.length > 0) {
    // Items but no published total: usable, but we cannot know what is absent,
    // so it is flagged rather than presented as the region's margin.
    const overheads = ((profile.overheadPct ?? 0) / 100) * (revenueHa ?? 0);
    const costHa = itemisedHa + overheads;
    return finish({
      revenueHa,
      costHa,
      marginHa: revenueHa !== null ? revenueHa - costHa : null,
      basis: "itemised",
      itemisedHa,
      unitemisedHa: null,
      missingLines,
      yieldTHa: profile.yieldTHa,
      incomplete: true,
    });
  }

  // Nothing published. The prototype rendered this as $0 cost and a margin
  // equal to revenue; there is no number here to show.
  return finish({
    revenueHa,
    costHa: null,
    marginHa: profile.grossMarginHa,
    basis: "absent",
    itemisedHa: 0,
    unitemisedHa: null,
    missingLines,
    yieldTHa: profile.yieldTHa,
    incomplete: true,
  });
}

/**
 * The margin once someone has edited the inputs. Now the parts *are* the whole:
 * they entered them, so summing them is right — and anything they left blank is
 * a cost they are saying they do not carry.
 */
export function editedMargin(
  profile: CostProfile,
  inputs: MarginInputs,
  edits: CostEdits,
): MarginResult {
  const lines = costLines(profile).map((line) => {
    const key = line.key as string;
    if (!(key in edits)) return line;
    return { ...line, valueHa: numberOr(edits[key], 0) };
  });
  const itemisedHa = lines.reduce((sum, line) => sum + (line.valueHa ?? 0), 0);
  const revenueHa = revenueFor(inputs);
  const overheads = ((inputs.overheadPct ?? 0) / 100) * (revenueHa ?? 0);
  const costHa = itemisedHa + overheads;

  return finish({
    revenueHa,
    costHa,
    marginHa: revenueHa !== null ? revenueHa - costHa : null,
    basis: "edited",
    itemisedHa,
    unitemisedHa: null,
    missingLines: lines.filter((line) => line.valueHa === null).map((line) => line.label),
    yieldTHa: inputs.yieldTHa,
    incomplete: false,
  });
}

function finish(parts: {
  revenueHa: number | null;
  costHa: number | null;
  marginHa: number | null;
  basis: CostBasis;
  itemisedHa: number;
  unitemisedHa: number | null;
  missingLines: string[];
  yieldTHa: number | null;
  incomplete: boolean;
}): MarginResult {
  const { revenueHa, costHa, marginHa, yieldTHa } = parts;

  // Breakeven divides by price and by yield, so it is only meaningful with a
  // real cost behind it. Showing "0 t/ha" because the cost side was empty is
  // exactly the failure this module was written to prevent.
  const usableCost = costHa !== null && costHa > 0;
  const priceT =
    revenueHa !== null && yieldTHa !== null && yieldTHa > 0 ? revenueHa / yieldTHa : null;

  return {
    revenueHa,
    costHa,
    marginHa,
    marginPerTonne:
      marginHa !== null && yieldTHa !== null && yieldTHa > 0 ? marginHa / yieldTHa : null,
    breakevenYieldTHa: usableCost && priceT !== null && priceT > 0 ? costHa / priceT : null,
    breakevenPriceT: usableCost && yieldTHa !== null && yieldTHa > 0 ? costHa / yieldTHa : null,
    basis: parts.basis,
    itemisedHa: parts.itemisedHa,
    unitemisedHa: parts.unitemisedHa,
    missingLines: parts.missingLines,
    incomplete: parts.incomplete,
  };
}
