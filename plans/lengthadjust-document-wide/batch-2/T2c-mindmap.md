# T2c — mindmap: `getlengthAdjust()`, option and fragment

Agent: `typescript-pro` (sonnet), worktree `lad-T2c`. Commit:
`fix(mindmap): honour skinparam lengthAdjust via the diagram's SkinParam`.
Read [../task-contract.md](../task-contract.md),
[../decisions.md#d1--where-each-engine-reads-the-value](../decisions.md) and D3.

## Task
Mindmap renders from its own diagram object (`index.ts:235 render(geo)` →
`renderMindMap(geo.diagram, measurer)`); `theme` is not on the path, and the
jar reads the diagram's SkinParam (`TextBlockExporter.java:306-307`).
1. `src/diagrams/mindmap/mindmap-skin-param.ts` (`class SkinParam`, `:94`;
   `getValue` at `:139`): add `getlengthAdjust(): RootLengthAdjust | undefined`
   mirroring `SkinParam.java:1258-1269` — `getValue('lengthAdjust')`,
   `equalsIgnoreCase` against `spacingAndGlyphs`, `spacing`, `none`; anything
   else `undefined` (= `LengthAdjust.defaultValue()`, left implicit per D4).
2. `index.ts:137` `basicSvgOption({...})`: add `lengthAdjust` mapped to the
   klimt enum from that value (local mapping; exit dedupes).
3. `index.ts:151` fragment: spread `lengthAdjust` when defined.

## Write-set
`src/diagrams/mindmap/mindmap-skin-param.ts`, `src/diagrams/mindmap/index.ts`,
`tests/unit/mindmap/lengthadjust-lad-t2c.test.ts`.

## Read-set
`src/diagrams/mindmap/index.ts:125-160,215-240`; `mindmap-skin-param.ts:90-180`;
`src/core/klimt/drawing/svg/svg-option.ts:25-60`; Java `SkinParam.java:
1258-1269`, `TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,
699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `* root`, then the root `<g>` has no
  `lengthAdjust` and no `<text>` has `textLength`.
- Given `skinparam lengthAdjust SPACINGANDGLYPHS` (case test), then the root
  `<g>` has `lengthAdjust="spacingAndGlyphs"`.
- Given `skinparam lengthAdjust bogus`, then output equals the no-skinparam
  render (default, `SkinParam.java:1269`).
- Given no skinparam, then the output is byte-identical to the pre-change
  render; `mindmap.golden.ratchet.test.ts` green.
- Given the authored rows `mindmap-*`, then all four are `rootExact` and
  `textLengthMatch`; mindmap survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
