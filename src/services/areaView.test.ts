import { describe, expect, it } from "vitest";
import { costProfiles } from "../data";
import { agAimsAreas } from "../data/areaMap";
import {
  areaCoverageCsv,
  areaCoverageRows,
  areasWithoutRegionalEconomics,
  dataYearOf,
  listAreaViews,
  staleAreas,
  unmappedDistricts,
  viewArea,
} from "./areaView";
import { baselineMargin } from "./grossMargin";

// The area view reads the crosswalk, so it inherits the crosswalk's promise: it
// never invents or borrows a figure. These tests hold it to that against the
// shipped dataset.

describe("dataYearOf", () => {
  it("takes the earliest year in the source's wording", () => {
    expect(dataYearOf("2020")).toBe(2020);
    expect(dataYearOf("c.2007 (2005 data)")).toBe(2005);
    expect(dataYearOf("2013 (2012 prices)")).toBe(2012);
    expect(dataYearOf("2015 / c.2011")).toBe(2011);
  });

  it("returns null rather than guessing when there is no year", () => {
    expect(dataYearOf(null)).toBeNull();
    expect(dataYearOf("undated")).toBeNull();
  });
});

describe("viewArea", () => {
  it("builds a view for every AgAims area", () => {
    for (const area of agAimsAreas) {
      expect(viewArea(area.id), area.id).toBeDefined();
    }
    expect(viewArea("nowhere")).toBeUndefined();
  });

  it("says an area with no published economics has none, and shows no figure", () => {
    for (const id of ["ballarat", "gippsland-thorpdale"]) {
      const view = viewArea(id)!;
      expect(view.evidence, id).toBe("none");
      expect(view.oldestDataYear, id).toBeNull();
      for (const entry of view.districts) expect(entry.figures, id).toEqual([]);
    }
  });

  it("labels a state-wide stand-in as one and does not promote it to regional", () => {
    // Mallee / Loxton: the Victorian side has nothing, the South Australian side
    // has a state-wide budget standing in. Neither is regional economics.
    const view = viewArea("mallee-loxton")!;
    expect(view.evidence).toBe("state_proxy");
    for (const entry of view.districts) {
      for (const figure of entry.figures) expect(figure.quality).toBe("state_proxy");
    }
  });

  it("lists districts that share an area separately and never merges them", () => {
    const view = viewArea("mallee-loxton")!;
    expect(view.sharedBetweenDistricts).toBe(true);
    expect(view.districts.map((entry) => entry.district.id).sort()).toEqual([
      "sa-riverland",
      "vic-mallee",
    ]);
  });

  it("only calls an area regional when a district really published regional figures", () => {
    for (const { areas } of listAreaViews()) {
      for (const view of areas) {
        if (view.evidence !== "regional") continue;
        const regional = view.districts.some((entry) =>
          entry.figures.some((figure) => figure.quality === "regional"),
        );
        expect(regional, view.area.id).toBe(true);
      }
    }
  });

  it("keeps partial coverage visible", () => {
    const view = viewArea("lockyer-bundaberg")!;
    expect(view.districts[0].coverage).toBe("partial");
  });

  it("never offers a margin the source did not publish", () => {
    // A budget that itemises costs but publishes no total yields only an upper
    // bound from the engine. It must not appear as a margin on this page.
    const itemisedOnly = new Set(
      costProfiles
        .filter((profile) => baselineMargin(profile).basis === "itemised")
        .map((profile) => `${profile.regionId}/${profile.segment}`),
    );
    for (const { areas } of listAreaViews()) {
      for (const view of areas) {
        for (const entry of view.districts) {
          for (const figure of entry.figures) {
            expect(itemisedOnly.has(`${entry.district.id}/${figure.segment}`)).toBe(false);
          }
        }
      }
    }
  });
});

describe("gaps and freshness", () => {
  it("lists every area without regional economics, worst first", () => {
    const gaps = areasWithoutRegionalEconomics();
    const ids = gaps.map((view) => view.area.id);
    expect(ids).toEqual(expect.arrayContaining(["ballarat", "gippsland-thorpdale", "mallee-loxton"]));
    expect(gaps.every((view) => view.evidence !== "regional")).toBe(true);
    const firstProxy = gaps.findIndex((view) => view.evidence === "state_proxy");
    const lastNone = gaps.map((view) => view.evidence).lastIndexOf("none");
    expect(lastNone).toBeLessThan(firstProxy);
  });

  it("flags old regional figures", () => {
    const stale = staleAreas(2026).map((view) => view.area.id);
    expect(stale).toEqual(expect.arrayContaining(["atherton", "lockyer-bundaberg"]));
    expect(stale).not.toContain("midlands-longford");
  });

  it("reports the district kept outside the AgAims areas", () => {
    expect(unmappedDistricts().map((district) => district.id)).toEqual(["wa-perth"]);
  });
});

describe("areaCoverageRows", () => {
  const rows = areaCoverageRows();

  it("covers every area and carries only ids, not names", () => {
    const areaIds = new Set(rows.map((row) => row.areaId));
    expect([...areaIds].sort()).toEqual(agAimsAreas.map((area) => area.id).sort());
  });

  it("uses null for a margin nobody published, never 0", () => {
    const ballarat = rows.filter((row) => row.areaId === "ballarat");
    expect(ballarat.length).toBeGreaterThan(0);
    for (const row of ballarat) expect(row.grossMarginPerHa).toBeNull();
    expect(rows.every((row) => row.grossMarginPerHa !== 0)).toBe(true);
  });

  it("agrees with the CSV on how many rows there are", () => {
    expect(areaCoverageCsv().split("\n").length - 1).toBe(rows.length);
  });
});

describe("areaCoverageCsv", () => {
  const csv = areaCoverageCsv();

  it("has a row for every area", () => {
    for (const area of agAimsAreas) expect(csv, area.id).toContain(area.name);
  });

  it("says 'not published' for a gap instead of leaving a number out or writing zero", () => {
    const ballarat = csv.split("\n").find((line) => line.includes("Ballarat / Central"));
    expect(ballarat).toContain("not published");
    expect(ballarat).not.toMatch(/,0(,|$)/);
  });

  it("carries the source year on rows that have a figure", () => {
    const row = csv.split("\n").find((line) => line.includes("Atherton") && line.includes("1998"));
    expect(row).toBeDefined();
  });
});
