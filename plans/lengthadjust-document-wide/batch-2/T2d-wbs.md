# T2d — wbs: `getlengthAdjust()`, option and fragment

Agent: `typescript-pro` (sonnet), worktree `lad-T2d`. Commit:
`fix(wbs): honour skinparam lengthAdjust via the diagram's SkinParam`.
Read [../task-contract.md](../task-contract.md), decisions D1 and D3.

## Task
Same shape as T2c, on wbs: `index.ts:312 render(geo)` → `renderWbs(geo.
diagram, measurer)`.
1. `src/diagrams/wbs/wbs-skin-param.ts` (`class SkinParam`, `:93`; `getValue`
   at `:126`): add `getlengthAdjust(): RootLengthAdjust | undefined` mirroring
   `SkinParam.java:1258-1269` (case-insensitive three names, else `undefined`).
2. `index.ts:160` `basicSvgOption({...})`: add `lengthAdjust` mapped to the
   klimt enum (local mapping; exit dedupes).
3. `index.ts:192` fragment: spread `lengthAdjust` when defined.

## Write-set
`src/diagrams/wbs/wbs-skin-param.ts`, `src/diagrams/wbs/index.ts`,
`tests/unit/wbs/lengthadjust-lad-t2d.test.ts`.

## Read-set
`src/diagrams/wbs/index.ts:150-200,300-320`; `wbs-skin-param.ts:90-170`;
`src/core/klimt/drawing/svg/svg-option.ts:25-60`; Java `SkinParam.java:
1258-1269`, `TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `* A`, then the root `<g>` has no
  `lengthAdjust` and no `<text>` has `textLength`.
- Given `spacingAndGlyphs`, then the root `<g>` carries that value.
- Given no skinparam, then the output is byte-identical to the pre-change
  render; `wbs.golden.ratchet.test.ts` and `wbs.diff-baseline.ratchet.test.ts`
  green (176 pins, 28 error rows untouched).
- Given the authored rows `wbs-*`, then all four are `rootExact` and
  `textLengthMatch`; wbs survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
