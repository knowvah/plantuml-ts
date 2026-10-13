/**
 * The `PortableImage` pieces `AtomImg.createQrcode` reaches:
 * `PortableImageFactory.build(w, h, TYPE_INT_RGB)` (PortableImageAwt.java:29-31)
 * and `PortableImageAwt#scale` (java:113-128) — an `AffineTransformOp`
 * nearest-neighbour scale into a `TYPE_INT_ARGB` image of
 * `Math.round(size * scale)`, which the JDK runs through medialib's
 * `mlib_AffineEdges` (`mlib_ImageScanPoly.c`) + `mlib_ImageAffine_*_nn`.
 *
 * The expected grids are a JDK probe (1.2026.8beta1 jar classes, OpenJDK 21):
 * a 10x10 `TYPE_INT_RGB` source whose pixel (x, y) is unique, scaled through
 * `new UImage(new PixelImage(im, TYPE_NEAREST_NEIGHBOR)).scale(s).getImage(1)`;
 * each cell is the source `xy` it copied, `..` an unwritten (transparent)
 * pixel. The same probe over every scale 0.05..4.00 in 0.01 steps (396
 * scales) matched this port cell for cell.
 */
import { describe, expect, it } from 'vitest';
import {
  buildPortableImage,
  scalePortableImage,
  TYPE_INT_RGB,
} from '../../../../../../src/core/klimt/creole/atom/AtomImgPortableImage.js';
import type { RgbaBitmap } from '../../../../../../src/core/klimt/sprite/sprite-raster.js';

const SIZE = 10;

/** Pixel (x, y) = rgb(x + 1, y + 1, 0), opaque — every source pixel distinct. */
function gridSource(): RgbaBitmap {
  const rgba = new Uint8Array(SIZE * SIZE * 4);
  for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) rgba.set([x + 1, y + 1, 0, 255], (y * SIZE + x) * 4);
  return { rgba, width: SIZE, height: SIZE };
}

/** The probe's cell notation: the source `xy` a pixel copied, `..` if unwritten. */
function cells(image: RgbaBitmap): string {
  const out: string[] = [];
  for (let i = 0; i < image.width * image.height; i++) {
    const [r, g, , a] = image.rgba.subarray(i * 4, i * 4 + 4);
    out.push(a === 0 ? '..' : `${String((r ?? 0) - 1)}${String((g ?? 0) - 1)}`);
  }
  return `${out.join(',')},`;
}

/** JDK probe rows: scale -> `width height cells`. */
const JDK_GRID: Readonly<Record<string, string>> = {
  '0.05': '1 1 99,',
  '0.16': '2 2 33,93,39,99,',
  '0.35': '4 4 11,41,71,..,14,44,74,..,17,47,77,..,..,..,..,..,',
  '0.45': '5 5 11,31,51,71,91,13,33,53,73,93,15,35,55,75,95,17,37,57,77,97,19,39,59,79,99,',
};

describe('PortableImageFactory.build(w, h, TYPE_INT_RGB)', () => {
  it('is all zero pixels, which a TYPE_INT_RGB image reads as opaque black', () => {
    const image = buildPortableImage(3, 2, TYPE_INT_RGB);
    expect([image.width, image.height]).toEqual([3, 2]);
    expect([...image.rgba]).toEqual(Array.from({ length: 6 }, () => [0, 0, 0, 255]).flat());
  });

  it('rejects an empty size as BufferedImage does', () => {
    expect(() => buildPortableImage(0, 4, TYPE_INT_RGB)).toThrow('Width (0) and height (4) cannot be <= 0');
  });
});

describe('PortableImageAwt#scale — nearest neighbour, as the JDK writes it', () => {
  it('returns the image itself at scale 1 (java:114-115)', () => {
    const source = gridSource();
    expect(scalePortableImage(source, 1)).toBe(source);
  });

  for (const [scale, expected] of Object.entries(JDK_GRID)) {
    it(`matches the JDK probe at scale ${scale}`, () => {
      const out = scalePortableImage(gridSource(), Number(scale));
      expect(`${String(out.width)} ${String(out.height)} ${cells(out)}`).toBe(expected);
    });
  }

  it('at 1.05 leaves the 11th row and column unwritten', () => {
    const out = scalePortableImage(gridSource(), 1.05);
    const rows = cells(out).slice(0, -1).split(',');
    expect(rows.slice(0, 11)).toEqual(['00', '10', '20', '30', '40', '50', '60', '70', '80', '90', '..']);
    expect(rows.slice(110)).toEqual(Array.from({ length: 11 }, () => '..'));
  });

  it('at 1.85 repeats source columns 0-2 and 4-8, not 3 (JDK probe)', () => {
    const out = scalePortableImage(gridSource(), 1.85);
    expect(cells(out).split(',').slice(0, 19)).toEqual([
      '00',
      '00',
      '10',
      '10',
      '20',
      '20',
      '30',
      '40',
      '40',
      '50',
      '50',
      '60',
      '60',
      '70',
      '70',
      '80',
      '80',
      '90',
      '..',
    ]);
  });

  it('rejects a scale whose rounded size is zero (DirectColorModel, java:123)', () => {
    expect(() => scalePortableImage(gridSource(), 0.04)).toThrow('Width (0) and height (0) cannot be <= 0');
  });
});
