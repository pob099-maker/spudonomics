// The in-app replacement for the old external Google Form.
//
// The form used to live entirely outside this app, with a "Region" question
// that only accepted free text and listed just 4 of the 14 districts in its
// description — a real barrier to a grower actually filling it in, and the
// reason this page exists. Every question here is single-choice, every
// region and market segment the app knows about is offered, and nothing
// typed in ever needs to match a remembered string.
//
// Submissions go straight to public.spudonomics_survey_responses (see
// supabaseClient.ts) with no name, email, or IP address collected — the
// database itself only grants this app's key permission to INSERT, never to
// read a row back, so a response is anonymous even to whoever holds the key.

import { type FormEvent, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { Card, PageTitle, RadioGroup } from "../components/ui";
import { ResponseCounter } from "../components/ResponseCounter";
import {
  findSurveyRegion,
  findSurveySegment,
  SURVEY_REGIONS,
  SURVEY_SEGMENTS,
} from "../data/surveyLinks";
import { ROLE_OPTIONS, BASIS_OPTIONS, BAND_FIELDS } from "../data/surveyFields";
import { surveyResponseSchema } from "../schemas/survey";
import { submitSurveyResponse } from "../services/surveySubmission";

const textAreaClass =
  "mt-2 w-full rounded-lg border border-ink/20 bg-surface p-2 text-sm dark:border-ink-dark/20 dark:bg-surface-dark";
const textInputClass =
  "mt-2 min-h-11 w-full rounded-lg border border-ink/20 bg-surface px-3 dark:border-ink-dark/20 dark:bg-surface-dark";

interface FormValues {
  role: string;
  region: string;
  segment: string;
  season: string;
  basis: string;
  unusualNotes: string;
  otherNotes: string;
  consent: boolean;
  bands: Record<string, string>;
}

function emptyBands(): Record<string, string> {
  const bands: Record<string, string> = {};
  for (const field of BAND_FIELDS) bands[field.column] = "";
  return bands;
}

function initialValues(prefillRegion?: string, prefillSegment?: string): FormValues {
  return {
    role: "",
    region: prefillRegion ?? "",
    segment: prefillSegment ?? "",
    season: "",
    basis: "",
    unusualNotes: "",
    otherNotes: "",
    consent: false,
    bands: emptyBands(),
  };
}

/** Flattens form state into the shape surveyResponseSchema expects. */
function toSchemaInput(values: FormValues) {
  return {
    role: values.role,
    region: values.region,
    segment: values.segment,
    season: values.season,
    basis: values.basis,
    consent: values.consent,
    unusualNotes: values.unusualNotes,
    otherNotes: values.otherNotes,
    ...values.bands,
  };
}

export function ContributePage() {
  const { regionId, segmentId } = useParams<{ regionId?: string; segmentId?: string }>();
  const prefillRegion = findSurveyRegion(regionId)?.formValue;
  const prefillSegment = findSurveySegment(segmentId)?.formValue;

  const [values, setValues] = useState<FormValues>(() =>
    initialValues(prefillRegion, prefillSegment),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const isPrefilled = Boolean(prefillRegion && prefillSegment);

  function setBand(column: string, value: string) {
    setValues((prev) => ({ ...prev, bands: { ...prev.bands, [column]: value } }));
  }

  const parsedPreview = useMemo(
    () => surveyResponseSchema.safeParse(toSchemaInput(values)),
    [values],
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const parsed = surveyResponseSchema.safeParse(toSchemaInput(values));
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0];
        if (typeof key === "string" && !fieldErrors[key]) fieldErrors[key] = issue.message;
      }
      setErrors(fieldErrors);
      setStatus("error");
      setSubmitError("Please fill in every required question — see the notes below.");
      return;
    }

    setErrors({});
    setStatus("submitting");
    setSubmitError(null);
    const result = await submitSurveyResponse(parsed.data);
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setSubmitError(result.error);
    }
  }

  function submitAnother() {
    setValues(initialValues(prefillRegion, prefillSegment));
    setErrors({});
    setStatus("idle");
    setSubmitError(null);
  }

  if (status === "success") {
    return (
      <Card className="border-success/30 bg-success/5">
        <PageTitle>Thanks — that's been recorded anonymously</PageTitle>
        <p className="mt-2 text-ink/70 dark:text-ink-dark/70">
          No name, email, or identifying detail was collected with this response. It'll be
          reviewed alongside other responses before informing any published figure.
        </p>
        <button
          type="button"
          onClick={submitAnother}
          className="mt-4 min-h-11 rounded-lg bg-primary px-4 py-2 font-medium text-white dark:bg-primary-soft dark:text-ink-dark"
        >
          Submit another response
        </button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <PageTitle>Help improve these figures</PageTitle>
        <p className="mt-2 text-ink/70 dark:text-ink-dark/70">
          Every question below is pick-one. Ranges rather than exact figures, no sign-in, and
          nothing you enter can be traced back to you — this app's own key can add a response but
          can never read one back.
        </p>
        {isPrefilled ? (
          <p className="mt-2 text-sm text-primary dark:text-primary-soft">
            Pre-filled for <strong>{prefillRegion}</strong> — <strong>{prefillSegment}</strong>{" "}
            from your link. Change either below if that's not right.
          </p>
        ) : null}
      </Card>

      <Card>
        <ResponseCounter />
      </Card>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          <RadioGroup
            legend="Your role"
            name="role"
            options={ROLE_OPTIONS}
            value={values.role}
            onChange={(value) => setValues((prev) => ({ ...prev, role: value }))}
            error={errors.role}
          />

          <RadioGroup
            legend="Region you are reporting on"
            name="region"
            options={SURVEY_REGIONS.map((r) => r.formValue)}
            value={values.region}
            onChange={(value) => setValues((prev) => ({ ...prev, region: value }))}
            error={errors.region}
          />

          <RadioGroup
            legend="Market segment"
            name="segment"
            options={SURVEY_SEGMENTS.map((s) => s.formValue)}
            value={values.segment}
            onChange={(value) => setValues((prev) => ({ ...prev, segment: value }))}
            error={errors.segment}
          />

          <div>
            <label htmlFor="season" className="text-sm font-medium">
              Season/year this data reflects
            </label>
            <input
              id="season"
              type="text"
              placeholder="e.g. 2025-26"
              className={textInputClass}
              value={values.season}
              onChange={(event) => setValues((prev) => ({ ...prev, season: event.target.value }))}
            />
            {errors.season ? <p className="mt-1 text-xs text-danger">{errors.season}</p> : null}
          </div>

          <RadioGroup
            legend="Basis for your figures"
            name="basis"
            options={BASIS_OPTIONS}
            value={values.basis}
            onChange={(value) => setValues((prev) => ({ ...prev, basis: value }))}
            error={errors.basis}
          />

          {BAND_FIELDS.map((field) => (
            <RadioGroup
              key={field.column}
              legend={field.label}
              help={field.help}
              name={field.column}
              options={field.options}
              value={values.bands[field.column]}
              onChange={(value) => setBand(field.column, value)}
              error={errors[field.column]}
            />
          ))}

          <div>
            <label htmlFor="unusual-notes" className="text-sm font-medium">
              Anything unusual about this season that affected costs or yield?
            </label>
            <p className="text-xs text-ink/60 dark:text-ink-dark/60">
              Optional — e.g. drought, disease outbreak, price spike
            </p>
            <textarea
              id="unusual-notes"
              rows={3}
              className={textAreaClass}
              value={values.unusualNotes}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, unusualNotes: event.target.value }))
              }
            />
          </div>

          <div>
            <label htmlFor="other-notes" className="text-sm font-medium">
              Anything else useful for interpreting these figures?
            </label>
            <p className="text-xs text-ink/60 dark:text-ink-dark/60">Optional</p>
            <textarea
              id="other-notes"
              rows={3}
              className={textAreaClass}
              value={values.otherNotes}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, otherNotes: event.target.value }))
              }
            />
          </div>

          <label className="flex items-start gap-2 text-sm">
            <input
              type="checkbox"
              className="mt-1 size-4"
              checked={values.consent}
              onChange={(event) =>
                setValues((prev) => ({ ...prev, consent: event.target.checked }))
              }
            />
            <span>
              I consent to this anonymised, regionally-aggregated data being used in PotatoLink's
              Spudonomics tool.
            </span>
          </label>
          {errors.consent ? <p className="text-xs text-danger">{errors.consent}</p> : null}

          {submitError ? <p className="text-sm text-danger">{submitError}</p> : null}

          <button
            type="submit"
            disabled={status === "submitting"}
            className="min-h-11 rounded-lg bg-primary px-5 py-2 font-medium text-white disabled:opacity-60 dark:bg-primary-soft dark:text-ink-dark"
          >
            {status === "submitting" ? "Submitting…" : "Submit anonymously"}
          </button>
          {!parsedPreview.success && status === "idle" ? (
            <p className="text-xs text-ink/50 dark:text-ink-dark/50">
              Fill in every question above to enable submitting.
            </p>
          ) : null}
        </form>
      </Card>
    </div>
  );
}
