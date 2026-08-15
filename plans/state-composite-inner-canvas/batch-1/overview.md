# Batch 1 — measure first, change nothing

Nothing in this batch alters rendered output. Its job is to make the defect
VISIBLE to a gate before any code moves, because every standing gate
under-reports it (README §"The measurement that matters").

| ID | Description | Agent | Writes | Depends on | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Declared-composite-size harness + baseline | typescript-pro | `scripts/measure-composite-declared-size.ts` | — | [ ] |
| T2 | Make the inner drawn content reachable for an ink walk | typescript-pro | `src/diagrams/state/state-composite-sizing.ts` (+ its test) | — | [ ] |

T1 and T2 are parallel: disjoint write-sets, neither consumes the other's
output within the batch. Batch 2 consumes both.

## Batch exit bar

1. T1 reports a baseline count of exactly-matching composites over all 141
   composite-carrying fixtures, and REPRODUCES 0.527 on
   `bemena-23-zebu249` / `pajefo-95-neri955` / `xepafa-33-lazi826`.
   **If it cannot reproduce that, STOP** — the mission's premise is wrong.
2. T2 exposes an ink extent for a composite's inner content without
   changing any dimension that anything consumes.
3. All four quality gates green; DOT-parity 268/268; 59 pins hold.
4. Rendered output byte-identical to the pre-batch tree. This batch is
   measurement and plumbing only — if any fixture moves, something leaked.
