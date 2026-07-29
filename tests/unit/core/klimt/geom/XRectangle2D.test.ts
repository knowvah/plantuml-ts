/**
 * XRectangle2D.test.ts — T7: unit coverage for `XRectangle2D`
 * (klimt/geom/XRectangle2D.java), the immutable axis-aligned rectangle
 * `SheetBlock1`/`SheetBlock2#getInnerPosition` return. T7b adds
 * `#intersect(XLine2D)` coverage (reinstated after T7 wrongly dropped it).
 */
import { describe, expect, it } from 'vitest';
import { XRectangle2D } from '../../../../../src/core/klimt/geom/XRectangle2D.js';
import { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import { XLine2D } from '../../../../../src/core/klimt/geom/XLine2D.js';

describe('XRectangle2D — construction and accessors', () => {
  it('exposes x/y/width/height via fields and getters', () => {
    const r = new XRectangle2D(10, 20, 30, 40);
    expect(r.x).toBe(10);
    expect(r.y).toBe(20);
    expect(r.width).toBe(30);
    expect(r.height).toBe(40);
    expect(r.getX()).toBe(10);
    expect(r.getY()).toBe(20);
    expect(r.getWidth()).toBe(30);
    expect(r.getHeight()).toBe(40);
  });

  it('getCenterX/getCenterY compute x + width/2, y + height/2', () => {
    const r = new XRectangle2D(10, 20, 30, 40);
    expect(r.getCenterX()).toBe(25);
    expect(r.getCenterY()).toBe(40);
  });

  it('getMinX/getMaxX/getMinY/getMaxY bound the rectangle', () => {
    const r = new XRectangle2D(10, 20, 30, 40);
    expect(r.getMinX()).toBe(10);
    expect(r.getMaxX()).toBe(40);
    expect(r.getMinY()).toBe(20);
    expect(r.getMaxY()).toBe(60);
  });
});

describe('XRectangle2D#intersects', () => {
  it('returns true for overlapping rectangles', () => {
    const a = new XRectangle2D(0, 0, 10, 10);
    const b = new XRectangle2D(5, 5, 10, 10);
    expect(a.intersects(b)).toBe(true);
  });

  it('returns false for disjoint rectangles', () => {
    const a = new XRectangle2D(0, 0, 10, 10);
    const b = new XRectangle2D(20, 20, 10, 10);
    expect(a.intersects(b)).toBe(false);
  });

  it('returns false when either rectangle has zero width/height', () => {
    const zeroWidth = new XRectangle2D(0, 0, 0, 10);
    const normal = new XRectangle2D(0, 0, 10, 10);
    expect(zeroWidth.intersects(normal)).toBe(false);
    expect(normal.intersects(zeroWidth)).toBe(false);
  });

  it('returns false for edge-touching rectangles (strict inequality)', () => {
    const a = new XRectangle2D(0, 0, 10, 10);
    const b = new XRectangle2D(10, 0, 10, 10);
    expect(a.intersects(b)).toBe(false);
  });
});

describe('XRectangle2D#contains(x, y)', () => {
  it('returns true for a point strictly inside, including the min edges', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    expect(r.contains(0, 0)).toBe(true);
    expect(r.contains(5, 5)).toBe(true);
  });

  it('returns false for the max edges (upstream: xp < getMaxX, yp < getMaxY)', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    expect(r.contains(10, 5)).toBe(false);
    expect(r.contains(5, 10)).toBe(false);
  });

  it('throws when width or height is non-positive (Java IllegalStateException)', () => {
    const degenerate = new XRectangle2D(0, 0, 0, 10);
    expect(() => degenerate.contains(0, 0)).toThrow('IllegalStateException');
  });
});

describe('XRectangle2D#contains(XPoint2D) — upstream stub', () => {
  it('throws, matching the Java UnsupportedOperationException stub', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    expect(() => r.contains(new XPoint2D(1, 1))).toThrow('UnsupportedOperationException');
  });
});

describe('XRectangle2D#intersect(XLine2D)', () => {
  it('returns the crossing point on the first edge (in a-b/b-c/c-d/d-a order) the line meets', () => {
    // Rectangle (0,0,10,10) has corners a=(0,0) b=(10,0) c=(10,10) d=(0,10).
    // A horizontal line y=5 spanning x=-5..15 crosses edge d-a (left, x=0)
    // at (0,5) AND edge b-c (right, x=10) at (10,5); upstream checks
    // a-b, b-c, c-d, d-a in that order and returns on the first hit -- b-c.
    const r = new XRectangle2D(0, 0, 10, 10);
    const line = new XLine2D(-5, 5, 15, 5);
    expect(r.intersect(line)).toEqual(new XPoint2D(10, 5));
  });

  it('returns undefined when the line segment never meets any of the four edges', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    const line = new XLine2D(20, 20, 30, 30);
    expect(r.intersect(line)).toBeUndefined();
  });

  it('returns the crossing point on edge a-b (top) when it is the first edge hit', () => {
    // Vertical line x=5 spanning the full rectangle height crosses both
    // the top (a-b) and bottom (c-d) edges; a-b is checked first.
    const r = new XRectangle2D(0, 0, 10, 10);
    const line = new XLine2D(5, -5, 5, 15);
    expect(r.intersect(line)).toEqual(new XPoint2D(5, 0));
  });

  it('returns the crossing point on edge c-d (bottom) when a-b/b-c miss', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    const line = new XLine2D(5, 8, 5, 12);
    expect(r.intersect(line)).toEqual(new XPoint2D(5, 10));
  });

  it('returns the crossing point on edge d-a (left) when a-b/b-c/c-d all miss', () => {
    const r = new XRectangle2D(0, 0, 10, 10);
    const line = new XLine2D(-2, 5, 0, 5);
    expect(r.intersect(line)).toEqual(new XPoint2D(0, 5));
  });
});
