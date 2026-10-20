// What the published budgets can say about each PotatoLink area.
//
// Spudonomics holds figures by district; the PT26001 framework works by area.
// This joins them through the crosswalk (src/data/area-map.json) and reports,
// for every area, what actually exists and how old it is.
//
// It never creates a number. Three rules from the crosswalk carry through:
// - an area with no regional economics says so, and a state-wide stand-in is
//   labelled as one rather than shown as if it were local;
// - two districts sharing an area are listed side by side, never averaged;
// - a gap is never filled from a neighbouring district.

import { listRegions, profilesForRegion } from "../data";
import {
  districtsForArea,
  potatoLinkAreas,
  potatoLinkRegions,
  regionForArea,
  type AreaCoverage,
  type PotatoLinkArea,
  type PotatoLinkRegion,
} from "../data/areaMap";
import { baselineMargin } from "./grossMargin";
import type { DataQuality, Region } from "../types";

/** A published gross margin for one market segment of one district. */
export interface PublishedFigure {
  segment: string;
  segmentLabel: string;
  marginHa: number;
  /** The source's own wording, e.g. "c.2007 (2005 data)". */
  sourceYear: string | null;
  /** The earliest year the source's wording mentions, for judging age. */
  dataYear: number | null;
  quality: DataQuality;
}

export interface AreaDistrictView {
  district: Region;
  coverage: AreaCoverage;
  /** Every segment with a published margin. Empty means nothing was published. */
  figures: PublishedFigure[];
}

/** The best evidence any district gives an area. */
export type AreaEvidence = DataQuality;

export interface AreaView {
  area: PotatoLinkArea;
  region: PotatoLinkRegion;
  districts: AreaDistrictView[];
  evidence: AreaEvidence;
  /** Age of the oldest figure shown for the area, or null when there are none. */
  oldestDataYear: number | null;
  /** True when more than one district speaks for the area, so they must not be merged. */
  sharedBetweenDistricts: boolean;
}

/** The earliest four-digit year in a source's wording, or null. */
export function dataYearOf(sourceYear: string | null): number | null {
  if (sourceYear === null) return null;
  const years = [...sourceYear.matchAll(/\b(19|20)\d{2}\b/g)].map((match) => Number(match[0]));
  return years.length === 0 ? null : Math.min(...years);
}

function figuresFor(districtId: string): PublishedFigure[] {
  return profilesForRegion(districtId).flatMap((profile) => {
    const result = baselineMargin(profile);
    // "itemised" is a sum of the lines the source broke down with no published
    // total, so its margin is an upper bound. It is not a published margin.
    if (result.basis === "itemised" || result.marginHa === null) return [];
    return [
      {
        segment: profile.segment,
        segmentLabel: profile.segmentLabel,
        marginHa: result.marginHa,
        sourceYear: profile.sourceYear,
        dataYear: dataYearOf(profile.sourceYear),
        quality: profile.dataQuality,
      },
    ];
  });
}

const RANK: Record<DataQuality, number> = { regional: 2, state_proxy: 1, none: 0 };

export function viewArea(areaId: string): AreaView | undefined {
  const area = potatoLinkAreas.find((candidate) => candidate.id === areaId);
  const region = regionForArea(areaId);
  if (area === undefined || region === undefined) return undefined;

  const districts = districtsForArea(areaId).map(({ district, coverage }) => ({
    district,
    coverage,
    figures: figuresFor(district.id),
  }));

  // Evidence follows what the figures themselves say, not the district's
  // headline label: a district marked regional that publishes no margin for any
  // segment does not give its area regional economics.
  let evidence: AreaEvidence = "none";
  for (const { figures } of districts) {
    for (const figure of figures) {
      if (RANK[figure.quality] > RANK[evidence]) evidence = figure.quality;
    }
  }

  const years = districts.flatMap(({ figures }) =>
    figures.flatMap((figure) => (figure.dataYear === null ? [] : [figure.dataYear])),
  );

  return {
    area,
    region,
    districts,
    evidence,
    oldestDataYear: years.length === 0 ? null : Math.min(...years),
    sharedBetweenDistricts: districts.length > 1,
  };
}

/** Every area, grouped by region in the order the framework lists them. */
export function listAreaViews(): { region: PotatoLinkRegion; areas: AreaView[] }[] {
  return potatoLinkRegions.map((region) => ({
    region,
    areas: potatoLinkAreas
      .filter((area) => area.regionId === region.id)
      .flatMap((area) => viewArea(area.id) ?? []),
  }));
}

/** The areas that matter for evidence: no regional economics at all, worst first. */
export function areasWithoutRegionalEconomics(): AreaView[] {
  return listAreaViews()
    .flatMap(({ areas }) => areas)
    .filter((view) => view.evidence !== "regional")
    .sort((a, b) => RANK[a.evidence] - RANK[b.evidence]);
}

/** Regional figures that are old enough to need field work to refresh. */
export function staleAreas(currentYear: number, maxAgeYears = 10): AreaView[] {
  return listAreaViews()
    .flatMap(({ areas }) => areas)
    .filter(
      (view) =>
        view.evidence === "regional" &&
        view.oldestDataYear !== null &&
        currentYear - view.oldestDataYear > maxAgeYears,
    );
}

/** Districts that sit outside every PotatoLink area (kept as reference data). */
export function unmappedDistricts(): Region[] {
  const mapped = new Set(
    potatoLinkAreas.flatMap((area) => districtsForArea(area.id).map((d) => d.district.id)),
  );
  return listRegions().filter((district) => !mapped.has(district.id));
}

export interface AreaCoverageRow {
  regionId: string;
  areaId: string;
  evidence: AreaEvidence;
  districtId: string;
  coverage: AreaCoverage;
  segment: string | null;
  /** null means the source never published it. It is never 0. */
  grossMarginPerHa: number | null;
  sourceYear: string | null;
  dataYear: number | null;
}

/**
 * The same rows as the CSV, keyed by id, for another tool to read as a data
 * file (Fieldwork's placeholder economics). Aggregate published figures only:
 * no people, nothing collected.
 */
export function areaCoverageRows(): AreaCoverageRow[] {
  return listAreaViews().flatMap(({ region, areas }) =>
    areas.flatMap((view) =>
      view.districts.flatMap(({ district, coverage, figures }): AreaCoverageRow[] => {
        const base = {
          regionId: region.id,
          areaId: view.area.id,
          evidence: view.evidence,
          districtId: district.id,
          coverage,
        };
        if (figures.length === 0) {
          return [
            { ...base, segment: null, grossMarginPerHa: null, sourceYear: null, dataYear: null },
          ];
        }
        return figures.map((figure) => ({
          ...base,
          segment: figure.segment,
          grossMarginPerHa: figure.marginHa,
          sourceYear: figure.sourceYear,
          dataYear: figure.dataYear,
        }));
      }),
    ),
  );
}

function csvCell(value: string | number | null): string {
  if (value === null) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

/**
 * One row per area and district, with the age of the data on every row. An
 * export is where an old figure is most likely to lose its date, so it carries
 * the source year and says "not published" instead of leaving a number out.
 */
export function areaCoverageCsv(): string {
  const header = [
    "region",
    "area",
    "evidence",
    "district",
    "coverage",
    "segment",
    "gross_margin_per_ha",
    "source_year",
  ];
  const rows: (string | number | null)[][] = [];
  for (const { region, areas } of listAreaViews()) {
    for (const view of areas) {
      for (const { district, coverage, figures } of view.districts) {
        if (figures.length === 0) {
          rows.push([region.name, view.area.name, view.evidence, district.name, coverage, "", "not published", ""]);
        }
        for (const figure of figures) {
          rows.push([
            region.name,
            view.area.name,
            view.evidence,
            district.name,
            coverage,
            figure.segmentLabel,
            figure.marginHa,
            figure.sourceYear,
          ]);
        }
      }
    }
  }
  return [header, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
}
