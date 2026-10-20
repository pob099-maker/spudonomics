// The area view: the same published budgets, read by AgAims area instead of
// by Spudonomics district.
//
// An area is where PT26001 works; a district is where a budget was written.
// They do not line up one to one, so this page never merges them. Where two
// districts speak for one area they are shown side by side, where one covers
// only part of an area it says which part, and where nothing regional exists it
// says that instead of putting a state-wide figure in the local slot.

import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { districtAreaMap } from "../data/areaMap";
import {
  areaCoverageCsv,
  areaCoverageRows,
  areasWithoutRegionalEconomics,
  listAreaViews,
  staleAreas,
  unmappedDistricts,
  viewArea,
  type AreaDistrictView,
  type AreaView,
} from "../services/areaView";
import { money } from "../services/format";
import { Card, PageTitle, QualityPill } from "../components/ui";

const inputClass =
  "min-h-11 w-full rounded-lg border border-ink/20 bg-surface px-3 " +
  "focus:border-primary focus:outline-none dark:border-ink-dark/20 dark:bg-surface-dark";

export function AreasPage() {
  const [params, setParams] = useSearchParams();
  const groups = useMemo(() => listAreaViews(), []);
  const selected = viewArea(params.get("area") ?? "");

  return (
    <div className="space-y-4">
      <div>
        <PageTitle>AgAims areas</PageTitle>
        <p className="mt-1 text-ink/60 dark:text-ink-dark/60">
          The published budgets, read by the 12 AgAims areas rather than by the district
          each budget was written for. Nothing here is averaged across districts or borrowed
          from a neighbour: an area with no regional figures says so.
        </p>
      </div>

      <Card>
        <label htmlFor="area" className="mb-1 block text-sm font-medium">
          Area
        </label>
        <select
          id="area"
          value={selected?.area.id ?? ""}
          onChange={(event) => setParams(event.target.value ? { area: event.target.value } : {})}
          className={inputClass}
        >
          <option value="">All areas</option>
          {groups.map(({ region, areas }) => (
            <optgroup key={region.id} label={region.name}>
              {areas.map((view) => (
                <option key={view.area.id} value={view.area.id}>
                  {view.area.name}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </Card>

      {selected ? <AreaDetail view={selected} /> : <Overview />}
    </div>
  );
}

function Overview() {
  const groups = useMemo(() => listAreaViews(), []);
  const gaps = useMemo(() => areasWithoutRegionalEconomics(), []);
  const old = useMemo(() => staleAreas(new Date().getFullYear()), []);
  const outside = useMemo(() => unmappedDistricts(), []);

  return (
    <>
      <Card>
        <h2 className="font-display text-lg font-bold">Where the evidence is thin</h2>
        <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">
          {gaps.length} of 12 areas have no regional economics. Closing these is field work
          — someone gathering cost-of-production figures from growers — not something the
          app can do by itself.
        </p>
        <ul className="mt-3 divide-y divide-ink/10 text-sm dark:divide-ink-dark/10">
          {gaps.map((view) => (
            <li key={view.area.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
              <Link
                to={`/areas?area=${view.area.id}`}
                className="font-medium text-primary underline dark:text-primary-soft"
              >
                {view.area.name}
              </Link>
              <span className="flex items-center gap-2">
                <span className="text-ink/50 dark:text-ink-dark/50">{view.region.name}</span>
                <QualityPill quality={view.evidence} />
              </span>
            </li>
          ))}
        </ul>
        {old.length > 0 ? (
          <p className="mt-3 text-sm text-ink/70 dark:text-ink-dark/70">
            Regional figures that are more than ten years old:{" "}
            {old.map((view) => `${view.area.name} (${view.oldestDataYear})`).join(", ")}.
          </p>
        ) : null}
      </Card>

      {groups.map(({ region, areas }) => (
        <Card key={region.id}>
          <h2 className="font-display text-lg font-bold">{region.name}</h2>
          <ul className="mt-2 divide-y divide-ink/10 text-sm dark:divide-ink-dark/10">
            {areas.map((view) => (
              <li
                key={view.area.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <Link
                  to={`/areas?area=${view.area.id}`}
                  className="font-medium text-primary underline dark:text-primary-soft"
                >
                  {view.area.name}
                </Link>
                <span className="flex items-center gap-2">
                  <span className="text-ink/50 dark:text-ink-dark/50">
                    {view.oldestDataYear === null
                      ? "no figures"
                      : `oldest figure ${view.oldestDataYear}`}
                  </span>
                  <QualityPill quality={view.evidence} />
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ))}

      {outside.length > 0 ? (
        <Card>
          <h2 className="font-display text-lg font-bold">Outside the AgAims areas</h2>
          <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">
            {outside.map((district) => district.name).join(", ")} is kept as reference data.
            It is not one of the 12 areas and is not forced into one.
          </p>
        </Card>
      ) : null}

      <ExportButton />
    </>
  );
}

function AreaDetail({ view }: { view: AreaView }) {
  return (
    <>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold">{view.area.name}</h2>
          <QualityPill quality={view.evidence} />
        </div>
        <p className="mt-1 text-sm text-ink/60 dark:text-ink-dark/60">{view.region.name}</p>
        <EvidenceNotice view={view} />
      </Card>

      {view.districts.map((entry) => (
        <DistrictCard key={entry.district.id} entry={entry} />
      ))}

      <Link
        to="/areas"
        className="inline-flex min-h-11 items-center text-primary underline dark:text-primary-soft"
      >
        All areas
      </Link>
    </>
  );
}

/** Says plainly what the area does and does not have. */
function EvidenceNotice({ view }: { view: AreaView }) {
  if (view.evidence === "none") {
    return (
      <p className="mt-3 rounded-xl border border-danger/40 bg-danger/10 p-3 text-sm">
        <span className="font-medium text-danger">No economics for this area.</span> No
        budget has been published for it at any level, so there is no figure to show.
      </p>
    );
  }
  if (view.evidence === "state_proxy") {
    return (
      <p className="mt-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
        <span className="font-medium text-warning">No regional economics for this area.</span>{" "}
        The only figures are state-wide, standing in for the district. They are listed
        below as stand-ins and should not be quoted as this area's margin.
      </p>
    );
  }
  return view.sharedBetweenDistricts ? (
    <p className="mt-3 rounded-xl border border-accent/50 bg-accent/10 p-3 text-sm">
      <span className="font-medium">Two districts speak for this area.</span> Their figures
      are shown separately and are not averaged.
    </p>
  ) : null;
}

function DistrictCard({ entry }: { entry: AreaDistrictView }) {
  const { district, coverage, figures } = entry;
  const note = districtAreaMap.find((item) => item.districtId === district.id)?.note;
  return (
    <Card>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="font-display font-bold">{district.name}</h3>
        <QualityPill quality={district.dataQuality} />
      </div>
      <p className="mt-1 text-sm text-ink/70 dark:text-ink-dark/70">
        {coverage === "full" ? "Covers the whole area." : "Covers part of this area."}
        {note ? ` ${note}` : ""}
      </p>

      {figures.length === 0 ? (
        <p className="mt-3 text-sm text-ink/60 dark:text-ink-dark/60">
          No gross margin published for this district.
        </p>
      ) : (
        <ul className="mt-3 divide-y divide-ink/10 text-sm dark:divide-ink-dark/10">
          {figures.map((figure) => (
            <li key={figure.segment} className="flex flex-wrap items-baseline gap-2 py-2">
              <span className="font-medium">{figure.segmentLabel}</span>
              <span className="tabular-nums">{money(figure.marginHa)}/ha margin</span>
              <span className="text-ink/50 dark:text-ink-dark/50">
                {figure.sourceYear ?? "year not stated"}
              </span>
              {figure.quality === "state_proxy" ? (
                <span className="text-warning">state-wide stand-in</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <Link
        to={`/?district=${district.id}`}
        className="mt-3 inline-flex min-h-11 items-center text-primary underline dark:text-primary-soft"
      >
        Open in the calculator
      </Link>
    </Card>
  );
}

function download(contents: string, type: string, filename: string): void {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

const buttonClass =
  "min-h-11 rounded-lg border border-ink/20 px-3 text-sm font-medium dark:border-ink-dark/20";

function ExportButton() {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        type="button"
        onClick={() =>
          download(areaCoverageCsv(), "text/csv;charset=utf-8", "spudonomics-area-coverage.csv")
        }
        className={buttonClass}
      >
        Download area coverage (CSV, with source years)
      </button>
      <button
        type="button"
        onClick={() =>
          download(
            JSON.stringify(areaCoverageRows(), null, 2),
            "application/json",
            "spudonomics-area-coverage.json",
          )
        }
        className={buttonClass}
      >
        Download as JSON (for other tools)
      </button>
    </div>
  );
}
