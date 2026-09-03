# Batch 1 — the three swaps

**Sequenced, NOT parallel.** T3 writes both files T1 and T2 own, so the
write-sets genuinely overlap. Sequencing also makes each swap's effect
separately attributable against T0's pin: if a fixture regresses, the
responsible swap is unambiguous.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | polyline → per-segment `<line>` | opus | `src/diagrams/activity/renderer.ts` + its unit tests | T0 | [ ] |
| T2 | `circle` → `ellipse` at activity call sites | sonnet | `src/diagrams/activity/activity-renderer-shapes.ts` + its unit tests | T1 | [ ] |
| T3 | multi-line label → one `<text>` per line | opus | both files above + their unit tests | T2 | [ ] |

**T3 may halt** ([D4]) if the per-line y advance cannot be cited from
upstream. T1 and T2 stand on their own if it does — they are independently
revertible and independently measured.

`src/core/svg-shapes.ts` is in **no** write-set. Sequence and json must not
move; T2 asserts that rather than assuming it.
