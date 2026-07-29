/**
 * Parser.test.ts — T9a: unit coverage for `klimt/creole/Parser.java`'s
 * ported static helpers (`MONOSPACED`, `isLatexStart`/`isLatexEnd`,
 * `isCodeStart`/`isCodeEnd`, `isTreeStart`, `getScale`, `getColor`).
 */
import { describe, expect, it } from 'vitest';
import {
  MONOSPACED,
  isLatexStart,
  isLatexEnd,
  isCodeStart,
  isCodeEnd,
  isTreeStart,
  getScale,
  getColor,
} from '../../../../../src/core/klimt/creole/Parser.js';

describe('Parser.MONOSPACED', () => {
  it('is the exact font-family literal java:43 declares', () => {
    expect(MONOSPACED).toBe('monospaced');
  });
});

describe('Parser.isLatexStart / isLatexEnd', () => {
  it('recognizes the exact "<latex>" / "</latex>" sentinels', () => {
    expect(isLatexStart('<latex>')).toBe(true);
    expect(isLatexEnd('</latex>')).toBe(true);
  });

  it('rejects anything else, including a partial or padded match', () => {
    expect(isLatexStart('<latex> ')).toBe(false);
    expect(isLatexStart('latex')).toBe(false);
    expect(isLatexEnd('<latex>')).toBe(false);
  });
});

describe('Parser.isCodeStart / isCodeEnd', () => {
  it('recognizes the exact "<code>" / "</code>" sentinels', () => {
    expect(isCodeStart('<code>')).toBe(true);
    expect(isCodeEnd('</code>')).toBe(true);
  });

  it('rejects anything else', () => {
    expect(isCodeStart('<code> ')).toBe(false);
    expect(isCodeEnd('code')).toBe(false);
  });
});

describe('Parser.isTreeStart', () => {
  it('matches a line starting with "|_"', () => {
    expect(isTreeStart('|_child')).toBe(true);
    expect(isTreeStart('|_')).toBe(true);
  });

  it('rejects a line shorter than 2 characters', () => {
    expect(isTreeStart('|')).toBe(false);
    expect(isTreeStart('')).toBe(false);
  });

  it('rejects a line not starting with "|_"', () => {
    expect(isTreeStart('|-child')).toBe(false);
    expect(isTreeStart('_|child')).toBe(false);
  });
});

describe('Parser.getScale', () => {
  it('parses "scale=N"', () => {
    expect(getScale('scale=1.5', 1)).toBe(1.5);
  });

  it('parses a bare "*N" shorthand', () => {
    expect(getScale('*2', 1)).toBe(2);
  });

  it('returns the default when null/undefined', () => {
    expect(getScale(null, 3)).toBe(3);
    expect(getScale(undefined, 3)).toBe(3);
  });

  it('returns the default when the pattern does not match', () => {
    expect(getScale('no-scale-here', 3)).toBe(3);
  });
});

describe('Parser.getColor', () => {
  it('parses "color=#RRGGBB"', () => {
    expect(getColor('color=#ff0000')).toBe('#ff0000');
  });

  it('parses "color:name" and "color name" forms', () => {
    expect(getColor('color:red')).toBe('red');
    expect(getColor('color red')).toBe('red');
  });

  it('returns null when null/undefined or no match', () => {
    expect(getColor(null)).toBeNull();
    expect(getColor(undefined)).toBeNull();
    expect(getColor('no-color-here')).toBeNull();
  });
});
