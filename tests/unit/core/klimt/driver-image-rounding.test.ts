/**
 * Unit coverage for `DriverImageSvg`'s emission rounding (SI15 T3, ADR-2,
 * `plans/si15-uimage-raster-dims/decisions.md`). Jar-verified: the jar
 * MEASURES raw scaled `UImage` dims but EMITS `Math.round(width)`/
 * `Math.round(height)` on the `<image>` element whenever a real raster
 * backs the image (D9 Amendment 1, si5b `decisions.md`); a rasterless
 * `UImage` (e.g. the latex/KaTeX path) stays unrounded, byte-identical to
 * pre-change output.
 */
import { describe, expect, it } from 'vitest';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder } from '../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { UImage } from '../../../../src/core/klimt/shape/UImage.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';

const stubStringBounder: StringBounder = {
  calculateDimension(font, text) {
    return { width: text.length * font.size * 0.5 };
  },
};

function newGraphic(): UGraphicSvg {
  return UGraphicSvg.build(0, basicSvgOption(), '$version$', stubStringBounder);
}

describe('DriverImageSvg emission rounding (SI15 T3, ADR-2)', () => {
  it('rounds width/height when the UImage carries raster dims (raster-backed)', () => {
    const root = newGraphic();
    root
      .apply(new UTranslate(10, 20))
      .draw(UImage.build(3.2308, 2.1538, 'data:image/png;base64,AA==', { rasterWidth: 3, rasterHeight: 2 }));

    expect(root.getSvgString()).toContain(
      '<image width="3" height="2" x="10" y="20" xlink:href="data:image/png;base64,AA=="/>',
    );
  });

  it('rounds width up on a .5 boundary (round-half-up, matching the jar)', () => {
    const root = newGraphic();
    root
      .apply(new UTranslate(0, 0))
      .draw(UImage.build(6.5, 3.9, 'data:image/png;base64,AA==', { rasterWidth: 5, rasterHeight: 3 }));

    expect(root.getSvgString()).toContain(
      '<image width="7" height="4" x="0" y="0" xlink:href="data:image/png;base64,AA=="/>',
    );
  });

  it('rounding does NOT move x/y — only width/height', () => {
    const root = newGraphic();
    root
      .apply(new UTranslate(10.5, 20.5))
      .draw(UImage.build(3.2308, 2.1538, 'data:image/png;base64,AA==', { rasterWidth: 3, rasterHeight: 2 }));

    expect(root.getSvgString()).toContain(
      '<image width="3" height="2" x="10.5" y="20.5" xlink:href="data:image/png;base64,AA=="/>',
    );
  });

  it('a rasterless UImage (e.g. latex/KaTeX) emits its declared dims unrounded — byte-identical to pre-change output', () => {
    const root = newGraphic();
    root
      .apply(new UTranslate(0, 0))
      .draw(UImage.build(3.2308, 2.1538, 'data:image/svg+xml;base64,AA=='));

    expect(root.getSvgString()).toContain(
      '<image width="3.2308" height="2.1538" x="0" y="0" xlink:href="data:image/svg+xml;base64,AA=="/>',
    );
  });
});
