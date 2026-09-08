# T1 — Extend the element bucket for activity's exclusive SNames

**Agent:** `typescript-pro`
**Depends on:** T0 (the floor must be pinned first)

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML. The Java at
`~/git/plantuml` is the canonical specification — **read the method body,
not a filename or a remembered summary**. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md)
before starting; [D2] and [D3] govern this task and are locked.

The activity engine needs two things the shared style machinery does not
yet offer: a bucket for its own SNames, and a field to carry
`RoundCorner`.

## Read-set

- `src/core/skinparam-element-buckets.ts:20-60` — `ELEMENT_BUCKET_SNAMES`
  and the doc comment explaining the allowlist's contract
- `src/core/theme-graph-colors.ts:21-150` — `ElementColors`, especially the
  existing `fontSize`, `lineThickness` and `minimumWidth` fields and their
  doc comments (match that documentation density)
- `src/core/style-map-element.ts:52-85` — `DIAGRAM_TYPE_SELECTOR_NAMES` and
  `resolveElementBucketSelector`; note that it **collapses**
  `<diagramType>.<sname>` to the bare `sname` ([D2]'s central fact)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/SName.java` —
  confirm `activity`, `activityBar`, `activityDiagram`, `diamond`,
  `swimlane` are enum members
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:358-385`

## Write-set

- `src/core/skinparam-element-buckets.ts`
- `src/core/theme-graph-colors.ts`
- `tests/unit/core/skinparam-element-buckets.test.ts`
- `tests/unit/core/theme-graph-colors.test.ts`

(If a test file at those paths does not exist, create it; if the project
places these elsewhere, follow the existing location and say so in the
journal.)

## Task

1. Add `activity`, `activityBar`, `diamond`, `swimlane` to
   `ELEMENT_BUCKET_SNAMES`, each with a comment citing its `SName.java`
   line, in the style the existing `participant` entry sets.
   **Add nothing else** — [D3] forbids `arrow`, `note`, `circle`,
   `composite`.
2. Add an optional `roundCorner?: number` field to `ElementColors`, with a
   doc comment citing `plantuml.skin:361` and stating the `rx = ry = N / 2`
   mapping ([D4]).
3. Add an optional `padding?: number` field if and only if [D8]'s derived
   box height needs it to reach the sizer; if the existing fields suffice,
   do not add it and record why in the journal.

## Interface contract (consumed by T2)

```ts
// src/core/theme-graph-colors.ts
interface ElementColors {
  fontSize?: number;       // pre-existing
  lineThickness?: number;  // pre-existing
  roundCorner?: number;    // NEW — plantuml.skin:361, rx = ry = value / 2
  padding?: number;        // NEW, only if needed
}
```

`resolveElementFontSize(theme, sname, 'title')` must return the bucket
value for `sname` in `{activity, diamond, swimlane, activityBar}` when one
is set, and `undefined` when none is.

## Boundaries

**Always:** every added constant or SName carries its upstream `file:line`.
**Never:** seed `defaultTheme.colors.elements` in this task — that is [D2]'s
forbidden move and belongs to no task in this mission.
**Ask first (halt and journal):** if adding an SName changes any existing
engine's resolved theme.

## Acceptance criteria

- Given `<style> activityDiagram { activity { FontSize 20 } }`, when the
  theme resolves, then `resolveElementFontSize(theme, 'activity', 'title')`
  returns `20`
- Given `skinparam DiamondFontSize 40`, when the theme resolves, then
  `resolveElementFontSize(theme, 'diamond', 'title')` returns `40`
  (this is the filed `activity-diamond-font-skinparams`)
- Given a theme with no activity overrides, when resolved, then
  `resolveElementFontSize(theme, 'activity', 'title')` returns `undefined`
- Given the class, state, description, sequence and json conformance
  suites, when run, then **every one is byte-identical to `main`** — assert
  this by running them, and record the counts in the journal

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`. Check the vitest `Test Files` count — a
`coverage/.tmp` race can silently under-collect and still exit 0.

## Commit

`feat(asd-T1): add activity's own SNames to the element bucket`
