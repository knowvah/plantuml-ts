/**
 * cdd6 T3f (tozizu-96-voka262): `skinparam reversecolor` -- the class
 * post-process mapper `TitledDiagram.java:292-313 #muteColorMapper` selects.
 * `getReversed` references are the Java's own (`ColorUtils.getReversed(new
 * XColor(r, g, b))`, a Probe.java run against plantuml-1.2026.8beta1.jar):
 *   [255,255,255] -> 1,1,1      [0,0,0] -> 254,255,255
 *   [241,241,241] -> 17,17,17   [24,24,24] -> 231,231,231
 *   [254,255,221] -> 4,4,1      [204,204,255] -> 4,4,147
 *   [173,209,178] -> 39,50,41   [255,0,0] -> 224,0,0
 * and ColorOrder.GBR.getReverse: [254,255,221] -> 0,34,1.
 */
import { describe, it, expect } from 'vitest';
import {
  applyColorMapperToFragment,
  colorMapperOf,
  getReversed,
} from '../../../src/core/klimt/color/fragment-color-mapper.js';
import { renderClass } from '../../../src/diagrams/class/renderer.js';
import { layoutClass } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { parseClass } from './parse-helper.js';

describe('ColorUtils#getReversed port', () => {
  it.each([
    [
      { r: 255, g: 255, b: 255 },
      { r: 1, g: 1, b: 1 },
    ],
    [
      { r: 0, g: 0, b: 0 },
      { r: 254, g: 255, b: 255 },
    ],
    [
      { r: 241, g: 241, b: 241 },
      { r: 17, g: 17, b: 17 },
    ],
    [
      { r: 24, g: 24, b: 24 },
      { r: 231, g: 231, b: 231 },
    ],
    [
      { r: 254, g: 255, b: 221 },
      { r: 4, g: 4, b: 1 },
    ],
    [
      { r: 204, g: 204, b: 255 },
      { r: 4, g: 4, b: 147 },
    ],
    [
      { r: 173, g: 209, b: 178 },
      { r: 39, g: 50, b: 41 },
    ],
    [
      { r: 255, g: 0, b: 0 },
      { r: 224, g: 0, b: 0 },
    ],
  ])('%o -> %o', (input, expected) => {
    expect(getReversed(input)).toEqual(expected);
  });
});

describe('colorMapperOf (muteColorMapper precedence)', () => {
  it('maps nothing without monochrome/reversecolor, or for an unknown value', () => {
    expect(colorMapperOf({})).toBeUndefined();
    expect(colorMapperOf({ reverseColor: 'nonsense' })).toBeUndefined();
  });

  it('reversecolor dark (any case) is the HSLuv lightness inverse', () => {
    expect(colorMapperOf({ reverseColor: 'DaRk' })!('#FEFFDD')).toBe('#040401');
    expect(colorMapperOf({ reverseColor: 'dark' })!('#FFFFFF')).toBe('#010101');
  });

  it('a ColorOrder name is ColorMapper.reverse(order)', () => {
    expect(colorMapperOf({ reverseColor: 'gbr' })!('#FEFFDD')).toBe('#002201');
  });

  it('monochrome wins over reversecolor', () => {
    expect(colorMapperOf({ monochrome: 'true', reverseColor: 'dark' })!('#ADD1B2')).toBe('#C2C2C2');
  });

  it('keeps alpha, leaves fully transparent and non-hex values alone', () => {
    const map = colorMapperOf({ reverseColor: 'dark' })!;
    expect(map('#FFFFFF80')).toBe('#01010180');
    expect(map('#00000000')).toBe('#00000000');
    expect(map('none')).toBe('none');
  });
});

describe('applyColorMapperToFragment', () => {
  it('rewrites every fill/stroke value, shortened (jar tozizu)', () => {
    const svg = '<rect fill="#F1F1F1" style="stroke:#181818;stroke-width:0.5;"/><text fill="#000">x</text>';
    expect(applyColorMapperToFragment(svg, colorMapperOf({ reverseColor: 'dark' }))).toBe(
      '<rect fill="#111" style="stroke:#E7E7E7;stroke-width:0.5;"/><text fill="#FEFFFF">x</text>',
    );
  });

  it('is the identity without a mapper', () => {
    expect(applyColorMapperToFragment('<rect fill="#F1F1F1"/>', undefined)).toBe('<rect fill="#F1F1F1"/>');
  });
});

describe('renderClass applies the reversecolor mapper (tozizu-96-voka262)', () => {
  it('maps the document background and every drawn colour', () => {
    const theme = { ...defaultTheme, reverseColor: 'dark' };
    const ast = parseClass({ lines: ['class A'], type: 'class' });
    const fragment = renderClass(layoutClass(ast, theme, new WidthTableMeasurer()), theme);
    // jar tozizu: `background:#010101`, class body `fill="#111"`, border `#E7E7E7`.
    expect(fragment.background).toBe('#010101');
    expect(fragment.body).toContain('fill="#111"');
    expect(fragment.body).toContain('#E7E7E7');
    expect(fragment.body).not.toContain('#181818');
  });
});
