/**
 * The `'gtile-repeat'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap (D10, the same reason
 * `walk-while-branch.ts`/`walk-fork-branches.ts` already exist).
 *
 * `walkTile`/`pushEdge`/`pushNode` are re-imported from `tile-coordinates
 * .ts`, which itself imports {@link walkRepeat} from here for its
 * `'gtile-repeat'` case -- a circular import between the two modules, safe
 * the same way `tile-coordinates.ts`/`walk-while-branch.ts` already are:
 * both sides are function DEFINITIONS, and neither calls into the other
 * until `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 *
 * altp-T6: draw ordering and point lists ported from `FtileRepeat.java`'s
 * `ConnectionIn`/`ConnectionBackSimple1`/`ConnectionBackSimple2`/
 * `ConnectionBackComplex1`/`ConnectionOut` (D5, D6, D7), replacing T5's
 * interim `GConnectionDownThenUp` left-side back edge (D8 retires that
 * class and `GtileRepeat.backEdgeLeftX`). `grep UEmpty
 * net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java`
 * finds nothing -- unlike `FtileWhile`, the repeat's back/in/out
 * connections reserve no `UEmpty` compression placeholder, so
 * `hexagon-reservations.ts` needs no new call site here.
 */

import type { GtileRepeat, RepeatBackConnection } from '../tiles/gtile-repeat.js';
import type { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { emitDiamondLabels } from './diamond-labels.js';
import { HEXAGON_HALF_SIZE } from './hexagon-reservations.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';

/** Every absolute-frame value {@link pushRepeatIn}/{@link pushRepeatBack}/
 *  {@link pushRepeatOut} share, computed once so those functions stay
 *  within the file's parameter limit -- mirrors `walk-while-branch.ts`'s
 *  own `WhileFrame`. Declared here, before every function that reads it
 *  (Lizard's TypeScript reader otherwise folds a trailing interface into
 *  the NLOC of whichever function precedes it -- `tile-layout.ts`'s own
 *  `tileNode` doc explains the same reader quirk). */
interface RepeatFrame {
  readonly out: Out;
  readonly entry: Tile;
  readonly body: Tile;
  readonly condition: GtileDiamondInside;
  readonly entryX: number;
  readonly entryY: number;
  readonly bodyX: number;
  readonly bodyY: number;
  readonly condX: number;
  readonly condY: number;
  readonly tileX: number;
  readonly tileWidth: number;
  readonly backConnection: RepeatBackConnection;
  readonly entryOutLane: string | undefined;
  readonly entryInLane: string | undefined;
  readonly bodyInLane: string | undefined;
  readonly bodyOutLane: string | undefined;
  readonly conditionInLane: string | undefined;
  readonly conditionOutLane: string | undefined;
}

/** Everything {@link buildRepeatFrame} needs, bundled to keep it (and
 *  {@link walkRepeat}, which builds this) under the file's parameter
 *  limit. Declared before every function for the same reader-quirk reason
 *  as {@link RepeatFrame}. */
interface RepeatOrigins {
  readonly t: GtileRepeat;
  readonly x: number;
  readonly entryX: number;
  readonly entryY: number;
  readonly bodyX: number;
  readonly bodyY: number;
  readonly condX: number;
  readonly condY: number;
  readonly entry: Tile;
  readonly body: Tile;
  readonly condition: GtileDiamondInside;
  readonly myLane: string | undefined;
  readonly out: Out;
}

/**
 * The repeat's entry point: pushed directly (never through `walkTile`'s
 * generic dispatch, which has no `'gtile-repeat-entry'` case and would fall
 * through to the unknown-kind default) as a `repeat-start` node -- the
 * label-less diamond `FtileRepeat.create` builds when `entry == null`
 * (`FtileRepeat.java:135-136`, `GtileRepeatEntry`'s own class doc). An
 * inline `repeat :label;` entry is a real action tile instead and walks
 * through `walkTile` like any other node (D2, {@link walkRepeat}).
 */
function pushRepeatEntry(
  entry: { width: number; height: number },
  x: number,
  y: number,
  myLane: string | undefined,
  out: Out,
): void {
  pushNode(
    out,
    { id: out.nextId('repeat-start'), kind: 'repeat-start', x, y, width: entry.width, height: entry.height },
    myLane,
  );
}

/**
 * The `'gtile-repeat'` case's condition hexagon: pushed directly (never
 * through `walkTile`'s generic dispatch, same as `if`'s own `diamond1`,
 * `walk-if-down.ts#pushDiamond1`), then its own side labels -- east is the
 * "is"/entry label, south is the "not"/exit label (default, no `backward`,
 * D1). Split out of the `'gtile-repeat'` case only to keep `walkTile`'s own
 * NLOC from growing (the case itself is unchanged besides this call).
 * `laneAt` resolves the condition's OWN `.swimlane` (`tileRepeat`'s
 * `outLane(node.swimlaneOut, node.swimlane)`, `FtileRepeat.java:149,152`)
 * over the parent's inherited `myLane` -- the same resolution `walkTile`'s
 * own dispatch (`:117-118`) applies to every tile it walks; bypassing
 * `walkTile` to push directly means this helper must apply it itself, or a
 * laned repeat's condition silently renders in the wrong lane. The pushed
 * node's `height` is the hexagon-ALONE height (`condition.getCoord(SOUTH_
 * HOOK).y`), not `condition.height` (which would add a north label's height
 * below it) -- the repeat condition never sets a north label (D1), so the
 * two are equal today, but this keeps the walker correct if one ever does.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:150-151
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:87-89
 */
function pushRepeatCondition(
  condition: GtileDiamondInside,
  condX: number,
  condY: number,
  myLane: string | undefined,
  out: Out,
): void {
  const hexLane = laneAt(condition, myLane);
  pushNode(
    out,
    {
      id: out.nextId('repeat-cond'),
      kind: 'repeat-cond',
      x: condX,
      y: condY,
      width: condition.width,
      height: condition.getCoord(SOUTH_HOOK).y,
      label: condition.label,
    },
    hexLane,
  );
  emitDiamondLabels(condition, { x: condX, y: condY }, ['south', 'east'], hexLane, out);
}

/** Copy of `walk-while-branch.ts`'s own `pushEdgeFlagged` (that file is
 *  outside this task's write-set, so sharing it would mean editing it;
 *  copied instead, per this task's own instructions). Pushes an edge, then
 *  overlays `emphasize`/`arrowhead: false` on the just-pushed edge -- widens
 *  `walk-if-down.ts`'s `pushEmphasizedEdge` idiom to also cover
 *  `arrowhead: false` (`Worm.java:161-168`'s `null` end decoration).
 *  `loop` (mission `activity-loop-lane-translate`, D1/D2) is threaded
 *  through `pushEdge`'s own routing argument rather than added as a fifth
 *  parameter, keeping this function at the file's 5-parameter cap. */
function pushEdgeFlagged(
  out: Out,
  points: GPoint[],
  lanes: readonly [string | undefined, string | undefined],
  flags: { emphasize?: 'up' | 'down'; arrowhead?: false; loop?: LoopTranslate },
): void {
  pushEdge(out, points, lanes[0], lanes[1], flags.loop !== undefined ? { loop: flags.loop } : 'default');
  const edge = out.edges[out.edges.length - 1]!;
  if (flags.emphasize !== undefined) edge.emphasize = flags.emphasize;
  if (flags.arrowhead === false) edge.arrowhead = false;
}

/**
 * `ConnectionIn#drawSnake` (`FtileRepeat.java:259-271`): a straight two-point
 * run when both ends share an x, else a dog-leg at the midpoint y --
 * `snake.addPoint(p1); if (p1.x != p2.x) { my = (p1.y+p2.y)/2; add(p1.x,my);
 * add(p2.x,my); } add(p2);`.
 */
function connectionInPoints(p1: GPoint, p2: GPoint): GPoint[] {
  if (p1.x === p2.x) return [p1, p2];
  const my = (p1.y + p2.y) / 2;
  return [p1, { x: p1.x, y: my }, { x: p2.x, y: my }, p2];
}

function buildRepeatFrame(o: RepeatOrigins): RepeatFrame {
  const { t, x, entryX, entryY, bodyX, bodyY, condX, condY, entry, body, condition, myLane, out } = o;
  return {
    out,
    entry,
    body,
    condition,
    entryX,
    entryY,
    bodyX,
    bodyY,
    condX,
    condY,
    tileX: x,
    tileWidth: t.width,
    backConnection: t.backConnection,
    entryOutLane: laneOut(entry, myLane),
    entryInLane: laneIn(entry, myLane),
    bodyInLane: laneIn(body, myLane),
    bodyOutLane: laneOut(body, myLane),
    conditionInLane: laneIn(condition, myLane),
    conditionOutLane: laneOut(condition, myLane),
  };
}

/**
 * `ConnectionIn` (`FtileRepeat.java:221-274`): `p1` = the entry's own point
 * out (`SOUTH_HOOK`), `p2` = the body's own point in (`NORTH_HOOK`); `asToDown`
 * (default terminal arrowhead, no flag needed), no label (`tbin1` is always
 * `null` -- no repeat fixture has an `arrow-label` line before its body, and
 * `tileNode`'s own `'arrow-label'` case always returns `null` regardless).
 */
function pushRepeatIn(frame: RepeatFrame): void {
  const { out, entry, entryX, entryY, body, bodyX, bodyY, entryOutLane, bodyInLane } = frame;
  const p1 = { x: entryX + entry.getCoord(SOUTH_HOOK).x, y: entryY + entry.getCoord(SOUTH_HOOK).y };
  const p2 = { x: bodyX + body.getCoord(NORTH_HOOK).x, y: bodyY + body.getCoord(NORTH_HOOK).y };
  pushEdge(out, connectionInPoints(p1, p2), entryOutLane, bodyInLane);
}

/**
 * `ConnectionOut` (`FtileRepeat.java:275-332`): skipped entirely when the
 * body has no point out (`getFtile1().calculateDimension().hasPointOut()
 * == false`, e.g. a body ending in `stop`) -- not even a reservation is
 * drawn in that case. Otherwise a straight two-point run from the body's
 * own point out (`SOUTH_HOOK`) to the condition's own point in
 * (`NORTH_HOOK`), `asToDown`, no label (`tbout1` always `null`, same reason
 * as {@link pushRepeatIn}). `p1`/`p2` here are exactly `ConnectionOut#getP1`/
 * `getP2` (`:285-293`) -- both already `getTranslateForRepeat`/
 * `getTranslateDiamond2`-translated, i.e. this tile's own absolute frame,
 * same as `drawU` reads -- so the `repeat-out` loop tag (mission
 * `activity-loop-lane-translate`, D2) carries these same two points
 * unchanged; only `routeLoopTranslate` ever applies a lane delta to them.
 */
function pushRepeatOut(frame: RepeatFrame): void {
  const { out, body, bodyX, bodyY, condition, condX, condY, bodyOutLane, conditionInLane } = frame;
  if (!body.hasPointOut()) return;
  const p1 = { x: bodyX + body.getCoord(SOUTH_HOOK).x, y: bodyY + body.getCoord(SOUTH_HOOK).y };
  const p2 = { x: condX + condition.getCoord(NORTH_HOOK).x, y: condY + condition.getCoord(NORTH_HOOK).y };
  const loop: LoopTranslate = { kind: 'repeat-out', p1, p2 };
  pushEdge(out, [p1, p2], bodyOutLane, conditionInLane, { loop });
}

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
function pushRepeatBack(frame: RepeatFrame): void {
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

export function walkRepeat(t: GtileRepeat, x: number, y: number, myLane: string | undefined, out: Out): void {
  const [entry, body, condition] = t.children;

  const entryX = x + t.entryOffsetX;
  const entryY = y + t.entryOffsetY;
  if (entry.kind === 'gtile-repeat-entry') {
    pushRepeatEntry(entry, entryX, entryY, myLane, out);
  } else {
    walkTile(entry, entryX, entryY, { kindHint: null, lane: myLane }, out);
  }

  // Each child sits so its OWN `left` lands under the tile's merged `left`
  // (`FtileRepeat.java:730-765`), never centred by `width / 2` -- except
  // the entry, whose OWN `width / 2` is used even when it is asymmetric
  // (`:744-748`, `GtileRepeat`'s own class doc).
  const bodyX = x + t.bodyOffsetX;
  const bodyY = y + t.bodyOffsetY;
  walkTile(body, bodyX, bodyY, { kindHint: null, lane: myLane }, out);

  const condX = x + t.conditionOffsetX;
  const condY = y + t.conditionOffsetY;
  pushRepeatCondition(condition, condX, condY, myLane, out);

  // D7: every child's own nodes first (entry, body's own walk, condition),
  // then this tile's own edges -- `In`, the selected `Back`, `Out`, in that
  // order (`FtileRepeat.java:170-203`).
  const frame = buildRepeatFrame({
    t,
    x,
    entryX,
    entryY,
    bodyX,
    bodyY,
    condX,
    condY,
    entry,
    body,
    condition,
    myLane,
    out,
  });
  pushRepeatIn(frame);
  pushRepeatBack(frame);
  pushRepeatOut(frame);
}
