# Batch 3: layout and structure

All tasks run in parallel, each in its own worktree (`plans/class-divergence-drive-5/measurements/mkwt.sh T3x`). No two tasks write the same file. The batch closes via [../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-empty-graph-and-verified-layout.md) | empty-graph-and-verified-layout (1 row; T0e: json 1px → T2b, zasuxe → T3d) | typescript-pro (sonnet) | `graph-layout.ts` (+tests) | b2 close | [ ] |
| [T3b](T3b-mainframe-svek-normalization.md) | mainframe-svek-normalization (3 rows) | typescript-pro (opus) | `big-frame.ts`, `chrome.ts`, `layout-ink-extent.ts`, `index.ts`, `class/layout.ts` (optional) (+tests) | b2 close | [ ] |
| [T3c](T3c-smetana-pragma-structure.md) | smetana-pragma-structure (4 rows) | typescript-pro (sonnet) | `class-command-directives.ts`, `ast.ts`, `renderer-edge.ts`, `renderer-group.ts` (+tests) | b2 close | [ ] |
| [T3d](T3d-portin-and-package-title-table.md) | portin-and-package-title-table (3 rows; T0e: +zasuxe) | typescript-pro (opus) | `class-dot-clusters.ts`, `class-dot-graph.ts`, `class-port-rows.ts`, `class-namespace-title-table.ts`, `class-command-containers.ts`, `class-namespace-shape.ts`, `class-namespace.ts` (optional) (+tests) | b2 close | [ ] |
| [T3e](T3e-link-middle-decor-and-nested-renders.md) | link-middle-decor-and-nested-renders (2 rows; T0e: +josebu (a)) | typescript-pro (sonnet) | `class-layout-edge-labels.ts`, `class-edge-note-box.ts`, `renderer-arrowhead-middle.ts`, `sequence-creole.ts`, `sequence-text.ts`, `sequence-layout-participant-sizing.ts` (+tests) | b2 close | [ ] |
| [T3f](T3f-class-singles-verified.md) | class-singles-verified (4 rows; added at the b2 close from T2e's stop, journal rows 36–37) | typescript-pro (opus) | `style-map-element.ts`, `theme-graph-colors.ts`, `theme-element-resolve.ts`, `class-json-sizing.ts`, new `klimt/color/HUSLColorConverter.ts` + `ColorOrder.ts`, `theme.ts`, `class-monochrome.ts`, `renderer.ts`, `class-declaration-parser.ts`, `class-parse-state.ts`, `class-layout-generic-classifier.ts`, `UHorizontalLine.ts`, `renderer-usymbol-entity.ts`, `note-layout-measure-rows.ts`, `note-layout-measure.ts`, `renderer-note-lines.ts` (+tests) | b2 close | [ ] |
