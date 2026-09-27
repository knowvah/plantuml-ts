/**
 * cdd3-T32: `javaHashSetOrder` against orders printed by a real JDK 21
 * `HashSet<P>` whose `P` copies `klimt/geom/XPoint2D.java:24-32`'s
 * `equals`/`hashCode` (`Double.valueOf(x).hashCode() +
 * Double.valueOf(y).hashCode()`). Each expected array is the index into the
 * input list of every element in `for (P p : set)` order.
 */
import { describe, it, expect } from 'vitest';
import { javaDoubleHashCode, javaHashSetOrder } from '../../../src/core/java-hash-set.js';

interface P {
  x: number;
  y: number;
}
const hash = (p: P): number => (javaDoubleHashCode(p.x) + javaDoubleHashCode(p.y)) | 0;
const eq = (a: P, b: P): boolean => a.x === b.x && a.y === b.y;
const order = (input: readonly P[]): number[] => javaHashSetOrder(input, hash, eq).map((p) => input.indexOf(p));

describe('javaDoubleHashCode — Double.hashCode (Double.java:1038-1040)', () => {
  it('matches the JDK for a plain value, -0.0 and NaN', () => {
    expect(javaDoubleHashCode(215.59)).toBe(130344602);
    expect(javaDoubleHashCode(-0)).toBe(-2147483648);
    expect(javaDoubleHashCode(Number.NaN)).toBe(2146959360);
  });
});

describe('javaHashSetOrder — HashMap putVal/resize/treeifyBin replay', () => {
  it('orders three points by bucket, not by insertion', () => {
    const input = [
      { x: 222.588, y: 203 },
      { x: 285.697, y: 203 },
      { x: 257.1, y: 160 },
    ];
    expect(order(input)).toEqual([1, 0, 2]);
  });

  it('replays the load-factor resizes (30 keys) and drops an equal duplicate', () => {
    const input = Array.from({ length: 30 }, (_, i) => ({ x: i * 1.5, y: 7 - i * 0.25 }));
    input.push({ x: 0, y: 7 });
    expect(order(input)).toEqual([
      10, 15, 16, 11, 13, 14, 12, 28, 1, 27, 29, 0, 2, 26, 25, 3, 4, 24, 5, 23, 6, 22, 7, 21, 8, 9, 19, 20, 17, 18,
    ]);
  });

  it('replays the small-table treeifyBin resize (10 keys in bucket 0 of 16)', () => {
    // Size 10 never passes the 12-key threshold: only `treeifyBin`'s
    // `tab.length < MIN_TREEIFY_CAPACITY` resize (on the 9th key) splits it.
    const input = [1, 2, 4, 8, 16, 32, 33, 64, 65, 66].map((x) => ({ x, y: 0 }));
    expect(order(input)).toEqual([1, 3, 5, 6, 0, 2, 4, 7, 8, 9]);
  });
});
