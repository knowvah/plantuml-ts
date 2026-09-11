import { describe, it, expect } from 'vitest';
import { arrowDirection, arrowHeadExtents, arrowHeadPoints } from '../../../src/diagrams/activity/arrows-regular.js';

// ---------------------------------------------------------------------------
// arrowHeadPoints — the four ArrowsRegular.java methods, point order
// preserved exactly (ArrowsRegular.java:46-84, delta1=10, delta2=4)
// ---------------------------------------------------------------------------

describe('arrowHeadPoints', () => {
  it('asToUp: (-4,10), (0,0), (4,10), (0,6) -- ArrowsRegular.java:47-54', () => {
    expect(arrowHeadPoints('up')).toEqual([
      { x: -4, y: 10 },
      { x: 0, y: 0 },
      { x: 4, y: 10 },
      { x: 0, y: 6 },
    ]);
  });

  it('asToDown: (-4,-10), (0,0), (4,-10), (0,-6) -- ArrowsRegular.java:56-64', () => {
    expect(arrowHeadPoints('down')).toEqual([
      { x: -4, y: -10 },
      { x: 0, y: 0 },
      { x: 4, y: -10 },
      { x: 0, y: -6 },
    ]);
  });

  it('asToRight: (-10,-4), (0,0), (-10,4), (-6,0) -- ArrowsRegular.java:66-74', () => {
    expect(arrowHeadPoints('right')).toEqual([
      { x: -10, y: -4 },
      { x: 0, y: 0 },
      { x: -10, y: 4 },
      { x: -6, y: 0 },
    ]);
  });

  it('asToLeft: (10,-4), (0,0), (10,4), (6,0) -- ArrowsRegular.java:76-84', () => {
    expect(arrowHeadPoints('left')).toEqual([
      { x: 10, y: -4 },
      { x: 0, y: 0 },
      { x: 10, y: 4 },
      { x: 6, y: 0 },
    ]);
  });
});

// ---------------------------------------------------------------------------
// arrowHeadExtents — min/max over the four points, relative to the tip
// ---------------------------------------------------------------------------

describe('arrowHeadExtents', () => {
  it('down: x in [-4,4], y in [-10,0] (tip at y=0 is the max)', () => {
    expect(arrowHeadExtents('down')).toEqual({ minX: -4, maxX: 4, minY: -10, maxY: 0 });
  });

  it('up: x in [-4,4], y in [0,10]', () => {
    expect(arrowHeadExtents('up')).toEqual({ minX: -4, maxX: 4, minY: 0, maxY: 10 });
  });

  it('right: x in [-10,0], y in [-4,4]', () => {
    expect(arrowHeadExtents('right')).toEqual({ minX: -10, maxX: 0, minY: -4, maxY: 4 });
  });

  it('left: x in [0,10], y in [-4,4]', () => {
    expect(arrowHeadExtents('left')).toEqual({ minX: 0, maxX: 10, minY: -4, maxY: 4 });
  });
});

// ---------------------------------------------------------------------------
// arrowDirection — Direction.fromVector (utils/Direction.java:110-128)
// ---------------------------------------------------------------------------

describe('arrowDirection', () => {
  it('x1 == x2, y2 > y1 -> down (Direction.java:118-120)', () => {
    expect(arrowDirection(0, 20)).toBe('down');
  });

  it('x1 == x2, y2 < y1 -> up (Direction.java:118-121)', () => {
    expect(arrowDirection(0, -20)).toBe('up');
  });

  it('y1 == y2, x2 > x1 -> right (Direction.java:123-125)', () => {
    expect(arrowDirection(20, 0)).toBe('right');
  });

  it('y1 == y2, x2 < x1 -> left (Direction.java:123-126)', () => {
    expect(arrowDirection(-20, 0)).toBe('left');
  });

  // Divergence from Direction.java:128's `throw new
  // IllegalArgumentException("Not a H or V line!")`: upstream never calls
  // fromVector on a diagonal segment because every Worm segment is
  // axis-aligned by construction. Our edges are not always axis-aligned
  // (nomeco-93-minu967's out-edge runs (208.638,164) -> (218.638,184), a
  // dx=10, dy=20 diagonal), so this picks the dominant axis instead of
  // throwing, with ties going vertical.
  describe('diagonal (divergence from the Direction.java:128 throw)', () => {
    it('|dy| > |dx| picks the dominant vertical axis, down', () => {
      expect(arrowDirection(10, 20)).toBe('down');
    });

    it('|dy| > |dx| picks the dominant vertical axis, up', () => {
      expect(arrowDirection(10, -20)).toBe('up');
    });

    it('|dx| > |dy| picks the dominant horizontal axis, right', () => {
      expect(arrowDirection(20, 10)).toBe('right');
    });

    it('|dx| > |dy| picks the dominant horizontal axis, left', () => {
      expect(arrowDirection(-20, 10)).toBe('left');
    });

    it('a tie (|dx| == |dy|) goes vertical, down', () => {
      expect(arrowDirection(10, 10)).toBe('down');
    });

    it('a tie (|dx| == |dy|) goes vertical, up', () => {
      expect(arrowDirection(10, -10)).toBe('up');
    });
  });

  // Divergence from Direction.java:115-116's `return null` on a zero
  // vector: this port is total, and returns 'down'. The renderer's
  // arrowTip already refuses to draw on a zero-length segment before
  // calling arrowDirection, so this value is never read for a real
  // polygon (renderer.ts#arrowTip's `dx === 0 && dy === 0` guard).
  it('a zero vector returns down rather than upstream\'s null', () => {
    expect(arrowDirection(0, 0)).toBe('down');
  });
});
