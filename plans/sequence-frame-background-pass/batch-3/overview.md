# Batch 3 — wire the background pass

One task. This is where the mission's measurable effect lands.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T6 | The background pass | `typescript-pro` | `src/diagrams/sequence/renderer.ts`, `tests/unit/sequence/renderer.test.ts` | T1, T3, T4, T5 | [x] |

Batch gate: the four per-task gates, then the adjudicator against this batch's
parent. **Invariant: zero `regression`.** Additionally, T6's own acceptance
criteria pin the two fixtures the scope measurement was derived from — if
either misses, that is **stop condition 6**: the measurement was wrong and the
plan needs re-deriving, not patching.
