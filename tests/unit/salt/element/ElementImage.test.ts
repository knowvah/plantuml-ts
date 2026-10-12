/**
 * `ElementImage` (ElementImage.java:46-74) against the 1.2026.8beta1 jar.
 * The image is `.X. / ... / X.X / .X.`:
 *
 * - `fixtures/widget-image.puml` — `<<…>> | after`: `after` starts at
 *   x 11 = cell 6 + width + 2 (ElementPyramid.java:139), so the width is 3
 *   (`img.get(0).length()`, java:55).
 * - `fixtures/widget-image-below.puml` — the image above `below`: the
 *   second row's baseline is 21.333 = 6 + (height + 2) + 9.333 (text-two's
 *   first-row baseline 15.333 - 6), so the height is 4 (`img.size()`).
 * - Both draw one 0.5 px `<rect>` per `X`, columns outer, rows inner
 *   (java:66-71): (6,8), (7,6), (7,9), (8,8).
 *
 * `UPixel` (klimt/shape/UPixel.java) has no port and the SVG driver for it
 * is a throwing stub (`driver-svg-stubs.ts#DriverPixelSvg`), so drawing an
 * `X` throws until klimt ports it (stop 10).
 */
import { describe, expect, it } from 'vitest';
import { ElementImage } from '../../../../src/diagrams/salt/element/ElementImage.js';
import { stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';

const IMAGE = ['.X.', '...', 'X.X', '.X.'];

describe('ElementImage#getPreferredDimension (java:54-56)', () => {
  it('is the first row length by the row count: 3 x 4', () => {
    const dim = new ElementImage(IMAGE).getPreferredDimension(stringBounder, 7, 8);
    expect(dim.getWidth()).toBe(3);
    expect(dim.getHeight()).toBe(4);
  });

  it('pins the jar pixel origins the dimension implies (widget-image, widget-image-below)', () => {
    const pixels = ['6,8', '7,6', '7,9', '8,8'];
    for (const name of ['widget-image', 'widget-image-below']) {
      const rects = jarElements(name).filter((e) => e.startsWith('<rect'));
      expect(rects.map((r) => /x="(\d+)" y="(\d+)"/.exec(r)!.slice(1).join(','))).toEqual(pixels);
    }
  });

  it('throws on an empty image, as img.get(0) does (java:55)', () => {
    expect(() => new ElementImage([]).getPreferredDimension(stringBounder, 0, 0)).toThrow(/IndexOutOfBoundsException/);
  });
});

describe('ElementImage#drawU (java:58-73)', () => {
  it('draws nothing for an image without X', () => {
    expect(drawAt(new ElementImage(['..', '..']), 0)).toEqual([]);
  });

  it('throws at the first X: UPixel is not ported (stop 10)', () => {
    expect(() => drawAt(new ElementImage(IMAGE), 0)).toThrow(/unported: UPixel/);
  });

  it('draws nothing at z-index 1 (java:59-60)', () => {
    expect(drawAt(new ElementImage(IMAGE), 1)).toEqual([]);
  });

  it('reads charAt(i) of every row, as the jar does: a short later row throws (java:68)', () => {
    expect(() => drawAt(new ElementImage(['..', '.']), 0)).toThrow(/StringIndexOutOfBoundsException/);
  });
});
