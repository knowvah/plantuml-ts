# T7 — Re-measure, re-pin, close out

**Agent:** orchestrator (baseline JSON writes are reserved —
`scripts/repin-sequence-baselines.ts:3-8`)
**Depends on:** T5, T6

## Context

Read [`../README.md`](../README.md) and [`../decisions.md`](../decisions.md).
[D9] governs the gated quantity: `weightedScore`, never `diffCount`.

## Read-set

- `oracle/goldens/svg-activity/style-baseline.json` (T0's pin)
- `oracle/goldens/svg-activity/diff-baseline.json`
- `oracle/goldens/svg-activity/diff-census.json` — the `61677` figure and
  the per-path weights the exit bar is stated against
- `plans/activity-element-granularity/batch-2/T4-repin-recensus.md` — the
  direct precedent for this task's shape
- Every task's decision-journal entry

## Write-set

- `oracle/goldens/svg-activity/diff-baseline.json`
- `oracle/goldens/svg-activity/style-baseline.json`
- `oracle/goldens/svg-activity/diff-census.json`
- `plans/activity-style-defaults/README.md` (append a Close-out section)
- `planning/next-missions.md` (resolve or re-scope the two filed follow-ons)
- `.agent-notes/asd-T7.md`

## Task

1. Re-measure the corpus. Report Σ`weightedScore` against `61677`, and the
   post-mission weight of `svg/g[]/text[]/@font-size` against `1316` and
   `svg/g[]/line[]/@stroke-width` against `2319`.
2. Re-run T0's style census and report the font-size histogram of our
   render beside the jar's.
3. **Diff the baseline JSON after re-pinning and name every pin that ROSE.**
   A re-pin silently adopts a regression otherwise — this has happened
   before in this repo and is why the step is written out.
4. Confirm the sequence, state, class, description and json conformance
   suites are unmoved, with counts.
5. Resolve or explicitly re-scope `activity-diamond-font-skinparams` and
   `activity-edge-stroke-width` in `planning/next-missions.md`, each with a
   reason.
6. Append the Close-out to the brief's README: scored exit bar, any premise
   this mission measured FALSE, and follow-ons with their measured weight.

## Boundaries

**Always:** state a measured number, never an estimate. **Never:** flip a
checkbox on vibes — the measurement command must report the bar met.
**Ask first (halt and journal):** if Σ`weightedScore` did not fall.

## Acceptance criteria

- Given the re-measured corpus, when the close-out is written, then
  Σ`weightedScore` is stated as a before → after pair against `61677` with
  a percentage
- Given the re-pinned baseline, when diffed against its pre-mission
  version, then every risen pin is named with a mechanism, or the report
  states that none rose
- Given the five sibling conformance suites, when run, then each is
  reported unmoved with its count
- Given `planning/next-missions.md`, when read after this task, then
  neither `activity-diamond-font-skinparams` nor
  `activity-edge-stroke-width` is left in an unresolved state without a
  stated reason
- Given all four gates, when run at HEAD, then all four are green

## Quality bar

`npm test` (full suite), `npm run typecheck`, `npm run lint`,
`npm run build`.

## Commit

`test(asd-T7): re-pin the activity baselines and close out`
