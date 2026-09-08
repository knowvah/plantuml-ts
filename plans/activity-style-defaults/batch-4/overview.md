# Batch 4 — the renderer, then re-pin

T5 and T6 are **parallel** (disjoint files). T7 is serial after both.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T5 | Resolved font, corner radius and circle ink in the shapes | typescript-pro | `src/diagrams/activity/activity-renderer-shapes.ts`, `tests/unit/activity/activity-renderer-shapes.test.ts` | T2, T3 | [x] |
| T6 | Arrow line thickness and swimlane font in the renderer | typescript-pro | `src/diagrams/activity/renderer.ts`, `tests/unit/activity/renderer.test.ts` | T2 | [x] |
| T7 | Re-measure, re-pin, close out | orchestrator | `oracle/goldens/svg-activity/diff-baseline.json`, `oracle/goldens/svg-activity/style-baseline.json`, `oracle/goldens/svg-activity/diff-census.json`, `plans/activity-style-defaults/README.md`, `planning/next-missions.md`, `.agent-notes/asd-T7.md` | T5, T6 | [x] |

**Write-set check:** T5 owns `activity-renderer-shapes.ts`; T6 owns
`renderer.ts`. No overlap. T7 is orchestrator-only — baseline JSON writes
are reserved (`scripts/repin-sequence-baselines.ts:3-8`).
