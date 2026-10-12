# sep-T2a: salt widgets

## Observation: `UPixel` has no klimt port; `ElementImage` throws on an `X`
- **Context**: porting `ElementImage.java:70` (`ug.apply(new UTranslate(i, j)).draw(new UPixel())`).
- **Finding**: `src/core/klimt/shape/` has no `UPixel.ts`; `driver-svg-stubs.ts#DriverPixelSvg` is a throwing stub not registered in `u-graphic-svg.ts`. `ElementImage.ts#drawU` throws `unported: UPixel` at the first `X` (precedent: T1c's `Splitter.purgeAllTag` throw). The jar draws each pixel as `<rect x y width="0.5" height="0.5" … style="stroke:<ink>;stroke-width:0.5;"/>` (`DriverPixelSvg.java`), columns outer, rows inner.
- **Impact**: `kaziri-68-fofu065` (and any `<<…>>` salt image) cannot render until klimt ports `UPixel` + `DriverPixelSvg`. The pixel rect's `fill` is NOT set by `DriverPixelSvg` — it inherits `SvgGraphics`' last fill: `fill="#000"` in `kaziri-68-fofu065` (after other shapes), `fill="black"` in `tests/unit/salt/element/fixtures/widget-image.jar.svg` (first shape drawn).
- **Confidence**: High

## Observation: `HColors.changeBack` is unported; the port idiom is `new Back(ug.getParam().getColor())`
- **Context**: `ElementDroplist.java:107`, `ElementRadioCheckbox.java:106, 115`.
- **Finding**: `HColors.ts` lists `changeBack` as not ported. `ExtremityTriangle.ts:80` (ExtremityTriangle.java:77) and four other extremities already spell it `new Back(ug.getParam().getColor())`; the salt widgets follow that idiom. The port's `UParam#getColor` is never null, so `HColors.java:150-151`'s `none().bg()` branch has no counterpart.
- **Impact**: if klimt ever ports `changeBack`, eight call sites (5 extremities + 3 salt) collapse onto it.
- **Confidence**: High

## Observation: an open droplist draws at every z-index
- **Context**: `ElementDroplist.java:110-116` sits outside the `zIndex == 0` guard.
- **Finding**: the jar SVG for `^Smart Mode^m2^` carries the open-list rect + text twice (z 0 and z 1 passes of `PSystemSalt#getTextBlock`). Mirrored.
- **Confidence**: High

## Observation: `ElementTextField` draws in the ink it is handed
- **Context**: `ElementTextField.java:57-68` applies no colour; the black comes from `ElementPyramid.java:102` (`ug.apply(getBlack())`).
- **Finding**: drawn bare, its lines come out `stroke:none`. `tests/unit/salt/element/widget-test-support.ts#drawAt` applies black first, as the pyramid does.
- **Confidence**: High
