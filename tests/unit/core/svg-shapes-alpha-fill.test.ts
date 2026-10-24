/**
 * sdd3-T2a. Two `SvgGraphics` rules the string emitters in `svg-shapes.ts`
 * (`rect`/`path`/`polygon`/`polyline`/`circle`) had not ported:
 *
 * 1. `SvgGraphics#fillMe` (`klimt/drawing/svg/SvgGraphics.java:880-887`): a
 *    fill matching `#[0-9A-Fa-f]{8}` is written as `fill=shortenColor(first 7)`
 *    plus `fill-opacity=formatOpacity(parseInt(last 2, 16) / 255.0)`.
 * 2. `DriverPathSvg#draw` (`DriverPathSvg.java:65-69`): a path whose colour
 *    equals its back colour (neither a gradient) is drawn with
 *    `setStrokeColor("")` and `setStrokeWidth(0, null)`; `styleMe`
 *    (`SvgGraphics.java:624-626`) then writes no stroke style.
 *
 * Expected values come from cached goldens: koleji-09-doni016 (`#00FF0040`
 * -> `#0F0`, `0.251`), nofegi-58-kilo738 (`#00FF0067` -> `0.404`),
 * gadiva-05-pogi376 (`#803D1414` -> `#803D14`, `0.078`), kixani-97-giji283
 * (`#00FF0080` -> `0.502`) and zuravu-52-mike252 (`<path ... fill="#FFB000"/>`
 * with no stroke).
 */
import { describe, expect, it } from 'vitest';
import { circle, path, polygon, polyline, rect } from '../../../src/core/svg.js';

const PTS = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 2, y: 3 },
];

describe('fillMe: #RRGGBBAA splits into fill + fill-opacity (SvgGraphics.java:880-887)', () => {
  it('rect: 0x40/255 = 0.251 (koleji-09-doni016)', () => {
    expect(rect(1, 2, 3, 4, { fill: '#00FF0040' })).toBe(
      '<rect x="1" y="2" width="3" height="4" fill="#0F0" fill-opacity="0.251"/>',
    );
  });

  it('rect: 0x67/255 = 0.404 (nofegi-58-kilo738)', () => {
    expect(rect(0, 0, 5, 5, { fill: '#00FF0067' })).toContain('fill="#0F0" fill-opacity="0.404"');
  });

  it('rect: 0x14/255 = 0.078, colour stays 6-digit when not shortenable (gadiva-05-pogi376)', () => {
    expect(rect(0, 0, 5, 5, { fill: '#803D1414' })).toContain('fill="#803D14" fill-opacity="0.078"');
  });

  it('rect: the fill-opacity precedes the stroke attributes, as fillMe precedes styleMe', () => {
    expect(rect(0, 0, 5, 5, { fill: '#00FF0080', stroke: '#112233', strokeWidth: 2 })).toBe(
      '<rect x="0" y="0" width="5" height="5" fill="#0F0" fill-opacity="0.502" stroke="#123" stroke-width="2"/>',
    );
  });

  it('rect: a transparent colour is #00000000 first (HColor.java:74-76) -> #000 + 0; 0xFF never reaches fillMe', () => {
    expect(rect(0, 0, 1, 1, { fill: '#11223300' })).toContain('fill="#000" fill-opacity="0"');
    expect(rect(0, 0, 1, 1, { fill: '#112233FF' })).toBe('<rect x="0" y="0" width="1" height="1" fill="#123"/>');
  });

  it('rect: lower-case hex digits match too ([0-9A-Fa-f])', () => {
    expect(rect(0, 0, 1, 1, { fill: '#00ff0080' })).toContain('fill="#0F0" fill-opacity="0.502"');
  });

  it('rect: an explicit fillOpacity wins over the alpha byte', () => {
    expect(rect(0, 0, 1, 1, { fill: '#00FF0080', fillOpacity: 0.25 })).toContain('fill="#0F0" fill-opacity="0.25"');
  });

  it('6-digit, 3-digit and named fills are untouched', () => {
    expect(rect(0, 0, 1, 1, { fill: '#FF0000' })).toBe('<rect x="0" y="0" width="1" height="1" fill="#F00"/>');
    expect(rect(0, 0, 1, 1, { fill: '#123456' })).toContain('fill="#123456"');
    expect(rect(0, 0, 1, 1, { fill: 'none' })).toContain('fill="none"');
  });

  it('path with an explicit alpha fill', () => {
    expect(path('M0,0 L1,1', { fill: '#00FF0080', stroke: '#112233' })).toBe(
      '<path d="M0,0 L1,1" fill="#0F0" fill-opacity="0.502" stroke="#123"/>',
    );
  });

  it('polygon', () => {
    expect(polygon(PTS, { fill: '#00FF0080', stroke: '#112233', strokeWidth: 1 })).toBe(
      '<polygon points="0,0,4,0,2,3" fill="#0F0" fill-opacity="0.502" stroke="#123" stroke-width="1" ' +
        'stroke-linejoin="miter" stroke-miterlimit="10"/>',
    );
  });

  it('polyline and circle share the rule', () => {
    expect(polyline(PTS, { fill: '#00FF0080' })).toContain('fill="#0F0" fill-opacity="0.502"');
    expect(circle(1, 1, 2, { fill: '#00FF0080' })).toContain('fill="#0F0" fill-opacity="0.502"');
  });
});

describe('DriverPathSvg: colour == back colour draws strokeless (DriverPathSvg.java:65-69)', () => {
  it('equal fill and stroke: fill only (zuravu-52-mike252 header corner)', () => {
    expect(path('M0,0 L1,1 L0,1', { fill: '#FFB000', stroke: '#FFB000', strokeWidth: 1 })).toBe(
      '<path d="M0,0 L1,1 L0,1" fill="#FFB000"/>',
    );
  });

  it('equal alpha fill and stroke keep the split fill, no stroke (kixani-97-giji283 path[1])', () => {
    expect(path('M0,0 L1,1', { fill: '#00FF0080', stroke: '#00FF0080', strokeWidth: 1.5 })).toBe(
      '<path d="M0,0 L1,1" fill="#0F0" fill-opacity="0.502"/>',
    );
  });

  it('equality is on the resolved colour, so #FF0000 and #F00 spellings agree', () => {
    expect(path('M0,0 L1,1', { fill: '#FF0000', stroke: '#F00' })).toBe('<path d="M0,0 L1,1" fill="#F00"/>');
  });

  it('different fill and stroke still stroke', () => {
    expect(path('M0,0 L1,1', { fill: '#FFB000', stroke: '#000000', strokeWidth: 1 })).toBe(
      '<path d="M0,0 L1,1" fill="#FFB000" stroke="#000" stroke-width="1"/>',
    );
  });

  it('a stroke-only path (no fill) still strokes', () => {
    expect(path('M0,0 L1,1', { stroke: '#FFB000', strokeWidth: 1 })).toBe(
      '<path d="M0,0 L1,1" fill="none" stroke="#FFB000" stroke-width="1"/>',
    );
  });

  it('fill none with stroke none is not "equal colours" (no fill to match)', () => {
    expect(path('M0,0 L1,1', { fill: 'none', stroke: 'none' })).toBe('<path d="M0,0 L1,1" fill="none" stroke="none"/>');
  });

  it('the rule is the path driver only: an equal-colour rect still strokes (DriverRectangleSvg)', () => {
    expect(rect(0, 0, 1, 1, { fill: '#FFB000', stroke: '#FFB000', strokeWidth: 1 })).toBe(
      '<rect x="0" y="0" width="1" height="1" fill="#FFB000" stroke="#FFB000" stroke-width="1"/>',
    );
  });
});
