/**
 * The `'gtile-while'` case's full node/edge/reservation emission, split out
 * of `tile-coordinates.ts`'s `walkTile` switch only to keep that already-
 * oversized function (`#lizard forgives`, faithful port of the upstream
 * tile-kind dispatch) from growing further, and to keep `tile-coordinates
 * .ts` itself under the file's 500-line cap (mission `activity-klimt-
 * compress` README, "Push forward" -- "a sibling module when a file would
 * cross the 500-line hook", the same reason `walk-fork-branches.ts`
 * exists). The body below is the former case's own code, unchanged, per
 * CLAUDE.md "do not refactor while porting".
 *
 * `walkTile`/`pushEdge` are re-imported from `tile-coordinates.ts`, which
 * itself imports {@link walkWhile} from here for its `'gtile-while'` case
 * -- a circular import between the two modules, safe the same way
 * `tile-coordinates.ts`/`walk-fork-branches.ts` already are: both sides are
 * function DEFINITIONS, and neither calls into the other until
 * `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 *
 * altp-T4: draw ordering and point lists ported from `FtileWhile.java`'s
 * `ConnectionIn`/`ConnectionBackSimple`/`ConnectionBackEmpty`/
 * `ConnectionOut` and `FtileFactoryDelegatorWhile`'s break welding (D3, D6,
 * D7), replacing the home-grown straight-forward + `GConnectionVertical
 * DownThenBack` pair this module drew before. D8 retires `backEdgeRightX`
 * and `GConnectionVerticalDownThenBack` with this change -- `grep` shows no
 * reader of either outside this file and `layout.old.ts`.
 */

import type { GtileWhile } from '../tiles/gtile-while.js';
import type { GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { HEXAGON_HALF_SIZE, whileHexagonReservation } from './hexagon-reservations.js';
import { emitDiamondLabels } from './diamond-labels.js';

/**
 * The hexagon node then its own side labels, pushed as one atomic unit
 * (`diamond-labels.ts`'s own header cite for why). North is the "is"/entry
 * label, west is the "is not"/exit label. `laneAt` resolves the header's
 * OWN `.swimlane` over the parent's inherited `myLane` -- the same
 * resolution `walkTile`'s own dispatch (`tile-coordinates.ts:117-118`)
 * applies to every tile it walks; pushing a node directly (never through
 * `walkTile`, D1) means this helper must apply it itself. `tileWhile`
 * (`tile-layout.ts`) never calls `withSwimlane` on the header today, so
 * `header.swimlane` is always `undefined` here and `hexLane === myLane` --
 * kept for parity with `pushRepeatCondition`'s own fix and so a future
 * `tileWhile` change that DOES lane the header does not silently regress.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:125-127
 */
function pushWhileHeader(
  header: GtileDiamondInside,
  hX: number,
  hY: number,
  myLane: string | undefined,
  out: Out,
): void {
  const hexLane = laneAt(header, myLane);
  pushNode(
    out,
    {
      id: out.nextId('while-header'),
      kind: 'while-header',
      x: hX,
      y: hY,
      width: header.width,
      // The polygon is the hexagon ALONE: `drawU` draws
      // `Hexagon.asPolygon(dimTotal)` with `dimTotal = calculateDimensionAlone`
      // (`FtileDiamondInside.java:87-89`), while `header.height` is
      // `calculateDimensionFtile`'s, which adds the north label below it
      // (`:119-124`). `SOUTH_HOOK.y` is that alone height.
      height: header.getCoord(SOUTH_HOOK).y,
      label: header.label,
    },
    hexLane,
  );
  emitDiamondLabels(header, { x: hX, y: hY }, ['north', 'west'], hexLane, out);
}

/** Pushes an edge, then overlays `emphasize`/`arrowhead: false` on the
 *  just-pushed edge -- widens `walk-if-down.ts`'s `pushEmphasizedEdge`
 *  idiom to also cover `arrowhead: false` (D6, `Worm.java:161-168`'s `null`
 *  end decoration), which the while exit's second snake needs. */
function pushEdgeFlagged(
  out: Out,
  points: GPoint[],
  lanes: readonly [string | undefined, string | undefined],
  flags: { emphasize?: 'up' | 'down'; arrowhead?: false },
): void {
  pushEdge(out, points, lanes[0], lanes[1]);
  const edge = out.edges[out.edges.length - 1]!;
  if (flags.emphasize !== undefined) edge.emphasize = flags.emphasize;
  if (flags.arrowhead === false) edge.arrowhead = false;
}

/**
 * The five-point elbow `ConnectionBackSimple#drawU` and `ConnectionBack
 * Empty#drawU` share byte-for-byte: both compute `y1bis = max(backFrom.y,
 * bodyBottomY) + hexagonHalfSize`, then `backFrom -> (backFrom.x, y1bis) ->
 * (xx, y1bis) -> (xx, headerEast.y) -> headerEast`. They differ only in
 * what `backFrom` is (the body's own south exit vs. the header's own south
 * exit) and never in `bodyBottomY`/`xx`/`headerEast` -- both classes' own
 * `getBottom()` reads `whileBlock.calculateDimension()` identically.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:263-269
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:449-455
 */
function backEdgePoints(backFrom: GPoint, headerEast: GPoint, bodyBottomY: number, xx: number): GPoint[] {
  const y1bis = Math.max(backFrom.y, bodyBottomY) + HEXAGON_HALF_SIZE;
  return [backFrom, { x: backFrom.x, y: y1bis }, { x: xx, y: y1bis }, { x: xx, y: headerEast.y }, headerEast];
}

/** The absolute-frame values every `Connection*` below shares, computed
 *  once so `pushWhileBack`/`pushWhileOut` stay within the file's parameter
 *  limit. `headerEast`/`headerWest` are the header's own `EAST_HOOK`/
 *  `WEST_HOOK` translated -- both already sit at the hexagon's own
 *  mid-height (`gtile-diamond-inside.ts`'s `hexHeight / 2`), which is
 *  exactly `dimDiamond1.getInY() + (outY - inY) / 2` with `inY === 0`
 *  (`FtileDiamondInside.java:106-116`), so no separate `half` term is
 *  needed here. */
interface WhileFrame {
  readonly out: Out;
  readonly header: GtileDiamondInside;
  readonly body: Tile;
  readonly hX: number;
  readonly hY: number;
  readonly bX: number;
  readonly bY: number;
  readonly headerEast: GPoint;
  readonly headerWest: GPoint;
  readonly southHook: GPoint;
  readonly bodyBottomY: number;
  readonly xx: number;
  readonly elbowX: number;
  readonly headerOutLane: string | undefined;
  readonly headerInLane: string | undefined;
  readonly bodyInLane: string | undefined;
  readonly bodyOutLane: string | undefined;
}

/**
 * `ConnectionIn`, then `ConnectionBackSimple` -- or, when the body is truly
 * empty (`dim.getWidth() == 0 || dim.getHeight() == 0`), `ConnectionBack
 * Empty` in their place (no separate `ConnectionIn` is added at all in that
 * branch). `ConnectionBackSimple`'s own `drawU` returns early -- drawing
 * nothing, not even the reservation -- when the body has no point out
 * (`getP1` returns `null`, `:229-232`), e.g. a body ending in `stop`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:148-168
 */
function pushWhileBack(frame: WhileFrame): void {
  const {
    out,
    header,
    body,
    hX,
    hY,
    bX,
    bY,
    headerEast,
    bodyBottomY,
    xx,
    headerOutLane,
    headerInLane,
    bodyInLane,
    bodyOutLane,
  } = frame;
  const headerSouth = { x: hX + header.getCoord(SOUTH_HOOK).x, y: hY + header.getCoord(SOUTH_HOOK).y };

  if (body.width === 0 || body.height === 0) {
    pushEdgeFlagged(out, backEdgePoints(headerSouth, headerEast, bodyBottomY, xx), [headerOutLane, headerOutLane], {
      emphasize: 'up',
    });
    out.reservations.push(whileHexagonReservation(headerSouth.x, headerSouth.y, bodyBottomY));
    return;
  }

  const inTo = { x: bX + body.getCoord(NORTH_HOOK).x, y: bY + body.getCoord(NORTH_HOOK).y };
  pushEdge(out, new GConnectionVerticalDown().getPoints(headerSouth, inTo), headerOutLane, bodyInLane);
  if (!body.hasPointOut()) return;

  const backFrom = { x: bX + body.getCoord(SOUTH_HOOK).x, y: bY + body.getCoord(SOUTH_HOOK).y };
  pushEdgeFlagged(out, backEdgePoints(backFrom, headerEast, bodyBottomY, xx), [bodyOutLane, headerInLane], {
    emphasize: 'up',
  });
  out.reservations.push(whileHexagonReservation(backFrom.x, backFrom.y, bodyBottomY));
}

/**
 * `ConnectionOut`: from the header's own `WEST_HOOK` (mid-height, hexagon
 * left edge) left to `x = 12`, down to the tile's own `SOUTH_HOOK`
 * (`emphasizeDirection(DOWN)`); a second snake from `x = 12` across to the
 * `SOUTH_HOOK`'s own x (`t.left`) -- the tile's own exit point never moves,
 * only how the jar gets there. BOTH snakes use the two-argument
 * `Snake.create(skinParam, color)` overload (`Snake.java:138-142`), which
 * has no end decoration at all -- `arrowhead: false` on both, not only the
 * second (the emphasize arrow is drawn IN ADDITION to a terminal one,
 * never instead of a missing one, so the first snake needs its own flag
 * too). Not `ConnectionTranslatable`: both segments stay in the header's
 * own lane regardless of the body's, matching the header/`myLane` pairing
 * `ConnectionOut`'s own un-overridden `drawU` always uses.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:465-511
 */
function pushWhileOut(frame: WhileFrame): void {
  const { out, headerWest, southHook, elbowX, headerOutLane } = frame;
  pushEdgeFlagged(
    out,
    [headerWest, { x: elbowX, y: headerWest.y }, { x: elbowX, y: southHook.y }],
    [headerOutLane, headerOutLane],
    { emphasize: 'down', arrowhead: false },
  );
  pushEdgeFlagged(out, [{ x: elbowX, y: southHook.y }, southHook], [headerOutLane, headerOutLane], {
    arrowhead: false,
  });
}

/**
 * One weld per `break` the body walk emitted, appended LAST (D3, D7).
 * `FtileWhile`'s own `getWeldingPoints()` is never overridden
 * (`AbstractFtile.java:100`'s empty-list default), so a `break` nested
 * inside an INNER while/repeat is never visible here -- this scan (every
 * `'break'` node pushed while walking this while's own body) does not
 * model that boundary and would re-weld such a break; no baseline fixture
 * nests a loop with a `break` inside another loop (`fixtures.md`), so this
 * is a documented gap, not a fixed case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorWhile.java:101-116
 */
function pushWhileWeldings(out: Out, bodyNodeStart: number, bodyNodeEnd: number, elbowX: number): void {
  for (let i = bodyNodeStart; i < bodyNodeEnd; i++) {
    const breakNode = out.nodes[i]!;
    if (breakNode.kind !== 'break') continue;
    pushEdge(
      out,
      [
        { x: breakNode.x, y: breakNode.y },
        { x: elbowX, y: breakNode.y },
      ],
      breakNode.swimlane,
      undefined,
    );
  }
}

/** Everything {@link buildWhileFrame} needs, bundled to keep it (and
 *  {@link walkWhile}, which builds this) under the file's parameter limit. */
interface WhileOrigins {
  readonly t: GtileWhile;
  readonly x: number;
  readonly y: number;
  readonly hX: number;
  readonly hY: number;
  readonly bX: number;
  readonly bY: number;
  readonly header: GtileDiamondInside;
  readonly body: Tile;
  readonly myLane: string | undefined;
  readonly out: Out;
}

/** Builds the {@link WhileFrame} every `Connection*` push reads from --
 *  split out of {@link walkWhile} only to keep that function's own NLOC
 *  under the file's limit. */
function buildWhileFrame(o: WhileOrigins): WhileFrame {
  const { t, x, y, hX, hY, bX, bY, header, body, myLane, out } = o;
  return {
    out,
    header,
    body,
    hX,
    hY,
    bX,
    bY,
    headerEast: { x: hX + header.getCoord(EAST_HOOK).x, y: hY + header.getCoord(EAST_HOOK).y },
    headerWest: { x: hX + header.getCoord(WEST_HOOK).x, y: hY + header.getCoord(WEST_HOOK).y },
    southHook: { x: x + t.getCoord(SOUTH_HOOK).x, y: y + t.getCoord(SOUTH_HOOK).y },
    bodyBottomY: bY + body.height,
    xx: x + t.width,
    elbowX: x + HEXAGON_HALF_SIZE,
    headerOutLane: laneOut(header, myLane),
    headerInLane: laneIn(header, myLane),
    bodyInLane: laneIn(body, myLane),
    bodyOutLane: laneOut(body, myLane),
  };
}

export function walkWhile(t: GtileWhile, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = t.children;
  // D1: the header is always a `GtileDiamondInside` (`tile-layout.ts#tileWhile`).
  const header = rawChildren[0] as unknown as GtileDiamondInside;
  const body = rawChildren[1]!;
  // Each child sits so its OWN `left` lands under the tile's merged `left`
  // (`FtileWhile.java:621-641`: `x = dimTotal.getLeft() - child.getLeft()`),
  // never centred by `width / 2` -- an asymmetric body (an `if`) would slant
  // the forward and back edges.
  const hX = x + t.headerOffsetX;
  const hY = y + t.headerOffsetY;
  pushWhileHeader(header, hX, hY, myLane, out);

  const bX = x + t.bodyOffsetX;
  const bY = y + t.bodyOffsetY;
  const bodyNodeStart = out.nodes.length;
  walkTile(body, bX, bY, { kindHint: null, lane: myLane }, out);
  const bodyNodeEnd = out.nodes.length;

  const frame = buildWhileFrame({ t, x, y, hX, hY, bX, bY, header, body, myLane, out });

  // D7: In/Back(Simple|Empty), then Out, then break weldings.
  pushWhileBack(frame);
  pushWhileOut(frame);
  pushWhileWeldings(out, bodyNodeStart, bodyNodeEnd, frame.elbowX);
}
