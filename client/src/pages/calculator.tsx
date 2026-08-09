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
import { DataQualityBadge } from "@/components/data-quality-badge";
import { SourcePanel } from "@/components/source-panel";
import { formatCurrency, formatNumber } from "@/lib/format";
import { apiRequest } from "@/lib/queryClient";
import { RotateCcw, TriangleAlert, Droplets, Calculator as CalculatorIcon } from "lucide-react";

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

  useEffect(() => {
    if (selectedProfile) {
      setForm(toFormState(selectedProfile));
    }
  }, [selectedProfile]);

  const region = regions?.find((r) => r.id === regionId);

  const results = useMemo(() => {
    if (!form) return null;
    const grossRevenueHa = form.grossRevenueHa;
    const inputCostHa =
      form.seedCostHa +
      form.fertiliserCostHa +
      form.cropProtectionCostHa +
      form.irrigationCostHa +
      form.machineryCostHa +
      form.contractCostHa +
      form.labourCostHa +
      form.postHarvestCostHa;
    const overheadHa = grossRevenueHa * (form.overheadPct / 100);
    const totalVariableCostHa = inputCostHa + overheadHa;
    const netGrossMarginHa = grossRevenueHa - totalVariableCostHa;
    const marginPerTonne = form.yieldTHa > 0 ? netGrossMarginHa / form.yieldTHa : null;
    const breakevenYield = form.priceT > 0 ? totalVariableCostHa / form.priceT : null;
    const breakevenPrice = form.yieldTHa > 0 ? totalVariableCostHa / form.yieldTHa : null;
    return { grossRevenueHa, totalVariableCostHa, netGrossMarginHa, marginPerTonne, breakevenYield, breakevenPrice };
  }, [form]);

  const isNoData = region?.dataQuality === "none";
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

            {selectedProfile && <SourcePanel profile={selectedProfile} />}
          </div>
        </div>
      )}
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
