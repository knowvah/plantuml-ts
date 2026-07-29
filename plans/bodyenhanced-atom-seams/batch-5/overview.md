# Batch 5 — Widen the routing (ADR-6) + close

T5 is where conformance finally moves. It is separate from T4 by design:
T6 of the last mission bundled a routing change with four narrowings and
made "port or widening?" unanswerable without re-running.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T5 | Remove the three narrowing guards; delete flipped pins | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `leaf-sizing-legacy-fallback.ts`, `oracle/goldens/description/size-backlog.json` | T4 | [ ] |
| T6 | Perf check + mission close | orchestrator | `plans/*`, `planning/mission-index.md`, `plans/s1l-leaf-sizing/ledger.md` | T5 | [ ] |
