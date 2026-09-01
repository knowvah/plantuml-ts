# C4 — adjudicate, re-pin once, close out

## Context

The only re-pin of the mission (D5). Everything before this has been measured
and adjudicated but never baked in.

## Task

1. **Adjudicate** over all 1141 fixtures against the mission's parent commit.
   Every rise carries a verdict; zero `regression` that survives diagnosis.
2. **Measure `diffCount` fresh** with `scripts/sequence-repin-snapshot.ts`
   BEFORE re-pinning — `repin-sequence-baselines.ts` does
   `f.diffCount = m.diffCount ?? f.diffCount`, and the adjudicator's snapshot
   carries no `diffCount`, so without this every row gets a fresh score beside
   a stale count. Last mission: 716 of 1141 counts had drifted, one from 5 to
   349.
3. **Re-pin once.** Then diff `diff-baseline.json` before and after and check
   **every RAISED pin** against an adjudicated verdict — the script compares
   each fixture to its PIN, not to the base ref, and will green-light a row
   that was already red.
4. **Regenerate** `diff-census.json`.
5. **Write the Outcome section** in the README: per-batch distances, the
   before/after per-axis table, every residual with its mechanism.

## Write-set

- `oracle/goldens/svg-sequence/diff-baseline.json`
- `oracle/goldens/svg-sequence/diff-census.json`
- `oracle/goldens/svg-conformance/routing-baseline.json`,
  `refusal-baseline.json` (whatever the re-pin script touches)
- `plans/sequence-text-and-y-convergence/README.md` (Outcome)
- `plans/sequence-text-and-y-convergence/findings/adjudication.md` (create)

## Read-set

- `scripts/repin-sequence-baselines.ts:1-20` — the orchestrator-only warning
  and why re-pinning before adjudicating bakes in regressions.
- `scripts/sequence-repin-snapshot.ts` — the fresh-`diffCount` snapshot.
- `plans/sequence-coordinate-convergence/findings/adjudication.md` — the
  previous close-out, as the shape to follow.

## Acceptance criteria

- Given the adjudication, then zero `regression` verdicts survive diagnosis.
- Given the re-pin, then every RAISED pin is one of the adjudicated rises, with
  no unexplained row.
- Given the baselines and census, then `npm test` passes with the ratchet GREEN
  for the first time since batch 2.
- Given the README Outcome, then it states total distance before and after, the
  per-axis split, and every residual with a mechanism — never "close enough".
- Given every corpus figure quoted, then it either excludes
  `zudize-61-vomi445` and says so, or reports its concentration.

## Observability

This task is the mission's final measurement.

## Rollback

**Reversible with a constraint**: the code and these baselines must revert
TOGETHER. Reverting one without the other leaves pins no commit produces. Say
so in the Outcome.

## Quality bar

All four gates, ratchet green. Merge to `main` with a MERGE COMMIT, never a
squash — per-task ids are cited throughout the journal.

## Commit

`chore(C4): adjudicate, re-pin once, and close the mission out`
