# Batch 1 — the seam

One task, alone. Nothing in batch 2 can start until it lands, and its gate is
unusual: **nothing may move**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| A1 | text emitter, `TextRun` metrics, `ast.ts` split | typescript-pro | `sequence-text.ts` (new), `geo.ts` (new), `ast.ts`, `text-block-geo.ts`, `scale-geo.ts`, tests | — | [x] |

## Why it is alone

A1 adds the emitter every other Phase A task routes through, and it adds the
metric fields all four of them populate. It also performs the `ast.ts` split
(D8) — done here, once, rather than contended across batch 2.

## The gate: nothing moves

A1 changes no call site. If any golden shifts, the type additions leaked into
behaviour and the batch is wrong. That is a cleaner correctness signal than
any assertion, and it is stop condition 6.

Verify with the distance instrument: total distance must be **exactly**
2 578 916.759, unchanged.

## Result (2026-09-01)

Landed as `da67c704`. Distance `2578916.759`, `descended=714`,
`numericDiffs=51890` — every figure identical to the pre-batch measurement.
All four gates green (17 192 tests; branches 90.69%).

The original scalar-per-geo contract was replaced mid-task; see D8 and the
amendment banner on `A1-text-emitter-and-metrics.md`.
