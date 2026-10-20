import { describe, expect, it } from "vitest";
import { surveyResponseSchema } from "./survey";
import { SURVEY_REGIONS, SURVEY_SEGMENTS } from "../data/surveyLinks";
import { BAND_FIELDS, ROLE_OPTIONS, BASIS_OPTIONS } from "../data/surveyFields";

function validInput() {
  const bands = Object.fromEntries(BAND_FIELDS.map((f) => [f.column, f.options[0]]));
  return {
    role: ROLE_OPTIONS[0],
    region: SURVEY_REGIONS[0].formValue,
    segment: SURVEY_SEGMENTS[0].formValue,
    season: "2025-26",
    basis: BASIS_OPTIONS[0],
    consent: true,
    unusualNotes: "",
    otherNotes: "",
    ...bands,
  };
}

describe("surveyResponseSchema", () => {
  it("accepts a fully-filled, valid submission", () => {
    const result = surveyResponseSchema.safeParse(validInput());
    expect(result.success).toBe(true);
  });

  it("rejects a region string that is not one of the app's 14 districts", () => {
    const result = surveyResponseSchema.safeParse({ ...validInput(), region: "Nowhere" });
    expect(result.success).toBe(false);
  });

  it("rejects when consent is not explicitly true", () => {
    const result = surveyResponseSchema.safeParse({ ...validInput(), consent: false });
    expect(result.success).toBe(false);
  });

  it("rejects a blank season", () => {
    const result = surveyResponseSchema.safeParse({ ...validInput(), season: "" });
    expect(result.success).toBe(false);
  });

  it("requires every banded cost/yield question to be answered", () => {
    for (const field of BAND_FIELDS) {
      const input = validInput() as Record<string, unknown>;
      input[field.column] = "";
      const result = surveyResponseSchema.safeParse(input);
      expect(result.success, field.column).toBe(false);
    }
  });

  it("rejects a band value that is not in that question's allowed list", () => {
    const input = { ...validInput(), yield_band: "Under 5" };
    const result = surveyResponseSchema.safeParse(input);
    expect(result.success).toBe(false);
  });
});
