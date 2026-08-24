# Batch 3 — the largest bucket, in the most shared file

One task, alone. `src/core/descriptive-keywords.ts` is consulted by the
class, description **and** sequence engines, so a change here reaches far
beyond its own 36 fixtures — which is exactly why it does not share a batch.

Depends on T3 having landed: one of its 36 (`sequence/repudi-21-rovo448`)
falls through to json otherwise (measured, D2).

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T4 | [Descriptive-signal over-decline](T4-descriptive-signal.md) | typescript-pro | `src/core/descriptive-keywords.ts`, `tests/unit/core/descriptive-keywords.test.ts` | T2, T3 | [x] |
