/**
 * add4-T3c SVG-ZERO-STROKE: `SvgGraphics#styleMe` (`klimt/drawing/svg/
 * SvgGraphics.java:624-626`) returns before writing any stroke style when
 * the formatted width is `"0"`; `svgRectangle`/`svgLine`/`svgPolygon`/
 * `svgPath` all route through it. The fill is a separate attribute and stays.
 */
import { describe, expect, it } from 'vitest';
import { line, path, polygon, rect } from '../../../src/core/svg.js';

const ZERO = { stroke: '#000000', strokeWidth: 0, strokeDasharray: '5,5' };
const PTS = [
  { x: 0, y: 0 },
  { x: 4, y: 0 },
  { x: 2, y: 3 },
];

describe('a zero-width stroke writes no stroke style', () => {
  it('line', () => {
    expect(line(20, 0, 20, 10, ZERO)).toBe('<line x1="20" y1="0" x2="20" y2="10"/>');
  });

  it('rect keeps its fill', () => {
    expect(rect(1, 2, 3, 4, { ...ZERO, fill: '#FFFFFF' })).toBe('<rect x="1" y="2" width="3" height="4" fill="#FFF"/>');
  });

  it('path keeps fill="none"', () => {
    expect(path('M0,0 L1,1', ZERO)).toBe('<path d="M0,0 L1,1" fill="none"/>');
  });

  it('polygon drops the styleMe suffix too', () => {
    expect(polygon(PTS, { ...ZERO, fill: '#000000' })).toBe('<polygon points="0,0,4,0,2,3" fill="#000"/>');
  });

  it('a width that formats to "0" counts; 0.5 does not', () => {
    expect(line(0, 0, 1, 1, { stroke: '#000000', strokeWidth: 0.00001 })).toBe('<line x1="0" y1="0" x2="1" y2="1"/>');
    expect(line(0, 0, 1, 1, { stroke: '#000000', strokeWidth: 0.5 })).toBe(
      '<line x1="0" y1="0" x2="1" y2="1" stroke="#000" stroke-width="0.5"/>',
    );
  });

  it('an unset width keeps the polygon join attributes', () => {
    expect(polygon(PTS, { fill: '#000000' })).toBe(
      '<polygon points="0,0,4,0,2,3" fill="#000" stroke-linejoin="miter" stroke-miterlimit="10"/>',
    );
  });
});
