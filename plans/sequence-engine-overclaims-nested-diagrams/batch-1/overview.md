# Batch 1 — build the measuring instrument first

One task, and nothing else may start until it lands. Every later batch is
judged by the number this task produces; without it a reorder that fixes 70
fixtures and breaks 5 is indistinguishable from one that fixes 65.

Nothing in this batch changes any rendered byte — it adds a test and a
baseline. `render-manifest` must be unmoved at the end of it.

| ID | Description | Agent | Writes | Depends On | Done |
|----|---|---|---|---|---|
| T1 | [Routing-conformance gate](T1-routing-conformance-gate.md) | typescript-pro | `tests/oracle/svg-conformance/routing-conformance.test.ts`, `oracle/goldens/svg-conformance/routing-baseline.json` | — | [ ] |
