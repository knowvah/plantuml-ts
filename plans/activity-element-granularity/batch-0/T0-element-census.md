# T0 — Pin the pre-swap element census

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-element-granularity`, cut from `804232d4`. A faithful
TypeScript port of PlantUML; the Java at `~/git/plantuml` is the spec.
**You write no `src/`.** You measure and pin.

**Orchestrator-executed** — see the batch overview for why.

## Task
Measure every fixture in `oracle/goldens/svg-activity/diff-baseline.json`
with `status:"baseline"` (268 of them) through the same seams the gates use
— `renderFixtureActivity` + `DeterministicMeasurer` + `fixtureIncludeStore()`
— and pin, per fixture:

- ours-vs-jar counts for `line`, `polyline`, `text`, `tspan`, `circle`,
  `ellipse`, `polygon`, `rect`, `path`, `a`, `image`
- the `svg/g[][childCount]` delta (ours − jar), via `compareSvg`, not a
  hand-rolled tag counter
- the fixture's current `weightedScore`

Read the jar side from each fixture's committed `in.svg` under
`test-results/dot-cache/activity/<slug>/`.

**Assert the aggregate `weightedScore` is exactly 108447.** That is the value
`main` was merged at (`804232d4`). If it differs, the tree has moved under
you — STOP and report rather than pinning a drifted floor.

## Write-set
- `oracle/goldens/svg-activity/element-baseline.json`
- `.agent-notes/aeg-T0.md`

Nothing else. Nothing under `src/`. Not `diff-baseline.json` — that is T4's.

## Read-set
- `plans/activity-element-granularity/decisions.md` — D6
- `oracle/goldens/svg-activity/diff-baseline.json` — the 268 slugs and their
  current scores
- `tests/oracle/svg-conformance/render-fixture-activity.ts` — the helper
- `tests/oracle/svg-conformance/compare.ts:388-404` — how `childCount` diffs
  are built and weighted

## Architecture decisions
[D6] pin before the swaps, or the descent is unmeasurable.

## Interface contracts
Consumed by T1, T2, T3 (each checks its own element's counts) and T4:
```json
{ "measuredAt": "", "measuredAgainstCommit": "",
  "aggregateWeightedScore": 108447,
  "fixtures": [{ "slug": "",
    "tags": { "line": {"ours":0,"jar":0}, "polyline": {"ours":0,"jar":0} },
    "childCountDelta": 0, "weightedScore": 0 }] }
```

## Acceptance criteria
- Given the 268 baselined fixtures, when measured, then every one records
  ours-vs-jar counts for all eleven tags and its `childCountDelta`.
- Given the aggregate, then it is exactly **108447**, or the task STOPS.
- Given the pin, then `polyline.ours` summed is **1666** and `line.jar`
  summed is **3336** — the census numbers this mission is built on. A
  material difference means the corpus moved; report it.
- Given `git diff --name-only`, then only the write-set changed.

## Observability
N/A — no new observable operations. This pin IS the instrument.

## Rollback
**Reversible.** One new JSON; deleting it reverts the task.

## Quality bar
All four gates green (`npm test` with `Test Files` == 683, `npm run
typecheck`, `npm run lint`, `npm run build`). They should be untouched —
this task changes no behavior.

## Commit
`test(aeg-T0): pin the pre-swap activity element census`
