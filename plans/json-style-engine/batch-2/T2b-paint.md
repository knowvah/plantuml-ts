# T2b — paint from the engine (D2, D5)

Agent: `typescript-pro` (sonnet, effort high), worktree `jse-T2b`. Commit:
`fix(json): paint nodes, rows and arrows from the jar styles (T2b)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d2](../decisions.md), [#d5](../decisions.md).

## Context
`TextBlockJson.drawU` (`:260-330`): node rect `rounded(round)` with
`styleNode.value(RoundCorner)`, fill `BackGroundColor` (may be a gradient),
stroke via `applyStrokeAndLineColor`; separators with the `node+separator`
style's stroke; highlighted row rect `rounded(4)` at `(1.5, 0)` size
`(trueWidth - 2, heightOfRow)` filled with the `+highlight` style (stereotype
via `withTOBECHANGED`); text fill from each cell style's font colour.
Arrow: `root,element,<T>,arrow` (`SmetanaForJson.java:119-120`, `JsonCurve.java`).
Ours: `renderer-style.ts#resolveNodeStyle` builds `NodeStyleJson` from
`Theme.colors.graph.json`; `renderer.ts` emits strings; `json-renderer-highlight.ts`
emits the highlight rect. Gradients: core lifts inline `<linearGradient>` into
`<defs>` (`src/core/svg-defs.ts`, `svg.ts#extractGradientDefs`; precedent
`src/diagrams/wbs/index.ts:190-208`).

## Task
`resolveNodeStyle` builds `NodeStyleJson` from `resolveJsonStyles(geo's skinParam)`
(T1b) — no `colors.graph.json` read. Add: gradient-capable node fill/stroke (D5),
a header font colour distinct from `keyText` (the nested three-space cell keeps
the value font colour — ddc row 33 found the conflation), the row highlight from
`highlight(styleClass, header)` per row, separator and arrow stroke/thickness/
dash from their styles. Keep every emitted attribute order and number form as it is today.

## Write-set
`src/diagrams/json/renderer-style.ts`, `src/diagrams/json/renderer.ts`,
`src/diagrams/json/json-renderer-highlight.ts`, `tests/unit/json/renderer.test.ts`,
`tests/unit/json/renderer-engine-style.test.ts` (new).

## Read-set
`TextBlockJson.java:255-330`, `SmetanaForJson.java:110-180`, `JsonCurve.java`,
`src/diagrams/json/json-style-resolve.ts` (T1b), `src/core/svg-defs.ts`,
`src/diagrams/wbs/index.ts:180-210`, `src/core/style/Style.ts:300-360`.

## Acceptance
- Given `theme-cerulean`, when `diff-one.mts json theme-cerulean --structural` runs, then 0 diffs (one `<defs>` gradient, `rx` 10, `#2683B9` strokes).
- Given `highlight-stereotype`, `style-highlight-block`, `style-header-separator-arrow`, then 0 structural diffs each.
- Given every pinned json/yaml/hcl golden, then byte-equal; manifest `clean` rows still clean.

Observability: N/A. Rollback: Reversible.
