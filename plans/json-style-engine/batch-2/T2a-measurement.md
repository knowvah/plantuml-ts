# T2a — row measurement with the per-row style's font (D2)

Agent: `typescript-pro` (sonnet, effort high), worktree `jse-T2a`. Commit:
`fix(json): measure each row with its jar style's font (T2a)`.
Read [../task-contract.md](../task-contract.md) and [../decisions.md#d2](../decisions.md).

## Context
The jar builds each cell with `getTextBlock(getStyleToUse(header, highlighted), text)`
(`TextBlockJson.java:123-131`): the key cell uses the `+header` style, the value
cell the plain node style, both with `+highlight` (and the row's stereotype)
when highlighted; `getTextBlock` takes `style.getFontConfiguration`,
`wrapWidth`, `getHorizontalAlignment` and wraps with margin (5, 2) (`:340-349`).
Ours measures in `src/diagrams/json/TextBlockJson.ts` with fonts resolved from
`Theme.colors.graph.json` (`layout.ts:267`).

## Task
Measure every key/value cell with the font configuration of its jar style from
`resolveJsonStyles(ast.skinParam)` (T1b): family, size, bold/italic, wrap width.
Remove the `layout.ts:267` theme read. Keep the cell arithmetic (margin 5/2,
tab stops, Fission) exactly as it is. The geometry carries per-cell font data
the renderer emits (field names: your choice, documented in the geometry type).

## Write-set
`src/diagrams/json/TextBlockJson.ts`, `src/diagrams/json/layout.ts`,
`tests/unit/json/layout.test.ts`, `tests/unit/json/text-block-style.test.ts` (new).
(A split inside `src/diagrams/json/` forced by the 500-line hook is allowed; journal it.)

## Read-set
`TextBlockJson.java:96-160,330-350`, `src/diagrams/json/json-style-resolve.ts` (T1b),
`src/diagrams/json/json-skin-param.ts` (T1a), `src/diagrams/json/TextBlockJson.ts`, `layout.ts:250-300`.

## Acceptance
- Given T0c's `header-fontsize` row, when `diff-one.mts json header-fontsize --structural` runs, then the key cell widths match the jar (0 width diffs).
- Given `style-highlight-block` (FontStyle in the highlight block), then the highlighted row's text width matches.
- Given every pinned json/yaml/hcl golden, then byte-equal; given the manifest's `clean` rows, then still clean.

Observability: N/A. Rollback: Reversible.
