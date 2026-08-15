# Decision journal — leaf-draw-order

Appended during execution. Every non-trivial judgement call gets a row.
Also record: T1 baseline tallies; the T4 MOVED set (fixture names) and any
fallback-uid reassignments; T5 diagnoses; the final --vs-jar tally.

| Date | Task | Decision | Why | Alternative rejected |
|---|---|---|---|---|
| | | | | |
| 2026-08-15 | B1 | Execution plan: branch `feat/leaf-draw-order` off main `82bbdda3` (note-leaf-model already merged via merge commit). T1 ∥ T2 (disjoint write-sets; T2 adds an unwired file, so T1's baseline capture on the working tree still reflects the base commit's output). T3 starts only after T1's four baselines exist on disk. Agents: typescript-pro ×3, no git commands; orchestrator commits per task. | Batch overview says T1 must capture before T3's changes exist; T2 cannot move output. | Running all three at once (T3 would race T1's capture). |
| 2026-08-15 | T1 | Default-mode report widened to list ALL 802 fixtures (note-less ones as `notes=0 tips=0`), per-line format unchanged, `TOTAL fixtures-with-notes: n/all` kept. | README's B2 bar is "`--check-order` moved set == the 47 ORDER-ONLY set" and 47 > the 19 note-carrying ORDER-ONLY fixtures, so ~28 movers are note-less; a note-only `note-order.txt` could not name them. T3's `--check identical` also becomes stronger (all 802 shas). | Keeping the note-only default report and adding a fourth mode — two baselines for one invariant. |
