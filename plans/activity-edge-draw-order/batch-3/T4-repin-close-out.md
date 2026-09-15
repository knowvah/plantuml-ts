# T4 — re-pin the activity baselines and close out

**Agent:** orchestrator · **Depends on:** T3

## Context

Read [`../README.md`](../README.md) (exit bar, stops 5–8) and the whole
[`../decision-journal.md`](../decision-journal.md). The four activity oracle
gates have been red by design since T2. This task re-pins them ONCE, then
proves the exit bar with the committed tools.

## Steps

1. **Final measurement.** `npx tsx scripts/activity-probe.ts --slugs-file
   plans/activity-edge-draw-order/fixtures.md --json
   plans/activity-edge-draw-order/measurements/final.json`. List every slug
   whose score changed from `measurements/base.json`. Any slug not in
   `fixtures.md` → stop 6.
2. **Rise check.** `npx tsx scripts/repin-activity-baselines.ts --slugs-file
   plans/activity-edge-draw-order/fixtures.md`. Every `ROSE` line needs a
   journal row naming its task and mechanism; a rise without one → stop 5.
3. **Write.** The same command with `--write --accept-rises <exactly the
   journaled slugs>`.
4. **Diff the pins.** `git diff oracle/goldens/svg-activity/`: every changed
   `weightedScore` either fell or is in the accept list; the only other field
   change is `measuredAgainstCommit`. Restore anything else by hand.
5. **Overlaps.** `ALLOWED_NEW_OVERLAPS` equals the list T3 left, every entry
   carrying its per-entry attribution (shape kinds plus the Java cite for why
   one takes no slot on the moved axis); `hardViolations` empty (stop 8).
6. **Siblings.** Run the sequence, state, class, description and json ratchet
   tests at `6ff347f8` (worktree with `node_modules` AND `assets/stdlib`
   symlinked) and at HEAD; counts must match 1151 / 2+1 skipped / 62 / 316 /
   24 / 54 / 11 (stop 7).
7. **Gates.** All four green, no red allowance.
8. **File and record.**
   - `planning/next-missions.md`: mark `activity-split-connector-draw-order`
     DONE with the numbers; file `activity-snake-merge`
     (`svek/UGraphicForSnake.java:137-157`, T1's Q3 evidence) and whatever
     T1's Q4 found for `if`/`while`/`repeat` (D7).
   - `planning/mission-index.md`: add a `G5-aedo` row beneath the G5
     sequence/activity row, carrying status, exit bar and measurement command.
   - README: tick Progress, append the Session End summary (tasks done vs
     planned, decision count with flags, gate results, known issues).
   - `.agent-notes/aedo-T4.md` in the `memory.md` format.

## Write-set

See [`overview.md`](overview.md).

## Acceptance criteria

- Given the committed pins, when the ratchet runs, then it is green and every
  pin that rose is named in the journal
- Given `final.json` against `base.json`, then every mover is a `fixtures.md`
  row
- Given the sibling suites, then every count matches step 6
- Given `next-missions.md`, then `activity-snake-merge` and the D7 findings
  are filed with their cites

## Observability / Rollback

N/A — no new observable operations / **Reversible** (revert the merge commit).

## Commit

`test(aedo-T4): re-pin the activity baselines and close out`
