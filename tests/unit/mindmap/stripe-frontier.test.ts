/**
 * `Stripe` (an x-range holding one y value) and `StripeFrontier` (the
 * sorted, non-overlapping partition of the x-axis `Tetris` packs against).
 * Both are pure collision/interval algorithms with no jar-specific
 * geometry, so these fixtures are hand-derived by tracing
 * `StripeFrontier.java`'s own `addSegment`/`collisionning`/`getContact`
 * methods rather than probed — the mechanism, not a rendered value, is
 * what is under test.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/Stripe.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/mindmap/StripeFrontier.java
 */
import { describe, it, expect } from 'vitest';
import { Stripe } from '../../../src/diagrams/mindmap/Stripe.js';
import { StripeFrontier } from '../../../src/diagrams/mindmap/StripeFrontier.js';

describe('Stripe', () => {
  it('throws when x2 <= x1 (Stripe.java:49-58)', () => {
    expect(() => new Stripe(5, 5, 0)).toThrow();
    expect(() => new Stripe(5, 4, 0)).toThrow();
  });

  it('contains is inclusive of both endpoints (:60-62)', () => {
    const s = new Stripe(0, 10, 3);
    expect(s.contains(0)).toBe(true);
    expect(s.contains(10)).toBe(true);
    expect(s.contains(5)).toBe(true);
    expect(s.contains(-0.001)).toBe(false);
    expect(s.contains(10.001)).toBe(false);
  });

  it('compareTo orders by start x only (:64-66)', () => {
    const a = new Stripe(0, 5, 1);
    const b = new Stripe(5, 10, 1);
    expect(a.compareTo(b)).toBeLessThan(0);
    expect(b.compareTo(a)).toBeGreaterThan(0);
    expect(a.compareTo(a)).toBe(0);
  });

  it('getStart/getEnd/getValue return the constructor arguments (:68-78)', () => {
    const s = new Stripe(1, 2, 3);
    expect(s.getStart()).toBe(1);
    expect(s.getEnd()).toBe(2);
    expect(s.getValue()).toBe(3);
  });
});

describe('StripeFrontier', () => {
  it('starts non-empty per isEmpty() (one sentinel stripe; :48-54)', () => {
    // isEmpty() means "no real segment has been added yet" (stripes.size()
    // == 1, i.e. just the sentinel) — the name refers to real content, not
    // the underlying array.
    expect(new StripeFrontier().isEmpty()).toBe(true);
  });

  it('contains() against the untouched sentinel, value -Number.MAX_VALUE (:48-50, 61-67)', () => {
    const f = new StripeFrontier();
    // Any finite y is above the sentinel's -MAX_VALUE floor.
    expect(f.contains(0, 0)).toBe(false);
    // Only -MAX_VALUE itself is <= the sentinel's own value.
    expect(f.contains(0, -Number.MAX_VALUE)).toBe(true);
  });

  it('getContact() against the untouched sentinel returns -Number.MAX_VALUE (:69-77)', () => {
    expect(new StripeFrontier().getContact(-5, 5)).toBe(-Number.MAX_VALUE);
  });

  it('addSegment() throws when x2 <= x1 (:79-84)', () => {
    const f = new StripeFrontier();
    expect(() => f.addSegment(5, 5, 1)).toThrow();
    expect(() => f.addSegment(5, 4, 1)).toThrow();
  });

  it('addSegment() raises the frontier under [x1, x2] and leaves the rest at the sentinel (:79-121)', () => {
    const f = new StripeFrontier();
    f.addSegment(0, 10, 5);
    expect(f.isEmpty()).toBe(false);
    expect(f.getContact(0, 10)).toBe(5);
    // Outside the segment, still the untouched sentinel.
    expect(f.getContact(-5, 0)).toBe(-Number.MAX_VALUE);
    expect(f.getContact(10, 20)).toBe(-Number.MAX_VALUE);
  });

  it('addSegment() at or below the existing value is a no-op (addSingleInternal, :107-109)', () => {
    const f = new StripeFrontier();
    f.addSegment(0, 10, 5);
    f.addSegment(0, 10, 5); // equal value: <=, no change
    f.addSegment(2, 8, 3); // lower value: <=, no change
    expect(f.getContact(0, 10)).toBe(5);
  });

  it('addSegment() spanning multiple existing stripes splits and recurses (:86-95)', () => {
    // Traced by hand against StripeFrontier.java's own addSegment:
    // after addSegment(0,10,5), stripes are
    //   (-MAX,0,-MAX) (0,10,5) (10,MAX,-MAX)
    // addSegment(5,15,3) collides with (0,10,5) and (10,MAX,-MAX):
    //   sub-call addSegment(5,10,3) touches (0,10,5) only; 3 <= 5, no-op.
    //   sub-call addSegment(10,15,3) touches (10,MAX,-MAX) only; 3 > -MAX,
    //     raises it to (10,15,3) (10,MAX,-MAX) -> (10,15,3) + (15,MAX,-MAX).
    const f = new StripeFrontier();
    f.addSegment(0, 10, 5);
    f.addSegment(5, 15, 3);
    expect(f.getContact(0, 10)).toBe(5); // unchanged: 3 never beat 5 here
    expect(f.getContact(10, 15)).toBe(3);
    // getContact spanning the new stripe and the sentinel beyond it takes
    // the max of both collisions.
    expect(f.getContact(12, 20)).toBe(3);
  });

  it('addSegment() split at a shared boundary keeps three-way splits exact (:107-121)', () => {
    // A second, narrower raise strictly inside an already-raised stripe:
    // three-way split of (0,10,5) into (0,3,5) (3,7,9) (7,10,5).
    const f = new StripeFrontier();
    f.addSegment(0, 10, 5);
    f.addSegment(3, 7, 9);
    expect(f.getContact(0, 3)).toBe(5);
    expect(f.getContact(3, 7)).toBe(9);
    expect(f.getContact(7, 10)).toBe(5);
    // A collision spanning the boundary sees both values, keeps the max.
    expect(f.getContact(1, 5)).toBe(9);
  });
});
