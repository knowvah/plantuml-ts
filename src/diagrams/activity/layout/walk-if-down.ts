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
import type { DiamondConditionTile } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../tiles/points.js';
import { laneIn, laneOut } from './swimlane-lanes.js';
import { pushLaneReservation } from './swimlane-reservation-lane.js';
import { ifElseHexagonReservation } from './hexagon-reservations.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

/** `ActivityNodeGeo.diamondShape`'s own producer (add3-T3c) -- keyed on
 *  the concrete tile's `kind`, duplicated (not imported) in `walk-if-
 *  with-links.ts` per this mission's own "one walker owns its own small
 *  draw-site constant" precedent (`NOTE_STACK_MARGIN`'s duplication,
 *  `layout/walk-with-notes.ts`). */
function diamondShapeOf(diamond: DiamondConditionTile): 'inside' | 'square' | 'empty' {
  if (diamond.kind === 'gtile-diamond-empty') return 'empty';
  if (diamond.kind === 'gtile-diamond-square') return 'square';
  return 'inside';
}

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

function pushDiamondLabel(ctx: IfDownCtx, side: 'north' | 'south' | 'west' | 'east', origin: GPoint): void {
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

/** `diamond1`'s own label, pushed as its own `'if-own-label'` node (T3k) --
 *  {@link pushDiamond1}'s own doc for why it is a separate push, not baked
 *  into the polygon node. No-ops on an empty label -- the OLD combined push
 *  relied on `renderNode`'s own `node.label !== ''` dispatch to skip the
 *  text (`renderDiamond`'s unlabelled shape has no text at all); now that
 *  the label is its own node, this walker must apply that same guard
 *  itself, or an empty `<text>` would appear where upstream's unlabelled
 *  `FtileDiamond` (a different class, no label slot) draws nothing. */
function pushDiamondOwnLabel(ctx: IfDownCtx, dX: number, dY: number): void {
  const { t, myLane, out } = ctx;
  if (t.diamond1.label === '') return;
  pushNode(
    out,
    {
      id: out.nextId('if-own-label'),
      kind: 'if-own-label',
      x: dX,
      y: dY,
      width: t.diamond1.width,
      height: t.diamond1.height,
      label: t.diamond1.label,
    },
    myLane,
  );
}

/** `diamond1`'s polygon, then its north/south/own-label/west/east children,
 *  in `FtileDiamondInside#drawU`'s own order (T3k) -- the polygon and the
 *  own label are two SEPARATE draw calls upstream, not one combined blob
 *  (`renderNode`'s own `'if-split'` case draws the polygon only when
 *  labelled; the own label draws through the `'if-own-label'` node below).
 *  Still pushed under the ORIGINAL `'if-split'` kind (not a dedicated one)
 *  so `canvas-origin.ts`'s polygon fudge and `shapes-of.ts`'s condition-box
 *  treatment, both already keyed on that name, apply unchanged; the SAME
 *  kind also covers the label-less case (`renderNode`'s own ternary falls
 *  to `renderDiamond`). Down never sets `west` pre-swap; post-
 *  `swapEastWest()` (`useElse1`) the side label moves into the `west`
 *  slot, so all three sides are checked uniformly ({@link pushDiamondLabel}
 *  no-ops an unset slot); `north` is never set for `diamond1` today
 *  (`gtile-if-down.ts` only calls `.withSouth`), kept for parity with
 *  upstream's own unconditional `north.drawU` call.
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
      diamondShape: diamondShapeOf(t.diamond1),
    },
    myLane,
  );
  const origin = { x: dX, y: dY };
  pushDiamondLabel(ctx, 'north', origin);
  pushDiamondLabel(ctx, 'south', origin);
  pushDiamondOwnLabel(ctx, dX, dY);
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

/** `ConnectionOut` -- `mainTile.pointOut -> diamond2`'s own point, skipped
 *  when the main flow itself has no point out (independent of
 *  `optionalStop`). The target Y differs by `conditionEndStyle`
 *  (`getP2` vs `getP2hline`, `:254-264,275-278`) -- see
 *  {@link GtileIfDown.offsets}' own `diamond2PointInY` doc comment.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:241-302 */
function connectionOut(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasThenPointOut) return;
  const p1 = absolutePoint(t.mainTile.getCoord(SOUTH_HOOK), x + t.offsets.mainTileX, y + t.offsets.mainTileY);
  const p2 = diamond2Point(t, x, y, t.offsets.diamond2Left, t.offsets.diamond2PointInY);
  const lane1 = laneOut(t.mainTile, myLane);
  // IFDS (T3d, `lukoxa-16-cecu095`): `optionalStop !== null` means
  // `diamond2` was replaced with a bare `new FtileEmpty(skinParam)`
  // (`FtileIfDown.java:130-131`) carrying NO swimlane -- `ConnectionCross
  // .java:58-60` skips the cross-lane draw and the edge stays inside the
  // then-lane (`UGraphicInterceptorOneSwimlane.java:96-99`), never jogging
  // back to the if's own ambient lane the way a real cross-lane diamond2
  // would.
  const lane2 = t.optionalStop !== null ? lane1 : myLane;
  pushEdge(out, [p1, p2], lane1, lane2);
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
  // `Connection(diamond1, diamond2)`: drawn in diamond1's lane pass (`FtileIfDown.java:308,349,360,402,440`).
  pushLaneReservation(out.reservations, ifElseHexagonReservation(p2.x, p2.y), laneOut(t.diamond1, myLane));
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
  // `Connection(diamond1, diamond2)`: drawn in diamond1's lane pass (`FtileIfDown.java:308,349,360,402,440`).
  pushLaneReservation(out.reservations, ifElseHexagonReservation(p2.x, p2.y), laneOut(t.diamond1, myLane));
}

/**
 * `ConnectionElseHline` (extends `ConnectionElse2`, T1p-a, `FULL` strategy
 * -- default, no `withMerge` call) -- draws only the APPROACH leg (diamond1
 * EAST -> the bend directly above diamond2's own east-mid point);
 * {@link connectionHline} draws the actual closing bar from that SAME bend
 * point onward. Default arrowhead (`asToDown`); UNLIKE `Else1`/`Else2`, no
 * `emphasizeDirection` (the override replaces `drawU` entirely and never
 * calls it) -- do not add `pushEmphasizedEdge`'s `emphasize` here.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:409-445
 */
function connectionElseHline(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const p2y = diamond2Point(t, x, y, 0, t.offsets.diamond2PointInY).y;
  const { right: wrapRight } = wrapEdges(ctx);
  const xmax = Math.max(p1.x + HEXAGON_HALF_SIZE, wrapRight);
  pushEdge(out, [p1, { x: xmax, y: p1.y }, { x: xmax, y: p2y }], laneOut(t.diamond1, myLane), myLane);
  // `Connection(diamond1, diamond2)`: drawn in diamond1's lane pass (`FtileIfDown.java:308,349,360,402,440`).
  pushLaneReservation(out.reservations, ifElseHexagonReservation(xmax, p2y), laneOut(t.diamond1, myLane));
}

/**
 * `ConnectionHline` (`withMerge(NONE)`, `:512` -- T1b wires `mergeable`
 * from this comment) -- the closing bar from {@link connectionElseHline}'s
 * own bend point LEFT into diamond2's own east-mid point, then DOWN into
 * its south/out point. No arrowhead (`Snake.create(skinParam(), color)` --
 * no third argument).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfDown.java:461-522
 */
function connectionHline(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.offsets.diamond1X, y + t.diamond1Y);
  const { right: wrapRight } = wrapEdges(ctx);
  const xmax = Math.max(p1.x + HEXAGON_HALF_SIZE, wrapRight);
  const p2 = diamond2Point(t, x, y, t.offsets.diamond2Size, t.offsets.diamond2PointInY);
  const p3 = diamond2Point(t, x, y, t.offsets.diamond2Size, 2 * t.offsets.diamond2PointInY);
  pushEdge(out, [{ x: xmax, y: p2.y }, p2, p3], myLane, myLane);
  const edge = out.edges[out.edges.length - 1]!;
  edge.arrowhead = false;
  edge.mergeable = 'NONE';
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
  // `Connection(diamond1, diamond2)`: drawn in diamond1's lane pass (`FtileIfDown.java:308,349,360,402,440`).
  pushLaneReservation(out.reservations, ifElseHexagonReservation(p2.x, p2.y), laneOut(t.diamond1, myLane));
}

/** The single `conns[1]` slot (plus, under `hline`, the extra `conns[2]`
 *  `ConnectionHline` slot pushed right alongside it) -- `ConnectionHorizontal`
 *  when `optionalStop`, else `ElseNoDiamond` when the main flow has no point
 *  out, else -- `'hline'`: `ElseHline` + `Hline`, unconditionally; `'diamond'`:
 *  `Else1`/`Else2` per `useElse1` (`FtileIfDown.java:137-153`). */
function pushElseConnector(ctx: IfDownCtx): void {
  const { t } = ctx;
  if (t.optionalStop !== null) {
    connectionHorizontal(ctx);
  } else if (!t.hasThenPointOut) {
    connectionElseNoDiamond(ctx);
  } else if (t.conditionEndStyle === 'hline') {
    connectionElseHline(ctx);
    connectionHline(ctx);
  } else if (t.useElse1) {
    connectionElse1(ctx);
  } else {
    connectionElse2(ctx);
  }
}

/** `FtileIfDown#drawU`'s own `if (!isEmpty(opale)) opale.drawU(ug.apply
 *  (UTranslate.dx(xOpale)))` (`:527-530`) -- FIRST in draw order, no `y`
 *  translate at all (the note sits flush at this composite's own top,
 *  `y=0` in its local frame; `diamond1Y` is what moves BELOW it). Never a
 *  spike -- `createOpale`'s own `withLink=false` (`FtileIfWithDiamonds
 *  .java:129`), same no-spike path `GtileNoteOpale.withLink` already
 *  threads for the simple-leaf wrap (T3g). */
function pushIfOwnNote(ctx: IfDownCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (t.opale === null) return;
  const noteX = x + t.offsets.diamond1X - t.opale.box.width;
  pushNode(
    out,
    {
      id: out.nextId('note'),
      kind: 'note',
      x: noteX,
      y,
      width: t.opale.box.width,
      height: t.opale.box.height,
      label: t.opale.text,
      notePosition: t.opale.position,
    },
    myLane,
  );
}

export function walkIfDown(t: GtileIfDown, x: number, y: number, myLane: string | undefined, out: Out): void {
  const ctx: IfDownCtx = { t, x, y, myLane, out };
  pushIfOwnNote(ctx);
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
