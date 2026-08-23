# T5 — re-baseline the render manifest and prove no cross-engine leak

## Context

`src/core/assemble-svg.ts` is shared by class, state, json, yaml, hcl and now
sequence. T2 added a dispatch case to it. **This task is the only check that
the addition did not change any other engine's output**, and it is the
highest-consequence guard in the mission.

`test-results/render-manifest-baseline.json` holds 3158 entries. 1141 are
sequence; the other 2017 are not. Exactly the first group may move.

## Task

1. Regenerate the manifest: `npx jiti scripts/render-manifest.ts`
2. Diff against the committed baseline with `manifest-diff.py`
3. Assert the moved set is exactly `test-results/dot-cache/sequence/**`
4. Commit the new baseline
5. Re-measure `zudize-61-vomi445`'s per-call cost (see below)

## Read-set

- `scripts/render-manifest.ts`
- `manifest-diff.py`
- `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts:117-154`
  — `LARGE_GOLDEN_BYTES` / `LARGE_GOLDEN_BUDGET_MS` and how 30,000 was derived
- `.agent-notes/ratchet-zudize-timeout.md` — the full diagnosis
- `../decisions.md#d1`

## Manifest composition — measured 2026-08-23

| entries | path prefix |
|---|---|
| 1141 | `test-results/dot-cache/sequence` |
| 723 | `test-results/dot-cache/class` |
| 316 | `oracle/goldens/svg-class` |
| 273 | `test-results/dot-cache/state` |
| 266 | `test-results/dot-cache/component` |
| 94 | `test-results/dot-cache/usecase` |
| 80 | `test-results/dot-cache/object` |
| 60 | `oracle/goldens/svg-state` |
| 51 | `oracle/goldens/svg-description` |
| 50 / 39 / 34 / 10 / 6 / 5 / 5 / 3 / 1 / 1 | json, yaml, svg-object, svg-json, svg-yaml, svg-dot, dot, hcl, svg-hcl, svg-skin |

## The timing re-check

`zudize-61-vomi445` is the one fixture with a large stable cost — ~650 ms per
call (`read~8 render~232 cmp~407`) against a next-slowest of ~16 ms — and it
carries a 30,000 ms budget derived from 3,711 ms measured at 22 concurrent
workers. Inline arrowhead construction replaces a marker *reference* with
per-arrow geometry, so its render cost may rise.

If it moved materially, **re-derive** the budget from a new measurement at
the same 22-worker condition and record the derivation. Do not raise it until
the test goes green — that is exactly the "raise it until green" move
`test-budget-invariant` D5 refused for `catalog.test.ts`.

## Acceptance criteria

1. Given `manifest-diff.py` against the regenerated manifest, then the moved
   entries are exactly the 1141 under `test-results/dot-cache/sequence/**`
2. Given the same diff, then **zero** entries under class, state, component,
   usecase, object, json, yaml, hcl, dot or any `oracle/goldens/svg-*` path
   moved — if any did, that is a stop condition, not a re-baseline
3. Given the regenerated manifest, then it still holds 3158 entries (nothing
   added or dropped)
4. Given `zudize-61-vomi445`, then its per-call cost is measured and
   recorded; if it moved materially, the budget's new derivation is in the
   journal alongside the measurement that produced it

## Quality bar

All four gates green.

## Observability

This task carries the mission's most important signal — the cross-engine
regression guard in AC2. Record the diff summary verbatim in the journal.

## Rollback

Reversible, but only together with T3 — see `T3`'s rollback note.

## Boundaries

- **Always:** report the manifest diff summary verbatim, including counts
- **Never:** re-baseline a non-sequence entry that moved — stop and report
  it; touch `src/**`
- **Ask first:** if a non-sequence entry moved for a reason you can explain
  and believe is benign. It is still a stop condition; explaining it does not
  make it one you may proceed past

## Commit

One commit: `chore(T5): re-baseline the render manifest for sequence`
