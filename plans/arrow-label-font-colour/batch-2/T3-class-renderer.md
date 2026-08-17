# T3 — Class renderer: label, glyph and cardinality ink take the resolved colour

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the spec. Pure SVG; vitest. `src/diagrams/class/
renderer-edge.ts` draws the main label(s) at `arrowLabelTextAttrs(theme)`
(`:160-173`, family/size/weight/style from `resolveArrowLabelFont`) with a
hard-coded `fill: '#000000'` (`:352,360`), the magic-arrow glyphs through
`magicArrowPolygon` (`:216-226`, `fill`/`stroke` `'#000000'`), and tail/head
cardinality labels with `fill: '#000000'` (`:365-372`). Upstream: `SvekEdge`
draws the label block with `labelFont`'s colour and the cardinality with
`cardinalityFont`'s (`svek/GraphvizImageBuilder.java:234-241`); the glyph
takes `fontConfiguration.getColor()` for fill AND stroke (`klimt/shape/
TextBlockArrow2.java:57-58,66-67`). T1's resolver now returns `color` and
`resolveCardinalityFontColor(theme)`.

## Task

1. `arrowLabelTextAttrs` (or the two call sites `:352,360`) — `fill:` from
   `resolveArrowLabelFont(theme).color` (D2/D3).
2. `magicArrowPolygon(points, color)` — `fill` AND `stroke` = the label
   colour (D6); both call sites (`geo.arrowGlyph`, `labelLines[i].glyph`) pass
   the same resolved colour.
3. Tail/head (`:365-372`) — `fill: resolveCardinalityFontColor(theme)` (D5).
   Font size/family stay exactly as they are (SI25 D2 scope).
4. Tests in `tests/unit/class/renderer.test.ts`: acceptance criteria below.
5. Measure: full class SVG dump vs the start baseline (`.agent-notes/si25-
   class-svg-byte-identity-dump.md`); at this point (T2 may not have landed)
   only `picija`/`ticuxa` (skinparam) may move — journal what moved and its
   `fill` vs the jar SVG.

## Write-set

- `src/diagrams/class/renderer-edge.ts` (379)
- `tests/unit/class/renderer.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/TextBlockArrow2.java:50-77`,
  `svek/GraphvizImageBuilder.java:230-242`
- `src/diagrams/class/renderer-edge.ts:150-230,300-379`, `src/core/arrow-label-font.ts` (T1's version)
- `test-results/dot-cache/class/{ticuxa-26-tixo262,picija-82-jebu272,camuna-58-veca254,gobuco-16-ruke239}/in.svg`
- `decisions.md` D2, D3, D5, D6, D7; experiment a

## Architecture decisions

D2, D3, D5, D6, D7. Never compute a colour here — read the resolvers.

## Interface contract

Consumes T1: `resolveArrowLabelFont(theme).color`, `resolveCardinalityFontColor(theme)`.

## Acceptance criteria

- **Given** a theme with `colors.graph.arrowFontColor = '#FF0000'` and an edge
  with `label` + `arrowGlyph`, **then** the `<text>` has `fill="#F00"`… — use
  whatever `core/svg.ts` emits for that hex (assert against the helper's own
  output, not a hand-typed string) — and the `<polygon>` has the same value
  for BOTH `fill` and `stroke`; tail/head `<text>` also carry it (inherit).
- **Given** additionally `theme.cardinalityFontColor = '#0000FF'`, **then**
  tail/head carry the blue, main label the red.
- **Given** `defaultTheme`, **then** every rendered fixture is byte-identical
  to the start baseline except `picija`/`ticuxa` (and `camuna`/`nafiki` once
  T2 lands) — proven by the dump diff, journalled.
- **Given** `ticuxa`, **then** `toto`'s `fill` equals the jar's `#F00`
  (post-normalisation equal).

## Quality bar

Four gates; class DOT EQUAL 705/711 unchanged; class ratchet 315 pins hold.

## Observability

N/A.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** change tail/head font size/family; **never** touch `class-edge-geo.ts`.
- **Stop** on stops 1, 5, 7.

## Commit

`fix(T3): class edge labels, glyphs and cardinality take the arrow FontColor`
