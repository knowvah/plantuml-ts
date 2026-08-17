# T5 — State renderer: transition label fill from the resolver

## Context

**plantuml-ts** is a faithful TypeScript port of PlantUML; pure SVG; vitest.
`src/diagrams/state/state-renderer-transitions.ts` draws the transition label
with `transitionLabelFontAttrs(theme)` (`:119`, `resolveArrowLabelFont`,
SI24 T7) and `fill: theme.colors.text` (`:191`). Upstream colours it from the
arrow style's FontColor (`GraphvizImageBuilder.java:234-235`; oracles d/e:
`stateDiagram { arrow { FontColor blue } }` and bare `arrow {}` both →
`#00F`). D3: the default is `#000000` (`plantuml.skin:9`), NOT `theme.colors
.text` (`#181818`) — so this task must prove that no state fixture drew
`theme.colors.text` faithfully (no state fixture carries an arrow FontColor;
59 ratchet pins). If a state pin moves AWAY from jar under `#000000` — e.g.
a `skinparam defaultFontColor` fixture where `theme.colors.text` was the
right value — stop 8 and journal the mechanism.

## Task

1. `:191` — `fill: resolveArrowLabelFont(theme).color` (D2/D3).
2. Read `state-render-colors.ts` for context only — do not touch it.
3. Tests in `tests/unit/state/renderer.test.ts` (`renderState — transitions`
   block, `:533`).
4. Measure: state SVG dump vs baseline — MUST be byte-identical (no state
   fixture has an arrow FontColor); state ratchet 59/59.

## Write-set

- `src/diagrams/state/state-renderer-transitions.ts` (220)
- `tests/unit/state/renderer.test.ts`

## Read-set

- `~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/GraphvizImageBuilder.java:230-242`,
  `~/git/plantuml/src/main/resources/skin/plantuml.skin:1-12`
- `src/diagrams/state/state-renderer-transitions.ts:110-200`, `src/core/arrow-label-font.ts` (T1)
- `decisions.md` D2, D3; experiments d/e

## Architecture decisions

D2, D3, D7.

## Acceptance criteria

- **Given** `colors.graph.arrowFontColor = '#0000FF'`, **then** the transition
  label `<text>` carries that fill.
- **Given** `defaultTheme`, **then** the fill is `#000000`'s svg form and the
  state dump is byte-identical to baseline; 59 pins hold.
- **Given** `theme.colors.text` overridden alone (e.g. `skinparam
  defaultFontColor red` — which T1's handler ALSO routes to `arrowFontColor`),
  **then** the label follows the resolver, i.e. red — matching oracle a's rule.

## Quality bar

Four gates; state DOT EQUAL 266 unchanged; state ratchet 59.

## Observability

N/A.

## Rollback

Reversible — one commit.

## Boundaries

- **Never** touch `state-render-colors.ts` or the DOT side.
- **Stop** on stops 1, 5, 7, 8.

## Commit

`fix(T5): state transition labels take the arrow FontColor`
