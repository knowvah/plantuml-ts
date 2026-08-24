# Batch 5 — re-pin, and prove nothing was silently traded

Two tasks, parallel: disjoint write-sets, both depending only on batch 4.

T8 is bookkeeping. **T9 is the guard**, and it is the more important of the
two: it is the only check that a routing change did not move a fixture that
was already byte-exact against the jar.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T8 | [Re-pin the moved baselines](T8-repin-baselines.md) | typescript-pro | `oracle/goldens/svg-sequence/diff-baseline.json`, `oracle/goldens/svg-sequence/diff-census.json`, `oracle/goldens/svg-description/diff-baseline.json`, `oracle/goldens/svg-conformance/routing-baseline.json` | T4-T7 | [ ] |
| T9 | [Integrity guard](T9-integrity-guard.md) | typescript-pro | *(evidence only — see the task)* | T4-T7 | [ ] |
