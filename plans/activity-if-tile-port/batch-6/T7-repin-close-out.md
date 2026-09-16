# T7 — re-pin the activity baselines and close out

**Agent:** orchestrator · **Depends on:** T6

## Context

Read [`../README.md`](../README.md) (exit bar, stops 5–8, 13, 14) and the
whole [`../decision-journal.md`](../decision-journal.md). The four activity
oracle gates have been red by design since T3. This task re-pins them ONCE,
then proves the exit bar with the committed tools.

## Steps

1. **Final measurement.** `npx tsx scripts/activity-probe.ts --json
   plans/activity-if-tile-port/measurements/final.json` (all 268). List
   every slug whose score changed from `measurements/base.json`; every one
   must be a `fixtures.md` row or on T6's journaled list (stop 6).
2. **Templates.** `--align` on all nine representative slugs: per-tag counts
   equal the jar's, alignment ≥ the Q1 base (stop 14). Record the table.
3. **Rise check.** `npx tsx scripts/repin-activity-baselines.ts`. Every
   `ROSE` line needs a journal row naming its task and mechanism; a rise
   without one -> stop 5. Expect many rises: element growth under
   positional pairing (D9) — each still needs its row.
4. **Write.** The same command with `--write --accept-rises <exactly the
   journaled slugs>`.
5. **Diff the pins.** `git diff oracle/goldens/svg-activity/`: every changed
   `weightedScore` either fell or is in the accept list; the only other
   field change is `measuredAgainstCommit`. Restore anything else by hand.
   Diff the baseline JSON before and after: any pin that ROSE without a
   row is an adopted regression.
6. **Overlaps.** `ALLOWED_NEW_OVERLAPS` re-listed with per-entry attribution;
   `hardViolations` empty (stop 8).
7. **Siblings.** Run the sequence, state, class, description and json
   conformance tests at `b79502b5` (worktree with `node_modules` AND
   `assets/stdlib` symlinked) and at HEAD; `svg-conformance` must read
   **27 files / 3427 passed | 1 skipped** on both (stop 7).
8. **Gates.** All four green, no red allowance.
9. **File and record.**
   - `planning/next-missions.md`: mark `activity-if-connector-draw-order`
     SUPERSEDED by this mission with the corrected mechanism; mark
     `activity-repeat-connector-draw-order` as still open; file with cites
     every D8 item (`activity-if-long-vertical`, `activity-switch-tile`,
     `activity-if-notes-opale`, `activity-condition-style-variants`,
     `activity-if-cross-lane-hop-shapes`), plus the while/repeat hexagon
     sizing follow-on if T1 Q2 found a divergence (stop 13's file).
   - `planning/mission-index.md`: add a `G5-aitp` row beneath `G5-aedo`,
     carrying status, exit bar and measurement command.
   - README: tick Progress, append the Session End summary (tasks done vs
     planned, decision count with flags, gate results, the before/after
     element-count table, known issues).
   - `.agent-notes/aitp-T7.md` in the `memory.md` format.
   - `docs/catalog.md` regenerated.

## Write-set

See [`overview.md`](overview.md).

## Acceptance criteria

- Given the committed pins, when the ratchet runs, then it is green and
  every pin that rose is named in the journal
- Given `final.json` against `base.json`, then every mover is a
  `fixtures.md` row or on T6's list
- Given the nine representative slugs, then every per-tag count equals the
  jar's
- Given the sibling suites, then every count matches step 7
- Given `next-missions.md`, then every D8 item is filed with its cite

## Observability / Rollback

N/A — no new observable operations / **Reversible** (revert the merge commit).

## Commit

`test(aitp-T7): re-pin the activity baselines and close out`
