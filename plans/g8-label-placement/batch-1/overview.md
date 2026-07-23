# Batch 1 — Convention spec + committed delta harness

De-risk T2 before any production edit (the G7 paper-gate lesson):
prove the centre→anchor conversion against jar oracles on the named
fixtures, and promote T20's throwaway 92-fixture delta harness to a
committed script.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Conversion spec (jar-oracle-verified) + `scripts/measure-state-size-deltas.ts` | debugger | spec.md + harness script + tests | — | [ ] |

T1's commit is the batch's only commit: `feat(T1): ...` (harness) —
the spec doc rides along.
