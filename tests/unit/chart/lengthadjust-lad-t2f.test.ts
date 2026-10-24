/**
 * lad-T2f: `chart` routes through the document shell (`diagramType: 'CHART'`,
 * `TextBlockExporter.java:292-293`) and honours `skinparam lengthAdjust`
 * (`TextBlockExporter.java:306-307`, `SkinParam.java:1258-1269`,
 * `SvgGraphics.java:155-158`).
 */
import { describe, it, expect } from 'vitest';
import { renderSync } from '../../../src/index.js';

const SOURCE = '@startchart\nh-axis [Q1, Q2, Q3, Q4]\nv-axis 0 --> 100 grid\nbar [45, 62, 58, 70] #3498db\n@endchart';
const withSkin = (value: string): string => SOURCE.replace(/\n/, `\nskinparam lengthAdjust ${value}\n`);
const rootOf = (svg: string): string => svg.slice(0, svg.indexOf('>') + 1);
const rootGroupOf = (svg: string): string => {
  const g = svg.indexOf('<g', svg.indexOf('<defs'));
  return svg.slice(g, svg.indexOf('>', g) + 1);
};

describe('chart document shell route (lad-T2f)', () => {
  it('writes data-diagram-type and the default root group when unset', () => {
    const svg = renderSync(SOURCE);
    expect(rootOf(svg)).toContain('data-diagram-type="CHART"');
    expect(rootGroupOf(svg)).toBe('<g font-family="sans-serif" lengthAdjust="spacing">');
  });

  it('drops lengthAdjust from the root group under none (SvgGraphics.java:155-158)', () => {
    const svg = renderSync(withSkin('none'));
    expect(rootGroupOf(svg)).toBe('<g font-family="sans-serif">');
    expect(svg).not.toContain('textLength=');
  });

  it('writes spacingAndGlyphs on the root group', () => {
    const svg = renderSync(withSkin('spacingAndGlyphs'));
    expect(rootGroupOf(svg)).toBe('<g font-family="sans-serif" lengthAdjust="spacingAndGlyphs">');
  });
});
