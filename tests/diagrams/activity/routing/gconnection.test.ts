import { describe, it, expect } from 'vitest';
import type { GConnection } from '../../../../src/diagrams/activity/routing/gconnection.js';
import { GConnectionVerticalDown } from '../../../../src/diagrams/activity/routing/gconnection-vertical-down.js';
import { GConnectionHorizontal } from '../../../../src/diagrams/activity/routing/gconnection-horizontal.js';
import { GConnectionSideThenVerticalThenSide } from '../../../../src/diagrams/activity/routing/gconnection-side-then-vertical-then-side.js';

describe('GConnectionVerticalDown', () => {
  it('implements GConnection', () => {
    const conn: GConnection = new GConnectionVerticalDown();
    expect(conn).toBeDefined();
  });

  it('returns exactly 2 points from/to', () => {
    const conn = new GConnectionVerticalDown();
    const result = conn.getPoints({ x: 10, y: 0 }, { x: 10, y: 50 });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 10, y: 0 });
    expect(result[1]).toEqual({ x: 10, y: 50 });
  });
});

describe('GConnectionHorizontal', () => {
  it('implements GConnection', () => {
    const conn: GConnection = new GConnectionHorizontal();
    expect(conn).toBeDefined();
  });

  it('returns 3 points when y values differ', () => {
    const conn = new GConnectionHorizontal();
    const result = conn.getPoints({ x: 0, y: 20 }, { x: 80, y: 40 });
    expect(result).toHaveLength(3);
    expect(result[0]).toEqual({ x: 0, y: 20 });
    expect(result[1]).toEqual({ x: 80, y: 20 });
    expect(result[2]).toEqual({ x: 80, y: 40 });
  });

  it('returns exactly 2 points when y values are the same', () => {
    const conn = new GConnectionHorizontal();
    const result = conn.getPoints({ x: 0, y: 20 }, { x: 80, y: 20 });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({ x: 0, y: 20 });
    expect(result[1]).toEqual({ x: 80, y: 20 });
  });
});

// D1: `ParallelBuilderSplit`/`ParallelBuilderFork` never route from a bar
// centre, so the `from.x === to.x` collapse this helper used to apply
// existed only to hide that invented elbow (`decisions.md#d1`). D2's
// `dedupeAdjacentPoints` (the one `pushEdge` seam) is now the sole point
// where a coincident point collapses -- this class always returns the raw
// three-point shape, duplicate middle point included when `from.x ===
// to.x`.
describe('GConnectionSideThenVerticalThenSide — always three points (D1)', () => {
  it('returns 3 points, including a duplicate middle, when from and to share the same x', () => {
    const conn = new GConnectionSideThenVerticalThenSide();
    const from = { x: 50, y: 100 };
    const to = { x: 50, y: 10 };

    const points = conn.getPoints(from, to);

    expect(points).toHaveLength(3);
    expect(points).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 10 },
      { x: 50, y: 10 },
    ]);
  });

  it('returns 3 points when from and to have different x values', () => {
    const conn = new GConnectionSideThenVerticalThenSide();
    const from = { x: 50, y: 100 };
    const to = { x: 150, y: 10 };

    const points = conn.getPoints(from, to);

    expect(points).toHaveLength(3);
    expect(points).toEqual([
      { x: 50, y: 100 },
      { x: 50, y: 10 },
      { x: 150, y: 10 },
    ]);
  });
});
