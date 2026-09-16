/**
 * The `'gtile-if-down'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch (mission `activity-if-tile-port`
 * D5: one walker module per builder, one function per Java `Connection`).
 * `walkTile`/`pushEdge`/`pushNode` are re-imported from `tile-coordinates.ts`,
 * which itself imports {@link walkIfDown} for its `'gtile-if-down'` case --
 * a circular import between the two modules, safe the same way the fork/
 * while/with-links walkers already document: both sides are function
 * DEFINITIONS, neither calls the other until a real layout runs.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:524-537
 *   -- `drawU`'s node order.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:135-157
 *   -- `create`'s `conns` order.
 */

import type { GtileIfDown } from '../tiles/gtile-if-down.js';
import type { GPoint } from '../tiles/points.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../tiles/points.js';
import { laneIn, laneOut } from './swimlane-lanes.js';
import { ifElseHexagonReservation } from './hexagon-reservations.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

interface IfDownCtx {
  readonly t: GtileIfDown;
  readonly x: number;
  readonly y: number;
  readonly myLane: string | undefined;
  readonly out: Out;
}

function absolutePoint(local: GPoint, originX: number, originY: number): GPoint {
  return { x: originX + local.x, y: originY + local.y };
}

/** `diamond2`'s own local point translated to this walk's absolute frame --
 *  covers the real 24x24 rhombus, the `(0, 6)` invisible placeholder, and
 *  the `(0, 0)` `optionalStop` placeholder uniformly (`GtileIfDown`'s own
 *  `offsets.diamond2X/Y/Left/Size` already encode which of the three this
 *  is). */
function diamond2Point(t: GtileIfDown, x: number, y: number, localX: number, localY: number): GPoint {
  return { x: x + t.offsets.diamond2X + localX, y: y + t.offsets.diamond2Y + localY };
}

/** Pushes an edge, then overlays `emphasize` on the just-pushed edge --
 *  `pushEdge` (`tile-coordinates.ts`) is a shared helper this module does
 *  not widen. */
function pushEmphasizedEdge(
  out: Out,
  points: GPoint[],
  lanes: readonly [string | undefined, string | undefined],
  emphasize: 'down' | undefined,
): void {
  pushEdge(out, points, lanes[0], lanes[1]);
  if (emphasize !== undefined) out.edges[out.edges.length - 1]!.emphasize = emphasize;
}

function pushDiamondLabel(ctx: IfDownCtx, side: 'south' | 'west' | 'east', origin: GPoint): void {
  const { t, myLane, out } = ctx;
  const l = t.diamond1.labelAt(side);
  if (l === null) return;
  pushNode(
    out,
    {
      id: out.nextId('if-label'),
      kind: 'if-label',
      x: origin.x + l.x,
      y: origin.y + l.y,
      width: l.width,
      height: l.height,
      label: l.label,
    },
    myLane,
  );
}

/** `diamond1` node plus its south/west/east `if-label` children --
 *  `FtileDiamondInside#drawU`'s own order (hexagon, south, west, east).
 *  Down never sets `west` pre-swap; post-`swapEastWest()` (`useElse1`) the
 *  side label moves into the `west` slot, so all three are checked
 *  uniformly ({@link pushDiamondLabel} no-ops on an unset slot).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102 */
function pushDiamond1(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const dX = x + t.offsets.diamond1X;
  const dY = y + t.diamond1Y;
  pushNode(
    out,
    {
      id: out.nextId('if-split'),
      kind: 'if-split',
      x: dX,
      y: dY,
      width: t.diamond1.width,
      height: t.diamond1.height,
      label: t.diamond1.label,
    },
    myLane,
  );
  const origin = { x: dX, y: dY };
  pushDiamondLabel(ctx, 'south', origin);
  pushDiamondLabel(ctx, 'west', origin);
  pushDiamondLabel(ctx, 'east', origin);
}

/** The merge rhombus (`diamond2`, D2) -- pushed only when `hasMergeNode`
 *  (both original branches have a point out, no `optionalStop`). */
function pushMergeNode(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasMergeNode) return;
  pushNode(
    out,
    {
      id: out.nextId('if-merge'),
      kind: 'if-merge',
      x: x + t.offsets.diamond2X,
      y: y + t.offsets.diamond2Y,
      width: t.offsets.diamond2Size,
      height: t.offsets.diamond2Size,
    },
    myLane,
  );
}

/** `ConnectionIn` -- `diamond1.pointOut -> mainTile.pointIn`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:196-239 */
function connectionIn(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(SOUTH_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2 = absolutePoint(t.mainTile.getCoord(NORTH_HOOK), x + t.offsets.mainTileX, y + t.offsets.mainTileY);
  pushEdge(out, [p1, p2], laneOut(t.diamond1, myLane), laneIn(t.mainTile, myLane));
}

/** `ConnectionOut` -- `mainTile.pointOut -> diamond2.pointIn`, skipped when
 *  the main flow itself has no point out (independent of `optionalStop`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:241-302 */
function connectionOut(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasThenPointOut) return;
  const p1 = absolutePoint(t.mainTile.getCoord(SOUTH_HOOK), x + t.offsets.mainTileX, y + t.offsets.mainTileY);
  const p2 = diamond2Point(t, x, y, t.offsets.diamond2Left, 0);
  pushEdge(out, [p1, p2], laneOut(t.mainTile, myLane), myLane);
}

/** `ConnectionHorizontal` -- `diamond1` east point -> `optionalStop`'s own
 *  west-mid point.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:161-194 */
function connectionHorizontal(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const stop = t.optionalStop!;
  const p1 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2 = { x: x + t.stop.stopX, y: y + t.stop.stopY + stop.height / 2 };
  pushEdge(out, [p1, p2], laneOut(t.diamond1, myLane), laneIn(stop, myLane));
}

/** The wrapped then-frame's own absolute left/right edge, shared by
 *  `ConnectionElse1`/`Else2`/`ElseNoDiamond`'s own `xmin`/`xmax` terms. */
function wrapEdges(ctx: IfDownCtx): { left: number; right: number } {
  const { t, x } = ctx;
  const left = x + t.offsets.wrapX;
  return { left, right: left + t.offsets.wrapWidth };
}

/** `ConnectionElse1` -- diamond1 WEST to diamond2's D (west) point, routed
 *  left of the then-frame. `diamond1.swapEastWest()` was already applied by
 *  the caller, so the label now drawn at `west` is the side branch's own.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:304-354 */
function connectionElse1(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(WEST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2 = diamond2Point(t, x, y, 0, t.offsets.diamond2Size / 2);
  const { left: wrapLeft } = wrapEdges(ctx);
  const xmin = Math.min(p1.x - HEXAGON_HALF_SIZE, wrapLeft);
  const points = [p1, { x: xmin, y: p1.y }, { x: xmin, y: p2.y }, p2];
  pushEmphasizedEdge(out, points, [laneOut(t.diamond1, myLane), myLane], 'down');
  out.reservations.push(ifElseHexagonReservation(p2.x, p2.y));
}

/** `ConnectionElse2` -- diamond1 EAST to diamond2's B (east) point, routed
 *  right of the then-frame.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:356-407 */
function connectionElse2(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2 = diamond2Point(t, x, y, t.offsets.diamond2Size, t.offsets.diamond2Size / 2);
  const { right: wrapRight } = wrapEdges(ctx);
  const xmax = Math.max(p1.x + HEXAGON_HALF_SIZE, wrapRight);
  const points = [p1, { x: xmax, y: p1.y }, { x: xmax, y: p2.y }, p2];
  pushEmphasizedEdge(out, points, [laneOut(t.diamond1, myLane), myLane], 'down');
  out.reservations.push(ifElseHexagonReservation(p2.x, p2.y));
}

/** `ConnectionElseNoDiamond` -- `Else2`'s own shape, but ending at the
 *  whole tile's own point out (the main flow itself has no point out).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:447-458 */
function connectionElseNoDiamond(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2 = { x: x + t.left, y: y + t.height };
  const { right: wrapRight } = wrapEdges(ctx);
  const xmax = Math.max(p1.x + HEXAGON_HALF_SIZE, wrapRight);
  const points = [p1, { x: xmax, y: p1.y }, { x: xmax, y: p2.y }, p2];
  pushEmphasizedEdge(out, points, [laneOut(t.diamond1, myLane), myLane], 'down');
  out.reservations.push(ifElseHexagonReservation(p2.x, p2.y));
}

/** The single `conns[1]` slot -- `ConnectionHorizontal` when `optionalStop`,
 *  else `ElseNoDiamond` when the main flow has no point out, else
 *  `Else1`/`Else2` per `useElse1` (`FtileIfDown.java:137-153`). */
function pushElseConnector(ctx: IfDownCtx): void {
  const { t } = ctx;
  if (t.optionalStop !== null) {
    connectionHorizontal(ctx);
  } else if (!t.hasThenPointOut) {
    connectionElseNoDiamond(ctx);
  } else if (t.useElse1) {
    connectionElse1(ctx);
  } else {
    connectionElse2(ctx);
  }
}

export function walkIfDown(t: GtileIfDown, x: number, y: number, myLane: string | undefined, out: Out): void {
  const ctx: IfDownCtx = { t, x, y, myLane, out };
  walkTile(t.mainTile, x + t.offsets.mainTileX, y + t.offsets.mainTileY, { kindHint: null, lane: myLane }, out);
  pushDiamond1(ctx);
  if (t.optionalStop !== null) {
    walkTile(t.optionalStop, x + t.stop.stopX, y + t.stop.stopY, { kindHint: null, lane: myLane }, out);
  } else {
    pushMergeNode(ctx);
  }
  connectionIn(ctx);
  pushElseConnector(ctx);
  connectionOut(ctx);
}
