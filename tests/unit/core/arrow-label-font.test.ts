import { describe, it, expect } from 'vitest';
import {
  ARROW_LABEL_DEFAULT_COLOR,
  resolveArrowLabelFont,
  resolveCardinalityFontColor,
} from '../../../src/core/arrow-label-font.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';
import { resolveSkinparam } from '../../../src/core/skinparam.js';

/** Overlay `colors.graph` fields onto `defaultTheme` without mutating it. */
function withArrowGraph(graph: Partial<Theme['colors']['graph']>): Theme {
  return {
    ...defaultTheme,
    colors: { ...defaultTheme.colors, graph: { ...defaultTheme.colors.graph, ...graph } },
  };
}

describe('resolveArrowLabelFont (T2, D3)', () => {
  // SI26 T1: `color` joined the object (D2); with no override it is the
  // jar's root `FontColor black` (`plantuml.skin:9`), NEVER
  // `theme.colors.text` (D3). Family/size pinned unchanged from pre-SI26.
  it('with no override resolves to EXACTLY { family: theme.fontFamily, size: 13, color: #000000 }', () => {
    expect(resolveArrowLabelFont(defaultTheme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
      color: '#000000',
    });
    expect(ARROW_LABEL_DEFAULT_COLOR).toBe('#000000');
    expect(defaultTheme.colors.text).not.toBe('#000000');
  });

  it('camuna shape: { size: 14, style: bold } maps to weight bold, no italic', () => {
    const theme = withArrowGraph({ arrowFontSize: 14, arrowFontStyle: 'bold' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 14,
      weight: 'bold',
      color: '#000000',
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
      color: '#000000',
    });
  });

  it('a "bold italic" FontStyle combination sets BOTH weight and style', () => {
    const theme = withArrowGraph({ arrowFontStyle: 'bold italic' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
      weight: 'bold',
      style: 'italic',
      color: '#000000',
    });
  });

  it('arrowFontFamily alone falls through to the default size, no weight/style keys', () => {
    const theme = withArrowGraph({ arrowFontFamily: 'Impact' });
    const font = resolveArrowLabelFont(theme);
    expect(font).toEqual({ family: 'Impact', size: 13, color: '#000000' });
    expect(font.weight).toBeUndefined();
    expect(font.style).toBeUndefined();
  });

  it('an unrecognised FontStyle value ("plain") sets neither weight nor style', () => {
    const theme = withArrowGraph({ arrowFontStyle: 'plain' });
    expect(resolveArrowLabelFont(theme)).toEqual({
      family: defaultTheme.fontFamily,
      size: 13,
      color: '#000000',
    });
  });
});

// SI26 T1 (D2/D3/D5): the colour tier of the same resolver, plus the
// cardinality reader. Oracle experiment ids refer to
// `plans/arrow-label-font-colour/decisions.md`.
describe('resolveArrowLabelFont colour + resolveCardinalityFontColor (SI26 T1)', () => {
  it('h: skinparam ArrowFontColor green -> arrow #008000 and cardinality inherits it', () => {
    const { theme } = resolveSkinparam(new Map([['arrowfontcolor', 'green']]), defaultTheme);
    expect(theme.colors.graph.arrowFontColor).toBe('#008000');
    expect(resolveArrowLabelFont(theme).color).toBe('#008000');
    expect(resolveCardinalityFontColor(theme)).toBe('#008000');
  });

  it('b: ArrowFontColor green THEN defaultFontColor red -> #FF0000 (later wins)', () => {
    const { theme } = resolveSkinparam(
      new Map([['arrowfontcolor', 'green'], ['defaultfontcolor', 'red']]),
      defaultTheme,
    );
    expect(resolveArrowLabelFont(theme).color).toBe('#FF0000');
  });

  it('g: defaultFontColor red THEN ArrowFontColor green -> #008000 (later wins)', () => {
    const { theme } = resolveSkinparam(
      new Map([['defaultfontcolor', 'red'], ['arrowfontcolor', 'green']]),
      defaultTheme,
    );
    expect(resolveArrowLabelFont(theme).color).toBe('#008000');
  });

  it('j: skinparam classFontColor red leaves the arrow colour at #000000', () => {
    const { theme } = resolveSkinparam(new Map([['classfontcolor', 'red']]), defaultTheme);
    expect(resolveArrowLabelFont(theme).color).toBe('#000000');
  });

  it('D5: theme.cardinalityFontColor overrides cardinality only, main label stays #000000', () => {
    const theme: Theme = { ...defaultTheme, cardinalityFontColor: '#FF0000' };
    expect(resolveCardinalityFontColor(theme)).toBe('#FF0000');
    expect(resolveArrowLabelFont(theme).color).toBe('#000000');
  });
});
