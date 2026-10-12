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
 * - `test-results/dot-cache/salt/kaziri-68-fofu065` — the 12 x 11 `folder`
 *   image at cell (6, 94), drawn after the button text `fill="#000"`: 35
 *   pixels, each `fill="#000"` (the writer's previous fill — `DriverPixelSvg`
 *   sets none, DriverPixelSvg.java:46-56).
 */
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { Back } from '../../../../src/core/klimt/Back.js';
import { HColors } from '../../../../src/core/klimt/color/HColors.js';
import { Fore } from '../../../../src/core/klimt/Fore.js';
import { XDimension2D } from '../../../../src/core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../../src/core/klimt/shape/URectangle.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { ElementImage } from '../../../../src/diagrams/salt/element/ElementImage.js';
import { stringBounder } from '../salt-test-support.js';
import { drawAt, jarElements } from './widget-test-support.js';
import { drawTo, jarRunFrom, jarShapes, SALT_CACHE } from './tree-svg-support.js';

const IMAGE = ['.X.', '...', 'X.X', '.X.'];

const KAZIRI = `${SALT_CACHE}/kaziri-68-fofu065`;
/** The `<<folder … >>` rows of kaziri's `in.puml`, between the two markers. */
function kaziriFolder(): string[] {
  const lines = readFileSync(`${KAZIRI}/in.puml`, 'utf8').split('\n');
  const from = lines.indexOf('<<folder');
  const to = lines.findIndex((l, i) => i > from && l.startsWith('>>'));
  return lines.slice(from + 1, to);
}
/** kaziri's first image cell origin: its first pixel (col 1, row 1) is at (7, 95). */
const KAZIRI_CELL = new UTranslate(6, 94);

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

  it('draws one UPixel per X, columns outer, rows inner: the jar rects attribute for attribute (widget-image)', () => {
    const jarPixels = jarElements('widget-image').filter((e) => e.startsWith('<rect'));
    expect(jarPixels).toHaveLength(4);
    expect(drawAt(new ElementImage(IMAGE), 0)).toEqual(jarPixels);
  });

  it("draws kaziri-68-fofu065's folder as the jar does: 35 pixels in the jar's order, fill inherited", () => {
    const folder = new ElementImage(kaziriFolder());
    const ours = [
      ...drawTo((ug) => {
        // The jar's preceding shape is the button text, `fill="#000"`; this
        // leaves the writer's fill at `#000` the same way.
        ug.apply(new Back(HColors.BLACK.asPaint())).draw(URectangle.build(1, 1));
        const black = ug.apply(new Fore(HColors.BLACK.asPaint()));
        folder.drawU(black.apply(KAZIRI_CELL), 0, new XDimension2D(12, 11));
      }).matchAll(/<rect\b[^>]*height="0\.5"[^>]*\/>/g),
    ].map((m) => m[0]);
    expect(ours).toHaveLength(35);
    expect(ours[0]).toBe(
      '<rect x="7" y="95" width="0.5" height="0.5" fill="#000" style="stroke:#000;stroke-width:0.5;"/>',
    );
    expect(ours).toEqual(jarRunFrom(jarShapes(`${KAZIRI}/in.svg`), ours));
  });

  it('draws nothing at z-index 1 (java:59-60)', () => {
    expect(drawAt(new ElementImage(IMAGE), 1)).toEqual([]);
  });

  it('reads charAt(i) of every row, as the jar does: a short later row throws (java:68)', () => {
    expect(() => drawAt(new ElementImage(['..', '.']), 0)).toThrow(/StringIndexOutOfBoundsException/);
  });
});
