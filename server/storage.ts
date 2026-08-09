import { regions, costProfiles } from "@shared/schema";
import type { Region, InsertRegion, CostProfile, InsertCostProfile } from "@shared/schema";
import { drizzle } from "drizzle-orm/better-sqlite3";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { REGIONS, COST_PROFILES } from "./seed-data";

const sqlite = new Database("data.db");
sqlite.pragma("journal_mode = WAL");

export const db = drizzle(sqlite);

// Create tables if they don't exist yet (no migration runner wired up — keep this simple and idempotent).
sqlite.exec(`
  CREATE TABLE IF NOT EXISTS regions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    state TEXT NOT NULL,
    sort_order INTEGER NOT NULL,
    data_quality TEXT NOT NULL,
    production_share TEXT,
    summary TEXT
  );
  CREATE TABLE IF NOT EXISTS cost_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    region_id TEXT NOT NULL,
    segment TEXT NOT NULL,
    segment_label TEXT NOT NULL,
    yield_t_ha REAL,
    price_t REAL,
    gross_income_ha REAL,
    seed_cost_ha REAL,
    fertiliser_cost_ha REAL,
    crop_protection_cost_ha REAL,
    irrigation_cost_ha REAL,
    water_use_ml_ha REAL,
    machinery_cost_ha REAL,
    contract_cost_ha REAL,
    labour_cost_ha REAL,
    labour_rate_hr REAL,
    post_harvest_cost_ha REAL,
    overhead_pct REAL,
    total_variable_cost_ha REAL,
    gross_margin_ha REAL,
    data_quality TEXT NOT NULL,
    source_name TEXT,
    source_url TEXT,
    source_year TEXT,
    notes TEXT
  );
`);

function seedIfEmpty() {
  const regionCount = (sqlite.prepare("SELECT COUNT(*) as c FROM regions").get() as { c: number }).c;
  if (regionCount === 0) {
    const insertRegion = sqlite.prepare(
      `INSERT INTO regions (id, name, state, sort_order, data_quality, production_share, summary) VALUES (?, ?, ?, ?, ?, ?, ?)`
    );
    for (const r of REGIONS) {
      insertRegion.run(r.id, r.name, r.state, r.sortOrder, r.dataQuality, r.productionShare ?? null, r.summary ?? null);
    }
  }
  const profileCount = (sqlite.prepare("SELECT COUNT(*) as c FROM cost_profiles").get() as { c: number }).c;
  if (profileCount === 0) {
    const insertProfile = sqlite.prepare(`
      INSERT INTO cost_profiles (
        region_id, segment, segment_label, yield_t_ha, price_t, gross_income_ha,
        seed_cost_ha, fertiliser_cost_ha, crop_protection_cost_ha, irrigation_cost_ha, water_use_ml_ha,
        machinery_cost_ha, contract_cost_ha, labour_cost_ha, labour_rate_hr, post_harvest_cost_ha,
        overhead_pct, total_variable_cost_ha, gross_margin_ha,
        data_quality, source_name, source_url, source_year, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const p of COST_PROFILES) {
      insertProfile.run(
        p.regionId, p.segment, p.segmentLabel, p.yieldTHa ?? null, p.priceT ?? null, p.grossIncomeHa ?? null,
        p.seedCostHa ?? null, p.fertiliserCostHa ?? null, p.cropProtectionCostHa ?? null, p.irrigationCostHa ?? null, p.waterUseMlHa ?? null,
        p.machineryCostHa ?? null, p.contractCostHa ?? null, p.labourCostHa ?? null, p.labourRateHr ?? null, p.postHarvestCostHa ?? null,
        p.overheadPct ?? null, p.totalVariableCostHa ?? null, p.grossMarginHa ?? null,
        p.dataQuality, p.sourceName ?? null, p.sourceUrl ?? null, p.sourceYear ?? null, p.notes ?? null
      );
    }
  }
}

seedIfEmpty();

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
    return db.select().from(regions).all().sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async getRegion(id: string): Promise<Region | undefined> {
    return db.select().from(regions).where(eq(regions.id, id)).get();
  }

  async getCostProfiles(regionId?: string): Promise<CostProfile[]> {
    if (regionId) {
      return db.select().from(costProfiles).where(eq(costProfiles.regionId, regionId)).all();
    }
    return db.select().from(costProfiles).all();
  }

  async getCostProfile(id: number): Promise<CostProfile | undefined> {
    return db.select().from(costProfiles).where(eq(costProfiles.id, id)).get();
  }

  async updateCostProfile(id: number, patch: Partial<InsertCostProfile>): Promise<CostProfile | undefined> {
    return db.update(costProfiles).set(patch).where(eq(costProfiles.id, id)).returning().get();
  }

  async createCostProfile(profile: InsertCostProfile): Promise<CostProfile> {
    return db.insert(costProfiles).values(profile).returning().get();
  }

  async updateRegion(id: string, patch: Partial<InsertRegion>): Promise<Region | undefined> {
    return db.update(regions).set(patch).where(eq(regions.id, id)).returning().get();
  }
}

export const storage = new DatabaseStorage();
