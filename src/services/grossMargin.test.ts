import { describe, expect, it } from "vitest";
import { baselineMargin, editedMargin, revenueFor } from "./grossMargin";
import { costProfiles, findProfile } from "../data";
import type { CostProfile } from "../types";

function profile(regionId: string, segment: string): CostProfile {
  const found = findProfile(regionId, segment);
  if (!found) throw new Error(`No profile for ${regionId}/${segment}`);
  return found;
}

describe("baselineMargin — the published total wins", () => {
  it("reports Tasmanian seed at the published margin, not revenue minus seed", () => {
    // The prototype summed the itemised lines — here, seed alone at $2,100 —
    // and reported $18,160/ha. The source publishes $9,150/ha of cost and an
    // $11,110/ha margin, and says so in its own notes.
    const result = baselineMargin(profile("tas-north", "seed"));
    expect(result.basis).toBe("published");
    expect(result.costHa).toBe(9150);
    expect(result.marginHa).toBe(11110);
    expect(result.incomplete).toBe(false);
  });

  it("keeps the un-itemised remainder visible rather than losing it", () => {
    const result = baselineMargin(profile("tas-north", "seed"));
    expect(result.itemisedHa).toBe(2100);
    // $7,050/ha of real cost the source never broke down — precisely the money
    // the prototype dropped on the floor.
    expect(result.unitemisedHa).toBe(7050);
    expect(result.missingLines).toContain("Fertiliser (not broken down)");
  });

  it("reports the South Australian margin as $1,438/ha, not $13,625/ha", () => {
    // The worst case: a 848% overstatement, shown with a breakeven of zero.
    const result = baselineMargin(profile("sa-adelaide", "unspecified"));
    expect(result.costHa).toBe(12188);
    expect(result.marginHa).toBe(1438);
    expect(result.revenueHa).toBe(13625);
  });

  it("derives breakeven from the real cost, so it is never zero", () => {
    const result = baselineMargin(profile("sa-adelaide", "unspecified"));
    expect(result.breakevenYieldTHa).toBeCloseTo(12188 / (13625 / 32.88), 2);
    expect(result.breakevenPriceT).toBeCloseTo(12188 / 32.88, 2);
    expect(result.breakevenYieldTHa).toBeGreaterThan(0);
  });
});

describe("baselineMargin — nothing published", () => {
  it("returns no cost rather than a cost of zero", () => {
    const result = baselineMargin(profile("vic-central", "processing_crisping"));
    expect(result.basis).toBe("absent");
    expect(result.costHa).toBeNull();
    expect(result.marginHa).toBeNull();
    expect(result.incomplete).toBe(true);
  });

  it("refuses to print a breakeven with no cost behind it", () => {
    const result = baselineMargin(profile("vic-central", "processing_crisping"));
    expect(result.breakevenYieldTHa).toBeNull();
    expect(result.breakevenPriceT).toBeNull();
  });

  it("still shows a published margin where that is all the source gave", () => {
    // The 1998 Queensland budgets publish a margin and nothing else.
    const result = baselineMargin(profile("qld-lockyer", "fresh"));
    expect(result.marginHa).toBeCloseTo(2432.77, 2);
    expect(result.costHa).toBeNull();
    expect(result.incomplete).toBe(true);
  });
});

describe("revenueFor", () => {
  it("prefers published gross income over yield x price", () => {
    // Two-tier and per-bag pricing mean yield x price does not reproduce the
    // published revenue, so the published figure has to win.
    expect(revenueFor({ yieldTHa: 45, priceT: 550, grossIncomeHa: 17550, overheadPct: null }))
      .toBe(17550);
  });

  it("falls back to yield x price when no revenue was published", () => {
    expect(revenueFor({ yieldTHa: 40, priceT: 500, grossIncomeHa: null, overheadPct: null }))
      .toBe(20000);
  });

  it("returns nothing when neither is available", () => {
    expect(revenueFor({ yieldTHa: null, priceT: null, grossIncomeHa: null, overheadPct: null }))
      .toBeNull();
  });
});

describe("editedMargin — the user's own numbers", () => {
  it("sums the parts once someone has taken the numbers over", () => {
    const base = profile("tas-north", "seed");
    const result = editedMargin(
      base,
      { yieldTHa: 40, priceT: 500, grossIncomeHa: 20000, overheadPct: 0 },
      { seedCostHa: 2100, fertiliserCostHa: 1800, machineryCostHa: 900 },
    );
    expect(result.basis).toBe("edited");
    expect(result.costHa).toBe(4800);
    expect(result.marginHa).toBe(15200);
    // Their numbers, their margin — not flagged as incomplete.
    expect(result.incomplete).toBe(false);
  });

  it("applies overheads as a percentage of revenue", () => {
    const result = editedMargin(
      profile("nsw-riverina", "processing"),
      { yieldTHa: 35, priceT: 280, grossIncomeHa: 10000, overheadPct: 10 },
      { seedCostHa: 1000 },
    );
    // Every other line keeps its published value, so assert on the overhead
    // contribution rather than the absolute total.
    const withoutOverheads = editedMargin(
      profile("nsw-riverina", "processing"),
      { yieldTHa: 35, priceT: 280, grossIncomeHa: 10000, overheadPct: 0 },
      { seedCostHa: 1000 },
    );
    expect((result.costHa ?? 0) - (withoutOverheads.costHa ?? 0)).toBeCloseTo(1000, 6);
  });
});

describe("the dataset as a whole", () => {
  it("never reports a margin above revenue when a cost was published", () => {
    // The single invariant the prototype broke on eight of fourteen budgets.
    for (const candidate of costProfiles) {
      const result = baselineMargin(candidate);
      if (result.costHa === null || result.revenueHa === null) continue;
      expect(result.marginHa ?? 0).toBeLessThanOrEqual(result.revenueHa);
    }
  });

  it("agrees with every published gross margin it has the numbers for", () => {
    const checked: string[] = [];
    for (const candidate of costProfiles) {
      if (candidate.grossMarginHa === null || candidate.totalVariableCostHa === null) continue;
      const result = baselineMargin(candidate);
      expect(result.marginHa).toBeCloseTo(candidate.grossMarginHa, 2);
      checked.push(`${candidate.regionId}/${candidate.segment}`);
    }
    // Guards the guard: if the dataset ever loses its published totals, this
    // test would otherwise pass by checking nothing.
    expect(checked.length).toBeGreaterThanOrEqual(12);
  });

  it("never offers a breakeven without a cost to compute it from", () => {
    for (const candidate of costProfiles) {
      const result = baselineMargin(candidate);
      if (result.costHa === null || result.costHa === 0) {
        expect(result.breakevenYieldTHa).toBeNull();
        expect(result.breakevenPriceT).toBeNull();
      }
    }
  });
});
