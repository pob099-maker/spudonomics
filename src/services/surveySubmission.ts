import { supabase } from "./supabaseClient";
import { surveyResponseSchema, type SurveyResponseInput } from "../schemas/survey";
import type { Result } from "../types";

/**
 * Submits one Contribute-form response to public.spudonomics_survey_responses.
 *
 * Validates against the same schema the form itself uses, then inserts with
 * the publishable/anon key — which the database only lets INSERT, never
 * SELECT (see the `spudonomics_survey_responses` migration). No name, email,
 * IP address, or any other identifying value is ever included: this
 * function's input type does not have a field for one.
 */
export async function submitSurveyResponse(input: SurveyResponseInput): Promise<Result<void>> {
  const parsed = surveyResponseSchema.safeParse(input);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return { success: false, error: firstIssue?.message ?? "Please check the form and try again." };
  }

  const data = parsed.data;
  const { error } = await supabase.from("spudonomics_survey_responses").insert({
    role: data.role,
    region: data.region,
    segment: data.segment,
    season: data.season,
    basis: data.basis,
    consent: data.consent,
    yield_band: data.yield_band,
    price_band: data.price_band,
    seed_cost_band: data.seed_cost_band,
    fertiliser_cost_band: data.fertiliser_cost_band,
    crop_protection_band: data.crop_protection_band,
    irrigation_band: data.irrigation_band,
    machinery_fuel_band: data.machinery_fuel_band,
    contract_ops_band: data.contract_ops_band,
    paid_labour_band: data.paid_labour_band,
    unpaid_labour_hours_band: data.unpaid_labour_hours_band,
    unpaid_labour_value_band: data.unpaid_labour_value_band,
    unusual_notes: data.unusualNotes?.length ? data.unusualNotes : null,
    other_notes: data.otherNotes?.length ? data.otherNotes : null,
  });

  if (error) {
    return {
      success: false,
      error: "Could not submit right now — check your connection and try again.",
    };
  }
  return { success: true, data: undefined };
}
