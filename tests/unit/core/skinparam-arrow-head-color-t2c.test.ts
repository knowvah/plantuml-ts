/**
 * T2c: `skinparam ArrowHeadColor <color>`.
 * @see net/sourceforge/plantuml/style/FromSkinparamToStyle.java:153
 *  (`addConvert("arrowHeadColor", PName.HeadColor, SName.arrow)`)
 * @see net/sourceforge/plantuml/decoration/Rainbow.java:84-95
 *  (`Rainbow.build(Style, HColorSet)` -- absent HeadColor tracks LineColor)
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('resolveSkinparam — arrowheadcolor', () => {
  it('maps arrowheadcolor to theme.colors.arrowHead', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['arrowheadcolor', '#FF0000']]), defaultTheme);
    expect(theme.colors.arrowHead).toBe('#FF0000');
    expect(unknown).toEqual([]);
  });

  it('is case-insensitive via the shared key normaliser', () => {
    const { theme } = resolveSkinparam(new Map([['ArrowHeadColor', '#0000FF']]), defaultTheme);
    expect(theme.colors.arrowHead).toBe('#0000FF');
  });

  it('accepts the "none" color keyword (SkinParam#getHtmlColor, java:385-387)', () => {
    const { theme } = resolveSkinparam(new Map([['arrowheadcolor', 'none']]), defaultTheme);
    expect(theme.colors.arrowHead).toBe('none');
  });

  it('does not change theme.colors.arrow (the LINE colour is a separate field)', () => {
    const { theme } = resolveSkinparam(new Map([['arrowheadcolor', '#FF0000']]), defaultTheme);
    expect(theme.colors.arrow).toBe(defaultTheme.colors.arrow);
  });

  it('absent key leaves arrowHead unset on the base theme', () => {
    expect(defaultTheme.colors.arrowHead).toBeUndefined();
  });

  it('arrowcolor and arrowheadcolor set independently in one skinparam block', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['arrowcolor', '#FFA500'],
        ['arrowheadcolor', '#000000'],
      ]),
      defaultTheme,
    );
    expect(theme.colors.arrow).toBe('#FFA500');
    expect(theme.colors.arrowHead).toBe('#000000');
  });
});
