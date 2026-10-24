# T1e — the jar-compatible style-input seam (D9)

Agent: `typescript-pro` (sonnet), worktree `lad-T1e`. Commit:
`feat(core): honour json-family and files styling as a port extension`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md](../decisions.md) Amendment 1 (D9, D10) first. Core task:
survey every engine (in jar mode) against b0.

## Why
User ruling 2026-10-23 (decisions.md Amendment 1): the jar drops every
`skinparam` but `handwritten` for json/yaml/hcl/files
(`StyleExtractor.java:88-96`; factories `JsonDiagramFactory.java:75`,
`YamlDiagramFactory.java:75`, `HclDiagramFactory.java:69`,
`FilesDiagramFactory.java:56`) and hcl also drops `<style>`/`skin`/`!theme`
(`HclDiagramFactory.java:86-92` commented `applyStyles`). The port did the
same since unwind-U1 (`5dfa7a002`) and unwind2-S2 (`1818be1d6`) via
`plugin.styleInput` at `src/index.ts:313`. The ruling makes those cuts the
*jar-compatible normalisation*, applied only for conformance, and makes the
uncut input the library default.

## Task
1. New module `src/core/internal-render-options.ts`: `export interface
   InternalRenderOptions extends RenderOptions { readonly
   jarCompatibleStyleInput?: boolean }` + a reader `isJarCompatibleStyleInput
   (options: RenderOptions | undefined): boolean`. Never re-exported from
   `src/index.ts`; the built `dist/*.d.ts` must not change (diff it).
2. `src/index.ts#prepareBlock` (`:313`): apply `plugin.styleInput` only when
   `isJarCompatibleStyleInput(options)`. Nested renders already receive the
   same `options` (`:327`), so the mode propagates.
3. `src/core/dispatcher-types.ts:331,350`: re-document `styleInput` as the
   jar-compatible normalisation (applied only in that mode), citing D9.
4. files: read `FilesDiagram.java` (constructor and wherever the
   `StyleExtractor` passed by `FilesDiagramFactory.java:56` is used) and give
   `src/diagrams/files/index.ts` the matching `styleInput` cut (reuse
   `jsonFamilyStyleInput` / `hclStyleInput` if one matches exactly; quote
   the Java either way). If the Java cannot be read to a definite answer:
   stop 15.
5. Conformance callers pass `{ ...opts, jarCompatibleStyleInput: true }`
   typed as `InternalRenderOptions`: `scripts/svg-parity-survey.ts` (both
   `renderSync` sites, `:288`, `:316`), `scripts/svg-conformance-census.ts`
   (`:252` and any other), `tests/oracle/svg-conformance/
   render-fixture-lengthadjust.ts` (T0c). Then
   `grep -rln "renderSync\|render(" tests/oracle scripts` and, for every
   other caller that compares a json/yaml/hcl/files render against a jar
   oracle or a jar-derived pin, add the option — list each in the hand-back.
   `render-fixture-json.ts` applies the cuts itself (`:99-103`): leave it.
6. Unit tests that assert the library ignores a json-family skinparam/style
   (`grep -rn "unwind-U1\|unwind2-S2\|styleInput" tests/unit`) are
   conformance claims: move each to the jar-compatible mode and add the
   extended-mode twin asserting the directive now takes effect.
7. Fitness test `tests/unit/core/jar-compatible-style-input.test.ts`: for
   every `.puml` under `tests/fixtures/{unwind-U1,unwind2-S2,lengthadjust}`
   and `test-results/dot-cache/{json,yaml,hcl,files}/*/in.puml` (skip when
   the cache is absent) whose source has no `skinparam`, `<style>`, `skin `
   or `!theme` line, extended `renderSync` === jar-compatible `renderSync`
   byte for byte. And for the jar-compatible mode, the existing
   `tests/fixtures/unwind-U1` / `unwind2-S2` pins stay green unchanged.
8. `npm run catalog` (new module).

## Write-set
`src/core/internal-render-options.ts` (new), `src/index.ts`,
`src/core/dispatcher-types.ts`, `src/diagrams/files/index.ts`,
`src/diagrams/json/json-family-style-input.ts` (doc comment + a files cut if
needed), `scripts/svg-parity-survey.ts`, `scripts/svg-conformance-census.ts`,
`tests/oracle/svg-conformance/render-fixture-lengthadjust.ts`, the callers
and unit tests found in steps 5–6 (list them), `tests/unit/core/
jar-compatible-style-input.test.ts`, `docs/catalog.md`.

## Acceptance
- Given `@startjson` with `skinparam backgroundColor red` (and the
  `tests/fixtures/unwind-U1/json-skinparam-bg.puml` source), then extended
  `renderSync` shows the red background and jar-compatible `renderSync` is
  byte-identical to the jar oracle path it matched before.
- Given an hcl `<style>` fixture (`unwind2-S2/hcl-style-node.puml`), then the
  extended render applies the style; the jar-compatible render is unchanged.
- Given the fitness test, then every directive-free source renders
  identically in both modes.
- Given `npm run build`, then `dist/*.d.ts` is byte-identical to the
  pre-change build (stop 10).
- Given the survey of every engine in jar mode vs b0, then 0 movers; every
  golden ratchet and diff-baseline ratchet green with no pin edited.

Observability: N/A. Rollback: Reversible (revert restores the cut as the
library default).
