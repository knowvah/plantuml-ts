/**
 * T1p-a: `skinparam ConditionEndStyle hline|diamond`.
 * @see net/sourceforge/plantuml/skin/SkinParam.java:1007-1013
 * @see net/sourceforge/plantuml/svek/ConditionEndStyle.java
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('resolveSkinparam — conditionendstyle', () => {
  it('maps conditionendstyle hline to theme.conditionEndStyle', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['conditionendstyle', 'hline']]), defaultTheme);
    expect(theme.conditionEndStyle).toBe('hline');
    expect(unknown).toEqual([]);
  });

  it('is case-insensitive (ConditionEndStyle.fromString, java:43-50)', () => {
    const { theme } = resolveSkinparam(new Map([['conditionendstyle', 'HLine']]), defaultTheme);
    expect(theme.conditionEndStyle).toBe('hline');
  });

  it('maps conditionendstyle diamond explicitly', () => {
    const { theme } = resolveSkinparam(new Map([['conditionendstyle', 'diamond']]), defaultTheme);
    expect(theme.conditionEndStyle).toBe('diamond');
  });

  it('an unrecognized value leaves conditionEndStyle unset (falls back to diamond downstream, SkinParam.java:1011)', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['conditionendstyle', 'bogus']]), defaultTheme);
    expect(theme.conditionEndStyle).toBeUndefined();
    expect(unknown).toEqual([]);
  });

  it('absent key leaves conditionEndStyle unset on the base theme', () => {
    expect(defaultTheme.conditionEndStyle).toBeUndefined();
  });
});
