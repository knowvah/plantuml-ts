/**
 * Unit tests for the four `repeat` translate shapes (mission
 * `activity-loop-lane-translate`, T3) -- hand-derived numbers per function,
 * plus golden coordinates read from `becanu-19-diti597`'s own walker output
 * (the one baseline row T0 classed BOTH `repeat-out` and `complex1`,
 * `plans/activity-loop-lane-translate/fixtures.md`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:309-331,357-404,579-606,651-676
 */

import { describe, expect, it } from 'vitest';
import {
  routeRepeatComplex1,
  routeRepeatOut,
  routeRepeatSimple1,
  routeRepeatSimple2,
} from '../../../../src/diagrams/activity/layout/swimlane-loop-translate-repeat.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-layout-types.js';
import type {
  RepeatComplex1Loop,
  RepeatOutLoop,
  RepeatSimple1Loop,
  RepeatSimple2Loop,
} from '../../../../src/diagrams/activity/layout/swimlane-loop-translate.js';

/** The bare `ActivityEdgeGeo` every `routeRepeat*` call starts from --
 *  `routeEdge` (`swimlane-placement.ts:279-281`) always passes the edge
 *  `pushEdge` pushed (its `drawU`-shape points, D1), which every route
 *  function here overwrites via `{ ...edge, points }`. Only `points` is
 *  read from it by any of the four functions under test, so an empty-point
 *  stand-in is enough. */
const edge: ActivityEdgeGeo = { points: [] };

describe('routeRepeatOut — ConnectionOut#drawTranslate (FtileRepeat.java:309-331)', () => {
  it('splits into an unarrowed elbow then a short arrowed drop (D3), hand-derived', () => {
    const loop: RepeatOutLoop = { kind: 'repeat-out', p1: { x: 10, y: 100 }, p2: { x: 50, y: 140 } };
    const result = routeRepeatOut(loop, edge, 5, -5);

    // mp1a = (15, 100); mp2b = (45, 140); middle = (100 + 140) / 2 = 120.
    expect(result.edges).toHaveLength(2);
    expect(result.edges[0]!.points).toEqual([
      { x: 15, y: 100 },
      { x: 15, y: 120 },
      { x: 45, y: 120 },
    ]);
    expect(result.edges[0]!.arrowhead).toBe(false);
    expect(result.edges[0]!.label).toBeUndefined();
    expect(result.edges[1]!.points).toEqual([
      { x: 45, y: 120 },
      { x: 45, y: 140 },
    ]);
    expect(result.edges[1]!.arrowhead).toBeUndefined();
    expect(result.reservations).toEqual([]);
  });

  it('carries the label onto the second (arrowed) edge only, never the first', () => {
    const loop: RepeatOutLoop = { kind: 'repeat-out', p1: { x: 0, y: 0 }, p2: { x: 0, y: 20 }, label: 'tbout' };
    const result = routeRepeatOut(loop, edge, 0, 0);
    expect(result.edges[0]!.label).toBeUndefined();
    expect(result.edges[1]!.label).toBe('tbout');
  });

  // Golden: becanu-19-diti597's own repeat (body col1 -> condition col2).
  // Walker's pre-swimlane `loop` record and `placeSwimlanes`'s own lane
  // deltas (`col1` -> 10, `col2` -> 68.9875), both read directly off this
  // worktree's build via a temporary, reverted `console.error` in
  // `walk-repeat.ts#pushRepeatOut`/`swimlane-placement.ts#placeSwimlanes`
  // (`git diff` on both is empty). The X coordinates below match
  // `test-results/dot-cache/activity/becanu-19-diti597/in.svg`'s own
  // `<line>`/`<polygon>` points for this connector (51.675, 51.675,
  // 110.663, 110.663) after that SVG's own +4.0 canvas-offset; Y differs
  // from the golden's +5.5-offset values because `compress-geometry.ts`'s
  // vertical compress pass (a separate, later, out-of-scope stage) further
  // shrinks Y after this function runs -- X is unaffected by it here.
  it('matches becanu-19-diti597’s own pre-compress repeat-out geometry', () => {
    const loop: RepeatOutLoop = { kind: 'repeat-out', p1: { x: 37.675, y: 179 }, p2: { x: 37.675, y: 227 } };
    const result = routeRepeatOut(loop, edge, 10, 68.9875);
    // mp1a = (47.675, 179); mp2b = (106.6625, 227); middle = (179+227)/2 = 203.
    expect(result.edges[0]!.points).toEqual([
      { x: 47.675, y: 179 },
      { x: 47.675, y: 203 },
      { x: 106.6625, y: 203 },
    ]);
    expect(result.edges[1]!.points).toEqual([
      { x: 106.6625, y: 203 },
      { x: 106.6625, y: 227 },
    ]);
  });
});

describe('routeRepeatSimple1 — ConnectionBackSimple1#drawTranslate (FtileRepeat.java:579-606)', () => {
  it('xmax reads the ALREADY-translated p1.x, hand-derived', () => {
    const loop: RepeatSimple1Loop = {
      kind: 'repeat-simple1',
      p1: { x: 10, y: 100 }, // diamond2 (condition) origin, untranslated
      p2: { x: 40, y: 0 }, // diamond1 (entry) origin, untranslated
      repeatWidth: 40,
      diamond1: { height: 24 },
      diamond2: { width: 50, height: 40 },
    };
    const result = routeRepeatSimple1(loop, edge, 5, -5);

    // p1 -> (15, 100); p2 -> (35, 0).
    // y1 = 100 + 40/2 = 120; y2 = 0 + 24/2 = 12.
    // xmax = 15 + 50/2 + 40/2 + 12 = 72.
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([
      { x: 15, y: 120 },
      { x: 72, y: 120 },
      { x: 72, y: 12 },
      { x: 35, y: 12 },
    ]);
    expect(result.edges[0]!.label).toBeUndefined();
    expect(result.reservations).toEqual([]);
  });

  it('carries the label when the loop record sets one', () => {
    const loop: RepeatSimple1Loop = {
      kind: 'repeat-simple1',
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 0 },
      repeatWidth: 0,
      diamond1: { height: 0 },
      diamond2: { width: 0, height: 0 },
      label: 'tbback',
    };
    expect(routeRepeatSimple1(loop, edge, 0, 0).edges[0]!.label).toBe('tbback');
  });
});

describe('routeRepeatSimple2 — ConnectionBackSimple2#drawTranslate (FtileRepeat.java:651-676)', () => {
  const base = {
    kind: 'repeat-simple2' as const,
    diamond1: { width: 24, height: 24 },
    diamond2: { width: 20, height: 10 },
  };

  it('isOnA true (x1 left of the x2a/x2b midpoint): arrow lands on x2a', () => {
    const loop: RepeatSimple2Loop = { ...base, p1: { x: 0, y: 0 }, p2: { x: 30, y: 0 } };
    const result = routeRepeatSimple2(loop, edge, 0, 0);

    // x1 = 0 + 20 = 20; y1 = 0 + 5 = 5.
    // x2a = 30; x2b = 30 + 24 = 54; midpoint = 42; isOnA: 20 < 42 -- true.
    // x2 = x2a = 30; y2 = 0 + 12 = 12; xmiddle = (20 + 30) / 2 = 25.
    expect(result.edges[0]!.points).toEqual([
      { x: 20, y: 5 },
      { x: 25, y: 5 },
      { x: 25, y: 12 },
      { x: 30, y: 12 },
    ]);
  });

  it('isOnA false (x1 at/right of the midpoint): arrow lands on x2b', () => {
    const loop: RepeatSimple2Loop = { ...base, p1: { x: 20, y: 0 }, p2: { x: 0, y: 0 } };
    const result = routeRepeatSimple2(loop, edge, 0, 0);

    // x1 = 20 + 20 = 40; y1 = 5.
    // x2a = 0; x2b = 24; midpoint = 12; isOnA: 40 < 12 -- false.
    // x2 = x2b = 24; y2 = 12; xmiddle = (40 + 24) / 2 = 32.
    expect(result.edges[0]!.points).toEqual([
      { x: 40, y: 5 },
      { x: 32, y: 5 },
      { x: 32, y: 12 },
      { x: 24, y: 12 },
    ]);
  });
});

describe('routeRepeatComplex1 — ConnectionBackComplex1#drawTranslate (FtileRepeat.java:356-404)', () => {
  it('branch 1 (entryRight < x1a): elbows through x1b when x1a < x1b', () => {
    const loop: RepeatComplex1Loop = {
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 100,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    };
    const result = routeRepeatComplex1(loop, edge, 0, 0);

    // y1 = 100 + 20 = 120; y2 = 0 + 12 = 12.
    // x1a = 0 + 50 = 50; x1b = 0 + 25 + 50 + 12 = 87; entryRight = 0 + 24 = 24.
    // entryRight(24) < x1a(50) -- branch 1; x1a(50) < x1b(87) -- elbow = x1b.
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([
      { x: 50, y: 120 },
      { x: 87, y: 120 },
      { x: 87, y: 12 },
      { x: 24, y: 12 },
    ]);
    expect(result.edges[0]!.label).toBeUndefined();
  });

  it('branch 1, x1a >= x1b: elbows through x1a + 10 instead', () => {
    const loop: RepeatComplex1Loop = {
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 20,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    };
    const result = routeRepeatComplex1(loop, edge, 0, 0);

    // x1b = 0 + 25 + 10 + 12 = 47 <= x1a(50) -- elbow = x1a + 10 = 60.
    expect(result.edges[0]!.points).toEqual([
      { x: 50, y: 120 },
      { x: 60, y: 120 },
      { x: 60, y: 12 },
      { x: 24, y: 12 },
    ]);
  });

  it('branch 2 (entryRight >= x1a): routes through the quarter-point middle', () => {
    const loop: RepeatComplex1Loop = {
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 100,
      diamond1: { width: 60, height: 24 },
      diamond2: { width: 50, height: 40 },
    };
    const result = routeRepeatComplex1(loop, edge, 0, 0);

    // entryRight = 0 + 60 = 60 >= x1a(50) -- branch 2.
    // middle = x1a / 4 + p2.x * 3/4 = 50/4 + 0 = 12.5; final point is p2.x (0), not entryRight.
    expect(result.edges[0]!.points).toEqual([
      { x: 50, y: 120 },
      { x: 12.5, y: 120 },
      { x: 12.5, y: 12 },
      { x: 0, y: 12 },
    ]);
  });

  it('applies dx1/dx2 to p1/p2 before any arithmetic (both lanes shift the branch)', () => {
    // Same shape as the first branch-1 test, but a nonzero dx1/dx2 proves
    // the translate is applied to p1/p2 FIRST (`FtileRepeat.java:359-360`),
    // not added on top of the untranslated result.
    const loop: RepeatComplex1Loop = {
      kind: 'repeat-complex1',
      p1: { x: 0, y: 100 },
      p2: { x: 0, y: 0 },
      repeatWidth: 100,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 50, height: 40 },
    };
    const result = routeRepeatComplex1(loop, edge, 20, 5);
    // p1 -> (20, 100); p2 -> (5, 0).
    // x1a = 20 + 50 = 70; x1b = 20 + 25 + 50 + 12 = 107; entryRight = 5 + 24 = 29.
    // entryRight(29) < x1a(70) -- branch 1; x1a(70) < x1b(107) -- elbow = 107.
    expect(result.edges[0]!.points).toEqual([
      { x: 70, y: 120 },
      { x: 107, y: 120 },
      { x: 107, y: 12 },
      { x: 29, y: 12 },
    ]);
  });

  // Golden: becanu-19-diti597's own repeat-back (condition col2 -> entry col1,
  // Lane deltas as in the repeat-out golden test above). Same X/Y caveat:
  // these are PRE-compress coordinates; the golden SVG's own points
  // (122.663, 148.337, 148.337, 63.675 after its +4.0 canvas offset) match
  // this function's X output (118.6625, 144.3375, 144.3375, 59.675) exactly
  // -- Y differs only because of the later, separate compress pass.
  it('matches becanu-19-diti597’s own pre-compress complex1 geometry', () => {
    const loop: RepeatComplex1Loop = {
      kind: 'repeat-complex1',
      p1: { x: 25.675, y: 227 }, // condition origin, untranslated
      p2: { x: 25.675, y: 75 }, // entry origin, untranslated
      repeatWidth: 51.35,
      diamond1: { width: 24, height: 24 },
      diamond2: { width: 24, height: 24 },
    };
    const result = routeRepeatComplex1(loop, edge, 68.9875, 10);
    expect(result.edges[0]!.points).toEqual([
      { x: 118.6625, y: 239 },
      { x: 144.3375, y: 239 },
      { x: 144.3375, y: 87 },
      { x: 59.675, y: 87 },
    ]);
  });
});
