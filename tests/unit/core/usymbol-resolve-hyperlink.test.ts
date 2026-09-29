/**
 * cdd6 T3g (D3): `textFont` seeds `FontConfiguration.hyperlinkColor` from the
 * element's own `<style> <sname> { HyperLinkColor }` bucket --
 * `FontConfiguration.create(skinParam, style, colors)` reads
 * `style.value(PName.HyperLinkColor)` (`FontConfiguration.java:213-219`).
 */
import { describe, it, expect } from 'vitest';
import { textFont } from '../../../src/core/decoration/symbol/usymbol-resolve.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { Theme } from '../../../src/core/theme.js';

function themeWith(hyperlinkColor: string | undefined): Theme {
  const component = hyperlinkColor === undefined ? {} : { hyperlinkColor };
  return { ...defaultTheme, colors: { ...defaultTheme.colors, elements: { component } } };
}

describe('textFont — HyperLinkColor (cdd6 T3g)', () => {
  it('carries the element bucket HyperLinkColor', () => {
    expect(textFont(themeWith('#FF0000'), 'component').hyperlinkColor).toBe('#FF0000');
  });

  it('another element does not inherit it', () => {
    expect(textFont(themeWith('#FF0000'), 'node').hyperlinkColor).toBeUndefined();
  });

  it('absent bucket value -> no hyperlinkColor key (CommandCreoleUrl #0000FF fallback)', () => {
    expect('hyperlinkColor' in textFont(themeWith(undefined), 'component')).toBe(false);
  });
});
