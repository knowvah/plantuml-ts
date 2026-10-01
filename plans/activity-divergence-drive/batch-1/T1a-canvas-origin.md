# T1a — canvas origin and margin (D2)

Agent: typescript-pro, worktree `add1-T1a`. Commit:
`fix(activity): port the document margin and root ftile bounds`.

## Context
All 311 scored activity fixtures carry `svg/@width|@height|@viewBox` diffs,
and every drawn element sits +4 x / +3 y (sometimes +4/+4, +3/+3) left of
the jar's — `fixtures.md`'s `shift` column, `measurements/b0-classify.json`.
Ours is a flat `LAYOUT_MARGIN = 12` on every side (`activity-layout-
constants.ts`), consumed by `assign-coordinates-full.ts#computeBounds`,
`tile-layout.ts`, `tile-coordinates.ts`, `swimlane-placement.ts`. Upstream's
document margin is `same(10)` (`TitledDiagram.java:275`), so the goldens' ink
at 16/15 (and 20/25, 17.5 — the re-filing in `planning/next-missions.md`
`activity-canvas-margin`, 2026-09-08) means the root ftile's bounding box
contains something beyond ink that we do not model. The 2026-09-08 filing's
"retune 12 → 16" premise is FALSE (memory `activity-canvas-margin-premise-
was-false`); do not open this as a constant change.

## Task
1. **Diagnose before editing** (journal row with quotes): `UgDiagram.java:145`
   — what `.margin(...)` wraps; `TitledDiagram#getDefaultMargins`;
   `ActivityDiagram3#exportDiagramInternal` → `createImageBuilder` → the
   `TextBlock` it draws; the root ftile from `VCompactFactory` /
   `FtileFactoryDelegator*` and what `calculateDimension` adds around the
   content (`FtileMarged`? the swimlane `getMinMax` `Swimlanes.java:455-487`;
   `TextBlockUtils.java:138-141`); and why `kodiji` (`start` alone,
   `backgroundColor transparent`) lands at 15 while `rarodo` lands at 16/15.
   State the mechanism that produces 16, 15, 17.5, 20 and 25 from `same(10)`.
2. Port it: `computeBounds` models the jar's root bounds + `same(10)`;
   `LAYOUT_MARGIN` is deleted and its four consumers take the ported origin.
   Every constant carries its `file:line`.
3. Tests: `tests/diagrams/activity/layout/canvas-bounds.test.ts` gains the
   kodiji/rarodo absolute pins (55×55 at (25,25); 75×107, rect at 16,55);
   the existing layout tests that pinned 12 are updated with the quote.
4. Re-pin `diff-baseline.json` and `swimlane-baseline.json` (`scripts/repin-
   activity-baselines.ts`); diff before/after; every ROSE row gets a journal
   line (stop 5 otherwise).

## Write-set
`src/diagrams/activity/layout/{assign-coordinates-full,tile-layout,
tile-coordinates,swimlane-placement}.ts`, `src/diagrams/activity/activity-
layout-constants.ts`, `tests/diagrams/activity/layout/**`,
`oracle/goldens/svg-activity/{diff,swimlane}-baseline.json`.

## Read-set
`decisions.md#D2`; `src/diagrams/activity/layout/assign-coordinates-full.ts`
(whole, 240); `activity-layout-constants.ts` (58); the `LAYOUT_MARGIN` sites
in `tile-layout.ts`, `tile-coordinates.ts`, `swimlane-placement.ts` (grep);
Java: `UgDiagram.java:130-160`, `TitledDiagram.java:265-285`,
`activitydiagram3/ActivityDiagram3.java` (export path), `ftile/vcompact/
VCompactFactory.java`, `Swimlanes.java:440-500`, `klimt/shape/TextBlockUtils
.java:120-150`; `planning/next-missions.md` `activity-canvas-margin` (re-
filing + original); `.agent-notes/asd-T7.md`.

## Acceptance
- Given the Java in step 1, when read, then the journal quotes the lines that
  produce 16/15 AND the 20/25/17.5 variants BEFORE any edit.
- Given `kodiji-34-mofe202`, when rendered, then 55×55 with the ellipse at
  (25,25): zero `svg/@*` diffs.
- Given the 311 rows at b1, when classified, then `canvas` survivors are a
  journaled set with named mechanisms, and 0 unexplained rises.
- Given `grep -rn LAYOUT_MARGIN src/`, then no match.

Quality bar: targeted vitest (`tests/diagrams/activity/**`, the four activity
baseline tests) + typecheck + eslint. Boundaries: never a retuned constant
(stop 12/13); never touch renderer files (T1b's). Observability: N/A.
Rollback: Reversible.
