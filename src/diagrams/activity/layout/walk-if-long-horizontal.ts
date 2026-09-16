/**
 * The `'gtile-if-long-horizontal'` case's full node/edge emission, split out
 * of `tile-coordinates.ts`'s `walkTile` switch for the same reason
 * `walk-if-down.ts`/`walk-if-with-links.ts` already are (mission
 * `activity-if-tile-port` D5). `walkTile`/`pushEdge`/`pushNode` are
 * re-imported from `tile-coordinates.ts`, which itself imports {@link
 * walkIfLongHorizontal} for its `'gtile-if-long-horizontal'` case -- a
 * circular import between the two modules, safe the same way the other
 * if-walkers already document: both sides are function DEFINITIONS,
 * neither calls the other until a real layout runs.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:671-677
 *   -- `drawU`'s node order.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:203-255
 *   -- `create`'s `conns` order.
 */

import type { GtileIfLongHorizontal } from '../tiles/gtile-if-long-horizontal.js';
import type { GtileDiamondInside2, DiamondInside2Side } from '../tiles/gtile-diamond-inside2.js';
import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { laneIn, laneOut } from './swimlane-lanes.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';

interface LhCtx {
  readonly t: GtileIfLongHorizontal;
  readonly x: number;
  readonly y: number;
  readonly myLane: string | undefined;
  readonly out: Out;
}

function absolutePoint(local: GPoint, originX: number, originY: number): GPoint {
  return { x: originX + local.x, y: originY + local.y };
}

/** A branch diamond's own absolute origin -- the box origin, NOT the shifted
 *  hexagon-shape origin (the align top-margin shift is baked into the
 *  branch layout's own `diamondY`, D4). */
function diamondOrigin(ctx: LhCtx, i: number): GPoint {
  const b = ctx.t.branches[i]!;
  return { x: ctx.x + b.diamondX, y: ctx.y + b.diamondY };
}

function pushDiamondLabel(ctx: LhCtx, diamond: GtileDiamondInside2, side: DiamondInside2Side, origin: GPoint): void {
  const l = diamond.labelAt(side);
  if (l === null) return;
  pushNode(
    ctx.out,
    {
      id: ctx.out.nextId('if-label'),
      kind: 'if-label',
      x: origin.x + l.x,
      y: origin.y + l.y,
      width: l.width,
      height: l.height,
      label: l.label,
    },
    ctx.myLane,
  );
}

/** Branch `i`'s hexagon node plus its north/west/east `if-label` children
 *  -- `FtileDiamondInside2#drawU`'s own draw order.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java:79-99 */
function pushDiamondNode(ctx: LhCtx, i: number): void {
  const diamond = ctx.t.diamonds[i]!;
  const origin = diamondOrigin(ctx, i);
  pushNode(
    ctx.out,
    {
      id: ctx.out.nextId('if-split'),
      kind: 'if-split',
      x: origin.x,
      y: origin.y,
      width: diamond.hexWidth,
      height: diamond.hexHeight,
      label: diamond.label,
    },
    ctx.myLane,
  );
  pushDiamondLabel(ctx, diamond, 'north', origin);
  pushDiamondLabel(ctx, diamond, 'west', origin);
  pushDiamondLabel(ctx, diamond, 'east', origin);
}

/** Couple `i`'s own node subtree -- the diamond then its branch content
 *  (`drawU`'s own per-couple order). */
function walkCouple(ctx: LhCtx, i: number): void {
  pushDiamondNode(ctx, i);
  const b = ctx.t.branches[i]!;
  walkTile(ctx.t.tiles[i]!, ctx.x + b.tileX, ctx.y + b.tileY, { kindHint: null, lane: ctx.myLane }, ctx.out);
}

function tile2Origin(ctx: LhCtx): GPoint {
  return { x: ctx.x + ctx.t.tile2X + ctx.t.tile2ContentDx, y: ctx.y + ctx.t.tile2Y };
}

/**
 * `ConnectionVerticalIn` -- `diamond_i.pointOut -> tile_i.pointIn`. The
 * ONLY connector in this builder implementing `ConnectionTranslatable`
 * (`middle = mp1a.y + 4`), so it alone carries the `'if-vertical-in'`
 * `EdgeShape` tag (T1 Q4: numerically identical to `'parallel-in'` but a
 * different Java class -- a distinct tag, not a reused fork one).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:389-436
 */
function connectionVerticalIn(ctx: LhCtx, i: number): void {
  const { t, myLane, out } = ctx;
  const diamond = t.diamonds[i]!;
  const b = t.branches[i]!;
  const origin = diamondOrigin(ctx, i);
  const p1 = { x: origin.x + diamond.left, y: origin.y + diamond.hexHeight };
  const tileOrigin = { x: ctx.x + b.tileX, y: ctx.y + b.tileY };
  const p2 = absolutePoint(t.tiles[i]!.getCoord(NORTH_HOOK), tileOrigin.x, tileOrigin.y);
  pushEdge(out, [p1, p2], laneOut(diamond, myLane), laneIn(t.tiles[i]!, myLane), 'if-vertical-in');
}

/** `ConnectionVerticalOut` -- `tile_i.pointOut -> (x, H)`, skipped when the
 *  branch has no point out.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:438-474 */
function connectionVerticalOut(ctx: LhCtx, i: number): void {
  const { t, x, y, myLane, out } = ctx;
  const b = t.branches[i]!;
  if (!b.hasPointOut) return;
  const tileOrigin = { x: x + b.tileX, y: y + b.tileY };
  const p1 = absolutePoint(t.tiles[i]!.getCoord(SOUTH_HOOK), tileOrigin.x, tileOrigin.y);
  const p2 = { x: p1.x, y: y + t.height };
  pushEdge(out, [p1, p2], laneOut(t.tiles[i]!, myLane), myLane);
}

/** A hexagon's own "right"/"left" mid point (`2*left`/`0`, `hexHeight/2`)
 *  -- `getYdiamontOutToLeft`'s Y composed with `dimDiamond1.getLeft()*2` --
 *  NOT the standard `EAST_HOOK`/`WEST_HOOK` (which use the possibly
 *  north-widened `.width`, `gtile-diamond-inside2.ts`'s own doc).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:277-298 */
function hexMidPoint(ctx: LhCtx, i: number, side: 'right' | 'left'): GPoint {
  const diamond = ctx.t.diamonds[i]!;
  const origin = diamondOrigin(ctx, i);
  const localX = side === 'right' ? diamond.left * 2 : 0;
  return { x: origin.x + localX, y: origin.y + diamond.hexHeight / 2 };
}

/** `ConnectionHorizontal` -- adjacent diamonds' hex right-mid -> left-mid.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:260-294 */
function connectionHorizontal(ctx: LhCtx, i: number): void {
  const { t, myLane, out } = ctx;
  const p1 = hexMidPoint(ctx, i, 'right');
  const p2 = hexMidPoint(ctx, i + 1, 'left');
  pushEdge(out, [p1, p2], laneOut(t.diamonds[i]!, myLane), laneIn(t.diamonds[i + 1]!, myLane));
}

/** `ConnectionIn` -- the tile's own `pointIn` elbowed down into diamond 0.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:300-321 */
function connectionIn(ctx: LhCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = { x: x + t.left, y };
  const d0Origin = diamondOrigin(ctx, 0);
  const p2 = { x: d0Origin.x + t.diamonds[0]!.left, y: d0Origin.y };
  pushEdge(out, [p1, { x: p2.x, y: p1.y }, p2], myLane, laneIn(t.diamonds[0]!, myLane));
}

/** `ConnectionLastElseIn` -- last diamond's hex right-mid -> `tile2.pointIn`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:323-350 */
function connectionLastElseIn(ctx: LhCtx): void {
  const { t, myLane, out } = ctx;
  const last = t.diamonds.length - 1;
  const p1 = hexMidPoint(ctx, last, 'right');
  const origin = tile2Origin(ctx);
  const p2 = absolutePoint(t.tile2.getCoord(NORTH_HOOK), origin.x, origin.y);
  pushEdge(out, [p1, { x: p2.x, y: p1.y }, p2], laneOut(t.diamonds[last]!, myLane), laneIn(t.tile2, myLane));
}

/** `ConnectionLastElseOut` -- `tile2.pointOut -> (x, H)`; a third point
 *  `(W/2, H)` only when `nbOut === 0`; skipped when `tile2` has no point out.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:352-387 */
function connectionLastElseOut(ctx: LhCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasTile2PointOut) return;
  const origin = tile2Origin(ctx);
  const p1 = absolutePoint(t.tile2.getCoord(SOUTH_HOOK), origin.x, origin.y);
  const points: GPoint[] = [p1, { x: p1.x, y: y + t.height }];
  if (t.nbOut === 0) points.push({ x: x + t.left, y: y + t.height });
  pushEdge(out, points, laneOut(t.tile2, myLane), myLane);
}

/** Every branch/`tile2` out-point's own absolute X, per `getMinmaxSimple`
 *  -- split out of {@link connectionHline} only to keep that function's own
 *  NLOC under the file's limit. */
function hlineOutXs(ctx: LhCtx): number[] {
  const { t, x } = ctx;
  const xs: number[] = [];
  for (const b of t.branches) if (b.hasPointOut) xs.push(x + b.coupleX + b.coupleLeft);
  if (t.hasTile2PointOut) xs.push(x + t.tile2X + t.tile2Left);
  return xs;
}

/**
 * `ConnectionHline`, drawn only when `nbOut > 0` -- a plain, arrowless line
 * under the whole tile. Laned diagrams would need `getMinmax`'s pass-aware
 * variant (`:520-560`, the current lane pass); this port always emits the
 * UNLANED `getMinmaxSimple` extent instead (T5 spec's own sanctioned
 * approximation) -- journaled per-slug in the mission decision journal.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:476-570
 */
function connectionHline(ctx: LhCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const leftOut = x + t.left;
  const xs = [leftOut, ...hlineOutXs(ctx)];
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const h = y + t.height;
  pushEdge(
    out,
    [
      { x: minX, y: h },
      { x: maxX, y: h },
    ],
    myLane,
    myLane,
  );
  out.edges[out.edges.length - 1]!.arrowhead = false;
}

export function walkIfLongHorizontal(
  t: GtileIfLongHorizontal,
  x: number,
  y: number,
  myLane: string | undefined,
  out: Out,
): void {
  const ctx: LhCtx = { t, x, y, myLane, out };
  for (let i = 0; i < t.diamonds.length; i++) walkCouple(ctx, i);
  walkTile(t.tile2, x + t.tile2X + t.tile2ContentDx, y + t.tile2Y, { kindHint: null, lane: myLane }, out);

  for (let i = 0; i < t.diamonds.length; i++) {
    connectionVerticalIn(ctx, i);
    connectionVerticalOut(ctx, i);
  }
  for (let i = 0; i < t.diamonds.length - 1; i++) connectionHorizontal(ctx, i);
  connectionIn(ctx);
  connectionLastElseIn(ctx);
  connectionLastElseOut(ctx);
  if (t.nbOut > 0) connectionHline(ctx);
}
