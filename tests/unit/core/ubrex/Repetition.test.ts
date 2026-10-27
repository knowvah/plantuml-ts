import { describe, expect, it } from 'vitest';
import { Repetition } from '../../../../src/core/ubrex/Repetition.js';
import { TextNavigator } from '../../../../src/core/ubrex/TextNavigator.js';

const parse = (s: string): [Repetition, TextNavigator] => {
  const nav = TextNavigator.build(s);
  return [Repetition.parse(nav), nav];
};

describe('Repetition (Repetition.java)', () => {
  it('exact values, consuming through "}" (:46-62)', () => {
    const [r, nav] = parse('3}rest');
    expect(nav.toString()).toBe('rest');
    expect(r.toString()).toBe('[3]');
    expect(r.match(3)).toBe(true);
    expect(r.match(2)).toBe(false);
    expect(r.match(4)).toBe(false);
  });
  it('";" separated, toString sorted like a TreeSet (:89)', () => {
    const [r] = parse('7;2;5}');
    expect(r.toString()).toBe('[2, 5, 7]');
    expect(r.match(5)).toBe(true);
    expect(r.match(6)).toBe(false);
  });
  it('ranges "a-b" inclusive (:70-75)', () => {
    const [r] = parse('2-4}');
    expect(r.toString()).toBe('[2, 3, 4]');
    expect(r.match(1)).toBe(false);
    expect(r.match(4)).toBe(true);
    expect(r.match(5)).toBe(false);
  });
  it('open-ended "n+" sets minInclusive (:66-69,93-96)', () => {
    const [r] = parse('1;3+}');
    expect(r.match(0)).toBe(false);
    expect(r.match(1)).toBe(true);
    expect(r.match(2)).toBe(false);
    expect(r.match(3)).toBe(true);
    expect(r.match(1000)).toBe(true);
    expect(r.toString()).toBe('[1]');
  });
  it('empty token throws (:65)', () => {
    expect(() => parse('}')).toThrow('empty repetition token');
    expect(() => parse('1;}')).toThrow('empty repetition token');
  });
  it('bad numbers throw like Integer.parseInt', () => {
    expect(() => parse('a}')).toThrow('For input string: "a"');
    expect(() => parse('99999999999}')).toThrow('For input string');
    expect(() => parse('-5}')).toThrow('For input string: ""');
  });
  it('unterminated input runs off the end (charAt throws)', () => {
    expect(() => parse('1;2')).toThrow(RangeError);
  });
});
