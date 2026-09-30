# Batch 3: style parser and loader, skinparam bridge, node box

Three parallel worktrees; no shared files. T3a's `buildMindmapStyleBuilder` calls T3b's
converter through the interface in both specs (T3a stubs it for its own tests).
Close: standard procedure; the all-engine diff must be empty.

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T3a](T3a-style-parser-loader.md) | StyleParser + Context + CssVariables, StyleLoader, buildMindmapStyleBuilder (D2 source order) | typescript-pro (opus) | `src/core/style/parser/**`, `src/core/style/{StyleLoader,mindmap-style-builder}.ts` (+tests) | T2a | [x] |
| [T3b](T3b-skinparam-to-style.md) | FromSkinparamToStyle subset (the corpus's skinparams) | typescript-pro (sonnet) | `src/core/style/FromSkinparamToStyle.ts` (+tests) | T2a | [x] |
| [T3c](T3c-ftileboxold-skinparamcolors.md) | FtileBoxOld (createMindMap/createWbs), SkinParamColors | typescript-pro (opus) | `src/diagrams/activity/ftile/vertical/FtileBoxOld.ts` (+ `BoxStyle`/`FtileGeometry` slices at upstream paths if absent), `src/core/skin/SkinParamColors.ts` (+tests) | T2a | [x] |
