# T3a — extended mode through `FromSkinparamToStyle` (D4)

Agent: `typescript-pro` (sonnet), worktree `jse-T3a`. Commit:
`feat(json): honour skinparams in extended mode through the style engine (T3a)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d4](../decisions.md).

## Context
After batch 2 the family's styles come only from the builder T1a builds with
the jar cut applied — so extended mode currently honours nothing the jar drops.
files solved the same problem (ddc T3b): `files-style-input.ts` marks the
source jar-compatible (`markJarCompatible`, WeakSet; `isExtended`), and the
diagram re-builds its SkinParam with the extended directives
(`files-extensions.ts`, `files/parser.ts#forMode`). The extension examples
(`tests/fixtures/extensions/{json,yaml,hcl}-*`, 24) and DIVERGENCES "Extensions"
define what extended mode must honour; hcl's examples include `<style>`
document/node and themes, which the jar drops for hcl.

## Task
- `json-family-style-input.ts` marks the source in jar-compatible mode (the
  files mechanism); `json-skin-param.ts` builds, in extended mode, from the FULL
  style source (skinparams through `convertSkinparam`, i.e.
  `FromSkinparamToStyle`; hcl keeps `<style>`/`skin`/theme), and in
  jar-compatible mode exactly as T1a does.
- ONE convert wrapper: `defaultFontColor` → also `<T> { FontColor }`, so it
  behaves "as if the skin had no explicit `jsonDiagram { FontColor }`"
  (`FromSkinparamToStyle.java:157`; `plantuml.skin` `yamlDiagram,jsonDiagram { FontColor black }`). No other wrapper.
- Tests: jar-compatible render byte-identical to the directive-free render for
  every extension directive; extended render differs as the mapping says.

## Write-set
`src/diagrams/json/json-skin-param.ts`, `src/diagrams/json/json-family-style-input.ts`,
`tests/unit/json/renderer-style-extension.test.ts`, `tests/unit/json/json-family-style-input.test.ts`.

## Read-set
`src/diagrams/files/{files-style-input,files-extensions,parser}.ts`,
`src/core/style/FromSkinparamToStyle.ts`, `~/git/plantuml/.../style/FromSkinparamToStyle.java:80-400`,
`tests/oracle/svg-conformance/extensions.ratchet.test.ts`, `DIVERGENCES.md` "Extensions".

## Acceptance
- Given jar-compatible mode, then every pinned golden and manifest row byte-equal / clean.
- Given each of the 24 extension examples, then it still differs from its `.plain` twin and from its jar-compatible render; the hand-back lists every example whose bytes moved with the mapping line that explains it (the orchestrator re-pins at the close).
- Given `skinparam defaultFontColor red`, then node text is red in extended mode (the wrapper).

Observability: N/A. Rollback: Reversible.
