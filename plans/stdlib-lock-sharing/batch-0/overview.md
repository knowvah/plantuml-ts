# Batch 0 — Contention harness and baseline (SERIAL)

One task, and everything downstream depends on it.

T4 must prove the redesign beat the baseline. It cannot do that without a
reusable way to measure lock contention, and "the suite feels faster" is not
evidence. T0 builds the instrument and captures the before.

The orchestrator already measured these numbers once by hand-patching
`build-lock.ts` and reverting it. T0's job is to make that repeatable and
committed, then re-measure independently — **do not inherit the figures in
the README**; reproduce them.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Reusable contention harness + baseline capture | typescript-pro (sonnet) | `scripts/measure-lock-contention.ts`, `.agent-notes/lsh-T0.md` | — | [x] |
