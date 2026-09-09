# Decision journal — `activity-min-box-width`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-09 | plan | Execution plan (autonomous mode; replaces user review). Branch `feat/activity-min-box-width` from `afd2d5f2` (main = `8aad71eb` + the brief commit; source identical). Batches strictly sequential: T0 (orchestrator) → T1 → T2 → T3 → T4 → T5 → T6 (orchestrator). T3 has no dependency on T1 but shares `activity-style-defaults.ts` with T1 and `renderer-shapes.test.ts` with T4/T5, so it is NOT run in parallel (one writer per file). Every task agent is `typescript-pro`; the orchestrator re-runs the aggregate probe and the full suite after each landing and audits the agent's claims against them, never trusting the report. Baseline probe at branch start: aggregate 48291 -> 48291, 0 risers, 0 fallers, 0 errored; `svg/g[][childCount]=19771`. | Sequential because every task lands on the same fixtures and the attribution D5 buys depends on one change per measurement. | probe this session |
| 2026-09-09 | T0 | Landed `3277c5f3`. Pin: 268 baseline / 82 error / 23 jar-error, 0 partition mismatches against `diff-baseline.json`; gate 387 assertions green. Totals (ours / jar): textCount 1586 / 1915; fill `#181818` 1423 vs `#000` 1869; anchor `middle` 1133 + `start` 249 + absent 204 vs absent 1915; inset `60` on 779 of 843 vs `10` on 914 of 930. Gates: `npm test` 699 files / 19320 tests, typecheck 0, lint 0, build ok. Probe 48291 -> 48291. | The `60` inset is exactly half the 120 floor: T2 will move OUR inset without touching the anchor, so T2 and T5 are separable in this histogram and nowhere else — the attribution D5 was written to buy. | probe + gate + `.agent-notes/amb-T0.md` |
