# Decision journal — namespace-cluster-box

Appended during execution. Every non-trivial judgement call gets a row:
"non-trivial" means a reasonable developer might have chosen differently.

Also record here, because later tasks are measured against them:

- T1's baseline reproduction (expect 691 / 20685)
- T4's **dipped** numbers — the one expected regression in this mission
- T5's numbers, which must exceed the batch-1 baseline
- the per-fixture outcome for the 11 named residual fixtures
- any residual that survives Batch 3, with its mechanism

| Date | Task | Decision | Why | Alternative rejected |
|---|---|---|---|---|
| 2026-08-14 | Batch 1 | Run T1/T2/T3 as three parallel `typescript-pro` agents | Write-sets are disjoint (`scripts/`, `src/diagrams/class/` + its test, `src/core/` + state) and no task consumes another's output within the batch | Sequential execution — no dependency justifies the wall-clock cost |
| 2026-08-14 | T1 | If the doc-size count reproduces at 691 but the matched-shape total differs from 20685, the agent reports and stops rather than tuning the matcher | Tuning the algorithm to hit a remembered number is fitting, which the port's rules forbid; the gate's job is sensitivity and stability, and the orchestrator judges the delta | Silently accepting whatever the new harness reports as the baseline |
| 2026-08-14 | T1 | **Baseline re-pinned to 691 / 20765.** The document-size count reproduced EXACTLY (691/1073); the matched-shape total came in at 20765, +80 (0.4%) above the pinned 20685 | The 691 half is oracle-backed and confirms the harness sees the same tree, so the delta is an algorithm difference from the planning-time scratch script — which no longer exists and whose tolerance, denominator and tie-breaking were never specified beyond two bullets. Reproducing an unspecified algorithm bit-for-bit is unachievable, and chasing it IS the fitting the brief forbids. Re-pinning is safe here and only here: the tree is unmodified, so no mission-caused regression can hide behind it. Sensitivity is preserved — the matcher's ±0.05 position/size tolerance is far below every residual this mission targets (0.18, 0.29, 0.32, 0.39, 4, 8), and it compares size as well as position, which is the leniency the spec actually warned about | (a) Tuning tolerance/denominator until 20685 appeared — fitting, and it would have silently changed the gate's sensitivity. (b) Halting the mission on a number with no oracle behind it |
