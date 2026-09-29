/**
 * `core/svek/SvekResult.ts#svekDimension` — T3a/jititi.
 *
 * Jar: `SvekResult#calculateDimension` (`svek/SvekResult.java:130-135`)
 * always evaluates `minMax.getDimension().delta(15, 15)`, even when nothing
 * was drawn. `TextBlockUtils.getMinMax(this, stringBounder, false)` walks a
 * `LimitFinder` seeded at the infinity sentinel (`MinMaxMutable.getEmpty(
 * false)`); `LimitFinder#getMinMax` (`klimt/drawing/LimitFinder.java:
 * 217-221`) converts that sentinel to `MinMax.getEmpty(true)` = `(0,0,0,0)`
 * — NOT a value that skips `.delta(15, 15)`. `XDimension2D#delta` (`klimt/
 * geom/XDimension2D.java:73-77`) is unconditional. So an empty ink box's
 * dimension is `(15, 15)`, never `(0, 0)`.
 */
import { describe, it, expect } from 'vitest';
import { svekDimension, INK_DELTA, type InkExtent } from '../../../../src/core/svek/SvekResult.js';

const EMPTY_BOX: InkExtent = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };

describe('svekDimension', () => {
  it('returns {width:15, height:15} for an empty ink box (no ink drawn) — jititi', () => {
    // Not {0, 0}: `MinMax.getEmpty(true)` gives (0,0,0,0), and `.delta(15,15)`
    // still runs on it (`SvekResult.java:135` is unconditional).
    expect(svekDimension(EMPTY_BOX)).toEqual({ width: INK_DELTA, height: INK_DELTA });
  });

  it('applies INK_DELTA on top of a finite ink box (regression guard, unchanged arithmetic)', () => {
    const box: InkExtent = { minX: 0, minY: 0, maxX: 100, maxY: 50 };
    expect(svekDimension(box)).toEqual({ width: 100 + INK_DELTA, height: 50 + INK_DELTA });
  });

  it('a partially-infinite box (only one axis empty) still floors that axis to the (0,0,0,0) sentinel', () => {
    // Not reachable from `newInkBox()`'s all-or-nothing accumulation in
    // practice (every `addPoint` call updates all four fields together), but
    // `svekDimension` must not silently propagate a mixed NaN/Infinity —
    // Java's own `MinMax.getEmpty(true)` collapses the WHOLE box to zero the
    // instant `LimitFinder#getMinMax` sees `isInfinity()` (which checks
    // `minX` alone, `klimt/geom/MinMaxMutable.java:47-49`).
    const box: InkExtent = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    expect(svekDimension(box)).toEqual({ width: INK_DELTA, height: INK_DELTA });
  });
});
