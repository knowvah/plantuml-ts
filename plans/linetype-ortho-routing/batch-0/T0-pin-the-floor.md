# T0 — Pin the pre-change state of all 8 fixtures, individually

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/linetype-ortho-routing`, cut from `76312623`. A faithful TypeScript
port of PlantUML; the Java at `~/git/plantuml` is the spec.
**You write no `src/`.** You measure and pin.

**Orchestrator-executed** — see the batch overview for why.

## Task
Measure and pin, per fixture, for all 8:

| type | slug |
|---|---|
| class | `bujedi-30-cize673`, `dimisi-54-dula946`, `gamevo-26-runo973`, `jakapi-64-tine258`, `kuxato-79-muno809` |
| component | `zosaxo-93-nici652` |
| state | `kejabo-83-vinu490`, `pavuzo-79-zodu430` |

For each, record:
- **`jarSplines` / `jarForcelabels`** — read out of that fixture's own cached
  `test-results/dot-cache/<type>/<slug>/svek-*.dot`. This is the TARGET.
- **`bbW` / `bbH`** — the layout bounding box our pipeline produces today.
- **`dotEqual` and `maxDelta`** — from `tests/oracle/svg-conformance/
  parity-{class,state}.json` / `parity.json`.
- **`sizeBacklog`** — its `oracle/goldens/state/size-backlog.json` entry,
  where one exists (state only: both state fixtures have one).

Also record the mission's headline number as measured today:
`npx jiti scripts/measure-composite-declared-size.ts pavuzo-79-zodu430`
→ scope 2 width idx 2 `deltaPx` (expected `-1.579968`).

## Write-set
- `oracle/goldens/svg-conformance/splines-baseline.json`
- `.agent-notes/lor-T0.md`

Nothing else. Nothing under `src/`.

## Read-set
- `plans/linetype-ortho-routing/decisions.md` — all six
- `.agent-notes/gvi17-splines-never-emitted.md` — the diagnosis this pins against
- `test-results/dot-cache/<type>/<slug>/svek-*.dot` — the 8 jar DOTs
- `tests/oracle/svek-dot.ts:239-256` — `parseSvekDot` / `dotInputToStructural`

## Architecture decisions
None consumed. This task establishes the evidence D1–D6 will be judged against.

## Interface contracts
Consumed by T8:
```json
{ "measuredAt": "", "measuredAgainstCommit": "",
  "pavuzoDeltaPx": -1.579968,
  "fixtures": [{ "slug": "", "type": "",
    "jarSplines": "ortho|polyline", "jarForcelabels": true,
    "bbW": 0, "bbH": 0, "dotEqual": true, "maxDelta": 0,
    "sizeBacklog": 0 }] }
```

## Acceptance criteria
- Given the 8 fixtures, when measured, then each records all eight fields
  above, and `jarSplines` is non-null for every one (that is what put it in
  the set).
- Given each fixture's jar DOT, then `jarForcelabels` is `true` for every
  `ortho` fixture and absent/false for every `polyline` one — confirming
  [D4]'s asymmetry against real data before any code relies on it.
- Given `pavuzo-79-zodu430`, then the recorded delta is `-1.579968 px`. A
  materially different value means the tree moved — STOP and report.
- Given `git diff --name-only`, then only the write-set changed.

## Observability
N/A — no new observable operations. This pin IS the instrument.

## Rollback
**Reversible.** One new JSON; deleting it reverts the task.

## Quality bar
All four gates green (`npm test` with `Test Files` == 684, `npm run
typecheck`, `npm run lint`, `npm run build`). They must be UNCHANGED — this
task alters no behavior.

## Commit
`test(lor-T0): pin the pre-change state of the 8 splines fixtures`
