# T2 — Adjudicate and write the routing docs

## Prior observations

T1's matrix artifact (decision journal) is locked input. D2
(decisions.md) defines the routing rule.

## Task

**Usage verdict** (a builder call-sequence variant matches text path
on every cell): append a "Round 3" section to
`plans/g6-cluster-geometry/batch-4/withlabel-derivation.md` stating
the exact correct call sequence per context (i-wrapper, nested child,
parent, ee content), with the matrix numbers. Do not rewrite Rounds
1-2.

**Library verdict** (builder cannot match under any correct
sequence): file `docs/graphviz-issues/09-<slug>.md` mirroring issue
08's format — Status header, Impact (~20-fixture family, pesita/
kotagu numbers), the question for graphviz-ts, minimal repro DOT
(the first-breaking matrix cell), builder-call transcript,
expected/actual table, Procedure, Evidence trail (T1 journal artifact,
G6 attempt-3 row). Add ONE unchecked TRACKER.md line. Then flip
`plans/g7-borderpoint-rank/README.md` Status to `PAUSED — waiting on
graphviz-issues/09` (keep the resume procedure intact). The mission
pauses here.

Either way: journal row with the verdict + mechanism.

## Write-set (conditional)

Usage: `plans/g6-cluster-geometry/batch-4/withlabel-derivation.md`,
`plans/g7-borderpoint-rank/` (journal). Library:
`docs/graphviz-issues/09-*.md`, `docs/graphviz-issues/TRACKER.md`,
`plans/g7-borderpoint-rank/` (README status + journal).

## Acceptance criteria

- Given a usage verdict, when T2 lands, then T4 can paper-derive from
  the addendum without re-measuring.
- Given a library verdict, when T2 lands, then issue 09 is
  self-contained (a graphviz-ts session needs nothing else) and the
  README PAUSED block + resume procedure are active.

## Boundaries

Never modify ../graphviz-ts. No git mutations (orchestrator commits).
