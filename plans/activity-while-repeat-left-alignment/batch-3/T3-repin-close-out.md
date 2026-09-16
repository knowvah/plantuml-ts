# T3 — re-pin the activity baselines and close out

**Agent:** orchestrator · **Depends on:** T2

Follow `plans/activity-if-tile-port/batch-6/T7-repin-close-out.md`'s steps
with this mission's numbers:

1. `npx tsx scripts/activity-probe.ts --json measurements/final.json`; every
   mover vs `base.json` is a while/repeat fixture with an asymmetric child
   (stop 5); no symmetric loop fixture moved (stop 13).
2. Diagonal scan over all 268: 0, or every survivor named with a mechanism
   that is not a loop's own placement.
3. `npx tsx scripts/repin-activity-baselines.ts` dry run; every `ROSE` line
   has a journal row (stop 4); then `--write --accept-rises <slugs>`; diff
   the pins (only `weightedScore`, `diffCount`, `measuredAgainstCommit`,
   `measuredAt` change).
4. `hardViolations` empty; allowed lists re-attributed (stop 7).
5. `npx vitest run svg-conformance` at `6f1c04f7` (scratch worktree with
   `node_modules` + `assets/stdlib` symlinked) and at HEAD: 27 files / 3427
   passed | 1 skipped (stop 6).
6. Four gates green with the JSON-reporter collected count equal to the
   on-disk count.
7. File and record: `planning/next-missions.md` — mark
   `activity-while-repeat-left-alignment` DONE with the numbers; file
   anything found (the gutter divergence if not already filed, the repeat
   entry-diamond gap under `activity-diamond-count-shortfall`);
   `planning/mission-index.md` row `G5-awrl`; README Progress + Session
   End; `.agent-notes/awrl-T3.md`.

Commit: `test(awrl-T3): re-pin the activity baselines and close out`.
Rollback: **Reversible** (revert the merge commit).
