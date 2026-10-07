# T0b — capture the 80 uncaptured corpus fixtures (orchestrator only, D1)

Memory new-corpus-tree-trips-two-gates: routing + refusal go red on contact; pin
them in the SAME commit as the capture.

1. List `tests/corpus/activity/*.puml` without `test-results/dot-cache/activity/<slug>/`
   (80 at planning). Run `scripts/capture-oracle-cache.ts` for activity (read its header
   for flags; it skips existing `.done`). Check each new `in.svg`: a jar error is a
   jar-error row; an empty/truncated non-error svg = stop 12.
2. Routing + refusal: add the new dot-cache rows (measure with the gates' own seam, the
   way add1/add2 pinned new rows; `scripts/pin-corpus-tree*.ts` if it applies), update
   every count assertion with a derivation comment.
3. Activity baselines: `repin-activity-baselines.ts --write` (promotion pass adds the new
   rows to diff/style/text(/swimlane) baselines); update the activity count tests by
   derivation; `census-away.py` must show 0 AWAY on the old rows.
4. Probe b0′ (`measurements/b0p.json`): old-48 Σ must still be 4413; record the new
   rows' Σ. Pin new zero-diff rows (`pin-goldens.mts add4-b0 close-b0 …`), counts again.
5. Survey activity + unknown into `measurements/b0p-eng/`; dashboard; four gates.
   Commit `chore(add4-T0b): capture 80 activity corpus fixtures`. Ledger: append the new
   baseline rows (marked `(new)`). Journal.

Acceptance:
- Given the capture, when routing/refusal run, then green with counts by derivation.
- Given a jar error, then the row is `jar-error`, never `baseline`.
- Given b0′, then old-48 Σ = 4413 and the new rows' Σ is recorded.
Observability: N/A. Rollback: Reversible (revert the commit; captures are additive).
