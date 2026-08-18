# Adding or correcting a figure

Everything the app shows lives in two files:

- `src/data/regions.json` — the fourteen districts
- `src/data/cost-profiles.json` — one entry per region and market segment

Editing them is a pull request, which is deliberate: these figures carry
citations, and a change to one should be reviewable.

## The rule

**Leave a field `null` if the source did not publish it.** Do not put `0` in to
tidy up the file. Zero is a real answer — "this costs nothing" — and the whole
app is built on being able to tell the two apart.

## Adding a segment to an existing region

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

## Adding a whole region

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

Then add at least one profile for it. A region with no profile fails the test
suite, because it would appear in the dropdown and produce an empty screen.

If no economics exist for the district at all, that is a legitimate entry —
set `dataQuality` to `none`, fill in whatever context you have, and let the app
say so. A visible gap is more useful than a number nobody can trust.

## Before you open the pull request

```bash
npm run test
```

The suite validates both files against the schemas and checks that every
profile cites a source, every region offers a segment, and no region-and-segment
pair is duplicated. CI runs it on the pull request too.
