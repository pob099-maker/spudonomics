import { describe, expect, it } from "vitest";
import regionsDoc from "../../docs/REGIONS.md?raw";
import { regions } from "./index";
import {
  areasForDistrict,
  districtAreaMap,
  districtsForArea,
  findArea,
  agAimsAreas,
  agAimsRegions,
  regionForArea,
} from "./areaMap";

// The crosswalk is data, so it is tested like data. These checks keep it honest
// against both sides: the Spudonomics districts and the shared AgAims areas.

describe("the shared AgAims areas", () => {
  it("has 7 regions and 12 areas, as in docs/REGIONS.md", () => {
    expect(agAimsRegions.length).toBe(7);
    expect(agAimsAreas.length).toBe(12);
  });

  it("puts every area in a region that exists", () => {
    for (const area of agAimsAreas) {
      expect(regionForArea(area.id), area.id).toBeDefined();
    }
  });

  it("has no duplicate ids within a layer", () => {
    // Checked per layer, not across both: Ballarat is a region AND an area, and
    // docs/REGIONS.md gives both the id "ballarat". Region and area ids never
    // sit in the same lookup, so that is not a clash.
    const regionIds = agAimsRegions.map((r) => r.id);
    const areaIds = agAimsAreas.map((a) => a.id);
    expect(new Set(regionIds).size).toBe(regionIds.length);
    expect(new Set(areaIds).size).toBe(areaIds.length);
  });
});

// areas.json is a hand copy of the table in docs/REGIONS.md. If someone edits
// one and not the other, the two AgAims tools and this app stop agreeing
// about what the areas are, so this reads the table and compares.
describe("docs/REGIONS.md", () => {
  const rows = regionsDoc
    .split("\n")
    .filter((line) => line.startsWith("|"))
    .map((line) =>
      line
        .split("|")
        .slice(1, -1)
        .map((cell) => cell.trim()),
    )
    // Data rows only: seven cells, and a kebab-case area id in the fourth.
    .filter((cells) => cells.length === 7 && /^[a-z]+(-[a-z]+)*$/.test(cells[3]));

  it("lists the same areas as areas.json", () => {
    const fromDoc = rows
      .map(([regionId, , , id, name]) => ({ id, name, regionId }))
      .sort((a, b) => a.id.localeCompare(b.id));
    const fromJson = [...agAimsAreas].sort((a, b) => a.id.localeCompare(b.id));
    expect(fromJson).toEqual(fromDoc);
  });

  it("lists the same regions as areas.json", () => {
    const fromDoc = [...new Map(rows.map(([id, name]) => [id, { id, name }])).values()].sort(
      (a, b) => a.id.localeCompare(b.id),
    );
    const fromJson = [...agAimsRegions].sort((a, b) => a.id.localeCompare(b.id));
    expect(fromJson).toEqual(fromDoc);
  });
});

describe("the district-to-area crosswalk", () => {
  it("covers every Spudonomics district exactly once", () => {
    const mapped = districtAreaMap.map((entry) => entry.districtId).sort();
    expect(mapped).toEqual(regions.map((region) => region.id).sort());
  });

  it("points only at areas that exist", () => {
    for (const entry of districtAreaMap) {
      for (const link of entry.areas) {
        expect(findArea(link.areaId), `${entry.districtId} -> ${link.areaId}`).toBeDefined();
      }
    }
  });

  it("gives every AgAims area at least one district", () => {
    for (const area of agAimsAreas) {
      expect(districtsForArea(area.id).length, area.id).toBeGreaterThan(0);
    }
  });

  it("explains every district that has no AgAims area", () => {
    for (const entry of districtAreaMap) {
      if (entry.areas.length === 0) expect(entry.note.length, entry.districtId).toBeGreaterThan(20);
    }
  });

  it("does not claim full coverage for a district that shares its area", () => {
    for (const area of agAimsAreas) {
      const sharing = districtsForArea(area.id);
      if (sharing.length > 1) {
        for (const item of sharing) expect(item.coverage, `${item.district.id} in ${area.id}`).toBe("partial");
      }
    }
  });

  it("looks up in both directions", () => {
    expect(areasForDistrict("tas-north").map((item) => item.area.id).sort()).toEqual([
      "ne-tas-scottsdale",
      "nw-tas-sisters-creek",
    ]);
    expect(districtsForArea("mallee-loxton").map((item) => item.district.id).sort()).toEqual([
      "sa-riverland",
      "vic-mallee",
    ]);
    expect(areasForDistrict("wa-perth")).toEqual([]);
  });
});
