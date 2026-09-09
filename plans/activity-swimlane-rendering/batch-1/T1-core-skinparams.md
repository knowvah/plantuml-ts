# T1 — Wire the swimlane skinparams

**Agent:** `typescript-pro` · **Depends on:** —

## Context

Faithful TypeScript port of PlantUML; the Java at `~/git/plantuml` is the
spec — **read the method body, not a filename**. Read
[`../README.md`](../README.md) and [`../decisions.md#d4`](../decisions.md);
[D4] governs this task and is locked.

**Measured, do not re-derive:** `SwimlaneBorderColor` IS already parsed —
aliased to `swimlaneheaderbackgroundcolor`, stored as `acc.swimlaneBorder`,
threaded onto the theme, and read by nobody.
`SwimlaneBorderThickness`, `SwimlaneTitleFontColor` and
`SwimlaneTitleFontSize` are genuinely absent (zero matches).

## Read-set

- `src/core/skinparam-key-handlers-table-b.ts:255-265` — the alias to split
- `src/core/skinparam-accumulator.ts:120-130, 220-230` — the field list
- `src/core/skinparam-theme-builder.ts:70-80` — the theme threading
- `src/core/theme-graph-colors-b.ts:325-335` — `swimlaneBorder`'s doc comment
- `~/git/plantuml/.../ftile/Swimlanes.java:285-315, 357-377` and
  `ftile/LaneDivider.java:72-100` — which PName each key maps to
- `plantuml.skin:309-314`

## Task

1. Split the alias per [D4]: `SwimlaneBorderColor` → the divider stroke
   colour (`PName.LineColor`); `SwimlaneHeaderBackgroundColor` → the band
   fill (`PName.BackGroundColor`). Two fields, not one.
2. Add `SwimlaneBorderThickness`, `SwimlaneTitleFontColor`,
   `SwimlaneTitleFontSize`, each carrying its upstream citation.
3. Thread all of them onto the theme. Do not consume them here — T2 owns
   the resolvers and T6 owns the drawing.

## Interface contract (consumed by T2)

```ts
// theme.colors.graph
swimlaneBorder?: string;            // SwimlaneBorderColor -> divider stroke
swimlaneHeaderBackground?: string;  // SwimlaneHeaderBackgroundColor -> band
swimlaneBorderThickness?: number;
swimlaneTitleFontColor?: string;
swimlaneTitleFontSize?: number;
```

## Boundaries

**Always:** every key carries its upstream `file:line`.
**Never:** consume these fields in a renderer here — that is T6.
**Ask first (halt and journal):** if splitting the alias changes any
existing engine's resolved theme.

## Acceptance criteria

- Given `skinparam SwimlaneTitleFontSize 30`, when the theme resolves, then
  it carries 30
- Given `skinparam SwimlaneBorderColor red` and
  `skinparam SwimlaneHeaderBackgroundColor blue`, then the two land in
  DIFFERENT fields
- Given a theme with no swimlane skinparams, then every field is `undefined`
- Given the class, state, description, sequence and json conformance
  suites, then **every one is byte-identical to `main`** — run them and
  record the counts in the journal

## Observability

N/A — no new observable operations.

## Rollback

**Reversible.** Pure `src/core/` change, no data, `git revert` restores.

## Quality bar

All four gates green; full `npm test`.

## Commit

`feat(asr-T1): wire the swimlane skinparams and split the border alias`
