# Batch 3 — re-pin and close out

**Orchestrator only.** Re-pinning is never delegated: a pin that rose must be
matched to a journal row by the one reader who saw every task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Re-pin the activity baselines, verify the exit bar, file follow-ons | orchestrator | `oracle/goldens/svg-activity/{diff-baseline,style-baseline,swimlane-baseline,text-baseline}.json` (only those that change), `planning/next-missions.md`, `planning/mission-index.md`, `plans/activity-edge-draw-order/{README.md,batch-3/overview.md,decision-journal.md,measurements/final.json}`, `.agent-notes/aedo-T4.md`, `docs/catalog.md` (on drift) | T3 | [x] |

Spec: [`T4-repin-close-out.md`](T4-repin-close-out.md).
