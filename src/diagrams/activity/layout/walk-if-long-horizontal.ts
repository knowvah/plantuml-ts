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
import type { HlineCandidate } from './swimlane-hline.js';
import { applyOutLabel } from './tile-layout-inlabel.js';

/** `arrowHorizontalAlignment()`'s own resolved default (`AbstractFtile
 *  .java:108-110`, `AlignmentParam.java:42`) -- the alignment BOTH
 *  `ConnectionVerticalOut` and `ConnectionLastElseOut` pass to
 *  `withLabel` for a branch's own trailing `-> label;` (T1d rows 2/3). */
const BRANCH_EXIT_LABEL_ALIGN = { horizontal: 'LEFT' } as const;

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

/** Branch `i`'s own label, pushed as its own `'if-own-label'` node (T3k) --
 *  {@link pushDiamondNode}'s own doc for why it is a separate push, not
 *  baked into the polygon node. No-ops on an empty label -- the OLD
 *  combined push relied on `renderNode`'s own `node.label !== ''` dispatch
 *  to skip the text (`renderDiamond`'s unlabelled shape has no text at
 *  all); now that the label is its own node, this walker must apply that
 *  same guard itself. */
function pushDiamondOwnLabel(ctx: LhCtx, diamond: GtileDiamondInside2, origin: GPoint): void {
  if (diamond.label === '') return;
  pushNode(
    ctx.out,
    {
      id: ctx.out.nextId('if-own-label'),
      kind: 'if-own-label',
      x: origin.x,
      y: origin.y,
      width: diamond.hexWidth,
      height: diamond.hexHeight,
      label: diamond.label,
    },
    ctx.myLane,
  );
}

/** Branch `i`'s polygon, then its north/own-label/west/east children, in
 *  `FtileDiamondInside2#drawU`'s own order (T3k) -- the polygon and the
 *  own label are two SEPARATE draw calls upstream, not one combined blob
 *  (`renderNode`'s own `'if-split'` case draws the polygon only when
 *  labelled; the own label draws through the `'if-own-label'` node
 *  above). Still pushed under the ORIGINAL `'if-split'` kind (not a
 *  dedicated one) so `canvas-origin.ts`'s polygon fudge and
 *  `shapes-of.ts`'s condition-box treatment, both already keyed on that
 *  name, apply unchanged; the SAME kind also covers the label-less case
 *  (`renderNode`'s own ternary falls to `renderDiamond`). `south` is never
 *  populated on this tile (`gtile-diamond-inside2.ts`'s own doc), so it is
 *  not called here, unlike `walk-if-down.ts`'s copy.
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
  pushDiamondOwnLabel(ctx, diamond, origin);
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
 *
 * T2h: `p1.x`/`p2.x` resolve the diamond's own `diamondX`/the tile's own
 * `tileX` + hook round-trip first and fold `ctx.x` in exactly once, last
 * -- not through {@link diamondOrigin}'s/the inline `tileOrigin`'s
 * two-step compose (`ctx.x + diamondX`, then `+ diamond.left`), which can
 * round one ULP apart from the tile side's own `ctx.x + tileX` round-trip
 * even though both are mathematically `ctx.x + left` upstream
 * (`getTranslateDiamond1(...).getTranslated(p)`/`getTranslate1(...)
 * .getTranslated(p)`, both local-only, `:409-415` -- same regroup as
 * `walk-repeat.ts#pushRepeatOut`, `.agent-notes/T1b-snake-merge.md`'s
 * AXIS_EPSILON section). Y is untouched (never required to match here).
 */
function connectionVerticalIn(ctx: LhCtx, i: number): void {
  const { t, x, myLane, out } = ctx;
  const diamond = t.diamonds[i]!;
  const b = t.branches[i]!;
  const origin = diamondOrigin(ctx, i);
  const p1 = { x: x + (b.diamondX + diamond.left), y: origin.y + diamond.hexHeight };
  const tileOrigin = { x: ctx.x + b.tileX, y: ctx.y + b.tileY };
  const hook = t.tiles[i]!.getCoord(NORTH_HOOK);
  const p2 = { x: x + (b.tileX + hook.x), y: tileOrigin.y + hook.y };
  pushEdge(out, [p1, p2], laneOut(diamond, myLane), laneIn(t.tiles[i]!, myLane), 'if-vertical-in');
}

/** `ConnectionVerticalOut` -- `tile_i.pointOut -> (x, H)`, skipped when the
 *  branch has no point out. T1d row 3: carries the branch's own trailing
 *  `-> label;` (`Branch#special`), set by {@link
 *  conditional-builder-long.ts#branchBodyWithOutLabel} onto `t.tiles[i]`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:438-474 */
function connectionVerticalOut(ctx: LhCtx, i: number): void {
  const { t, x, y, myLane, out } = ctx;
  const b = t.branches[i]!;
  if (!b.hasPointOut) return;
  const tileOrigin = { x: x + b.tileX, y: y + b.tileY };
  const p1 = absolutePoint(t.tiles[i]!.getCoord(SOUTH_HOOK), tileOrigin.x, tileOrigin.y);
  const p2 = { x: p1.x, y: y + t.height };
  pushEdge(out, [p1, p2], laneOut(t.tiles[i]!, myLane), myLane);
  applyOutLabel(out, t.tiles[i]!, BRANCH_EXIT_LABEL_ALIGN);
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
 *  T1d row 2: carries the `else` branch's own trailing `-> label;`
 *  (`Branch#special`), set onto `t.tile2`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:352-387 */
function connectionLastElseOut(ctx: LhCtx): void {
  const { t, x, y, myLane, out } = ctx;
  if (!t.hasTile2PointOut) return;
  const origin = tile2Origin(ctx);
  const p1 = absolutePoint(t.tile2.getCoord(SOUTH_HOOK), origin.x, origin.y);
  const points: GPoint[] = [p1, { x: p1.x, y: y + t.height }];
  if (t.nbOut === 0) points.push({ x: x + t.left, y: y + t.height });
  pushEdge(out, points, laneOut(t.tile2, myLane), myLane);
  applyOutLabel(out, t.tile2, BRANCH_EXIT_LABEL_ALIGN);
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

/** Every branch/`tile2` out-point's own absolute X AND own outcome lane
 *  (`laneOut`) -- the `hline` routing template's `candidates`, split out
 *  of {@link connectionHline} to keep that function's own NLOC under the
 *  file's limit. Parallels {@link hlineOutXs} exactly, index for index,
 *  adding only the lane each entry already has available. */
function hlineCandidates(ctx: LhCtx): HlineCandidate[] {
  const { t, x, myLane } = ctx;
  const candidates: HlineCandidate[] = [];
  for (let i = 0; i < t.branches.length; i++) {
    const b = t.branches[i]!;
    if (b.hasPointOut) candidates.push({ x: x + b.coupleX + b.coupleLeft, lane: laneOut(t.tiles[i]!, myLane) });
  }
  if (t.hasTile2PointOut) candidates.push({ x: x + t.tile2X + t.tile2Left, lane: laneOut(t.tile2, myLane) });
  return candidates;
}

/**
 * `ConnectionHline`, drawn only when `nbOut > 0` -- a plain, arrowless line
 * under the whole tile. The pushed edge is always the UNLANED
 * `getMinmaxSimple` extent (byte-identical to before T1p-g); the `hline`
 * routing template carries the per-lane data `swimlane-placement.ts
 * #routeEdge` needs to replace it, under real swimlanes, with one
 * `getMinmax`-derived edge per in-range lane (`swimlane-hline.ts
 * #routeHline`) -- `leftOut` (`getLeftOut`, `:512-517`) becomes
 * `unfiltered`, folded into every in-range lane unconditionally, exactly
 * as the Java's own term is. `measureLanes` runs BEFORE routing and only
 * ever sees this UNLANED edge, so lane-width measurement is unaffected
 * (`swimlane-hline.ts`'s own doc).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongHorizontal.java:476-599
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
    { hline: { low: x, high: x + t.width, candidates: hlineCandidates(ctx), unfiltered: [leftOut] } },
  );
  // `withMerge(NONE)` (`FtileIfLongHorizontal.java:507`) -- T1b wires
  // `mergeable`; see `swimlane-placement.ts#EdgeMeta.scope`'s own doc for
  // why `routeHline`'s per-lane fan-out never loses this (`NONE` never
  // reaches the merge pass's scope check at all).
  const edge = out.edges[out.edges.length - 1]!;
  edge.arrowhead = false;
  edge.mergeable = 'NONE';
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
