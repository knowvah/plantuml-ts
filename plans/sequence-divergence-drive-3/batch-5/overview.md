# Batch 5 — drawn-extent canvas and the leftovers (D1: diagnose first)

Runs after batches 1-4 close. T5a and T5b are read-only on `src/`: each
writes only its artifact. T5a needs batch 3's exporter change landed (the
canvas size is computed there). T5b measures what is still open at the B4
close; many planning-time rows will already have fallen. T5b proposes fix
tasks (T5c…); the orchestrator spawns them, journals each write-set before
work starts, and keeps one sub-batch file-disjoint (push-forward).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T5a](T5a-diagnose-drawn-extent.md) | diagnose then fix the drawn-extent canvas (kaluna) | debugger (sonnet) | `diagnosis/drawn-extent.md`, then per artifact | B3 | [x] (artifact; fix re-slotted to T8g, row 69) |
| [T5b](T5b-diagnose-leftovers.md) | diagnosis of every row still open after B1-B4 | debugger (sonnet) | `diagnosis/leftovers.md` | B4 | [x] |
| [T5c](T5c-real-line-solver.md) | jexavi: participant x through a `real/RealLine` port (leftovers.md M2; shape A target, B fallback) | typescript-pro (sonnet) | new `sequence-real-line.ts`, `sequence-layout-participants.ts`, `sequence-layout-parallel-disjoint.ts`, `sequence-layout-participant-constraints.ts` + tests | T5b | [x] |
| close | standard close | orchestrator | per close-procedure | all T5 | [x] |
