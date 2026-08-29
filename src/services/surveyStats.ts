import { supabase } from "./supabaseClient";
import type { Result } from "../types";
import { SURVEY_REGIONS } from "../data/surveyLinks";

/**
 * Anonymous, aggregated response counts by region. Backed by
 * public.spudonomics_response_counts — a Postgres view that only ever exposes
 * `count(*)` grouped by region/segment, never a row. The anon key used here
 * has no SELECT grant on the underlying table at all, so there is no way for
 * this function (or anything using the same key) to read an individual
 * submission back.
 */
export interface RegionResponseCount {
  regionId: string;
  regionLabel: string;
  count: number;
}

export async function fetchResponseCountsByRegion(): Promise<Result<RegionResponseCount[]>> {
  const { data, error } = await supabase
    .from("spudonomics_response_counts")
    .select("region, segment, response_count");

  if (error) {
    return { success: false, error: "Could not load response counts right now." };
  }

  const totalsByFormValue = new Map<string, number>();
  for (const row of data ?? []) {
    totalsByFormValue.set(
      row.region,
      (totalsByFormValue.get(row.region) ?? 0) + row.response_count,
    );
  }

  const results: RegionResponseCount[] = SURVEY_REGIONS.map((region) => ({
    regionId: region.id,
    regionLabel: region.label,
    count: totalsByFormValue.get(region.formValue) ?? 0,
  }));

  return { success: true, data: results };
}

/** Total anonymous responses collected across every region and segment. */
export function totalResponses(counts: RegionResponseCount[]): number {
  return counts.reduce((sum, row) => sum + row.count, 0);
}
