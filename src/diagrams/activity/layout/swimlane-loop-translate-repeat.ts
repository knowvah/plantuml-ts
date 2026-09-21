/**
 * `repeat`'s four translatable back-edge shapes plus its exit connector
 * (mission `activity-loop-lane-translate`, T3). Each function is the
 * `drawTranslate` half of its Java counterpart in
 * `ftile/vcompact/FtileRepeat.java`: apply the two lane deltas to the
 * loop record's own untranslated `p1`/`p2` (each connection's own
 * `getP1`/`getP2`), then reproduce that method's arithmetic term for term.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:309-331,357-404,579-606,651-676
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import type { GPoint } from '../tiles/points.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import type {
  LoopRouteResult,
  RepeatComplex1Loop,
  RepeatOutLoop,
  RepeatSimple1Loop,
  RepeatSimple2Loop,
} from './swimlane-loop-translate.js';

/** `exactOptionalPropertyTypes` forbids `label: undefined` -- every repeat
 *  loop record's `label` is optional and, in this port, always unset
 *  (`tbback`/`tbout` are only ever non-null when a fixture's
 *  `arrow-label`/incoming-link text populates them, none in the corpus
 *  does), so the key must be OMITTED, not set to `undefined`. */
function withLabel(edge: ActivityEdgeGeo, label: string | undefined): ActivityEdgeGeo {
  return label === undefined ? edge : { ...edge, label };
}

/**
 * `ConnectionOut#drawTranslate` (`:309-331`): two edges (D3). The first is
 * an unarrowed elbow `mp1a -> (mp1a.x, middle) -> (mp2b.x, middle)` with NO
 * `emphasizeDirection` (`Snake.create(skinParam(), arrowColor)`, no arrow
 * argument, `Worm.java:161-168`'s null end decoration -- `arrowhead:
 * false`). The second is the short `small` snake `(mp2b.x, middle) ->
 * mp2b`, `asToDown` (the renderer's terminal-arrow direction already comes
 * from the pushed points' own final segment, `renderer.ts:213-220`) with
 * the `tbout` label.
 */
export function routeRepeatOut(loop: RepeatOutLoop, edge: ActivityEdgeGeo, dx1: number, dx2: number): LoopRouteResult {
  const mp1a = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2b = { x: loop.p2.x + dx2, y: loop.p2.y };
  const middle = (mp1a.y + mp2b.y) / 2;
  const elbow: ActivityEdgeGeo = {
    ...edge,
    points: [mp1a, { x: mp1a.x, y: middle }, { x: mp2b.x, y: middle }],
    arrowhead: false,
  };
  const drop = withLabel({ ...edge, points: [{ x: mp2b.x, y: middle }, mp2b] }, loop.label);
  return { edges: [elbow, drop], reservations: [] };
}

/**
 * `ConnectionBackSimple1#drawTranslate` (`:579-606`): `p1`/`p2` here are
 * `getP1`/`getP2` (`:547-552`), the diamonds' own untranslated origins, so
 * `x1 = p1.x` and `x2 = p2.x` need no further offset -- only `y1`/`y2` add
 * the diamonds' own half-heights, and `xmax` reads the ALREADY-translated
 * `p1.x` (the Java reassigns `p1 = translate1.getTranslated(p1)` at `:587`
 * before computing `xmax` at `:597`).
 */
export function routeRepeatSimple1(
  loop: RepeatSimple1Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const p1 = { x: loop.p1.x + dx1, y: loop.p1.y };
  const p2 = { x: loop.p2.x + dx2, y: loop.p2.y };
  const y1 = p1.y + loop.diamond2.height / 2;
  const y2 = p2.y + loop.diamond1.height / 2;
  const xmax = p1.x + loop.diamond2.width / 2 + loop.repeatWidth / 2 + HEXAGON_HALF_SIZE;
  const points: GPoint[] = [
    { x: p1.x, y: y1 },
    { x: xmax, y: y1 },
    { x: xmax, y: y2 },
    { x: p2.x, y: y2 },
  ];
  return { edges: [withLabel({ ...edge, points }, loop.label)], reservations: [] };
}

/**
 * `ConnectionBackSimple2#drawTranslate` (`:651-676`): `x1`/`x2a`/`x2b` add
 * the diamonds' own widths to the (translated) origins; `isOnA` picks the
 * exit side and, with it, which of `asToRight`/`asToLeft` the terminal
 * arrow draws -- the renderer already derives that from the pushed points'
 * own final segment (no explicit flag needed, same as {@link
 * routeRepeatSimple1}).
 */
export function routeRepeatSimple2(
  loop: RepeatSimple2Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const p1 = { x: loop.p1.x + dx1, y: loop.p1.y };
  const p2 = { x: loop.p2.x + dx2, y: loop.p2.y };
  const x1 = p1.x + loop.diamond2.width;
  const y1 = p1.y + loop.diamond2.height / 2;
  const x2a = p2.x;
  const x2b = p2.x + loop.diamond1.width;
  const isOnA = x1 < (x2a + x2b) / 2;
  const x2 = isOnA ? x2a : x2b;
  const y2 = p2.y + loop.diamond1.height / 2;
  const xmiddle = (x1 + x2) / 2;
  const points: GPoint[] = [
    { x: x1, y: y1 },
    { x: xmiddle, y: y1 },
    { x: xmiddle, y: y2 },
    { x: x2, y: y2 },
  ];
  return { edges: [withLabel({ ...edge, points }, loop.label)], reservations: [] };
}

/**
 * `ConnectionBackComplex1#drawSnake`'s point arithmetic (`:364-401`), split
 * out of {@link routeRepeatComplex1} to keep that function under the
 * file's NLOC cap: `x1a`/`x1b` from `diamond2` (the condition), the branch
 * on `entryRight = p2.x + diamond1.width` against `x1a`, and the
 * `elbowX`/`middle` elbow each branch computes -- matches `complex1Points`
 * in `walk-repeat.ts`'s own same-lane `drawU` port term for term, `p1`/`p2`
 * here already lane-translated by the caller.
 */
function complex1TranslatePoints(p1: GPoint, p2: GPoint, loop: RepeatComplex1Loop): GPoint[] {
  const y1 = p1.y + loop.diamond2.height / 2;
  const y2 = p2.y + loop.diamond1.height / 2;
  const x1a = p1.x + loop.diamond2.width;
  const x1b = p1.x + loop.diamond2.width / 2 + loop.repeatWidth / 2 + HEXAGON_HALF_SIZE;
  const entryRight = p2.x + loop.diamond1.width;

  if (entryRight < x1a) {
    const elbowX = x1a < x1b ? x1b : x1a + 10;
    return [
      { x: x1a, y: y1 },
      { x: elbowX, y: y1 },
      { x: elbowX, y: y2 },
      { x: entryRight, y: y2 },
    ];
  }
  const middle = x1a / 4 + (p2.x * 3) / 4;
  return [
    { x: x1a, y: y1 },
    { x: middle, y: y1 },
    { x: middle, y: y2 },
    { x: p2.x, y: y2 },
  ];
}

/**
 * `ConnectionBackComplex1#drawTranslate` (`:356-362`): apply the two lane
 * deltas to `p1`/`p2` (`getP1`/`getP2`, `:341-347` -- the diamonds' own
 * untranslated origins), then {@link complex1TranslatePoints}'s shape.
 * Never a label (`tbback` does not exist on this connection, `:333-339`).
 */
export function routeRepeatComplex1(
  loop: RepeatComplex1Loop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const p1 = { x: loop.p1.x + dx1, y: loop.p1.y };
  const p2 = { x: loop.p2.x + dx2, y: loop.p2.y };
  const points = complex1TranslatePoints(p1, p2, loop);
  return { edges: [{ ...edge, points }], reservations: [] };
}
