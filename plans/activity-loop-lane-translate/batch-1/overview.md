# Batch 1 — the shapes

Parallel after Batch 0, one isolated worktree each (memory
`batch-parallelism-needs-worktrees`). Disjoint write-sets: T2 owns the while
module and walker, T3 the repeat module and walker; neither touches
`swimlane-placement.ts` or `swimlane-loop-translate.ts` (stop 1 if it must —
halt, do not edit).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T2 | `FtileWhile.ConnectionBackSimple#drawTranslate` | typescript-pro | while module, `walk-while-branch.ts`, its test | T0, T1 | [ ] |
| T3 | `FtileRepeat` `ConnectionOut`/`BackSimple1`/`BackSimple2`/`BackComplex1` `drawTranslate` | typescript-pro | repeat module, `walk-repeat.ts`, its test | T0, T1 | [ ] |

Specs: [`T2-while-back.md`](T2-while-back.md), [`T3-repeat-shapes.md`](T3-repeat-shapes.md).
Expected movers: the `fixtures.md` rows T0 classed for each builder, and
any parent re-centring — name each. Batch close: merge both, re-run
render-all, journal the aggregate.
