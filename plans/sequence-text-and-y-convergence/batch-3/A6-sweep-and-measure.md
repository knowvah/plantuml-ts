# A6 — Phase A sweep, adjudication and measurement

## Context

Phase A claimed to remove 423 064 of phantom distance by emitting text the way
the jar does. This task proves it, and records the per-attribute numbers C2's
derivation reads (D6).

## Task

1. **Sweep.** Assert corpus-wide that no sequence `<text>` carries
   `text-anchor` or `dominant-baseline`, and that `textLength` coverage
   approaches the jar's 97.3%.
2. **Adjudicate** against the parent commit as an INSTRUMENT — every rise gets
   a verdict, every `regression` gets a diagnosis. Do **not** re-pin.
3. **Measure** and record: total distance, the per-attribute table, the cohort
   line, and the concentration line.
4. Write `findings/text-convention.md` with all of it, and tick batches 1–3 in
   the README.

## Write-set

- `plans/sequence-text-and-y-convergence/findings/text-convention.md` (create)
- `plans/sequence-text-and-y-convergence/README.md` (status ticks only)
- `plans/sequence-text-and-y-convergence/decision-journal.md` (append)

## Read-set

- `scripts/sequence-geometry-distance.ts` — the instrument and its `--compare`.
- `scripts/sequence-distance-concentration.ts` — the concentration guard.
  **Quote nothing whose heaviest fixture exceeds 20% without saying so.**
- `scripts/sequence-ratchet-adjudicate.ts:1-70` — usage and the three hazards.
- `plans/sequence-coordinate-convergence/findings/baseline.json` — the baseline
  every gate compares against.

## Acceptance criteria

- Given the whole corpus, when rendered, then **zero** sequence `<text>`
  elements carry `text-anchor` or `dominant-baseline`.
- Given the corpus, when measured, then `text@x` + `text@y` distance has fallen
  by more than 90% of its 423 064 baseline.
- Given the cohort line, then `descended` is at least 714. A fall is stop
  condition 7, not a result to write up.
- Given the adjudication, then every `regression` verdict carries a stated
  mechanism, or the mission stops.
- Given `findings/text-convention.md`, then it records the per-attribute table
  Phase C will read, and states explicitly that `points` and `d` still mix axes
  (C1 fixes that).

## Observability

This task IS the observability step for Phase A.

## Rollback

N/A — documentation and measurement only.

## Quality bar

All four gates must still pass. No source file changes.

## Commit

`docs(A6): measure what emitting the jar's text bought`
