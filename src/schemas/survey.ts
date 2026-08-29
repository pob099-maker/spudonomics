import { z } from "zod";
import { ROLE_OPTIONS, BASIS_OPTIONS, BAND_FIELDS } from "../data/surveyFields";
import { SURVEY_REGIONS, SURVEY_SEGMENTS } from "../data/surveyLinks";

// Validates a Contribute-form submission before it ever reaches the
// database. The database's own CHECK constraints are the real backstop —
// this just gives a person filling in the form a useful inline message
// instead of a raw Postgres error if something is missing.

const REGION_VALUES = SURVEY_REGIONS.map((r) => r.formValue) as [string, ...string[]];
const SEGMENT_VALUES = SURVEY_SEGMENTS.map((s) => s.formValue) as [string, ...string[]];

const bandShape = Object.fromEntries(
  BAND_FIELDS.map((field) => [
    field.column,
    z.enum(field.options as [string, ...string[]], {
      errorMap: () => ({ message: `Pick an option for "${field.label}".` }),
    }),
  ]),
);

export const surveyResponseSchema = z
  .object({
    role: z.enum(ROLE_OPTIONS, { errorMap: () => ({ message: "Pick your role." }) }),
    region: z.enum(REGION_VALUES, { errorMap: () => ({ message: "Pick a region." }) }),
    segment: z.enum(SEGMENT_VALUES, { errorMap: () => ({ message: "Pick a market segment." }) }),
    season: z
      .string()
      .trim()
      .min(1, "Enter the season/year this data reflects, e.g. \"2025-26\"."),
    basis: z.enum(BASIS_OPTIONS, { errorMap: () => ({ message: "Pick a basis for your figures." }) }),
    consent: z.literal(true, {
      errorMap: () => ({ message: "You must consent for this data to be used before submitting." }),
    }),
    unusualNotes: z.string().trim().optional(),
    otherNotes: z.string().trim().optional(),
  })
  .extend(bandShape as z.ZodRawShape);

export type SurveyResponseInput = z.infer<typeof surveyResponseSchema>;
