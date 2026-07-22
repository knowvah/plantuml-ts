import { describe, it, expect } from 'vitest';
import { frontierCalculator, ensureMinWidth } from '../../../src/diagrams/state/state-composite-frontier.js';
import type { Box } from '../../../src/diagrams/state/state-composite-frontier.js';

// Mission G6 T9 (plans/g6-cluster-geometry/batch-4/withlabel-derivation.md
// §2c) — FrontierCalculator port, term-by-term. This module is NOT wired
// into materializeCluster as of T9's close (see its own module doc comment
// for the STOP finding): the algorithm below is independently verified
// correct by hand-tracing every step against real fixture geometry; these
// tests lock that verification in as executable regression coverage,
// decoupled from the (currently wrong) upstream `initial` bbox problem.

describe('frontierCalculator', () => {
  it('seeds a degenerate box at initial center and falls back to initial bounds when insides is empty and no point touches any axis extreme', () => {
    // No points at all -> nothing can "touch" any boundary -> every axis
    // resets to `initial` per step 3, and step 4/5/6 never fire (no points
    // to push). Net effect: insides-empty + points-empty reproduces
    // `initial` exactly.
    const initial: Box = { x: 10, y: 20, width: 30, height: 40 };
    const result = frontierCalculator(initial, [], [], 'TB');
    expect(result).toEqual(initial);
  });

  it('unions insides boxes when non-empty, falling back to initial on every untouched axis', () => {
    const initial: Box = { x: 0, y: 0, width: 100, height: 100 };
    const insides: Box[] = [
      { x: 20, y: 20, width: 10, height: 10 }, // [20,30]x[20,30]
      { x: 40, y: 25, width: 10, height: 5 }, // [40,50]x[25,30]
    ];
    // union -> minX=20,maxX=50,minY=20,maxY=30. No points -> none of the
    // four boundaries is "touched" -> every boundary falls back to initial.
    const result = frontierCalculator(initial, insides, [], 'TB');
    expect(result).toEqual(initial);
  });

  // pesita-10-dene726's `AA` (T8's own worked prediction, withlabel-
  // derivation.md §4): insides=[] (no direct normal member), one border
  // point (`aa_ok_ex`) whose center sits exactly on the merged core's
  // minX AND maxY -- pushMinX fires (not canceled, TB corner-exclusion only
  // cancels Y-axis pushes) while pushMaxY fires then gets canceled by the
  // SAME point sitting on the (minX,maxY) corner.
  it('AA-shaped case: pushMinX survives, pushMaxY is corner-excluded (TB)', () => {
    const initial: Box = { x: 478.01875, y: 185.64, width: 71, height: 132.72 };
    const points = [{ x: 492.01875, y: 302 }];
    const result = frontierCalculator(initial, [], points, 'TB');
    expect(result.x).toBeCloseTo(474.01875, 6);
    expect(result.y).toBeCloseTo(185.64, 6);
    expect(result.width).toBeCloseTo(75, 6);
    expect(result.height).toBeCloseTo(116.36, 6);
  });

  // bitaxo-18-tamo974's `C`: insides=[], one border point (`d`) whose
  // center sits exactly on the merged core's maxX AND maxY --
  // pushMaxX survives while pushMaxY gets corner-excluded.
  it('bitaxo-shaped case: pushMaxX survives, pushMaxY is corner-excluded (TB)', () => {
    const initial: Box = { x: 154, y: -8.36, width: 71, height: 49.72 };
    const points = [{ x: 211, y: 25 }];
    const result = frontierCalculator(initial, [], points, 'TB');
    expect(result.x).toBeCloseTo(154, 6);
    expect(result.y).toBeCloseTo(-8.36, 6);
    expect(result.width).toBeCloseTo(75, 6);
    expect(result.height).toBeCloseTo(33.36, 6);
  });

  it('LR rankdir: corner exclusion cancels X-axis pushes instead of Y-axis ones', () => {
    // Mirror of the bitaxo-shaped case with x/y swapped, run under 'LR' --
    // ported faithfully from FrontierCalculator's own rankdir branch
    // (withlabel-derivation.md §2c step 5), zero fixture coverage but
    // exercised here directly since no corpus fixture takes this branch.
    const initial: Box = { x: -8.36, y: 154, width: 49.72, height: 71 };
    const points = [{ x: 25, y: 211 }];
    const result = frontierCalculator(initial, [], points, 'LR');
    expect(result.x).toBeCloseTo(-8.36, 6);
    expect(result.y).toBeCloseTo(154, 6);
    expect(result.width).toBeCloseTo(33.36, 6);
    expect(result.height).toBeCloseTo(75, 6);
  });

  it('does not push when no point sits within DELTA of a merged boundary', () => {
    const initial: Box = { x: 0, y: 0, width: 200, height: 200 };
    const insides: Box[] = [{ x: 90, y: 90, width: 20, height: 20 }]; // [90,110]x[90,110]
    // Point sits well inside the merged core (DELTA=18 for BORDER_POINT_SIZE
    // 12 -> RADIUS 6), far from every boundary -> no push fires. It also
    // does not touch any boundary exactly, so every axis falls back to
    // `initial` (matching the "no touch" branch, not the push branch).
    const points = [{ x: 100, y: 100 }];
    const result = frontierCalculator(initial, insides, points, 'TB');
    expect(result).toEqual(initial);
  });
});

describe('ensureMinWidth', () => {
  it('is a no-op when core is already at least as wide as minWidth', () => {
    const core: Box = { x: 0, y: 0, width: 50, height: 20 };
    const initial: Box = { x: -10, y: -10, width: 70, height: 40 };
    expect(ensureMinWidth(core, 40, initial)).toEqual(core);
  });

  it('widens symmetrically around the current center when narrower than minWidth', () => {
    // width=10 (x in [0,10]), minWidth=20 -> delta=-10 -> each side grows by 5.
    const core: Box = { x: 0, y: 0, width: 10, height: 5 };
    const initial: Box = { x: -100, y: 0, width: 300, height: 5 }; // initial.x far left, no error correction needed
    const result = ensureMinWidth(core, 20, initial);
    expect(result.x).toBeCloseTo(-5, 6);
    expect(result.width).toBeCloseTo(20, 6);
    expect(result.y).toBe(0);
    expect(result.height).toBe(5);
  });

  it("re-centers toward initial's left edge when the naive widening would cross it", () => {
    // core=[0,10] (width 10), minWidth=20 -> naive newMinX=-5, but
    // initial.x=-2 means naive newMinX (-5) undershoots initial's own left
    // edge by 3 (`error = -5 - (-2) = -3 < 0`) -> both bounds shift right by 3.
    const core: Box = { x: 0, y: 0, width: 10, height: 5 };
    const initial: Box = { x: -2, y: 0, width: 50, height: 5 };
    const result = ensureMinWidth(core, 20, initial);
    // naive: minX=-5,maxX=15 (width 20); error=-5-(-2)=-3 -> shift by +3
    expect(result.x).toBeCloseTo(-2, 6);
    expect(result.x + result.width).toBeCloseTo(18, 6);
    expect(result.width).toBeCloseTo(20, 6);
  });
});
