# Spudonomics roadmap — joining the AgAims framework (PT26001)

Spudonomics is a reference dataset, not a data-collecting tool: no people, no
database, no backend. Its place in the PT26001 framework is to give the M&E
economic context for each AgAims area, and to do it without ever
overstating what the sources published. This is a backlog, not a schedule.

Status key: `[ ]` not started · `[~]` in progress · `[x]` done.

## How it fits

The framework has two layers, defined in `docs/REGIONS.md` (source of truth:
the PT26001 proposal, Table 1): **7 regions** and **12 areas**. Spudonomics
organises its data by **district** (the `Region` type here, 14 of them). The
crosswalk in `src/data/area-map.json` joins the two. Nothing else about the app
changes.

Its outputs to the wider framework are aggregate only: which areas have
regional economics, which have state-level stand-ins, which have nothing.

## Guardrails

1. **A figure the source never published is unknown, not zero.** Every rule in
   `CLAUDE.md` still applies, and the crosswalk must never be used to fill a gap
   by borrowing a neighbour's number.
2. **A district that covers part of an area says so** (`coverage: "partial"`).
   When two districts share an area, show both or choose explicitly; never
   average them.
3. **A district outside the AgAims areas stays as reference data** (Perth /
   Myalup). Do not force it into an area.
4. **No personal data comes in.** This app holds published budgets only. Grower
   costs collected through AgAims go to the consultation tool or the CRM
   under their own rules, not here.
5. `docs/REGIONS.md` and `src/data/areas.json` change together, and only after
   the shared source of truth changes.

## S1 — Crosswalk (done)

- [x] `src/data/areas.json` — 7 regions and 12 areas, a copy of `REGIONS.md`.
- [x] `src/data/area-map.json` — each district mapped to its areas, with
      coverage and a note.
- [x] `src/data/areaMap.ts` — validated with Zod, plus lookups in both
      directions.
- [x] `src/data/areaMap.test.ts` — every district mapped once, every area
      covered, no unknown ids, shared areas never marked full.
- [x] Run `npm run test`, `npm run typecheck` and `npm run lint`, and fix
      anything they flag. One test was wrong (it checked region and area ids
      together, but Ballarat is both), and lint was reading a stray Vite cache
      folder (`client/`), now ignored.

## S2 — Wording and structure (done)

- [x] Say "district" instead of "region" in the UI and docs where it refers to
      Spudonomics' own 14 units, to avoid clashing with the 7 AgAims
      regions. (The `Region` type and `regions.json` keep their names;
      renaming them is optional and touches every import.)
- [x] Update `docs/adding-a-region.md` to say a new district needs an entry in
      `area-map.json` (already enforced by a test: every district must be
      mapped).
- [x] Add a drift check that `areas.json` matches the table in
      `docs/REGIONS.md`, so the two copies cannot diverge
      (`areaMap.test.ts`, "docs/REGIONS.md").

## S3 — Area view (done)

The Areas page (`src/pages/AreasPage.tsx`, logic in `src/services/areaView.ts`).

- [x] Let a reader pick a AgAims area (grouped by region) as well as a
      district. The calculator also opens on a district from `?district=<id>`.
- [x] For an area, show each linked district's figures with its data quality,
      source year and coverage ("Covers Lockyer Valley only").
- [x] For an area with no regional economics, say so plainly instead of
      showing a stand-in number as if it were local. A state-wide stand-in is
      listed as one. Two districts sharing an area are shown side by side.
- [x] Show which areas have no economics of any kind.

## S4 — Gaps and freshness (one decision left)

Eight of the 14 districts have no regional economics, and the Queensland and SA
budgets are old (1998 and 2005 data). Refreshing them is field work, not coding.

- [x] List the areas that matter most for PT26001 and have the weakest data.
      The Areas page lists every area without regional economics, worst first:
      Ballarat and Gippsland / Thorpdale have nothing at all, and Mallee /
      Loxton, Murray Bridge / Adelaide Plains, Mt Gambier / Warrnambool and
      Manjimup / Jindong have only a state-wide stand-in. It also lists regional
      figures more than ten years old (Atherton, Lockyer Valley and Bundaberg,
      Riverina).
- [ ] **Decision for Peter, not code:** whether AgAims regional reps can
      gather cost-of-production information during 2027, and where it would be
      held. It must not be stored here as if it were a published budget.
- [x] Label data age on every screen and in any export. The Areas page shows
      the oldest figure per area; the CSV and JSON carry the source year on
      every row.

## S5 — Exchange with the other tools (export built, agreement pending)

- [x] An aggregate export: one row per area and district, with coverage, data
      quality and source year. No people, nothing sensitive. Download as CSV or
      JSON from the Areas page (`areaCoverageCsv`, `areaCoverageRows`). A margin
      nobody published is empty in the CSV ("not published") and `null` in the
      JSON, never 0.
- [ ] Agree its format in the integration contract shared with the CRM, the
      consultation tool and Fieldwork. All four export aggregates in agreed
      columns so the review pack template can read them. (Needs the other
      three projects; the columns here are a proposal until then.)
- [ ] Provide Fieldwork with published gross margins by area to replace its
      placeholder economics (a data file it reads, not a live link). The JSON
      export is that file; Fieldwork has to be changed to read it.
- [ ] Decide how the AgAims M&E cites Spudonomics for "changes in practice
      lead to improvements in economic outcomes", including the caveat that
      gross-margin budgets are published figures, not observed changes.
      (A decision for Peter.)

## Open questions

- ~~When two districts share an area (Mallee), which budget does an area view
  show by default?~~ Both, side by side, never averaged.
- Is Perth / Myalup worth keeping visible in a AgAims-facing view, given it
  is outside the proposal's areas?
- Should NSW be split into Riverina, Tablelands and Coast areas once activity
  starts? (Open question in `REGIONS.md`.)
