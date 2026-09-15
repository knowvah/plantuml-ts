# T8 — re-pin the activity baselines and close out

**Agent:** orchestrator · **Depends on:** T7

## Context

Read [`../README.md`](../README.md) (exit bar, stops 5, 6 and 8) and the whole
[`../decision-journal.md`](../decision-journal.md). The four activity oracle
gates have been red by design since T3. This task re-pins them ONCE, then
proves the exit bar with the committed tools.

## Steps

1. **Final measurement.** Run
   `npx tsx scripts/activity-probe.ts --slugs-file plans/activity-lane-capture/fixtures.md --json plans/activity-lane-capture/measurements/final.json`.
   List every slug whose score changed from `measurements/base.json`. Any slug
   not in `fixtures.md` → stop 6.
2. **Rise check.** Run
   `npx tsx scripts/repin-activity-baselines.ts --slugs-file plans/activity-lane-capture/fixtures.md`.
   Every `ROSE` line needs a journal row naming its task and mechanism; a rise
   without one → stop 5.
3. **Write.** Run the same command with `--write --accept-rises <exactly the
   journaled slugs>`.
4. **Diff the pins.** Run `git diff oracle/goldens/svg-activity/diff-baseline.json`:
   every changed `weightedScore` either fell or is in the accept list. Revert
   any other change by hand to its committed value.
5. **Lanes.** Run `--lanes` for all 40 into `measurements/final-lanes.txt`.
   Every ours ≠ jar row gets a named journal row.
6. **Overlaps.** `ALLOWED_NEW_OVERLAPS` is empty, or every survivor carries its
   Java-cited re-attribution (stop 8).
7. **Siblings.** Record the sequence, state, class, description and json
   ratchet test counts before and after: all unmoved.
8. **Gates.** All four green, no red allowance.
9. **File and record.**
   - `planning/next-missions.md`: mark `activity-fork-split-lane-capture` DONE
     with the numbers. File `activity-repeat-entry-diamond` (the six `*` slugs;
     `ftile/vcompact/FtileRepeat.java:135-136,188-196,333-402`;
     `tiles/gtile-repeat.ts:32`) and `activity-repeat-backward`
     (`ActivityDiagram3.java:382`; `InstructionRepeat.java:124-127`), plus
     anything FILED during T3–T7 (`switch`, `end merge`).
   - `planning/mission-index.md`: add a `G5-alc` row beneath the G5
     sequence/activity row, carrying status, exit bar and measurement command.
   - README: tick Progress, and append the Session End summary (tasks done vs
     planned, decision count with flags, gate results, known issues).
   - `.agent-notes/alc-T8.md` in the `memory.md` format.

## Write-set

See [`overview.md`](overview.md).

## Acceptance criteria

- Given the committed pins, when the ratchet runs, then it is green, and every
  pin that rose is named in the journal
- Given `final-lanes.txt`, then every ours ≠ jar row on the 40 has a named
  journal row
- Given the invariant test, then `ALLOWED_NEW_OVERLAPS` is empty or fully attributed
- Given `next-missions.md`, then the two follow-ons are filed with their cites

## Observability / Rollback

N/A — no new observable operations / **Reversible** (revert the merge commit).

## Commit

`test(alc-T8): re-pin the activity baselines and close out`
