import { createClient } from "@supabase/supabase-js";

// Backs the "Contribute" survey (see ContributePage). Deliberately public
// values: this is a publishable/anon key, not a secret — the actual access
// control lives in Postgres row-level security (see the
// `spudonomics_survey_responses_to_public_schema` migration), which only lets this key INSERT
// into public.spudonomics_survey_responses and SELECT the aggregated
// public.spudonomics_response_counts view. It can never read back an individual
// submission, which is what keeps every response anonymous even to whoever
// holds this key.
//
// Overridable via VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (set in
// .github/workflows/deploy.yml and optionally a local .env.local) so a fork
// or a local dev instance can point at a different project without editing
// source.
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "https://wqyjpgjztaiigyjijdxt.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ?? "sb_publishable_68329GCd2IUzuMn9hcjq6w_SqSrKR8I";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});
