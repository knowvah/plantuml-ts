# T3a — extension audit, pinned examples, docs (D10)

Agent: `typescript-pro` (sonnet), worktree `lad-T3a` off the batch-2 close.
Commit: `docs(extensions): document json-family and files styling extension`.
Read [../task-contract.md](../task-contract.md) and decisions.md Amendment 1
(the user ruling, D9, D10) first. No `src/` change; a directive that does not
work is documented as ignored, never fixed here (report it as a follow-on).

## Task
1. **Audit** (`plans/lengthadjust-document-wide/diagnosis/extension-audit.md`):
   for json, yaml, hcl and files, render in the library's default (extended)
   mode and in the jar-compatible mode (`InternalRenderOptions`, T1e) a probe
   per directive family: `skinparam backgroundColor`, `skinparam
   defaultFontName` / `defaultFontSize` / `defaultFontColor`, per-engine
   skinparams the theme exposes (grep the theme/style-map for the engine's
   keys), `skinparam lengthAdjust none|spacingAndGlyphs`, `<style>` (hcl
   only — json/yaml already honour it in the jar), `skin`, `!theme <name>`
   (aws-orange, amiga). One row per probe: directive · engine · extended
   output differs from jar-compatible (yes/no) · what visibly changed
   (attribute and value, quoted from the SVG) · verdict `works` /
   `ignored`. No guessing: every verdict comes from the two renders.
2. **Examples**: for every `works` row, `tests/fixtures/extensions/<engine>-
   <directive>.puml` plus its port-rendered `.svg` (extended mode) and a
   `<engine>-<directive>.plain.puml` twin without the directive.
3. **Ratchet** `tests/oracle/svg-conformance/extensions.ratchet.test.ts`:
   each example renders byte-equal to its pinned `.svg`; each differs from
   its twin's render; each twin's extended render equals its jar-compatible
   render (the "same when absent" rule).
4. **Docs**: `DIVERGENCES.md` gains an "Extensions (user ruling
   2026-10-23)" section: the ruling in two sentences, the `works` table,
   the `ignored` list, how conformance is measured (D9 jar-compatible
   normalisation). `docs-site/guide/`: one page "Styling JSON, YAML, HCL and
   files diagrams" with 3–6 rendered examples (inline the example `.puml`
   source; follow how other guide pages embed diagrams) and its sidebar /
   nav entry. If the docs site renders PlantUML examples at build time,
   run its build once.

## Write-set
`tests/fixtures/extensions/**`, `tests/oracle/svg-conformance/
extensions.ratchet.test.ts`, `DIVERGENCES.md`, `docs-site/guide/
styling-data-diagrams.md` + `docs-site/.vitepress/config.ts` (sidebar/nav entry
only), 
`plans/lengthadjust-document-wide/diagnosis/extension-audit.md`.

## Acceptance
- Given the audit, then every directive family × engine has a measured
  verdict with quoted evidence.
- Given the ratchet, then every example is pinned, differs from its twin,
  and every twin renders identically in both modes.
- Given `DIVERGENCES.md` and the docs page, then only `works` directives are
  presented as supported, each with an example.

Observability: N/A. Rollback: Reversible.
