/**
 * The `PortableImage` pieces `AtomImg.createQrcode` reaches (AtomImg.java:95,
 * :98): `PortableImageFactory.build(w, h, TYPE_INT_RGB)` and the
 * `UImage(PixelImage(im, TYPE_NEAREST_NEIGHBOR)).scale(scale).getImage(1)`
 * chain, which ends in `PortableImageAwt#scale`.
 *
 * `PortableImage` is the port's `RgbaBitmap` (`klimt/sprite/sprite-raster.ts`):
 * pixel size plus row-major RGBA bytes, what `getRGB` reads (a `TYPE_INT_RGB`
 * pixel reads opaque). `PixelImage`/`UImage`'s own bookkeeping reduces, on this
 * path, to one call: `PixelImage.withScale` multiplies `1 * scale * 1`, and
 * `getImage` hands back the source unchanged at scale 1 (PixelImage.java:72-73),
 * else `imageScale1.scale(scale, NEAREST)` (java:75-78).
 *
 * `PortableImageAwt#scale` draws through `AffineTransformOp.filter`
 * (java:117-127), which the JDK runs in native medialib:
 * `awt_ImagingLib.c#transformBI` -> `mlib_ImageAffine(dst, src, mtx,
 * MLIB_NEAREST, MLIB_EDGE_SRC_EXTEND)`. For a nearest-neighbour filter that is
 * `mlib_AffineEdges` (`mlib_ImageScanPoly.c:40-560`), which picks the
 * destination pixels to write and their 16.16 source start, then
 * `mlib_ImageAffine_*_nn`, which copies `src[Y >> 16][X >> 16]` stepping `X`
 * by `dX` (`mlib_ImageAffine_NN.c`); no edge pass runs for MLIB_NEAREST
 * (`mlib_ImageAffine.c:243`). Unwritten pixels stay 0 — transparent in the
 * `TYPE_INT_ARGB` destination. The matrix is always `at.scale(s, s)`
 * (java:124-125), so `b = c = tx = ty = 0` and the general polygon scan
 * reduces to the rectangle below; every `+ 0` / `* 0` term of the C is
 * dropped, which cannot change a double.
 *
 * Source: OpenJDK 21 (`src/java.desktop/share/native/libmlib_image/`). Verified
 * against the JDK itself: a probe running the 1.2026.8beta1 jar's classes on a
 * 10x10 grid of distinct pixels, scales 0.05..4.00 by 0.01, matched cell for
 * cell (`tests/unit/core/klimt/creole/atom/AtomImgPortableImage.test.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/PortableImageAwt.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/PortableImageFactory.java
 * @see ~/git/plantuml/src/main/java/net/atmp/PixelImage.java
 */
import type { RgbaBitmap } from '../../sprite/sprite-raster.js';

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/PortableImage.java:18 */
export const TYPE_INT_RGB = 1;

/** Bytes per RGBA pixel. */
const RGBA = 4;

/** Alpha of every `TYPE_INT_RGB` pixel as `getRGB` reads it. */
const OPAQUE = 255;

/** `MLIB_SHIFT` (`mlib_ImageAffine.h:198`): 16.16 fixed point. */
const MLIB_SHIFT = 16;

/**
 * `new BufferedImage(w, h, type)` rejects an empty size from
 * `DirectColorModel#createCompatibleWritableRaster`; the jar prints this text
 * on its crash page (`<qrcode:x{scale=0.01}>`, probe).
 */
function checkSize(width: number, height: number): void {
  if (!(width > 0 && height > 0))
    throw new Error(`Width (${String(width)}) and height (${String(height)}) cannot be <= 0`);
}

/**
 * `PortableImageFactory.build(width, height, TYPE_INT_RGB)`
 * (PortableImageFactory.java:9-17 -> `new PortableImageAwt(w, h, type)`,
 * PortableImageAwt.java:29-31): a fresh `TYPE_INT_RGB` raster is all zeros,
 * which `getRGB` reads as opaque black.
 */
export function buildPortableImage(width: number, height: number, _imageType: typeof TYPE_INT_RGB): RgbaBitmap {
  checkSize(width, height);
  const rgba = new Uint8Array(width * height * RGBA);
  for (let i = RGBA - 1; i < rgba.length; i += RGBA) rgba[i] = OPAQUE;
  return { rgba, width, height };
}

/** One destination row as `mlib_AffineEdges` leaves it: the written span and its 16.16 source start. */
interface EdgeRow {
  readonly xLeft: number;
  readonly xRight: number;
  readonly xs: number;
  readonly ys: number;
}

/** The scale-only quantities `mlib_AffineEdges` derives from `mtx = [s, 0, 0, 0, s, 0]`. */
interface AffineScale {
  readonly s: number;
  readonly srcWidth: number;
  readonly srcHeight: number;
  /** `wClip * div`, `hClip * div` with `div = a * d - b * c` (mlib_ImageScanPoly.c:98, :380-383). */
  readonly dwCl: number;
  readonly dhCl: number;
  /** `div = 1.0 / div` (mlib_ImageScanPoly.c:403). */
  readonly invDiv: number;
}

/**
 * The clip test of mlib_ImageScanPoly.c:425 / :438 for `div > 0`. Its lower
 * bounds (`dxs < dxCl`, `dys < dyCl`, both 0) cannot fire here: every
 * coordinate tested is `(n + 0.5) * s` with `s > 0` — only the upper bounds
 * are kept. The same holds for the `< xCl`/`< yCl` clamps below.
 */
function outside(m: AffineScale, dx: number, dy: number): boolean {
  return dx >= m.dwCl || dy >= m.dhCl;
}

/** `xs`/`ys` = `(mlib_s32)(d * div * (1 << shift))`, clamped below `limit` (mlib_ImageScanPoly.c:449-465). */
function sourceStart(d: number, m: AffineScale, limit: number): number {
  const v = Math.trunc(d * m.invDiv * (1 << MLIB_SHIFT));
  return v >> MLIB_SHIFT >= limit ? (limit << MLIB_SHIFT) - 1 : v;
}

/**
 * One row of mlib_ImageScanPoly.c:412-476: start from the polygon's span,
 * pull each end in by one pixel when its centre maps outside the source, and
 * drop the row when it still does.
 */
function edgeRow(m: AffineScale, i: number, span: number): EdgeRow {
  let xLeft = 0;
  let xRight = span;
  const ii = i + 0.5;
  const xr = xRight + 0.5;
  let dxs = (xLeft + 0.5) * m.s;
  const dys = ii * m.s;
  if (outside(m, dxs, dys)) {
    dxs += m.s;
    xLeft++;
    if (outside(m, dxs, dys)) xRight = -1;
  }
  let dxe = xr * m.s;
  if (outside(m, dxe, dys)) {
    dxe -= m.s;
    xRight--;
    if (outside(m, dxe, dys)) xRight = -1;
  }
  return { xLeft, xRight, xs: sourceStart(dxs, m, m.srcWidth), ys: sourceStart(dys, m, m.srcHeight) };
}

/**
 * `mlib_AffineEdges` for `mtx = [s, 0, 0, 0, s, 0]`: the source corners map
 * to `-0.5 .. srcSize * s - 0.5` (`tx -= 0.5`, java-side translate 0), so
 * every row starts at column 0 and ends at `(int)(srcWidth * s - 0.5)`
 * (`SAT32`, a C truncation), rows `0 .. (int)(srcHeight * s - 0.5)`, both
 * clipped to the destination (mlib_ImageScanPoly.c:226-377). `sdx` (> 0)
 * drops by one whenever a row's last sample would pass the source's right
 * edge (:469-476; the `x_e < xCl` side needs a negative step), and the
 * NN loop reads its final value (`dX = sdx`, after the loop).
 */
function affineEdges(m: AffineScale, dstWidth: number, dstHeight: number): { rows: EdgeRow[]; dX: number } {
  const span = Math.min(Math.trunc(m.srcWidth * m.s - 0.5), dstWidth - 1);
  const bot = Math.min(Math.trunc(m.srcHeight * m.s - 0.5), dstHeight - 1);
  let dX = Math.trunc(m.s * m.invDiv * (1 << MLIB_SHIFT));
  const rows: EdgeRow[] = [];
  for (let i = 0; i <= bot; i++) {
    const row = edgeRow(m, i, span);
    if (row.xRight >= row.xLeft) {
      const xEnd = ((row.xRight - row.xLeft) * dX + row.xs) >> MLIB_SHIFT;
      if (xEnd >= m.srcWidth) dX -= 1;
    }
    rows.push(row);
  }
  return { rows, dX };
}

/** `mlib_ImageAffine_*_nn`: copy `src[Y >> 16][X >> 16]` across each written span (`dY = 0`). */
function copyNearest(src: RgbaBitmap, dst: RgbaBitmap, rows: readonly EdgeRow[], dX: number): void {
  rows.forEach((row, i) => {
    const sy = row.ys >> MLIB_SHIFT;
    let x = row.xs;
    for (let dx = row.xLeft; dx <= row.xRight; dx++) {
      const from = (sy * src.width + (x >> MLIB_SHIFT)) * RGBA;
      dst.rgba.set(src.rgba.subarray(from, from + RGBA), (i * dst.width + dx) * RGBA);
      x += dX;
    }
  });
}

/**
 * `PortableImageAwt#scale(scaleFactor, TYPE_NEAREST_NEIGHBOR)`: `this` at 1
 * (java:114-115), else a `TYPE_INT_ARGB` image of `Math.round(size * factor)`
 * (java:117-123) filled by the nearest-neighbour `AffineTransformOp`
 * (java:124-127; see the module doc).
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/PortableImageAwt.java:113-128
 */
export function scalePortableImage(image: RgbaBitmap, scaleFactor: number): RgbaBitmap {
  if (scaleFactor === 1) return image;
  const width = Math.round(image.width * scaleFactor);
  const height = Math.round(image.height * scaleFactor);
  checkSize(width, height);
  const div = scaleFactor * scaleFactor;
  const m: AffineScale = {
    s: scaleFactor,
    srcWidth: image.width,
    srcHeight: image.height,
    dwCl: image.width * div,
    dhCl: image.height * div,
    invDiv: 1 / div,
  };
  const scaled: RgbaBitmap = { rgba: new Uint8Array(width * height * RGBA), width, height };
  const { rows, dX } = affineEdges(m, width, height);
  copyNearest(image, scaled, rows, dX);
  return scaled;
}
