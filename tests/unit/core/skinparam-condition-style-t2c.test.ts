/**
 * T2c (ex-T2a): `skinparam ConditionStyle InsideDiamond|Diamond|Inside`.
 * @see net/sourceforge/plantuml/skin/SkinParam.java:997-1004
 * @see net/sourceforge/plantuml/svek/ConditionStyle.java:41-64
 */
import { describe, it, expect } from 'vitest';
import { resolveSkinparam } from '../../../src/core/skinparam.js';
import { defaultTheme } from '../../../src/core/theme.js';

describe('resolveSkinparam — conditionstyle', () => {
  it('maps conditionstyle InsideDiamond to theme.conditionStyle', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['conditionstyle', 'InsideDiamond']]), defaultTheme);
    expect(theme.conditionStyle).toBe('insideDiamond');
    expect(unknown).toEqual([]);
  });

  it('is case-insensitive (ConditionStyle.fromString, java:45-64)', () => {
    const { theme } = resolveSkinparam(new Map([['conditionstyle', 'insidediamond']]), defaultTheme);
    expect(theme.conditionStyle).toBe('insideDiamond');
  });

  it('accepts the "Foo1" alias for InsideDiamond (java:49-51)', () => {
    const { theme } = resolveSkinparam(new Map([['conditionstyle', 'Foo1']]), defaultTheme);
    expect(theme.conditionStyle).toBe('insideDiamond');
  });

  it('maps conditionstyle Diamond to emptyDiamond', () => {
    const { theme } = resolveSkinparam(new Map([['conditionstyle', 'Diamond']]), defaultTheme);
    expect(theme.conditionStyle).toBe('emptyDiamond');
  });

  it('maps conditionstyle Inside to insideHexagon', () => {
    const { theme } = resolveSkinparam(new Map([['conditionstyle', 'Inside']]), defaultTheme);
    expect(theme.conditionStyle).toBe('insideHexagon');
  });

  it('an unrecognized value leaves conditionStyle unset (falls back to insideHexagon downstream)', () => {
    const { theme, unknown } = resolveSkinparam(new Map([['conditionstyle', 'bogus']]), defaultTheme);
    expect(theme.conditionStyle).toBeUndefined();
    expect(unknown).toEqual([]);
  });

  it('absent key leaves conditionStyle unset on the base theme', () => {
    expect(defaultTheme.conditionStyle).toBeUndefined();
  });

  it('skinparam style strictuml does not interfere with conditionStyle (perate-09-gale335)', () => {
    const { theme } = resolveSkinparam(
      new Map([
        ['style', 'strictuml'],
        ['conditionstyle', 'InsideDiamond'],
      ]),
      defaultTheme,
    );
    expect(theme.conditionStyle).toBe('insideDiamond');
  });
});
