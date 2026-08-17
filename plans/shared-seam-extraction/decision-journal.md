# Decision journal — shared-seam-extraction

| When | Task | Decision | Why | Evidence |
|---|---|---|---|---|
| 2026-08-17 | 1a+1b | Run batches 1a and 1b as ONE 7-way parallel batch (T1 T2 T4 T5 T6 T7 T8), shared working tree, per-task manifest scoped `--only` to touched engines, full manifest + dot-sync + 4 gates at batch end by orchestrator | README permits it; write-sets verified disjoint at planning; worktree isolation would need 6 gitignored asset dirs linked (`.agent-notes/si24-census-worktree-needs-ignored-assets.md`) | overview files; agents forbidden from checkout/reset/stash/clean (`.agent-notes/g0b-shared-worktree-risk.md`) |
