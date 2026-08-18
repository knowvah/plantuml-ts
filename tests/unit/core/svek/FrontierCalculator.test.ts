/**
 * Unit tests for `core/svek/FrontierCalculator.ts` — the ONE port of
 * upstream `Cluster.java#manageEntryExitPoint` / `svek/
 * FrontierCalculator.java`, merging the former `diagrams/description/
 * frontier-calculator.test.ts` (description/component/usecase fixtures) and
 * `diagrams/state/state-composite-frontier.test.ts` (state-diagram
 * fixtures) into one suite — mission shared-seam-extraction T5. Every
 * assertion from both former suites is preserved; the state suite's former
 * `Box` ({x,y,width,height}) fixtures are re-expressed as `RectangleArea`
 * ({minX,minY,maxX,maxY}) — the shape this shared port actually operates
 * in — via `minX=x, minY=y, maxX=x+width, maxY=y+height`.
 */
import { describe, test, expect } from 'vitest';
import {
  frontierCalculator, ensureMinWidth, ENTITY_POSITION_RADIUS,
  type RectangleArea, type Point,
} from '../../../../src/core/svek/FrontierCalculator.js';

describe('frontierCalculator (insides empty — port-only container)', () => {
  test('reproduces jar\'s exact 177x99 result for component/gafegu-06-nito976 (raw graphviz-native y-up frame)', () => {
    const initial: RectangleArea = { minX: 8, minY: 8, maxX: 177, maxY: 121 };
    const points: Point[] = [
      { x: 22, y: 107 }, { x: 69, y: 107 }, { x: 116, y: 107 }, { x: 163, y: 107 },
    ];
    const core = frontierCalculator(initial, [], points, 'TB');
    expect(core).toEqual({ minX: 4, minY: 8, maxX: 181, maxY: 107 });
    expect(core.maxX - core.minX).toBe(177);
    expect(core.maxY - core.minY).toBe(99);
  });

  test('reproduces the SAME 177x99 result in jar\'s final SVG (y-down) frame', () => {
    // Same fixture, screen (y-down) coordinates: ports sit at the cluster's
    // TOP (screen minY), matching the native-frame maxY-touch/push-excluded
    // corner case flipping to a screen-minY touch.
    const initial: RectangleArea = { minX: 8, minY: 152.78 - 121, maxX: 177, maxY: 152.78 - 8 };
    const points: Point[] = [
      { x: 22, y: 152.78 - 107 }, { x: 69, y: 152.78 - 107 },
      { x: 116, y: 152.78 - 107 }, { x: 163, y: 152.78 - 107 },
    ];
    const core = frontierCalculator(initial, [], points, 'TB');
    expect(core.maxX - core.minX).toBe(177);
    expect(core.maxY - core.minY).toBe(99);
  });

  test('touches all four edges when ports surround the seed box (no push, insides empty)', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const points: Point[] = [
      { x: -50, y: 5 }, { x: 50, y: 5 }, { x: 5, y: -50 }, { x: 5, y: 50 },
    ];
    const core = frontierCalculator(initial, [], points, 'TB');
    // Every edge is touched directly by a point -- no snap-back to `initial`,
    // and no push (each touching point sits far from the OTHER edges, so no
    // `Math.abs(...) < DELTA` push condition fires).
    expect(core).toEqual({ minX: -50, minY: -50, maxX: 50, maxY: 50 });
  });

  test('rankdir=LR excludes the push on the X axis at a corner instead of Y (touching minX)', () => {
    // Mirrors the TB corner-exclusion case (gafegu-06 above) but rotated:
    // both points sit exactly at core.minX (a corner under LR, once one of
    // core's extreme Y values is also touched) -> pushMinX is excluded
    // (java:120-122); pushMaxX/pushMinY/pushMaxY are all NOT corner cases
    // here (no point ever touches core.maxX) so they still fire.
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const points: Point[] = [{ x: 4, y: -20 }, { x: 4, y: 20 }];
    const core = frontierCalculator(initial, [], points, 'LR');
    expect(core).toEqual({ minX: 4, minY: -38, maxX: 28, maxY: 38 });
  });

  test('rankdir=LR excludes the push on the X axis at a corner instead of Y (touching maxX)', () => {
    // Same shape, mirrored to the OTHER LR corner-exclusion branch
    // (java:124-125, `p.x === core.maxX`) -- both points sit at
    // core.maxX(6) instead of minX, so pushMaxX (not pushMinX) is the one
    // excluded this time.
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const points: Point[] = [{ x: 6, y: -20 }, { x: 6, y: 20 }];
    const core = frontierCalculator(initial, [], points, 'LR');
    expect(core).toEqual({ minX: -18, minY: -38, maxX: 6, maxY: 38 });
  });

  test('the SAME point layout under TB (not LR) excludes the Y push at the corner instead', () => {
    // Same seed/points as the LR case above, but rankdir=TB: the corner
    // exclusion checks Y (java:128-132) instead of X, so pushMinY/pushMaxY
    // (not pushMinX) get excluded -- a genuinely different final rect,
    // confirming the corner-exclusion branch is rankdir-dependent, not a
    // no-op either way.
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 10 };
    const points: Point[] = [{ x: 4, y: -20 }, { x: 4, y: 20 }];
    const core = frontierCalculator(initial, [], points, 'TB');
    expect(core).toEqual({ minX: -14, minY: -20, maxX: 28, maxY: 20 });
  });
});

describe('frontierCalculator (insides non-empty)', () => {
  test('seeds core from the merged insides rects, not the initial-center fallback', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 1000, maxY: 1000 };
    const insides: RectangleArea[] = [
      { minX: 10, minY: 10, maxX: 30, maxY: 30 },
      { minX: 40, minY: 20, maxX: 60, maxY: 40 },
    ];
    const core = frontierCalculator(initial, insides, [], 'TB');
    // No points at all -> insides merge is the whole result, no touch/push,
    // and every axis snaps to `initial` since nothing ever "touches" a
    // point-derived edge (points is empty).
    expect(core).toEqual({ minX: 0, minY: 0, maxX: 1000, maxY: 1000 });
  });

  test('a port center outside the merged insides rect widens the box to include it', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    const insides: RectangleArea[] = [{ minX: 50, minY: 50, maxX: 100, maxY: 100 }];
    const points: Point[] = [{ x: 150, y: 75 }];
    const core = frontierCalculator(initial, insides, points, 'TB');
    expect(core.maxX).toBeGreaterThanOrEqual(150);
    expect(core.minX).toBeLessThanOrEqual(50);
  });

  test('unions insides rects when non-empty, falling back to initial on every untouched axis', () => {
    // Former state-diagram fixture (state-composite-frontier.test.ts).
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 100, maxY: 100 };
    const insides: RectangleArea[] = [
      { minX: 20, minY: 20, maxX: 30, maxY: 30 },
      { minX: 40, minY: 25, maxX: 50, maxY: 30 },
    ];
    // union -> minX=20,maxX=50,minY=20,maxY=30. No points -> none of the
    // four boundaries is "touched" -> every boundary falls back to initial.
    const core = frontierCalculator(initial, insides, [], 'TB');
    expect(core).toEqual(initial);
  });

  test('does not push when no point sits within DELTA of a merged boundary', () => {
    // Former state-diagram fixture. DELTA=18 (3 * ENTITY_POSITION_RADIUS=6).
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 200, maxY: 200 };
    const insides: RectangleArea[] = [{ minX: 90, minY: 90, maxX: 110, maxY: 110 }];
    // Point sits well inside the merged core, far from every boundary -> no
    // push fires. It also does not touch any boundary exactly, so every
    // axis falls back to `initial` (matching the "no touch" branch, not the
    // push branch).
    const points: Point[] = [{ x: 100, y: 100 }];
    const core = frontierCalculator(initial, insides, points, 'TB');
    expect(core).toEqual(initial);
  });
});

describe('frontierCalculator (insides empty — state-diagram border-point fixtures)', () => {
  test('degenerate seed + full fallback when insides and points are both empty', () => {
    // Former state-diagram fixture: no points at all -> nothing can "touch"
    // any boundary -> every axis resets to `initial`, and push/corner-
    // exclusion never fire. Net effect: reproduces `initial` exactly.
    const initial: RectangleArea = { minX: 10, minY: 20, maxX: 40, maxY: 60 };
    const core = frontierCalculator(initial, [], [], 'TB');
    expect(core).toEqual(initial);
  });

  // pesita-10-dene726's `AA` (mission g6-cluster-geometry T8/T9's worked
  // prediction): insides=[] (no direct normal member), one border point
  // (`aa_ok_ex`) whose center sits exactly on the merged core's minX AND
  // maxY -- pushMinX fires (not canceled, TB corner-exclusion only cancels
  // Y-axis pushes) while pushMaxY fires then gets canceled by the SAME
  // point sitting on the (minX,maxY) corner.
  test('AA-shaped case: pushMinX survives, pushMaxY is corner-excluded (TB)', () => {
    const initial: RectangleArea = {
      minX: 478.01875, minY: 185.64, maxX: 478.01875 + 71, maxY: 185.64 + 132.72,
    };
    const points: Point[] = [{ x: 492.01875, y: 302 }];
    const core = frontierCalculator(initial, [], points, 'TB');
    expect(core.minX).toBeCloseTo(474.01875, 6);
    expect(core.minY).toBeCloseTo(185.64, 6);
    expect(core.maxX - core.minX).toBeCloseTo(75, 6);
    expect(core.maxY - core.minY).toBeCloseTo(116.36, 6);
  });

  // bitaxo-18-tamo974's `C`: insides=[], one border point (`d`) whose
  // center sits exactly on the merged core's maxX AND maxY -- pushMaxX
  // survives while pushMaxY gets corner-excluded.
  test('bitaxo-shaped case: pushMaxX survives, pushMaxY is corner-excluded (TB)', () => {
    const initial: RectangleArea = { minX: 154, minY: -8.36, maxX: 154 + 71, maxY: -8.36 + 49.72 };
    const points: Point[] = [{ x: 211, y: 25 }];
    const core = frontierCalculator(initial, [], points, 'TB');
    expect(core.minX).toBeCloseTo(154, 6);
    expect(core.minY).toBeCloseTo(-8.36, 6);
    expect(core.maxX - core.minX).toBeCloseTo(75, 6);
    expect(core.maxY - core.minY).toBeCloseTo(33.36, 6);
  });

  test('LR rankdir: corner exclusion cancels X-axis pushes instead of Y-axis ones', () => {
    // Mirror of the bitaxo-shaped case with x/y swapped, run under 'LR' --
    // ported faithfully from FrontierCalculator's own rankdir branch, zero
    // fixture coverage but exercised here directly since no corpus fixture
    // takes this branch (withlabel-derivation.md §6.3).
    const initial: RectangleArea = { minX: -8.36, minY: 154, maxX: -8.36 + 49.72, maxY: 154 + 71 };
    const points: Point[] = [{ x: 25, y: 211 }];
    const core = frontierCalculator(initial, [], points, 'LR');
    expect(core.minX).toBeCloseTo(-8.36, 6);
    expect(core.minY).toBeCloseTo(154, 6);
    expect(core.maxX - core.minX).toBeCloseTo(33.36, 6);
    expect(core.maxY - core.minY).toBeCloseTo(75, 6);
  });
});

describe('ensureMinWidth', () => {
  test('widens a too-narrow core symmetrically around its own center', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 100, maxY: 20 };
    const core: RectangleArea = { minX: 40, minY: 0, maxX: 60, maxY: 20 };
    const widened = ensureMinWidth(core, initial, 40);
    expect(widened.maxX - widened.minX).toBe(40);
    expect(widened.minX).toBe(30);
    expect(widened.maxX).toBe(70);
  });

  test('leaves an already-wide-enough core untouched', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 100, maxY: 20 };
    const core: RectangleArea = { minX: 10, minY: 0, maxX: 90, maxY: 20 };
    expect(ensureMinWidth(core, initial, 40)).toEqual(core);
  });

  test('clamps the widened minX at initial.minX when the symmetric widen would cross it (java:159-162)', () => {
    const initial: RectangleArea = { minX: 0, minY: 0, maxX: 100, maxY: 20 };
    const core: RectangleArea = { minX: 2, minY: 0, maxX: 12, maxY: 20 };
    const widened = ensureMinWidth(core, initial, 40);
    expect(widened.minX).toBe(0);
    expect(widened.maxX - widened.minX).toBe(40);
  });

  test('is a no-op when core is already at least as wide as minWidth (former state-diagram fixture)', () => {
    const core: RectangleArea = { minX: 0, minY: 0, maxX: 50, maxY: 20 };
    const initial: RectangleArea = { minX: -10, minY: -10, maxX: 60, maxY: 30 };
    expect(ensureMinWidth(core, initial, 40)).toEqual(core);
  });

  test('widens symmetrically around the current center when narrower than minWidth (former state-diagram fixture)', () => {
    // width=10 (x in [0,10]), minWidth=20 -> delta=-10 -> each side grows by 5.
    const core: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 5 };
    const initial: RectangleArea = { minX: -100, minY: 0, maxX: 200, maxY: 5 }; // initial.minX far left, no error correction needed
    const result = ensureMinWidth(core, initial, 20);
    expect(result.minX).toBeCloseTo(-5, 6);
    expect(result.maxX - result.minX).toBeCloseTo(20, 6);
    expect(result.minY).toBe(0);
    expect(result.maxY).toBe(5);
  });

  test("re-centers toward initial's left edge when the naive widening would cross it (former state-diagram fixture)", () => {
    // core=[0,10] (width 10), minWidth=20 -> naive newMinX=-5, but
    // initial.minX=-2 means naive newMinX (-5) undershoots initial's own
    // left edge by 3 (`error = -5 - (-2) = -3 < 0`) -> both bounds shift
    // right by 3.
    const core: RectangleArea = { minX: 0, minY: 0, maxX: 10, maxY: 5 };
    const initial: RectangleArea = { minX: -2, minY: 0, maxX: 48, maxY: 5 };
    const result = ensureMinWidth(core, initial, 20);
    // naive: minX=-5,maxX=15 (width 20); error=-5-(-2)=-3 -> shift by +3
    expect(result.minX).toBeCloseTo(-2, 6);
    expect(result.maxX).toBeCloseTo(18, 6);
    expect(result.maxX - result.minX).toBeCloseTo(20, 6);
  });
});

describe('ENTITY_POSITION_RADIUS', () => {
  test('matches abel/EntityPosition.java:56 (RADIUS = 6)', () => {
    expect(ENTITY_POSITION_RADIUS).toBe(6);
  });
});
