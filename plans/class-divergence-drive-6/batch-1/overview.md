# Batch 1: shared foundations

All tasks run in parallel, each in its own worktree (`plans/class-divergence-drive-5/measurements/mkwt.sh T1x`). No two tasks write the same file. The batch closes via [../close-procedure.md](../close-procedure.md).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-style-map-buckets.md) | style-map-buckets (0 rows) | typescript-pro (opus) | `style-map-element.ts`, `theme-graph-colors.ts`, `theme-graph-colors-a.ts`, `skinparam-stereo-keys.ts`, `skinparam-key-handlers-table-a.ts`, `skinparam-key-handlers-table-b.ts`, `skinparam-accumulator.ts` (+tests) | T0e (b0 close) | [x] |
| [T1b](T1b-creole-font-hyperlink-and-sprite-stroke.md) | creole-font-hyperlink-and-sprite-stroke (4 rows) | typescript-pro (sonnet) | `UText.ts`, `ISkinSimple.ts`, `CommandCreoleUrl.ts`, `EntityImageDescriptionDelegates.ts`, `EntityImageDescriptionName.ts`, `blocks-creole.ts`, `creole-atoms-image-resolver.ts` (+tests) | T0e (b0 close) | [x] |
| [T1c](T1c-non-class-assetstore.md) | non-class-assetstore (1 rows) | typescript-pro (sonnet) | `index.ts`, `parser.ts`, `state-json-commands.ts`, `index.ts`, `parser.ts`, `sequence-parse-helpers.ts`, `index.ts`, `parser.ts`, `index.ts`, `parser.ts`, `parser.ts`, `parser.ts`, `render-fixture-state.ts`, `render-fixture-sequence.ts`, `render-fixture-activity.ts`, `render-fixture-json.ts`, `svg-conformance-census.ts` (+tests) | T0e (b0 close) | [x] |
| [T1d](T1d-class-arrow-triangle-head.md) | class-arrow-triangle-head (1 rows) | typescript-pro (sonnet) | `class-relationship-parser.ts`, `class-arrow-grammar.ts`, `class-arrow-decor-map.ts`, `class-relationship-decor-ast.ts`, `renderer-arrowhead.ts` (+tests) | T0e (b0 close) | [x] |
| [T1e](T1e-preprocessor-bl-split-and-embedded-skinparam.md) | preprocessor-bl-split-and-embedded-skinparam (2 rows) | typescript-pro (opus) | `preprocessor.ts`, `preprocessor-collector.ts` (+tests) | T0e (b0 close) | [x] |
