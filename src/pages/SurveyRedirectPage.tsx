// The landing point for short, shareable survey links like
// /#/survey/vic-central/seed — handed out by reps instead of a long Google
// Form URL full of internal field ids. This page just resolves the two path
// segments to the real prefilled Google Form URL and sends the browser
// straight there.

import { useEffect } from "react";
import { useParams } from "react-router-dom";
import {
  buildSurveyFormUrl,
  findSurveyRegion,
  findSurveySegment,
} from "../data/surveyLinks";
import { Card, PageTitle } from "../components/ui";

export function SurveyRedirectPage() {
  const { regionId, segmentId } = useParams<{ regionId: string; segmentId: string }>();
  const region = findSurveyRegion(regionId);
  const segment = findSurveySegment(segmentId);
  const isRecognised = Boolean(region && segment);
  const targetUrl = isRecognised ? buildSurveyFormUrl(regionId, segmentId) : buildSurveyFormUrl();

  useEffect(() => {
    // A brief delay keeps the "Taking you to the survey" message from just
    // flashing past on a fast connection — the redirect itself still fires
    // as soon as the page loads.
    window.location.replace(targetUrl);
  }, [targetUrl]);

  return (
    <Card>
      <PageTitle>
        {isRecognised ? "Taking you to the survey…" : "Link not recognised"}
      </PageTitle>
      <p className="mt-1 text-ink/70 dark:text-ink-dark/70">
        {isRecognised ? (
          <>
            Redirecting to the PotatoLink survey for <strong>{region?.label}</strong> —{" "}
            <strong>{segment?.label}</strong>. If nothing happens, use the link below.
          </>
        ) : (
          <>
            This link&apos;s region or market segment was not recognised, so here is the
            general survey instead.
          </>
        )}
      </p>
      <a
        href={targetUrl}
        target="_blank"
        rel="noreferrer"
        className="mt-3 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 py-2 font-medium text-white dark:bg-primary-soft dark:text-ink-dark"
      >
        Open the survey
      </a>
    </Card>
  );
}
