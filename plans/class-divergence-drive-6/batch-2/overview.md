# Batch 2: class consumers, ink, text, singles

All tasks run in parallel, each in its own worktree (`plans/class-divergence-drive-5/measurements/mkwt.sh T2x`). No two tasks write the same file. The batch closes via [../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T2a](T2a-class-style-consumers.md) | class-style-consumers (14 rows) | typescript-pro (opus) | `class-cluster-header.ts`, `class-package-style.ts`, `class-namespace-usymbol-shape.ts`, `class-empty-package.ts`, `renderer.ts`, `renderer-usymbol-entity.ts`, `renderer-empty-package-leaf.ts` (+tests) | b1 close, T1a (interface) | [x] |
| [T2b](T2b-ink-walk-reuses-draw.md) | ink-walk-reuses-draw (9 rows; T0e: +json 1px ×3, −josebu) | typescript-pro (sonnet) | `leaf-sizing-entity.ts`, `class-layout-description-leaf-ink.ts`, `class-ink-box.ts`, `leaf-sizing-folder.ts`, `class-ink-shapes.ts`, `layout-ink-extent.ts`, `EntityImageDescriptionDelegates.ts` (+tests) | b1 close | [x] |
| [T2c](T2c-degenerate-ensurevisible-and-container-ink.md) | degenerate-ensurevisible-and-container-ink (5 rows + josebu (b)) | typescript-pro (sonnet) | `class-geo-builders.ts`, `class-layout-leaf-shapes.ts`, `class-container.ts`, `USymbolQueue.ts`, `symbols-solids.test.ts` (+tests) | b1 close | [x] |
| [T2d](T2d-class-text-edge-labels-and-notes.md) | class-text-edge-labels-and-notes (5 rows) | typescript-pro (sonnet) | `class-edge-label-measure.ts`, `renderer-edge-label.ts`, `class-edge-label-attach.ts`, `renderer-note.ts`, `renderer-note-lines.ts`, `note-layout-measure.ts`, `note-layout-measure-rows.ts` (+tests) | b1 close | [x] |
| [T2e](T2e-class-singles.md) | class-singles (4 rows) | typescript-pro (sonnet) | `class-json-sizing.ts`, `EntityImageDescriptionTextBlock.ts`, `UHorizontalLine.ts`, `theme.ts`, `class-monochrome.ts`, `class-layout-generic-classifier.ts` (+tests) | b1 close | [x] |
| [T2f](T2f-hyperlink-and-sprite-stroke-wiring.md) | hyperlink-and-sprite-stroke-wiring (4 rows; added at the b1 close, journal row 29) | typescript-pro (sonnet) | `chrome.ts`, `blocks.ts`, `annotation-style-types.ts`, `usymbol-resolve.ts`, `style-cascade-class-font.ts`, `description/renderer-entity.ts` (+tests) | b1 close, T1b (interface) | [x] |
