# Batch 2b — make the measure monotonic before re-pinning

Added by the 2026-08-23 amendment. Batch 2 halted because the quantity the
ratchet gates on rewards structural *misalignment*: `compareSvg` charges 1 for
a short-circuit that hides an arbitrarily large subtree, so T3's chrome fix
raised 255 counts without making any body worse.

This batch fixes the measure. It changes no rendered byte — `render-manifest`
must be unmoved at the end of it, exactly as in batch 1. Batch 3 then re-pins
against a metric that means something.

One task; it touches a file six other engines depend on, so it is deliberately
not parallel with anything.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T6 | [Weighted diff score](T6-weighted-diff-score.md) | typescript-pro | `tests/oracle/svg-conformance/compare.ts`, `tests/oracle/svg-conformance/compare.test.ts`, `tests/oracle/svg-conformance/sequence.diff-baseline.ratchet.test.ts` | T3 | [ ] |
