# T4 — Re-pin, re-census, name every riser

## Context
Repo `/Users/scottseely/git/knowvah/plantuml-ts`, branch
`feat/activity-element-granularity`. The swaps have landed (T3 may have
halted — check `decision-journal.md` and measure whatever is actually in the
tree, not what was planned).

T0's `element-baseline.json` records the PRE-swap element census. That gap is
the evidence the swaps worked.

## Task

### 1. Re-pin, naming every riser
Re-measure all 268 numerically-comparable fixtures and re-pin
`diff-baseline.json` and `element-baseline.json`.

**Every fixture whose `weightedScore` ROSE is named with a mechanism** — the
slug, old score, new score, and *why*. A risen pin is an adopted regression
until proven otherwise; if you cannot explain a rise, STOP.

A risen **`diffCount`** beside a fallen **`weightedScore`** is expected, not
a rise: collapsing a child-count short-circuit into real comparison does
exactly this. It is the same artefact the previous mission recorded, where
`diffCount` rose on 57 fixtures while every score fell.

Preserve `status:"error"` (82) and `status:"jar-error"` (23) entries — they
carry no `weightedScore`. **Report any status transition**, especially
`error` → `baseline`.

### 2. Attribute the descent per swap
T0 pinned per-tag counts precisely so each swap is separately measurable.
Report, per swap:
- **T1** — `polyline` ours should be **0**, `line` ours should have risen by
  roughly 3047 toward the jar's 3336
- **T2** — `circle` ours **0**, `ellipse` ours ~518 against the jar's 488
- **T3** — `text` ours risen by roughly 522 toward 1915, `tspan` unchanged
  where creole markup is present (it must NOT go to zero)

If a swap's measured effect differs materially from these, say so. They are
projections from the pre-mission census, not results.

### 3. Re-census the residual
Rewrite `diff-census.json`. **Restate `svg/g[][childCount]`'s share against
its 91.6% starting point** — that is the mission's headline number. Rank the
remaining path families by weight, and record the geometry residual's
direction per fixture (it goes both ways: pre-mission, width 195 wider / 73
narrower, height 105 taller / 154 shorter).

Carry forward as named follow-ons, with their sizes:
- the 82 parser-gap fixtures (set-identical to the 82 activity
  `known-misroute` routing pins)
- `<a>` 9, `<image>` 6, gradients 3 ([D8])
- font size 14 v 12 ([D5])
- `levuma-67-cego489` theme resolution, `setecu-78-cuko533`
  `preserveAspectRatio`, `dakesa-98-mano758` gradient defs

### 4. Verify nothing else moved
`src/core/svg-shapes.ts`, `src/core/creole-svg.ts` and every non-activity
engine must be unchanged. Run the sequence, state, class and json
conformance suites and confirm none moved. Any movement is stop condition 5.

## Write-set
- `oracle/goldens/svg-activity/diff-baseline.json`
- `oracle/goldens/svg-activity/diff-census.json`
- `oracle/goldens/svg-activity/element-baseline.json`
- `oracle/goldens/svg-activity/README.md`
- `.agent-notes/aeg-T4.md`

**Nothing under `src/`.** If the re-measurement suggests a source change,
that is a finding for the census, not an edit.

## Read-set
- `plans/activity-element-granularity/decisions.md` — D5, D6, D8
- `oracle/goldens/svg-activity/element-baseline.json` — T0's pre-swap pin
- `plans/activity-element-granularity/decision-journal.md` — whether T3 halted
- `tests/oracle/svg-conformance/compare.ts:388-404`

## Architecture decisions
[D6] the pre-swap pin is the evidence · [D8]/[D5] named follow-ons, not work.

## Interface contracts
Report:
```json
{ "fell": 0, "rose": [{"slug":"","from":0,"to":0,"mechanism":""}],
  "aggregateBefore": 108447, "aggregateAfter": 0, "pctChange": 0,
  "childCountShareBefore": 91.6, "childCountShareAfter": 0,
  "perSwap": { "T1": {}, "T2": {}, "T3": {} },
  "statusTransitions": [""], "nonActivitySuitesMoved": [""] }
```
`rose` with an empty `mechanism` ⇒ **stop**.
`nonActivitySuitesMoved` non-empty ⇒ **stop**.

## Acceptance criteria
- Given the re-pin, then every risen `weightedScore` is named with a
  mechanism — no silent adoption.
- Given a risen `diffCount` beside a fallen `weightedScore`, then it is
  recorded as the expected weighting artefact, not a failure.
- Given the census, then `childCount`'s new share is stated against 91.6%.
- Given each swap, then its effect is separately attributed against T0's pin.
- Given the non-activity suites, then none moved, and the suites you ran are
  named.

## Observability
This task produces the mission's headline number. Report it.

## Rollback
**Reversible.** All JSON, regenerable by re-running against the tree.

## Quality bar
All four gates green, `Test Files` **683** — including the activity ratchet,
which must be GREEN against the re-pinned baseline.

## Commit
`test(aeg-T4): re-pin the activity element census post-swap`

Body: the descent, every named riser, the per-swap attribution, and
confirmation that no non-activity engine moved.
