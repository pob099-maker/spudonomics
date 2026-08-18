import { z } from "zod";

// The dataset ships as JSON in the repo rather than a database, so these
// schemas are what stands between a mistyped figure and a wrong number on
// screen. They run in the test suite against the real files, which means a bad
// edit fails CI instead of reaching a grower.

const dataQuality = z.enum(["regional", "state_proxy", "none"]);

/** A published money or quantity figure, or null when the source omitted it. */
const optionalNumber = z.number().finite().nullable();

export const regionSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  state: z.string().min(1),
  sortOrder: z.number().int(),
  dataQuality,
  productionShare: z.string(),
  summary: z.string(),
});

export const costProfileSchema = z.object({
  regionId: z.string().min(1),
  segment: z.string().min(1),
  segmentLabel: z.string().min(1),

  yieldTHa: optionalNumber,
  priceT: optionalNumber,
  grossIncomeHa: optionalNumber,

  seedCostHa: optionalNumber,
  fertiliserCostHa: optionalNumber,
  fertNCostHa: optionalNumber,
  fertNQtyKgHa: optionalNumber,
  fertPCostHa: optionalNumber,
  fertPQtyKgHa: optionalNumber,
  fertKCostHa: optionalNumber,
  fertKQtyKgHa: optionalNumber,
  fertOtherCostHa: optionalNumber,
  fertOtherQtyKgHa: optionalNumber,
  cropProtectionCostHa: optionalNumber,
  chemHerbicideCostHa: optionalNumber,
  chemHerbicideQtyLHa: optionalNumber,
  chemFungicideCostHa: optionalNumber,
  chemFungicideQtyLHa: optionalNumber,
  chemInsecticideCostHa: optionalNumber,
  chemInsecticideQtyLHa: optionalNumber,
  chemOtherCostHa: optionalNumber,
  chemOtherQtyLHa: optionalNumber,
  irrigationCostHa: optionalNumber,
  waterUseMlHa: optionalNumber,
  machineryCostHa: optionalNumber,
  contractCostHa: optionalNumber,
  labourCostHa: optionalNumber,
  labourRateHr: optionalNumber,
  postHarvestCostHa: optionalNumber,
  overheadPct: optionalNumber,

  totalVariableCostHa: optionalNumber,
  grossMarginHa: optionalNumber,

  dataQuality,
  sourceName: z.string().nullable(),
  sourceUrl: z.string().url().nullable(),
  sourceYear: z.string().nullable(),
  notes: z.string().nullable(),
});

export const regionsSchema = z.array(regionSchema).min(1);
export const costProfilesSchema = z.array(costProfileSchema).min(1);
