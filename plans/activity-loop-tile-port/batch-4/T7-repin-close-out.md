# T7 — re-pin the activity baselines and close out

**Agent:** orchestrator · **Depends on:** T6

Follow `plans/activity-while-repeat-left-alignment/batch-3/T3-repin-close-out.md`
and its journal rows (the executed precedent) with this mission's numbers:

1. `npx tsx scripts/activity-probe.ts --json measurements/final.json`;
   every mover vs `base.json` is a `fixtures.md` row or a named parent
   re-centring (stop 5).
2. `npx tsx scripts/activity-diag-scan.ts`: 0.
3. `--align` on every representative slug (`fixtures.md`): record the
   per-tag table ours vs jar; every surplus or deficit named with its cite.
4. `npx tsx scripts/repin-activity-baselines.ts` dry run; every `ROSE` line
   has a journal row by class (stop 4); then `--write --accept-rises
   <slugs>`; diff `diff-baseline.json` before/after: only `weightedScore`,
   `diffCount`, `measuredAgainstCommit` change and no pin rose outside the
   accept list (memory `repin-script-raises-preexisting-red-pin`).
5. `hardViolations` empty; the two exemption lists attributed (stop 7).
6. `npx vitest run svg-conformance` at `3651a1ec` (scratch worktree with
   `node_modules`, `assets/stdlib`, `test-results` symlinked, removed
   after) and at HEAD: 27 files / 3427 passed | 1 skipped (stop 6).
7. Four gates green, JSON-reporter collected count = on-disk count.
8. File and record: `planning/next-missions.md` — mark
   `activity-loop-gutters`, `activity-diamond-sizing` and the repeat half of
   `activity-diamond-count-shortfall` DONE with the numbers; file
   `activity-loop-backward` (D5), any `ConnectionBackComplex1` slugs (stop
   11), and whatever `--align` residuals remain; `planning/mission-index.md`
   row `G5-altp` beneath `G5-awrl`; README Progress + Session End;
   `.agent-notes/altp-T7.md` in the `memory.md` format; `docs/catalog.md`.

Commit: `test(altp-T7): re-pin the activity baselines and close out`.
Rollback: **Reversible** (revert the merge commit).
