/**
 * DarkString — the regular/dark value pair behind every `ValueImpl`.
 * Branches pinned against `DarkString.java:50-79`; the regular+dark
 * combination is additionally jar-probed (see the ValueImpl test).
 */
import { describe, expect, it } from 'vitest';
import { DarkString } from '../../../../src/core/style/DarkString.js';

describe('DarkString', () => {
  describe('mergeWith', () => {
    it('returns this for an undefined other (DarkString.java:51-52, Java null)', () => {
      const a = new DarkString('red', null, 3);
      expect(a.mergeWith(undefined)).toBe(a);
    });

    it('two regular values: the strictly higher priority wins (java:54-57, isBigger a > b at :78)', () => {
      const low = new DarkString('red', null, 1);
      const high = new DarkString('blue', null, 2);
      expect(low.mergeWith(high)).toBe(high);
      expect(high.mergeWith(low)).toBe(high);
    });

    it('two regular values of equal priority: other wins (isBigger is strict, java:78)', () => {
      const a = new DarkString('red', null, 5);
      const b = new DarkString('blue', null, 5);
      expect(a.mergeWith(b)).toBe(b);
      expect(b.mergeWith(a)).toBe(a);
    });

    it('two dark values: the higher priority wins (java:54 second disjunct)', () => {
      const low = new DarkString(null, 'red', 1);
      const high = new DarkString(null, 'blue', 2);
      expect(low.mergeWith(high)).toBe(high);
    });

    it('regular this + dark other: combines, keeping this priority (java:59-60)', () => {
      const merged = new DarkString('red', null, 1).mergeWith(new DarkString(null, 'blue', 9));
      expect([merged.getValue1(), merged.getValue2(), merged.getPriority()]).toEqual(['red', 'blue', 1]);
    });

    it('dark this + regular other: combines, keeping other priority (java:61-62)', () => {
      const merged = new DarkString(null, 'blue', 9).mergeWith(new DarkString('red', null, 1));
      expect([merged.getValue1(), merged.getValue2(), merged.getPriority()]).toEqual(['red', 'blue', 1]);
    });

    it('a full pair against a regular value falls through to priority (java:64-66)', () => {
      const pair = new DarkString('red', 'blue', 4);
      const regular = new DarkString('green', null, 7);
      expect(pair.mergeWith(regular)).toBe(regular);
      expect(regular.mergeWith(pair)).toBe(regular);
    });
  });

  it('addPriority adds delta to the priority, keeping both strings (java:81-83)', () => {
    const shifted = new DarkString('red', 'blue', 3).addPriority(1000);
    expect([shifted.getValue1(), shifted.getValue2(), shifted.getPriority()]).toEqual(['red', 'blue', 1003]);
  });

  it('toString is value1/value2 (priority), nulls printed as "null" (java:86-88)', () => {
    expect(new DarkString('red', null, 3).toString()).toBe('red/null (3)');
    expect(new DarkString(null, 'blue', 4).toString()).toBe('null/blue (4)');
  });
});
