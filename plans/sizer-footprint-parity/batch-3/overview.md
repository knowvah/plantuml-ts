# Batch 3 — Widen the guards, then close

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Remove both narrowing guards; delete flipped pins; perf check | typescript-pro | `src/diagrams/description/leaf-sizing.ts`, `oracle/goldens/description/size-backlog.json` | T2 | [ ] |
| T4 | Close: correct the superseded ledger remedy, mission-index | orchestrator | `plans/*`, `plans/s1l-leaf-sizing/ledger.md`, `planning/mission-index.md` | T3 | [ ] |

T3 is where conformance moves. It is separate from T1/T2 by design, so a
ratchet movement has exactly one candidate cause — the discipline ADR-6 of
the previous mission established.
