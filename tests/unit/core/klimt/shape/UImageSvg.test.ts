/**
 * `UImageSvg#getSvg` / `getData` (`klimt/shape/UImageSvg.java:65-146`) and
 * `SvgGraphics#svgImage(UImageSvg)`'s payload (`SvgGraphics.java:1015-1053`).
 */
import { describe, expect, it } from 'vitest';
import { UImageSvg, svgImagePayload } from '../../../../../src/core/klimt/shape/UImageSvg.js';

const ROOT =
  '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" ' +
  'style="width:114px;height:124px;background:#FFFFFF;" width="114px" height="124px" viewBox="0 0 113.2 123.5">';
const DOC = `${ROOT}<defs/><g font-family="sans-serif"><g><title>A</title></g></g></svg>`;

describe('UImageSvg', () => {
  it('re-roots at a bare <svg> and paints the root background as a leading rect in the first bare <g>', () => {
    expect(new UImageSvg(DOC, 1).getSvg(false)).toBe(
      '<svg><defs/><g font-family="sans-serif"><g><rect fill="#FFFFFF" ' +
        'style="width:114px;height:124px;background:#FFFFFF;" width="114" height="124"/> <title>A</title></g></g></svg>',
    );
  });

  it('returns the document untouched when raw', () => {
    expect(new UImageSvg(DOC, 1).getSvg(true)).toBe(DOC);
  });

  it('strips an XML declaration before re-rooting', () => {
    const svg = new UImageSvg('<?xml version="1.0"?><svg width="3" height="4"><g/></svg>', 1);
    expect(svg.getSvg(false)).toBe('<svg><g/></svg>');
  });

  it('sizes from the viewBox, rounded up, times scale; falls back to the root width/height', () => {
    const svg = new UImageSvg(DOC, 2);
    expect([svg.getWidth(), svg.getHeight()]).toEqual([228, 248]);
    expect(new UImageSvg('<svg width="30" height="40"></svg>', 1).getData('height')).toBe(40);
  });

  it('throws when neither viewBox nor a size attribute exists', () => {
    expect(() => new UImageSvg('<svg></svg>', 1).getData('width')).toThrow('cannot find width');
  });

  it('throws when the document is not an <svg>', () => {
    expect(() => new UImageSvg('<div></div>', 1).getSvg(false)).toThrow('does not start with <svg');
  });

  it('wraps the payload in a fresh root with integer size and the xlink declaration when present', () => {
    expect(svgImagePayload(new UImageSvg(DOC, 1))).toBe(
      '<svg height="124" width="114" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns="http://www.w3.org/2000/svg" >' +
        new UImageSvg(DOC, 1).getSvg(false).substring('<svg>'.length),
    );
    expect(svgImagePayload(new UImageSvg('<svg width="3" height="4"><g/></svg>', 1))).toBe(
      '<svg height="4" width="3" xmlns="http://www.w3.org/2000/svg" ><g/></svg>',
    );
  });

  it('applies a non-unit scale as a transform on the first <g> (manageScale)', () => {
    expect(svgImagePayload(new UImageSvg('<svg width="3" height="4"><g x="1"/></svg>', 2))).toBe(
      '<svg height="8" width="6" xmlns="http://www.w3.org/2000/svg" ><g transform="scale(2,2)"  x="1"/></svg>',
    );
    expect(svgImagePayload(new UImageSvg('<svg width="3" height="4"><rect/></svg>', 2))).toBe(
      '<svg height="8" width="6" xmlns="http://www.w3.org/2000/svg" ><g transform="scale(2,2)" ><rect/></g></svg>',
    );
  });
});
