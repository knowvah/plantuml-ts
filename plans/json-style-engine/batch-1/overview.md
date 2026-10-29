# Batch 1 — the family SkinParam and the style resolver

Two parallel worktrees, disjoint write-sets. Neither has a consumer yet:
output must stay byte-identical in BOTH modes (the D6 check at the close shows
0 movers). T1b ports `withTOBECHANGED` into core, so the close runs the
all-engine chain against b0 (stop 5).

| ID | Description | Agent | Writes | Depends On | Done |
|---|---|---|---|---|---|
| [T1a](T1a-json-skin-param.md) | `json-skin-param.ts`; parsers carry `JsonDiagramAST.skinParam`; harness passes `styleSource` | typescript-pro (sonnet, effort high), jse-T1a | `src/diagrams/json/{json-skin-param.ts,ast.ts,parser.ts}`, `src/diagrams/yaml/parser.ts`, `src/diagrams/hcl/parser.ts`, `tests/oracle/svg-conformance/render-fixture-json.ts`, `tests/unit/json/json-skin-param.test.ts` | T0a | [x] |
| [T1b](T1b-style-resolver.md) | `resolveJsonStyles` at the six jar signatures; `withTOBECHANGED` ported | typescript-pro (sonnet), jse-T1b | `src/diagrams/json/json-style-resolve.ts`, `src/core/style/StyleSignatureBasic.ts`, `tests/unit/json/json-style-resolve.test.ts`, `tests/unit/core/style/style-signature-tobechanged.test.ts` | T0a | [x] |
| close | merges; gates `b1`; chain vs b0; D6 check (0 movers); `fixtures.md` b1 row | orchestrator | per close-procedure | T1a, T1b | [x] |

## Interface (declared here; T1b codes against it, T1a implements it)
```ts
interface JsonSkinParam {
  getCurrentStyleBuilder(): StyleBuilder;
  getIHtmlColorSet(): HColorSet;
  readonly styleName: 'jsonDiagram' | 'yamlDiagram';
  readonly styleError?: Error;
}
// JsonDiagramAST.skinParam: JsonSkinParam  (always set by the three parsers)
```
T1b takes `Pick<JsonSkinParam, 'getCurrentStyleBuilder' | 'styleName'>` and builds
its test builders with `buildMindmapStyleBuilder`; T1a exports the full type.
