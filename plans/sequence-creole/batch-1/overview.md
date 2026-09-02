# Batch 1 — the creole seam

One task, alone. Nothing in batch 2 or 3 can start until it lands, and its gate
is unusual: **nothing may move**.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| C1 | creole → `TextRun[]`, run style/url, scaling | typescript-pro | `sequence-creole.ts` (new), `text-block-geo.ts`, `sequence-text.ts`, `scale-geo.ts`, its test | — | [x] |

## Why it is alone

C1 adds the function every later task calls and the run fields all four of them
populate. Doing the type widening here is what makes C3–C6 write-set-disjoint;
otherwise all four contend on `text-block-geo.ts`.

## The gate: nothing moves

C1 changes no producer and no renderer. If any golden shifts, the widening
leaked into behaviour and the batch is wrong — a cleaner correctness signal
than any assertion, and stop condition 6.

Verify with the cohort line: `descended` must still be **797**, and the element
census unchanged.
