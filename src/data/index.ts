// The dataset lives in the repo, not a database.
//
// These are published figures carrying citations, edited rarely and reviewed
// carefully. Keeping them in version control means every change to a number
// arrives with an author, a date and a diff — which is the audit trail this
// kind of data actually needs. It also means there is no table for anyone to
// quietly rewrite: the prototype's copy sat in Supabase with row-level
// security switched off, so the figures it presented as sourced were editable
// by anyone holding the project key.

import { costProfilesSchema, regionsSchema } from "../schemas";
import regionsJson from "./regions.json";
import costProfilesJson from "./cost-profiles.json";
import type { CostProfile, Region } from "../types";

export const regions: Region[] = regionsSchema.parse(regionsJson);
export const costProfiles: CostProfile[] = costProfilesSchema.parse(costProfilesJson);

/** Regions in the order the source material presents them. */
export function listRegions(): Region[] {
  return [...regions].sort((a, b) => a.sortOrder - b.sortOrder);
}

export function findRegion(regionId: string): Region | undefined {
  return regions.find((region) => region.id === regionId);
}

/** Every segment published for a region, most complete first. */
export function profilesForRegion(regionId: string): CostProfile[] {
  return costProfiles
    .filter((profile) => profile.regionId === regionId)
    .sort((a, b) => completeness(b) - completeness(a));
}

export function findProfile(regionId: string, segment: string): CostProfile | undefined {
  return costProfiles.find(
    (profile) => profile.regionId === regionId && profile.segment === segment,
  );
}

/**
 * A crude ordering so the segment a region actually has data for is offered
 * first, rather than an empty one that makes the app look broken.
 */
function completeness(profile: CostProfile): number {
  let score = 0;
  if (profile.grossIncomeHa !== null) score += 2;
  if (profile.totalVariableCostHa !== null) score += 2;
  if (profile.yieldTHa !== null) score += 1;
  return score;
}
