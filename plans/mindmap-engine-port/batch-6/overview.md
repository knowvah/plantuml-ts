# Batch 6: residual round

**Written at the b5 close (2026-09-30)** from the first real measurement: 127/1/14 (survey),
127 goldens pinned, 15 diff-baseline rows (Σ weightedScore 2386). Families below are grouped
by measured mechanism (journal rows 26–27). Wave 1 runs T6a–T6e in parallel worktrees (disjoint
write-sets); wave 2 runs T6f (shares `MindMapDiagramFactory.ts`/`index.ts` with T6b/T6c) and
T6g (class engine) after wave 1 merges. Accepted divergences (no task): `fovule-12-noze408`,
`gukofo-85-vira895` — `<latex>` ([[latex-math-is-permanent-divergence]]).
Close: [../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T6a](T6a-gradient-colours.md) | HColorGradient port + SVG gradient fills (nukose, vacofo) | typescript-pro (opus) | `src/core/klimt/color/{HColorGradient,HColorSet}.ts` | b5 close | [ ] |
| [T6b](T6b-style-blocks-by-source-position.md) | `<style>` blocks applied by position (petoda, somife) | typescript-pro (opus) | `src/diagrams/mindmap/{MindMapDiagramFactory,mindmap-skin-param}.ts`, `mindmap-style-builder.ts` | b5 close | [ ] |
| [T6c](T6c-handwritten-and-monochrome-export-path.md) | handwritten + monochrome export (zature, zirabo) | typescript-pro (opus) | `src/diagrams/mindmap/index.ts`, `klimt/drawing/hand/**`, `klimt/color/ColorMapper*.ts` | b5 close | [ ] |
| [T6d](T6d-scale-combined-with-chrome.md) | scale after chrome (zebuzi) | typescript-pro (sonnet) | `src/core/{TextBlockExporter,assemble-svg}.ts` (MINDMAP arms) | b5 close | [ ] |
| [T6e](T6e-creole-in-node-labels.md) | sprites, bold, wrapping in labels (rinamu, kijaru, kelome) | typescript-pro (opus) | `src/diagrams/mindmap/FingerImpl.ts`, `FtileBoxOld.ts` sheet call, cited creole ports | b5 close | [ ] |
| [T6f](T6f-jar-fallback-page-for-factory-throws.md) | jar fallback page (fogari, femiba, susipa) | typescript-pro (sonnet) | `src/core/error/error-diagrams.ts`, mindmap `index.ts`/factory throw routing, `DIVERGENCES.md` | T6b, T6c | [ ] |
| [T6g](T6g-semutu-embedded-mindmap-canvas.md) | semutu canvas + nested `<style>` (class) | typescript-pro (opus) | `src/core/preprocessor-collector.ts`, class module per diagnosis | wave 1 | [ ] |
