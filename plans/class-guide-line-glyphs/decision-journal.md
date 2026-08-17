# Decision journal — class-guide-line-glyphs

Appended during execution. One row per non-trivial judgment call. Every count
comes from a command run on a clean tree.

| Date | Decision / finding | Evidence / why | Flag for review? |
|---|---|---|---|
| 2026-08-17 | Baseline captured in detached worktree at `7ba67fcd` (SI24 recipe, six ignored dirs symlinked): shape-match 785/26,255, class DOT EQUAL 705/711, `gobuco` 14/22 168x102 vs 168x102, `lapoma` 14/22 68x232 vs 72x232 — matches README starting state. Per-fixture rows saved for the T4 diff. | Commands run in the worktree; scratchpad `baseline-shape.txt`/`baseline-dot-class.txt`. | No |
| 2026-08-17 | T1 done directly by the orchestrator (no subagent): a ~60-line refactor + tests, under the ~30-min delegation threshold. `direction` is `'forward'\|'backward'` (`core/edge-label-box.ts:212`), so the spec's "right/left" reads as forward/backward. Gates: test 595/14496 pass, cov 95.37/90.36/96.93/96.46, typecheck/lint/build green, class DOT EQUAL 705/711 unchanged. | `git diff --name-only HEAD~1` = the two write-set files. Commit `refactor(T1)`. | No |
