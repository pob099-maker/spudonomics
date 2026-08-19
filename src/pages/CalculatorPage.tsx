// The calculator: pick a region and segment, see what the published budget
// actually says, then edit any figure to model your own costs.
//
// The design problem this page solves is that the underlying budgets are
// unevenly complete. A screen that renders every gap as $0 reads as confident
// and precise and is wrong; this one says which lines the source never
// published, and keeps the un-itemised remainder on screen rather than
// dropping it.

import { useMemo, useState } from "react";
import { listRegions, profilesForRegion } from "../data";
import {
  baselineMargin,
  costLines,
  editedMargin,
  type CostEdits,
  type MarginInputs,
  type MarginResult,
} from "../services/grossMargin";
import { money, perTonne, tonnes, UNKNOWN } from "../services/format";
import { Card, Figure, PageTitle, QualityPill } from "../components/ui";
import type { CostProfile } from "../types";

const inputClass =
  "min-h-11 w-full rounded-lg border border-ink/20 bg-surface px-3 tabular-nums " +
  "focus:border-primary focus:outline-none dark:border-ink-dark/20 dark:bg-surface-dark";

export function CalculatorPage() {
  const regions = useMemo(() => listRegions(), []);
  const [regionId, setRegionId] = useState(regions[0].id);

  const profiles = useMemo(() => profilesForRegion(regionId), [regionId]);
  const [segment, setSegment] = useState<string | null>(null);
  const profile = profiles.find((p) => p.segment === segment) ?? profiles[0];

  // Edits are keyed by profile so switching region never carries one budget's
  // numbers onto another's.
  const [edits, setEdits] = useState<CostEdits>({});
  const [inputOverrides, setInputOverrides] = useState<Partial<MarginInputs>>({});
  const editKey = `${profile.regionId}/${profile.segment}`;
  const [editedKey, setEditedKey] = useState(editKey);

  if (editedKey !== editKey) {
    setEditedKey(editKey);
    setEdits({});
    setInputOverrides({});
  }

  const region = regions.find((r) => r.id === regionId)!;
  const touched = Object.keys(edits).length > 0 || Object.keys(inputOverrides).length > 0;

  const inputs: MarginInputs = {
    yieldTHa: inputOverrides.yieldTHa ?? profile.yieldTHa,
    priceT: inputOverrides.priceT ?? profile.priceT,
    grossIncomeHa: inputOverrides.grossIncomeHa ?? profile.grossIncomeHa,
    overheadPct: inputOverrides.overheadPct ?? profile.overheadPct,
  };

  const result = touched
    ? editedMargin(profile, inputs, edits)
    : baselineMargin(profile);

  function reset(): void {
    setEdits({});
    setInputOverrides({});
  }

  return (
    <div className="space-y-4">
      <div>
        <PageTitle>Potato gross margins</PageTitle>
        <p className="mt-1 text-ink/60 dark:text-ink-dark/60">
          Published regional budgets for Australian potato production. Pick a region to see
          what its source actually reports, then change any figure to model your own costs.
        </p>
      </div>

      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="region" className="mb-1 block text-sm font-medium">
              Region
            </label>
            <select
              id="region"
              value={regionId}
              onChange={(event) => {
                setRegionId(event.target.value);
                setSegment(null);
              }}
              className={inputClass}
            >
              {regions.map((candidate) => (
                <option key={candidate.id} value={candidate.id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="segment" className="mb-1 block text-sm font-medium">
              Market segment
            </label>
            <select
              id="segment"
              value={profile.segment}
              onChange={(event) => setSegment(event.target.value)}
              className={inputClass}
            >
              {profiles.map((candidate) => (
                <option key={candidate.segment} value={candidate.segment}>
                  {candidate.segmentLabel}
                  {candidate.totalVariableCostHa === null ? " — no costs published" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <QualityPill quality={profile.dataQuality} />
          <span className="text-sm text-ink/60 dark:text-ink-dark/60">
            {region.productionShare}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink/70 dark:text-ink-dark/70">{region.summary}</p>
      </Card>

      <BasisNotice result={result} profile={profile} touched={touched} />

      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-lg font-bold">Results</h2>
          {touched ? (
            <button
              type="button"
              onClick={reset}
              className="min-h-11 rounded-lg border border-ink/20 px-3 text-sm font-medium dark:border-ink-dark/20"
            >
              Back to the published figures
            </button>
          ) : null}
        </div>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          <Figure label="Gross revenue" value={money(result.revenueHa)} hint="per hectare" />
          <Figure
            label="Total variable cost"
            value={money(result.costHa)}
            tone={result.costHa === null ? "unknown" : "neutral"}
            hint={result.costHa === null ? "not published" : "per hectare"}
          />
          <Figure
            label="Gross margin"
            value={money(result.marginHa)}
            tone={
              result.marginHa === null ? "unknown" : result.marginHa >= 0 ? "good" : "bad"
            }
            hint="per hectare"
          />
          <Figure label="Margin per tonne" value={perTonne(result.marginPerTonne)} />
          <Figure
            label="Breakeven yield"
            value={tonnes(result.breakevenYieldTHa)}
            tone={result.breakevenYieldTHa === null ? "unknown" : "neutral"}
          />
          <Figure
            label="Breakeven price"
            value={perTonne(result.breakevenPriceT)}
            tone={result.breakevenPriceT === null ? "unknown" : "neutral"}
          />
        </dl>
      </Card>

      <MarketInputs
        inputs={inputs}
        onChange={(patch) => setInputOverrides((current) => ({ ...current, ...patch }))}
      />

      <CostInputs
        profile={profile}
        edits={edits}
        onChange={(key, value) => setEdits((current) => ({ ...current, [key]: value }))}
      />

      <SourceCard profile={profile} />
    </div>
  );
}

/** Says out loud what the numbers above are standing on. */
function BasisNotice({
  result,
  profile,
  touched,
}: {
  result: MarginResult;
  profile: CostProfile;
  touched: boolean;
}) {
  if (touched) {
    return (
      <p className="rounded-xl border border-accent/50 bg-accent/10 p-3 text-sm">
        <span className="font-medium">Your figures, not the published ones.</span> The
        results are now worked out from the numbers below. Reset to go back to what the
        source reported.
      </p>
    );
  }

  if (result.basis === "published") {
    const gap = result.unitemisedHa;
    return (
      <p className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm">
        <span className="font-medium text-success">
          Cost and margin as published by the source.
        </span>{" "}
        {gap !== null && gap > 0 ? (
          <>
            The budget itemises {money(result.itemisedHa)}/ha of its {money(result.costHa)}/ha
            total; the remaining {money(gap)}/ha is real cost it never broke down. It is
            counted in the margin above, and left out of the breakdown below.
          </>
        ) : (
          <>Every cost line is itemised, and they reconcile to the published total.</>
        )}
      </p>
    );
  }

  if (result.basis === "itemised") {
    return (
      <p className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
        <span className="font-medium text-warning">Incomplete — treat as indicative.</span>{" "}
        This budget itemises some costs but publishes no total, so there is no way to know
        what is missing. The margin shown is an upper bound, not this region's margin.
      </p>
    );
  }

  return (
    <p className="rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
      <span className="font-medium text-danger">No costs published for this budget.</span>{" "}
      {profile.notes
        ? profile.notes
        : "Nothing is shown for cost or margin, because there is nothing to show. Enter your own figures below to model it."}
    </p>
  );
}

function MarketInputs({
  inputs,
  onChange,
}: {
  inputs: MarginInputs;
  onChange: (patch: Partial<MarginInputs>) => void;
}) {
  return (
    <Card>
      <h2 className="font-display text-lg font-bold">Market &amp; pricing</h2>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <NumberField
          id="yield"
          label="Yield"
          unit="t/ha"
          value={inputs.yieldTHa}
          onChange={(value) => onChange({ yieldTHa: value })}
        />
        <NumberField
          id="price"
          label="Price"
          unit="$/t"
          value={inputs.priceT}
          onChange={(value) => onChange({ priceT: value })}
          hint="Blank where the source prices by grade or by the bag."
        />
        <NumberField
          id="revenue"
          label="Gross revenue"
          unit="$/ha"
          value={inputs.grossIncomeHa}
          onChange={(value) => onChange({ grossIncomeHa: value })}
          hint="Published revenue wins over yield x price."
        />
        <NumberField
          id="overheads"
          label="Overheads &amp; levies"
          unit="% of revenue"
          value={inputs.overheadPct}
          onChange={(value) => onChange({ overheadPct: value })}
        />
      </div>
    </Card>
  );
}

function CostInputs({
  profile,
  edits,
  onChange,
}: {
  profile: CostProfile;
  edits: CostEdits;
  onChange: (key: string, value: number | null) => void;
}) {
  const lines = costLines(profile);
  const groups = [...new Set(lines.map((line) => line.group))];

  return (
    <Card>
      <h2 className="font-display text-lg font-bold">Cost breakdown</h2>
      <p className="mt-1 text-sm text-ink/60 dark:text-ink-dark/60">
        Blank means the source never published that line — not that it costs nothing. Type
        a figure into any of them to model your own costs.
      </p>
      {groups.map((group) => (
        <div key={group} className="mt-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-ink/50 dark:text-ink-dark/50">
            {group}
          </h3>
          <div className="mt-2 grid gap-3 sm:grid-cols-2">
            {lines
              .filter((line) => line.group === group)
              .map((line) => (
                <NumberField
                  key={line.key as string}
                  id={line.key as string}
                  label={line.label}
                  unit="$/ha"
                  value={edits[line.key as string] ?? line.valueHa}
                  placeholder="Not published"
                  onChange={(value) => onChange(line.key as string, value)}
                />
              ))}
          </div>
        </div>
      ))}
    </Card>
  );
}

function NumberField({
  id,
  label,
  unit,
  value,
  hint,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  unit: string;
  value: number | null;
  hint?: string;
  placeholder?: string;
  onChange: (value: number | null) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label} <span className="font-normal text-ink/50 dark:text-ink-dark/50">({unit})</span>
      </label>
      <input
        id={id}
        type="number"
        inputMode="decimal"
        step="any"
        value={value === null ? "" : value}
        placeholder={placeholder ?? UNKNOWN}
        onChange={(event) => {
          const next = event.target.value.trim();
          onChange(next === "" ? null : Number(next));
        }}
        className={inputClass}
      />
      {hint ? (
        <p className="mt-1 text-xs text-ink/50 dark:text-ink-dark/50">{hint}</p>
      ) : null}
    </div>
  );
}

function SourceCard({ profile }: { profile: CostProfile }) {
  if (!profile.sourceName) return null;
  return (
    <Card>
      <h2 className="font-display text-lg font-bold">Where these figures come from</h2>
      <p className="mt-2 text-sm">
        {profile.sourceUrl ? (
          <a
            href={profile.sourceUrl}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-primary underline dark:text-primary-soft"
          >
            {profile.sourceName}
          </a>
        ) : (
          <span className="font-medium">{profile.sourceName}</span>
        )}
        {profile.sourceYear ? (
          <span className="text-ink/60 dark:text-ink-dark/60"> · {profile.sourceYear}</span>
        ) : null}
      </p>
      {profile.notes ? (
        <p className="mt-2 text-sm text-ink/70 dark:text-ink-dark/70">{profile.notes}</p>
      ) : null}
    </Card>
  );
}
