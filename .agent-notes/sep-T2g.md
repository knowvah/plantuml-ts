# sep-T2g: UPixel driver + dimToUse nullability

## Observation: a fill-less SVG driver inherits the writer's last fill
- **Context**: porting `DriverPixelSvg` (`DriverPixelSvg.java:44-58`), which sets stroke colour + width 0.5 and emits a 0.5×0.5 rect without touching fill.
- **Finding**: the port's `SvgGraphics` already keeps its last fill (`fillColor = 'black'` initially, `svg-graphics-core.ts:139`, as `SvgGraphics.java:110`), so the jar's `fill="black"` (first shape) vs `fill="#000"` (after a filled shape) falls out with no extra plumbing. Pinned on `widget-image.jar.svg` and `kaziri-68-fofu065` (35 rects, attribute-for-attribute).
- **Impact**: any future fill-less driver (`DriverCenteredCharacterSvg`, …) needs no fill state of its own.
- **Confidence**: High

## Observation: `LimitFinder`'s `UPixel` branch is reachable for salt only through a mainframe
- **Context**: deciding whether to port `LimitFinder.java:146-147` (`addPoint(x, y)` for `UPixel`).
- **Finding**: `PSystemSalt` is a `TitledDiagram`; `TitledDiagram.java:476` → `DiagramChromeFactory`; with a mainframe `computeDelta` (`DiagramChromeFactory.java:333`) runs `TextBlockUtils.getMinMax`, which draws the salt image into a `LimitFinder`. Ported; placed after the `CopyForegroundColorToBackgroundColor` branch as upstream orders it.
- **Confidence**: High

## Observation: `dimToUse` consumers (pure type widening to `XDimension2D | null`)
- **Finding**: readers with an unguarded `!` + Java NPE citation: `ElementLine` (java:62), `ElementMenuBar#drawBar` (java:108), `ElementBorder` (java:80), `ElementMenuPopup` (java:82,88 — not in the spec's list, same treatment). Pass-through: `ElementPyramidScrolled`, `ElementTabBar`, `WrappedElement`. Unused: the other 10 implementers. Test stubs with a non-null parameter still typecheck (method-parameter bivariance).
- **Impact**: `ElementTreeEntry` passes `null` directly (`ElementTreeEntry.java:90,96`); `NULL_DIM_TO_USE` is gone.
- **Confidence**: High

## Observation: stale doc comment in `driver-svg-stubs.ts`
- **Finding**: the comment says `UImage`/`UImageSvg` "do not exist anywhere in this port"; `src/core/klimt/shape/UImage.ts` and `UImageSvg.ts` exist. Left alone (outside T2g's edit); a 1-line docs fix for whoever next touches that file.
- **Confidence**: High
