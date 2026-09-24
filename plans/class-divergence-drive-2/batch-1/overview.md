# Batch 1 — S singletons + D dotted namespaces

Structure first (D2): uid ticks, child counts, fills, and the dotted-name
namespace edge offset. Write-sets set by T6 from `diagnosis/S.md`, `D.md`, `R.md`; no two
unordered tasks share a file.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | S structural + edge singletons (9): S-1, S-1b, S-2, S-4, S-8, S-11, S-12 | typescript-pro | `class-namespace-resolve.ts`, `parser.ts`, `renderer-edge.ts`, `class-assoc-double-couple.ts`, `class-relationship-parser.ts`, `class-geo-types.ts`, `class-edge-label-{attach,anchor}.ts`, `renderer-classifier-box.ts`, `renderer-group.ts`, `class-namespace-shape.ts` + tests | T6 | [x] |
| T9 | CLIP-1 diagnosis (fix moved to T12, journal row 14; no commit) | typescript-pro | `diagnosis/CLIP-1.md` (orchestrator-written) | T6 | [x] |
| T7b | `stack` container shape (lojiga, R-8) | typescript-pro | new `class-namespace-stack-shape.ts`, `class-namespace-shape.ts`, `class-container.ts`, `class-ink-{shapes,box}.ts` + tests | T7 | [x] |
| T8 | S paint singletons (6): S-3, S-5, S-6, S-7, S-10, S-13 | typescript-pro | `core/style-cascade-class*.ts`, `core/skinparam-*.ts` (stereo keys, handlers a/b, accumulator, theme builder), `core/theme-graph-colors-{a,b}.ts`, `core/svg-text-font.ts`, `class-visibility-icon.ts`, `renderer-classifier-{box,header-split,rows,colors}.ts` + tests | T7 | [x] |
| T10 | Residual round + close | orchestrator | [`../close-procedure.md`](../close-procedure.md) | T7, T7b, T8 | [x] |

Waves: **T7 ∥ T9**, then **T7b ∥ T8** (T7b and T8 both follow T7 on a
shared file). Parallel tasks run in worktrees; T9's `class-edge-geo.ts`
is not in any other batch-1 write-set. Every fix task's prompt:
[`../fix-task.md`](../fix-task.md) + its file + its diagnosis sections.
