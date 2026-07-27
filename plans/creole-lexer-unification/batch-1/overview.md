# Batch 1 — Spike: measure corpus impact (GATE)

De-risk before touching production. Measure, for every description golden, how
the sizer's per-line width changes when its visible-text extraction switches
from `parseCreole` to the renderer's stripe engine. This decides go/no-go
(ADR-4) and pre-computes Batch 3's re-baseline.

| ID | Description | Agent | Writes | Depends On | Done |
|----|-------------|-------|--------|-----------|------|
| T1 | Spike script: current vs stripe-based sizer width, per fixture | typescript-pro | `scripts/measure-creole-lexer-delta.ts` | — | ☐ |

**Exit bar:** the script runs (exit 0) and prints, across all 351 goldens: count
of fixtures whose max node width would widen / shrink / stay neutral, with the
target fixtures (lurupu-11, gafico-37, nujito-06) called out. **GATE:** if
shrinks + neutral dominate and no *non-target* fixture widens materially,
proceed to Batch 2. If widespread NET widening → STOP and log (ADR-4).
