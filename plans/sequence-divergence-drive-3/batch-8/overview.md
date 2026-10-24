# Batch 8 — handwritten: sequence drawing through UGraphic

Four rows (jefoke-95-jara779, gepuce-64-pivu656, pafene-01-tedi758,
menoke-22-luxo044, all `handwritten true`) are open because upstream wraps
the whole graphic in `UGraphicHandwritten` (`TextBlockExporter.java:174-175`)
and sequence emits SVG strings from 14 renderer modules, so nothing reaches
the wrapper. Replaying emitted SVG is rejected (D5: wrong RNG topology — the
`Random` is an instance field, `UGraphicHandwritten.java:54`, reseeded by
every `apply`, `:114-116`). Batch is SERIAL: T8b-T8e each touch the
`renderer.ts` composition. T8a designs the seam; T8b-T8e are pure moves, each
gated by hashes (stop 7): all 1143 sequence rows AND every other engine
hash-identical to the pre-move hashes (`$T/svg-hashes.mts`); no behaviour
change. T8f then enables the wrapper. Files may be split under the 500-line
hook as pure moves (push-forward; journal the new file). These moves are the
highest-risk change of the drive: hash identity is the only evidence, so do
not batch them or "fix while moving".

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T8a](T8a-diagnosis-handwritten.md) | map teoz/rose drawU + apply chain; design the sequence UGraphic seam | debugger | `diagnosis/handwritten.md` | batch 3 | [x] |
| T8p | core prerequisites (F3): `UGraphicDelegator` group forwarding, transparent-fill colour, `UCenteredCharacter`/`CircledCharacter` + svg driver — raw-hash gated, every engine | typescript-pro (sonnet) | `core/klimt/drawing/UGraphicDelegator.ts`, `core/klimt/color/{HColors,HColorSimple}.ts`, `core/paint.ts`, `core/klimt/drawing/svg/{driver-rectangle-svg,u-graphic-svg,driver-svg-stubs}.ts`, new `core/klimt/shape/{UCenteredCharacter,CircledCharacter}.ts`, new `driver-centered-character-svg.ts` + tests | T8a | [x] |
| [T8b](T8b-move-lifelines.md) | lifelines + live boxes through UGraphic | refactoring-specialist | `renderer-lifeline.ts`, `renderer.ts` (seam) | T8a | [x] |
| [T8c](T8c-move-participants.md) | participants through UGraphic | refactoring-specialist | `renderer-participant-shapes.ts`, `renderer-participant-symbol.ts` | T8b | [x] |
| [T8d](T8d-move-messages.md) | messages, arrowheads, self messages through UGraphic | refactoring-specialist | `renderer-message*.ts`, `renderer-arrowhead*.ts` | T8c | [x] |
| [T8e](T8e-move-notes-frames.md) | notes, frames, divider, link anchor, document through UGraphic | refactoring-specialist | `renderer-{note,frame-header,frame-blotter,divider,link-anchor,document}.ts` | T8d | [x] |
| [T8f](T8f-enable-handwritten.md) | wrap sequence in `UGraphicHandwritten` when `handwritten true` | typescript-pro | per T8a plan | T8e | [x] |
| [T8h](T8h-nested-skinparam-inheritance.md) | nested `{{ }}` diagrams inherit the enclosing skinparams (T8a F5, menoke payload; bundle, row 94) | typescript-pro (sonnet) | the nested-render seam (`src/index.ts` `{{ }}` call, `EmbeddedDiagram.ts`) + tests | T8f | [x] |
| [T8g](T8g-canvas-fold.md) | canvas = the shared graphic's `ensureVisible` fold (kaluna, gebeki; `diagnosis/drawn-extent.md`, row 69); bridges and `scaleK` deleted | typescript-pro (sonnet) | `renderer-ug.ts`, `renderer.ts`, `renderer-document.ts`, bridge deletions, `scale-geo.ts`, `assemble-svg-sequence.ts`, `dispatcher-types.ts` (internal fields), shift sites + tests | T8h | [x] |
| close | merge, gates, hash check vs pre-move, classify | orchestrator | per close-procedure | T8a–T8h | [x] |
