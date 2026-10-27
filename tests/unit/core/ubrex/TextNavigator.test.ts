import { describe, expect, it } from 'vitest';
import { Challenge } from '../../../../src/core/ubrex/Challenge.js';
import { ChallengeResult } from '../../../../src/core/ubrex/ChallengeResult.js';
import { TextNavigator, csCharAt, csLength } from '../../../../src/core/ubrex/TextNavigator.js';

describe('TextNavigator (TextNavigator.java)', () => {
  it('build/length/charAt/toString (:45,97,102,57)', () => {
    const n = TextNavigator.build('hello');
    expect(n.length()).toBe(5);
    expect(n.charAt(1)).toBe('e');
    expect(n.toString()).toBe('hello');
  });
  it('charAt out of bounds throws (:103)', () => {
    const n = TextNavigator.build('ab');
    expect(() => n.charAt(2)).toThrow('Index 2 out of bounds for length 2');
    expect(() => n.charAt(-1)).toThrow('Index -1 out of bounds for length 2');
  });
  it('jump moves p1 forward (:112)', () => {
    const n = TextNavigator.build('hello');
    n.jump(2);
    expect(n.toString()).toBe('llo');
  });
  it('copy is independent (:65)', () => {
    const n = TextNavigator.build('hello');
    const c = n.copy();
    n.jump(3);
    expect(c.toString()).toBe('hello');
    expect(n.toString()).toBe('lo');
  });
  it('reverse reads backwards from p1+pos; jump shrinks p2 (:49,112)', () => {
    const n = TextNavigator.build('hello');
    const r = n.reverse(3);
    expect(r.toString()).toBe('leh');
    r.jump(1);
    expect(r.toString()).toBe('eh');
    expect(() => r.reverse(0)).toThrow('IllegalStateException');
    n.jump(1);
    expect(n.reverse(2).toString()).toBe('leh');
  });
  it('subSequence forward and reversed (:86)', () => {
    const n = TextNavigator.build('hello');
    expect(n.subSequence(1, 3).toString()).toBe('el');
    n.jump(1);
    expect(n.subSequence(1, 3).toString()).toBe('ll');
    const r = TextNavigator.build('hello').reverse(5);
    expect(r.toString()).toBe('olleh');
    expect(r.subSequence(1, 3).toString()).toBe('ll');
    expect(() => n.subSequence(2, 1)).toThrow('subSequence(2, 1) out of bounds for length 4');
    expect(() => n.subSequence(-1, 1)).toThrow(RangeError);
    expect(() => n.subSequence(0, 9)).toThrow(RangeError);
  });
  it('constructor rejects p2 < p1 (:69)', () => {
    expect(() => TextNavigator.build('abc').reverse(-1)).toThrow('IllegalArgumentException');
  });
  it('indexOf (:78)', () => {
    const n = TextNavigator.build('abcb');
    expect(n.indexOf('b')).toBe(1);
    expect(n.indexOf('z')).toBe(-1);
  });
  it('startsWith/search (:119,127)', () => {
    const n = TextNavigator.build('abcabc');
    expect(n.startsWith('bc', 1)).toBe(true);
    expect(n.startsWith('bd', 1)).toBe(false);
    expect(() => n.startsWith('cc', 5)).toThrow(RangeError);
    expect(n.search('ca', 0)).toBe(2);
    expect(n.search('bc', 2)).toBe(4);
    expect(n.search('zz', 0)).toBe(-1);
  });
  it('searchPattern returns first matching position else Challenge.NO_MATCH (:134)', () => {
    const n = TextNavigator.build('aab');
    const c: Challenge = {
      runChallenge: (nav, pos) => (nav.charAt(pos) === 'b' ? ChallengeResult.ONE : ChallengeResult.NO_MATCH),
    };
    expect(n.searchPattern(c, 0)).toBe(2);
    expect(n.searchPattern(c, 3)).toBe(Challenge.NO_MATCH);
  });
  it('wraps a navigator as content and csLength/csCharAt helpers', () => {
    const inner = TextNavigator.build('xyz');
    const outer = TextNavigator.build(inner);
    expect(outer.toString()).toBe('xyz');
    expect(csLength('ab')).toBe(2);
    expect(csLength(inner)).toBe(3);
    expect(csCharAt('ab', 1)).toBe('b');
    expect(() => csCharAt('ab', 2)).toThrow('Index 2 out of bounds for length 2');
  });
  it('indexes are UTF-16 code units', () => {
    const n = TextNavigator.build('a\u{1F600}b');
    expect(n.length()).toBe(4);
    expect(n.charAt(3)).toBe('b');
  });
});
