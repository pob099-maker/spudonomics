import type { Region, InsertRegion, CostProfile, InsertCostProfile } from "@shared/schema";
import { supabase } from "./supabase";

// Maps DB snake_case rows <-> app camelCase types.
function rowToRegion(row: any): Region {
  return {
    id: row.id,
    name: row.name,
    state: row.state,
    sortOrder: row.sort_order,
    dataQuality: row.data_quality,
    productionShare: row.production_share ?? null,
    summary: row.summary ?? null,
  };
}

function regionPatchToRow(patch: Partial<InsertRegion>): Record<string, any> {
  const row: Record<string, any> = {};
  if (patch.id !== undefined) row.id = patch.id;
  if (patch.name !== undefined) row.name = patch.name;
  if (patch.state !== undefined) row.state = patch.state;
  if (patch.sortOrder !== undefined) row.sort_order = patch.sortOrder;
  if (patch.dataQuality !== undefined) row.data_quality = patch.dataQuality;
  if (patch.productionShare !== undefined) row.production_share = patch.productionShare;
  if (patch.summary !== undefined) row.summary = patch.summary;
  return row;
}

function rowToCostProfile(row: any): CostProfile {
  return {
    id: row.id,
    regionId: row.region_id,
    segment: row.segment,
    segmentLabel: row.segment_label,
    yieldTHa: row.yield_t_ha ?? null,
    priceT: row.price_t ?? null,
    grossIncomeHa: row.gross_income_ha ?? null,
    seedCostHa: row.seed_cost_ha ?? null,
    fertiliserCostHa: row.fertiliser_cost_ha ?? null,
    fertNCostHa: row.fert_n_cost_ha ?? null,
    fertNQtyKgHa: row.fert_n_qty_kg_ha ?? null,
    fertPCostHa: row.fert_p_cost_ha ?? null,
    fertPQtyKgHa: row.fert_p_qty_kg_ha ?? null,
    fertKCostHa: row.fert_k_cost_ha ?? null,
    fertKQtyKgHa: row.fert_k_qty_kg_ha ?? null,
    fertOtherCostHa: row.fert_other_cost_ha ?? null,
    fertOtherQtyKgHa: row.fert_other_qty_kg_ha ?? null,
    cropProtectionCostHa: row.crop_protection_cost_ha ?? null,
    chemHerbicideCostHa: row.chem_herbicide_cost_ha ?? null,
    chemHerbicideQtyLHa: row.chem_herbicide_qty_l_ha ?? null,
    chemFungicideCostHa: row.chem_fungicide_cost_ha ?? null,
    chemFungicideQtyLHa: row.chem_fungicide_qty_l_ha ?? null,
    chemInsecticideCostHa: row.chem_insecticide_cost_ha ?? null,
    chemInsecticideQtyLHa: row.chem_insecticide_qty_l_ha ?? null,
    chemOtherCostHa: row.chem_other_cost_ha ?? null,
    chemOtherQtyLHa: row.chem_other_qty_l_ha ?? null,
    irrigationCostHa: row.irrigation_cost_ha ?? null,
    waterUseMlHa: row.water_use_ml_ha ?? null,
    machineryCostHa: row.machinery_cost_ha ?? null,
    contractCostHa: row.contract_cost_ha ?? null,
    labourCostHa: row.labour_cost_ha ?? null,
    labourRateHr: row.labour_rate_hr ?? null,
    postHarvestCostHa: row.post_harvest_cost_ha ?? null,
    overheadPct: row.overhead_pct ?? null,
    totalVariableCostHa: row.total_variable_cost_ha ?? null,
    grossMarginHa: row.gross_margin_ha ?? null,
    dataQuality: row.data_quality,
    sourceName: row.source_name ?? null,
    sourceUrl: row.source_url ?? null,
    sourceYear: row.source_year ?? null,
    notes: row.notes ?? null,
  };
}

function costProfilePatchToRow(patch: Partial<InsertCostProfile>): Record<string, any> {
  const row: Record<string, any> = {};
  if (patch.regionId !== undefined) row.region_id = patch.regionId;
  if (patch.segment !== undefined) row.segment = patch.segment;
  if (patch.segmentLabel !== undefined) row.segment_label = patch.segmentLabel;
  if (patch.yieldTHa !== undefined) row.yield_t_ha = patch.yieldTHa;
  if (patch.priceT !== undefined) row.price_t = patch.priceT;
  if (patch.grossIncomeHa !== undefined) row.gross_income_ha = patch.grossIncomeHa;
  if (patch.seedCostHa !== undefined) row.seed_cost_ha = patch.seedCostHa;
  if (patch.fertiliserCostHa !== undefined) row.fertiliser_cost_ha = patch.fertiliserCostHa;
  if (patch.fertNCostHa !== undefined) row.fert_n_cost_ha = patch.fertNCostHa;
  if (patch.fertNQtyKgHa !== undefined) row.fert_n_qty_kg_ha = patch.fertNQtyKgHa;
  if (patch.fertPCostHa !== undefined) row.fert_p_cost_ha = patch.fertPCostHa;
  if (patch.fertPQtyKgHa !== undefined) row.fert_p_qty_kg_ha = patch.fertPQtyKgHa;
  if (patch.fertKCostHa !== undefined) row.fert_k_cost_ha = patch.fertKCostHa;
  if (patch.fertKQtyKgHa !== undefined) row.fert_k_qty_kg_ha = patch.fertKQtyKgHa;
  if (patch.fertOtherCostHa !== undefined) row.fert_other_cost_ha = patch.fertOtherCostHa;
  if (patch.fertOtherQtyKgHa !== undefined) row.fert_other_qty_kg_ha = patch.fertOtherQtyKgHa;
  if (patch.cropProtectionCostHa !== undefined) row.crop_protection_cost_ha = patch.cropProtectionCostHa;
  if (patch.chemHerbicideCostHa !== undefined) row.chem_herbicide_cost_ha = patch.chemHerbicideCostHa;
  if (patch.chemHerbicideQtyLHa !== undefined) row.chem_herbicide_qty_l_ha = patch.chemHerbicideQtyLHa;
  if (patch.chemFungicideCostHa !== undefined) row.chem_fungicide_cost_ha = patch.chemFungicideCostHa;
  if (patch.chemFungicideQtyLHa !== undefined) row.chem_fungicide_qty_l_ha = patch.chemFungicideQtyLHa;
  if (patch.chemInsecticideCostHa !== undefined) row.chem_insecticide_cost_ha = patch.chemInsecticideCostHa;
  if (patch.chemInsecticideQtyLHa !== undefined) row.chem_insecticide_qty_l_ha = patch.chemInsecticideQtyLHa;
  if (patch.chemOtherCostHa !== undefined) row.chem_other_cost_ha = patch.chemOtherCostHa;
  if (patch.chemOtherQtyLHa !== undefined) row.chem_other_qty_l_ha = patch.chemOtherQtyLHa;
  if (patch.irrigationCostHa !== undefined) row.irrigation_cost_ha = patch.irrigationCostHa;
  if (patch.waterUseMlHa !== undefined) row.water_use_ml_ha = patch.waterUseMlHa;
  if (patch.machineryCostHa !== undefined) row.machinery_cost_ha = patch.machineryCostHa;
  if (patch.contractCostHa !== undefined) row.contract_cost_ha = patch.contractCostHa;
  if (patch.labourCostHa !== undefined) row.labour_cost_ha = patch.labourCostHa;
  if (patch.labourRateHr !== undefined) row.labour_rate_hr = patch.labourRateHr;
  if (patch.postHarvestCostHa !== undefined) row.post_harvest_cost_ha = patch.postHarvestCostHa;
  if (patch.overheadPct !== undefined) row.overhead_pct = patch.overheadPct;
  if (patch.totalVariableCostHa !== undefined) row.total_variable_cost_ha = patch.totalVariableCostHa;
  if (patch.grossMarginHa !== undefined) row.gross_margin_ha = patch.grossMarginHa;
  if (patch.dataQuality !== undefined) row.data_quality = patch.dataQuality;
  if (patch.sourceName !== undefined) row.source_name = patch.sourceName;
  if (patch.sourceUrl !== undefined) row.source_url = patch.sourceUrl;
  if (patch.sourceYear !== undefined) row.source_year = patch.sourceYear;
  if (patch.notes !== undefined) row.notes = patch.notes;
  return row;
}

export interface IStorage {
  getRegions(): Promise<Region[]>;
  getRegion(id: string): Promise<Region | undefined>;
  getCostProfiles(regionId?: string): Promise<CostProfile[]>;
  getCostProfile(id: number): Promise<CostProfile | undefined>;
  updateCostProfile(id: number, patch: Partial<InsertCostProfile>): Promise<CostProfile | undefined>;
  createCostProfile(profile: InsertCostProfile): Promise<CostProfile>;
  updateRegion(id: string, patch: Partial<InsertRegion>): Promise<Region | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getRegions(): Promise<Region[]> {
    const { data, error } = await supabase
      .from("regions")
      .select("*")
      .order("sort_order", { ascending: true });
    if (error) throw error;
    return (data ?? []).map(rowToRegion);
  }

  async getRegion(id: string): Promise<Region | undefined> {
    const { data, error } = await supabase.from("regions").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToRegion(data) : undefined;
  }

  async getCostProfiles(regionId?: string): Promise<CostProfile[]> {
    let query = supabase.from("cost_profiles").select("*");
    if (regionId) {
      query = query.eq("region_id", regionId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map(rowToCostProfile);
  }

  async getCostProfile(id: number): Promise<CostProfile | undefined> {
    const { data, error } = await supabase.from("cost_profiles").select("*").eq("id", id).maybeSingle();
    if (error) throw error;
    return data ? rowToCostProfile(data) : undefined;
  }

  async updateCostProfile(id: number, patch: Partial<InsertCostProfile>): Promise<CostProfile | undefined> {
    const row = costProfilePatchToRow(patch);
    const { data, error } = await supabase
      .from("cost_profiles")
      .update(row)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToCostProfile(data) : undefined;
  }

  async createCostProfile(profile: InsertCostProfile): Promise<CostProfile> {
    const row = costProfilePatchToRow(profile);
    const { data, error } = await supabase.from("cost_profiles").insert(row).select().single();
    if (error) throw error;
    return rowToCostProfile(data);
  }

  async updateRegion(id: string, patch: Partial<InsertRegion>): Promise<Region | undefined> {
    const row = regionPatchToRow(patch);
    const { data, error } = await supabase
      .from("regions")
      .update(row)
      .eq("id", id)
      .select()
      .maybeSingle();
    if (error) throw error;
    return data ? rowToRegion(data) : undefined;
  }
}

export const storage = new DatabaseStorage();
