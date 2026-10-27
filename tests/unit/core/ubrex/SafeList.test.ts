import { describe, expect, it } from 'vitest';
import { SafeList } from '../../../../src/core/ubrex/SafeList.js';

const of = (...xs: string[]): SafeList<string> => xs.reduce((l, x) => l.add(x), SafeList.createEmpty<string>());

describe('SafeList (SafeList.java)', () => {
  it('createEmpty returns the shared EMPTY (SafeList.java:45,70)', () => {
    expect(SafeList.createEmpty<string>()).toBe(SafeList.createEmpty<number>());
  });

  it('iterates in insertion order and empty iterates nothing (:138)', () => {
    expect([...of('a', 'b', 'c')]).toEqual(['a', 'b', 'c']);
    expect([...SafeList.createEmpty<string>()]).toEqual([]);
  });

  it('mapped transforms every element and leaves the source intact (:79)', () => {
    const src = of('a', 'b');
    const out = src.mapped((s) => s.toUpperCase());
    expect([...out]).toEqual(['A', 'B']);
    expect(out.size()).toBe(2);
    expect([...src]).toEqual(['a', 'b']);
    expect(out.add('c').toString()).toBe('[A, B, c]');
  });

  it('mapped on empty returns this (:80)', () => {
    const e = SafeList.createEmpty<string>();
    expect(e.mapped((s) => s + '!')).toBe(e);
  });

  it('addAll shortcuts: empty other, empty this, singleton other (:153)', () => {
    const abc = of('a', 'b', 'c');
    expect(abc.addAll(SafeList.createEmpty())).toBe(abc);
    expect(SafeList.createEmpty<string>().addAll(abc)).toBe(abc);
    expect(abc.addAll(of('z')).toString()).toBe('[a, b, c, z]');
  });

  it('addAll with a singleton block from mapped takes data2[0]', () => {
    const one = of('q').mapped((s) => s + s);
    expect(of('a').addAll(one).toString()).toBe('[a, qq]');
  });

  it('chains of blocks and singles materialise in order', () => {
    const block = of('x', 'y').mapped((s) => s + '1');
    const l = of('a').addAll(block).add('b').addAll(of('c', 'd'));
    expect(l.size()).toBe(6);
    expect(l.toString()).toBe('[a, x1, y1, b, c, d]');
    expect([...l]).toEqual(['a', 'x1', 'y1', 'b', 'c', 'd']);
  });
});
