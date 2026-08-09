import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import type { Region, CostProfile, InsertCostProfile } from "@shared/schema";
import { DATA_QUALITY_LABELS } from "@shared/schema";
import { apiRequest, queryClient, setAdminToken, getAdminToken } from "@/lib/queryClient";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DataQualityBadge } from "@/components/data-quality-badge";
import { formatCurrency, formatNumber } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Pencil, ExternalLink, Lock, LockOpen, Leaf } from "lucide-react";
import {
  REFERENCE_NUTRIENT_RATES,
  N_EMISSION_COMPONENTS,
  N_FACTOR_TOTAL,
  P2O5_FACTOR,
  K2O_FACTOR,
  REFERENCE_DIESEL_USE,
  DIESEL_EMISSION_FACTOR,
} from "@/lib/lifecycle-factors";

const NUMERIC_FIELDS: { key: keyof CostProfile; label: string }[] = [
  { key: "yieldTHa", label: "Yield (t/ha)" },
  { key: "priceT", label: "Price ($/t)" },
  { key: "grossIncomeHa", label: "Gross income ($/ha)" },
  { key: "seedCostHa", label: "Seed ($/ha)" },
  { key: "fertiliserCostHa", label: "Fertiliser ($/ha)" },
  { key: "cropProtectionCostHa", label: "Crop protection ($/ha)" },
  { key: "irrigationCostHa", label: "Irrigation ($/ha)" },
  { key: "waterUseMlHa", label: "Water use (ML/ha)" },
  { key: "machineryCostHa", label: "Machinery ($/ha)" },
  { key: "contractCostHa", label: "Contract ops ($/ha)" },
  { key: "labourCostHa", label: "Labour ($/ha)" },
  { key: "labourRateHr", label: "Labour rate ($/hr)" },
  { key: "postHarvestCostHa", label: "Post-harvest ($/ha)" },
  { key: "overheadPct", label: "Overhead (%)" },
  { key: "totalVariableCostHa", label: "Total variable cost ($/ha)" },
  { key: "grossMarginHa", label: "Gross margin ($/ha)" },
];

export default function Admin() {
  const { data: regions, isLoading: regionsLoading } = useQuery<Region[]>({ queryKey: ["/api/regions"] });
  const { data: profiles, isLoading: profilesLoading } = useQuery<CostProfile[]>({
    queryKey: ["/api/cost-profiles"],
  });
  const [editing, setEditing] = useState<CostProfile | null>(null);
  const [unlocked, setUnlocked] = useState(!!getAdminToken());

  const regionById = new Map(regions?.map((r) => [r.id, r]) ?? []);

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="font-display text-xl font-semibold" data-testid="text-admin-title">
          Data sources
        </h1>
        <p className="text-sm text-muted-foreground max-w-2xl">
          Every baseline in the calculator comes from a cited source below. Edit a row when a better source
          becomes available — the citation fields are mandatory so provenance is never lost.
        </p>
      </div>

      <AdminUnlockGate unlocked={unlocked} onUnlocked={() => setUnlocked(true)} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Regions</CardTitle>
          <CardDescription>14 Australian potato-growing regions tracked by Spudonomics.</CardDescription>
        </CardHeader>
        <CardContent>
          {regionsLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Region</TableHead>
                  <TableHead>State</TableHead>
                  <TableHead>Data quality</TableHead>
                  <TableHead>Production share</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {regions?.map((r) => (
                  <TableRow key={r.id} data-testid={`row-region-${r.id}`}>
                    <TableCell className="font-medium">{r.name}</TableCell>
                    <TableCell className="text-muted-foreground">{r.state}</TableCell>
                    <TableCell>
                      <DataQualityBadge quality={r.dataQuality} />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{r.productionShare ?? "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base font-display">Cost profiles</CardTitle>
          <CardDescription>One row per region &times; market segment.</CardDescription>
        </CardHeader>
        <CardContent>
          {profilesLoading ? (
            <Skeleton className="h-96 w-full" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Region</TableHead>
                    <TableHead>Segment</TableHead>
                    <TableHead>Yield</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Gross margin</TableHead>
                    <TableHead>Quality</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profiles?.map((p) => (
                    <TableRow key={p.id} data-testid={`row-profile-${p.id}`}>
                      <TableCell className="whitespace-nowrap">{regionById.get(p.regionId)?.name ?? p.regionId}</TableCell>
                      <TableCell className="whitespace-nowrap">{p.segmentLabel}</TableCell>
                      <TableCell className="font-mono text-sm">{formatNumber(p.yieldTHa, { maxFractionDigits: 1 })}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(p.priceT)}</TableCell>
                      <TableCell className="font-mono text-sm">{formatCurrency(p.grossMarginHa)}</TableCell>
                      <TableCell>
                        <DataQualityBadge quality={p.dataQuality} />
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" title={p.sourceName ?? undefined}>
                        {p.sourceUrl ? (
                          <a
                            href={p.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 underline decoration-dotted hover:decoration-solid"
                          >
                            {p.sourceName ?? "Source"}
                            <ExternalLink className="h-3 w-3 shrink-0" />
                          </a>
                        ) : (
                          p.sourceName ?? "—"
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setEditing(p)}
                          disabled={!unlocked}
                          title={unlocked ? "Edit" : "Unlock editing above to edit"}
                          data-testid={`button-edit-profile-${p.id}`}
                        >
                          {unlocked ? <Pencil className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <LifecycleFactorsCard />

      {editing && (
        <EditProfileDialog
          profile={editing}
          region={regionById.get(editing.regionId)}
          onClose={() => setEditing(null)}
        />
      )}
    </div>
  );
}

function LifecycleFactorsCard() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-2">
          <Leaf className="h-4 w-4 text-green-600 shrink-0 mt-0.5" />
          <div>
            <CardTitle className="text-base font-display">Lifecycle / GHG factors (reference)</CardTitle>
            <CardDescription>
              Read-only. Backs the indicative lifecycle-emissions figures shown in the Calculator. Flat national
              reference constants, not region-specific -- not editable here.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Reference nutrient program (Australia)
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nutrient</TableHead>
                <TableHead>Reference rate</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(REFERENCE_NUTRIENT_RATES).map(([key, f]) => (
                <TableRow key={key} data-testid={`row-ghg-nutrient-${key}`}>
                  <TableCell className="font-medium">{key}</TableCell>
                  <TableCell className="font-mono text-sm">{f.value} {f.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted hover:decoration-solid">
                      {f.sourceLabel}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Nitrogen emission factor components (sum = {N_FACTOR_TOTAL.toFixed(2)} kg CO2e/kg N)
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Component</TableHead>
                <TableHead>Factor</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {N_EMISSION_COMPONENTS.map((f) => (
                <TableRow key={f.label} data-testid={`row-ghg-n-${f.label}`}>
                  <TableCell className="max-w-[260px] text-sm">{f.label}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{f.value} {f.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted hover:decoration-solid">
                      {f.sourceLabel}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div>
          <h3 className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">
            Manufacture factors and machinery diesel
          </h3>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Factor</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Source</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[P2O5_FACTOR, K2O_FACTOR, REFERENCE_DIESEL_USE, DIESEL_EMISSION_FACTOR].map((f) => (
                <TableRow key={f.label} data-testid={`row-ghg-factor-${f.label}`}>
                  <TableCell className="max-w-[260px] text-sm">{f.label}</TableCell>
                  <TableCell className="font-mono text-sm whitespace-nowrap">{f.value} {f.unit}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    <a href={f.sourceUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 underline decoration-dotted hover:decoration-solid">
                      {f.sourceLabel}
                      <ExternalLink className="h-3 w-3 shrink-0" />
                    </a>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <p className="text-xs text-muted-foreground/80">
          Scope: fertiliser manufacture + field N2O + machinery diesel only. Excludes crop protection
          manufacture, irrigation pumping electricity, packing, cold storage and transport -- this is a partial,
          indicative footprint, not a full farm-gate life-cycle assessment.
        </p>
      </CardContent>
    </Card>
  );
}

function AdminUnlockGate({ unlocked, onUnlocked }: { unlocked: boolean; onUnlocked: () => void }) {
  const [token, setToken] = useState("");
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const verify = useMutation({
    mutationFn: async (candidate: string) => {
      const res = await fetch(`${("__PORT_5000__" as string).startsWith("__") ? "" : "__PORT_5000__"}/api/admin/verify`, {
        method: "POST",
        headers: { "x-admin-token": candidate },
      });
      if (!res.ok) throw new Error("Invalid token");
      return candidate;
    },
    onSuccess: (candidate) => {
      setAdminToken(candidate);
      setError(null);
      onUnlocked();
      toast({ title: "Editing unlocked", description: "You can now edit cost profiles." });
    },
    onError: () => setError("That token wasn't recognised."),
  });

  if (unlocked) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground" data-testid="text-admin-unlocked">
        <LockOpen className="h-3.5 w-3.5" />
        Editing unlocked for this session.
      </div>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div className="flex-1 space-y-1.5">
            <Label htmlFor="admin-token" className="flex items-center gap-1.5 text-sm">
              <Lock className="h-3.5 w-3.5" />
              Editing is locked — enter the shared admin token to make changes
            </Label>
            <Input
              id="admin-token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Admin token"
              data-testid="input-admin-token"
            />
            {error && <p className="text-xs text-destructive">{error}</p>}
          </div>
          <Button
            onClick={() => verify.mutate(token)}
            disabled={!token || verify.isPending}
            data-testid="button-unlock-editing"
          >
            {verify.isPending ? "Checking\u2026" : "Unlock editing"}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground/80 mt-2">
          Anyone can view this page — the token only gates who can overwrite the published baseline figures.
          Ask whoever manages this deployment for the token.
        </p>
      </CardContent>
    </Card>
  );
}

function EditProfileDialog({
  profile,
  region,
  onClose,
}: {
  profile: CostProfile;
  region?: Region;
  onClose: () => void;
}) {
  const { toast } = useToast();
  const [form, setForm] = useState<CostProfile>(profile);
  const [syncRegionQuality, setSyncRegionQuality] = useState(
    !!region && (region.dataQuality === "none" || region.dataQuality === profile.dataQuality)
  );

  const mutation = useMutation({
    mutationFn: async (patch: Partial<InsertCostProfile>) => {
      const res = await apiRequest("PATCH", `/api/cost-profiles/${profile.id}`, patch);
      if (region && syncRegionQuality && patch.dataQuality) {
        await apiRequest("PATCH", `/api/regions/${region.id}`, { dataQuality: patch.dataQuality });
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-profiles"] });
      queryClient.invalidateQueries({ queryKey: ["/api/regions"] });
      toast({ title: "Profile updated", description: `${profile.segmentLabel} saved with new source data.` });
      onClose();
    },
    onError: (err: Error) => {
      toast({ title: "Update failed", description: err.message, variant: "destructive" });
    },
  });

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit — {form.segmentLabel}</DialogTitle>
          <DialogDescription>
            Update the baseline values and keep the source citation current. Every numeric field must trace
            to the source below.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {NUMERIC_FIELDS.map((f) => (
              <div key={f.key} className="space-y-1">
                <Label htmlFor={`admin-${f.key}`} className="text-xs text-muted-foreground">
                  {f.label}
                </Label>
                <Input
                  id={`admin-${f.key}`}
                  type="number"
                  className="font-mono text-sm"
                  value={(form[f.key] as number | null) ?? ""}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      [f.key]: e.target.value === "" ? null : Number(e.target.value),
                    }))
                  }
                  data-testid={`admin-input-${f.key}`}
                />
              </div>
            ))}
          </div>

          <div className="space-y-1">
            <Label htmlFor="admin-data-quality" className="text-xs text-muted-foreground">
              Data quality
            </Label>
            <Select
              value={form.dataQuality}
              onValueChange={(v) => setForm((prev) => ({ ...prev, dataQuality: v }))}
            >
              <SelectTrigger id="admin-data-quality" data-testid="admin-select-quality">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regional">Regional data</SelectItem>
                <SelectItem value="state_proxy">State proxy</SelectItem>
                <SelectItem value="national_proxy">National proxy</SelectItem>
                <SelectItem value="estimate">Owner estimate — placeholder</SelectItem>
                <SelectItem value="none">No data — survey needed</SelectItem>
              </SelectContent>
            </Select>
            {form.dataQuality === "estimate" && (
              <p className="text-xs text-muted-foreground">
                These are your own best-guess figures, not a published source — leave the source fields
                blank or note who supplied the guess. Swap this row for real survey data any time by editing
                it again and changing the quality back to Regional data.
              </p>
            )}
          </div>
          {region && (
            <div className="flex items-center gap-2 rounded-md border border-card-border bg-muted/40 p-3">
              <input
                id="admin-sync-region-quality"
                type="checkbox"
                className="h-4 w-4 accent-[hsl(var(--chart-5))]"
                checked={syncRegionQuality}
                onChange={(e) => setSyncRegionQuality(e.target.checked)}
                data-testid="admin-checkbox-sync-region"
              />
              <Label htmlFor="admin-sync-region-quality" className="text-xs text-muted-foreground cursor-pointer">
                Also update the <span className="font-medium">{region.name}</span> region badge to match this
                profile's data quality (currently <span className="font-medium">{DATA_QUALITY_LABELS[region.dataQuality] ?? region.dataQuality}</span>).
                This is what removes the "No verified data" warning on the Calculator page.
              </Label>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="admin-source-name" className="text-xs text-muted-foreground">
                Source name
              </Label>
              <Input
                id="admin-source-name"
                value={form.sourceName ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, sourceName: e.target.value }))}
                data-testid="admin-input-source-name"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="admin-source-year" className="text-xs text-muted-foreground">
                Source year
              </Label>
              <Input
                id="admin-source-year"
                value={form.sourceYear ?? ""}
                onChange={(e) => setForm((prev) => ({ ...prev, sourceYear: e.target.value }))}
                data-testid="admin-input-source-year"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-source-url" className="text-xs text-muted-foreground">
              Source URL
            </Label>
            <Input
              id="admin-source-url"
              value={form.sourceUrl ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, sourceUrl: e.target.value }))}
              data-testid="admin-input-source-url"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="admin-notes" className="text-xs text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="admin-notes"
              rows={3}
              value={form.notes ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
              data-testid="admin-input-notes"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-edit">
            Cancel
          </Button>
          <Button
            onClick={() =>
              mutation.mutate({
                yieldTHa: form.yieldTHa,
                priceT: form.priceT,
                grossIncomeHa: form.grossIncomeHa,
                seedCostHa: form.seedCostHa,
                fertiliserCostHa: form.fertiliserCostHa,
                cropProtectionCostHa: form.cropProtectionCostHa,
                irrigationCostHa: form.irrigationCostHa,
                waterUseMlHa: form.waterUseMlHa,
                machineryCostHa: form.machineryCostHa,
                contractCostHa: form.contractCostHa,
                labourCostHa: form.labourCostHa,
                labourRateHr: form.labourRateHr,
                postHarvestCostHa: form.postHarvestCostHa,
                overheadPct: form.overheadPct,
                totalVariableCostHa: form.totalVariableCostHa,
                grossMarginHa: form.grossMarginHa,
                dataQuality: form.dataQuality,
                sourceName: form.sourceName,
                sourceUrl: form.sourceUrl,
                sourceYear: form.sourceYear,
                notes: form.notes,
              })
            }
            disabled={mutation.isPending}
            data-testid="button-save-edit"
          >
            {mutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
