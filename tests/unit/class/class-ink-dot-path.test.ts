/**
 * `class-ink-dot-path.ts#drawnEdgePoints` (cdd2-T13, Q-6): the path the
 * canvas ink walk bounds is the one `SvekEdge#drawU` draws — after
 * `getExtremitySimplier`'s `dotPath.moveEndPoint` (`svek/SvekEdge.java
 * :539-562`), which moves the end point and the last control point
 * together (`klimt/shape/DotPath.java:229-234`).
 */
import { describe, it, expect } from 'vitest';
import { drawnEdgePoints } from '../../../src/diagrams/class/class-ink-dot-path.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';

/** `nenepe-70-keri784`'s `CC::USA --> users::3`, pre-shift layout coordinates. */
const NENEPE_POINTS = [
  { x: 70, y: 57 },
  { x: 108.22367568295924, y: 57 },
  { x: 106.72367568295924, y: 229 },
  { x: 68.5, y: 229 },
];

function edge(targetDecor: EdgeGeo['targetDecor']): EdgeGeo {
  return { id: 'e0', points: NENEPE_POINTS, targetDecor, sourceDecor: 'none', dashed: false, from: 'CC', to: 'users' };
}

describe('drawnEdgePoints', () => {
  it('moves the head end and its control point by the arrow trim (jar path "C115.22,64 118.72,236 80.5,236")', () => {
    // jar draws the head at x 80.5 = 68.5 + 5 (+7 canvas shift), control 2 at 118.72.
    const pts = drawnEdgePoints(edge('open'));
    expect(pts[0]).toEqual({ x: 70, y: 57 });
    expect(pts[1]).toEqual({ x: 108.22367568295924, y: 57 });
    expect(pts[2]!.x).toBeCloseTo(111.72367568295924, 10);
    expect(pts[2]!.y).toBeCloseTo(229, 10);
    expect(pts[3]!.x).toBeCloseTo(73.5, 10);
    expect(pts[3]!.y).toBeCloseTo(229, 10);
  });

  it('returns the layout points unchanged when no end carries a decor', () => {
    expect(drawnEdgePoints(edge('none'))).toEqual(NENEPE_POINTS);
  });
});
