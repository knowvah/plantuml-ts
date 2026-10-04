/**
 * `repeat`'s three same-lane back-connection point-list shapes
 * (`ConnectionBackSimple1`/`Simple2`/`Complex1#drawU`) plus the dispatcher
 * that picks one and the {@link LoopTranslate} record its cross-lane
 * `drawTranslate` counterpart needs -- split out of `walk-repeat.ts` only
 * to keep that file under the 500-line cap (T1p-d: adding the break-weld
 * push there would otherwise cross it), per CLAUDE.md "a sibling module
 * when a file would cross the 500-line hook". The body below is the
 * former functions' own code, unchanged, per CLAUDE.md "do not refactor
 * while porting".
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:333-404,537-683
 */

import type { GPoint } from '../tiles/points.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import type { RepeatFrame } from './walk-repeat.js';
import { pushEdgeFlagged } from './walk-repeat.js';

/**
 * `ConnectionBackSimple2#drawU` (`FtileRepeat.java:626-648`), the no-lane
 * default: from the condition's own RIGHT edge at mid-height, right to
 * `xmax = tileWidth - hexagonHalfSize` (OUTSIDE the tile's own box, on
 * the right), then up/down to the entry's own RIGHT edge at mid-height.
 * `p1`/`p2` there are `getTranslateDiamond2/1(...).getTranslated((0,0))`
 * -- the diamonds' own ORIGIN, not a hook -- so every x/y term below adds
 * the diamond's own width/height directly, never a `getCoord` call.
 */
function simple2Points(frame: RepeatFrame): GPoint[] {
  const { entry, entryX, entryY, condition, condX, condY, tileX, tileWidth } = frame;
  const x1 = condX + condition.width;
  const y1 = condY + condition.height / 2;
  const x2 = entryX + entry.width;
  const y2 = entryY + entry.height / 2;
  const xmax = tileX + tileWidth - HEXAGON_HALF_SIZE;
  return [
    { x: x1, y: y1 },
    { x: xmax, y: y1 },
    { x: xmax, y: y2 },
    { x: x2, y: y2 },
  ];
}

/**
 * `ConnectionBackSimple1#drawU` (`FtileRepeat.java:555-577`): the laned,
 * main-lane-first case -- from the condition's own LEFT edge at
 * mid-height, left to `xmin = tileX - hexagonHalfSize` (OUTSIDE the tile's
 * own box, on the left), then to the entry's own LEFT edge at mid-height.
 */
function simple1Points(frame: RepeatFrame): GPoint[] {
  const { entry, entryX, entryY, condition, condX, condY, tileX } = frame;
  const x1 = condX;
  const y1 = condY + condition.height / 2;
  const x2 = entryX;
  const y2 = entryY + entry.height / 2;
  const xmin = tileX - HEXAGON_HALF_SIZE;
  return [
    { x: x1, y: y1 },
    { x: xmin, y: y1 },
    { x: xmin, y: y2 },
    { x: x2, y: y2 },
  ];
}

/**
 * `ConnectionBackComplex1#drawSnake` (`FtileRepeat.java:364-402`): the
 * cross-lane case (`swimlane != swimlaneOut`). `x1_a` is the condition's
 * own RIGHT edge; `x1_b` sits `hexagonHalfSize` past the body's own
 * horizontal centre (`condX + condition.width/2 + body.width/2 + 12`).
 * When the entry's own RIGHT edge sits left of `x1_a`, the snake runs left
 * through an elbow at `x1_b` (or `x1_a + 10` when `x1_b` would sit at or
 * left of `x1_a`) down to the entry's RIGHT edge; otherwise it runs right
 * through the `x1_a`/entry-LEFT-edge quarter-point `middle` down to the
 * entry's own LEFT edge -- `d1.h`/`condition.h` here are `diamond1`/
 * `diamond2`'s FULL height (never overridden with a north-label term for
 * either shape, D1), matching `.height` directly rather than a hook.
 */
function complex1Points(frame: RepeatFrame): GPoint[] {
  const { entry, entryX, entryY, body, condition, condX, condY } = frame;
  const y1 = condY + condition.height / 2;
  const y2 = entryY + entry.height / 2;
  const x1a = condX + condition.width;
  const x1b = condX + condition.width / 2 + body.width / 2 + HEXAGON_HALF_SIZE;
  const entryRight = entryX + entry.width;

  if (entryRight < x1a) {
    const elbowX = x1a < x1b ? x1b : x1a + 10;
    return [
      { x: x1a, y: y1 },
      { x: elbowX, y: y1 },
      { x: elbowX, y: y2 },
      { x: entryRight, y: y2 },
    ];
  }

  const middle = x1a / 4 + (entryX * 3) / 4;
  return [
    { x: x1a, y: y1 },
    { x: middle, y: y1 },
    { x: middle, y: y2 },
    { x: entryX, y: y2 },
  ];
}

/**
 * The `LoopTranslate` record `routeLoopTranslate` needs to re-derive the
 * `Back{Simple1,Simple2,Complex1}#drawTranslate` shape once the walker's
 * own lane pass supplies `dx1`/`dx2` (D1/D2, mission
 * `activity-loop-lane-translate`). `p1`/`p2` are each connection's own
 * `getP1`/`getP2` (`:547-552`, `:618-623`, `:341-347`) -- the diamonds'
 * own UNTRANSLATED origins, `(condX, condY)`/`(entryX, entryY)` in this
 * walker's frame -- never the mid-height points {@link simple1Points}/
 * {@link simple2Points}/{@link complex1Points} compute for the same-lane
 * `drawU` shape. `repeatWidth` is `repeat.calculateDimension().getWidth()`
 * (`:583`, `:376-377`), i.e. `body.width` here, same tile
 * {@link complex1Points} already reads for its own `x1_b` term.
 */
function buildRepeatBackLoop(frame: RepeatFrame): LoopTranslate {
  const { entry, condition, body, condX, condY, entryX, entryY, backConnection } = frame;
  const p1 = { x: condX, y: condY };
  const p2 = { x: entryX, y: entryY };
  const diamond2 = { width: condition.width, height: condition.height };
  if (backConnection === 'simple1') {
    return { kind: 'repeat-simple1', p1, p2, repeatWidth: body.width, diamond1: { height: entry.height }, diamond2 };
  }
  const diamond1 = { width: entry.width, height: entry.height };
  if (backConnection === 'simple2') {
    return { kind: 'repeat-simple2', p1, p2, diamond1, diamond2 };
  }
  return { kind: 'repeat-complex1', p1, p2, repeatWidth: body.width, diamond1, diamond2 };
}

/**
 * Dispatches on {@link RepeatBackConnection} (decided at build time by
 * `tile-layout.ts#tileRepeat`, D5) and pushes the resulting point list with
 * `emphasize: 'up'` (`Snake#emphasizeDirection(UP)`, every one of the three
 * jar classes sets this) -- the terminal arrowhead direction itself is never
 * an explicit flag; `renderer.ts` derives it from the pushed points' own
 * final segment, which is why {@link simple1Points}/{@link simple2Points}/
 * {@link complex1Points} need no `asToLeft`/`asToRight` parameter. The
 * attached {@link buildRepeatBackLoop} record lets `routeLoopTranslate`
 * (mission `activity-loop-lane-translate`) redraw this same connection's
 * `drawTranslate` shape when the two lanes differ; the points pushed here
 * stay the same-lane `drawU` shape regardless (D1: only a translate shape
 * function ever reads the loop record).
 */
export function pushRepeatBack(frame: RepeatFrame): void {
  const { out, backConnection, conditionOutLane, entryInLane } = frame;
  const points =
    backConnection === 'simple1'
      ? simple1Points(frame)
      : backConnection === 'simple2'
        ? simple2Points(frame)
        : complex1Points(frame);
  const loop = buildRepeatBackLoop(frame);
  pushEdgeFlagged(out, points, [conditionOutLane, entryInLane], { emphasize: 'up', loop });
}
