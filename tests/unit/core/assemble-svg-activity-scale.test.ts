/**
 * add4-T3b ACT-SCALE: `finalizeActivityFragment` applies the fragment's
 * resolved scale to the whole composed activity document. Upstream draws
 * the document through ONE `UGraphic` whose `SvgGraphics#format` multiplies
 * every coordinate, length, stroke width and font size by
 * `option.getScale()` (`SvgGraphics.java:468-475`, `:557-562`), and sizes the
 * root from `(int)(maxX * scale)` (`SvgGraphics.java:801-813`).
 */
import { describe, it, expect } from 'vitest';
import { assembleSvg } from '../../../src/core/assemble-svg.js';
import type { RenderFragment } from '../../../src/core/dispatcher.js';

const BODY =
  '<ellipse cx="10" cy="5" rx="2" ry="2" fill="#222" stroke="#222" stroke-width="1"/>' +
  '<line x1="1" y1="2" x2="3" y2="4" stroke="#181818" stroke-width="0.5"/>' +
  '<path d="M0,0 A2,2 0 0 1 4,4" fill="none"/>' +
  '<polygon points="1,2,3,4" stroke-miterlimit="10"/>' +
  '<text x="7" y="8" font-size="12" textLength="20">a</text>';

function fragment(extra: Partial<RenderFragment>): RenderFragment {
  return { body: BODY, width: 220, height: 149, diagramType: 'ACTIVITY', ...extra };
}

describe('finalizeActivityFragment — document scale', () => {
  it('without a scale spec at dpi 96 the document is byte-identical to the unscaled path', () => {
    expect(assembleSvg(fragment({ dpi: 96 }))).toBe(assembleSvg(fragment({})));
  });

  it('a simple factor 2 doubles every geometry attribute once, and the root size', () => {
    const svg = assembleSvg(fragment({ scaleSpec: { kind: 'simple', factor: 2 } }));
    expect(svg).toContain('style="width:440px;height:298px;');
    expect(svg).toContain('viewBox="0 0 440 298"');
    expect(svg).toContain('<ellipse cx="20" cy="10" rx="4" ry="4" fill="#222" stroke="#222" stroke-width="2"/>');
    expect(svg).toContain('<line x1="2" y1="4" x2="6" y2="8" stroke="#181818" stroke-width="1"/>');
    // the arc's rotation angle and both flags are dimensionless.
    expect(svg).toContain('<path d="M0,0 A4,4 0 0 1 8,8" fill="none"/>');
    expect(svg).toContain('<polygon points="2,4,6,8" stroke-miterlimit="10"/>');
    expect(svg).toContain('<text x="14" y="16" font-size="24" textLength="40">a</text>');
  });

  it('scales the background rect with the body (SvgGraphics.java:819-822 formats maxX)', () => {
    const svg = assembleSvg(fragment({ background: '#808080', scaleSpec: { kind: 'simple', factor: 2 } }));
    expect(svg).toContain('<rect x="0" y="0" width="440" height="298" fill="#808080"');
  });

  it('dpi alone scales by dpi/96 (TextBlockExporter.java:204-208)', () => {
    const svg = assembleSvg(fragment({ dpi: 192 }));
    expect(svg).toContain('viewBox="0 0 440 298"');
    expect(svg).toContain('stroke-width="2"');
  });

  // isw-T2c-scale: a deferred body carries lossless doubles; the scale pass
  // is their one `SvgGraphics#format` (`SvgGraphics.java:468-475`).
  it('formats a deferred body once, after the scale (fround(20.83125) * 1.5 -> 31.247)', () => {
    const body = '<text x="7.0000005" y="8" font-size="11" textLength="20.83125">a</text>';
    const svg = assembleSvg(fragment({ body, numbersDeferred: true, scaleSpec: { kind: 'simple', factor: 1.5 } }));
    expect(svg).toContain('<text x="10.5" y="12" font-size="16.5" textLength="31.247">a</text>');
  });

  it('formats a deferred body at factor 1 too (every scalable attribute, once)', () => {
    const body =
      '<rect x="1.23456" y="2" width="20.83125" height="3.0004" rx="1.00049" style="stroke-width:0.50051;"/>' +
      '<line x1="0.12345" y1="1" x2="2" y2="3" stroke-dasharray="7.12345,7.12345"/>';
    const svg = assembleSvg(fragment({ body, numbersDeferred: true, scaleSpec: { kind: 'simple', factor: 1 } }));
    expect(svg).toContain('<rect x="1.235" y="2" width="20.831" height="3" rx="1" style="stroke-width:0.501;"/>');
    expect(svg).toContain('<line x1="0.123" y1="1" x2="2" y2="3" stroke-dasharray="7.123,7.123"/>');
  });

  it('leaves a non-deferred body at factor 1 byte-identical', () => {
    const body = '<text x="1" y="2" textLength="20.83125">a</text>';
    expect(assembleSvg(fragment({ body, scaleSpec: { kind: 'simple', factor: 1 } }))).toContain(
      'textLength="20.83125"',
    );
  });
});
