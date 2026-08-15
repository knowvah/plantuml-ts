# Batch 2 — port the dimension

This is where output moves. Both tasks write the composite's size; they are
**strictly serial** and must not be parallelised — T4 layers on top of the
value T3 produces, and they touch overlapping derivations.

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T3 | Replace `boundingBox`/`BOX_PAD` with the ink walk + `delta(15,15)` | typescript-pro | `src/diagrams/state/state-composite-geo.ts` (+ test) | B1 | [ ] |
| T4 | Layer `InnerStateAutonom`'s `MARGIN*2 + 2*MARGIN_LINE + marginForFields` | typescript-pro | `src/diagrams/state/state-composite-sizing.ts` (+ test) | T3 | [ ] |

## Expect movement, and measure it per-task

T3 alone may make the three named fixtures WORSE before T4 lands — the two
constants are one layered formula and only their sum is meaningful. That is
the one sanctioned dip in this mission, it must be recorded in the journal
with its numbers, and it must be GONE by the end of T4. Every other
regression is a stop.

## Batch exit bar

1. T1's harness reports the three named fixtures at width `deltaPx` **0.000**.
2. The harness's total `exact` count is strictly HIGHER than the T1 baseline.
3. state DOT-parity 268/268, unmoved.
4. All 59 svg-state pins hold. **A broken pin is a stop, never a re-baseline.**
5. No non-state diagram type moves at all.
6. All four quality gates green.
