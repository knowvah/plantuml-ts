/**
 * `SpriteImage` — a sprite backed by a raster `PortableImage`: what
 * `SpriteImage.fromInternal` returns for a jar-internal `/sprites/**.png`
 * (SpriteImage.java:113-115; the probe itself is `internal-sprite-store.ts`).
 *
 * Upstream wraps the image once, `new UImage(new PixelImage(img,
 * TYPE_BILINEAR))` (java:65-67), and `asTextBlock` draws it:
 * - `ColorMapper.MONOCHROME` -> `img.monochrome()` (java:86-87);
 * - no colour -> the pixels as decoded (java:88-89);
 * - else `img.muteColor(usedColor.toColor(colorMapper))` (java:90-91),
 *   `usedColor = forcedColor == null ? fontColor : forcedColor` (java:76);
 * each then `.scale(scale)`, measured at `img.getWidth() * scale` where
 * `UImage#getWidth()` is the PIXEL width minus one (UImage.java:87-93).
 *
 * Adaptations:
 * - `PortableImage` is {@link ArgbImage} (`getRGB` ints); `PixelImage`'s pixel
 *   operations live in `sprite-raster.ts` beside the bilinear resample and
 *   PNG encoder they feed.
 * - The drawn `UImage` is this port's pre-encoded shape (`shape/UImage.ts`):
 *   built at the resampled raster's pixel size, the `width`/`height`
 *   `SvgGraphics#svgImage` writes (SvgGraphics.java:970-983), as
 *   `GraphicStrings#uimage` builds its picture.
 * - `HColor` arguments are `HColorSimple`: `HColor#toColor` throws for every
 *   other kind (HColor.java:65-67).
 * - The `TeaVM.isTeaVM()` branch (java:78-84) is dropped: this port is never
 *   TeaVM, so upstream's JVM branches are the ones taken.
 * - `ug.getColorMapper()` is optional on this port's `UGraphic`; absent reads
 *   as `ColorMapper.IDENTITY` (`LimitFinder.java:227-229`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java
 */
import { ColorMapper } from '../color/ColorMapper.js';
import type { HColorSimple } from '../color/HColorSimple.js';
import type { StringBounder } from '../font/StringBounder.js';
import { XDimension2D } from '../geom/XDimension2D.js';
import type { TextBlock } from '../shape/TextBlock.js';
import { UImage } from '../shape/UImage.js';
import type { UGraphic } from '../UGraphic.js';
import type { Sprite } from './Sprite.js';
import { argbImageToPngDataUri, monochrome, muteColor, type ArgbImage } from './sprite-raster.js';

/** `UImage#getWidth()`/`getHeight()`: `image.getWidth() - 1` (UImage.java:87-93). */
const UIMAGE_SIZE_OFFSET = 1;

/** `XColor#getRGB()` (XColor.java:64-66) as a Java `int`. */
function xColorRgb(color: { r: number; g: number; b: number; a: number }): number {
  return ((color.a & 0xff) << 24) | ((color.r & 0xff) << 16) | ((color.g & 0xff) << 8) | (color.b & 0xff);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:61 */
export class SpriteImage implements Sprite {
  /** `UImage#getWidth()` of the wrapped image — what `calculateDimension` scales. */
  readonly width: number;
  readonly height: number;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:65-67 */
  constructor(private readonly img: ArgbImage) {
    this.width = img.width - UIMAGE_SIZE_OFFSET;
    this.height = img.height - UIMAGE_SIZE_OFFSET;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/sprite/SpriteImage.java:69-98 */
  asTextBlock(
    fontColor: HColorSimple | undefined,
    forcedColor: HColorSimple | undefined,
    scale: number,
    _backColor: HColorSimple | undefined,
  ): TextBlock {
    return {
      drawU: (ug: UGraphic): void => {
        const colorMapper = ug.getColorMapper?.() ?? ColorMapper.IDENTITY;
        const usedColor = forcedColor ?? fontColor;
        ug.draw(this.drawn(colorMapper, usedColor, scale));
      },
      calculateDimension: (_stringBounder: StringBounder): XDimension2D =>
        new XDimension2D(this.width * scale, this.height * scale),
    };
  }

  /** The `UImage` of java:86-91's three branches. */
  private drawn(colorMapper: ColorMapper, usedColor: HColorSimple | undefined, scale: number): UImage {
    let pixels: ArgbImage;
    if (colorMapper === ColorMapper.MONOCHROME) pixels = monochrome(this.img);
    else if (usedColor === undefined) pixels = this.img;
    else pixels = muteColor(this.img, xColorRgb(usedColor.toColor(colorMapper)));
    const png = argbImageToPngDataUri(pixels, scale);
    return UImage.build(png.width, png.height, png.dataUri, { rasterWidth: png.width, rasterHeight: png.height });
  }
}
