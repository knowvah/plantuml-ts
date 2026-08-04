# SI15 Decision Journal

| Date | Task | Decision / Finding | Why | Flagged for review? |
|------|------|--------------------|-----|---------------------|
| 2026-08-03 | plan | Planning phases 2–6 auto-confirmed under the user's "start on mission SI15" directive; scope fixed by the SI15 mission-index row + GH #26, both user-approved during SI14. | Autonomous session; the confirmations existed to fix scope, which was already fixed. | yes — user may override any ADR before batch 2 lands |
| 2026-08-03 | plan | ADR-1 rejects the diagnosis note's `(rasterWidth ?? width) - 1` in favour of a guarded fallback (declared dims unchanged when rasterless). | Blanket −1 would silently shrink latex/KaTeX and future rasterless paths by 1px, unmeasured; guarded form is behaviour-preserving outside the diagnosed mechanism. | yes |
| 2026-08-03 | plan | Baselines (pre-flight, tree = main c2bbc530 + brief): typecheck exit 0, lint exit 0, full `npm test` run recorded below at batch-1 start. SI14 close had 476 files / 11,428 tests cold-tree green on this identical tree. Size-deltas baseline: 320/351, widened 0, sprite bucket 5. Pinned diffs baseline: `class-usecase-inline-sprite` 11 entries, `class-allowmixing-usecase-mix` 2 entries. | Execution baseline for gate comparison. | no |
