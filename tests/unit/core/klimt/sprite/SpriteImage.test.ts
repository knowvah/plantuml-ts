/**
 * `SpriteImage` (SpriteImage.java:61-98): an internal PNG sprite drawn as a
 * `UImage` of its pixels, muted to the font/forced colour (PixelImage.java:97-114),
 * grey-scaled under `ColorMapper.MONOCHROME` (PixelImage.java:81-95), and
 * measured at `UImage#getWidth()` = pixel width - 1 (UImage.java:87-93).
 */
import { describe, expect, it } from 'vitest';
import { readPng } from '../../../../../src/core/internal-sprite-store.js';
import { ColorMapper } from '../../../../../src/core/klimt/color/ColorMapper.js';
import { HColorSimple } from '../../../../../src/core/klimt/color/HColorSimple.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { UImage } from '../../../../../src/core/klimt/shape/UImage.js';
import { SpriteImage } from '../../../../../src/core/klimt/sprite/SpriteImage.js';
import type { ArgbImage } from '../../../../../src/core/klimt/sprite/sprite-raster.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';

/** `CommandCreoleSprite.java:82` at the GraphicStrings font size 12. */
const SCALE_12 = 12 / 13;
const DATA_URI_PREFIX = 'data:image/png;base64,';

/** Java `int` ARGB, as `PortableImage#getRGB` answers it. */
function argb(a: number, r: number, g: number, b: number): number {
  return (a << 24) | (r << 16) | (g << 8) | b | 0;
}

function image(width: number, height: number, pixels: readonly number[]): ArgbImage {
  return { width, height, argb: Int32Array.from(pixels) };
}

function solid16(): ArgbImage {
  return image(16, 16, new Array<number>(256).fill(argb(255, 0, 0, 0)));
}

function recorder(mapper?: ColorMapper): { ug: UGraphic; drawn: UShape[] } {
  const drawn: UShape[] = [];
  const ug: UGraphic = {
    apply: () => ug,
    draw: (shape) => drawn.push(shape),
    getParam: () => {
      throw new Error('unused');
    },
    getTranslate: () => UTranslate.none(),
    getStringBounder: () => {
      throw new Error('unused');
    },
    ...(mapper === undefined ? {} : { getColorMapper: () => mapper }),
  };
  return { ug, drawn };
}

function drawnImage(drawn: readonly UShape[]): UImage {
  expect(drawn).toHaveLength(1);
  const shape = drawn[0];
  if (!(shape instanceof UImage)) throw new Error('not a UImage');
  return shape;
}

function pixelsOf(shape: UImage): number[] {
  const href = shape.getHref();
  expect(href.startsWith(DATA_URI_PREFIX)).toBe(true);
  const decoded = readPng(Uint8Array.from(Buffer.from(href.slice(DATA_URI_PREFIX.length), 'base64')));
  if (decoded === undefined) throw new Error('undecodable href');
  return Array.from(decoded.argb);
}

const NO_BOUNDER = {} as StringBounder;
const RED = HColorSimple.create({ r: 255, g: 0, b: 0, a: 255 });
const BLUE = HColorSimple.create({ r: 0, g: 0, b: 255, a: 255 });

/** Column-major darkest opaque pixel = 0x102030 (PixelImage.java:133-152). */
const DARK = argb(255, 0x10, 0x20, 0x30);
const DARK_HALF = argb(0x80, 0x10, 0x20, 0x30);
const WHITE = argb(255, 255, 255, 255);
const DARK_CLEAR = argb(0, 0x10, 0x20, 0x30);
/** Row-major 2x2: (0,0) DARK, (1,0) DARK_HALF, (0,1) WHITE, (1,1) DARK_CLEAR. */
const MIXED = image(2, 2, [DARK, DARK_HALF, WHITE, DARK_CLEAR]);

describe('SpriteImage dimensions (SpriteImage.java:94-97, UImage.java:87-93)', () => {
  it('exposes UImage#getWidth()/getHeight(): the pixel size minus one', () => {
    const sprite = new SpriteImage(solid16());
    expect([sprite.width, sprite.height]).toEqual([15, 15]);
  });

  it('measures (width - 1) * scale', () => {
    const dim = new SpriteImage(solid16()).asTextBlock(undefined, undefined, SCALE_12, undefined);
    expect(dim.calculateDimension(NO_BOUNDER).getWidth()).toBeCloseTo((15 * 12) / 13, 12);
    expect(dim.calculateDimension(NO_BOUNDER).getHeight()).toBeCloseTo((15 * 12) / 13, 12);
  });
});

describe('SpriteImage drawU (SpriteImage.java:74-92)', () => {
  it('draws the raw pixels at scale 1 when there is no colour (java:88-89)', () => {
    const { ug, drawn } = recorder();
    new SpriteImage(MIXED).asTextBlock(undefined, undefined, 1, undefined).drawU(ug);
    const shape = drawnImage(drawn);
    expect([shape.getWidth(), shape.getHeight()]).toEqual([2, 2]);
    expect([shape.getRasterWidth(), shape.getRasterHeight()]).toEqual([2, 2]);
    expect(pixelsOf(shape)).toEqual([DARK, DARK_HALF, WHITE, DARK_CLEAR]);
  });

  it('draws the PortableImage scaled to round(16 * 12/13) = 15 (PixelImage.java:70-78)', () => {
    const { ug, drawn } = recorder();
    new SpriteImage(solid16()).asTextBlock(undefined, undefined, SCALE_12, undefined).drawU(ug);
    const shape = drawnImage(drawn);
    expect([shape.getWidth(), shape.getHeight(), shape.getRasterWidth(), shape.getRasterHeight()]).toEqual([
      15, 15, 15, 15,
    ]);
  });

  it('mutes the darkest opaque rgb to the font colour, adding alpha as Java ints (java:90-91)', () => {
    const { ug, drawn } = recorder();
    new SpriteImage(MIXED).asTextBlock(RED, undefined, 1, undefined).drawU(ug);
    // 0xFFFF0000 + 0xFF000000 overflows to 0xFEFF0000; + 0x80000000 -> 0x7FFF0000.
    expect(pixelsOf(drawnImage(drawn))).toEqual([argb(0xfe, 255, 0, 0), argb(0x7f, 255, 0, 0), WHITE, DARK_CLEAR]);
  });

  it('prefers forcedColor over fontColor (java:76)', () => {
    const { ug, drawn } = recorder();
    new SpriteImage(MIXED).asTextBlock(RED, BLUE, 1, undefined).drawU(ug);
    expect(pixelsOf(drawnImage(drawn))[0]).toBe(argb(0xfe, 0, 0, 255));
  });

  it('passes the colour through the drawing mapper (HColorSimple#toColor)', () => {
    const { ug, drawn } = recorder(ColorMapper.DARK_MODE);
    new SpriteImage(MIXED).asTextBlock(RED, undefined, 1, undefined).drawU(ug);
    expect(pixelsOf(drawnImage(drawn))[0]).toBe(argb(0xfe, 255, 0, 0));
  });

  it('leaves an image with no opaque pixel unchanged (getDarkerRgb stays -1)', () => {
    const clear = image(1, 2, [argb(0x40, 0, 0, 0), argb(0, 0, 0, 0)]);
    const { ug, drawn } = recorder();
    new SpriteImage(clear).asTextBlock(RED, undefined, 1, undefined).drawU(ug);
    expect(pixelsOf(drawnImage(drawn))).toEqual([argb(0x40, 0, 0, 0), 0]);
  });

  it('keeps the first darkest pixel in column-major order on a grey tie (java:134-135)', () => {
    // (1,0) rgb 0x050000 and (0,1) rgb 0x000300 are both grey 1; the x-outer loop reaches (0,1) first.
    const tie = image(2, 2, [WHITE, argb(255, 5, 0, 0), argb(255, 0, 3, 0), WHITE]);
    const { ug, drawn } = recorder();
    new SpriteImage(tie).asTextBlock(RED, undefined, 1, undefined).drawU(ug);
    expect(pixelsOf(drawnImage(drawn))).toEqual([WHITE, argb(255, 5, 0, 0), argb(0xfe, 255, 0, 0), WHITE]);
  });

  it('grey-scales under ColorMapper.MONOCHROME with upstream operator precedence (PixelImage.java:81-95)', () => {
    const { ug, drawn } = recorder(ColorMapper.MONOCHROME);
    new SpriteImage(MIXED).asTextBlock(RED, undefined, 1, undefined).drawU(ug);
    // grey(0x102030) = 29: ((29 + 29) << (8 + 29)) << 16 = 0x07400000, + 0xFF000000 = 0x06400000.
    // grey(white) = 255: (510 << (263 & 31)) << 16 = 0xFF000000, + 0xFF000000 = 0xFE000000.
    expect(pixelsOf(drawnImage(drawn))).toEqual([
      0x06400000,
      (0x07400000 + 0x80000000) | 0,
      0xfe000000 | 0,
      0x07400000,
    ]);
  });
});
