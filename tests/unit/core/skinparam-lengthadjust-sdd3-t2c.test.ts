/**
 * sdd3-T2c: `skinparam lengthAdjust` -> `Theme.lengthAdjust`.
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1258-1270 (getlengthAdjust)
 * @see net/sourceforge/plantuml/style/LengthAdjust.java:38-43 (enum + defaultValue() = SPACING)
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme, deepMergeTheme } from '../../../src/core/theme.js';

function lengthAdjustOf(value: string) {
  const { theme, unknown } = resolveSkinparam(new Map([['lengthadjust', value]]), defaultTheme);
  expect(unknown).toEqual([]);
  return theme.lengthAdjust;
}

describe('resolveSkinparam — lengthadjust', () => {
  it('maps the three LengthAdjust names, case-insensitively (SkinParam.java:1260-1267)', () => {
    expect(lengthAdjustOf('spacingAndGlyphs')).toBe('spacingAndGlyphs');
    expect(lengthAdjustOf('SPACINGANDGLYPHS')).toBe('spacingAndGlyphs');
    expect(lengthAdjustOf('spacing')).toBe('spacing');
    expect(lengthAdjustOf('Spacing')).toBe('spacing');
    expect(lengthAdjustOf('none')).toBe('none');
    expect(lengthAdjustOf('NONE')).toBe('none');
  });

  it('any other value is the default (SkinParam.java:1269), i.e. unset', () => {
    expect(lengthAdjustOf('glyphs')).toBeUndefined();
    expect(lengthAdjustOf('')).toBeUndefined();
  });

  it('a later invalid value replaces an earlier valid one (getValue is last-wins)', () => {
    const params = new Map([['lengthadjust', 'none']]);
    expect(resolveSkinparam(params, defaultTheme).theme.lengthAdjust).toBe('none');
    params.set('lengthadjust', 'bogus');
    expect(resolveSkinparam(params, defaultTheme).theme.lengthAdjust).toBeUndefined();
  });

  it('is absent on the base theme and survives the theme merge', () => {
    expect(defaultTheme.lengthAdjust).toBeUndefined();
    expect(deepMergeTheme(defaultTheme, { lengthAdjust: 'none' }).lengthAdjust).toBe('none');
  });
});
