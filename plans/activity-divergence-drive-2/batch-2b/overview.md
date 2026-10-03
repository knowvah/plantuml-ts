# Batch 2b — families (D5–D9)

After the b1 close. Batches 2a and 2b run in parallel (six worktrees); source write-sets are disjoint (paths under `src/diagrams/activity/` unless shown).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2d](T2d-klimt-exception.md) | the two klimt fixes (D8) | typescript-pro | `src/core/klimt/document-shell.ts`, `src/core/klimt/creole/command/CommandCreoleUrl.ts` + non-theme option plumbing | T1b | [x] |
| [T2e](T2e-parser-gaps.md) | the 38 parse error rows (D6) | typescript-pro | `{parser,node-dispatch,dispatch-support,dispatch-common-commands,if-dispatch,group-dispatch,parallel-dispatch,switch-dispatch,list-backward-dispatch,ast}.ts` | T1b | [x] |
| [T2f](T2f-geometry-residuals.md) | geometry residuals | typescript-pro | `tiles/{gtile-if-with-links,gtile-fork,gtile-split}.ts`, `layout/walk-if-with-links.ts`, `activity-renderer-shapes.ts` | T1b | [x] |
| [T2g](T2g-spot-label-goto-embedded.md) | circle spot, label/goto, embedded diagram nodes (D6 follow-on) | typescript-pro | see spec | T2e | [ ] |
| [T2h](T2h-jupoxe-drift.md) | jupoxe axis drift at its origin | typescript-pro | see spec | T2e | [ ] |
| T2-close | b2 per close-procedure; pin round 1; re-cut cohort ws ≤ 150; write batch-3 | orchestrator | per close-procedure | T2b–T2f | [ ] |
