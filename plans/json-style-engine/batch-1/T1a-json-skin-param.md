# T1a — the json family's SkinParam, built in the parse (D1)

Agent: `typescript-pro` (sonnet, effort high), worktree `jse-T1a`. Commit:
`feat(json): build the family's style SkinParam in the parse (T1a)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d1](../decisions.md).

## Context
`TextBlockJson` reads `skinParam.getCurrentStyleBuilder()` and
`getIHtmlColorSet()` (`TextBlockJson.java:112-114`); the SkinParam is the
`TitledDiagram`'s after `styleExtractor.applyStyles` (read
`JsonDiagramFactory.java`, `YamlDiagramFactory.java`, `HclDiagramFactory.java`,
`StyleExtractor.java:60-110`). files does exactly this today:
`src/diagrams/files/parser.ts:113-135` (`createMindmapSkinParam`,
`applyDeclarations`, `jarStyleSource`). The json parsers receive
`source.styleSource` (set by `src/index.ts#umlSourceOfBlock:85`); the test
harness `render-fixture-json.ts` builds its own `UmlSource` and must pass the
same field or it measures a path production never takes.

## Task
- `src/diagrams/json/json-skin-param.ts`: `createJsonSkinParam(source, type): JsonSkinParam`
  (interface in [overview.md](overview.md)). Jar cut applied inside: skinparams
  dropped except `handwritten` (`StyleExtractor.java:88-96`); `<style>`, `skin`,
  `!theme` kept; for hcl also no `<style>`/`skin`/theme (`HclDiagramFactory.java:86-92`).
  `styleName`: `'jsonDiagram'` for JSON, `'yamlDiagram'` for YAML AND HCL
  (`TextBlockJson.java:113`, `SmetanaForJson.java:112-115`). A
  `StyleParsingException` is kept on `styleError` with the styles applied so
  far (`files/parser.ts` precedent; Java `e.printStackTrace()`).
- `ast.ts`: `JsonDiagramAST.skinParam: JsonSkinParam`; the three parsers set it.
- `render-fixture-json.ts`: the `UmlSource` it builds carries `styleSource`
  exactly as `src/index.ts#umlSourceOfBlock` does.
- No consumer reads it yet (batch 2). Output is byte-identical in BOTH modes.

## Write-set
`src/diagrams/json/{json-skin-param.ts,ast.ts,parser.ts}`, `src/diagrams/yaml/parser.ts`,
`src/diagrams/hcl/parser.ts`, `tests/oracle/svg-conformance/render-fixture-json.ts`,
`tests/unit/json/json-skin-param.test.ts`.

## Read-set
`src/diagrams/files/parser.ts:1-140`, `src/core/style/mindmap-style-builder.ts:40-260`,
`src/core/block-extractor.ts:110-130`, `src/index.ts:78-92`,
`src/diagrams/json/json-family-style-input.ts`, the three Java factories above.

## Acceptance
- Given `<style> jsonDiagram { node { BackGroundColor red } }`, when parsed, then `getMergedStyle(root,element,jsonDiagram,node)` on `ast.skinParam` answers red.
- Given a yaml and an hcl source, then `styleName` is `yamlDiagram` for both.
- Given hcl with a `<style>` block, then the merged node style equals the default skin's (the block is dropped).
- Given `skinparam backgroundColor red` + `skinparam handwritten true`, then only `handwritten` reaches the builder.
- Given every pin, the manifest, the extensions ratchet, then green and byte-equal (no consumer yet).

Observability: N/A. Rollback: Reversible.
