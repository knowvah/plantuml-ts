/**
 * The `'gtile-if-with-links'` case's full node/edge emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch for the same reason
 * `walk-fork-branches.ts`/`walk-while-branch.ts` already are (mission
 * `activity-if-tile-port` D5: one walker module per builder, one function
 * per Java `Connection`). `walkTile`/`pushEdge`/`pushNode` are re-imported
 * from `tile-coordinates.ts`, which itself imports {@link walkIfWithLinks}
 * for its `'gtile-if-with-links'` case -- a circular import between the two
 * modules, safe the same way the fork/while walkers already document: both
 * sides are function DEFINITIONS, neither calls the other until a real
 * layout runs.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithDiamonds.java:200-218
 *   -- `drawU`'s node order.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:531-560
 *   -- `addLinks`'s connector order.
 */

import type { GtileIfWithLinks } from '../tiles/gtile-if-with-links.js';
import type { GtileDiamondInside, DiamondSide } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK, WEST_HOOK, EAST_HOOK } from '../tiles/points.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';

interface IfLinksCtx {
  readonly t: GtileIfWithLinks;
  readonly x: number;
  readonly y: number;
  readonly myLane: string | undefined;
  readonly out: Out;
}

type Emphasize = 'up' | 'down' | 'left' | 'right';

/** `(x1,y1)(x2,y1)(x2,y2)` -- `ConnectionHorizontalThenVertical#drawU`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:104-119 */
function horizontalThenVertical(p1: GPoint, p2: GPoint): GPoint[] {
  return [p1, { x: p2.x, y: p1.y }, p2];
}

/** `(x1,y1)(x1,y2)(x2,y2)` -- `ConnectionVerticalThenHorizontal#drawU`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:187-211 */
function verticalThenHorizontal(p1: GPoint, p2: GPoint): GPoint[] {
  return [p1, { x: p1.x, y: p2.y }, p2];
}

function absolutePoint(local: GPoint, originX: number, originY: number): GPoint {
  return { x: originX + local.x, y: originY + local.y };
}

/** Pushes an edge, then overlays `arrowhead`/`emphasize` on the just-pushed
 *  edge -- `pushEdge` (`tile-coordinates.ts`) is a shared helper this module
 *  does not widen; every other caller keeps its own plain 4/5-arg call. */
function pushDecoratedEdge(
  out: Out,
  points: GPoint[],
  lanes: readonly [string | undefined, string | undefined],
  decoration: { arrowhead?: false; emphasize?: Emphasize },
): void {
  pushEdge(out, points, lanes[0], lanes[1]);
  const edge = out.edges[out.edges.length - 1]!;
  if (decoration.arrowhead === false) edge.arrowhead = false;
  if (decoration.emphasize !== undefined) edge.emphasize = decoration.emphasize;
}

function pushDiamondLabel(
  diamond: GtileDiamondInside,
  side: DiamondSide,
  origin: GPoint,
  lane: string | undefined,
  out: Out,
): void {
  const l = diamond.labelAt(side);
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
    lane,
  );
}

/** `diamond1` node plus its west/east `if-label` children -- `drawU`'s own
 *  order (hexagon, condition text baked into the node, then west, then
 *  east). @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102 */
function pushDiamond1(ctx: IfLinksCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const dX = x + t.diamond1X;
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
  pushDiamondLabel(t.diamond1, 'west', origin, myLane, out);
  pushDiamondLabel(t.diamond1, 'east', origin, myLane, out);
}

/** The merge rhombus (`diamond2`, D2) -- omitted entirely when
 *  `!hasTwoBranches()`. Never carries a west/east `if-label`: our AST has
 *  no out-link-label field (`ast.ts`'s `ActivityIf`), so `tbout1`/`tbout2`
 *  (`ConditionalBuilder.java:292-303`) are always empty in this port. */
function pushMerge(ctx: IfLinksCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasMerge) return;
  pushNode(
    out,
    {
      id: out.nextId('if-merge'),
      kind: 'if-merge',
      x: x + t.mergeX,
      y: y + t.mergeY,
      width: t.mergeSize,
      height: t.mergeSize,
    },
    myLane,
  );
}

function mergePoint(t: GtileIfWithLinks, x: number, y: number, side: 'D' | 'B'): GPoint {
  const half = t.mergeSize / 2;
  const mX = x + t.mergeX;
  const mY = y + t.mergeY + half;
  return side === 'D' ? { x: mX, y: mY } : { x: mX + t.mergeSize, y: mY };
}

/** `in1`/`in2` -- `ConnectionHorizontalThenVertical`, from `diamond1`'s own
 *  D/B point to the branch's `pointIn`. No end decoration when the branch
 *  is empty (D6). @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:531-534 */
function pushInConnectors(ctx: IfLinksCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const t1Origin = { x: x + t.tile1X, y: y + t.branchY };
  const t2Origin = { x: x + t.tile2X, y: y + t.branchY };
  const p1 = absolutePoint(t.diamond1.getCoord(WEST_HOOK), x + t.diamond1X, y + t.diamond1Y);
  const p2 = absolutePoint(t.diamond1.getCoord(EAST_HOOK), x + t.diamond1X, y + t.diamond1Y);
  const in1To = absolutePoint(t.tile1.getCoord(NORTH_HOOK), t1Origin.x, t1Origin.y);
  const in2To = absolutePoint(t.tile2.getCoord(NORTH_HOOK), t2Origin.x, t2Origin.y);

  const diamondLane = laneOut(t.diamond1, myLane);
  pushDecoratedEdge(out, horizontalThenVertical(p1, in1To), [diamondLane, laneIn(t.tile1, myLane)], {
    ...(t.thenIsEmpty ? { arrowhead: false as const } : {}),
  });
  pushDecoratedEdge(out, horizontalThenVertical(p2, in2To), [diamondLane, laneIn(t.tile2, myLane)], {
    ...(t.elseIsEmpty ? { arrowhead: false as const } : {}),
  });
}

/** `out1`/`out2` -- `ConnectionVerticalThenHorizontal`, both branches have
 *  a point out. `emphasize: 'down'` when that branch is empty.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:539-540 */
function pushOutConnectorsBoth(ctx: IfLinksCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const t1Origin = { x: x + t.tile1X, y: y + t.branchY };
  const t2Origin = { x: x + t.tile2X, y: y + t.branchY };
  const out1From = absolutePoint(t.tile1.getCoord(SOUTH_HOOK), t1Origin.x, t1Origin.y);
  const out2From = absolutePoint(t.tile2.getCoord(SOUTH_HOOK), t2Origin.x, t2Origin.y);
  const mergeD = mergePoint(t, x, y, 'D');
  const mergeB = mergePoint(t, x, y, 'B');
  // D7: diamond2 carries the if's own lane -- it is not a `Tile` (D2's
  // interface contract keeps the merge rhombus as plain fields, not a
  // child tile), so its `laneIn` is `myLane` directly rather than a
  // `laneIn(diamond2, myLane)` call.
  pushDecoratedEdge(out, verticalThenHorizontal(out1From, mergeD), [laneOut(t.tile1, myLane), myLane], {
    ...(t.thenIsEmpty ? { emphasize: 'down' as const } : {}),
  });
  pushDecoratedEdge(out, verticalThenHorizontal(out2From, mergeB), [laneOut(t.tile2, myLane), myLane], {
    ...(t.elseIsEmpty ? { emphasize: 'down' as const } : {}),
  });
}

/** `ConnectionVerticalThenHorizontalDirect`, exactly one branch has a point
 *  out -- no arrowhead, terminates at the tile's own bottom-left.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileIfWithLinks.java:298-325 */
function pushDirectConnector(ctx: IfLinksCtx, useTile1: boolean): void {
  const { t, x, y, myLane, out } = ctx;
  const origin = useTile1 ? { x: x + t.tile1X, y: y + t.branchY } : { x: x + t.tile2X, y: y + t.branchY };
  const tile = useTile1 ? t.tile1 : t.tile2;
  const isEmpty = useTile1 ? t.thenIsEmpty : t.elseIsEmpty;
  const p1 = absolutePoint(tile.getCoord(SOUTH_HOOK), origin.x, origin.y);
  const p2 = { x, y: y + t.height };
  const points = [...verticalThenHorizontal(p1, p2), p2];
  pushDecoratedEdge(out, points, [laneOut(tile, myLane), myLane], {
    arrowhead: false,
    ...(isEmpty ? { emphasize: 'down' as const } : {}),
  });
}

function pushOutConnectors(ctx: IfLinksCtx): void {
  const { t } = ctx;
  if (t.hasPointOut1 && t.hasPointOut2) {
    pushOutConnectorsBoth(ctx);
  } else if (t.hasPointOut1) {
    pushDirectConnector(ctx, true);
  } else if (t.hasPointOut2) {
    pushDirectConnector(ctx, false);
  }
}

export function walkIfWithLinks(t: GtileIfWithLinks, x: number, y: number, myLane: string | undefined, out: Out): void {
  const ctx: IfLinksCtx = { t, x, y, myLane, out };
  pushDiamond1(ctx);
  walkTile(t.tile1, x + t.tile1X, y + t.branchY, { kindHint: null, lane: myLane }, out);
  walkTile(t.tile2, x + t.tile2X, y + t.branchY, { kindHint: null, lane: myLane }, out);
  pushMerge(ctx);
  pushInConnectors(ctx);
  pushOutConnectors(ctx);
}
