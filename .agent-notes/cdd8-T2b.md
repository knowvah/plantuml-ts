# cdd8 T2b: MyElkDrawing

## Observation: how T3 wires the drawing
- **Context**: porting `MyElkDrawing.java:100-108` against T2a's factory seam.
- **Finding**: `CucaDiagramFileMakerElk.java:495-498` builds the drawing twice
  (null minMax for the LimitFinder, then the real one). The port mirrors it as
  `const r = makeElkLayout(adapter, backend, newMyElkDrawing);
  new MyElkDrawing(adapter, r.minMax, r)` (`ElkMakerResult` extends `ElkMakerMaps`).
  `calculateDimension` throws on the provisional drawing, as upstream (`:342-343`).
- **Impact**: `drawLeaf` is called twice per leaf per render; adapters must be
  idempotent there (upstream's `svekNode.resetMove()` makes it so).
- **Confidence**: High

## Observation: drawLeaf gets the untranslated ug
- **Finding**: `drawAllNodes` passes the drawing's `ug` and the corner; the
  adapter applies `UTranslate.point(corner)` (`IEntityImageUtils.java:55-57`).
  The edges' node borders are the reverse-translated adapter border
  (`translatedNodeImage`, `IEntityImageUtils.java:103-111`).
- **Impact**: an adapter that also translates draws every leaf at 2x its corner.
- **Confidence**: High (cadutu end-to-end rects match in.svg)

## Observation: cadutu fixture data is duplicated in two test files
- **Finding**: `tests/unit/elk/MyElkDrawing.test.ts` repeats the cadutu widths,
  links and jar edge shapes from `MyElkEdge.test.ts` (importing a test file
  would re-register its suites; `tests/helpers/` was outside T2b's write-set).
- **Impact**: candidate for a `tests/helpers/elk-cadutu-fixture.ts` extraction.
- **Confidence**: High
