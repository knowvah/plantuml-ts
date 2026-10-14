/**
 * Monochrome-sprite tint + PNG rasterization (T5 of SI5b/decisions.md D7).
 *
 * Ports `SpriteMonochrome#toUImage`'s gradient/alpha math exactly.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteMonochrome.java:180-208
 *
 * ```java
 * final HColorGradient gradient = HColors.gradient(backcolor, color, '\0');
 * double maxCoef = 0;
 * for (col, line) maxCoef = Math.max(maxCoef, 1.0 * gray[line][col] / (grayLevel - 1));
 * for (col, line) {
 *   final int grayValue = gray[line][col];
 *   final double coef = 1.0 * grayValue / (grayLevel - 1);
 *   final int alpha;
 *   if (coef > maxCoef / 4) alpha = 255;
 *   else alpha = (int) (255 * (coef * 4 / maxCoef));
 *   final XColor c = gradient.getColor(colorMapper, coef, alpha);
 *   im.setRGB(col, line, c.getRGB());
 * }
 * ```
 *
 * `HColorGradient#getColor` (klimt/color/HColorGradient.java:69-90) linearly
 * interpolates each RGB channel between `color1` (=`backcolor`) and `color2`
 * (=`color`) by `coef`, truncating (not rounding) via Java's `(int)` cast:
 * `channel = c1 + (int)(coef * (c2 - c1))`.
 *
 * Net effect: gray level 0 always renders fully transparent (`coef=0` at
 * every pixel forces the `else` branch, and if EVERY pixel is gray 0 then
 * `maxCoef` is also 0, so alpha collapses to 0 everywhere -- an all-blank
 * sprite is fully transparent, not a division-by-zero crash). Gray levels
 * within 1/4 of the sprite's own darkest-used level render fully opaque;
 * everything below that threshold ramps alpha linearly. This threshold
 * (not a plain `coef`-to-alpha linear map) is why a light -- outline-only --
 * sprite still renders crisp instead of washed out.
 *
 * T4 (concurrent write-set: `Sprite.ts`, `SpriteGrayLevel.ts`,
 * `SpriteMonochrome.ts`) landed in this same batch while this file was
 * being written. Per the mission brief this file does NOT import those
 * modules -- it depends only on the minimal structural `SpriteLike` shape
 * below. SEAM NOTE FOR THE ORCHESTRATOR: T4's concrete
 * `SpriteMonochrome` (src/core/klimt/sprite/SpriteMonochrome.ts) does
 * NOT structurally satisfy `SpriteLike` as-is -- it exposes `grayLevel`
 * (singular) not `grayLevels`, and `getGray(x, y)` not `pixelAt(x, y)`.
 * A one-line adapter is needed at the call site, e.g.:
 * `{ width: s.width, height: s.height, grayLevels: s.grayLevel, pixelAt: (x, y) => s.getGray(x, y) }`.
 */
import { parseColorString, type RgbColor } from '../../tim/builtin/color-utils.js';
import { encodePng, toBase64DataUri, RGBA_BYTES_PER_PIXEL } from './png-encoder.js';
import { scaleBilinear } from './sprite-bilinear.js';
import type { SpriteMonochrome } from './SpriteMonochrome.js';
import type { SpriteColor4096 } from './SpriteColor4096.js';

/**
 * Minimal structural stand-in for T4's `SpriteMonochrome` (in-flight,
 * concurrent write-set -- see file header). `grayLevels` is the sprite's
 * total gray-level count (2, 4, 8, or 16 upstream); `pixelAt` returns the
 * gray value (0..grayLevels-1) at (x, y), matching `SpriteMonochrome#getGray`.
 */
export interface SpriteLike {
  readonly width: number;
  readonly height: number;
  readonly grayLevels: number;
  pixelAt(x: number, y: number): number;
}

/**
 * Seam (a) reconciliation (SI5b+E2r batch-2 decision-journal row, T7):
 * adapts T4's concrete `SpriteMonochrome` (`grayLevel`/`getGray`) to this
 * file's `SpriteLike` (`grayLevels`/`pixelAt`) -- the exact one-line
 * adapter this file's own header note anticipated once T4 landed. Every
 * sprite `sprite-commands.ts#buildAndRegister` ever registers is a
 * `SpriteMonochrome` (the only concrete `Sprite` this port builds), so
 * this is the sole call site render code needs before calling
 * {@link spriteToPngDataUri}.
 */
export function spriteMonochromeAsLike(sprite: SpriteMonochrome): SpriteLike {
  return {
    width: sprite.width,
    height: sprite.height,
    grayLevels: sprite.grayLevel,
    pixelAt: (x: number, y: number) => sprite.getGray(x, y),
  };
}

/** `HColors.WHITE` -- upstream's `backcolor` default (light-mode only; see file header). */
const DEFAULT_BACK_COLOR: RgbColor = { r: 255, g: 255, b: 255, a: 255 };
/** `HColors.BLACK` -- upstream's `color` (fontColor) default (light-mode only). */
const DEFAULT_FONT_COLOR: RgbColor = { r: 0, g: 0, b: 0, a: 255 };

const FULLY_OPAQUE_ALPHA = 255;
const ALPHA_RAMP_THRESHOLD_DIVISOR = 4;

export interface RgbaBitmap {
  readonly rgba: Uint8Array;
  readonly width: number;
  readonly height: number;
}

function resolveColor(colorString: string | undefined, fallback: RgbColor): RgbColor {
  if (colorString === undefined) return fallback;
  const parsed = parseColorString(colorString);
  if (parsed === undefined) throw new Error(`spriteToRgba: unknown color '${colorString}'`);
  return parsed;
}

function computeMaxCoef(sprite: SpriteLike, maxLevel: number): number {
  let maxCoef = 0;
  for (let row = 0; row < sprite.height; row++) {
    for (let col = 0; col < sprite.width; col++) {
      const coef = sprite.pixelAt(col, row) / maxLevel;
      if (coef > maxCoef) maxCoef = coef;
    }
  }
  return maxCoef;
}

/** `alpha = (coef > maxCoef/4) ? 255 : (int)(255 * coef * 4 / maxCoef)`, `maxCoef===0` -> 0. */
function computeAlpha(coef: number, maxCoef: number): number {
  if (maxCoef === 0) return 0;
  if (coef > maxCoef / ALPHA_RAMP_THRESHOLD_DIVISOR) return FULLY_OPAQUE_ALPHA;
  return Math.trunc(FULLY_OPAQUE_ALPHA * ((coef * ALPHA_RAMP_THRESHOLD_DIVISOR) / maxCoef));
}

/**
 * One channel of `HColorGradient#getColor`.
 *
 * Upstream truncates the DELTA TERM and then adds, not the sum:
 *
 *     final int diffGreen = c2.getGreen() - c1.getGreen();
 *     final int vGreen = (int) (coeff * diffGreen);
 *     final int green = c1.getGreen() + vGreen;
 *
 * (`HColorGradient.java:77,81,85`). Java's `(int)` truncates toward ZERO, so
 * for a DESCENDING channel the two orders disagree by one: with c1=255,
 * c2=34, coef=2/3 the delta term is -147.33 -> -147 -> 108, where truncating
 * the sum gives 107.67 -> 107. Jar-verified on `birocu-87-xubi808`, whose
 * sprite is exactly that case.
 */
function gradientChannel(c1: number, c2: number, coef: number): number {
  return c1 + Math.trunc(coef * (c2 - c1));
}

/**
 * Tints a monochrome sprite to an RGBA raster: `fontColor` (`#rrggbb`,
 * default black) is the gradient's dark end, `backColor` (`#rrggbb`,
 * default white) is the light end, and the per-pixel alpha ramp described
 * in the file header makes low gray values transparent.
 * @see SpriteMonochrome#toUImage (file header, exact math quoted)
 */
export function spriteToRgba(sprite: SpriteLike, fontColor?: string, backColor?: string): RgbaBitmap {
  const color2 = resolveColor(fontColor, DEFAULT_FONT_COLOR);
  const color1 = resolveColor(backColor, DEFAULT_BACK_COLOR);
  const { width, height, grayLevels } = sprite;
  const maxLevel = grayLevels - 1;
  const maxCoef = computeMaxCoef(sprite, maxLevel);
  const rgba = new Uint8Array(width * height * RGBA_BYTES_PER_PIXEL);

  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const coef = sprite.pixelAt(col, row) / maxLevel;
      const alpha = computeAlpha(coef, maxCoef);
      const offset = (row * width + col) * RGBA_BYTES_PER_PIXEL;
      rgba[offset] = gradientChannel(color1.r, color2.r, coef);
      rgba[offset + 1] = gradientChannel(color1.g, color2.g, coef);
      rgba[offset + 2] = gradientChannel(color1.b, color2.b, coef);
      rgba[offset + 3] = alpha;
    }
  }
  return { rgba, width, height };
}

export interface SpritePngResult {
  readonly dataUri: string;
  /** The sprite's own grid size, before `scale`. The encoded PNG is
   *  `scaledRasterSize(natural, scale)` (`sprite-bilinear.ts`). */
  readonly naturalWidth: number;
  readonly naturalHeight: number;
  /**
   * Declared (layout) size, `natural * scale` unrounded -- upstream's
   * `calculateDimension` (`SpriteMonochrome.java:224`, `AtomImg.java:239`).
   * The drawn `<image>` carries the raster's own rounded size instead
   * (`SvgGraphics.java:973-974`, `image.getWidth()`).
   */
  readonly width: number;
  readonly height: number;
}

const DEFAULT_SCALE = 1;

/**
 * Tints and rasterizes `sprite` to a `data:image/png;base64,...` URI.
 *
 * Scale: `UImage#scale` (`klimt/shape/UImage.java:79-81`) multiplies the
 * `PixelImage`'s cumulative scale, and `PixelImage#getImage`
 * (`net/atmp/PixelImage.java:69-78`) resamples once, through
 * `PortableImageAwt#scale` (`TYPE_BILINEAR`, `SpriteMonochrome.java:207`).
 * {@link scaleBilinear} reproduces that resample (its doc records the
 * measured residual), so the PNG's IHDR size is the jar's, and so are its
 * bytes for equal pixels (`png-encoder.ts`, unwind2-S6).
 */
export function spriteToPngDataUri(
  sprite: SpriteLike,
  fontColor?: string,
  backColor?: string,
  scale: number = DEFAULT_SCALE,
): SpritePngResult {
  const natural = spriteToRgba(sprite, fontColor, backColor);
  const { width, height } = natural;
  const raster = scaleBilinear(natural, scale);
  const png = encodePng(raster.rgba, raster.width, raster.height);
  return {
    dataUri: toBase64DataUri(png),
    naturalWidth: width,
    naturalHeight: height,
    width: width * scale,
    height: height * scale,
  };
}

/**
 * cdd-T26 residual round: rasterizes a {@link SpriteColor4096} (a
 * `/color` sprite, one already-decoded 0xRRGGBB packed int per pixel) to
 * RGBA — the sibling of {@link spriteToRgba} for a per-pixel-colour
 * sprite rather than a tinted gray-level one. `SpriteColor#toUImage`
 * (java :100-121) only takes the gray-gradient branch for a cell whose
 * `color[line][col] == -1` (a {@link SpriteColor4096.setGray} cell, never
 * produced by {@link buildSpriteColor4096} today) — every OTHER cell is
 * `im.setRGB(col, line, localColor)` directly, fully opaque (`TYPE_INT_RGB`
 * has no alpha channel upstream). The `-1` branch is NOT ported (no
 * current caller mixes gray cells into a colour sprite); such a cell
 * renders opaque black here instead, a named, narrow gap.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteColor.java:100-121
 */
export function spriteColor4096ToRgba(sprite: SpriteColor4096): RgbaBitmap {
  const { width, height } = sprite;
  const rgba = new Uint8Array(width * height * RGBA_BYTES_PER_PIXEL);
  for (let row = 0; row < height; row++) {
    for (let col = 0; col < width; col++) {
      const packed = sprite.getColor(col, row);
      const rgb = packed === -1 ? 0 : packed;
      const offset = (row * width + col) * RGBA_BYTES_PER_PIXEL;
      rgba[offset] = (rgb >> 16) & 0xff;
      rgba[offset + 1] = (rgb >> 8) & 0xff;
      rgba[offset + 2] = rgb & 0xff;
      rgba[offset + 3] = FULLY_OPAQUE_ALPHA;
    }
  }
  return { rgba, width, height };
}

/**
 * cdd-T26 residual round: encodes a {@link SpriteColor4096} to a
 * `data:image/png;base64,...` URI — the `/color`-sprite sibling of
 * {@link spriteToPngDataUri}, same scale contract (the raster is resampled
 * by {@link scaleBilinear}; `width`/`height` are the declared size).
 */
export function spriteColor4096ToPngDataUri(sprite: SpriteColor4096, scale: number = DEFAULT_SCALE): SpritePngResult {
  const natural = spriteColor4096ToRgba(sprite);
  const { width, height } = natural;
  const raster = scaleBilinear(natural, scale);
  const png = encodePng(raster.rgba, raster.width, raster.height);
  return {
    dataUri: toBase64DataUri(png),
    naturalWidth: width,
    naturalHeight: height,
    width: width * scale,
    height: height * scale,
  };
}

// ---------------------------------------------------------------------------
// `net.atmp.PixelImage` over a `PortableImage` (ufp-T3a, `SpriteImage`)
// ---------------------------------------------------------------------------

/**
 * A decoded `PortableImage` as `getRGB` answers it: one Java `int` ARGB per
 * pixel (alpha in the top byte, signed), row-major, `argb[y * width + x]`.
 * `PixelImage#deepCopy` (`net/atmp/PixelImage.java:174-182`) copies into a
 * `TYPE_INT_ARGB` image, so every `setRGB` below stores its int verbatim.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/awt/PortableImage.java
 */
export interface ArgbImage {
  readonly width: number;
  readonly height: number;
  readonly argb: Int32Array;
}

/** `mask_a__ = 0xFF000000` as the Java `int` it is (PixelImage.java:154). */
const MASK_A = 0xff000000 | 0;
/** `mask_rgb = 0x00FFFFFF` (PixelImage.java:155). */
const MASK_RGB = 0x00ffffff;
/** `getDarkerRgb`'s "none yet" sentinel (PixelImage.java:134). */
const NO_DARKER_RGB = -1;
/** YIQ weights and divisor of `ColorUtils#getGrayScaleInternal` (ColorUtils.java:48-58). */
const GRAY_R = 299;
const GRAY_G = 587;
const GRAY_B = 114;
const GRAY_DIVISOR = 1000;
const BYTE = 0xff;

/** `ColorUtils.getGrayScaleFromRGB(rgb)` (ColorUtils.java:60-65). */
function grayScaleFromRgb(rgb: number): number {
  const red = (rgb >> 16) & BYTE;
  const green = (rgb >> 8) & BYTE;
  const blue = rgb & BYTE;
  return Math.trunc((red * GRAY_R + green * GRAY_G + blue * GRAY_B) / GRAY_DIVISOR);
}

/** `getRGB(x, y)` of a row-major {@link ArgbImage}. */
function rgbAt(image: ArgbImage, x: number, y: number): number {
  return image.argb[y * image.width + x]!;
}

/** `PixelImage#deepCopy` (PixelImage.java:174-182). */
function deepCopy(image: ArgbImage): ArgbImage {
  return { width: image.width, height: image.height, argb: Int32Array.from(image.argb) };
}

/**
 * `PixelImage#getDarkerRgb` (PixelImage.java:133-152): the rgb of the darkest
 * FULLY opaque pixel, visiting x outer, y inner — on a grey tie the first one
 * visited wins (strict `<`). `-1` when no pixel is opaque.
 */
export function getDarkerRgb(image: ArgbImage): number {
  let darkerRgb = NO_DARKER_RGB;
  for (let i = 0; i < image.width; i++)
    for (let j = 0; j < image.height; j++) {
      const color = rgbAt(image, i, j);
      if ((color & MASK_A) !== MASK_A) continue;
      const rgb = color & MASK_RGB;
      if (darkerRgb === NO_DARKER_RGB || grayScaleFromRgb(rgb) < grayScaleFromRgb(darkerRgb)) darkerRgb = rgb;
    }
  return darkerRgb;
}

/**
 * `PixelImage#muteColor` (PixelImage.java:97-113): every non-transparent pixel
 * whose rgb is {@link getDarkerRgb}'s becomes `newColor.getRGB() + a` — Java
 * `int` addition, so an opaque `newColor` over an opaque pixel overflows to
 * alpha `0xFE` (`(0xFF + A) & 0xFF` in general). `newColorRgb` is
 * `XColor#getRGB()` (XColor.java:64-66).
 */
export function muteColor(image: ArgbImage, newColorRgb: number): ArgbImage {
  const darkerRgb = getDarkerRgb(image);
  const copy = deepCopy(image);
  for (let i = 0; i < image.width; i++)
    for (let j = 0; j < image.height; j++) {
      const color = rgbAt(image, i, j);
      const a = color & MASK_A;
      if (a !== 0 && (color & MASK_RGB) === darkerRgb) copy.argb[j * image.width + i] = (newColorRgb + a) | 0;
    }
  return copy;
}

/**
 * `PixelImage#monochrome` (PixelImage.java:81-94), operator precedence
 * included: `grayScale + grayScale << 8 + grayScale << 16` parses as
 * `((g + g) << (8 + g)) << 16` in Java, and JS `<<` masks its count to five
 * bits exactly as Java's `int` shift does.
 */
export function monochrome(image: ArgbImage): ArgbImage {
  const copy = deepCopy(image);
  for (let i = 0; i < image.width; i++)
    for (let j = 0; j < image.height; j++) {
      const color = rgbAt(image, i, j);
      const grayScale = grayScaleFromRgb(color & MASK_RGB);
      const gray = ((grayScale + grayScale) << (8 + grayScale)) << 16;
      copy.argb[j * image.width + i] = (gray + (color & MASK_A)) | 0;
    }
  return copy;
}

/** The non-premultiplied RGBA bytes `scaleBilinear`/`encodePng` read. */
function argbToRgba(image: ArgbImage): RgbaBitmap {
  const rgba = new Uint8Array(image.argb.length * RGBA_BYTES_PER_PIXEL);
  image.argb.forEach((color, index) => {
    const offset = index * RGBA_BYTES_PER_PIXEL;
    rgba[offset] = (color >> 16) & BYTE;
    rgba[offset + 1] = (color >> 8) & BYTE;
    rgba[offset + 2] = color & BYTE;
    rgba[offset + 3] = (color >>> 24) & BYTE;
  });
  return { rgba, width: image.width, height: image.height };
}

/**
 * `PixelImage#getImage` at a cumulative `scale` (PixelImage.java:69-78,
 * `PortableImageAwt#scale` TYPE_BILINEAR, reproduced by {@link scaleBilinear})
 * encoded as `SvgGraphics#svgImage` embeds it (SvgGraphics.java:970-983): the
 * resampled raster's own pixel size and its PNG data URI.
 */
export function argbImageToPngDataUri(
  image: ArgbImage,
  scale: number,
): { readonly dataUri: string; readonly width: number; readonly height: number } {
  const raster = scaleBilinear(argbToRgba(image), scale);
  return {
    dataUri: toBase64DataUri(encodePng(raster.rgba, raster.width, raster.height)),
    width: raster.width,
    height: raster.height,
  };
}
