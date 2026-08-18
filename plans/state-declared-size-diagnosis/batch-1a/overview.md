# Batch 1a — Bucket diagnosis (parallel; disjoint from 1b, may run together)

Each task writes ONLY `findings/<bucket>.md`; the orchestrator commits each by
pathspec (ADR-8). Agents run no git. Cross-bucket `sharedCauseWith` claims are
expected — the T14 synthesis reconciles them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | composite-a (10) | typescript-pro | `findings/composite-a.md` | T0 | [x] |
| T2 | composite-b (10) | typescript-pro | `findings/composite-b.md` | T0 | [x] |
| T3 | concurrent-region (8) | typescript-pro | `findings/concurrent-region.md` | T0 | [x] |
| T4 | pseudo-state (7) | typescript-pro | `findings/pseudo-state.md` | T0 | [x] |
| T5 | skinparam-style (7) | typescript-pro | `findings/skinparam-style.md` | T0 | [x] |
| T6 | attribute-line (6) | typescript-pro | `findings/attribute-line.md` | T0 | [x] |
| T7 | stereotype (5) | typescript-pro | `findings/stereotype.md` | T0 | [x] |
