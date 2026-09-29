## Observation: port's LimitFinder "empty" is MAX_VALUE, not Infinity
- **Context**: gating the description-label `{{ }}` embed out of the ink pass (cdd6 T3b experiment, row 47).
- **Finding**: `LimitFinder.ts` starts at `±Number.MAX_VALUE` (Java's `Double.MAX_VALUE`), so an ink walk that drew nothing returns minX 1.797e308 / maxX -1.797e308. `leaf-sizing-entity.ts#measureEntityLeafInk`'s `Number.isFinite(minX)` guard does NOT catch it; the value reaches `class-ink-box.ts#addClassifierInk` as `symbolInk` and poisons the whole canvas (T2b's "Infinity canvas" on tefeco).
- **Impact**: an empty-MinMax test must be `minX > maxX`, not `isFinite`.
- **Confidence**: High (instrumented tefeco, reverted).

## Observation: class per-leaf USymbol fragments already carry the jar's ensureVisible extent
- **Context**: looking for a real-draw extent beside the class ink walk.
- **Finding**: `renderer-usymbol-entity.ts#renderClassUSymbolEntity` draws each description leaf into its own `UGraphicSvg` seeded with `minDim = (x+w, y+h)`; the returned `DrawableFragment.width/height` is that SvgGraphics' `ensureVisible` maximum in the absolute drawn frame. `renderer.ts` collects them (`usymbolEntityFragments`) but sizes the canvas from `geo.totalWidth/Height` only.
- **Impact**: `max(totalWidth, fragment widths)` reproduces `SvgGraphics.java:129-133,1033-1034` for embeds the jar's LimitFinder never sees; measured rojida/rozugu 0/0, tefeco (a) closed.
- **Confidence**: High (measured, experiment reverted pending write-set extension).
