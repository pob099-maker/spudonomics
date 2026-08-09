import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import type * as z from "zod/mini";

// ---------------------------------------------------------------------------
// Regions — the 14 Australian potato-growing regions tracked by Spudonomics.
// ---------------------------------------------------------------------------
export const regions = sqliteTable("regions", {
  id: text("id").primaryKey(), // slug, e.g. "tas-north"
  name: text("name").notNull(),
  state: text("state").notNull(), // e.g. "Tasmania"
  sortOrder: integer("sort_order").notNull(),
  // regional | state_proxy | national_proxy | none
  dataQuality: text("data_quality").notNull(),
  productionShare: text("production_share"), // e.g. "70% of NSW production"
  summary: text("summary"), // short context blurb shown in the UI
});

export const insertRegionSchema = createInsertSchema(regions);
export type InsertRegion = z.infer<typeof insertRegionSchema>;
export type Region = typeof regions.$inferSelect;

// ---------------------------------------------------------------------------
// Cost profiles — one row per region x market segment. Every numeric field
// is nullable because coverage genuinely differs by region (see the source
// report). sourceName/sourceUrl/sourceYear are mandatory whenever any numeric
// field is populated, so every number shown in the calculator is auditable.
// ---------------------------------------------------------------------------
export const costProfiles = sqliteTable("cost_profiles", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  regionId: text("region_id").notNull(),
  segment: text("segment").notNull(), // fresh | processing | seed | ware | unspecified
  segmentLabel: text("segment_label").notNull(), // display label, e.g. "Fresh / Table"

  // Market & pricing
  yieldTHa: real("yield_t_ha"),
  priceT: real("price_t"),
  // Authoritative source-reported gross income ($/ha). Kept separate from
  // yieldTHa x priceT because several regions use multi-grade pricing (e.g.
  // premium + second-grade tonnage), bag pricing, or a single published
  // gross-margin figure with no income/cost breakdown at all — in all of
  // those cases yield x price would silently misstate revenue.
  grossIncomeHa: real("gross_income_ha"),

  // Agronomic inputs ($/ha)
  seedCostHa: real("seed_cost_ha"),
  fertiliserCostHa: real("fertiliser_cost_ha"),
  cropProtectionCostHa: real("crop_protection_cost_ha"),
  irrigationCostHa: real("irrigation_cost_ha"),
  waterUseMlHa: real("water_use_ml_ha"),

  // Machinery, contract & energy ($/ha)
  machineryCostHa: real("machinery_cost_ha"),
  contractCostHa: real("contract_cost_ha"),

  // Labour
  labourCostHa: real("labour_cost_ha"),
  labourRateHr: real("labour_rate_hr"),

  // Post-harvest / freight / packaging ($/ha)
  postHarvestCostHa: real("post_harvest_cost_ha"),

  // Overheads
  overheadPct: real("overhead_pct"), // % of gross income (levies, agent commission, etc.)

  // Totals (used as authoritative when present; otherwise derived client-side)
  totalVariableCostHa: real("total_variable_cost_ha"),
  grossMarginHa: real("gross_margin_ha"),

  // Provenance — mandatory whenever numeric fields above are populated
  dataQuality: text("data_quality").notNull(), // regional | state_proxy | national_proxy | none
  sourceName: text("source_name"),
  sourceUrl: text("source_url"),
  sourceYear: text("source_year"),
  notes: text("notes"),
});

export const insertCostProfileSchema = createInsertSchema(costProfiles).omit({ id: true });
export type InsertCostProfile = z.infer<typeof insertCostProfileSchema>;
export type CostProfile = typeof costProfiles.$inferSelect;

// Data quality display metadata shared between client and server
export const DATA_QUALITY_LABELS: Record<string, string> = {
  regional: "Regional data",
  state_proxy: "State proxy",
  national_proxy: "National proxy",
  estimate: "Owner estimate — placeholder",
  none: "No data — survey needed",
};
