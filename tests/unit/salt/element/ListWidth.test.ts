/**
 * `salt/element/ListWidth.java` — the per-column width list `ElementTree`
 * merges across rows (java:44-80).
 */
import { describe, expect, it } from 'vitest';
import { ListWidth } from '../../../../src/diagrams/salt/element/ListWidth.js';

function of(...widths: number[]): ListWidth {
  const result = new ListWidth();
  for (const w of widths) result.add(w);
  return result;
}

function toArray(lw: ListWidth): number[] {
  const out: number[] = [];
  const it = lw.iterator();
  for (let r = it.next(); r.done !== true; r = it.next()) out.push(r.value);
  return out;
}

describe('ListWidth.iterator (java:78-80)', () => {
  it('yields widths in insertion order', () => {
    expect(toArray(of(3, 1, 2))).toEqual([3, 1, 2]);
  });

  it('is empty for a fresh ListWidth', () => {
    expect(toArray(new ListWidth())).toEqual([]);
  });
});

describe('ListWidth.mergeMax (java:50-58)', () => {
  it('takes the per-index max, padding the shorter list with 0', () => {
    expect(toArray(of(10, 5).mergeMax(of(4, 8, 6)))).toEqual([10, 8, 6]);
    expect(toArray(of(4, 8, 6).mergeMax(of(10, 5)))).toEqual([10, 8, 6]);
  });

  it('returns a new list and leaves both operands untouched', () => {
    const a = of(1);
    const b = of(2);
    const merged = a.mergeMax(b);
    expect(merged).not.toBe(a);
    expect(toArray(a)).toEqual([1]);
    expect(toArray(b)).toEqual([2]);
  });

  it('of two empty lists is empty', () => {
    expect(toArray(new ListWidth().mergeMax(new ListWidth()))).toEqual([]);
  });
});

describe('ListWidth.getTotalWidthWithMargin (java:67-76)', () => {
  it('sums the widths with one margin between each', () => {
    expect(of(10, 20, 30).getTotalWidthWithMargin(5)).toBe(70);
  });

  it('is 0 for an empty list', () => {
    expect(new ListWidth().getTotalWidthWithMargin(5)).toBe(0);
  });

  it('adds no margin until the running total is positive (java:70 `result > 0`)', () => {
    // Leading zero widths keep result at 0, so no margin is inserted for them.
    expect(of(0, 0, 10, 20).getTotalWidthWithMargin(5)).toBe(35);
    // A zero width AFTER a positive one still costs a margin.
    expect(of(10, 0, 20).getTotalWidthWithMargin(5)).toBe(40);
  });
});
