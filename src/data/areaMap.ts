// The crosswalk between Spudonomics districts and the shared PotatoLink areas.
//
// Spudonomics organises its published budgets by district (the `Region` type in
// this app, fourteen of them). The PotatoLink framework organises everything by
// two layers: 7 regions and 12 areas, defined in docs/REGIONS.md, which comes
// from the PT26001 proposal. This file joins the two without changing either.
//
// Nothing here creates a figure. A district that covers only part of an area
// says so ("partial"), and a district with no matching area (Perth / Myalup) is
// kept as reference data rather than forced into one.

import { z } from "zod";
import areasJson from "./areas.json";
import areaMapJson from "./area-map.json";
import { findRegion } from "./index";
import type { Region } from "../types";

const coverage = z.enum(["full", "partial"]);

export const areasFileSchema = z.object({
  regions: z.array(z.object({ id: z.string().min(1), name: z.string().min(1) })),
  areas: z.array(
    z.object({ id: z.string().min(1), name: z.string().min(1), regionId: z.string().min(1) }),
  ),
});

export const areaMapSchema = z.object({
  districts: z.array(
    z.object({
      districtId: z.string().min(1),
      areas: z.array(z.object({ areaId: z.string().min(1), coverage })),
      note: z.string().min(1),
    }),
  ),
});

export type AreaCoverage = z.infer<typeof coverage>;

export interface PotatoLinkRegion {
  id: string;
  name: string;
}

export interface PotatoLinkArea {
  id: string;
  name: string;
  regionId: string;
}

export interface AreaDistrict {
  district: Region;
  coverage: AreaCoverage;
}

const shared = areasFileSchema.parse(areasJson);
const map = areaMapSchema.parse(areaMapJson);

export const potatoLinkRegions: PotatoLinkRegion[] = shared.regions;
export const potatoLinkAreas: PotatoLinkArea[] = shared.areas;
export const districtAreaMap = map.districts;

export function findArea(areaId: string): PotatoLinkArea | undefined {
  return potatoLinkAreas.find((area) => area.id === areaId);
}

/** The region an area belongs to. Always derived from the area, never stored separately. */
export function regionForArea(areaId: string): PotatoLinkRegion | undefined {
  const area = findArea(areaId);
  return area === undefined ? undefined : potatoLinkRegions.find((r) => r.id === area.regionId);
}

/** Areas a district's figures speak to. Empty for a district outside the PotatoLink areas. */
export function areasForDistrict(districtId: string): { area: PotatoLinkArea; coverage: AreaCoverage }[] {
  const entry = districtAreaMap.find((item) => item.districtId === districtId);
  if (entry === undefined) return [];
  return entry.areas.flatMap(({ areaId, coverage: how }) => {
    const area = findArea(areaId);
    return area === undefined ? [] : [{ area, coverage: how }];
  });
}

/**
 * Districts whose published budgets speak to an area, and how much of it they
 * cover. More than one district can share an area (Mallee / Loxton has two), so
 * an area-level view has to choose or show both; it must not average them.
 */
export function districtsForArea(areaId: string): AreaDistrict[] {
  return districtAreaMap.flatMap((entry) => {
    const link = entry.areas.find((item) => item.areaId === areaId);
    const district = findRegion(entry.districtId);
    return link === undefined || district === undefined ? [] : [{ district, coverage: link.coverage }];
  });
}
