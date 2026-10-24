# T2b — description (component / usecase / c4): option and fragment

Agent: `typescript-pro` (sonnet), worktree `lad-T2b`. Commit:
`fix(description): honour skinparam lengthAdjust on both document paths`.
Read [../task-contract.md](../task-contract.md) and
[../decisions.md#d3--both-carriers-on-klimt-shaped-engines](../decisions.md).

## Task
The description engine has two paths (`src/diagrams/description/index.ts:
134-150`): an un-chromed `completeSvg` whose root `<g>` is klimt's own, and a
chromed `RenderFragment` (`renderer.ts:354`) the shell re-roots.
1. `renderer.ts:286` `basicSvgOption({...})`: add `lengthAdjust` mapped from
   `theme.lengthAdjust` to the klimt enum (local 6-line mapping; the exit
   batch dedupes with T2a's). This makes `svg-graphics-core.ts:126-131` write
   the root and `applyTextLengthAdjust` omit `textLength` under `none` on the
   `completeSvg` path.
2. `renderer.ts:354` fragment: spread `lengthAdjust` from the theme (D4) so
   the chromed path's shell root matches.
Component, usecase, deployment and c4 rows all render here.

## Write-set
`src/diagrams/description/renderer.ts`,
`tests/unit/description/lengthadjust-lad-t2b.test.ts`.

## Read-set
`src/diagrams/description/renderer.ts:270-300,340-360`;
`src/diagrams/description/index.ts:128-150`; `src/core/klimt/drawing/svg/
svg-option.ts:25-60`; `svg-graphics-core.ts:118-135`; Java
`TextBlockExporter.java:306-307`, `SvgGraphics.java:155-158,699-705`.

## Acceptance
- Given `skinparam lengthAdjust none` on `[A] --> [B]` (un-chromed path) and
  on the same with `title t` (chromed path), then both roots lack
  `lengthAdjust` and no `<text>` has `textLength`.
- Given `spacingAndGlyphs`, then both roots carry that value.
- Given no skinparam, then both outputs are byte-identical to the pre-change
  renders.
- Given the authored rows `component-*` and `usecase-*`, then all eight are
  `rootExact` and `textLengthMatch`; `description.golden.ratchet.test.ts` and
  `description.diff-baseline.ratchet.test.ts` green; component/usecase/c4
  survey vs b0 shows 0 movers.

Observability: N/A. Rollback: Reversible.
