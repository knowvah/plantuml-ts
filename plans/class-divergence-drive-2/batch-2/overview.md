# Batch 2 — Q qualifier / port / role-slash links

Link features on top of the faithful `Kal` port (D7). Moves layout: node
margins and anchors shift, so pin-diff risers are expected and each needs a
mechanism. Write-sets set by T6 from `diagnosis/Q.md`.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T11 | Q-1 header re-centre + Q-3 box X (9) | typescript-pro | `class-badge.ts`, `class-dot-width-floors.ts`, `class-layout-generic-classifier.ts`, `core/graph-layout.ts`, `core/graph-layout-build.ts` + tests | T10 | [ ] |
| T12 | Q-2 Kal endpoint + ctrl shift, Q-7 Kal overlap, CLIP-1 magnetic border + bezier drop (11 + Q-2 everywhere) | typescript-pro (opus) | `class-edge-geo.ts` (attachKalBoxes), `renderer-arrowhead.ts`, `class-kal.ts` (+ `class-kal-overlap.ts`), `layout.ts` (clusterRects), `class-shield-helpers.ts`, `core/spline-clip.ts`, `core/svek/Cluster.ts` + tests | T10 | [ ] |
| T13 | Q-9 role ink, Q-6 port canvas, Q-4/Q-5 style, Q-10 (7) | typescript-pro | `class-ink-box.ts`, `layout-ink-extent.ts`, `renderer-classifier-badge-tag.ts`, `class-dot-graph.ts`, `layout.ts`, `class-stereotype-layout.ts`, `core/style-cascade-class*.ts` + tests | T11, T12 | [ ] |
| T14 | Residual round + close | orchestrator | [`../close-procedure.md`](../close-procedure.md) | T11, T12, T13 | [ ] |

Waves: **T11 ∥ T12** (worktrees), then **T13**. mucoti/sefazi (Q-8) are
settled as `open -> docs/graphviz-issues/19-...` by T6. Every fix task's
prompt: [`../fix-task.md`](../fix-task.md) + its file + its diagnosis
sections.
