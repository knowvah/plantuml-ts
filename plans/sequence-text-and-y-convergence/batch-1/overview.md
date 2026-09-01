# Batch 1 — the seam

One task, alone. Nothing in batch 2 can start until it lands, and its gate is
unusual: **nothing may move**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| A1 | text emitter + geometry metric fields | typescript-pro | `sequence-text.ts` (new), `ast.ts`, `scale-geo.ts`, its test | — | [ ] |

## Why it is alone

A1 adds the emitter every other Phase A task routes through, and it adds the
geometry fields all four of them populate. Doing the type additions here is
what makes A2–A5 write-set-disjoint and therefore parallel — otherwise all
four would contend on `ast.ts`.

## The gate: nothing moves

A1 changes no call site. If any golden shifts, the type additions leaked into
behaviour and the batch is wrong. That is a cleaner correctness signal than
any assertion, and it is stop condition 6.

Verify with the distance instrument: total distance must be **exactly**
2 578 916.759, unchanged.
