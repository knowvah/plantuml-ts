/**
 * driver-svg-stubs.ts — D3′ throwing stubs for the SVG driver family
 * members this task defers.
 *
 * Upstream: `UGraphicSvg.java#register()` wires five more drivers beyond
 * the seven this task ports: `DriverImagePng`, `DriverPixelSvg` (since
 * ported — `driver-pixel-svg.ts`, registered for `UPixel`),
 * `DriverImageSvgSvg` (since ported — `driver-image-svg-svg.ts`, registered
 * for `UImageSvg`), `DriverTextAsPathSvg` (the `textAsPath` branch),
 * and `DriverCenteredCharacterSvg` (the non-TeaVM `UCenteredCharacter`
 * branch — `DriverCenteredCharacterSvgDeterministic`, the TeaVM branch,
 * is N/A; this port is not a TeaVM transpile target). Each throws a
 * message naming D3′, per this task's mission brief scope decision.
 *
 * NONE of the remaining stubs is wired into `u-graphic-svg.ts`'s
 * driver-registry map: their corresponding shape classes (`UImage`,
 * `UCenteredCharacter`) do not exist anywhere in this port (not in any
 * batch-1/2/3 write-set — `src/core/klimt/shape/` has no such files), so
 * there is no `ShapeConstructor` to register them against in the first
 * place. `UImageTikz` (upstream: `ignoreShape(UImageTikz.class)`, a
 * silent no-op registration) is the same story — not ported, and its
 * upstream behavior is a no-op anyway, so nothing is lost by omitting it
 * here. These stub classes exist standalone, for structural completeness
 * and to give a citable D3′ throw once any of the three shape classes
 * eventually lands.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import type { UShape } from '../../UShape.js';

/** Upstream: `DriverImagePng` (PNG raster embedding via `PortableImage`). */
export class DriverImagePng implements UDriver<UShape> {
  draw(_shape: UShape, _param: UParam): void {
    throw new Error('deferred per D3-prime: PNG image embedding (DriverImagePng) not yet ported');
  }
}

/** Upstream: `DriverTextAsPathSvg` (text rendered as vector outlines
 * instead of `<text>`, the `textAsPath` option branch). */
export class DriverTextAsPathSvg implements UDriver<UShape> {
  draw(_shape: UShape, _param: UParam): void {
    throw new Error('deferred per D3-prime: text-as-path rendering (DriverTextAsPathSvg) not yet ported');
  }
}

/** Upstream: `DriverCenteredCharacterSvg` (single centered glyph, used
 * by cardinality/arrow-end markers). */
export class DriverCenteredCharacterSvg implements UDriver<UShape> {
  draw(_shape: UShape, _param: UParam): void {
    throw new Error('deferred per D3-prime: centered-character drawing (DriverCenteredCharacterSvg) not yet ported');
  }
}
