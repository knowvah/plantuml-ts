# T1b — `resolveJsonStyles` at the jar's signatures; `withTOBECHANGED` (D2)

Agent: `typescript-pro` (sonnet), worktree `jse-T1b`. Commit:
`feat(json): resolve the family's styles at the jar signatures (T1b)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d2](../decisions.md).

## Context
The jar's six signatures (D2): `TextBlockJson.java:138-152` (`getStyleToUse`:
header/highlight × stereotype), `:269-271` (node), `:286-288` (node+separator),
`:296-299` (highlight row fill), `SmetanaForJson.java:119-125` (arrow, node).
`withTOBECHANGED(Stereotype)` (`StyleSignatureBasic.java:119-132`) returns a
`StyleSignatures` fan-out over the stereotype labels; the port has
`StyleSignatures` (`src/core/style/StyleSignatures.ts`) and `addStereotype`
but not `withTOBECHANGED`. The json `Highlighted` port carries the class as a
lowercase string (`src/diagrams/json/json-layout-prep.ts:117-140`, `styleClass`).

## Task
- `src/core/style/StyleSignatureBasic.ts`: port `withTOBECHANGED` (engine-wide,
  `@see :119-132`), with `src/core/stereo/Stereotype.ts`'s labels; test in
  `tests/unit/core/style/style-signature-tobechanged.test.ts` (no stereotype →
  `this`; two labels → a two-signature `StyleSignatures`).
- `src/diagrams/json/json-style-resolve.ts`: `resolveJsonStyles(skin)` →
  `{ node, nodeHeader, highlight(styleClass: string, header: boolean), separator, arrow }`,
  each a `Style` from `getMergedStyle` at the exact jar signature with
  `skin.styleName` as `<T>`. Cite each line. An empty `styleClass` = no stereotype.
- Tests (`tests/unit/json/json-style-resolve.test.ts`) build builders with
  `buildMindmapStyleBuilder` and assert specific values.

## Write-set
`src/diagrams/json/json-style-resolve.ts`, `src/core/style/StyleSignatureBasic.ts`,
`tests/unit/json/json-style-resolve.test.ts`, `tests/unit/core/style/style-signature-tobechanged.test.ts`.

## Interface out (T2a, T2b)
`JsonStyleSet { node: Style; nodeHeader: Style; highlight(styleClass: string, header: boolean): Style; separator: Style; arrow: Style }`.

## Acceptance
- Given the default skin, then node `RoundCorner` 10 and `LineThickness` 1.5, separator `LineThickness` 1, header `FontStyle` bold, highlight `BackGroundColor` `#ccff02`, arrow `LineStyle` `3-3` (`plantuml.skin` `yamlDiagram,jsonDiagram` block).
- Given `<style> .warn { BackGroundColor orange }` and `highlight('warn', false)`, then the fill is orange.
- Given `<style> jsonDiagram { FontColor red }` (no `node`), then `node`'s font colour is red.
- Given `styleName: 'yamlDiagram'` and a `jsonDiagram { … }` block only, then the yaml styles are the defaults.
- Given every other engine's ratchet (`npx vitest run tests/oracle/svg-conformance --maxWorkers=2`), then green (the core method has no caller outside json yet).

Observability: N/A. Rollback: Reversible.
