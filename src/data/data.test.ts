import { describe, expect, it } from "vitest";
import { costProfiles, findRegion, listRegions, profilesForRegion, regions } from "./index";
import { costProfileSchema, regionSchema } from "../schemas";

// The dataset is the product here, so it gets tested like code. Importing it at
// all runs it through Zod; these add the checks a schema cannot express.

describe("the shipped dataset", () => {
  it("parses every region and profile", () => {
    expect(regions.length).toBe(14);
    expect(costProfiles.length).toBe(32);
    for (const region of regions) expect(regionSchema.safeParse(region).success).toBe(true);
    for (const profile of costProfiles) {
      expect(costProfileSchema.safeParse(profile).success).toBe(true);
    }
  });

  it("files every profile against a region that exists", () => {
    for (const profile of costProfiles) {
      expect(findRegion(profile.regionId), profile.regionId).toBeDefined();
    }
  });

  it("gives every region at least one segment to select", () => {
    for (const region of regions) {
      expect(profilesForRegion(region.id).length, region.id).toBeGreaterThan(0);
    }
  });

  it("has no duplicate region-and-segment pairs", () => {
    const keys = costProfiles.map((p) => `${p.regionId}/${p.segment}`);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it("cites a source for every figure it publishes", () => {
    // The promise on the front of the app is that every figure traces to a
    // source. A profile carrying numbers without one breaks that promise.
    for (const profile of costProfiles) {
      const hasFigures =
        profile.grossIncomeHa !== null ||
        profile.totalVariableCostHa !== null ||
        profile.grossMarginHa !== null;
      if (hasFigures) {
        expect(profile.sourceName, `${profile.regionId}/${profile.segment}`).toBeTruthy();
        expect(profile.sourceUrl, `${profile.regionId}/${profile.segment}`).toBeTruthy();
      }
    }
  });

  it("marks a profile with no economics as dataQuality none", () => {
    for (const profile of costProfiles) {
      const hasEconomics =
        profile.totalVariableCostHa !== null || profile.grossMarginHa !== null;
      if (!hasEconomics && profile.grossIncomeHa === null) {
        expect(profile.dataQuality, `${profile.regionId}/${profile.segment}`).toBe("none");
      }
    }
  });

  it("orders regions deterministically", () => {
    const order = listRegions().map((region) => region.sortOrder);
    expect(order).toEqual([...order].sort((a, b) => a - b));
  });
});
