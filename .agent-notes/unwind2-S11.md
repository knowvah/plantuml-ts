## Observation: `Theme#sprites` is the SkinParam sprite map seam
- **Context**: unwind2-S11, porting `<$sprite>` atoms into activity, state and class text paths.
- **Finding**: upstream every text block resolves a sprite via `skinParam.getSprite(name)`
  (`StripeSimple.java:229`, `SkinParam.java:799-817`). The port now carries the map as
  `Theme#sprites` (`src/core/theme-root-fields.ts`); `layoutActivity`/`layoutState`/`layoutClass`
  set it from `ast.sprites` and their renderers restore it from `geo.sprites`, so no composition
  site (index.ts or `tests/oracle/svg-conformance/render-fixture-*.ts`) had to change.
- **Impact**: a new text path reads `theme.sprites` instead of threading a registry parameter.
- **Confidence**: High

## Observation: a creole image atom sits on the LINE bottom, not the baseline
- **Context**: cluster title / edge label sprites.
- **Finding**: jar `P <$foo>` (14pt): line top 8, bottom 22, baseline 18.889, sprite 9.077..22;
  edge `e <$foo>` (13pt): baseline 96.111, sprite 87..99. `Sea` puts an altitude-0 atom's bottom
  on the line bottom (baseline + descent). The old title draw used `baseline - height`.
- **Impact**: any new image-in-text draw site should use the line bottom; the `<image>` width/height
  are the raster's rounded size while the line advances by the scaled one.
- **Confidence**: High

## Observation: bilinear downscale residual reappears at 12pt over a coloured back
- **Context**: `ac-color` at the activity 12pt font (sprite scale 12/13) over `#FFC0CB`.
- **Finding**: 3 channel values differ by 1 from the jar; at 13pt (scale 1) the PNG is identical.
  Same unexplained residual unwind-U4 recorded for `sprite-bilinear.ts`; the back colour is right.
- **Impact**: the fixture is pinned at 13pt; the 12pt case is a `sprite-bilinear.ts` question.
- **Confidence**: High (measured), Low (mechanism)

## Observation: state transition labels still draw sprite markup literally
- **Context**: `tests/fixtures/unwind2-S11/st-transition`.
- **Finding**: the state transition label is measured (`state-dot-graph.ts#computeEdgeLabelBox`,
  `state-composite-edge-label.ts`) and drawn (`state-transition-label.ts`) as one plain string;
  the jar draws `t`, the sprite, `u`. The class runs module (`class-edge-label-sprite-runs.ts`)
  is class-local and cannot be imported by state.
- **Impact**: open; pinned as a known gap in `unwind2-s11-sprite-atoms.test.ts`.
- **Confidence**: High
