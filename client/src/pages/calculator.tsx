import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Region, CostProfile } from "@shared/schema";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { DataQualityBadge } from "@/components/data-quality-badge";
import { SourcePanel } from "@/components/source-panel";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiRequest } from "@/lib/queryClient";
import {
  ZERO_SCENARIO,
  SCENARIO_SLIDERS,
  SCENARIO_PRESETS,
  type ScenarioState,
} from "@/lib/scenario-presets";
import {
  computeLifecycleEmissions,
  REFERENCE_NUTRIENT_RATES,
  N_FACTOR_TOTAL,
  N_EMISSION_COMPONENTS,
  P2O5_FACTOR,
  K2O_FACTOR,
  REFERENCE_DIESEL_USE,
  DIESEL_EMISSION_FACTOR,
} from "@/lib/lifecycle-factors";
import { RotateCcw, TriangleAlert, Droplets, Calculator as CalculatorIcon, Sprout, ExternalLink, Leaf, Pencil } from "lucide-react";

type FieldKey =
  | "yieldTHa"
  | "priceT"
  | "grossRevenueHa"
  | "seedCostHa"
  | "fertiliserCostHa"
  | "cropProtectionCostHa"
  | "irrigationCostHa"
  | "machineryCostHa"
  | "contractCostHa"
  | "labourCostHa"
  | "postHarvestCostHa"
  | "overheadPct";

type FormState = Record<FieldKey, number>;

const FIELD_GROUPS: { title: string; fields: { key: FieldKey; label: string; unit: string }[] }[] = [
  {
    title: "Market & pricing",
    fields: [
      { key: "yieldTHa", label: "Yield", unit: "t/ha" },
      { key: "priceT", label: "Target price", unit: "$/t" },
      { key: "grossRevenueHa", label: "Gross revenue", unit: "$/ha" },
    ],
  },
  {
    title: "Agronomic inputs",
    fields: [
      { key: "seedCostHa", label: "Seed", unit: "$/ha" },
      { key: "fertiliserCostHa", label: "Fertiliser", unit: "$/ha" },
      { key: "cropProtectionCostHa", label: "Crop protection", unit: "$/ha" },
      { key: "irrigationCostHa", label: "Irrigation energy", unit: "$/ha" },
    ],
  },
  {
    title: "Machinery, contract & labour",
    fields: [
      { key: "machineryCostHa", label: "Machinery & fuel", unit: "$/ha" },
      { key: "contractCostHa", label: "Contract operations", unit: "$/ha" },
      { key: "labourCostHa", label: "Field labour", unit: "$/ha" },
    ],
  },
  {
    title: "Post-harvest & overheads",
    fields: [
      { key: "postHarvestCostHa", label: "Post-harvest / freight / packaging", unit: "$/ha" },
      { key: "overheadPct", label: "Overheads & levies", unit: "% of revenue" },
    ],
  },
];

// Fallback chain for the default Gross revenue figure, in priority order:
// 1. The source's directly-published gross income (most trustworthy — handles
//    multi-grade/bag pricing that a single yield x price can't represent).
// 2. totalVariableCostHa + grossMarginHa, when both are published (also exact).
// 3. yieldTHa x priceT, only when both are known single-rate figures.
// 4. grossMarginHa alone, as a last resort (implies $0 cost — flagged in the UI).
function deriveGrossRevenue(profile: CostProfile): number {
  if (profile.grossIncomeHa != null) return profile.grossIncomeHa;
  if (profile.totalVariableCostHa != null && profile.grossMarginHa != null) {
    return profile.totalVariableCostHa + profile.grossMarginHa;
  }
  if (profile.yieldTHa != null && profile.priceT != null) {
    return profile.yieldTHa * profile.priceT;
  }
  return profile.grossMarginHa ?? 0;
}

function hasNoCostBreakdown(profile: CostProfile): boolean {
  const itemized = [
    profile.seedCostHa,
    profile.fertiliserCostHa,
    profile.cropProtectionCostHa,
    profile.irrigationCostHa,
    profile.machineryCostHa,
    profile.contractCostHa,
    profile.labourCostHa,
    profile.postHarvestCostHa,
  ];
  return itemized.every((v) => v == null) && profile.totalVariableCostHa == null;
}

function toFormState(profile: CostProfile): FormState {
  return {
    yieldTHa: profile.yieldTHa ?? 0,
    priceT: profile.priceT ?? 0,
    grossRevenueHa: deriveGrossRevenue(profile),
    seedCostHa: profile.seedCostHa ?? 0,
    fertiliserCostHa: profile.fertiliserCostHa ?? 0,
    cropProtectionCostHa: profile.cropProtectionCostHa ?? 0,
    irrigationCostHa: profile.irrigationCostHa ?? 0,
    machineryCostHa: profile.machineryCostHa ?? 0,
    contractCostHa: profile.contractCostHa ?? 0,
    labourCostHa: profile.labourCostHa ?? 0,
    postHarvestCostHa: profile.postHarvestCostHa ?? 0,
    overheadPct: profile.overheadPct ?? 0,
  };
}

interface MarginResults {
  grossRevenueHa: number;
  totalVariableCostHa: number;
  netGrossMarginHa: number;
  marginPerTonne: number | null;
  breakevenYield: number | null;
  breakevenPrice: number | null;
}

function computeMargin(v: FormState): MarginResults {
  const grossRevenueHa = v.grossRevenueHa;
  const inputCostHa =
    v.seedCostHa +
    v.fertiliserCostHa +
    v.cropProtectionCostHa +
    v.irrigationCostHa +
    v.machineryCostHa +
    v.contractCostHa +
    v.labourCostHa +
    v.postHarvestCostHa;
  const overheadHa = grossRevenueHa * (v.overheadPct / 100);
  const totalVariableCostHa = inputCostHa + overheadHa;
  const netGrossMarginHa = grossRevenueHa - totalVariableCostHa;
  const marginPerTonne = v.yieldTHa > 0 ? netGrossMarginHa / v.yieldTHa : null;
  const breakevenYield = v.priceT > 0 ? totalVariableCostHa / v.priceT : null;
  const breakevenPrice = v.yieldTHa > 0 ? totalVariableCostHa / v.yieldTHa : null;
  return { grossRevenueHa, totalVariableCostHa, netGrossMarginHa, marginPerTonne, breakevenYield, breakevenPrice };
}

// Applies a scenario's percentage deltas to the region's baseline (never to
// whatever the user has manually typed into the calculator inputs), so the
// scenario comparison always reads against the published standard.
function applyScenario(baseline: FormState, scenario: ScenarioState): FormState {
  const yieldTHa = baseline.yieldTHa * (1 + scenario.yieldPct / 100);
  const priceT = baseline.priceT * (1 + scenario.pricePct / 100);
  const grossRevenueHa =
    baseline.grossRevenueHa * (1 + scenario.yieldPct / 100) * (1 + scenario.pricePct / 100);
  return {
    ...baseline,
    yieldTHa,
    priceT,
    grossRevenueHa,
    fertiliserCostHa: baseline.fertiliserCostHa * (1 + scenario.fertiliserPct / 100),
    cropProtectionCostHa: baseline.cropProtectionCostHa * (1 + scenario.cropProtectionPct / 100),
    irrigationCostHa: baseline.irrigationCostHa * (1 + scenario.irrigationPct / 100),
    machineryCostHa: baseline.machineryCostHa * (1 + scenario.machineryPct / 100),
    labourCostHa: baseline.labourCostHa * (1 + scenario.labourPct / 100),
  };
}

export default function Calculator() {
  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({
    queryKey: ["/api/regions"],
  });

  const [regionId, setRegionId] = useState<string | undefined>(undefined);

  useEffect(() => {
    if (!regionId && regions && regions.length > 0) {
      setRegionId(regions[0].id);
    }
  }, [regions, regionId]);

  const { data: profiles, isLoading: profilesLoading } = useQuery<CostProfile[]>({
    queryKey: ["/api/cost-profiles", regionId],
    queryFn: async () => {
      const res = await apiRequest("GET", `/api/cost-profiles?regionId=${regionId}`);
      return res.json();
    },
    enabled: !!regionId,
  });

  const [profileId, setProfileId] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (profiles && profiles.length > 0) {
      setProfileId(profiles[0].id);
    } else {
      setProfileId(undefined);
    }
  }, [profiles]);

  const selectedProfile = useMemo(
    () => profiles?.find((p) => p.id === profileId),
    [profiles, profileId]
  );

  const [form, setForm] = useState<FormState | null>(null);
  const [scenario, setScenario] = useState<ScenarioState>(ZERO_SCENARIO);

  useEffect(() => {
    if (selectedProfile) {
      setForm(toFormState(selectedProfile));
      setScenario(ZERO_SCENARIO);
    }
  }, [selectedProfile]);

  const region = regions?.find((r) => r.id === regionId);

  const results = useMemo(() => (form ? computeMargin(form) : null), [form]);

  const baselineForm = useMemo(
    () => (selectedProfile ? toFormState(selectedProfile) : null),
    [selectedProfile]
  );
  const scenarioForm = useMemo(
    () => (baselineForm ? applyScenario(baselineForm, scenario) : null),
    [baselineForm, scenario]
  );
  const baselineResults = useMemo(
    () => (baselineForm ? computeMargin(baselineForm) : null),
    [baselineForm]
  );
  const scenarioResults = useMemo(
    () => (scenarioForm ? computeMargin(scenarioForm) : null),
    [scenarioForm]
  );
  const hasActiveScenario = Object.values(scenario).some((v) => v !== 0);

  // Lifecycle / GHG overlay — indicative fertiliser + machinery-diesel footprint.
  // Main results card: no scenario adjustment (scale = 0%), yield taken from
  // whatever is currently in the editable form.
  const lifecycleResults = useMemo(
    () => (form ? computeLifecycleEmissions(0, 0, form.yieldTHa) : null),
    [form]
  );
  // Scenario table: baseline uses the region's published yield; scenario uses
  // the scenario's fertiliserPct/machineryPct sliders plus its adjusted yield.
  const baselineLifecycle = useMemo(
    () => (baselineForm ? computeLifecycleEmissions(0, 0, baselineForm.yieldTHa) : null),
    [baselineForm]
  );
  const scenarioLifecycle = useMemo(
    () =>
      scenarioForm
        ? computeLifecycleEmissions(scenario.fertiliserPct, scenario.machineryPct, scenarioForm.yieldTHa)
        : null,
    [scenarioForm, scenario.fertiliserPct, scenario.machineryPct]
  );

  const applyPreset = (presetId: string) => {
    const preset = SCENARIO_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setScenario((prev) => ({ ...prev, ...preset.deltas }));
  };

  const isNoData = region?.dataQuality === "none";
  const isEstimate = region?.dataQuality === "estimate";
  const noCostBreakdown = !!selectedProfile && hasNoCostBreakdown(selectedProfile);

  if (regionsLoading) {
    return (
      <div className="p-6 space-y-4 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold" data-testid="text-page-title">
          Potato Gross Margin Analyzer
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Pick a region and market segment to load real, source-cited baseline costs, then adjust any field
          to model your own operation.
        </p>
      </div>

      <Card>
        <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="select-region">Region</Label>
            <Select value={regionId} onValueChange={setRegionId}>
              <SelectTrigger id="select-region" data-testid="select-region">
                <SelectValue placeholder="Choose a region" />
              </SelectTrigger>
              <SelectContent>
                {["Tasmania", "New South Wales", "South Australia", "Western Australia", "Victoria", "Queensland"].map(
                  (state) => {
                    const stateRegions = regions?.filter((r) => r.state === state) ?? [];
                    if (stateRegions.length === 0) return null;
                    return (
                      <SelectGroup key={state}>
                        <SelectLabel>{state}</SelectLabel>
                        {stateRegions.map((r) => (
                          <SelectItem key={r.id} value={r.id} data-testid={`option-region-${r.id}`}>
                            {r.name}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    );
                  }
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="select-segment">Market segment</Label>
            <Select
              value={profileId?.toString()}
              onValueChange={(v) => setProfileId(Number(v))}
              disabled={!profiles || profiles.length === 0}
            >
              <SelectTrigger id="select-segment" data-testid="select-segment">
                <SelectValue placeholder={profilesLoading ? "Loading..." : "Choose a segment"} />
              </SelectTrigger>
              <SelectContent>
                {profiles?.map((p) => (
                  <SelectItem key={p.id} value={p.id.toString()} data-testid={`option-segment-${p.id}`}>
                    {p.segmentLabel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {region && (
        <div className="flex items-start gap-3 rounded-lg border border-card-border bg-card p-4">
          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-sm" data-testid="text-region-name">{region.name}</span>
              <DataQualityBadge quality={region.dataQuality} />
            </div>
            {region.productionShare && (
              <p className="text-xs text-muted-foreground">{region.productionShare}</p>
            )}
            {region.summary && <p className="text-sm text-muted-foreground">{region.summary}</p>}
          </div>
          {selectedProfile?.waterUseMlHa != null && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0 rounded-md bg-muted px-2.5 py-1.5">
              <Droplets className="h-3.5 w-3.5" />
              {formatNumber(selectedProfile.waterUseMlHa, { maxFractionDigits: 2 })} ML/ha
            </div>
          )}
        </div>
      )}

      {!isNoData && noCostBreakdown && (
        <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--chart-4))]/40 bg-[hsl(var(--chart-4))]/10 p-4">
          <TriangleAlert className="h-5 w-5 text-[hsl(var(--chart-4))] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-[hsl(var(--chart-4))]">Only the net gross margin is published for this segment</p>
            <p className="text-muted-foreground">
              No itemised cost breakdown exists in the source for this segment — cost fields default to $0 and
              gross revenue defaults to the published gross margin. Edit any field to model your own cost structure.
            </p>
          </div>
        </div>
      )}

      {isNoData && (
        <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--chart-4))]/40 bg-[hsl(var(--chart-4))]/10 p-4">
          <TriangleAlert className="h-5 w-5 text-[hsl(var(--chart-4))] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-[hsl(var(--chart-4))]">No verified data for this region</p>
            <p className="text-muted-foreground">
              Only Victorian state-wide averages exist — there is no published yield, cost or gross margin
              data specific to this district anywhere in the public record. Treat every figure below as a
              rough starting point only, and replace it with your own numbers. This is exactly the kind of
              gap a Hort Innovation / Lifecycles grower survey could close.
            </p>
          </div>
        </div>
      )}

      {isEstimate && (
        <div className="flex items-start gap-3 rounded-lg border border-[hsl(var(--chart-5))]/40 bg-[hsl(var(--chart-5))]/10 p-4">
          <Pencil className="h-5 w-5 text-[hsl(var(--chart-5))] shrink-0 mt-0.5" />
          <div className="text-sm space-y-1">
            <p className="font-medium text-[hsl(var(--chart-5))]">Owner estimate — not a verified source</p>
            <p className="text-muted-foreground">
              These figures were typed in directly by the PotatoLink team as a placeholder best-guess, not
              taken from a published source. Useful for getting a working number now — swap them out with
              real grower/agronomist survey data as soon as it's available (see the Admin page).
            </p>
          </div>
        </div>
      )}

      {profilesLoading || !form ? (
        <Skeleton className="h-96 w-full" />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-display">Calculator inputs</CardTitle>
                <CardDescription>Seeded from the region baseline — edit any field to model your own costs.</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => selectedProfile && setForm(toFormState(selectedProfile))}
                data-testid="button-reset-defaults"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset to region defaults
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {FIELD_GROUPS.map((group) => (
                <div key={group.title} className="space-y-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.title}
                  </h3>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {group.fields.map((field) => (
                      <div key={field.key} className="space-y-1">
                        <div className="flex items-center justify-between gap-1">
                          <Label htmlFor={`input-${field.key}`} className="text-xs text-muted-foreground">
                            {field.label} <span className="opacity-60">({field.unit})</span>
                          </Label>
                          {field.key === "grossRevenueHa" && (
                            <button
                              type="button"
                              title="Recalculate from yield x price"
                              onClick={() =>
                                setForm((prev) =>
                                  prev ? { ...prev, grossRevenueHa: prev.yieldTHa * prev.priceT } : prev
                                )
                              }
                              className="text-muted-foreground hover:text-foreground transition-colors"
                              data-testid="button-recalc-gross-revenue"
                            >
                              <CalculatorIcon className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                        <Input
                          id={`input-${field.key}`}
                          type="number"
                          value={form[field.key]}
                          onChange={(e) =>
                            setForm((prev) => (prev ? { ...prev, [field.key]: Number(e.target.value) || 0 } : prev))
                          }
                          className="font-mono text-sm"
                          data-testid={`input-${field.key}`}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base font-display">Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ResultRow label="Gross revenue" value={formatCurrency(results?.grossRevenueHa)} unit="/ha" testId="result-gross-revenue" />
                <ResultRow label="Total variable cost" value={formatCurrency(results?.totalVariableCostHa)} unit="/ha" testId="result-total-cost" />
                <div className="h-px bg-border" />
                <ResultRow
                  label="Net gross margin"
                  value={formatCurrency(results?.netGrossMarginHa)}
                  unit="/ha"
                  emphasize
                  positive={(results?.netGrossMarginHa ?? 0) >= 0}
                  testId="result-net-margin"
                />
                <ResultRow label="Margin per tonne" value={formatCurrency(results?.marginPerTonne, { maxFractionDigits: 2 })} unit="/t" testId="result-margin-per-tonne" />
                <div className="h-px bg-border" />
                <ResultRow label="Breakeven yield" value={`${formatNumber(results?.breakevenYield, { maxFractionDigits: 1 })} t/ha`} testId="result-breakeven-yield" />
                <ResultRow label="Breakeven price" value={formatCurrency(results?.breakevenPrice, { maxFractionDigits: 0 })} unit="/t" testId="result-breakeven-price" />
              </CardContent>
            </Card>

            {lifecycleResults && (
              <Card>
                <CardHeader>
                  <div className="flex items-start gap-2">
                    <Leaf className="h-4 w-4 text-[hsl(var(--chart-1))] shrink-0 mt-0.5" />
                    <div>
                      <CardTitle className="text-base font-display">Lifecycle emissions (indicative)</CardTitle>
                      <CardDescription className="text-xs">
                        Fertiliser + machinery diesel only — a partial footprint, not a full farm-gate LCA.
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ResultRow
                    label="Fertiliser (manufacture + field N2O)"
                    value={formatNumber(lifecycleResults.fertiliserKgHa, { maxFractionDigits: 0 })}
                    unit="kg CO2e/ha"
                    testId="result-lifecycle-fertiliser"
                  />
                  <ResultRow
                    label="Machinery & fuel (diesel)"
                    value={formatNumber(lifecycleResults.machineryKgHa, { maxFractionDigits: 0 })}
                    unit="kg CO2e/ha"
                    testId="result-lifecycle-machinery"
                  />
                  <div className="h-px bg-border" />
                  <ResultRow
                    label="Total (partial footprint)"
                    value={formatNumber(lifecycleResults.totalKgHa, { maxFractionDigits: 0 })}
                    unit="kg CO2e/ha"
                    emphasize
                    testId="result-lifecycle-total"
                  />
                  <ResultRow
                    label="Per tonne produced"
                    value={formatNumber(lifecycleResults.totalKgPerTonne, { maxFractionDigits: 1 })}
                    unit="kg CO2e/t"
                    testId="result-lifecycle-per-tonne"
                  />
                  <LifecycleSources />
                </CardContent>
              </Card>
            )}

            {selectedProfile && <SourcePanel profile={selectedProfile} />}
          </div>
        </div>
      )}

      {!profilesLoading && form && baselineResults && scenarioResults && (
        <Card>
          <CardHeader className="flex flex-row items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <Sprout className="h-5 w-5 text-[hsl(var(--sidebar-primary))] shrink-0 mt-0.5" />
              <div>
                <CardTitle className="text-base font-display">Practice change scenario</CardTitle>
                <CardDescription>
                  Model how adopting a practice change would move this region's published baseline gross
                  margin. Always compares against the standardised baseline — independent of any manual edits
                  above.
                </CardDescription>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setScenario(ZERO_SCENARIO)}
              disabled={!hasActiveScenario}
              className="shrink-0"
              data-testid="button-reset-scenario"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Reset scenario
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Presets — modeled assumptions, not regional data
              </h3>
              <p className="text-xs text-muted-foreground/80">
                Each preset sets only the sliders it affects. Clicking a second preset overwrites shared
                sliders rather than stacking on top — combine effects manually if you want to layer
                practice changes.
              </p>
              <div className="flex flex-wrap gap-2">
                {SCENARIO_PRESETS.map((preset) => (
                  <Tooltip key={preset.id}>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => applyPreset(preset.id)}
                        data-testid={`button-preset-${preset.id}`}
                      >
                        {preset.label}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs space-y-1.5 text-xs">
                      <p>{preset.description}</p>
                      <a
                        href={preset.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 underline underline-offset-2"
                      >
                        {preset.sourceLabel}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {SCENARIO_SLIDERS.map((slider) => {
                const value = scenario[slider.key];
                return (
                  <div key={slider.key} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <Label htmlFor={`slider-${slider.key}`} className="text-muted-foreground">
                        {slider.label}
                      </Label>
                      <span
                        className={`font-mono font-medium ${
                          value > 0
                            ? "text-[hsl(var(--chart-1))]"
                            : value < 0
                            ? "text-[hsl(var(--chart-4))]"
                            : "text-muted-foreground"
                        }`}
                        data-testid={`text-scenario-${slider.key}`}
                      >
                        {value > 0 ? "+" : ""}
                        {value}%
                      </span>
                    </div>
                    <Slider
                      id={`slider-${slider.key}`}
                      min={-50}
                      max={50}
                      step={1}
                      value={[value]}
                      onValueChange={([v]) => setScenario((prev) => ({ ...prev, [slider.key]: v }))}
                      data-testid={`slider-${slider.key}`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="h-px bg-border" />

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground">
                    <th className="text-left font-medium pb-2">Result</th>
                    <th className="text-right font-medium pb-2">Baseline</th>
                    <th className="text-right font-medium pb-2">Scenario</th>
                    <th className="text-right font-medium pb-2">Δ</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <ScenarioRow
                    label="Gross revenue"
                    baseline={baselineResults.grossRevenueHa}
                    scenario={scenarioResults.grossRevenueHa}
                    testId="gross-revenue"
                  />
                  <ScenarioRow
                    label="Total variable cost"
                    baseline={baselineResults.totalVariableCostHa}
                    scenario={scenarioResults.totalVariableCostHa}
                    testId="total-cost"
                    invertColor
                  />
                  <ScenarioRow
                    label="Net gross margin"
                    baseline={baselineResults.netGrossMarginHa}
                    scenario={scenarioResults.netGrossMarginHa}
                    testId="net-margin"
                    emphasize
                  />
                </tbody>
              </table>
            </div>

            {baselineLifecycle && scenarioLifecycle && (
              <>
                <div className="flex items-center gap-2 pt-2">
                  <Leaf className="h-3.5 w-3.5 text-[hsl(var(--chart-1))]" />
                  <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Lifecycle emissions (indicative) — fertiliser + machinery diesel only
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-xs text-muted-foreground">
                        <th className="text-left font-medium pb-2">Result</th>
                        <th className="text-right font-medium pb-2">Baseline</th>
                        <th className="text-right font-medium pb-2">Scenario</th>
                        <th className="text-right font-medium pb-2">Δ</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono">
                      <LifecycleScenarioRow
                        label="Fertiliser emissions (kg CO2e/ha)"
                        baseline={baselineLifecycle.fertiliserKgHa}
                        scenario={scenarioLifecycle.fertiliserKgHa}
                        testId="lifecycle-fertiliser"
                      />
                      <LifecycleScenarioRow
                        label="Machinery emissions (kg CO2e/ha)"
                        baseline={baselineLifecycle.machineryKgHa}
                        scenario={scenarioLifecycle.machineryKgHa}
                        testId="lifecycle-machinery"
                      />
                      <LifecycleScenarioRow
                        label="Total partial footprint (kg CO2e/ha)"
                        baseline={baselineLifecycle.totalKgHa}
                        scenario={scenarioLifecycle.totalKgHa}
                        testId="lifecycle-total"
                        emphasize
                      />
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-muted-foreground/80">
                  Assumes fertiliser/machinery input volume shifts by the same % as the cost sliders above. Excludes
                  crop protection, irrigation pumping electricity, and post-harvest transport — see the source card
                  for full methodology and citations.
                </p>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ScenarioRow({
  label,
  baseline,
  scenario,
  emphasize,
  invertColor,
  testId,
}: {
  label: string;
  baseline: number;
  scenario: number;
  emphasize?: boolean;
  invertColor?: boolean;
  testId?: string;
}) {
  const delta = scenario - baseline;
  const isImprovement = invertColor ? delta < 0 : delta > 0;
  const isWorse = invertColor ? delta > 0 : delta < 0;
  const deltaColor =
    Math.abs(delta) < 0.5
      ? "text-muted-foreground"
      : isImprovement
      ? "text-[hsl(var(--chart-1))]"
      : isWorse
      ? "text-[hsl(var(--chart-4))]"
      : "text-muted-foreground";
  return (
    <tr className="border-t border-border/60">
      <td className={`py-2 pr-2 ${emphasize ? "font-sans font-medium text-foreground" : "font-sans text-muted-foreground"}`}>
        {label}
      </td>
      <td className="py-2 text-right text-muted-foreground" data-testid={`text-baseline-${testId}`}>
        {formatCurrency(baseline)}
      </td>
      <td
        className={`py-2 text-right ${emphasize ? "font-semibold text-foreground" : ""}`}
        data-testid={`text-scenario-${testId}`}
      >
        {formatCurrency(scenario)}
      </td>
      <td className={`py-2 pl-2 text-right font-medium ${deltaColor}`} data-testid={`text-delta-${testId}`}>
        {delta >= 0 ? "+" : ""}
        {formatCurrency(delta)}
      </td>
    </tr>
  );
}

function LifecycleScenarioRow({
  label,
  baseline,
  scenario,
  emphasize,
  testId,
}: {
  label: string;
  baseline: number;
  scenario: number;
  emphasize?: boolean;
  testId?: string;
}) {
  const delta = scenario - baseline;
  const deltaColor =
    Math.abs(delta) < 0.5
      ? "text-muted-foreground"
      : delta < 0
      ? "text-[hsl(var(--chart-1))]"
      : "text-[hsl(var(--chart-4))]";
  return (
    <tr className="border-t border-border/60">
      <td className={`py-2 pr-2 ${emphasize ? "font-sans font-medium text-foreground" : "font-sans text-muted-foreground"}`}>
        {label}
      </td>
      <td className="py-2 text-right text-muted-foreground" data-testid={`text-baseline-${testId}`}>
        {formatNumber(baseline, { maxFractionDigits: 0 })}
      </td>
      <td
        className={`py-2 text-right ${emphasize ? "font-semibold text-foreground" : ""}`}
        data-testid={`text-scenario-${testId}`}
      >
        {formatNumber(scenario, { maxFractionDigits: 0 })}
      </td>
      <td className={`py-2 pl-2 text-right font-medium ${deltaColor}`} data-testid={`text-delta-${testId}`}>
        {delta >= 0 ? "+" : ""}
        {formatNumber(delta, { maxFractionDigits: 0 })}
      </td>
    </tr>
  );
}

// Reference constants + citations shown in the Lifecycle emissions card and
// reused by the Admin page's read-only GHG factors reference.
export function LifecycleSources() {
  return (
    <div className="space-y-2 pt-1">
      <div className="h-px bg-border" />
      <p className="text-xs text-muted-foreground/80">
        Modelled from a flat Australian reference nutrient program (N {REFERENCE_NUTRIENT_RATES.N.value} /
        P2O5 {REFERENCE_NUTRIENT_RATES.P2O5.value} / K2O {REFERENCE_NUTRIENT_RATES.K2O.value} kg/ha) and
        {" "}
        {REFERENCE_DIESEL_USE.value} L/ha machinery diesel — not region-specific. Excludes crop protection,
        irrigation pumping electricity, and post-harvest transport.
      </p>
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        <a
          href={REFERENCE_NUTRIENT_RATES.N.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Haifa Group nutrient rates <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={N_EMISSION_COMPONENTS[0].sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          N manufacture/hydrolysis (Agriland.ie) <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={N_EMISSION_COMPONENTS[2].sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Field N2O (IPCC 2006 Ch.11) <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={P2O5_FACTOR.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          P2O5 factor (FAO/AGRIS) <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={K2O_FACTOR.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          K2O factor (4C Services) <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={REFERENCE_DIESEL_USE.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Diesel use (SEFARI Scotland) <ExternalLink className="h-3 w-3" />
        </a>
        <a
          href={DIESEL_EMISSION_FACTOR.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs underline underline-offset-2 text-muted-foreground hover:text-foreground"
        >
          Diesel factor (NGA Factors 2025) <ExternalLink className="h-3 w-3" />
        </a>
      </div>
    </div>
  );
}

function ResultRow({
  label,
  value,
  unit,
  emphasize,
  positive,
  testId,
}: {
  label: string;
  value: string;
  unit?: string;
  emphasize?: boolean;
  positive?: boolean;
  testId?: string;
}) {
  return (
    <div className="flex items-baseline justify-between gap-2">
      <span className={emphasize ? "text-sm font-medium" : "text-sm text-muted-foreground"}>{label}</span>
      <span
        className={
          emphasize
            ? `font-mono font-semibold text-lg ${positive === false ? "text-[hsl(var(--chart-4))]" : "text-[hsl(var(--chart-1))]"}`
            : "font-mono text-sm"
        }
        data-testid={testId}
      >
        {value}
        {unit && <span className="text-xs text-muted-foreground ml-0.5">{unit}</span>}
      </span>
    </div>
  );
}
