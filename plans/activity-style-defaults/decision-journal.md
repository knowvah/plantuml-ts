# Decision journal — `activity-style-defaults`

Appended during execution. One row per non-trivial judgment call: if a
reasonable developer might have chosen differently, log it.

Log the execution plan here at startup (autonomous mode replaces the
user-review step with this entry — `rules/parallelism.md`).

| Date | Task | Decision | Rationale | Evidence |
|---|---|---|---|---|
| 2026-09-08 | — | Execution plan: batches run in brief order 0→4; T3/T4 and T5/T6 are the only parallel pairs, each executed sequentially by the orchestrator rather than as parallel agents unless their write-sets are disjoint at the time. | `rules/parallelism.md` requires the plan be logged in autonomous mode rather than presented for review. | `plans/activity-style-defaults/README.md` batch index |
| 2026-09-08 | T0 | Generated the pin with a THROWAWAY scratchpad script that re-implements the census walk, rather than sharing code with the gate. | The gate is the authoritative implementation; a deliberately independent second implementation means a disagreement between them fails the gate on the pin it wrote, which is the check we want. The script is not committed — the write-set is three files. | `npx vitest run …/activity.style-baseline.test.ts` → 383 passed against a pin written by the other implementation |
| 2026-09-08 | T0 | Pinned the JAR side as well as ours, and gated it. | A jar-side move means the committed golden changed under the pin — a corpus event, not a port change — and it is worth failing loudly on. Cost is one extra `normalizeSvg` per fixture, no extra render. | `style-baseline.json` `jar` field; gate message names the side |
| 2026-09-08 | T0 | Recorded `textCount` as a stability tripwire, NOT a convergence target. | The two sides are already 327 elements apart (1588 ours / 1915 jar) before any change lands; that gap is owned by `activity-embedded-diagram-labels` and the creole families. D6 should leave it approximately fixed. | `.agent-notes/asd-T0.md` |
| 2026-09-08 | T0 | Recorded that **0 of 268** fixtures currently match the jar canvas on both axes. | Makes any fixture that reaches canvas parity after T3–T6 unambiguous evidence rather than noise. | `.agent-notes/asd-T0.md` |
