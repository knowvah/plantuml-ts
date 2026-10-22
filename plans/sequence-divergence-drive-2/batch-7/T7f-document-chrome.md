# T7f — document chrome: gradient background, border, handwritten

Agent: `typescript-pro` (opus), worktree `sdd2-T7f`. Commit:
`fix(sequence): gradient background, diagram border, handwritten mode`.
Read [../task-contract.md](../task-contract.md) first. Core change (D6):
all-engine survey after merge.

## Mechanisms (research D)
- **Q** `HColorGradient` for the document background
  (`klimt/drawing/svg/SvgGraphics.java:178-180`;
  `core/TextBlockExporter.java:354`) and the title box. `renderer.ts:447`
  (`resolveColorToSvgHex(theme.colors.background)`) drops the gradient.
- **AD** `diagramBorderColor` border rect
  (`core/TextBlockExporter.java:214-231` `maybeDrawBorder`); class does it
  (`diagrams/class/renderer-document.ts:147-153`), sequence's
  `renderer.ts:437-452` doesn't.
- **E** handwritten: `core/TextBlockExporter.java:175` wraps the graphic in
  `UGraphicHandwritten`. The port has
  `core/klimt/drawing/hand/UGraphicHandwritten.ts`, but sequence emits SVG
  strings and never passes through it. Find how another engine applies it
  (grep for `UGraphicHandwritten`) and mirror that; if the string-emitting
  renderer cannot pass through it without a renderer rewrite, stop and
  report the measured scope (do not partially jiggle).

`src/core/assemble-svg.ts` is **538 lines**: split it (pure move) in this
commit before editing.

## Targets
kitevo, tumega, gifope (Q); dabozi, fexoko (AD); jefoke, gepuce, menoke,
pafene (E, with T7e's banner).

## Write-set
`src/diagrams/sequence/renderer.ts`, `src/core/assemble-svg.ts` (+ its
split), tests.

## Read-set
`research/research-d-structure.md` Q, AD, E; `renderer.ts:420-454`;
`core/assemble-svg.ts`; `class/renderer-document.ts:140-160`;
`TextBlockExporter.java:160-240,350-360`.

## Acceptance
- Given `skinparam backgroundcolor red/blue`, then a `<linearGradient>` and
  a full-canvas rect are emitted (kitevo; test).
- Given `skinparam diagramBorderColor black`, then the border rect is drawn
  (test).
- Given `skinparam handwritten true`, then shapes are jiggled as the jar
  does, or the scope is reported (stop).
- Given every engine's pins, then none changes.
