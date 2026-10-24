# T1d — json / yaml / hcl: `renderJson` sets the field once

Agent: `typescript-pro` (sonnet), worktree `lad-T1d`. Commit:
`fix(json): honour skinparam lengthAdjust for json, yaml and hcl`.
Read [../task-contract.md](../task-contract.md) and decisions.md Amendment 1 first.
This is an EXTENSION (user ruling 2026-10-23): the jar ignores the skinparam
here (`StyleExtractor.java:88-96`); the port honours it in the library's
extended mode. T1e (parallel) makes `theme.lengthAdjust` reach `renderJson`
in that mode; in the jar-compatible mode the cut keeps it `undefined`.

## Task
One renderer serves three types: `src/diagrams/json/renderer.ts:382
renderJson(rawGeo, rawTheme)`; `json/index.ts:52`, `yaml/index.ts:58`,
`hcl/index.ts:49` spread its result and add their `diagramType`. Set
`lengthAdjust` inside `renderJson` from the theme (D4) so all three inherit
it. These are Smetana-path engines (dot-engine layout), but the root and text
attributes are klimt's and not a layout matter. If `diagnosis/mirrors.md`
says json `<text>` is drawn through a klimt `UGraphicSvg`, also set
`option.lengthAdjust` at that site (D3); otherwise the shell strip covers
`none`.

## Write-set
`src/diagrams/json/renderer.ts` (+ the klimt site T0d named, if inside
`src/diagrams/json/`), `tests/unit/json/lengthadjust-lad-t1d.test.ts`.

## Read-set
`src/diagrams/json/renderer.ts:370-400`; `src/diagrams/json/TextBlockJson.ts:
80-160`; `src/diagrams/{json,yaml,hcl}/index.ts` render arms;
`src/core/assemble-svg.ts:241-253`; `diagnosis/mirrors.md` row 4; Java
`TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `renderJson` + the shell with a theme whose `lengthAdjust` is
  `'none'` (unit level; T1e's end-to-end path is not on your branch), then
  the root `<g>` has no `lengthAdjust` and no `<text>` has `textLength`; the
  same through the yaml and hcl plugins' `render`.
- Given `'spacingAndGlyphs'`, then each root `<g>` carries that value.
- Given no skinparam, then each of the three outputs is byte-identical to its
  pre-change render.
- Given the authored rows `json-*`, `yaml-*`, `hcl-*` (rendered in the
  jar-compatible mode, D5), then all twelve stay `rootExact` and
  `textLengthMatch`; json/yaml/hcl survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
