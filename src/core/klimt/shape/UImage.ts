import type { UShape } from '../UShape.js';

interface UImageFields {
  readonly width: number;
  readonly height: number;
  readonly href: string;
  /** Native raster pixel dims, when a real raster backs this image (see
   *  class doc comment). `undefined` for a rasterless `UImage` (e.g. the
   *  KaTeX/latex path). */
  readonly rasterWidth?: number;
  readonly rasterHeight?: number;
}

/**
 * UImage — width/height plus a pre-encoded `data:image/...` href, the shape
 * `DriverImageSvg.ts` (`drawing/svg/driver-image-svg.ts`) serializes to an
 * SVG `<image>` element (SI5b+E2r decisions.md D7 — sprite/img inline-atom
 * rendering, mission T7).
 *
 * NOT a port of upstream's `klimt.shape.UImage` (which wraps a
 * `PortableImage` + `AffineTransformType` and resamples lazily via
 * `getImage()` — see `sprite-raster.ts`'s own doc comment on why byte-exact
 * AWT bilinear resampling is out of scope for this port). This is a
 * minimal, scoped shape carrying exactly what T7's atom renderer already
 * computed by the time it reaches the draw call: the SAME scaled
 * width/height `creole-atoms.ts#measureInlineAtom` used to size the label
 * during layout (D9 — "drawing and measuring agree"), plus a data-URI
 * href (verbatim for an `<img>` atom per D7; T5's tinted-PNG output for a
 * `<$sprite>` atom). See `src/diagrams/description/render-atoms.ts` for
 * the resolver that builds these three values.
 *
 * SI15 T1 (ADR-1): the two-notion split now mirrors upstream's
 * declared-vs-raster distinction — `width`/`height` stay the DECLARED
 * (scaled placement) dims consumed by `Sea`/layout/final SVG emission
 * unchanged; the optional `rasterWidth`/`rasterHeight` pair carries the
 * native raster pixel count (one pixel per sprite grid cell, or the `<img>`
 * data URI's IHDR dims), consumed ONLY by `Footprint.MyUGraphic.drawImage`
 * for the ellipse-fit corner points. `undefined` when no real raster backs
 * the image (the latex/KaTeX path stays on the declared-dims-only,
 * pre-SI15 behaviour — see `DIVERGENCES.md:260-285`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/shape/UImage.java:87-92
 */
export class UImage implements UShape {
  private constructor(private readonly f: UImageFields) {}

  static build(
    width: number,
    height: number,
    href: string,
    rasterDims?: { readonly rasterWidth: number; readonly rasterHeight: number },
  ): UImage {
    return new UImage(
      rasterDims === undefined
        ? { width, height, href }
        : { width, height, href, rasterWidth: rasterDims.rasterWidth, rasterHeight: rasterDims.rasterHeight },
    );
  }

  getWidth(): number {
    return this.f.width;
  }

  getHeight(): number {
    return this.f.height;
  }

  getHref(): string {
    return this.f.href;
  }

  getRasterWidth(): number | undefined {
    return this.f.rasterWidth;
  }

  getRasterHeight(): number | undefined {
    return this.f.rasterHeight;
  }

  toString(): string {
    return `UImage[${this.f.width}x${this.f.height}]`;
  }
}
