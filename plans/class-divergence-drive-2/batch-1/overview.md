# Batch 1 — S singletons + D dotted namespaces

Structure first (D2): uid ticks, child counts, fills, and the dotted-name
namespace edge offset. Write-sets below are PROVISIONAL — T6 rewrites them
from `diagnosis/S.md` and `diagnosis/D.md`, and sets `Depends On` so no two
unordered tasks share a file. Parallel tasks run in worktrees.

| ID | Description | Agent | Writes (provisional) | Depends On | Done |
|---|---|---|---|---|---|
| T7 | S structural singletons (8) | typescript-pro | per `diagnosis/S.md` (likely `renderer-uid.ts`, nested renderer) + tests | T6 | [ ] |
| T8 | S paint/text singletons (9) | typescript-pro | per `diagnosis/S.md` (likely theme/colour/font resolution) + tests | T6 | [ ] |
| T9 | D dotted-name namespaces (4) | typescript-pro | per `diagnosis/D.md` (likely parser/namespace, DOT cluster edges) + tests | T6 | [ ] |
| T10 | Residual round + close | orchestrator | [`../close-procedure.md`](../close-procedure.md) | T7, T8, T9 | [ ] |

Every fix task's prompt: [`../fix-task.md`](../fix-task.md) + its file.
