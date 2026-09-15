# Batch 7 — re-pin and close out

**Orchestrator only.** Re-pinning is never delegated: a pin that rose must be
matched to a journal row by the one reader who saw every task.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T8 | Re-pin the activity baselines, verify the exit bar, file follow-ons | orchestrator | `oracle/goldens/svg-activity/{diff-baseline,diff-census,style-baseline,swimlane-baseline,text-baseline}.json`, `planning/next-missions.md`, `planning/mission-index.md`, `plans/activity-lane-capture/{README.md,batch-7/overview.md,decision-journal.md,measurements/*}`, `.agent-notes/alc-T8.md`, `docs/catalog.md` (on drift) | T7 | [x] |

Spec: [`T8-repin-close-out.md`](T8-repin-close-out.md).
