# T2f — geometry residuals

Agent: typescript-pro, worktree `add2-T2f`. Depends on T1b (b1 close).

## Context
add1 rows 42, 44, 40: if-with-links label height reserved only partly (bazuma,
vimako — `GtileIfWithLinks.diamond1Y` correct standalone, ~18 px short live);
split-bar width (gevaxi: rect 60.838 vs 71.338); creole table grid lines and
`%n()` drawing in `renderAction` (activity-creole-table, niletu, fabule — sizing
already creole-aware since add1-T3e).

## Task
For each row: `--dump`/`--align`, read the Java (quote file:line), port at the origin, apply to every fixture the mechanism governs, pin with a test. Measure the full corpus before/after (probe + elements).

## Write-set
`src/diagrams/activity/tiles/{gtile-if-with-links,gtile-fork,gtile-split}.ts`, `src/diagrams/activity/layout/walk-if-with-links.ts`, `src/diagrams/activity/activity-renderer-shapes.ts`.

## Acceptance
- Given each named row, then the diffs from this mechanism go to 0 (or the row is re-slotted with mechanism + owning file).
- Given the full corpus, then 0 unexplained risers.
- Given the pinned goldens and harness-parity test, then green.

## Rules
Worktree only (`measurements/mkwt.sh T2f`); NO Serena MCP tools, no `git stash`,
scratch files named with `T2f`; never write `oracle/**` JSON (repin dry-run only);
67+ pinned goldens byte-equal (stop and report otherwise); every riser shown from
the diff; every number carries an upstream `file:line`; anything outside the
write-set is re-slotted, never forced. Quality bar: targeted vitest + the
activity golden/diff-baseline/harness-parity tests + typecheck + eslint; files
≤ 500 lines, functions ≤ 30 NLOC / CCN ≤ 10. One commit per mechanism.
Observability: N/A (gated measurements only). Rollback: Reversible.
