// Shows how many anonymous survey responses have been collected so far, by
// region. Backed entirely by public.spudonomics_response_counts — a Postgres view
// that only ever returns a count grouped by region/segment, never a row —
// so this component cannot show, and this app's key cannot fetch, any
// individual submission's contents.

import { useEffect, useState } from "react";
import {
  fetchResponseCountsByRegion,
  totalResponses,
  type RegionResponseCount,
} from "../services/surveyStats";

export function ResponseCounter() {
  const [counts, setCounts] = useState<RegionResponseCount[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchResponseCountsByRegion().then((result) => {
      if (cancelled) return;
      if (result.success) {
        setCounts(result.data);
      } else {
        setFailed(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (failed) return null;
  if (!counts) {
    return <p className="text-sm text-ink/50 dark:text-ink-dark/50">Loading response counts…</p>;
  }

  const total = totalResponses(counts);

  return (
    <div>
      <p className="text-sm font-medium">
        {total} anonymous response{total === 1 ? "" : "s"} collected so far
      </p>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {counts.map((row) => (
          <div
            key={row.regionId}
            className="flex items-center justify-between rounded-lg bg-paper px-2 py-1 text-xs dark:bg-paper-dark"
          >
            <span className="truncate pr-1" title={row.regionLabel}>
              {row.regionLabel}
            </span>
            <span className="font-medium tabular-nums">{row.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
