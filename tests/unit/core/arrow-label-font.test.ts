import { describe, it, expect } from 'vitest';
import { resolveArrowLabelFont } from '../../../src/core/arrow-label-font.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';

/** Overlay `colors.graph` fields onto `defaultTheme` without mutating it. */
function withArrowGraph(graph: Partial<Theme['colors']['graph']>): Theme {
  return {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, ...graph } },
  };
}

describe('resolveArrowLabelFont (T2, D3)', () => {
  it('with no override resolves to EXACTLY { family: theme.fontFamily, size: 13 }', () => {
    expect(resolveArrowLabelFont(defaultTheme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
    });
  });

  it('camuna shape: { size: 14, style: bold } maps to weight bold, no italic', () => {
    const theme = withArrowGraph({ arrowFontSize: 14, arrowFontStyle: 'bold' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 14,
      weight: 'bold',
    });
  });

  it('zosuje shape: FontStyle bold alone still maps size independently of style', () => {
    const theme = withArrowGraph({ arrowFontSize: 10, arrowFontStyle: 'bold' });
    expect(resolveArrowLabelFont(theme).size).toBe(10);
    expect(resolveArrowLabelFont(theme).weight).toBe('bold');
  });

  it("ticuxa shape: skinparam ClassArrowFontSize 58 + FontName Courier + FontStyle Italic", () => {
    const theme = withArrowGraph({
      arrowFontSize: 58,
      arrowFontFamily: 'Courier',
      arrowFontStyle: 'Italic',
    });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: 'Courier',
      size: 58,
      style: 'italic',
    });
  });

  it('a "bold italic" FontStyle combination sets BOTH weight and style', () => {
    const theme = withArrowGraph({ arrowFontStyle: 'bold italic' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
      weight: 'bold',
      style: 'italic',
    });
  });

  it('arrowFontFamily alone falls through to the default size, no weight/style keys', () => {
    const theme = withArrowGraph({ arrowFontFamily: 'Impact' });
    const font = resolveArrowLabelFont(theme);
    expect(font).toEqual({ family: 'Impact', size: 13 });
    expect(font.weight).toBeUndefined();
    expect(font.style).toBeUndefined();
  });

  it('an unrecognised FontStyle value ("plain") sets neither weight nor style', () => {
    const theme = withArrowGraph({ arrowFontStyle: 'plain' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
    });
  });
});
