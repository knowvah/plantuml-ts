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
| [T8a](T8a-diagnosis-handwritten.md) | map teoz/rose drawU + apply chain; design the sequence UGraphic seam | debugger | `diagnosis/handwritten.md` | batch 3 | [ ] |
| [T8b](T8b-move-lifelines.md) | lifelines + live boxes through UGraphic | refactoring-specialist | `renderer-lifeline.ts`, `renderer.ts` (seam) | T8a | [ ] |
| [T8c](T8c-move-participants.md) | participants through UGraphic | refactoring-specialist | `renderer-participant-shapes.ts`, `renderer-participant-symbol.ts` | T8b | [ ] |
| [T8d](T8d-move-messages.md) | messages, arrowheads, self messages through UGraphic | refactoring-specialist | `renderer-message*.ts`, `renderer-arrowhead*.ts` | T8c | [ ] |
| [T8e](T8e-move-notes-frames.md) | notes, frames, divider, link anchor, document through UGraphic | refactoring-specialist | `renderer-{note,frame-header,frame-blotter,divider,link-anchor,document}.ts` | T8d | [ ] |
| [T8f](T8f-enable-handwritten.md) | wrap sequence in `UGraphicHandwritten` when `handwritten true` | typescript-pro | per T8a plan | T8e | [ ] |
| T8g | canvas = the shared `SvgGraphics` `ensureVisible` fold after the moves (kaluna, gebeki; `diagnosis/drawn-extent.md`, journal row 69; fallback: the artifact's body-walk) | typescript-pro (sonnet) | per the artifact after T8e (`assemble-svg-sequence.ts#finalizeSequenceFragment`, the sequence UGraphic seam) + tests | T8e | [ ] |
| close | merge, gates, hash check vs pre-move, classify | orchestrator | per close-procedure | T8a–T8g | [ ] |
