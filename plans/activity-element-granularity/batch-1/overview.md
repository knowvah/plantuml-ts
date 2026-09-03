# Batch 1 — the three swaps

**Sequenced, NOT parallel.** T3 writes both files T1 and T2 own, so the
write-sets genuinely overlap. Sequencing also makes each swap's effect
separately attributable against T0's pin: if a fixture regresses, the
responsible swap is unambiguous.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T1 | polyline → per-segment `<line>` | orchestrator | `src/diagrams/activity/renderer.ts` + its unit tests | T0 | [x] |
| T2 | `circle` → `ellipse` at activity call sites | orchestrator | `src/diagrams/activity/activity-renderer-shapes.ts` + its unit tests | T1 | [x] |
| T3 | multi-line label → one `<text>` per line | orchestrator | both files above + their unit tests | T2 | [x] |

**T3 may halt** ([D4]) if the per-line y advance cannot be cited from
upstream. T1 and T2 stand on their own if it does — they are independently
revertible and independently measured.

`src/core/svg-shapes.ts` is in **no** write-set. Sequence and json must not
move; T2 asserts that rather than assuming it.

**RESOLVED 2026-09-03.** T1 halted here when it raised the gated `weightedScore` 7.0% -- `compare.ts:404` charged a `[childCount]` short-circuit the SUM of both sides' sizes ([D10](../decisions.md#d10)). `svg-comparator-alignment` fixed the comparator (LCS alignment, charging only the unmatched remainder); T1 and T2 both landed after it merged. 8 fixtures needed documented exceptions tracing to four unrelated pre-existing defects, none of them element-granularity ([D11](../decisions.md#d11), `.agent-notes/aeg-T1-8-exceptions.md`).

**RESUMED and landed, 2026-09-03**, after `svg-comparator-alignment` fixed the instrument (D10). 260/268 fixtures fall or hold; 8 re-pinned as documented exceptions tracing to four unrelated pre-existing defects, none of them element-granularity — filed in `planning/next-missions.md`, full evidence in `.agent-notes/aeg-T1-8-exceptions.md`, decision D11.
