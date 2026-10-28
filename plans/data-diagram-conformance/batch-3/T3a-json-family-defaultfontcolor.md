# T3a — `skinparam defaultFontColor` for json/yaml/hcl (extension, D8)

Agent: `typescript-pro` (sonnet), worktree `ddc-T3a`. Commit:
`feat(json): honour skinparam defaultFontColor as an extension (T3a)`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d8](../decisions.md) first.

## Context
Extended mode keeps the preprocessor's full skinparam map (jar-compatible
mode cuts it to `handwritten`, `json-family-style-input.ts`). `defaultFontName`
and `defaultFontSize` already reach the node text through the theme cascade
`renderer-style.ts` resolves; `defaultFontColor` does not
(`plans/lengthadjust-document-wide/diagnosis/extension-audit.md:37,52,67`:
"ignored"), because the skin's explicit `jsonDiagram { FontColor black }`
(`plantuml.skin:456`) wins over the root default in the cascade. The
extension's semantics are whatever `FromSkinparamToStyle.java` gives
`defaultFontColor` in a class diagram — READ IT FIRST and quote the mapping
(it may map to `root { FontColor }`, which the element style overrides, in
which case the honest extension is "the directive sets the family font
colour as if the skin had no explicit FontColor"; say which).

## Task
- `renderer-style.ts`: resolve the node/header/highlight font colour with
  the directive honoured in extended mode only (`isJarCompatibleStyleInput`
  is already the switch upstream of the plugin: in jar-compatible mode the
  skinparam map has no such key, so NO mode check in the renderer —
  the cut is the switch). Cite `FromSkinparamToStyle.java` lines.
- Tests first: extended render with `skinparam defaultFontColor red` → the
  key/value `<text fill>` is `#FF0000`; jar-compatible render → byte-identical
  to the directive-free render (read `withJarCompatibleStyleInput`).
- Three fixtures `tests/fixtures/extensions/{json,yaml,hcl}-defaultfontcolor.puml`
  (the extensions ratchet needs each to differ between the two modes).

## Write-set
`src/diagrams/json/renderer-style.ts`, `tests/unit/json/renderer-style-extension.test.ts`,
`tests/fixtures/extensions/{json,yaml,hcl}-defaultfontcolor.puml`.

## Acceptance
- Given `skinparam defaultFontColor red` in extended mode, when a json/yaml/hcl node renders, then its text fill is red (cite the mapping).
- Given the same source in jar-compatible mode, then the svg is byte-identical to the render without the directive.
- Given every pinned json/yaml/hcl golden and the structural manifest, then unchanged (`npx vitest run tests/oracle/svg-conformance/json-family-structural.test.ts tests/oracle/svg-conformance/{json,yaml,hcl}.golden.ratchet.test.ts tests/oracle/svg-conformance/extensions.ratchet.test.ts --maxWorkers=2 --coverage.enabled=false` green).

Observability: N/A. Rollback: Reversible.
