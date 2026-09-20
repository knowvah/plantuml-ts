# Batch 2 — capture the five never-captured families (orchestrator only)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | capture board/chart/chronology/files/packet with T1's script; re-pin routing + refusal BEFORE the capture commit; add freshness sentinels | orchestrator | `test-results/dot-cache/{board,chart,chronology,files,packet}/**`, `oracle/goldens/svg-conformance/routing-baseline.json`, `oracle/goldens/svg-conformance/refusal-baseline.json`, `tests/oracle/svg-conformance/oracle-freshness.test.ts` | T1 | [ ] |

Runs while batch 3's T6 is being built (disjoint write-sets).
