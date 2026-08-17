# T2 — Arrow-label font resolver (building block, no consumer)

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Read the Java method body
before acting. Every constant carries its upstream `file:line`. **Never fit a
value.** Pure SVG: no DOM, no async, no Node built-ins in `src/`. Tests are
vitest.

Upstream builds the edge label font from the `arrow` style cascade
(`svek/GraphvizImageBuilder.java:234-235`:
`getDefaultStyleDefinitionArrow(stereotype).getMergedStyle(...)
.getFontConfiguration(...)`), with `skinparam arrowFontSize/Name/Style`
bridged in via `style/FromSkinparamToStyle.java`. This port hardcodes
`ARROW_LABEL_FONT_SIZE` (13, `klimt/font/FontParam.java:54`) at ~12 sites and
reads `theme.colors.graph.arrowFontSize` (skinparam only) at exactly one
(`description/layout.ts:354`). `<style> arrow { FontSize / FontStyle /
FontName }` and `skinparam arrowFontName/arrowFontStyle` reach nothing.

SI23's T1 (`plans/edge-label-box-backlog/batch-1/T1-cardinality-cascade.md`)
built the sibling `computeCardinalityFontOverride` under a **zero-fixture-
movement** bar; T14 wired it. This task is that pattern for the arrow font:
build, wire no consumer, move nothing. Batch 3 wires it per engine.

## Task

1. `src/core/style-cascade-class.ts`: add `computeArrowFontOverride(styleMap,
   stereotypeTags = [])` beside `computeCardinalityFontOverride` (`:238`),
   resolving `fontsize` / `fontname` / `fontstyle` against `ARROW_SNAMES`
   (`:28`). `arrow.cardinality` declarations must **not** leak in.
2. Theme carriage (D3): extend `colors.graph` (`theme-graph-colors-a.ts:218-
   225`) with `arrowFontFamily?: string`, `arrowFontStyle?: string` next to
   `arrowFontSize`; `style-map-theme.ts` writes all three from step 1 (through
   `graphOverride`, mirroring how `arrowFontSize`'s skinparam path lands
   there — trace it, do not assume). Touch `theme.ts` only if the graph merge
   list needs the new keys; journal either way.
3. Skinparam: `arrowfontname`, `arrowfontstyle` handlers beside
   `arrowfontsize` (`skinparam-key-handlers.ts:104-110`), accumulator fields
   (`skinparam-accumulator.ts:67,128`), builder mapping
   (`skinparam-theme-builder.ts:86`). `ClassArrowFontSize` etc. already
   normalise to `arrow*` (`skinparam-key-normalize.ts`) — verify with a test.
   Upstream style-name → `FontStyle` mapping: `klimt/font/FontStyle.java`
   (`bold`, `italic`, `plain`, combinations) — cite it.
4. `src/core/arrow-label-font.ts` (new): `resolveArrowLabelFont(theme: Theme):
   FontSpec` — `{ family: theme.colors.graph.arrowFontFamily ??
   theme.fontFamily, size: arrowFontSize ?? ARROW_LABEL_FONT_SIZE, weight?,
   style? }` mapping `FontStyle` bold/italic onto `FontSpec.weight/style`
   (`core/measurer.ts:12-17`). This is the **only** reader of the three fields
   from Batch 3 on. JSDoc `@see` to `GraphvizImageBuilder.java:234-235`.
5. Tests for each layer. **No production consumer.**

## Write-set

- `src/core/style-cascade-class.ts`, `src/core/style-map-theme.ts`,
  `src/core/theme-graph-colors-a.ts`, `src/core/theme.ts` (conditional)
- `src/core/skinparam-key-handlers.ts`, `src/core/skinparam-accumulator.ts`,
  `src/core/skinparam-theme-builder.ts`
- `src/core/arrow-label-font.ts` (new)
- `tests/unit/core/style-cascade-class.test.ts`, `tests/unit/style-map-theme.test.ts`,
  `tests/unit/core/arrow-label-font.test.ts` (new), the existing skinparam
  test file(s) that cover `arrowfontsize`

If a file outside this set must change, stop and log it.

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:225-245`
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/style/FromSkinparamToStyle.java` — the `arrowFont*` bridge lines (grep `ArrowFont`)
- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontStyle.java`, `FontParam.java:54`
- `src/core/style-cascade-class.ts:20-45,190-250`
- `src/core/style-map-theme.ts:95-135` (T14's `cardinalityFont` carriage — the template)
- `src/core/theme-graph-colors-a.ts:210-230`; `src/core/theme.ts:15-25,470-480`
- `src/core/skinparam-key-handlers.ts:95-115`, `skinparam-accumulator.ts:60-70,120-135`, `skinparam-theme-builder.ts:80-90`
- `src/core/measurer.ts:12-17`
- `plans/edge-label-box-backlog/batch-1/T1-cardinality-cascade.md`, `decisions.md#d3--…`

## Architecture decisions

**D3** as written. **D4** is Batch 3's, not yours: wire nothing.

## Interface contract (consumed by T5, T6, T7)

```ts
export function resolveArrowLabelFont(theme: Theme): FontSpec;
// FontSpec = { family: string; size: number; weight?: 'normal'|'bold'; style?: 'normal'|'italic' }
// default (no style/skinparam): { family: theme.fontFamily, size: 13 } — byte-for-byte today's value
```

## Acceptance criteria

- **Given** `<style> arrow { FontSize 14  FontStyle bold }`, **when** resolved,
  **then** `{size: 14, weight: 'bold'}`; **given** `arrow { cardinality {
  FontSize 10 } }` only, **then** the arrow font is untouched.
- **Given** `skinparam ClassArrowFontSize 58`, `ClassArrowFontName Courier`,
  `ClassArrowFontStyle Italic`, **then** `{size: 58, family: 'Courier',
  style: 'italic'}`.
- **Given** no override, **then** exactly `{family: theme.fontFamily, size: 13}`.
- **Given** the whole corpus, **then** DOT EQUAL, census and every ratchet are
  **byte-identical** to the baseline (stop 8) — journal the counts.

## Quality bar

Four gates; `npx jiti scripts/shape-match-report.ts` and
`npx jiti scripts/dot-sync-report.ts` for class/state/description showing zero
movement.

## Observability

Census/DOT counts before and after (must be identical).

## Rollback

Reversible — one commit.

## Boundaries

- **Never** wire a consumer; **never** change any `ARROW_LABEL_FONT_SIZE` site.
- **Never** invent a FontStyle mapping — cite `FontStyle.java`.
- **Stop** if the merge/carriage needs a file outside the write-set.

## Commit

`feat(T2): arrow-label font cascade and resolver (no consumer)`
