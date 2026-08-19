/**
 * FontPosition.test.ts — SI30 T1. Every expectation is upstream's own
 * branch table, cited per case:
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/font/FontPosition.java`.
 */
import { describe, expect, test } from 'vitest';
import {
  FontPosition,
  fontPositionSpace,
  muteFontSize,
  fontPositionHtmlTag,
} from '../../../../../src/core/klimt/font/FontPosition.js';

describe('fontPositionSpace (FontPosition.java:41-49)', () => {
  test('EXPOSANT raises by 6 (java:42-43)', () => {
    expect(fontPositionSpace(FontPosition.EXPOSANT)).toBe(-6);
  });

  test('INDICE lowers by 3 (java:45-46)', () => {
    expect(fontPositionSpace(FontPosition.INDICE)).toBe(3);
  });

  test('NORMAL is 0 (java:48)', () => {
    expect(fontPositionSpace(FontPosition.NORMAL)).toBe(0);
  });
});

describe('muteFontSize (FontPosition.java:51-60)', () => {
  test('NORMAL returns the size untouched (java:52-53)', () => {
    expect(muteFontSize(12, FontPosition.NORMAL)).toBe(12);
    expect(muteFontSize(4, FontPosition.NORMAL)).toBe(4);
  });

  test('EXPOSANT subtracts 3 (java:55)', () => {
    expect(muteFontSize(12, FontPosition.EXPOSANT)).toBe(9);
    expect(muteFontSize(14, FontPosition.EXPOSANT)).toBe(11);
  });

  test('INDICE subtracts 3 — same mute as EXPOSANT (java:55)', () => {
    expect(muteFontSize(12, FontPosition.INDICE)).toBe(9);
  });

  test('clamps at a floor of 2 (java:56-57)', () => {
    expect(muteFontSize(4, FontPosition.EXPOSANT)).toBe(2);
    expect(muteFontSize(5, FontPosition.EXPOSANT)).toBe(2);
    expect(muteFontSize(2, FontPosition.INDICE)).toBe(2);
  });

  test('size 6 is the smallest that escapes the clamp (java:55-57)', () => {
    expect(muteFontSize(6, FontPosition.EXPOSANT)).toBe(3);
  });
});

describe('fontPositionHtmlTag (FontPosition.java:63-70)', () => {
  test('EXPOSANT is "sup" (java:64-65)', () => {
    expect(fontPositionHtmlTag(FontPosition.EXPOSANT)).toBe('sup');
  });

  test('INDICE is "sub" (java:67-68)', () => {
    expect(fontPositionHtmlTag(FontPosition.INDICE)).toBe('sub');
  });

  test('NORMAL throws — upstream UnsupportedOperationException (java:70)', () => {
    expect(() => fontPositionHtmlTag(FontPosition.NORMAL)).toThrow(/unsupported/i);
  });
});
