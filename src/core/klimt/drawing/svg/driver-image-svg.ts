/**
 * driver-image-svg.ts — the `UImage` → SVG `<image>` driver (SI5b+E2r T7,
 * D7). See `shape/UImage.ts`'s doc comment for why this is a scoped
 * sibling of upstream's `DriverImagePng`/`DriverImageSvgSvg` (both still
 * D3′-deferred throwing stubs, `driver-svg-stubs.ts`) rather than a port of
 * either — this driver only ever receives a pre-built href/width/height,
 * never a `PortableImage`/`UImageSvg` to encode itself.
 */

import type { UDriver } from '../../AbstractCommonUGraphic.js';
import type { UParam } from '../../UParam.js';
import type { UImage } from '../../shape/UImage.js';
import type { SvgGraphics } from './svg-graphics.js';

/** `UImage` → SVG `<image>`, via `SvgGraphics#svgImageDataUri`
 *  (`svg-graphics-elements.ts`). */
export class DriverImageSvg implements UDriver<UImage> {
  constructor(private readonly svg: SvgGraphics) {}

  draw(image: UImage, param: UParam): void {
    const x = param.getTranslate().getDx();
    const y = param.getTranslate().getDy();
    // SI15 T3 (ADR-2, si5b decisions.md D9 Amendment 1): the jar MEASURES
    // raw scaled dims but EMITS `Math.round(natural * scale)` on the
    // `<image>` element -- jar-verified for BOTH atom origins that carry a
    // real raster: a monochrome `<$sprite>` (class-usecase-inline-sprite,
    // 3.2308x2.1538 -> 3x2) and an `<img:...>` data URI
    // (class-usecase-inline-img, 6.5x3.9 -> 7x4, straddling a .5 boundary
    // to confirm round-half-up, not floor). `rasterWidth`/`rasterHeight`
    // (ADR-1) is the "a real raster backs this image" signal for BOTH atom
    // kinds, so one gate covers both -- no per-origin flag needed. Rounding
    // applies ONLY to the emitted width/height, never x/y and never the
    // `UImage`'s own declared dims: layout/cursor-advance must keep the raw
    // value (D9 Amendment 1). A rasterless `UImage` (e.g. the latex/KaTeX
    // path) has no raster dims, so it emits its declared dims unrounded,
    // byte-identical to pre-change output.
    const raster = image.getRasterWidth() !== undefined && image.getRasterHeight() !== undefined;
    const width = raster ? Math.round(image.getWidth()) : image.getWidth();
    const height = raster ? Math.round(image.getHeight()) : image.getHeight();
    this.svg.svgImageDataUri(x, y, width, height, image.getHref());
  }
}
