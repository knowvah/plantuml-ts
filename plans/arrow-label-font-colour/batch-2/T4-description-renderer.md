# T4 — Description renderer: `arrowLabelFontConfig` colour from the resolver

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; pure SVG; vitest.
`src/diagrams/description/renderer-edge.ts#arrowLabelFontConfig` (`:23-30`)
builds the klimt `FontConfiguration` for the main label from
`resolveArrowLabelFont(theme)` (SI24 D4) but pins `color: JAR_DEFAULT_TEXT_
COLOR`. Upstream's `labelFont` `FontConfiguration` carries the arrow style's
FontColor (`svek/GraphvizImageBuilder.java:234-235`); oracle f (`[A] --> [B]
: lab` under `arrow { FontColor blue }`) draws `fill="#00F"`. Component/
usecase corpus fixtures with an arrow FontColor: `cudazo`, `minulo`,
`pemifo`, `vaseda`, `xenusu`, `zosuje`, `figika`; `xozabi`.

## Task

1. `arrowLabelFontConfig`: `color: resolveArrowLabelFont(theme).color`
   (drop the `JAR_DEFAULT_TEXT_COLOR` import if it becomes unused — grep first).
2. Check whether description draws any OTHER arrow-font text (tail/head
   quantifiers, note-on-link text) that upstream colours from `labelFont`/
   `cardinalityFont`; wire only what reads `resolveArrowLabelFont` today,
   journal the rest as named (do not widen).
3. Tests in `tests/unit/description/renderer.test.ts`.
4. Measure: component + usecase SVG dumps vs baseline; at this point
   (T2 may not have landed) only skinparam-driven fixtures (`figika`,
   `xenusu` if its form is supported) may move — journal fills vs jar.

## Write-set

- `src/diagrams/description/renderer-edge.ts` (128)
- `tests/unit/description/renderer.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:230-242`
- `src/diagrams/description/renderer-edge.ts` (whole), `src/core/arrow-label-font.ts` (T1),
  `src/diagrams/description/renderer-symbol.ts` (`JAR_DEFAULT_TEXT_COLOR`)
- `test-results/dot-cache/component/{figika-36-sola271,cudazo-20-silo903}/in.svg`
- `decisions.md` D2, D3, D7; experiment f

## Architecture decisions

D2, D3, D7.

## Acceptance criteria

- **Given** `colors.graph.arrowFontColor = '#0000FF'`, **then** the rendered
  edge label `<text>` carries that fill (assert through the svg helper's own
  formatting).
- **Given** `defaultTheme`, **then** component/usecase dumps are byte-identical
  to baseline except the named fixtures — journalled fill-by-fill vs jar.
- **Given** `figika`, **then** its label fill equals the jar's.

## Quality bar

Four gates; component 259 / usecase 92 DOT EQUAL unchanged; description
ratchet holds.

## Observability

N/A.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** touch `link-edge-attrs.ts` (DOT box) or `layout.ts`.
- **Stop** on stops 1, 5, 7.

## Commit

`fix(T4): description edge labels take the arrow FontColor`
