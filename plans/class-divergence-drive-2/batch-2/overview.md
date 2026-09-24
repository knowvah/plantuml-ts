# Batch 2 — Q qualifier / port / role-slash links

Link features on top of the faithful `Kal` port (D7). Moves layout: node
margins and anchors shift, so pin-diff risers are expected and each needs a
mechanism. Write-sets PROVISIONAL until T6; T11–T13 run in parallel
worktrees only if T6 finds them disjoint, otherwise sequentially in ID order.

| ID | Description | Agent | Writes (provisional) | Depends On | Done |
|---|---|---|---|---|---|
| T11 | Single qualifier residual (11) | typescript-pro | per `diagnosis/Q.md` (likely `class-kal.ts` non-structural, edge/anchor files) + tests | T10 | [ ] |
| T12 | Two-sided / multiple qualifiers (8) | typescript-pro | per `diagnosis/Q.md` + tests | T10 (+ T11 if shared) | [ ] |
| T13 | Member ports + role-slash labels (4) | typescript-pro | per `diagnosis/Q.md` (likely `class-port-rows.ts`, link label parse) + tests | T10 | [ ] |
| T14 | Residual round + close | orchestrator | [`../close-procedure.md`](../close-procedure.md) | T11, T12, T13 | [ ] |

Every fix task's prompt: [`../fix-task.md`](../fix-task.md) + its file.
