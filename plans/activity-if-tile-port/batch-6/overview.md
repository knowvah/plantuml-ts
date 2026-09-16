# Batch 6 — re-pin once and close out

Orchestrator task, sequential after Batch 5.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T7 | Final measurement, rise check, single re-pin, siblings, follow-ons, Session End | orchestrator | `oracle/goldens/svg-activity/{diff,swimlane,style,text}-baseline.json`, `measurements/final.json`, `planning/next-missions.md`, `planning/mission-index.md`, `plans/activity-if-tile-port/README.md`, `.agent-notes/aitp-T7.md`, `docs/catalog.md` | T6 | [ ] |

Spec: [`T7-repin-close-out.md`](T7-repin-close-out.md).
