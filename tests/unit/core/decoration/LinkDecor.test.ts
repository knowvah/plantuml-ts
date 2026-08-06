/**
 * LinkDecor.test.ts — SI1/T2: the 25-value `LinkDecor` enum
 * (decoration/LinkDecor.java:71-100), its per-value data
 * (margin/fill/arrowSize), decor-token lookups (:226-236), regex
 * builders (:238-264), `isExtendsLike` (:164-166), and the extremity
 * factory dispatch (:168-224).
 */
import { describe, expect, it } from 'vitest';
import {
  LinkDecor,
  getArrowSize,
  getExtremityFactoryComplete,
  getExtremityFactoryLegacy,
  getMargin,
  getRegexDecors1,
  getRegexDecors2,
  isExtendsLike,
  isFill,
  lookupDecors1,
  lookupDecors2,
} from '../../../../src/core/decoration/LinkDecor.js';
import { ExtremityFactoryTriangle } from '../../../../src/core/svek/extremity/ExtremityTriangle.js';
import { ExtremityFactoryDiamond } from '../../../../src/core/svek/extremity/ExtremityDiamond.js';

describe('LinkDecor values (java:71-100)', () => {
  it('has exactly the 25 upstream values, in declaration order', () => {
    expect(Object.keys(LinkDecor)).toEqual([
      'NONE',
      'EXTENDS',
      'COMPOSITION',
      'AGGREGATION',
      'NOT_NAVIGABLE',
      'REDEFINES',
      'DEFINEDBY',
      'CROWFOOT',
      'CIRCLE_CROWFOOT',
      'CIRCLE_LINE',
      'DOUBLE_LINE',
      'LINE_CROWFOOT',
      'ARROW',
      'ARROW_TRIANGLE',
      'ARROW_AND_CIRCLE',
      'CIRCLE',
      'CIRCLE_FILL',
      'CIRCLE_CONNECT',
      'PARENTHESIS',
      'SQUARE',
      'CIRCLE_CROSS',
      'PLUS',
      'HALF_ARROW_UP',
      'HALF_ARROW_DOWN',
      'SQUARE_toberemoved',
    ]);
  });
});

describe('per-value data (java:71-100 constructor args)', () => {
  it('margins match upstream', () => {
    expect(getMargin(LinkDecor.NONE)).toBe(2);
    expect(getMargin(LinkDecor.EXTENDS)).toBe(30);
    expect(getMargin(LinkDecor.COMPOSITION)).toBe(15);
    expect(getMargin(LinkDecor.NOT_NAVIGABLE)).toBe(1);
    expect(getMargin(LinkDecor.CIRCLE_CROWFOOT)).toBe(14);
    expect(getMargin(LinkDecor.DOUBLE_LINE)).toBe(7);
    expect(getMargin(LinkDecor.CIRCLE)).toBe(0);
    expect(getMargin(LinkDecor.SQUARE_toberemoved)).toBe(30);
  });

  it('fill matches upstream (true only for COMPOSITION, CROWFOOT, ARROW, ARROW_TRIANGLE)', () => {
    const fills = Object.values(LinkDecor).filter((d) => isFill(d));
    expect(fills).toEqual([
      LinkDecor.COMPOSITION,
      LinkDecor.CROWFOOT,
      LinkDecor.ARROW,
      LinkDecor.ARROW_TRIANGLE,
    ]);
  });

  it('arrow sizes match upstream (PARENTHESIS 1.0 — USE_INTERFACE_EYE2 is false)', () => {
    expect(getArrowSize(LinkDecor.NONE)).toBe(0);
    expect(getArrowSize(LinkDecor.EXTENDS)).toBe(2);
    expect(getArrowSize(LinkDecor.COMPOSITION)).toBe(1.3);
    expect(getArrowSize(LinkDecor.NOT_NAVIGABLE)).toBe(0.5);
    expect(getArrowSize(LinkDecor.DOUBLE_LINE)).toBe(0.7);
    expect(getArrowSize(LinkDecor.ARROW_TRIANGLE)).toBe(0.8);
    expect(getArrowSize(LinkDecor.PARENTHESIS)).toBe(1.0);
    expect(getArrowSize(LinkDecor.PLUS)).toBe(1.5);
    expect(getArrowSize(LinkDecor.SQUARE_toberemoved)).toBe(0);
  });
});

describe('isExtendsLike (java:164-166)', () => {
  it('is true only for EXTENDS, REDEFINES, DEFINEDBY', () => {
    const likes = Object.values(LinkDecor).filter((d) => isExtendsLike(d));
    expect(likes).toEqual([LinkDecor.EXTENDS, LinkDecor.REDEFINES, LinkDecor.DEFINEDBY]);
  });
});

describe('lookupDecors1/lookupDecors2 (java:226-236)', () => {
  it('resolves tail-side tokens', () => {
    expect(lookupDecors1('<|')).toBe(LinkDecor.EXTENDS);
    expect(lookupDecors1('^')).toBe(LinkDecor.EXTENDS);
    expect(lookupDecors1('*')).toBe(LinkDecor.COMPOSITION);
    expect(lookupDecors1('o')).toBe(LinkDecor.AGGREGATION);
    expect(lookupDecors1('}o')).toBe(LinkDecor.CIRCLE_CROWFOOT);
    expect(lookupDecors1('<_')).toBe(LinkDecor.ARROW);
    expect(lookupDecors1('0)')).toBe(LinkDecor.CIRCLE_CONNECT);
  });

  it('resolves head-side tokens (incl. the decors2-only half arrows)', () => {
    expect(lookupDecors2('|>')).toBe(LinkDecor.EXTENDS);
    expect(lookupDecors2('||>')).toBe(LinkDecor.REDEFINES);
    expect(lookupDecors2(':|>')).toBe(LinkDecor.DEFINEDBY);
    expect(lookupDecors2('\\\\')).toBe(LinkDecor.HALF_ARROW_UP);
    expect(lookupDecors2('//')).toBe(LinkDecor.HALF_ARROW_DOWN);
    expect(lookupDecors2('(0')).toBe(LinkDecor.CIRCLE_CONNECT);
  });

  it('trims input and defaults to NONE (java: getOrDefault + trin)', () => {
    expect(lookupDecors1(' * ')).toBe(LinkDecor.COMPOSITION);
    expect(lookupDecors1(null)).toBe(LinkDecor.NONE);
    expect(lookupDecors1('zzz')).toBe(LinkDecor.NONE);
    expect(lookupDecors2(null)).toBe(LinkDecor.NONE);
    expect(lookupDecors2('|{')).toBe(LinkDecor.LINE_CROWFOOT);
  });
});

describe('getRegexDecors1/getRegexDecors2 (java:238-264)', () => {
  it('produces an optional group that matches every token', () => {
    const re1 = new RegExp('^' + getRegexDecors1() + '$');
    for (const tok of ['<|', '^', '*', 'x', '<||', '<|:', '}', '}o', '|o', '||', '}|', '<', '<_', '<<', '0', '@', '0)', ')', '#', '+']) {
      expect(re1.test(tok), tok).toBe(true);
    }
    expect(re1.test('')).toBe(true); // the whole group is optional: (...)?
  });

  it('word-bounds tokens starting/ending with "o" so identifiers are not eaten', () => {
    const src = getRegexDecors1();
    expect(src).toContain('\\bo\\b');
    // "o" must not match inside a word:
    const m = 'foo'.match(new RegExp(getRegexDecors1()));
    expect(m?.[1] ?? undefined).toBeUndefined();
  });

  it('orders longer tokens before their prefixes (|| before |o handling)', () => {
    const re2 = new RegExp('^' + getRegexDecors2() + '$');
    expect(re2.test('||>')).toBe(true);
    expect(re2.test('o{')).toBe(true);
    const src2 = getRegexDecors2();
    expect(src2.indexOf('\\|\\|>')).toBeLessThan(src2.indexOf('\\|>'));
  });
});

describe('extremity factory dispatch (java:168-224)', () => {
  const BG = '#FFFFFF';

  it('getExtremityFactoryComplete returns the 18/6/18 triangle for EXTENDS (java:169-170)', () => {
    expect(getExtremityFactoryComplete(LinkDecor.EXTENDS, BG)).toBeInstanceOf(ExtremityFactoryTriangle);
  });

  it('getExtremityFactoryLegacy returns null for EXTENDS/NONE/SQUARE_toberemoved (default branch)', () => {
    expect(getExtremityFactoryLegacy(LinkDecor.EXTENDS, BG)).toBeNull();
    expect(getExtremityFactoryLegacy(LinkDecor.NONE, BG)).toBeNull();
    expect(getExtremityFactoryLegacy(LinkDecor.SQUARE_toberemoved, BG)).toBeNull();
  });

  it('dispatches AGGREGATION/COMPOSITION to diamond factories', () => {
    expect(getExtremityFactoryLegacy(LinkDecor.AGGREGATION, BG)).toBeInstanceOf(ExtremityFactoryDiamond);
    expect(getExtremityFactoryLegacy(LinkDecor.COMPOSITION, BG)).toBeInstanceOf(ExtremityFactoryDiamond);
  });

  it('returns a factory for every token-reachable decor', () => {
    for (const d of [
      LinkDecor.REDEFINES,
      LinkDecor.DEFINEDBY,
      LinkDecor.HALF_ARROW_UP,
      LinkDecor.HALF_ARROW_DOWN,
      LinkDecor.ARROW_TRIANGLE,
      LinkDecor.CROWFOOT,
      LinkDecor.CIRCLE_CROWFOOT,
      LinkDecor.LINE_CROWFOOT,
      LinkDecor.CIRCLE_LINE,
      LinkDecor.DOUBLE_LINE,
      LinkDecor.ARROW,
      LinkDecor.NOT_NAVIGABLE,
      LinkDecor.CIRCLE,
      LinkDecor.CIRCLE_FILL,
      LinkDecor.SQUARE,
      LinkDecor.PARENTHESIS,
      LinkDecor.CIRCLE_CONNECT,
      LinkDecor.PLUS,
    ]) {
      expect(getExtremityFactoryLegacy(d, BG), d).not.toBeNull();
    }
  });

  it('throws (BLOCKED members, reported) for the two token-unreachable decors', () => {
    expect(() => getExtremityFactoryLegacy(LinkDecor.CIRCLE_CROSS, BG)).toThrow(/not ported/);
    expect(() => getExtremityFactoryLegacy(LinkDecor.ARROW_AND_CIRCLE, BG)).toThrow(/not ported/);
  });
});
