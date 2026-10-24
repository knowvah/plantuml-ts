/**
 * `DriverImageSvgSvg` (`DriverImageSvgSvg.java:42-44`) hands `UImageSvg` to
 * `SvgGraphics#svgImage(UImageSvg, x, y)` (`SvgGraphics.java:1001-1035`),
 * the secure branch: an `<image>` whose href is the re-rooted SVG, base64.
 */
import { describe, expect, it } from 'vitest';
import { UGraphicSvg } from '../../../../src/core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../../../src/core/klimt/drawing/svg/svg-graphics.js';
import type { StringBounder } from '../../../../src/core/klimt/drawing/svg/driver-text-svg.js';
import { UImageSvg } from '../../../../src/core/klimt/shape/UImageSvg.js';
import { UTranslate } from '../../../../src/core/klimt/UTranslate.js';
import { DriverImageSvgSvg } from '../../../../src/core/klimt/drawing/svg/driver-image-svg-svg.js';

const stubStringBounder: StringBounder = {
  calculateDimension(font, text) {
    return { width: text.length * font.size * 0.5 };
  },
};

const DATA_URI_PREFIX = 'data:image/svg+xml;base64,';
const SVG = '<svg width="16" height="8"><g><path d="M0 0"/></g></svg>';
const SVG_XLINK = '<svg width="16" height="8" xmlns:xlink="http://www.w3.org/1999/xlink"><g/></svg>';

function draw(svg: string, scale: number, optionScale: number): string {
  const root = UGraphicSvg.build(0, basicSvgOption({ scale: optionScale }), '$version$', stubStringBounder);
  root.apply(new UTranslate(10, 20)).draw(new UImageSvg(svg, scale));
  return root.getSvgString();
}

function hrefPayload(out: string): string {
  const m = /xlink:href="data:image\/svg\+xml;base64,([^"]+)"/.exec(out);
  return Buffer.from(m![1]!, 'base64').toString('utf8');
}

describe('DriverImageSvgSvg', () => {
  it('is registered for UImageSvg (UGraphicSvg.java:127)', () => {
    expect(DriverImageSvgSvg.name).toBe('DriverImageSvgSvg');
    expect(() => draw(SVG, 1, 1)).not.toThrow();
  });

  it('emits <image width height x y xlink:href> (SvgGraphics.java:1008-1013)', () => {
    const out = draw(SVG, 1, 1);
    expect(out).toContain(`<image width="16" height="8" x="10" y="20" xlink:href="${DATA_URI_PREFIX}`);
  });

  it('re-roots the SVG with the integer size and the xmlns (:1015-1033)', () => {
    expect(hrefPayload(draw(SVG, 1, 1))).toBe(
      '<svg height="8" width="16" xmlns="http://www.w3.org/2000/svg" ><g><path d="M0 0"/></g></svg>',
    );
  });

  it('declares xmlns:xlink when the source does (:1019-1023)', () => {
    expect(hrefPayload(draw(SVG_XLINK, 1, 1))).toBe(
      '<svg height="8" width="16" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" ><g/></svg>',
    );
  });

  it('truncates height/width x option scale (:1019-1024) and scales the group (:1037-1050)', () => {
    const payload = hrefPayload(draw(SVG, 1, 1.5));
    expect(payload).toBe(
      '<svg height="12" width="24" xmlns="http://www.w3.org/2000/svg" ><g transform="scale(1.5,1.5)" ><path d="M0 0"/></g></svg>',
    );
  });

  it('wraps a group-less document in <g> before scaling (:1042-1046)', () => {
    const payload = hrefPayload(draw('<svg width="16" height="8"><path d="M0 0"/></svg>', 2, 1));
    expect(payload).toContain('<g transform="scale(2,2)" ><path d="M0 0"/></g></svg>');
  });

  it('uses the scaled image size on the element (:1008-1009)', () => {
    expect(draw(SVG, 2, 1)).toContain('<image width="32" height="16" x="10" y="20"');
  });
});
