/**
 * XLine2D.test.ts — T7b: unit coverage for `XLine2D`
 * (klimt/geom/XLine2D.java), the immutable line segment type reinstated
 * for `XRectangle2D#intersect(XLine2D)`.
 */
import { describe, expect, it } from 'vitest';
import type { UChange } from '../../../../../src/core/klimt/UChange.js';
import type { UGraphic } from '../../../../../src/core/klimt/UGraphic.js';
import type { UParam } from '../../../../../src/core/klimt/UParam.js';
import type { UShape } from '../../../../../src/core/klimt/UShape.js';
import type { StringBounder } from '../../../../../src/core/klimt/font/StringBounder.js';
import { UTranslate } from '../../../../../src/core/klimt/UTranslate.js';
import { ULine } from '../../../../../src/core/klimt/shape/ULine.js';
import { XPoint2D } from '../../../../../src/core/klimt/geom/XPoint2D.js';
import { XLine2D } from '../../../../../src/core/klimt/geom/XLine2D.js';

describe('XLine2D — construction and accessors', () => {
  it('exposes x1/y1/x2/y2 via fields and getters', () => {
    const l = new XLine2D(1, 2, 3, 4);
    expect(l.x1).toBe(1);
    expect(l.y1).toBe(2);
    expect(l.x2).toBe(3);
    expect(l.y2).toBe(4);
    expect(l.getX1()).toBe(1);
    expect(l.getY1()).toBe(2);
    expect(l.getX2()).toBe(3);
    expect(l.getY2()).toBe(4);
  });

  it('line(p1, p2) builds the same segment as the 4-arg constructor', () => {
    const l = XLine2D.line(new XPoint2D(1, 2), new XPoint2D(3, 4));
    expect(l).toEqual(new XLine2D(1, 2, 3, 4));
  });

  it('getP1/getP2 return XPoint2D endpoints', () => {
    const l = new XLine2D(1, 2, 3, 4);
    expect(l.getP1()).toEqual(new XPoint2D(1, 2));
    expect(l.getP2()).toEqual(new XPoint2D(3, 4));
  });

  it('getMiddle returns the segment midpoint', () => {
    const l = new XLine2D(2, 4, 8, 10);
    expect(l.getMiddle()).toEqual(new XPoint2D(5, 7));
  });

  it('withPoint1/withPoint2 replace one endpoint, leaving the other fixed', () => {
    const l = new XLine2D(0, 0, 10, 10);
    expect(l.withPoint1(new XPoint2D(5, 5))).toEqual(new XLine2D(5, 5, 10, 10));
    expect(l.withPoint2(new XPoint2D(5, 5))).toEqual(new XLine2D(0, 0, 5, 5));
  });

  it('getAngle returns atan2(y2-y1, x2-x1)', () => {
    const l = new XLine2D(0, 0, 1, 1);
    expect(l.getAngle()).toBeCloseTo(Math.PI / 4, 10);
  });
});

describe('XLine2D.ptSegDistSq', () => {
  it('returns 0 for a point on the segment', () => {
    expect(XLine2D.ptSegDistSq(0, 0, 10, 0, 5, 0)).toBe(0);
  });

  it('returns the perpendicular squared distance for a point over the segment interior', () => {
    // Segment (0,0)-(10,0); point (5,5) projects onto (5,0) -> distSq = 25.
    expect(XLine2D.ptSegDistSq(0, 0, 10, 0, 5, 5)).toBe(25);
  });

  it('returns the squared distance to the nearest endpoint when the projection falls outside the segment', () => {
    // Segment (0,0)-(10,0); point (-5,0) is beyond the (0,0) endpoint.
    expect(XLine2D.ptSegDistSq(0, 0, 10, 0, -5, 0)).toBe(25);
    // Point (15,0) is beyond the (10,0) endpoint.
    expect(XLine2D.ptSegDistSq(0, 0, 10, 0, 15, 0)).toBe(25);
  });

  it('clamps a negative lenSq from floating-point cancellation to 0 (Java:125-127)', () => {
    // Large-magnitude, exactly-on-segment coordinates where the projected
    // distance computation cancels to a tiny negative double instead of
    // exact 0 -- exercises the defensive `if (lenSq < 0) lenSq = 0` clamp
    // that is otherwise unreachable under exact arithmetic.
    const distSq = XLine2D.ptSegDistSq(
      133359639683739.88,
      451136115787056.25,
      205342173913424.56,
      507752235562915.5,
      196576833119326.94,
      500858068948950.9,
    );
    expect(distSq).toBe(0);
  });
});

describe('XLine2D#intersect', () => {
  it('returns the crossing point for two segments that cross in their interiors', () => {
    // (0,0)-(10,10) crosses (0,10)-(10,0) at (5,5).
    const a = new XLine2D(0, 0, 10, 10);
    const b = new XLine2D(0, 10, 10, 0);
    expect(a.intersect(b)).toEqual(new XPoint2D(5, 5));
  });

  it('returns undefined for parallel, non-collinear segments', () => {
    const a = new XLine2D(0, 0, 10, 0);
    const b = new XLine2D(0, 5, 10, 5);
    expect(a.intersect(b)).toBeUndefined();
  });

  it('returns undefined when the infinite lines cross outside either segment range', () => {
    // Segment A: (0,0)-(10,0). Segment B: (20,-5)-(20,5) — B's infinite
    // line crosses A's infinite line at x=20, which is beyond A's [0,10]
    // extent, so the finite segments do not meet.
    const a = new XLine2D(0, 0, 10, 0);
    const b = new XLine2D(20, -5, 20, 5);
    expect(a.intersect(b)).toBeUndefined();
  });

  it('returns the shared endpoint when two segments touch exactly at an endpoint', () => {
    const a = new XLine2D(0, 0, 10, 0);
    const b = new XLine2D(10, 0, 10, 10);
    expect(a.intersect(b)).toEqual(new XPoint2D(10, 0));
  });
});

describe('XLine2D#drawU', () => {
  it('translates to (x1, y1) and draws a ULine(x2-x1, y2-y1)', () => {
    const events: string[] = [];
    let capturedTranslate: UTranslate | undefined;
    let capturedShape: UShape | undefined;

    const inner: UGraphic = {
      apply: (): UGraphic => inner,
      draw: (shape: UShape): void => {
        capturedShape = shape;
        events.push('draw');
      },
      getParam: (): UParam => {
        throw new Error('not needed');
      },
      getTranslate: (): UTranslate => UTranslate.none(),
      getStringBounder: (): StringBounder => {
        throw new Error('not needed');
      },
    };
    const outer: UGraphic = {
      apply: (change: UChange): UGraphic => {
        if (change instanceof UTranslate) capturedTranslate = change;
        events.push('apply');
        return inner;
      },
      draw: (): void => {
        throw new Error('draw should happen on the translated graphic');
      },
      getParam: (): UParam => {
        throw new Error('not needed');
      },
      getTranslate: (): UTranslate => UTranslate.none(),
      getStringBounder: (): StringBounder => {
        throw new Error('not needed');
      },
    };

    new XLine2D(3, 4, 9, 20).drawU(outer);

    expect(events).toEqual(['apply', 'draw']);
    expect(capturedTranslate).toEqual(new UTranslate(3, 4));
    expect(capturedShape).toBeInstanceOf(ULine);
    expect((capturedShape as ULine).getDX()).toBe(6);
    expect((capturedShape as ULine).getDY()).toBe(16);
  });
});
