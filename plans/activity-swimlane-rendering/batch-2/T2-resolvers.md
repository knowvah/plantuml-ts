# T2 — Swimlane title and border resolvers

**Agent:** `typescript-pro` · **Depends on:** T1

## Context

Read [`../README.md`](../README.md) and [`../decisions.md`](../decisions.md).
`activity-style-defaults.ts` is **the one place** an activity
`plantuml.skin` number is written; it already carries `swimlaneFontSize`
and `swimlaneLineThickness` from the predecessor mission. Extend it, do not
create a second table.

## Read-set

- `src/diagrams/activity/activity-style-defaults.ts` — the whole module,
  especially the existing `swimlaneFontSize`/`swimlaneLineThickness` pair
  and the two-tier cascade its doc comment describes
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:309-314` — **the
  spec; read it, do not copy the README's table**
- `~/git/plantuml/.../ftile/Swimlanes.java:285-293` — the title's
  `FontConfiguration` comes from the swimlane style

## Task

Add resolvers of the same two-tier shape the module already uses — user
bucket/theme override first, this module's cited constant second:

```ts
export function swimlaneTitleFontSize(theme: Theme): number
export function swimlaneTitleFontColor(theme: Theme): string
export function swimlaneBorderColor(theme: Theme): string
export function swimlaneBorderThickness(theme: Theme): number
```

Each returns a value, never `undefined`. Note the title font is the
swimlane style's own `FontSize` (`:313`) — `swimlaneFontSize` already
resolves it, so `swimlaneTitleFontSize` must not restate 18; delegate.

## Boundaries

**Always:** every constant carries `plantuml.skin:NNN`.
**Never:** re-declare a value the module already owns.
**Never:** fit a value to a golden.

## Acceptance criteria

- Given the default theme, then the border colour is black and the
  thickness 1.5 (`plantuml.skin:311-312`)
- Given the default theme, then the title font size delegates to
  `swimlaneFontSize` and returns 18 — asserted by construction, not by
  a second literal
- Given a theme carrying T1's `swimlaneTitleFontSize` of 30, then 30 wins
- Given the activity ratchet, then it is **unmoved** — this task changes no
  rendering path; assert it

## Observability

N/A.

## Rollback

**Reversible.**

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(asr-T2): resolve swimlane title and border style values`
