/**
 * The jar's sprite/img raster scale: `PortableImageAwt#scale`
 * (`klimt/awt/PortableImageAwt.java:113-127`) builds a
 * `round(w * scale) x round(h * scale)` `TYPE_INT_ARGB` destination and runs
 * `java.awt.image.AffineTransformOp` with `TYPE_BILINEAR` over the
 * non-premultiplied ARGB source. `PixelImage#getImage` (`net/atmp/
 * PixelImage.java:69-78`) calls it only when the cumulative scale is not 1.
 *
 * The filter itself is native JDK code (Java2D's medialib affine), which is
 * not ported here: its source is GPL-licensed, and this library is MIT. The
 * arithmetic below is a CLEAN-ROOM description of its observable behaviour,
 * derived from black-box measurement of JDK 21.0.1 (`tests/fixtures/
 * unwind-U4/bilinear/Bl.java` generates the reference rasters,
 * `cases.txt` holds them). Per destination pixel `(x, y)`, with source
 * pixel-edge coordinates `u = (x + 0.5) / s`, `v = (y + 0.5) / s`:
 *
 * - `u >= w` or `v >= h`: never written -- stays transparent black, the
 *   destination's initial value.
 * - otherwise, with pixel-centre coordinates `u - 0.5`, `v - 0.5` held in
 *   16.16 fixed point: when both lie inside `[0, w-1] x [0, h-1]` (the
 *   "interior"), channels interpolate vertically then horizontally, each
 *   stage rounding half up; outside it (the "edge" band) coordinates clamp
 *   to the image and the full bilinear sum is floored.
 *
 * Measured agreement: every edge-band and unwritten channel, and all but
 * 24 of 45476 interior channel values (each off by one, all at an exact
 * half-pixel vertical tie in a downscale) -- the residual is unexplained
 * and recorded by the test, not tuned away.
 */
import type { RgbaBitmap } from './sprite-raster.js';

const FIXED_ONE = 65536;
const FIXED_SHIFT = 16;
const FIXED_MASK = 0xffff;
const FIXED_HALF = 32768;
const CHANNELS = 4;
const PIXEL_CENTRE = 0.5;

/** Java `Math.round(double)` for the non-negative sizes used here. */
function javaRound(value: number): number {
  return Math.floor(value + PIXEL_CENTRE);
}

/** Destination size `PortableImageAwt.java:117-118` computes. */
export function scaledRasterSize(width: number, height: number, scale: number): { width: number; height: number } {
  return { width: javaRound(width * scale), height: javaRound(height * scale) };
}

interface Geometry {
  readonly src: RgbaBitmap;
  readonly scale: number;
  /** `floor(65536 / s)`: the per-pixel fixed-point step. */
  readonly step: number;
  /** First destination column whose centre maps at or right of source column 0. */
  readonly firstInteriorX: number;
}

function centre(index: number, scale: number): number {
  return (index + PIXEL_CENTRE) / scale - PIXEL_CENTRE;
}

function firstNonNegative(scale: number): number {
  let index = 0;
  while (centre(index, scale) < 0) index++;
  return index;
}

function channel(src: RgbaBitmap, x: number, y: number, c: number): number {
  return src.rgba[(y * src.width + x) * CHANNELS + c]!;
}

function clampFixed(value: number, size: number): number {
  return Math.min(Math.max(value, 0), (size - 1) * FIXED_ONE);
}

/** The four source samples around a fixed-point coordinate, clamped. */
interface Corners {
  readonly topLeft: number;
  readonly topRight: number;
  readonly bottomLeft: number;
  readonly bottomRight: number;
}

function corners(src: RgbaBitmap, fixedX: number, fixedY: number, c: number): Corners {
  const x0 = fixedX >> FIXED_SHIFT;
  const y0 = fixedY >> FIXED_SHIFT;
  const x1 = Math.min(x0 + 1, src.width - 1);
  const y1 = Math.min(y0 + 1, src.height - 1);
  return {
    topLeft: channel(src, x0, y0, c),
    topRight: channel(src, x1, y0, c),
    bottomLeft: channel(src, x0, y1, c),
    bottomRight: channel(src, x1, y1, c),
  };
}

/** Interior: vertical then horizontal, each stage `+0.5` then floor. */
function interiorChannel(q: Corners, fx: number, fy: number): number {
  const left = q.topLeft + (((q.bottomLeft - q.topLeft) * fy + FIXED_HALF) >> FIXED_SHIFT);
  const right = q.topRight + (((q.bottomRight - q.topRight) * fy + FIXED_HALF) >> FIXED_SHIFT);
  return left + (((right - left) * fx + FIXED_HALF) >> FIXED_SHIFT);
}

/** Edge band: the exact fixed-point bilinear sum, floored. */
function edgeChannel(q: Corners, fx: number, fy: number): number {
  const top = q.topLeft * (FIXED_ONE - fx) + q.topRight * fx;
  const bottom = q.bottomLeft * (FIXED_ONE - fx) + q.bottomRight * fx;
  return Math.floor((top * (FIXED_ONE - fy) + bottom * fy) / (FIXED_ONE * FIXED_ONE));
}

function isInterior(g: Geometry, x: number, y: number): boolean {
  const u = centre(x, g.scale);
  const v = centre(y, g.scale);
  return u >= 0 && v >= 0 && u <= g.src.width - 1 && v <= g.src.height - 1;
}

function fixedX(g: Geometry, x: number, interior: boolean): number {
  if (interior) {
    const start = Math.floor(centre(g.firstInteriorX, g.scale) * FIXED_ONE);
    return start + (x - g.firstInteriorX) * g.step;
  }
  return clampFixed(Math.floor(centre(0, g.scale) * FIXED_ONE) + x * g.step, g.src.width);
}

function writePixel(g: Geometry, out: Uint8Array, offset: number, x: number, y: number): void {
  const interior = isInterior(g, x, y);
  const fixed = fixedX(g, x, interior);
  const fixedY = clampFixed(Math.floor(centre(y, g.scale) * FIXED_ONE), g.src.height);
  const interpolate = interior ? interiorChannel : edgeChannel;
  for (let c = 0; c < CHANNELS; c++) {
    out[offset + c] = interpolate(corners(g.src, fixed, fixedY, c), fixed & FIXED_MASK, fixedY & FIXED_MASK);
  }
}

/**
 * `AffineTransformOp(scale(s, s), TYPE_BILINEAR)` over an RGBA raster, as
 * the jar runs it for a sprite or `<img>` drawn at a scale other than 1.
 * Returns `src` itself when `scale === 1` (`PortableImageAwt.java:114-115`).
 */
export function scaleBilinear(src: RgbaBitmap, scale: number): RgbaBitmap {
  if (scale === 1) return src;
  const size = scaledRasterSize(src.width, src.height, scale);
  const out = new Uint8Array(size.width * size.height * CHANNELS);
  const g: Geometry = { src, scale, step: Math.floor(FIXED_ONE / scale), firstInteriorX: firstNonNegative(scale) };
  for (let y = 0; y < size.height; y++) {
    if ((y + PIXEL_CENTRE) / scale >= src.height) continue;
    for (let x = 0; x < size.width; x++) {
      if ((x + PIXEL_CENTRE) / scale >= src.width) continue;
      writePixel(g, out, (y * size.width + x) * CHANNELS, x, y);
    }
  }
  return { rgba: out, width: size.width, height: size.height };
}
