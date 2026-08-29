// Mapping between the app's own region/segment identifiers and the exact
// prefill values the PotatoLink Regional Cost & Yield Survey (Google Form)
// expects.
//
// Two things about this are load-bearing and easy to break by accident:
//
// 1. The prefill query parameter name is `entry.<fieldId>`, and that fieldId
//    is NOT the `questionId` the Forms API returns from forms.get. It is a
//    separate numeric id Google assigns to the answer field itself, only
//    visible in the form's rendered page (inside the FB_PUBLIC_LOAD_DATA_
//    payload, or via Forms' own "Get pre-filled link" tool). Verified by
//    hand on 29 Aug 2026 — entry.<questionId> silently does nothing; the
//    field stays empty with no error.
// 2. The survey's Region question only accepts the four options below (its
//    own description says so) — these are deliberately the four regions in
//    the app with `dataQuality: "none"`. Do not add a region here that is
//    not also an option in the live form, or a submitted response won't
//    match anything and the rep's link will silently collect junk data.
//
// If the Region or Market segment questions are ever deleted and recreated
// in Google Forms, both fieldIds below will change and must be re-extracted
// from the live form's page source.

export interface SurveyOption {
  /** Short id used in this app's own short links, e.g. /survey/vic-central/seed */
  id: string;
  /** Human label for pickers in the app. */
  label: string;
  /** Exact text the survey expects, verified against its live options list. */
  formValue: string;
}

const SURVEY_FORM_ID = "1FAIpQLScvNn5H1mbvqCQHQ1a_kpQ7pu0VqZmbKArRItejOdWZ0phFTg";

export const SURVEY_BASE_URL = `https://docs.google.com/forms/d/e/${SURVEY_FORM_ID}/viewform`;

/** entry.<id> field ids, extracted from the live form — see note above. */
const ENTRY_IDS = {
  region: "2115047702",
  segment: "714400903",
} as const;

/** The only four regions the survey currently accepts — its priority data gaps. */
export const SURVEY_REGIONS: SurveyOption[] = [
  {
    id: "vic-central",
    label: "Victoria — Ballarat / Central",
    formValue: "Victoria - Ballarat/Central",
  },
  {
    id: "vic-gippsland",
    label: "Victoria — Gippsland / Thorpdale",
    formValue: "Victoria - Gippsland/Thorpdale",
  },
  {
    id: "vic-mallee",
    label: "Victoria — Mallee",
    formValue: "Victoria - Mallee",
  },
  {
    id: "nsw-tablelands",
    label: "NSW — Central / Southern Tablelands",
    formValue: "NSW - Central/Southern Tablelands",
  },
];

/**
 * Market segments the survey asks about. NOTE: as of 29 Aug 2026 the live
 * form's Market segment question still only lists the old, broader options
 * (Fresh/table / Processing / Seed) — updating it to these four specific
 * options is a manual edit in the Forms UI (same connector limitation as
 * multiple-choice conversion). Once updated, these formValues must match
 * the live options exactly.
 */
export const SURVEY_SEGMENTS: SurveyOption[] = [
  {
    id: "french-fry",
    label: "Processing — French fry",
    formValue: "Processing - French fry",
  },
  {
    id: "crisps",
    label: "Processing — Crisps",
    formValue: "Processing - Crisps",
  },
  {
    id: "fresh-washed-brushed",
    label: "Fresh — washed and brushed",
    formValue: "Fresh - washed and brushed",
  },
  {
    id: "seed",
    label: "Seed",
    formValue: "Seed",
  },
];

export function findSurveyRegion(id: string | undefined): SurveyOption | undefined {
  return SURVEY_REGIONS.find((option) => option.id === id);
}

export function findSurveySegment(id: string | undefined): SurveyOption | undefined {
  return SURVEY_SEGMENTS.find((option) => option.id === id);
}

/** Builds the actual Google Form URL, prefilled where a region/segment is given. */
export function buildSurveyFormUrl(regionId?: string, segmentId?: string): string {
  const params = new URLSearchParams({ usp: "pp_url" });
  const region = findSurveyRegion(regionId);
  const segment = findSurveySegment(segmentId);
  if (region) params.set(`entry.${ENTRY_IDS.region}`, region.formValue);
  if (segment) params.set(`entry.${ENTRY_IDS.segment}`, segment.formValue);
  return `${SURVEY_BASE_URL}?${params.toString()}`;
}

/**
 * Builds this app's own short redirect link for a region+segment combo, e.g.
 * ".../#/survey/vic-central/seed". Handing this to a grower instead of the
 * raw Google Form URL means the link stays short and readable, and if the
 * survey's field ids ever change, every link already given out keeps
 * working — only the mapping above needs updating.
 *
 * `origin` defaults to the current page's URL (everything before the `#`)
 * and only needs overriding in tests, where there is no `window`.
 */
export function buildShortSurveyLink(
  regionId: string,
  segmentId: string,
  origin: string = typeof window !== "undefined" ? window.location.href.split("#")[0] : "",
): string {
  return `${origin}#/survey/${regionId}/${segmentId}`;
}
