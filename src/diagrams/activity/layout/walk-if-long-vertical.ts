/**
 * The `'gtile-if-long-vertical'` case's full node/edge emission, split out
 * of `tile-coordinates.ts`'s `walkTile` switch for the same reason
 * `walk-if-long-horizontal.ts`/`walk-if-down.ts` already are (D12/T1p-b).
 * `walkTile`/`pushEdge`/`pushNode` are re-imported from `tile-coordinates.ts`,
 * which itself imports {@link walkIfLongVertical} for its
 * `'gtile-if-long-vertical'` case -- a circular import between the two
 * modules, safe the same way the other if-walkers already document: both
 * sides are function DEFINITIONS, neither calls the other until a real
 * layout runs.
 *
 * Every `MergeStrategy` below is the builder's own default, FULL
 * (`Snake.create`'s static overloads never receive a `.withMerge(...)`
 * call anywhere in `FtileIfLongVertical.java`) -- recorded per connection
 * so a later task (D2: T1b) can wire `ActivityEdgeGeo.mergeable` from
 * these comments without re-deriving them; this task does not add that
 * field itself (`batch-1p/common.md`).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:492-502
 *   -- `drawU`'s node order.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:172-203
 *   -- `create`'s `conns` order.
 */

import type { GtileIfLongVertical } from '../tiles/gtile-if-long-vertical.js';
import type { GtileDiamondInside2, DiamondInside2Side } from '../tiles/gtile-diamond-inside2.js';
import type { GPoint } from '../tiles/points.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import { laneAt, laneIn, laneOut } from './swimlane-lanes.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { collectTouchedLanes } from './tile-coordinates-group.js';

interface LvCtx {
  readonly t: GtileIfLongVertical;
  readonly x: number;
  readonly y: number;
  readonly myLane: string | undefined;
  readonly out: Out;
  /** {@link compositeSwimlanes}; `undefined` = no swimlanes, no gate. */
  readonly gate: ReadonlySet<string> | undefined;
}

/**
 * `FtileIfLongVertical#getSwimlanes()`: `getSwimlaneIn()` (= `tiles[0]
 * .getSwimlaneIn()`) plus every branch tile's and `tile2`'s lanes -- the
 * diamonds' and `lastDiamond`'s own lane is NOT included
 * (`FtileIfLongVertical.java:111-125`). `undefined` when the diagram has no
 * lanes at all (no interceptor pass, `Swimlanes.java:318-356`).
 */
function compositeSwimlanes(t: GtileIfLongVertical, myLane: string | undefined): ReadonlySet<string> | undefined {
  const lanes = new Set<string>();
  const inLane = laneIn(t.tiles[0]!, myLane);
  if (inLane !== undefined) lanes.add(inLane);
  for (const tile of t.tiles) collectTouchedLanes(tile, lanes);
  collectTouchedLanes(t.tile2, lanes);
  if (lanes.size === 0 && myLane === undefined) return undefined;
  return lanes;
}

/**
 * `UGraphicInterceptorAllSwimlanes`/`OneSwimlane#draw`'s `Ftile` branch: a
 * child is drawn only in a lane its own `getSwimlanes()` shares with the
 * active (composite) set (`UGraphicInterceptorAllSwimlanes.java:63-79`,
 * `UGraphicInterceptorOneSwimlane.java:68-75`). A diamond's set is its one
 * creation lane (`FtileDiamondInside2`/`FtileDiamond`, `swimlane` ctor arg).
 */
function childDrawn(ctx: LvCtx, lane: string | undefined): boolean {
  return ctx.gate === undefined || lane === undefined || ctx.gate.has(lane);
}

/**
 * The `Connection` branch: drawn in an active lane `L` iff `tile1` is null
 * or its `getSwimlaneOut()` is null or `L`, and the same for `tile2`'s
 * `getSwimlaneIn()` (`UGraphicInterceptorAllSwimlanes.java:129-143`,
 * `UGraphicInterceptorOneSwimlane.java:93-104`). None of this builder's
 * connections is a `ConnectionTranslatable`, so the `Cross` pass never
 * draws a cross-lane one either (`Swimlanes.java:178-200`,
 * `ConnectionCross.java:49-64`).
 */
function connectionDrawn(ctx: LvCtx, lane1: string | undefined, lane2: string | undefined): boolean {
  if (ctx.gate === undefined) return true;
  for (const lane of ctx.gate) {
    if ((lane1 === undefined || lane1 === lane) && (lane2 === undefined || lane2 === lane)) return true;
  }
  return false;
}

/** {@link pushEdge} behind {@link connectionDrawn}; `false` = not drawn, so
 *  the caller attaches no label (the Snake and its text go together). */
function pushGatedEdge(ctx: LvCtx, points: GPoint[], lane1: string | undefined, lane2: string | undefined): boolean {
  if (!connectionDrawn(ctx, lane1, lane2)) return false;
  pushEdge(ctx.out, points, lane1, lane2);
  return true;
}

function absolutePoint(local: GPoint, originX: number, originY: number): GPoint {
  return { x: originX + local.x, y: originY + local.y };
}

function diamondOrigin(ctx: LvCtx, i: number): GPoint {
  const b = ctx.t.branches[i]!;
  return { x: ctx.x + b.diamondX, y: ctx.y + b.diamondY };
}

function tileOrigin(ctx: LvCtx, i: number): GPoint {
  const b = ctx.t.branches[i]!;
  return { x: ctx.x + b.tileX, y: ctx.y + b.tileY };
}

function tile2Origin(ctx: LvCtx): GPoint {
  return { x: ctx.x + ctx.t.tile2X, y: ctx.y + ctx.t.tile2Y };
}

function lastDiamondOrigin(ctx: LvCtx): GPoint {
  return { x: ctx.x + ctx.t.lastDiamondX, y: ctx.y + ctx.t.lastDiamondY };
}

/** Byte-identical to `walk-if-long-horizontal.ts`'s own `pushDiamondLabel`
 *  (D5: no shared helper module between builder-specific walker files). */
function pushDiamondLabel(ctx: LvCtx, diamond: GtileDiamondInside2, side: DiamondInside2Side, origin: GPoint): void {
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
      // add4-T3j: drawn as the FULL `create(fcArrow)` block it is sized as.
      ifLabelRole: 'full',
    },
    ctx.myLane,
  );
}

/** Byte-identical to `walk-if-long-horizontal.ts`'s own `pushDiamondOwnLabel`. */
function pushDiamondOwnLabel(ctx: LvCtx, diamond: GtileDiamondInside2, origin: GPoint): void {
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

/** Branch `i`'s own hexagon -- `FtileDiamondInside2#drawU`'s polygon +
 *  label draws, same shape and push order as `walk-if-long-horizontal.ts`'s
 *  own `pushDiamondNode` (only `east` is ever non-null here: `north`/`west`
 *  are unused by this builder, D1 Q0-style documented gap, `gtile-if-long-
 *  vertical.ts`'s own doc).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java:79-99 */
function pushDiamondNode(ctx: LvCtx, i: number): void {
  const diamond = ctx.t.diamonds[i]!;
  if (!childDrawn(ctx, laneAt(diamond, ctx.myLane))) return;
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

/** The `lastDiamond` merge rhombus -- reuses the `'if-merge'` node kind
 *  (D12/T1p-c precedent, `walk-fork-branches.ts`'s own doc: both are the
 *  SAME upstream class, a label-less `FtileDiamond`, so the existing
 *  `renderIfMerge`/`canvas-origin.ts`/`compress/shapes-of.ts` handling for
 *  that kind already applies correctly, unmodified). */
function pushLastDiamondNode(ctx: LvCtx): void {
  if (!childDrawn(ctx, ctx.myLane)) return;
  const origin = lastDiamondOrigin(ctx);
  pushNode(
    ctx.out,
    {
      id: ctx.out.nextId('if-merge'),
      kind: 'if-merge',
      x: origin.x,
      y: origin.y,
      width: ctx.t.lastDiamondSize,
      height: ctx.t.lastDiamondSize,
    },
    ctx.myLane,
  );
}

/**
 * `ConnectionIn` -- `MergeStrategy.FULL`. The overall tile's own `pointIn`
 * elbowed down into diamond 0.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:215-226
 */
function connectionIn(ctx: LvCtx): void {
  const { t, x, y, myLane, out } = ctx;
  const p1 = { x: x + t.left, y };
  const d0Origin = diamondOrigin(ctx, 0);
  const p2 = absolutePoint(t.diamonds[0]!.getCoord(NORTH_HOOK), d0Origin.x, d0Origin.y);
  const mid = (p1.y + p2.y) / 2;
  // `super(null, diamonds.get(0))` (`:211`): no tile1, so no lane1 gate.
  if (!connectionDrawn(ctx, undefined, laneIn(t.diamonds[0]!, myLane))) return;
  pushEdge(out, [p1, { x: p1.x, y: mid }, { x: p2.x, y: mid }, p2], myLane, laneIn(t.diamonds[0]!, myLane));
}

/**
 * `ConnectionVerticalIn` -- `MergeStrategy.FULL`. `diamond_i.EAST_HOOK ->
 * tile_i.NORTH_HOOK`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:230-263
 */
function connectionVerticalIn(ctx: LvCtx, i: number): void {
  const { t, myLane } = ctx;
  const diamond = t.diamonds[i]!;
  const dOrigin = diamondOrigin(ctx, i);
  const p1 = absolutePoint(diamond.getCoord(EAST_HOOK), dOrigin.x, dOrigin.y);
  const tOrigin = tileOrigin(ctx, i);
  const p2 = absolutePoint(t.tiles[i]!.getCoord(NORTH_HOOK), tOrigin.x, tOrigin.y);
  pushGatedEdge(ctx, [p1, { x: p2.x, y: p1.y }, p2], laneOut(diamond, myLane), laneIn(t.tiles[i]!, myLane));
}

/**
 * `ConnectionVertical` -- `MergeStrategy.FULL`. `diamond_i.SOUTH_HOOK ->
 * diamond_{i+1}.NORTH_HOOK`, a straight line (no elbow). `label` is the
 * NEXT branch's own inlabel (`Branch#getInlabel()`, `:183-190`), drawn
 * `withLabel(label, VerticalAlignment.CENTER)` (`:281-282`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:265-298
 *
 * T2h: `p1.x`/`p2.x` resolve each diamond's own LOCAL `diamondX` + hook
 * round-trip first and fold `ctx.x` in exactly once, last -- NOT through
 * {@link diamondOrigin}/{@link absolutePoint}'s two-step compose (`ctx.x +
 * diamondX`, then `+ hook.x`), which can round one ULP apart per diamond
 * even though both ends are mathematically `ctx.x + left` upstream
 * (`getTranslateFor(ftile).getTranslated(p)`, local-only, `:287-294` --
 * same regroup as `walk-repeat.ts#pushRepeatOut`, `.agent-notes/
 * T1b-snake-merge.md`'s AXIS_EPSILON section). `o1.y`/`o2.y` still read
 * through {@link diamondOrigin} -- only x needs the deferred fold; y is
 * never required to match between the two diamonds here.
 */
function connectionVertical(ctx: LvCtx, i: number): void {
  const { t, x, myLane, out } = ctx;
  const d1 = t.diamonds[i]!;
  const d2 = t.diamonds[i + 1]!;
  const o1 = diamondOrigin(ctx, i);
  const o2 = diamondOrigin(ctx, i + 1);
  const p1 = { x: x + (t.branches[i]!.diamondX + d1.getCoord(SOUTH_HOOK).x), y: o1.y + d1.getCoord(SOUTH_HOOK).y };
  const p2 = {
    x: x + (t.branches[i + 1]!.diamondX + d2.getCoord(NORTH_HOOK).x),
    y: o2.y + d2.getCoord(NORTH_HOOK).y,
  };
  if (!pushGatedEdge(ctx, [p1, p2], laneOut(d1, myLane), laneIn(d2, myLane))) return;
  const inlabel = t.inlabels[i + 1];
  if (inlabel === undefined) return;
  const edge = out.edges[out.edges.length - 1]!;
  edge.label = inlabel.label;
  edge.labelAlign = { vertical: 'CENTER' };
}

/**
 * `ConnectionLastElse` -- `MergeStrategy.FULL`. Last diamond's `SOUTH_HOOK`
 * elbowed into `tile2.NORTH_HOOK`, labelled with `node.elseLabel`
 * (`branch2.getDisplayPositive()`), threaded onto the tile as {@link
 * GtileIfLongVertical.elseLabel} (`conditional-builder.ts`'s own doc).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:300-329
 */
function connectionLastElse(ctx: LvCtx): void {
  const { t, myLane, out } = ctx;
  const last = t.diamonds.length - 1;
  const dOrigin = diamondOrigin(ctx, last);
  const p1 = absolutePoint(t.diamonds[last]!.getCoord(SOUTH_HOOK), dOrigin.x, dOrigin.y);
  const t2Origin = tile2Origin(ctx);
  const p2 = absolutePoint(t.tile2.getCoord(NORTH_HOOK), t2Origin.x, t2Origin.y);
  const points = [p1, { x: p1.x, y: p2.y - 15 }, { x: p2.x, y: p2.y - 15 }, p2];
  if (!pushGatedEdge(ctx, points, laneOut(t.diamonds[last]!, myLane), laneIn(t.tile2, myLane))) return;
  if (t.elseLabel === undefined || t.elseLabel === '') return;
  // `Snake.create(...).withLabel(label, VerticalAlignment.CENTER)`
  // (`FtileIfLongVertical.java:319-320`).
  const edge = out.edges[out.edges.length - 1]!;
  edge.label = t.elseLabel;
  edge.labelAlign = { vertical: 'CENTER' };
}

/**
 * `ConnectionLastElseOut` -- `MergeStrategy.FULL`, skipped when `tile2` has
 * no point out. `tile2.SOUTH_HOOK` elbowed into `lastDiamond`'s `NORTH_HOOK`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:331-358
 */
function connectionLastElseOut(ctx: LvCtx): void {
  const { t, myLane } = ctx;
  if (!t.hasTile2PointOut) return;
  const t2Origin = tile2Origin(ctx);
  const p1 = absolutePoint(t.tile2.getCoord(SOUTH_HOOK), t2Origin.x, t2Origin.y);
  const ldOrigin = lastDiamondOrigin(ctx);
  const p2 = { x: ldOrigin.x + t.lastDiamondSize / 2, y: ldOrigin.y };
  pushGatedEdge(ctx, [p1, { x: p1.x, y: p2.y - 15 }, { x: p2.x, y: p2.y - 15 }, p2], laneOut(t.tile2, myLane), myLane);
}

/**
 * `ConnectionThenOut` (branch 0 only) -- `MergeStrategy.FULL`, skipped when
 * branch 0's body has no point out. `tile_0.SOUTH_HOOK` routed along the
 * composite's own right edge down into `lastDiamond`'s `EAST_HOOK`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:360-392
 */
function connectionThenOut(ctx: LvCtx): void {
  const { t, x, myLane } = ctx;
  if (!t.branches[0]!.hasPointOut) return;
  const tOrigin = tileOrigin(ctx, 0);
  const p1 = absolutePoint(t.tiles[0]!.getCoord(SOUTH_HOOK), tOrigin.x, tOrigin.y);
  const ldOrigin = lastDiamondOrigin(ctx);
  const p2 = { x: ldOrigin.x + t.lastDiamondSize, y: ldOrigin.y + t.lastDiamondSize / 2 };
  const rightEdge = x + t.width;
  pushGatedEdge(
    ctx,
    [p1, { x: p1.x, y: p1.y + 15 }, { x: rightEdge, y: p1.y + 15 }, { x: rightEdge, y: p2.y }, p2],
    laneOut(t.tiles[0]!, myLane),
    myLane,
  );
}

/**
 * `ConnectionThenOutConnect` (branches `1..n-1`) -- `MergeStrategy.FULL`,
 * skipped when the branch's body has no point out. `tile_i.SOUTH_HOOK`
 * stubbed out to the composite's own right edge, where it touches {@link
 * connectionThenOut}'s own vertical run (D1's global snake-merge pass,
 * out of this task's scope, resolves the touching decoration).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileIfLongVertical.java:394-421
 */
function connectionThenOutConnect(ctx: LvCtx, i: number): void {
  const { t, x, myLane } = ctx;
  if (!t.branches[i]!.hasPointOut) return;
  const tOrigin = tileOrigin(ctx, i);
  const p1 = absolutePoint(t.tiles[i]!.getCoord(SOUTH_HOOK), tOrigin.x, tOrigin.y);
  const p2 = { x: x + t.width, y: p1.y + 15 };
  pushGatedEdge(ctx, [p1, { x: p1.x, y: p2.y }, p2], laneOut(t.tiles[i]!, myLane), myLane);
}

/**
 * Node order mirrors `drawU`: every branch tile, then every diamond, then
 * `tile2`, then `lastDiamond` (`FtileIfLongVertical.java:492-502`). Edge
 * order mirrors `create`'s `conns` list, drawn after the tile by
 * `FtileWithConnection#drawU` (`FtileWithConnection.java:69-74`):
 * VerticalIn*, Vertical*, ThenOut, ThenOutConnect*, In, LastElse,
 * LastElseOut (`FtileIfLongVertical.java:173-201`).
 */
export function walkIfLongVertical(
  t: GtileIfLongVertical,
  x: number,
  y: number,
  myLane: string | undefined,
  out: Out,
): void {
  const ctx: LvCtx = { t, x, y, myLane, out, gate: compositeSwimlanes(t, myLane) };

  for (let i = 0; i < t.tiles.length; i++) {
    const b = t.branches[i]!;
    walkTile(t.tiles[i]!, x + b.tileX, y + b.tileY, { kindHint: null, lane: myLane }, out);
  }
  for (let i = 0; i < t.diamonds.length; i++) pushDiamondNode(ctx, i);
  walkTile(t.tile2, x + t.tile2X, y + t.tile2Y, { kindHint: null, lane: myLane }, out);
  pushLastDiamondNode(ctx);

  for (let i = 0; i < t.diamonds.length; i++) connectionVerticalIn(ctx, i);
  for (let i = 0; i < t.diamonds.length - 1; i++) connectionVertical(ctx, i);
  connectionThenOut(ctx);
  for (let i = 1; i < t.tiles.length; i++) connectionThenOutConnect(ctx, i);
  connectionIn(ctx);
  connectionLastElse(ctx);
  connectionLastElseOut(ctx);
}
