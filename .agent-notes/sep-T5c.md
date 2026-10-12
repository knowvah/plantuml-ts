# sep-T5c: `skinparam mode dark` element colours through a klimt ColorMapper seam

## Observation: the dark partner is lost at five HColor-to-Paint sites, three outside klimt/color and klimt/drawing
- **Context**: instrumented render of `tests/fixtures/salt/skinparam-mode-dark.puml` with the port-only `HColorSimple#asPaint` patched in-process to `toSvg(ColorMapper.DARK_MODE)` (`plans/salt-engine-port/measurements/T5c/partner-survival-experiment.mts`, no source edit).
- **Finding**: the probe goes from 7 diffs to 0. The `asPaint` calls reached are `ElementButton.ts:53` (Back `getColorEE`, Fore `getBlack`), `ElementPyramid.ts:119` (Fore `getBlack`, the grid lines), `FontConfigurationBridge.ts:52` (`blackBlueTrue`'s `BLACK.withDark(WHITE)` text colour), `PSystemSalt.ts:226` (`HColors.BLACK`, no partner) and `activity-circle-style.ts:81` (theme build, not drawn by salt). Upstream maps at draw time: `DriverRectangleSvg.java:81-115`, `DriverLineSvg.java:76`, `DriverTextSvg.java:177-178` call `toSvg(mapper)` with the `UGraphic`'s mapper (`AbstractUGraphic.java:145`).
- **Impact**: a ColorMapper on `UGraphic` alone moves nothing: the salt element files convert to `Paint` before `Fore`/`Back` (`.asPaint()`, 13 files), and text colour is flattened in `FontConfigurationBridge#solidPaint`. A faithful seam needs `Fore`/`Back`/`UParam` (or the drivers) and `UText`'s `FontConfiguration` to carry the `HColor` to a mapper.
- **Confidence**: High

## Observation: the port's UGraphic and its apply plumbing are not under klimt/drawing
- **Context**: write-set `src/core/klimt/drawing/UGraphic*.ts` ("as the Java names them").
- **Finding**: `UGraphic.java`/`AbstractCommonUGraphic.java` live in `klimt/drawing/`; the port's `UGraphic.ts` and `AbstractCommonUGraphic.ts` live in `src/core/klimt/`. `drawing/UGraphic*.ts` matches only `UGraphicDelegator.ts`, `UGraphicNo.ts`, `UGraphicStencil.ts`. 35 `implements UGraphic` sites exist under `src/` and `tests/`, so a required `getColorMapper()` on the interface touches all of them.
- **Impact**: a write-set naming the Java path does not cover the port's file for `UGraphic.java`'s accessor or `apply(UChange)`.
- **Confidence**: High

## Observation: activity under-maps its background; class maps it once
- **Context**: audit of the whole-fragment hex mapper (`fragment-color-mapper.ts`) for the salt double-map hazard; jar probes `plans/salt-engine-port/measurements/T5c/audit/t5c-{class,activity}-{reversecolor,monochrome-reverse}-bg.puml`.
- **Finding**: class: 0 diffs on both probes; `renderer-document.ts:80-82` maps the background once and the rect is painted outside the mapped body (`documentBackgroundRect`, `assemble-svg.ts:166-170`). Activity: no double-map, but the background is never mapped: `renderer.ts:438` maps only the body, `renderer.ts:441` passes `theme.colors.background` raw; `svg/@background` and the first `<rect>` fill are `#010101`/`#336699` where the jar has `#FEFEFE`/`#A3A3A3` (2 diffs each).
- **Impact**: activity with `reversecolor`/`monochrome` and a non-default `backgroundColor` diverges; no corpus row was checked for it.
- **Confidence**: High (probes); Low (corpus reach)
