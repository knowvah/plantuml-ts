## Observation: measureCircleInterfaceInk Y-axis ink disagrees with the real draw
- **Context**: T4a (class-divergence-drive-5, batch 4) — porting the
  degenerate-text-ensurevisible family for `circle A` / `() "label"`
  single-classifier diagrams (rows `rupigu-89-xabo757`,
  `vabobu-24-temi990`).
- **Finding**: `measureCircleInterfaceInk` (`src/diagrams/class/
  class-layout-leaf-shapes.ts`) does a real `LimitFinder` walk over
  `EntityImageDescription.drawU` to get the circle-interface leaf's ink
  extent (`symbolInk`). For `circle A` (defaultTheme, WidthTableMeasurer)
  it reports `maxY=38.3888...` (local, untranslated). The PORT'S OWN real
  renderer draws the label's `<text>` at absolute `y=43.889`, which is
  BYTE-IDENTICAL to the jar's oracle SVG. With the degenerate near-margin
  (7) subtracted, the real local baseline is `36.889` — `symbolInk.maxY`
  overshoots the real draw by almost exactly 1.5px. The X axis does NOT
  have this problem: `symbolInk.maxX` for `vabobu-24-temi990` ("my label")
  produced the jar-exact total width (41) once folded into the degenerate
  canvas's embed-right/embed-bottom max (this task's fix).
- **Ruled out** (params compared field-by-field between
  `buildCircleInterfaceSizingParams` (sizing) and
  `buildUSymbolEntityParams` (real draw), `class-layout-leaf-shapes.ts` vs
  `renderer-usymbol-entity.ts`): stroke thickness (both 0.5), roundCorner/
  diagonalCorner (irrelevant — `CircleInterface2.calculateDimension` is a
  fixed 18x18 regardless), font size/role (`resolveElementFontSize(theme,
  'circle', 'title')` resolves identically both ways, jar's own SVG
  confirms `font-size="14"`), `HIDE_TEXT_SPACE`(8)+`dimSmallHeight`(18)=26
  (both derive from the same fixed `CircleInterface2` dimension), and
  `buildDesc`'s `displayEqualsCode`/`isPackageLeaf`/`isWhite` branch
  selection (identical for this fixture in both param sets). NOT yet
  isolated to a specific line — likely inside `BodyFactory.create3`'s
  internal baseline/line-height math reached only via the SIZING call
  path, but not confirmed.
- **Impact**: `measureCircleInterfaceInk`'s `symbolInk` field is ALSO read
  by the non-degenerate path (`class-ink-box.ts#addClassifierInk`'s
  `symbolInk` branch) for every multi-entity diagram containing a
  `circle`/`() "name"` interface leaf — this Y-axis gap likely affects
  canvas sizing there too, not just the degenerate path. `class-layout-
  leaf-shapes.ts` is outside T4a's write-set (`class-geo-builders.ts`,
  `layout.ts` only); a fix belongs to a future mission touching that file.
- **Confidence**: High for the existence/magnitude of the gap
  (instrumented: sizing walk vs real render's own `<text y>`, both
  measured directly). Medium for "not yet isolated to a specific line" —
  investigation was field-by-field on the constructor params, not a full
  trace through `BodyFactory.create3`.
