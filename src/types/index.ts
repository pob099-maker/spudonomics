// Domain types for Spudonomics: regional potato gross margin baselines.
//
// The central fact this whole app is organised around: published budgets are
// incomplete in different ways. Some itemise every line, some publish only a
// total, some publish nothing at all. Every type here keeps "unknown" and
// "zero" as different things, because conflating them is what makes a
// calculator quietly lie.

export type Result<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * How closely a figure describes the region it is filed under.
 * - "regional"    the source published this for this district
 * - "state_proxy" a state-wide figure standing in for the district
 * - "none"        no usable economics published at any level
 */
export type DataQuality = "regional" | "state_proxy" | "none";

export interface Region {
  id: string;
  name: string;
  state: string;
  sortOrder: number;
  dataQuality: DataQuality;
  /** How much of the crop this district represents, in the source's words. */
  productionShare: string;
  summary: string;
}

/**
 * One published budget: a region, a market segment, and whatever the source
 * actually reported. Every money field is nullable, and null means "the source
 * did not publish this" — never zero.
 */
export interface CostProfile {
  regionId: string;
  segment: string;
  segmentLabel: string;

  yieldTHa: number | null;
  priceT: number | null;
  grossIncomeHa: number | null;

  seedCostHa: number | null;
  fertiliserCostHa: number | null;
  fertNCostHa: number | null;
  fertNQtyKgHa: number | null;
  fertPCostHa: number | null;
  fertPQtyKgHa: number | null;
  fertKCostHa: number | null;
  fertKQtyKgHa: number | null;
  fertOtherCostHa: number | null;
  fertOtherQtyKgHa: number | null;
  cropProtectionCostHa: number | null;
  chemHerbicideCostHa: number | null;
  chemHerbicideQtyLHa: number | null;
  chemFungicideCostHa: number | null;
  chemFungicideQtyLHa: number | null;
  chemInsecticideCostHa: number | null;
  chemInsecticideQtyLHa: number | null;
  chemOtherCostHa: number | null;
  chemOtherQtyLHa: number | null;
  irrigationCostHa: number | null;
  waterUseMlHa: number | null;
  machineryCostHa: number | null;
  contractCostHa: number | null;
  labourCostHa: number | null;
  labourRateHr: number | null;
  /**
   * Unpaid family/owner-operator labour: hours per hectare per season,
   * informational only. No source publishes this — it exists so a grower or
   * agronomist survey response can show its working, not to feed a total.
   */
  unpaidFamilyLabourHrHa: number | null;
  /**
   * The imputed $/ha value of that unpaid labour, e.g. hours x an award or
   * casual rate. Deliberately kept out of `totalVariableCostHa` and every
   * `COST_LINES` sum: it is a real economic cost, but not a cash one, and no
   * published budget this app cites ever counts it. See grossMargin.ts for
   * how it surfaces as a separate "economic margin" instead.
   */
  unpaidFamilyLabourValueHa: number | null;
  postHarvestCostHa: number | null;
  overheadPct: number | null;

  /**
   * The source's own total variable cost and gross margin. These are the
   * authoritative figures: where a budget publishes a total but itemises only
   * part of it, the total is right and the items are a subset. Re-deriving the
   * total by summing items is the bug that made the prototype overstate every
   * partly-itemised region.
   */
  totalVariableCostHa: number | null;
  grossMarginHa: number | null;

  dataQuality: DataQuality;
  sourceName: string | null;
  sourceUrl: string | null;
  sourceYear: string | null;
  notes: string | null;
}
