# T2 — The activity style-default table and its resolvers

**Agent:** `typescript-pro`
**Depends on:** T1 (`roundCorner` field, SName allowlist)

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification — **read the method body**.
Read [`../README.md`](../README.md) and [`../decisions.md`](../decisions.md)
first. [D1], [D2] and [D5] govern this task and are locked.

Upstream resolves each activity element's font size, line thickness and
corner radius from a diagram-scoped style signature. Our
`theme.colors.elements` map is flat and cannot carry a diagram-scoped
DEFAULT ([D2]), so the defaults live here and the bucket supplies only
user overrides.

## Read-set

- `~/git/plantuml/src/main/resources/skin/plantuml.skin:308-321` (root
  `swimlane` and `note` blocks) and `:358-385` (the `activityDiagram`
  block) — **the spec; read it, do not copy the README's table**
- `src/core/theme-element-resolve.ts:60-130` — `resolveElementFontSize` and
  `resolveElementLineThickness`, in particular their documented
  "absent → caller applies its own default" contract
- `src/core/klimt/color/HColorSet.ts` — how a `#N` palette shorthand
  resolves ([D5])
- `src/diagrams/description/layout.ts:21,362` — the existing consumer
  pattern to mirror

## Write-set

- `src/diagrams/activity/activity-style-defaults.ts` (create)
- `tests/unit/activity/activity-style-defaults.test.ts` (create)

## Task

Create the module. One named constant per upstream value, each with a
JSDoc `@see` carrying its `plantuml.skin:NNN` line — the project's
convention for a ported symbol. Then export resolvers of the shape:

```ts
export function activityFontSize(theme: Theme, sname: ActivitySName): number
export function activityLineThickness(theme: Theme, sname: ActivitySName): number
export function activityRoundCorner(theme: Theme, sname: ActivitySName): number
```

Each consults `resolveElement*` first and falls back to this module's
constant — the two-tier cascade [D2] describes.

Values to port (verify each against the skin file; the list below is a
pointer, not the source of truth): `activity` FontSize 12 / Padding 10 /
RoundCorner 25; `diamond` FontSize 11; `arrow` FontSize 11 / LineThickness
1; `circle` start/stop/end LineThickness 1 + LineColor `#2` +
BackgroundColor `#2`, with `end` LineThickness 1.5; `composite`
LineThickness 1.5; `note` FontSize 13 / LineThickness 0.5; `swimlane`
FontSize 18 / LineThickness 1.5.

Note the `activityDiagram { arrow { FontSize 11 } }` scoping **beats** the
root `arrow { FontSize 13 }` (`plantuml.skin:316`) — activity's arrow font
is 11, not 13.

## Interface contract (consumed by T3–T6)

`ActivitySName` is a string union over exactly the kinds above. Every
resolver returns a `number` (never `undefined`) — the fallback is this
module's job, so callers never write `?? theme.fontSize`.

## Boundaries

**Always:** every constant carries its `plantuml.skin:NNN`.
**Never:** write a colour literal such as `'#222'` — resolve `#2` through
`HColorSet` ([D5]). **Never** fit a value to an observed golden; if a
resolved value disagrees with the jar, that is a finding for the journal.
**Ask first (halt and journal):** if `#2` does not resolve through the
existing colour machinery.

## Acceptance criteria

- Given the default theme, when `activityFontSize(theme, 'activity')` is
  called, then it returns `12`
- Given the default theme, when `activityFontSize(theme, 'diamond')` is
  called, then it returns `11` — NOT `theme.fontSize - 2`
- Given a theme carrying a user `diamond` bucket `fontSize` of 40, when
  called, then it returns `40` (the override tier wins)
- Given the default theme, when `activityLineThickness(theme, 'arrow')` is
  called, then it returns `1` — not `1.5`
- Given the default theme, when `activityRoundCorner(theme, 'activity')` is
  called, then it returns `25` (callers halve it per [D4])

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`. This task changes no rendering path, so
the activity ratchet must be **unmoved**; assert that.

## Commit

`feat(asd-T2): port the activityDiagram style defaults`
