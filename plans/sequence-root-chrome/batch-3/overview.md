# Batch 3 — re-pin and prove no leak

Both tasks depend on T3 and write different files, so run them in parallel.
T4 is sequence-scoped bookkeeping. T5 is the cross-engine guard and is the
more important of the two: it is the only check that `assemble-svg.ts` — now
shared by six diagram types — did not leak into the other five.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T4 | [Re-pin sequence ratchet](T4-repin-sequence-ratchet.md) | typescript-pro | `oracle/goldens/svg-sequence/diff-baseline.json`, `oracle/goldens/svg-sequence/diff-census.json` | T3 | [ ] |
| T5 | [Manifest re-baseline](T5-render-manifest-rebaseline.md) | typescript-pro | `test-results/render-manifest-baseline.json` | T3 | [ ] |
