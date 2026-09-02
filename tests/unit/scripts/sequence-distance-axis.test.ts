/**
 * Unit tests for `scripts/sequence-distance-axis.ts` — C1 of
 * `plans/sequence-text-and-y-convergence`.
 *
 * The split exists because the instrument bucketed by attribute NAME, so
 * `points` folded both axes into one number — 1 676 411 of a 6 267 365 total,
 * the largest single line item. Two properties carry the batch and are tested
 * hardest:
 *
 *   1. `points` splits on index PARITY, which is exact only because
 *      `compare.ts` indexes a FLAT array of every numeric token in the value.
 *      Even is X, odd is Y. If that ever stopped holding, every vertical term
 *      C2 derives against this table would be derived against a mixture.
 *   2. A `mixed` attribute is EXCLUDED from both axis subtotals rather than
 *      folded into one. `d` cannot be split — its commands have varying
 *      arities — and quietly charging it to an axis would reproduce, one
 *      level down, the very defect this module removes.
 */
import { describe, it, expect } from 'vitest';

import {
  AXES,
  axisOf,
  axisTotals,
  bucketOf,
  formatAxisTable,
} from '../../../scripts/sequence-distance-axis.js';
import type { DistanceTotals } from '../../../scripts/sequence-geometry-distance.js';

const t = (distance: number, count: number): DistanceTotals => ({ distance, count });

describe('bucketOf', () => {
  it('files an even `points` index under X and an odd one under Y', () => {
    // `points` is a list of `x,y` pairs and compare.ts indexes every numeric
    // token flatly, so parity IS the axis. This is the whole task.
    expect(bucketOf('points', 'svg/g[1]/polygon/@points[0]')).toBe('points.x');
    expect(bucketOf('points', 'svg/g[1]/polygon/@points[1]')).toBe('points.y');
  });

  it('keeps that parity past the first pair, where a point index would not', () => {
    // A point index would put [2] and [3] in the same point; a coordinate
    // index alternates all the way along. The corpus reaches index 9.
    expect(bucketOf('points', 'svg/g[1]/polygon/@points[6]')).toBe('points.x');
    expect(bucketOf('points', 'svg/g[1]/polygon/@points[9]')).toBe('points.y');
  });

  it('passes every other attribute through unchanged', () => {
    expect(bucketOf('x', 'svg/g[1]/rect/@x')).toBe('x');
    expect(bucketOf('d', 'svg/g[1]/path/@d[7]')).toBe('d');
    expect(bucketOf('viewBox', 'svg/@viewBox[3]')).toBe('viewBox');
  });

  it('does not guess an axis for an index-less `points` path', () => {
    // compare.ts:315 emits this on a length mismatch. It carries no `delta`,
    // so it never reaches the distance sum -- but the bucket is stated
    // rather than assumed.
    expect(bucketOf('points', 'svg/g[1]/polygon/@points')).toBe('points.mixed');
  });
});

describe('axisOf', () => {
  it('groups an extent with its own axis, as the flat table already did', () => {
    expect(axisOf('width')).toBe('x');
    expect(axisOf('height')).toBe('y');
  });

  it('reads the coordinate families', () => {
    for (const name of ['x', 'x1', 'x2', 'cx', 'rx', 'dx', 'points.x']) {
      expect(axisOf(name)).toBe('x');
    }
    for (const name of ['y', 'y1', 'y2', 'cy', 'ry', 'dy', 'points.y']) {
      expect(axisOf(name)).toBe('y');
    }
  });

  it('calls `d`, `transform` and `viewBox` mixed rather than charging an axis', () => {
    expect(axisOf('d')).toBe('mixed');
    expect(axisOf('transform')).toBe('mixed');
    expect(axisOf('viewBox')).toBe('mixed');
    expect(axisOf('points.mixed')).toBe('mixed');
  });

  it('is `none` for a name it does not know, never a guess', () => {
    expect(axisOf('font-size')).toBe('none');
    expect(axisOf('unattributed')).toBe('none');
  });
});

describe('axisTotals', () => {
  it('sums each axis over its buckets', () => {
    const totals = axisTotals({
      x: t(10, 2),
      'points.x': t(5, 1),
      y: t(30, 3),
      'points.y': t(1, 1),
    });
    expect(totals.x).toEqual({ distance: 15, count: 3 });
    expect(totals.y).toEqual({ distance: 31, count: 4 });
  });

  it('EXCLUDES a mixed attribute from both axes instead of folding it in', () => {
    const totals = axisTotals({ x: t(4, 1), d: t(100, 9), viewBox: t(20, 2) });
    expect(totals.x).toEqual({ distance: 4, count: 1 });
    expect(totals.y).toEqual({ distance: 0, count: 0 });
    expect(totals.mixed).toEqual({ distance: 120, count: 11 });
  });

  it('conserves the total across the four axes, however it is bucketed', () => {
    // The invariance C1 is gated on: regrouping must not move the number.
    const byAttribute = { x: t(3, 1), y: t(5, 2), d: t(7, 3), 'font-size': t(11, 4) };
    const totals = axisTotals(byAttribute);
    const summed = AXES.reduce((sum, a) => sum + totals[a].distance, 0);
    expect(summed).toBe(3 + 5 + 7 + 11);
  });

  it('is all zeroes for an empty map rather than undefined rows', () => {
    const totals = axisTotals({});
    expect(AXES.map((a) => totals[a])).toEqual([t(0, 0), t(0, 0), t(0, 0), t(0, 0)]);
  });
});

describe('formatAxisTable', () => {
  it('prints a subtotal row per axis, mixed among them', () => {
    const table = formatAxisTable({ x: t(4, 1), y: t(6, 2), d: t(100, 3) });
    const lines = table.split('\n');
    expect(lines[0]).toMatch(/^axis\s+distance\s+diffs$/);
    expect(lines[1]).toMatch(/^x\s+4\.000\s+1$/);
    expect(lines[2]).toMatch(/^y\s+6\.000\s+2$/);
    expect(lines[3]).toMatch(/^mixed\s+100\.000\s+3$/);
    expect(lines[4]).toMatch(/^none\s+0\.000\s+0$/);
  });

  it('rounds to the three decimals the distance report already uses', () => {
    expect(formatAxisTable({ x: t(1.23456, 1) })).toContain('1.235');
  });
});
