/**
 * `UPixel` (klimt/shape/UPixel.java) through `DriverPixelSvg`
 * (klimt/drawing/svg/DriverPixelSvg.java:44-58), registered on `UGraphicSvg`
 * as `UGraphicSvg.java:122` does, and through `LimitFinder`'s `UPixel`
 * branch (LimitFinder.java:146-147).
 *
 * Jar values:
 * - `tests/unit/salt/element/fixtures/widget-image.jar.svg` — a pixel drawn
 *   before any other shape: `<rect x="6" y="8" width="0.5" height="0.5"
 *   fill="black" style="stroke:#000;stroke-width:0.5;"/>` (`SvgGraphics`'
 *   initial `fill = "black"`, SvgGraphics.java:110).
 * - `test-results/dot-cache/salt/kaziri-68-fofu065/in.svg` — a pixel drawn
 *   after a `fill="#000"` shape: `<rect x="7" y="95" width="0.5"
 *   height="0.5" fill="#000" style="stroke:#000;stroke-width:0.5;"/>`.
 */
import { describe, expect, it } from 'vitest';
import { Back } from '../../../../../src/core/klimt/Back.js';
import { LimitFinder } from '../../../../../src/core/klimt/drawing/LimitFinder.js';
import { basicSvgOption } from '../../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder as DriverStringBounder } from '../../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { UGraphicSvg } from '../../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { Fore } from '../../../../../src/core/klimt/Fore.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../../../../src/core/klimt/geom/XDimension2D.js';
import { UPixel } from '../../../../../src/core/klimt/shape/UPixel.js';
import { URectangle } from '../../../../../src/core/klimt/shape/URectangle.js';
import { UStroke } from '../../../../../src/core/klimt/UStroke.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';

const driverStringBounder: DriverStringBounder = { calculateDimension: () => ({ width: 0 }) };
const limitStringBounder: StringBounder = { calculateDimension: () => new XDimension2D(0, 0) };

/** `HColors.BLACK` (`#000000`), the ink `ElementImage.java:62` applies. */
const BLACK = '#000000';

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', driverStringBounder);
}

function rects(svg: string): string[] {
  return [...svg.matchAll(/<rect\b[^>]*\/>/g)].map((m) => m[0]);
}

describe('DriverPixelSvg (DriverPixelSvg.java:44-58)', () => {
  it('draws a 0.5 x 0.5 rect in the fill the writer starts with (widget-image.jar.svg)', () => {
    const root = newGraphic();
    root.apply(new Fore(BLACK)).apply(new UTranslate(6, 8)).draw(new UPixel());
    expect(rects(root.getSvgString())).toEqual([
      '<rect x="6" y="8" width="0.5" height="0.5" fill="black" style="stroke:#000;stroke-width:0.5;"/>',
    ]);
  });

  it("keeps the writer's previous fill: it sets none of its own (kaziri-68-fofu065)", () => {
    const root = newGraphic();
    root.apply(new Back(BLACK)).draw(URectangle.build(1, 1));
    root.apply(new Fore(BLACK)).apply(new UTranslate(7, 95)).draw(new UPixel());
    expect(rects(root.getSvgString())[1]).toBe(
      '<rect x="7" y="95" width="0.5" height="0.5" fill="#000" style="stroke:#000;stroke-width:0.5;"/>',
    );
  });

  it('ignores the back colour it is handed (java:47-53 read only getColor)', () => {
    const root = newGraphic();
    root.apply(new Back('#FF0000')).apply(new Fore(BLACK)).draw(new UPixel());
    expect(rects(root.getSvgString())).toEqual([
      '<rect x="0" y="0" width="0.5" height="0.5" fill="black" style="stroke:#000;stroke-width:0.5;"/>',
    ]);
  });

  it('strokes 0.5 with no dash whatever stroke is applied (setStrokeWidth(0.5, null), java:54)', () => {
    const root = newGraphic();
    root
      .apply(new UStroke(5, 5, 3))
      .apply(new Fore('#123456'))
      .draw(new UPixel());
    expect(rects(root.getSvgString())).toEqual([
      '<rect x="0" y="0" width="0.5" height="0.5" fill="black" style="stroke:#123456;stroke-width:0.5;"/>',
    ]);
  });

  it('strokes a gradient ink with its first colour (getColor1(), java:48-50)', () => {
    const root = newGraphic();
    root.apply(new Fore({ color1: '#FF0000', color2: '#0000FF', policy: '/' })).draw(new UPixel());
    const svg = root.getSvgString();
    expect(rects(svg)).toEqual([
      '<rect x="0" y="0" width="0.5" height="0.5" fill="black" style="stroke:#F00;stroke-width:0.5;"/>',
    ]);
    expect(svg).not.toContain('<linearGradient');
  });
});

describe("LimitFinder's UPixel branch (LimitFinder.java:146-147: addPoint(x, y))", () => {
  it('records the single point the pixel is drawn at', () => {
    const finder = LimitFinder.create(limitStringBounder, false);
    finder.apply(new UTranslate(3, 4)).draw(new UPixel());
    finder.apply(new UTranslate(10, 2)).draw(new UPixel());
    const mm = finder.getMinMax();
    expect([mm.getMinX(), mm.getMinY(), mm.getMaxX(), mm.getMaxY()]).toEqual([3, 2, 10, 4]);
  });
});
