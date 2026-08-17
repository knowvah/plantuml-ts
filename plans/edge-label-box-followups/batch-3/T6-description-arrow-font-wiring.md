# T6 — Description engine: arrow-label font for measurement and SVG

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; the Java at
`~/git/plantuml` is the canonical specification. Every constant carries its
upstream `file:line`. **Never fit a value.** Pure SVG; tests are vitest.

The description engine already honours `skinparam arrowFontSize` for
measurement (`layout.ts:350-355`, `edgeFontSpec`) but not FontName/FontStyle
nor `<style> arrow {…}`, and its renderer draws at the constant
(`renderer-edge.ts:96`). T2 built `resolveArrowLabelFont(theme)` (D3).
`zosuje-43-zebi775` (component): `<style> arrow { FontSize 10  FontStyle
bold }`; oracle 5x12 / 9x12 / 12x12, ours 6x15 / 11x15 / 15x15.

## Task

1. `layout.ts:350-355`: `edgeFontSpec = resolveArrowLabelFont(theme)`. Keep the
   long comment's substance (why `fontSpec` for nodes stays at
   `theme.fontSize`) but replace its "no override path exists" sentences.
   `edgeFontSpec` feeds `buildDotEdges`/`computeGraphSpacing` and, since SI23,
   `EdgeFontSpecs` — check T3's plumbing (`noteLines`) does not need the font.
2. `renderer-edge.ts:90-100`: main-label `<text>` at the resolved font,
   including weight/style attributes.
3. Regression-pin `skinparam arrowFontSize N` (T3-of-an-earlier-mission
   behaviour) unchanged.
4. Remove `zosuje` from the description backlog when it passes.

## Write-set

- `src/diagrams/description/layout.ts`, `src/diagrams/description/renderer-edge.ts`
- existing `tests/unit/description/*.test.ts`
- `oracle/goldens/description/label-size-backlog.json`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:225-245`
- `src/core/arrow-label-font.ts`, `src/core/measurer.ts:12-22`
- `src/diagrams/description/layout.ts:330-370`, `renderer-edge.ts:1-120`, `link-edge-attrs.ts:60-90` (where `ctx.fontSpec` is consumed)
- `.agent-notes/description-edge-label-oversizing.md` — the string-vs-TextBlock mechanism this engine already carries
- `decisions.md#d3`, `#d4`
- `test-results/dot-cache/component/zosuje-43-zebi775/in.puml`

## Architecture decisions

D3, D4.

## Acceptance criteria

- **Given** `zosuje`, **when** the DOT gate runs, **then** its three labels are
  5x12 / 9x12 / 12x12 and the SVG text is 10 bold; leaves the backlog.
- **Given** a diagram with `skinparam arrowFontSize 20` only, **then** DOT and
  SVG identical to today's output (pin).
- **Given** no override, **then** byte-identical DOT + SVG for every other
  description fixture; component ≥ 257, usecase ≥ 89 (or Batch-2 values if higher).

## Quality bar

Four gates; `dot-sync-report description`, `shape-match-report`, `label-box-triage`.

## Observability

Description DOT EQUAL, description backlog (→ −1), census delta.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** change node/title `fontSpec`.
- **Never** read the theme fields directly.

## Commit

`fix(T6): description edge labels measure and draw at the resolved arrow font`
