# T6 — Arrow line thickness and swimlane font

**Agent:** `typescript-pro`
**Depends on:** T2

## Context

`plantuml-ts` is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read
[`../README.md`](../README.md) and [`../decisions.md`](../decisions.md);
[D7] governs this task and is locked.

Every activity edge draws `stroke-width="1.5"`; every cached jar golden
draws `stroke-width="1"`. This is the filed `activity-edge-stroke-width`
follow-on, and its mechanism is already diagnosed.

## Prior observation — read before starting

From the `activity-element-granularity` T4 filing, verbatim: `Worm.java:157,165`'s
`UStroke.withThickness(1.5)` calls are for the start/end **arrow
decorations only** — they sit inside `if (startDecoration != null)` /
`if (endDecoration != null)`. The line itself takes its stroke from
`style.getStroke()` at `Worm.java:129`, a different source entirely. Our
`1.5` generalised the decoration's thickness to the whole line.

**Read `Worm.java:120-170` yourself and confirm this before changing
anything** — this observation is a pointer to the method, not a substitute
for reading it. `style.getStroke()`'s resolved value is
`activityDiagram { arrow { LineThickness 1 } }` (`plantuml.skin:373`), so
it is `1` — but verify rather than assume, and take the value from T2's
module either way.

## Read-set

- `src/diagrams/activity/renderer.ts` (280 lines), especially
  `renderEdgeSegments` and the swimlane header at `:203-210`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/activitydiagram3/ftile/Worm.java:120-170`
- `~/git/plantuml/src/main/resources/skin/plantuml.skin:308-313` (swimlane),
  `:370-374` (activity arrow)
- `src/diagrams/activity/activity-style-defaults.ts` (T2's output)

## Write-set

- `src/diagrams/activity/renderer.ts`
- `tests/unit/activity/renderer.test.ts`

## Task

1. Edge lines draw `activityLineThickness(theme, 'arrow')`, not `1.5`.
   Preserve the 1.5 on the arrow **decorations** if and only if
   `Worm.java` actually applies it there — read the method.
2. Swimlane titles draw `activityFontSize(theme, 'swimlane')` (18).
3. Arrow LABEL text draws the activity-scoped arrow font (11), not the root
   13 — the `activityDiagram` scoping beats the root `arrow` block.

## Boundaries

**Always:** cite the `file:line` for each value.
**Never:** restructure swimlane drawing — [D7] scopes this task to the font
only. The divider-line-vs-header model is `activity-swimlane-rendering`,
filed separately.
**Ask first (halt and journal):** if `Worm.java` shows the line stroke
coming from somewhere other than `style.getStroke()`.

## Acceptance criteria

- Given the default theme, when an edge renders, then its `<line>` carries
  `stroke-width="1"`
- Given an edge with a start or end decoration, when it renders, then the
  decoration's own thickness matches what `Worm.java` applies to it —
  state the `file:line` in the test's comment
- Given a swimlane, when its title renders, then the `<text>` carries
  `font-size="18"`
- Given an arrow label, when it renders, then the `<text>` carries
  `font-size="11"`
- Given the activity ratchet, when run, then no fixture rises against T0's
  pin, or every riser is named with a mechanism

## Quality bar

All four gates green: `npm test` (full suite), `npm run typecheck`,
`npm run lint`, `npm run build`.

## Commit

`fix(asd-T6): draw activity edges and swimlane titles at skin values`
