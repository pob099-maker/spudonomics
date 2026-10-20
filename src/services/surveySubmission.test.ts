import { describe, expect, it, vi, beforeEach } from "vitest";
import { BAND_FIELDS, ROLE_OPTIONS, BASIS_OPTIONS } from "../data/surveyFields";
import { SURVEY_REGIONS, SURVEY_SEGMENTS } from "../data/surveyLinks";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("./supabaseClient", () => ({
  supabase: { from: fromMock },
}));

// Imported after the mock so the module under test picks up the mocked client.
const { submitSurveyResponse } = await import("./surveySubmission");

function validInput() {
  const bands = Object.fromEntries(BAND_FIELDS.map((f) => [f.column, f.options[0]]));
  return {
    role: ROLE_OPTIONS[0],
    region: SURVEY_REGIONS[0].formValue,
    segment: SURVEY_SEGMENTS[0].formValue,
    season: "2025-26",
    basis: BASIS_OPTIONS[0],
    consent: true as const,
    unusualNotes: "",
    otherNotes: "",
    ...bands,
  };
}

describe("submitSurveyResponse", () => {
  beforeEach(() => {
    insertMock.mockReset();
    fromMock.mockClear();
  });

  it("rejects an invalid payload before ever calling the database", async () => {
    const result = await submitSurveyResponse({ ...validInput(), consent: false as unknown as true });
    expect(result.success).toBe(false);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it("inserts into spudonomics_survey_responses and never includes any identifying field", async () => {
    insertMock.mockResolvedValue({ error: null });
    const result = await submitSurveyResponse(validInput());

    expect(result.success).toBe(true);
    expect(fromMock).toHaveBeenCalledWith("spudonomics_survey_responses");
    const insertedRow = insertMock.mock.calls[0][0] as Record<string, unknown>;
    for (const forbiddenKey of ["email", "name", "ip", "ip_address", "user_id"]) {
      expect(insertedRow).not.toHaveProperty(forbiddenKey);
    }
    expect(insertedRow.region).toBe(SURVEY_REGIONS[0].formValue);
  });

  it("returns a friendly error and keeps the response anonymous even when the insert fails", async () => {
    insertMock.mockResolvedValue({ error: { message: "network down" } });
    const result = await submitSurveyResponse(validInput());
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).not.toContain("network down");
    }
  });
});
