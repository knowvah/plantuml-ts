# T2 — `<style>` cascade: `arrow { FontColor }` and `arrow { cardinality { FontColor } }`

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the spec. Pure SVG; vitest. T1 added
`theme.colors.graph.arrowFontColor` and `theme.cardinalityFontColor` and the
skinparam path. The `<style>` path is `style-cascade-class.ts
#computeArrowFontOverride` (`:254-266`, `ARROW_SNAMES = root/element/
classdiagram/arrow`, `:28`) and `#computeCardinalityFontOverride`
(`:238-250`, `CARDINALITY_SNAMES` superset, `:29-33`), consumed by
`style-map-theme.ts:91-94` (graph override) and `:143,213` (`extras
.cardinalityFont` top-level fold). `resolveStyleCascade` (`style-map-element
.ts:365-397`) already walks declarations in source order, last wins — the
jar's `StyleStorage#computeMergedStyle` (`style/StyleStorage.java:102-116`)
— so oracle experiments i/k/l/m need no new precedence logic.

## Task

1. `computeArrowFontOverride` gains `arrowFontColor?: string` — resolved via
   `cascadeFontColorHex(styleMap, ARROW_SNAMES, background, tags)` (`:144-160`,
   handles `#?dark:light`) with `background = theme.colors.background`
   passed in from `style-map-theme.ts` (the label paints on the canvas), or
   `cascadeHex` (`:94`) if threading the background is not worth the seam
   — journal which (push-forward 1).
2. `computeCardinalityFontOverride` gains `cardinalityFontColor?: string`
   over `CARDINALITY_SNAMES` (D5: `arrow.cardinality` inherits `arrow`; the
   nested `cardinality {}` block, registered later, wins for `camuna`).
3. `style-map-theme.ts:91-94` — thread `arrowFontColor` into `graphOverride`;
   `:143-160,210-215` — `cardinalityFontColor` rides `extras.cardinalityFont`
   into the top-level fold exactly like `cardinalityFontSize`.
4. `style-cascade-class.ts` is 499/500 — trim doc prose (never a `file:line`
   citation) to fit; stop 9 if impossible.
5. Tests: acceptance criteria below (each cites its experiment id).

## Write-set

- `src/core/style-cascade-class.ts` (499), `src/core/style-map-theme.ts` (239)
- `tests/unit/core/style-cascade-class.test.ts`, `tests/unit/style-map-theme.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/StyleStorage.java:102-116`,
  `style/DarkString.java:50-60`, `svek/GraphvizImageBuilder.java:120-130,230-242`
- `src/core/style-cascade-class.ts:20-40,90-160,225-270`, `src/core/style-map-theme.ts:80-100,115-160,200-220`,
  `src/core/style-map-element.ts:325-397`
- `decisions.md` D4, D5 + experiments i/k/l/m and `camuna`
- `test-results/dot-cache/class/camuna-58-veca254/in.puml` (the `<style>` block)

## Architecture decisions

D1, D4, D5. Do NOT widen `ARROW_SNAMES` (push-forward 4: measure whether any
corpus fixture uses `componentDiagram { arrow { FontColor } }` — none of the
seven component fixtures does at a glance; confirm and journal).

## Interface contract

Consumes T1's fields; produces them from a StyleMap. No new exports beyond
the two widened return types:
```ts
computeArrowFontOverride(styleMap, tags?): { arrowFontSize?, arrowFontFamily?, arrowFontStyle?, arrowFontColor?: string }
computeCardinalityFontOverride(styleMap): { cardinalityFontSize?, cardinalityFontFamily?, cardinalityFontColor?: string }
```

## Acceptance criteria

- **Given** `<style> arrow { FontColor blue }`, **then** `applyStyleMap`
  yields `colors.graph.arrowFontColor === '#0000FF'` and `cardinalityFontColor`
  undefined (inherits via the resolver) (f/e).
- **Given** `root { FontColor red } arrow { FontColor green }` → `'#008000'`;
  the reverse order → `'#FF0000'` (i/k).
- **Given** `classDiagram { arrow { FontColor green } } arrow { FontColor red }`
  → `'#FF0000'`; reversed → `'#008000'` (l/m).
- **Given** `camuna`'s block (`arrow { FontColor Blue … cardinality { FontColor
  red } }`), **then** `arrowFontColor '#0000FF'` AND `cardinalityFontColor
  '#FF0000'`.
- **Given** a StyleMap with no arrow declarations, **then** both fields
  absent and `applyStyleMap` output deep-equals the pre-T2 output.

## Quality bar

Four gates; zero movement (no renderer change in this task).

## Observability

N/A.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** add a specificity rule; source order IS the rule (D4).
- **Stop** on stops 1, 3, 9.

## Commit

`feat(T2): <style> arrow / arrow.cardinality FontColor cascade`
