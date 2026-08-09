# PotatoLink Regional Cost & Yield Survey — Draft Form

**Purpose:** Fill the four Spudonomics data gaps — Victoria (Ballarat/Central, Gippsland/Thorpdale, Mallee) and NSW (Central/Southern Tablelands) — where no public yield, price, or cost-per-hectare data exists.

**Intended respondents:** Regional agronomists, grower group coordinators, processor field staff, or growers who are comfortable sharing directly. Response bands (not exact dollar figures) are used throughout to lower the disclosure barrier — this was a deliberate design choice, matching how PotatoLink's earlier grower surveys avoided asking for exact financial figures.

**Governance rule:** Don't publish a region's numbers into Spudonomics until at least 3 independent responses are received for that region. Below that threshold, treat responses as provisional/internal only.

**Range calibration note:** Bands below are anchored to the two Australian datasets with itemised costs — the [Tasmanian DPIPWE Nov 2020 budgets](https://www.google.com/search?q=Tasmania+potato+gross+margin+budget+DPIPWE) and the [NSW DPI 2013 gross margin budgets](https://archive.dpi.nsw.gov.au/content/agriculture/gross-margin-budgets/vegetable) (2012 prices) — adjusted upward for the well-documented cost inflation since 2019 ([Mok & Johns 2025, Australasian Agribusiness Perspectives](https://bpb-ap-se2.wpmucdn.com/blog.une.edu.au/dist/d/1339/files/2025/06/AAP-Vol-28-Paper-6-Mok-and-Johns.pdf) reports average production costs rose 110% between 2019 and 2023 while prices rose only 4%). Treat these as starting bands to be widened/narrowed once real responses come in — they are illustrative, not validated.

---

## Section A — Respondent & context

| # | Field | Type | Options |
|---|---|---|---|
| A1 | Your role | Multiple choice | Grower / Agronomist or adviser / Regional coordinator or rep / Processor field staff / Other |
| A2 | Region you're reporting on | Multiple choice | Victoria — Ballarat / Central · Victoria — Gippsland / Thorpdale · Victoria — Mallee · NSW — Central / Southern Tablelands |
| A3 | Market segment | Multiple choice | Fresh / table · Processing · Seed |
| A4 | Season / year this data reflects | Short answer | e.g. "2025–26" |
| A5 | Basis for your figures | Multiple choice | Direct observation (my own farm) · Estimate from one grower I work with closely · Estimate averaged across several growers I work with · Industry/general knowledge estimate |
| A6 | Consent | Multiple choice | I consent to this (anonymised, regionally-aggregated) data being used in PotatoLink's Spudonomics tool |

---

## Section B — Yield & price

| # | Field | Type | Range bands |
|---|---|---|---|
| B1 | Yield (t/ha) | Multiple choice | Under 20 · 20–30 · 30–40 · 40–50 · 50–60 · Over 60 |
| B2 | Price received ($/t) | Multiple choice | Under $300 · $300–450 · $450–600 · $600–750 · Over $750 |

---

## Section C — Cost inputs ($/ha)

One question per category, all using the same "band" pattern. Every field includes an explicit **"Not applicable"** option so growers without irrigation, contract harvesting, etc. aren't forced into an inaccurate band.

| # | Field | Range bands |
|---|---|---|
| C1 | Seed | Under $1,500 · $1,500–2,000 · $2,000–2,500 · $2,500–3,000 · Over $3,000 |
| C2 | Fertiliser | Under $1,000 · $1,000–1,500 · $1,500–2,000 · $2,000–2,500 · $2,500–3,000 · Over $3,000 |
| C3 | Crop protection (chemicals) | Under $300 · $300–600 · $600–900 · $900–1,200 · Over $1,200 |
| C4 | Irrigation energy / water | Not applicable (dryland) · Under $150 · $150–300 · $300–450 · $450–600 · Over $600 |
| C5 | Machinery & fuel (owned equipment) | Under $500 · $500–1,000 · $1,000–1,500 · $1,500–2,000 · Over $2,000 |
| C6 | Contract operations (planting/harvest/spraying) | Not applicable (owned equipment only) · Under $1,000 · $1,000–2,000 · $2,000–3,000 · $3,000–4,000 · Over $4,000 |
| C7 | Labour (paid, excluding owner-operator time) | Under $500 · $500–1,000 · $1,000–1,500 · $1,500–2,000 · Over $2,000 |

---

## Section D — Optional context (free text)

| # | Field | Type |
|---|---|---|
| D1 | Anything unusual about this season that affected costs or yield (e.g. drought, disease outbreak, price spike)? | Long answer, optional |
| D2 | Anything else useful for interpreting these figures? | Long answer, optional |

---

## Notes for build

- **Region-specific context to mention in the form intro**, since it affects what "normal" looks like:
  - **Ballarat/Central** — certified seed district; higher seed-cost intensity likely.
  - **Gippsland/Thorpdale** — Victoria's most potato-intensive district by area; both fresh and seed production.
  - **Mallee** — groundwater and Wimmera-Mallee pipeline irrigation common; irrigation costs likely higher and more variable than other Victorian regions.
  - **NSW Tablelands** — entirely dryland-adjacent to irrigated depending on property; entire crop sold fresh, unlike Riverina's processing/fresh split.
- **Multiple choice, not checkboxes**, for all range questions — forces one answer, keeps analysis simple (can compute a rough regional average from the midpoint of the most common band).
- Once ~3+ responses land per region, take the modal (most common) band per field, convert the band midpoint to a $/ha figure, and enter it into the Spudonomics Admin → Data Sources page as a new region baseline with a "regional (grower/agronomist survey)" data-quality tag — separate from the "state proxy" and "regional (published budget)" tags already used for other regions, so users can see it's primary rather than published data.

---

*Draft only — not yet built as a live Google Form. Ranges are illustrative starting points calibrated from Tasmania (2020) and NSW (2012, inflation-adjusted) budgets; they are not a claim about actual Victorian or Tablelands costs.*
