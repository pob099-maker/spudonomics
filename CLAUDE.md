# Spudonomics — Project Instructions

## What this project is

Regional potato gross margin baselines for Australia, drawn from published
budgets, with every figure traceable to its source. Sister project to
PotatoLink Fieldwork; same stack, same conventions, separate deployment.

It replaces a Perplexity-hosted prototype that overstated the gross margin on
eight of fourteen regions — by 848% in South Australia — by summing itemised
cost lines, treating every un-itemised line as $0, and discarding the source's
own published total. Everything below follows from not doing that again.

## The rule this codebase exists to enforce

**A figure the source never published is unknown, not zero.**

- `null` means "not published". It is never coerced to `0`.
- Where a budget publishes a total variable cost, that total is authoritative
  even when the breakdown is partial. Never re-derive it by summing parts.
- Never show a breakeven, a margin per tonne, or any derived figure that a
  missing cost would silently flatter.
- The UI renders an absent figure as an em dash and says "not published".

## Tech stack

- Frontend: React 18 + TypeScript (strict mode)
- Styling: Tailwind CSS v4, PotatoLink brand tokens in `src/index.css`
- Validation: Zod, run against the dataset in the test suite
- Build: Vite
- Tests: Vitest
- Package manager: npm
- Hosting: GitHub Pages, hash routing

There is deliberately **no backend and no database**. See below.

## Commands

```bash
npm run dev          # Start dev server (port 5190)
npm run build        # Production build
npm run test         # Run tests
npm run lint         # ESLint check
npm run typecheck    # TypeScript strict check
```

## Why the data lives in the repo

The dataset is published figures carrying citations, edited rarely and reviewed
carefully. Version control is the audit trail this kind of data needs: every
change to a number arrives with an author, a date and a diff.

It also removes a whole class of risk. The prototype kept these figures in
Supabase with row-level security disabled, so numbers presented as sourced were
editable by anyone holding the project key. A JSON file in git cannot be
rewritten without a commit.

Editing a figure is a pull request. That is the correct amount of friction for
a number that carries a citation.

## Critical rules

1. MUST use TypeScript strict mode. No `any` without explicit justification.
2. MUST use named exports. NEVER use default exports.
3. MUST keep `null` and `0` distinct in every cost and revenue field.
4. MUST validate `src/data/*.json` through the Zod schemas — the test suite
   does this, so a bad edit fails CI rather than reaching a reader.
5. MUST cite a source for any profile carrying figures (enforced by a test).
6. MUST test on mobile viewport (375px) before considering a feature complete.
7. MUST use semantic HTML. NEVER use `div` where a semantic element exists.
8. MUST NOT present a derived figure when its inputs are incomplete.

## Coding conventions

- Use `interface` for object types, `type` for unions.
- Colocate tests as `*.test.ts` next to source.
- Pure functions in `src/services/`; no side effects in the margin engine.
- Formatting money and quantities goes through `src/services/format.ts`, which
  renders unknown as an em dash.

## Deliberate departures from Fieldwork

Fieldwork requires React Hook Form for all forms. This app has no form: the
calculator is a set of controlled numbers driving a pure function, with no
submission, no persistence and no validation-before-write. Plain state is used
instead, on purpose.

Fieldwork's offline store, Supabase client and sync engine have no counterpart
here, because there is nothing to sync.

## What NOT to do

- NEVER coerce a missing figure to zero, anywhere, for any reason.
- NEVER re-derive a published total from its parts.
- NEVER add a region to the dropdown without a profile — every region must
  offer at least one segment (enforced by a test).
- NEVER use localStorage or sessionStorage.
- NEVER present a state-wide figure as a regional one without the
  `state_proxy` quality flag.

## Brand

Follows the PotatoLink brand guidelines, shared with Fieldwork.

- Colours are tokens in `src/index.css`. Use the names (`primary`, `accent`,
  `paper`, `ink`), never raw hex in components.
- Primary is rich brown; gold/tan is the accent; backgrounds are warm cream.
- `h1`/`h2` render bold uppercase — write headings in sentence case and let the
  stylesheet do it.
