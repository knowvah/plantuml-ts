# B1 — attribute the element deficit to features

## Context

410 of 1124 fixtures never descend past their root group, because `compareSvg`
short-circuits on a child-count mismatch. 380 of them emit FEWER children than
the jar. **250 are within four elements** of becoming measurable — getting them
across lifts the instrument's visible cohort from 714 to roughly 880, a 23%
increase in what any geometry mission can see.

The counts are known (see the batch overview). The MECHANISMS are not. This
task supplies them, and its output defines B4..Bn.

## Task

For each element class with a deficit, attribute the missing elements to a
FEATURE, with a named fixture per finding. Produce a table, not prose.

Expected leads, to confirm or refute rather than assume:

- `line` −2 323 — self loops are three lines in the jar and one path here
  across 79 fixtures, which accounts for some but probably not all.
- `g` / `title` −259 each, in lockstep — a missing `<g><title>` wrapper on some
  shape class.
- `a` −89 — participant urls (B3), and creole `[[url]]` inside labels, which is
  a NON-GOAL.

## Write-set

- `plans/sequence-text-and-y-convergence/findings/element-deficit.md` (create)

No source changes. This is a measurement task.

## Read-set

- `scripts/sequence-geometry-distance.ts` — for the cohort split.
- `tests/oracle/svg-conformance/compare.ts:390-410` — the child-count
  short-circuit this is all about.
- `test-results/dot-cache/sequence/` — the corpus.

## Acceptance criteria

- Given each element class with a deficit, when the findings are written, then
  every class has a stated mechanism and at least one named fixture, or is
  explicitly recorded as unexplained.
- Given the findings, then they list the fixtures within 1, 2 and 4 elements of
  matching, so B4..Bn can be sized by payoff.
- Given any figure quoted corpus-wide, then it either excludes
  `zudize-61-vomi445` and says so, or reports the concentration alongside.
- Given the findings, then they propose B4..Bn as concrete tasks — or state
  that more than three distinct features are involved, which is stop
  condition 9.

## Observability

This task is measurement. Use the concentration guard on every aggregate.

## Rollback

N/A — documentation only.

## Quality bar

All four gates still green (nothing should change). Findings must name
fixtures, not describe them.

## Commit

`docs(B1): attribute the sequence element deficit to features`
