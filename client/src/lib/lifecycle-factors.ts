// Lifecycle / greenhouse-gas (GHG) emissions overlay.
//
// This is a MODELLED, INDICATIVE breakdown — not measured regional data. It
// covers two of the largest, best-documented sources of on-farm potato
// emissions (fertiliser manufacture + field losses, and machinery diesel).
// It intentionally does NOT cover crop protection, irrigation pumping
// electricity, packing, cold storage, or transport — there was no
// sufficiently reliable, citable factor for those within this iteration, and
// a fabricated number would be worse than an honest gap. Treat this as a
// "fertiliser + machinery fuel" partial footprint, not a full farm-gate LCA.
//
// All reference rates and factors below are national/industry defaults, not
// region-specific — Spudonomics doesn't yet hold region-specific nutrient
// application rates or fuel-use data. The only region-specific input to this
// model is yield (used to convert kg CO2e/ha into kg CO2e/tonne), and the
// existing practice-change scenario sliders (fertiliserPct, machineryPct),
// which are assumed to shift input volume/fuel use by the same percentage as
// the cost change they model.

export interface LifecycleFactor {
  value: number;
  unit: string;
  label: string;
  sourceLabel: string;
  sourceUrl: string;
}

// ---------------------------------------------------------------------------
// Reference Australian potato nutrient program (kg/ha) — midpoints of the
// published Australian light/sandy-soil recommendation range.
// ---------------------------------------------------------------------------
export const REFERENCE_NUTRIENT_RATES: Record<"N" | "P2O5" | "K2O", LifecycleFactor> = {
  N: {
    value: 200,
    unit: "kg N/ha",
    label: "Nitrogen (N) — Australian reference rate",
    sourceLabel: "Haifa Group — Potato Nutritional Guide (Australia, light soils)",
    sourceUrl: "https://www.haifa-group.com/files/Guides/Potato.pdf",
  },
  P2O5: {
    value: 190,
    unit: "kg P2O5/ha",
    label: "Phosphate (P2O5) — Australian reference rate",
    sourceLabel: "Haifa Group — Potato Nutritional Guide (Australia, light soils)",
    sourceUrl: "https://www.haifa-group.com/files/Guides/Potato.pdf",
  },
  K2O: {
    value: 210,
    unit: "kg K2O/ha",
    label: "Potash (K2O) — Australian reference rate",
    sourceLabel: "Haifa Group — Potato Nutritional Guide (Australia, light soils)",
    sourceUrl: "https://www.haifa-group.com/files/Guides/Potato.pdf",
  },
};

// ---------------------------------------------------------------------------
// Nitrogen lifecycle emission factor — three cited components, summed.
// Basis: urea (the dominant N source in Australian potato programs).
// ---------------------------------------------------------------------------
export const N_EMISSION_COMPONENTS: LifecycleFactor[] = [
  {
    value: 1.9,
    unit: "kg CO2e/kg N",
    label: "Manufacture (urea production, factory emissions)",
    sourceLabel: "Agriland.ie — \"Taking the carbon out of nitrogen fertiliser\" (2025)",
    sourceUrl: "https://www.agriland.ie/farming-news/taking-the-carbon-out-of-nitrogen-fertiliser/",
  },
  {
    value: 1.6,
    unit: "kg CO2e/kg N",
    label: "Urea hydrolysis (CO2 released from urea on application)",
    sourceLabel: "Agriland.ie — \"Taking the carbon out of nitrogen fertiliser\" (2025)",
    sourceUrl: "https://www.agriland.ie/farming-news/taking-the-carbon-out-of-nitrogen-fertiliser/",
  },
  {
    value: 4.69,
    unit: "kg CO2e/kg N",
    label: "Direct field N2O emissions (IPCC Tier 1: 1% of applied N as N2O-N, x44/28, x298 GWP100)",
    sourceLabel: "IPCC 2006 Guidelines, Vol. 4 Ch. 11 (N2O from Managed Soils)",
    sourceUrl: "https://www.ipcc-nggip.iges.or.jp/public/2006gl/pdf/4_Volume4/V4_11_Ch11_N2O&CO2.pdf",
  },
];

export const N_FACTOR_TOTAL = N_EMISSION_COMPONENTS.reduce((s, c) => s + c.value, 0); // ~8.19 kg CO2e/kg N

export const P2O5_FACTOR: LifecycleFactor = {
  value: 0.85,
  unit: "kg CO2e/kg P2O5",
  label: "Phosphate fertiliser manufacture",
  sourceLabel: "FAO/AGRIS — LCA of energy consumption and CO2 emissions in fertiliser production",
  sourceUrl: "https://agris.fao.org/search/en/providers/122558/records/647242a353aa8c896303b977",
};

export const K2O_FACTOR: LifecycleFactor = {
  value: 0.25,
  unit: "kg CO2e/kg K2O",
  label: "Potash fertiliser manufacture (muriate of potash)",
  sourceLabel: "4C Services — List of Emission Factors (2025)",
  sourceUrl: "https://www.4c-services.org/wp-content/uploads/2025/10/4C-List-of-Emission-Factors-1.pdf",
};

// ---------------------------------------------------------------------------
// Machinery diesel — reference fuel use per hectare, summed across the major
// field operations in a potato program (ploughing, cultivation, power
// harrowing, fertiliser spreading, planting, spraying, towing, harvesting).
// Excludes irrigation pumping and post-harvest transport/drying.
// ---------------------------------------------------------------------------
export const REFERENCE_DIESEL_USE: LifecycleFactor = {
  value: 153.5,
  unit: "L diesel/ha",
  label: "Machinery diesel use (field operations, reference)",
  sourceLabel: "SEFARI Scotland — Roadmap to reducing GHG emissions from the Scottish potato crop",
  sourceUrl:
    "https://sefari.scot/sites/default/files/documents/Sefari%20SAG%20Report%20Reducing%20GHG%20Emissions%20from%20Scottish%20Potato%20Crop.pdf",
};

export const DIESEL_EMISSION_FACTOR: LifecycleFactor = {
  value: 2.71,
  unit: "kg CO2e/L",
  label: "Diesel combustion (Scope 1)",
  sourceLabel: "Australian National Greenhouse Accounts (NGA) Factors 2025",
  sourceUrl: "https://www.netnada.com/emission-factors",
};

export interface LifecycleEmissions {
  fertiliserKgHa: number;
  machineryKgHa: number;
  totalKgHa: number;
  totalKgPerTonne: number | null;
  nComponentKgHa: number;
  pComponentKgHa: number;
  kComponentKgHa: number;
}

// Reference (unscaled) fertiliser + machinery emissions, kg CO2e/ha.
export const REFERENCE_FERTILISER_KG_HA =
  REFERENCE_NUTRIENT_RATES.N.value * N_FACTOR_TOTAL +
  REFERENCE_NUTRIENT_RATES.P2O5.value * P2O5_FACTOR.value +
  REFERENCE_NUTRIENT_RATES.K2O.value * K2O_FACTOR.value;

export const REFERENCE_MACHINERY_KG_HA = REFERENCE_DIESEL_USE.value * DIESEL_EMISSION_FACTOR.value;

// Scales each nutrient's reference application rate by its own practice-change
// scenario slider (nitrogenPct / phosphorusPct / potassiumPct), so a shift in
// fertiliser *type/mix* -- not just overall fertiliser spend -- shows up here.
// Uses the region's own applied kg/ha rate when known (nKgHa/pKgHa/kKgHa from
// that region's cost-profile breakdown); falls back to the flat national
// reference rate otherwise. machineryPct still scales diesel use 1:1 with its
// cost slider (a simplification, disclosed in the UI). Converts to per-tonne
// using the region's own baseline yield.
export function computeLifecycleEmissions(params: {
  nitrogenPct?: number;
  phosphorusPct?: number;
  potassiumPct?: number;
  machineryPct?: number;
  yieldTHa?: number | null;
  nKgHa?: number | null;
  pKgHa?: number | null;
  kKgHa?: number | null;
}): LifecycleEmissions {
  const {
    nitrogenPct = 0,
    phosphorusPct = 0,
    potassiumPct = 0,
    machineryPct = 0,
    yieldTHa,
    nKgHa,
    pKgHa,
    kKgHa,
  } = params;

  const nBaseKgHa = nKgHa ?? REFERENCE_NUTRIENT_RATES.N.value;
  const pBaseKgHa = pKgHa ?? REFERENCE_NUTRIENT_RATES.P2O5.value;
  const kBaseKgHa = kKgHa ?? REFERENCE_NUTRIENT_RATES.K2O.value;

  const nComponentKgHa = nBaseKgHa * (1 + nitrogenPct / 100) * N_FACTOR_TOTAL;
  const pComponentKgHa = pBaseKgHa * (1 + phosphorusPct / 100) * P2O5_FACTOR.value;
  const kComponentKgHa = kBaseKgHa * (1 + potassiumPct / 100) * K2O_FACTOR.value;

  const fertiliserKgHa = nComponentKgHa + pComponentKgHa + kComponentKgHa;
  const machineryKgHa = REFERENCE_MACHINERY_KG_HA * (1 + machineryPct / 100);
  const totalKgHa = fertiliserKgHa + machineryKgHa;
  const totalKgPerTonne = yieldTHa && yieldTHa > 0 ? totalKgHa / yieldTHa : null;

  return {
    fertiliserKgHa,
    machineryKgHa,
    totalKgHa,
    totalKgPerTonne,
    nComponentKgHa,
    pComponentKgHa,
    kComponentKgHa,
  };
}
