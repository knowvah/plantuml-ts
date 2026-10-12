/**
 * `salt/element/Segment.java` — the (row, col) value `Grid` keys its
 * horizontal/vertical `HashSet`s on (java:43-65).
 */
import { describe, expect, it } from 'vitest';
import { Segment } from '../../../../src/diagrams/salt/element/Segment.js';

describe('Segment (Segment.java:43-65)', () => {
  it('exposes row and col', () => {
    const s = new Segment(3, 7);
    expect(s.getRow()).toBe(3);
    expect(s.getCol()).toBe(7);
  });

  it('hashCode is row * 47 + col (java:49-51)', () => {
    expect(new Segment(0, 0).hashCode()).toBe(0);
    expect(new Segment(2, 5).hashCode()).toBe(99);
    expect(new Segment(1, 0).hashCode()).toBe(47);
  });

  it('equals compares row and col (java:54-57)', () => {
    expect(new Segment(2, 5).equals(new Segment(2, 5))).toBe(true);
    expect(new Segment(2, 5).equals(new Segment(5, 2))).toBe(false);
    expect(new Segment(2, 5).equals(new Segment(2, 6))).toBe(false);
  });

  it('distinct segments may share a hashCode yet stay unequal', () => {
    // 0*47+47 === 1*47+0: the hash collides, equals still tells them apart.
    const a = new Segment(0, 47);
    const b = new Segment(1, 0);
    expect(a.hashCode()).toBe(b.hashCode());
    expect(a.equals(b)).toBe(false);
  });
});
