# Spudonomics

Regional potato gross margin baselines for Australia. Pick a region and market
segment, see what the published budget actually reports, then edit any figure to
model your own costs.

Built for PotatoLink and the Lifecycles project. Sister project to
[PotatoLink Fieldwork](https://github.com/pob099-maker/potatolink-fieldwork).

## The point

Australian potato economics is thin and patchy in the public domain. Fourteen
growing districts are covered here; only five have a properly itemised regional
budget, three have nothing at all, and the rest are state-wide averages standing
in for a district.

That unevenness is the hard part. A calculator that renders every gap as `$0`
looks confident and precise and is wrong — so this one shows a gap as a gap,
and says which figures the source never published.

## Running it

```bash
npm install
npm run dev
```

Then <http://localhost:5190>.

## The data

Fourteen regions and thirty-two published budgets live in `src/data/` as JSON,
in version control rather than a database. They are validated against Zod
schemas by the test suite, so a mistyped figure fails CI instead of reaching a
reader — and every change to a number arrives with an author, a date and a diff.

Adding or correcting a figure is a pull request. See
[docs/adding-a-region.md](docs/adding-a-region.md).

Data quality is labelled throughout:

| Label | Meaning |
| --- | --- |
| Regional figures | The source published this for this district |
| State-wide stand-in | A state figure standing in for the district |
| No published economics | Nothing usable exists at any level |

## How a margin is worked out

Where a budget publishes a total variable cost, **that total is used**, even
when it itemises only part of the breakdown. The un-itemised remainder stays
visible on screen rather than being dropped.

Only once you edit a figure does the calculator start summing the parts —
because at that point they are your numbers, and what you leave blank is a cost
you are saying you do not carry.

This matters more than it sounds. The prototype this replaces summed the
itemised lines and treated every missing line as zero, which overstated the
gross margin on eight of the fourteen regions:

| Region | Prototype | Published source |
| --- | --- | --- |
| SA — Virginia / Riverland / Limestone Coast | $13,625/ha | $1,438/ha |
| WA — Perth / Myalup | $19,400/ha | $7,900/ha |
| WA — Manjimup | $15,570/ha | $6,606/ha |
| Tas — Southern seed | $19,140/ha | $9,800/ha |
| Tas — Northern seed | $18,160/ha | $11,110/ha |
| Tas — Southern processing | $10,404/ha | $8,310/ha |

South Australia was also displaying a breakeven yield of 0 t/ha and a breakeven
price of $0/t, because the cost side was empty.

## Checks

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

CI runs all four on every pull request.
