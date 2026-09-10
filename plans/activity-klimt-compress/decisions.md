# Architecture decisions — `activity-klimt-compress`

Confirmed 2026-09-10 before decomposition. Treat every one as **locked**.
If a task discovers a conflicting constraint, amend the decision here and
halt for review — do not silently override it.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## D1 — The pass is a geometry-to-geometry transform inside `assignCoordinates`

**Context.** `ActivityDiagram3#getTextBlock` (`activitydiagram3/
ActivityDiagram3.java:205-213`) wraps the finished `swimlanes` block in
`CompressionXorYBuilder` ON_X, then ON_Y, then `Recentred`. Each builder
draws once into a `SlotFinder`, then redraws through
`UGraphicCompressOnXorY` (`klimt/compress/CompressionXorYBuilder.java:52-62`).
Our recorded draw list is `ActivityGeometry`; the renderer derives every
emitted shape from node and edge geometry.

**Decision.** `compressGeometry` runs in `layout/tile-coordinates.ts#
assignCoordinates` after `placeSwimlanes` and before the bounds — the same
pipeline point (after layout, before draw). Rejected: a `UGraphic`-style
interceptor in the string renderer; post-processing the SVG.

**Consequences.** One call site; reverting it restores the uncompressed
geometry.

## D2 — One shape adapter feeds a line-for-line `SlotFinder`

**Context.** `SlotFinder#draw` (`klimt/compress/SlotFinder.java:70-140`)
dispatches on shape class: `URectangle`, `UPath`, `UPolygon` (skipped when
`polygon.getCompressionMode() == mode`), `UEllipse`, `UText` (through
`TextLimitFinder`), `UEmpty`; `ULine` and `CenteredText` never occupy;
`UShapeIgnorableForCompression` shapes call `drawWhenCompressed` instead.

**Decision.** `shapesOf(geometry, edgeMeta, reservations, bounder, theme)`
produces a flat `CompressShape[]` (`rect | ellipse | polygon | text |
empty`, with `ignoreX`/`ignoreY`/`polygonSkipMode`), and `collectSlots`
ports the Java dispatch over that list. Kinds upstream never draws (break,
if-merge) emit nothing. Rejected: a node-kind switch inside the slot finder.

**Consequences.** Our node vocabulary lives in one adapter; the ported class
stays comparable to the Java.

## D3 — `ArrowsRegular` is ported first and shared

**Context.** Occupancy depends on the arrowhead polygon's extents:
`ArrowsRegular` (`activitydiagram3/ftile/ArrowsRegular.java:42-79`,
`delta1 = 10`, `delta2 = 4`, notch at `delta1 − 4`) is the default
(`skin/SkinParam.java:1308-1309`, `ArrowsTriangle` only under a style). Our
`renderer.ts#arrowTip` draws a 3-point triangle 8 long and ±3.2.

**Decision.** `arrows-regular.ts` exports `arrowDirection`, `arrowHeadPoints`
and `arrowHeadExtents`; the renderer and the slot finder both consume it.
`ArrowsTriangle` stays filed. Rejected: keeping our triangle for occupancy.

**Consequences.** `polygon[]/@points` moves toward the jar on every fixture
(pre-named); slot edges sit where upstream's do.

## D4 — Both axes, sequentially, each with its own occupancy pass

**Context.** The ON_Y builder wraps the ON_X builder, so Y's `SlotFinder`
sees the X-compressed drawing (`ActivityDiagram3.java:209-210`).

**Decision.** Run X, apply it, then run Y on the transformed geometry.
Rejected: X only.

**Consequences.** Y rarely bites (arrowheads fill the 20 px bar gaps on
`zizaki`, `bixefi`); T0 records where it does.

## D5 — Ignore flags and reservations are structural

**Context.** `FtileBlackBlock#drawU` builds its rect
`.ignoreForCompressionOnX()` (`ftile/vertical/FtileBlackBlock.java:102`);
`URectangle#drawWhenCompressed` reserves `UEmpty(2, h)` at each end
(`klimt/shape/URectangle.java:193-199`); `Worm#drawInternalOneColor` sets
`compressionMode = ON_X` on the decorations of an `ignoreForCompression`
snake (`ftile/Worm.java:159-168`; the fork/split `drawTranslate` snakes,
`ParallelBuilderFork.java:172,229`); `FtileIfDown` (`:349,402,440`) and
`FtileWhile` (`:272`) draw `UEmpty(5, Hexagon.hexagonHalfSize = 12)`;
`LaneDivider#drawU` draws `UEmpty(x1 + x2, 1)` (`ftile/LaneDivider.java:91`);
lane backgrounds and the title band ignore both axes (`ftile/Swimlanes.java
:339,364-365`); `smaller(5.0)` is `CompressionXorYBuilder.java:56`.

**Decision.** `Out` gains an internal `reservations` list emitted by the
if/while walkers and the lane pass; bar kinds and `EdgeMeta.shape` carry the
other flags. No public type change. Rejected: any of these as tunables.

**Consequences.** Every number in the pass has a citation; stop 4 guards it.

## D6 — Bounds come from the transform

**Context.** `CompressionXorYBuilder#calculateDimension` returns
`affine.transform(dim.getWidth())` (`:63-69`).

**Decision.** `totalWidth`/`totalHeight` are the pass-1 bounds pushed through
the X and Y transforms. `Recentred` stays out (`activity-canvas-margin`).

**Consequences.** `svg/@width`/`@height` move with the removed slots.

## D7 — Lanes transform like rectangles; widths stay pre-compression

**Context.** The whole swimlanes block is compressed; a divider's `UEmpty`
keeps its width occupied; `UGraphicCompressOnXorY` re-centres a
`CenteredText` in its compressed width (`klimt/compress/
UGraphicCompressOnXorY.java`, the `CenteredText` branch). Lane widths are
computed before `getTextBlock` (`Swimlanes.java:396-449`).

**Decision.** `SwimlaneGeo.x`, `x + width`, `contentX`, `contentX +
contentWidth` pass through the transform; dividers occupy `x1 + x2`; titles
re-centre at render from the transformed content fields; `measureLanes` is
untouched (stop 12).

**Consequences.** Divider x's on laned fixtures move toward the jar's.
