// A shareable, anonymous route back into the dataset.
//
// The gaps this app shows are only ever fixed by someone sending real numbers
// back. Regional reps are the people best placed to ask for that face to
// face, so this card exists to give them one link they can hand a grower on
// the spot — copyable, no sign-in, and never asking for a name or email.
//
// As of 29 Aug 2026 this points at the app's own Contribute page rather than
// an external Google Form: the form used to only accept free text for
// region/segment and could only be edited by hand in the Forms UI, so it
// listed a handful of districts and nothing enforced a match. The in-app
// form offers every region and segment as pick-one options and writes
// straight to public.spudonomics_survey_responses (see supabaseClient.ts) — no
// name, email, or IP address is ever collected or stored.
//
// Picking a region and market segment swaps the link for this app's own
// short redirect (e.g. .../#/survey/vic-central/seed) which lands the
// grower straight on the Contribute form already showing their region and
// segment selected — one less thing for them to pick, and one less chance of
// a mismatch between what a rep meant to send and what actually got
// submitted.

import { useMemo, useState } from "react";
import { Card } from "./ui";
import { buildShortSurveyLink, SURVEY_REGIONS, SURVEY_SEGMENTS } from "../data/surveyLinks";

const selectClass =
  "min-h-11 w-full rounded-lg border border-ink/20 bg-surface px-3 dark:border-ink-dark/20 dark:bg-surface-dark";

function buildContributeLink(regionId: string, segmentId: string): string {
  if (regionId && segmentId) return buildShortSurveyLink(regionId, segmentId);
  const origin = typeof window !== "undefined" ? window.location.href.split("#")[0] : "";
  return `${origin}#/contribute`;
}

export function ContributeCard() {
  const [regionId, setRegionId] = useState<string>("");
  const [segmentId, setSegmentId] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const isSpecific = Boolean(regionId && segmentId);
  const surveyUrl = useMemo(
    () => buildContributeLink(regionId, segmentId),
    [regionId, segmentId],
  );

  async function copyLink(): Promise<void> {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Clipboard access can be blocked by browser policy on some tablets —
      // the plain URL below still works when the button does not.
      setCopied(false);
    }
  }

  return (
    <Card className="border-primary/30 bg-primary/5 dark:border-primary-soft/30 dark:bg-primary/10">
      <h2 className="font-display text-lg font-bold">Help improve these figures</h2>
      <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">
        Every figure on this site is only as good as what has been published — and for some
        regions that means one budget from one season, not a trend. If you grow, advise on, or
        handle potatoes commercially, two minutes on the survey below helps either close a gap
        or firm up a figure that's only ever had one source. It asks for banded ranges rather
        than exact figures, never asks for a name or email address, and nothing you enter can be
        traced back to you.
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="survey-region" className="mb-1 block text-sm font-medium">
            Region (optional — pre-fills the link)
          </label>
          <select
            id="survey-region"
            className={selectClass}
            value={regionId}
            onChange={(event) => setRegionId(event.target.value)}
          >
            <option value="">Any region</option>
            {SURVEY_REGIONS.map((region) => (
              <option key={region.id} value={region.id}>
                {region.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="survey-segment" className="mb-1 block text-sm font-medium">
            Market segment (optional — pre-fills the link)
          </label>
          <select
            id="survey-segment"
            className={selectClass}
            value={segmentId}
            onChange={(event) => setSegmentId(event.target.value)}
          >
            <option value="">Any segment</option>
            {SURVEY_SEGMENTS.map((segment) => (
              <option key={segment.id} value={segment.id}>
                {segment.label}
              </option>
            ))}
          </select>
        </div>
      </div>
      {regionId && !segmentId ? (
        <p className="mt-2 text-xs text-ink/50 dark:text-ink-dark/50">
          Pick a market segment too to get a link pre-filled for both.
        </p>
      ) : null}
      {segmentId && !regionId ? (
        <p className="mt-2 text-xs text-ink/50 dark:text-ink-dark/50">
          Pick a region too to get a link pre-filled for both.
        </p>
      ) : null}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <a
          href={isSpecific ? surveyUrl : "#/contribute"}
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 font-medium text-white dark:bg-primary-soft dark:text-ink-dark"
        >
          Open the anonymous survey
        </a>
        <button
          type="button"
          onClick={copyLink}
          className="min-h-11 rounded-lg border border-ink/20 px-3 text-sm font-medium dark:border-ink-dark/20"
        >
          {copied ? "Link copied" : "Copy link to share"}
        </button>
      </div>
      <p className="mt-2 break-all text-xs text-ink/50 dark:text-ink-dark/50">{surveyUrl}</p>
    </Card>
  );
}
