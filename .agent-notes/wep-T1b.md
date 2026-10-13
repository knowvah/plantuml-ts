## Observation: Style#applyStrokeAndLineColor is not ported
- **Context**: porting `WBSTextBlock#drawLine` (WBSTextBlock.java:93-100)
- **Finding**: `src/core/style/Style.ts` lists `applyStrokeAndLineColor` (Style.java:372-381) under "Not ported"; no other module in `src/` provides it. `drawLine` and `getStyleUsed` were held back (stop 10) rather than re-implemented in wbs.
- **Impact**: RESOLVED 2026-10-13 (d3d902d11, maintainer-extended write-set); `drawLine` landed in 1079813c8.
- **Confidence**: High

## Observation: wbs leaf widths are float32, compare at 3 decimals
- **Context**: asserting `ITFLeaf` dimensions against `test-results/dot-cache/wbs/*/in.svg`
- **Finding**: `DeterministicMeasurer` widths are `Math.fround` text widths, so a box reads 40.02499961853027 where the jar prints 40.025. Compare via `Number(n.toFixed(3))` (the jar's `SvgGraphics#format` precision) or `toBeCloseTo(x, 3)`; drawn SVG strings match the jar byte-for-byte.
- **Impact**: exact `toEqual` on raw dimensions fails for any text-derived width.
- **Confidence**: High

## Observation: a mindmap parse supplies a usable wbs StyleBuilder in tests
- **Context**: no wbs skin param exists before T0/T2 merge
- **Finding**: `parseMindMap('@startmindmap\n<style>...</style>\n* r\n@endmindmap')` (tests/unit/mindmap/helpers/mindmap-skin.ts) returns the production `SkinParam` whose builder holds the default skin's `wbsDiagram` block plus any `<style>`, and carries `atomOps`. Leaf sizes built from it match the jar for WBS-monoline-def-0-5 and mogume-53-tuxe939.
- **Impact**: wbs unit tests can run before `wbs-skin-param.ts` lands; swap to it once it exists.
- **Confidence**: High

## Observation: wbs -> activity/mindmap imports trip the layering fitness test
- **Context**: running `tests/architecture` after the T1b commits
- **Finding**: `tests/architecture/layering.test.ts` fails on `src/diagrams/wbs/{ITFLeaf,WBSTextBlock}.ts` importing `activity/ftile/vertical/FtileBoxOld.ts` (D3) and `mindmap/IdeaShape.ts` (upstream `wbs` imports `mindmap.IdeaShape`). Only `src/diagrams/mindmap/ -> src/diagrams/activity/ftile/` is allowlisted.
- **Impact**: every wbs task importing those modules needs two `ALLOWLIST` entries (`src/diagrams/wbs/` -> `src/diagrams/activity/ftile/`, and -> `src/diagrams/mindmap/`); the test file is outside the T1b write-set.
- **Confidence**: High
