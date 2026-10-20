# Adding or correcting a figure

Everything the app shows lives in three files:

- `src/data/regions.json` — the fourteen districts (the file and the `Region`
  type keep their old names; in the app and these docs they are *districts*, to
  avoid clashing with the 7 AgAims regions)
- `src/data/cost-profiles.json` — one entry per district and market segment
- `src/data/area-map.json` — which AgAims areas each district speaks for

Editing them is a pull request, which is deliberate: these figures carry
citations, and a change to one should be reviewable.

## The rule

**Leave a field `null` if the source did not publish it.** Do not put `0` in to
tidy up the file. Zero is a real answer — "this costs nothing" — and the whole
app is built on being able to tell the two apart.

## Adding a segment to an existing district

Add an entry to `cost-profiles.json`:

```json
{
  "regionId": "tas-north",
  "segment": "crisping",
  "segmentLabel": "Processing - Crisping",

  "yieldTHa": 48.5,
  "priceT": 340,
  "grossIncomeHa": 16490,

  "seedCostHa": 1600,
  "fertiliserCostHa": null,

  "totalVariableCostHa": 9800,
  "grossMarginHa": 6690,

  "dataQuality": "regional",
  "sourceName": "NRE Tasmania Crop Gross Margins - High Rainfall",
  "sourceUrl": "https://nre.tas.gov.au/Documents/Crop%20GMs_High%20Rainfall.xlsx",
  "sourceYear": "2020",
  "notes": "Anything a reader needs to know to use these numbers honestly."
}
```

The fields that matter most:

**`totalVariableCostHa` and `grossMarginHa`** — the source's own totals. If the
budget publishes them, put them in even when you cannot itemise the breakdown.
They are what the calculator reports, and leaving them out is what caused the
prototype to overstate every partly-itemised region.

**`grossIncomeHa`** — the published revenue. Several budgets price by grade or
by the bag, so `yieldTHa × priceT` will not reproduce it. Where that is the
case, fill in gross income and leave `priceT` null rather than inventing a
blended rate.

**`dataQuality`** — `regional` if the source published it for this district,
`state_proxy` if it is a state figure standing in, `none` if there is nothing.

**`notes`** — where you tell the reader what the numbers cannot tell them: how
old the budget is, what the pricing structure was, what the source itemised and
what it did not. The most useful field in the file.

**`unpaidFamilyLabourHrHa` and `unpaidFamilyLabourValueHa`** — unpaid family or
owner-operator time, kept separate from every other cost line on purpose. No
published budget in this dataset counts it, so it must never be summed into
`totalVariableCostHa`, `grossMarginHa`, or any `COST_LINES` entry — doing that
would misstate a source's own figures with a number it never reported. Leave
both `null` unless a grower/agronomist survey response actually gives you an
hours or dollar figure for this district and segment; the calculator only shows
its separate "economic margin" once one exists, and adding it there never
changes the published cost or margin shown above it.

## Adding a whole district

Add to `regions.json` first:

```json
{
  "id": "qld-bundaberg",
  "name": "Queensland — Bundaberg",
  "state": "Queensland",
  "sortOrder": 15,
  "dataQuality": "none",
  "productionShare": "How much of the crop this district represents",
  "summary": "One or two sentences on what data exists, and what does not."
}
```

Then add at least one profile for it. A district with no profile fails the test
suite, because it would appear in the dropdown and produce an empty screen.

Then add it to `area-map.json`, in the same pull request:

```json
{
  "districtId": "qld-bundaberg",
  "areas": [{ "areaId": "lockyer-bundaberg", "coverage": "partial" }],
  "note": "Bundaberg only; the Lockyer Valley is not covered."
}
```

- `coverage` is `full` only if the district's figures describe the whole area.
  Two districts in one area are both `partial`; the tests enforce it.
- A district outside all 12 AgAims areas gets `"areas": []` and a note
  saying why. Do not force it into one.
- The crosswalk only says where a figure applies. It must never be used to fill
  a gap in one area with a neighbour's number.

The test suite fails if a district is missing from `area-map.json`, if it points
at an area that does not exist, or if `src/data/areas.json` has drifted from the
table in `docs/REGIONS.md`. Change `REGIONS.md` first, then `areas.json`.

If no economics exist for the district at all, that is a legitimate entry —
set `dataQuality` to `none`, fill in whatever context you have, and let the app
say so. A visible gap is more useful than a number nobody can trust.

## Before you open the pull request

```bash
npm run test
```

The suite validates both files against the schemas and checks that every
profile cites a source, every district offers a segment, and no district-and-segment
pair is duplicated. CI runs it on the pull request too.
