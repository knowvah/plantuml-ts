/**
 * `routeWhileBack` -- `FtileWhile.ConnectionBackSimple#drawTranslate`
 * (`ftile/vcompact/FtileWhile.java:277-308`), mission
 * `activity-loop-lane-translate` T2.
 */
import { describe, expect, it } from 'vitest';
import { routeWhileBack } from '../../../../src/diagrams/activity/layout/swimlane-loop-translate-while.js';
import type { WhileBackLoop } from '../../../../src/diagrams/activity/layout/swimlane-loop-translate.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';

const baseEdge: ActivityEdgeGeo = { points: [{ x: 999, y: 999 }], emphasize: 'up' };

describe('routeWhileBack', () => {
  it('computes the five-point snake from hand-derived numbers (FtileWhile.java:289-300)', () => {
    // p1 = (10, 40); p2 = (0, 0); diamond width=20, inY=0, outY=10 (half=5);
    // dimTotalWidth=100; dx1=dx2=0 (same-lane inputs, isolating the
    // formula from the swimlane-translate term).
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 10, y: 40 },
      p2: { x: 0, y: 0 },
      dimTotalWidth: 100,
      diamond: { inY: 0, outY: 10, width: 20 },
    };
    const result = routeWhileBack(loop, baseEdge, 0, 0);
    // x1=10, y1=40; x2 = 0+20 = 20; half=(10-0)/2=5; y2 = 0+0+5 = 5;
    // y1bis = 40+12 = 52 (Hexagon.hexagonHalfSize, Hexagon.java:46);
    // xx = max(0,0)+100 = 100.
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0]!.points).toEqual([
      { x: 10, y: 40 },
      { x: 10, y: 52 },
      { x: 100, y: 52 },
      { x: 100, y: 5 },
      { x: 20, y: 5 },
    ]);
  });

  it('places midArrowAt at (xx, (y1+y2)/2) with dir "up", no emphasizeDirection (:306-307)', () => {
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 10, y: 40 },
      p2: { x: 0, y: 0 },
      dimTotalWidth: 100,
      diamond: { inY: 0, outY: 10, width: 20 },
    };
    const result = routeWhileBack(loop, baseEdge, 0, 0);
    expect(result.edges[0]!.midArrowAt).toEqual({ x: 100, y: 22.5, dir: 'up' });
    expect(result.edges[0]!.emphasize).toBeUndefined();
  });

  it('reserves a 5x12 UEmpty at (x1, y1bis) (:304, Hexagon.java:46)', () => {
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 10, y: 40 },
      p2: { x: 0, y: 0 },
      dimTotalWidth: 100,
      diamond: { inY: 0, outY: 10, width: 20 },
    };
    const result = routeWhileBack(loop, baseEdge, 0, 0);
    expect(result.reservations).toEqual([{ x: 10, y: 52, width: 5, height: 12 }]);
  });

  it('takes xx from Math.max(translate1.dx, translate2.dx) (:297), not dx1 or dx2 alone', () => {
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 10, y: 40 },
      p2: { x: 0, y: 0 },
      dimTotalWidth: 100,
      diamond: { inY: 0, outY: 10, width: 20 },
    };
    // translate1 (body's own lane) = 5, translate2 (header's own lane) = 30.
    const result = routeWhileBack(loop, baseEdge, 5, 30);
    const pts = result.edges[0]!.points;
    // x1 = p1.x + dx1 = 15; x2 = p2.x + dx2 + diamond.width = 0+30+20 = 50.
    expect(pts[0]).toEqual({ x: 15, y: 40 });
    expect(pts[4]).toEqual({ x: 50, y: 5 });
    // xx = max(5, 30) + 100 = 130, not 105 (max(dx1) alone) or 130-25.
    expect(pts[2]!.x).toBe(130);
    expect(result.edges[0]!.midArrowAt!.x).toBe(130);
  });

  it('preserves edge fields other than emphasize (e.g. arrowhead) unchanged', () => {
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 0, y: 0 },
      p2: { x: 0, y: 0 },
      dimTotalWidth: 10,
      diamond: { inY: 0, outY: 0, width: 0 },
    };
    const edgeWithColor: ActivityEdgeGeo = { points: [], emphasize: 'up', color: '#181818' };
    const result = routeWhileBack(loop, edgeWithColor, 0, 0);
    expect(result.edges[0]!.color).toBe('#181818');
    expect(result.edges[0]!.emphasize).toBeUndefined();
  });

  // ---------------------------------------------------------------------
  // Golden coordinates -- kijazo-83-kipu485
  // (test-results/dot-cache/activity/kijazo-83-kipu485/in.svg), the row
  // T0 confirmed as CROSS-LANE while-back (fixtures.md). Inputs below are
  // read directly off that golden SVG (the header hexagon's own polygon
  // points, the "Remplissage du formulaire" rect, and the terminal
  // <line>/<polygon> forming the back edge) -- NOT this port's own
  // rendering, which additionally passes through `compress-geometry.ts`'s
  // slot compaction (out of this task's write-set, per its own
  // "Never: touch layout.old.ts or compress-geometry.ts" boundary) after
  // `routeWhileBack` returns. `routeWhileBack` is the PRE-compression
  // shape `ConnectionBackSimple#drawTranslate` computes; verifying it
  // against the jar's own pre-elbow-compaction quantities (the two
  // endpoints, which compression never moves relative to each other on
  // this axis -- see this task's own report) is the faithful-port check;
  // the elbow's post-compaction Y (295.306 in the golden, not 297.306) is
  // `compress-geometry.ts`'s own transform, applied identically whether
  // this shape is same-lane (`drawU`) or cross-lane (`drawTranslate`) --
  // confirmed against `xovano-23-tazo278`'s own same-lane elbow, which
  // shows the identical 12->10 compaction on a file this task never
  // touched.
  // ---------------------------------------------------------------------
  it('reproduces the jar-derived pre-compression shape for kijazo-83-kipu485', () => {
    // p1 = the body's own south exit, "Remplissage du formulaire"'s rect
    // bottom-center: x = 309.156 + 156.125/2, y = 253.306 + 32.
    const loop: WhileBackLoop = {
      kind: 'while-back',
      p1: { x: 387.2185, y: 285.306 },
      // p2 = diamond1's own origin: the header hexagon polygon's top-left,
      // (min x, min y) of "79.713,132.5,186.756,132.5,198.756,144.5,
      // 186.756,156.5,79.713,156.5,67.713,144.5" -- min x = 67.713.
      p2: { x: 67.713, y: 132.5 },
      // dimTotalWidth: the while tile's own width -- the terminal elbow's
      // own `xx` (537.056) with dx1=dx2=0 below.
      dimTotalWidth: 537.056,
      // diamond1.calculateDimension(): width = hexagon-ALONE width
      // (198.756 - 67.713 = 131.043); inY=0, outY = hexagon-alone height
      // (156.5 - 132.5 = 24) (FtileDiamondInside.java:106-116).
      diamond: { inY: 0, outY: 24, width: 131.043 },
    };
    const result = routeWhileBack(loop, baseEdge, 0, 0);
    const pts = result.edges[0]!.points;
    // Endpoints: unaffected by compression (node-derived, not an interior
    // compacted segment) -- match the golden exactly.
    expect(pts[0]!.x).toBeCloseTo(387.219, 2);
    expect(pts[0]!.y).toBeCloseTo(285.306, 2);
    expect(pts[4]!.x).toBeCloseTo(198.756, 2);
    expect(pts[4]!.y).toBeCloseTo(144.5, 2);
    // Elbow x (xx) matches the golden's own vertical run's x; pts[3] is
    // (xx, y2) -- y2 unaffected by compression (a node-hook y), matches
    // the golden's final horizontal segment's own y (144.5) exactly.
    expect(pts[2]!.x).toBeCloseTo(537.056, 2);
    expect(pts[3]!.x).toBeCloseTo(537.056, 2);
    expect(pts[3]!.y).toBeCloseTo(144.5, 2);
  });
});
