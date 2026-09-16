# Batch 0 — tooling and AST (parallel)

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T0 | Commit the diagonal scan and render-all tools; record `base.json` | orchestrator | `scripts/activity-diag-scan.ts`, `scripts/activity-render-all.ts`, `tests/unit/scripts/activity-diag-scan.test.ts`, `measurements/base.json` (already in place) | — | [ ] |
| T1 | `ActivityRepeat.entry` + repeat `yesLabel`/`outLabel` in the AST and parser; output byte-identical | typescript-pro | `src/diagrams/activity/ast.ts`, `src/diagrams/activity/node-dispatch.ts`, `src/diagrams/activity/layout/tile-layout.ts` (prepend `entry` to the body), `tests/unit/activity/parser.test.ts`, `tests/diagrams/activity/layout/tile-layout.test.ts` | — | [ ] |

Disjoint write-sets; run in parallel (separate worktrees if agents run
concurrently — memory `batch-parallelism-needs-worktrees`). Specs:
[`T0-tooling.md`](T0-tooling.md), [`T1-ast-repeat-entry.md`](T1-ast-repeat-entry.md).
Expected movers: none (both tasks must leave every rendered SVG byte-identical).
