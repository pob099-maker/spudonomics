# Hibernated — 19 August 2026

Development stopped here. Parked rather than abandoned: everything needed to
bring it back is in this repository, and unusually for a hibernated project,
**this one still works with nothing switched on**.

## What this was

Regional potato gross margin baselines for Australia — fourteen growing
districts, thirty-two published budgets, every figure traceable to its source.

Live at the time of hibernation:
<https://pob099-maker.github.io/spudonomics/>

## Why nothing will rot

The dataset lives in `src/data/*.json`, in this repository, not in a database.
That was a deliberate choice at rebuild time and it pays off here: there is no
Supabase project to pause, no key to expire, no table to lose. `npm install &&
npm run dev` gives you the whole app, data included, years from now.

The old Supabase project (`spudonomics`, `umrvncdcgprtgagiuabc`) is redundant —
the app stopped reading from it at the rebuild. It can be deleted without
consequence.

## What this replaced, and why it matters

A Perplexity-hosted prototype that overstated the gross margin on eight of the
fourteen regions, because it summed itemised cost lines and treated every line
the source never published as $0. South Australia reported a $13,625/ha margin
against a published $1,438/ha — an 848% overstatement — with a breakeven yield
of 0 t/ha.

The engine in `src/services/grossMargin.ts` exists to prevent exactly that: a
cost the source never published is unknown, not zero. If this is ever revived or
rebuilt on another stack, that rule is the thing to carry across. The test suite
asserts it against every profile in the dataset.

## If this is revived commercially

Better positioned than the other two, because the hard part is the data rather
than the code — thirty-two budgets, read out of government and industry sources,
each with its provenance and its caveats recorded in the `notes` field.

Two things to be careful about:

- **The sources are public but not yours.** NRE Tasmania, NSW DPI, PIRSA,
  DAFWA and Queensland DPI budgets are cited and linked, which is fine for a
  reference tool. Redistributing them as a commercial dataset is a different
  question and worth checking per source.
- **The figures age.** The Queensland budgets are from 1998 and the South
  Australian ones from 2005 data. The app says so on every screen. A commercial
  version would need them refreshed, which is field work rather than coding.

The branding is PotatoLink — palette in `src/index.css`, the potato mark in
`Layout.tsx`, the descriptor in the header — and would need removing.
