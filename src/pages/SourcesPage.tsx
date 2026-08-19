// Every figure in the app and where it came from — including the regions where
// the honest answer is that nothing has been published.

import { useMemo } from "react";
import { listRegions, profilesForRegion } from "../data";
import { money } from "../services/format";
import { baselineMargin } from "../services/grossMargin";
import { Card, PageTitle, QualityPill } from "../components/ui";

export function SourcesPage() {
  const regions = useMemo(() => listRegions(), []);

  return (
    <div className="space-y-4">
      <div>
        <PageTitle>Data sources</PageTitle>
        <p className="mt-1 text-ink/60 dark:text-ink-dark/60">
          Australian potato economics is thin and patchy in the public domain. This lists
          what exists, what is standing in for something else, and where there is nothing at
          all — because a gap you can see is more useful than a number you cannot trust.
        </p>
      </div>

      {regions.map((region) => (
        <Card key={region.id}>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-lg font-bold">{region.name}</h2>
            <QualityPill quality={region.dataQuality} />
          </div>
          <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">{region.summary}</p>

          <ul className="mt-3 divide-y divide-ink/10 text-sm dark:divide-ink-dark/10">
            {profilesForRegion(region.id).map((profile) => {
              const result = baselineMargin(profile);
              return (
                <li key={profile.segment} className="py-2">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-medium">{profile.segmentLabel}</span>
                    <span className="tabular-nums text-ink/60 dark:text-ink-dark/60">
                      {result.marginHa === null
                        ? "no margin published"
                        : `${money(result.marginHa)}/ha margin`}
                    </span>
                    {profile.sourceYear ? (
                      <span className="text-ink/50 dark:text-ink-dark/50">
                        {profile.sourceYear}
                      </span>
                    ) : null}
                  </div>
                  {profile.sourceUrl ? (
                    <a
                      href={profile.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary underline dark:text-primary-soft"
                    >
                      {profile.sourceName}
                    </a>
                  ) : (
                    <span className="text-ink/50 dark:text-ink-dark/50">
                      Nothing published for this segment.
                    </span>
                  )}
                  {profile.notes ? (
                    <p className="mt-1 text-xs text-ink/60 dark:text-ink-dark/60">
                      {profile.notes}
                    </p>
                  ) : null}
                </li>
              );
            })}
          </ul>
        </Card>
      ))}
    </div>
  );
}
