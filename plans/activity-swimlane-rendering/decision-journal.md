# Decision journal — `activity-swimlane-rendering`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-09 | plan | Execution plan: batches 0–7 strictly sequential (each depends on the previous); T0 and T7 orchestrator-executed; T1–T6 one agent each, no parallelism within a batch. Branch `feat/activity-swimlane-rendering` from `d0a7e1bd`. | Every batch has one task and every task depends on the previous batch; there is nothing to run in parallel. | README Index; batch overviews |
| 2026-09-09 | T0 | Census core split into `tests/oracle/svg-conformance/swimlane-census.ts` (pure, no vitest import), with the gate importing it. Not in the write-set as written. | A `.test.ts` cannot be imported by a plain script (vitest's `describe` throws outside a runner), and the re-pin generator must use the SAME instrument as the gate or it is a second instrument. Push-forward item "file organisation". | `swimlane-census.ts` doc comment |
| 2026-09-09 | T0 | Divider rule: vertical line that is TOP-ANCHORED (starts at the smallest y any vertical line reaches) AND spans ≥ 50% of the canvas. The first cut (span only) mis-counted 22 of 25 anomalies. | Upstream draws dividers without the title translate every edge is drawn under (`Swimlanes.java:342` vs `:338-340`), so a divider's top is the drawing's top. | `.agent-notes/asr-T0.md` |
| 2026-09-09 | T0 | `letuke-04-poza319` (a two-pipe creole table row inside a multi-line action) stays in the population with an empty census rather than being excluded by a parser-like rule. | The needle is a transcription of `CommandSwimlane.java:59-67`; excluding it would need multi-line-action tracking in the instrument, and the entry is harmless (0 lanes both sides). | `.agent-notes/asr-T0.md` |
| 2026-09-09 | T0 | The JAR's `lanes` are derived from consecutive ascending dividers; OURS from `ActivityGeometry.swimlanes`. Asymmetric by design. | The jar exposes no geometry; the port's geometry is the quantity T4/T5 move and our SVG today lacks the outer right divider to derive it from. | `swimlane-census.ts#lanesFromDividers` |
| 2026-09-09 | T0 | Gates: `npm test` 695 files / 18847 tests green (baseline 694 / 18741, +1 file +106 tests), `typecheck` 0 errors, `lint` 0, `build` ok. | — | this session |
