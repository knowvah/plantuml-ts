# Batch 4 — lane extents and widths

Phase one of [D1]'s two-phase shape: measure, then (in Batch 5) place.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| T4 | Per-lane content extents and content-fitted widths | typescript-pro | `src/diagrams/activity/layout/swimlane-context.ts`, `src/diagrams/activity/activity-layout-types.ts` | T3 | [ ] |

**Stop condition 4 applies here.** The lane padding must be sourced to a
`plantuml.skin:NNN` or a Java `file:line`. The goldens imply roughly 5px a
side; that number is a MEASUREMENT, not a source, and fitting it is
forbidden. If it cannot be sourced, halt and journal.
