/**
 * The `'gtile-while'` case's node/edge/reservation emission, split out of
 * `tile-coordinates.ts`'s `walkTile` switch to keep that file under the
 * 500-line cap (the `walk-fork-branches.ts` precedent). `walkTile`/`pushEdge`
 * are re-imported from `tile-coordinates.ts`, a circular import that is safe
 * because both sides are function definitions only called at walk time.
 *
 * altp-T4: draw ordering and point lists ported from `FtileWhile.java`'s
 * `ConnectionIn`/`ConnectionBackSimple`/`ConnectionBackEmpty`/
 * `ConnectionOut` and `FtileFactoryDelegatorWhile`'s break welding (D3, D6,
 * D7).
 */

import type { ActivityNodeGeo } from '../activity-geometry.types.js';
import type { GtileWhile } from '../tiles/gtile-while.js';
import type { DiamondConditionTile } from '../tiles/gtile-diamond-inside.js';
import type { GPoint, HookName } from '../tiles/points.js';
import { EAST_HOOK, NORTH_HOOK, SOUTH_HOOK, WEST_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { GConnectionVerticalDown } from '../routing/gconnection-vertical-down.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import { pushLaneReservation } from './swimlane-reservation-lane.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { HEXAGON_HALF_SIZE, whileHexagonReservation } from './hexagon-reservations.js';
import { emitDiamondLabels, emitDiamondOwnLabel } from './diamond-labels.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import { pushWhileBackwardConnections } from './walk-while-backward.js';
import { pushWhileOutSpecial, walkWhileSpecialOut, whileLaneGate } from './walk-while-special.js';
import { isInsideForkBody } from './walk-fork-branches.js';

/** EMPTY_DIAMOND: north is the TEST (`withNorth(testTb)`, an fcTest block,
 *  `FtileWhile.java:124-126,137-139`) -> `ifLabelRole: 'test'`, as
 *  `walk-if-down.ts#testLabelRole`. INSIDE headers' north is `yesTb` (`:131-136`). */
function markEmptyDiamondTest(header: DiamondConditionTile, north: ActivityNodeGeo | undefined): void {
  if (north !== undefined && header.kind === 'gtile-diamond-empty') north.ifLabelRole = 'test';
}

/**
 * The hexagon node, then north, south, the OWN label, then west --
 * `FtileDiamondInside#drawU`'s order (T3k: polygon and own label are two
 * draw calls, the own label an `'if-own-label'` node). Kind `'while-header'`
 * also covers the label-less case. North is the "is" label, west the "is
 * not" label. `laneAt` resolves the header's own `.swimlane` over `myLane`
 * (`tile-coordinates.ts:117-118`), since this pushes without `walkTile`.
 * The polygon box is the ALONE shape `[NORTH_HOOK.y, SOUTH_HOOK.y)`: `inY`
 * is 0 for the INSIDE headers and `GtileDiamondEmpty`'s north reserve
 * otherwise (add3 T3a, CONDSTYLE-EMPTY).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102
 */
function pushWhileHeader(
  header: DiamondConditionTile,
  hX: number,
  hY: number,
  myLane: string | undefined,
  out: Out,
): void {
  const hexLane = laneAt(header, myLane);
  const inY = header.getCoord(NORTH_HOOK).y;
  const box = { x: hX, y: hY + inY, width: header.width, height: header.getCoord(SOUTH_HOOK).y - inY };
  pushNode(out, { id: out.nextId('while-header'), kind: 'while-header', ...box, label: header.label }, hexLane);
  const northAt = out.nodes.length;
  emitDiamondLabels(header, { x: hX, y: hY }, ['north'], hexLane, out);
  markEmptyDiamondTest(header, out.nodes[northAt]);
  // `south` (add3 T3a, CONDSTYLE-EMPTY): `FtileDiamond#drawU`'s own
  // `north.drawU` THEN `south.drawU` (`:91,94`) -- only EMPTY_DIAMOND ever
  // populates this slot for a while header (`.withSouth(yesTb)`,
  // `FtileWhile.java:138`); always empty (no-op via `labelAt`'s own
  // `dim.text === ''` guard) for `GtileDiamondInside`/`GtileDiamondSquare`,
  // which never call `.withSouth()`.
  emitDiamondLabels(header, { x: hX, y: hY }, ['south'], hexLane, out);
  emitDiamondOwnLabel(header, box, hexLane, out);
  emitDiamondLabels(header, { x: hX, y: hY }, ['west'], hexLane, out);
}

/** Pushes an edge, then overlays `emphasize`/`arrowhead: false` on the
 *  just-pushed edge -- widens `walk-if-down.ts`'s `pushEmphasizedEdge`
 *  idiom to also cover `arrowhead: false` (D6, `Worm.java:161-168`'s `null`
 *  end decoration), which the while exit's second snake needs. `loop`
 *  (mission `activity-loop-lane-translate`, T2) forwards D1's translate tag
 *  through to `pushEdge`'s routing argument -- a no-op on a same-lane edge
 *  (`swimlane-placement.ts#routeEdge` never reads `EdgeMeta.loop` unless
 *  the edge is cross-lane), so `emphasize` still applies on top of it. */
function pushEdgeFlagged(
  out: Out,
  points: GPoint[],
  lanes: readonly [string | undefined, string | undefined],
  flags: {
    emphasize?: 'up' | 'down';
    arrowhead?: false;
    loop?: LoopTranslate;
    mergeable?: 'LIMITED' | 'NONE';
  },
): void {
  pushEdge(out, points, lanes[0], lanes[1], flags.loop !== undefined ? { loop: flags.loop } : 'default');
  const edge = out.edges[out.edges.length - 1]!;
  if (flags.emphasize !== undefined) edge.emphasize = flags.emphasize;
  if (flags.arrowhead === false) edge.arrowhead = false;
  if (flags.mergeable !== undefined) edge.mergeable = flags.mergeable;
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

/**
 * D2: `ConnectionBackSimple#drawTranslate`'s own untranslated `getP1` (this
 * `backFrom`) and `getP2` (diamond1's own origin, `(hX, hY)` --
 * `getTranslateDiamond1(...).getTranslated(new XPoint2D(0,0))`), plus the
 * header's own `diamond1.calculateDimension()` fields: `inY =
 * header.getCoord(NORTH_HOOK).y` (`0` for `GtileDiamondInside`/
 * `GtileDiamondSquare`, `FtileDiamondInside.java:106-116`'s own
 * `calculateDimensionAlone`; possibly nonzero for `GtileDiamondEmpty`,
 * add3 T3a), `outY = header.getCoord(SOUTH_HOOK).y` (same value
 * `pushWhileHeader`'s own comment cites for that hook), `width =
 * header.width`. Split out of {@link pushWhileBack} to keep that
 * function's own NLOC under the file's limit.
 */
function buildWhileBackLoop(
  header: DiamondConditionTile,
  hX: number,
  hY: number,
  backFrom: GPoint,
  dims: { readonly originX: number; readonly dimTotalWidth: number },
): LoopTranslate {
  return {
    kind: 'while-back',
    p1: backFrom,
    p2: { x: hX, y: hY },
    originX: dims.originX,
    dimTotalWidth: dims.dimTotalWidth,
    diamond: { inY: header.getCoord(NORTH_HOOK).y, outY: header.getCoord(SOUTH_HOOK).y, width: header.width },
  };
}

/** The absolute-frame values every `Connection*` below shares, computed
 *  once so `pushWhileBack`/`pushWhileOut` stay within the file's parameter
 *  limit. `headerEast`/`headerWest` are the header's own `EAST_HOOK`/
 *  `WEST_HOOK` translated -- each already `getCoord`'s own `inY +
 *  (outY - inY) / 2` (`FtileDiamondInside.java:106-116`'s `inY === 0`
 *  case, generalized by `GtileDiamondEmpty.getCoord`, add3 T3a, to the
 *  same expression with a possibly-nonzero `inY`), so no separate `half`
 *  term is needed here either way. */
export interface WhileFrame {
  readonly out: Out;
  readonly header: DiamondConditionTile;
  readonly body: Tile;
  readonly hX: number;
  readonly hY: number;
  readonly bX: number;
  readonly bY: number;
  readonly headerEast: GPoint;
  readonly headerWest: GPoint;
  /** `ConnectionIn` p1 / p2, `ConnectionBackSimple` p1. */
  readonly headerSouth: GPoint;
  readonly bodyNorth: GPoint;
  readonly bodySouth: GPoint;
  readonly southHook: GPoint;
  readonly bodyBottomY: number;
  readonly xx: number;
  readonly elbowX: number;
  /** `ConnectionBackSimple#drawTranslate`'s own `calculateDimension
   *  (stringBounder).getWidth()` (`:283,296`) -- the whole while tile's
   *  width, read here (not derived from `xx`) since `xx = x + dimTotalWidth`
   *  bakes in the tile's own placement `x`, which the translate shape's
   *  `Math.max(translate1.dx, translate2.dx) + dimTotal.width` never does. */
  readonly dimTotalWidth: number;
  readonly headerOutLane: string | undefined;
  readonly headerInLane: string | undefined;
  readonly bodyInLane: string | undefined;
  readonly bodyOutLane: string | undefined;
  /**
   * `FtileWhile`'s own `backward` field (`FtileWhile.java:85,110-121`),
   * carried here so `pushWhileBack`/`pushWhileBackNonEmpty`/`walk-while-
   * backward.ts` never need `t: GtileWhile` as a separate parameter
   * (mission `activity-divergence-drive` T3h). `backPos`/`backInLane`/
   * `backOutLane` are always computed (never `undefined` themselves, even
   * when {@link backward} is), mirroring `GtileWhile.backwardOffsetX/Y`'s
   * own always-computed style -- unread whenever {@link backward} is
   * unset.
   */
  readonly backward: Tile | undefined;
  readonly backPos: GPoint;
  readonly backInLane: string | undefined;
  readonly backOutLane: string | undefined;
  /** BACKLBL (add2 T3i): {@link GtileWhile.backIncoming}/{@link GtileWhile.backOutgoing},
   *  carried here so `walk-while-backward.ts` never needs `t: GtileWhile`
   *  as a separate parameter (same rationale as {@link backward} itself). */
  readonly backIncoming: string | undefined;
  readonly backOutgoing: string | undefined;
  /**
   * `FtileWhile`'s own `specialOut` field (`FtileWhile.java:84,120`,
   * mission add2-T3b, family WSPEC): the while's `ConnectionOutSpecial`
   * target, replacing `ConnectionOut` entirely when set. `specialPos` is
   * `GtileWhile.specialOffsetX/Y` translated by this tile's own origin --
   * always computed (`(0,0)` offsets when {@link specialOut} is unset),
   * same always-computed style as {@link backPos}.
   */
  readonly specialOut: Tile | undefined;
  readonly specialPos: GPoint;
  readonly specialInLane: string | undefined;
}

/**
 * The `ConnectionIn`-then-`ConnectionBackSimple` branch (body has real
 * size): the in-edge, then -- unless the body has no point out
 * (`ConnectionBackSimple`'s own `drawU` returns early, drawing nothing, not
 * even the reservation, when `getP1` returns `null`, `:229-232`, e.g. a
 * body ending in `stop`) -- the back edge, tagged with D2's `WhileBackLoop`
 * record so a cross-lane placement can retarget it (T2). When
 * `frame.backward` is set, `ConnectionBackBackward1`/`Backward2`
 * (`walk-while-backward.ts`) REPLACE `ConnectionBackSimple` entirely
 * (`FtileWhile.create`, `:154-161`: `backward == null` picks Simple, else
 * both Backward connectors) -- `ConnectionIn` itself is unaffected either
 * way. Split out of {@link pushWhileBack} to keep that function's own NLOC
 * under the file's limit.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:148-168
 */
function pushWhileBackNonEmpty(frame: WhileFrame): void {
  const { out, header, body, hX, hY, headerEast, headerSouth, bodyBottomY, xx, dimTotalWidth } = frame;
  const { headerOutLane, headerInLane, bodyInLane, bodyOutLane } = frame;
  pushEdge(out, new GConnectionVerticalDown().getPoints(headerSouth, frame.bodyNorth), headerOutLane, bodyInLane);

  if (frame.backward !== undefined) {
    pushWhileBackwardConnections(frame);
    return;
  }
  if (!body.hasPointOut()) return;

  const backFrom = frame.bodySouth;
  pushEdgeFlagged(out, backEdgePoints(backFrom, headerEast, bodyBottomY, xx), [bodyOutLane, headerInLane], {
    emphasize: 'up',
    loop: buildWhileBackLoop(header, hX, hY, backFrom, { originX: xx - dimTotalWidth, dimTotalWidth }),
  });
  // Drawn in the body's out lane (`ConnectionBackSimple`, `FtileWhile.java:271,302`).
  pushLaneReservation(out.reservations, whileHexagonReservation(backFrom.x, backFrom.y, bodyBottomY), bodyOutLane);
}

/**
 * `ConnectionIn`, then `ConnectionBackSimple` (delegated to
 * {@link pushWhileBackNonEmpty}) -- or, when the body is truly empty
 * (`dim.getWidth() == 0 || dim.getHeight() == 0`), `ConnectionBackEmpty` in
 * their place (no separate `ConnectionIn` is added at all in that branch,
 * and no `loop` tag: `ConnectionBackEmpty` is NOT `ConnectionTranslatable`,
 * `decisions.md`'s translatable/non-translatable list).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWhile.java:148-168
 */
function pushWhileBack(frame: WhileFrame): void {
  const { out, body, headerEast, headerSouth, bodyBottomY, xx, headerOutLane } = frame;

  if (body.width === 0 || body.height === 0) {
    pushEdgeFlagged(out, backEdgePoints(headerSouth, headerEast, bodyBottomY, xx), [headerOutLane, headerOutLane], {
      emphasize: 'up',
    });
    // `ConnectionBackEmpty(diamond1, diamond1)`: the header's lane (`FtileWhile.java:414,459`).
    pushLaneReservation(
      out.reservations,
      whileHexagonReservation(headerSouth.x, headerSouth.y, bodyBottomY),
      headerOutLane,
    );
    return;
  }

  pushWhileBackNonEmpty(frame);
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
  // `withMerge(LIMITED)` (`FtileWhile.java:485` -- T1b wires `mergeable`
  // from this comment); `snake2` below keeps the builder's own default
  // FULL (`:504`), confirmed merge-case C (`connection-census.md` §3/§4).
  pushEdgeFlagged(
    out,
    [headerWest, { x: elbowX, y: headerWest.y }, { x: elbowX, y: southHook.y }],
    [headerOutLane, headerOutLane],
    { emphasize: 'down', arrowhead: false, mergeable: 'LIMITED' },
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
 *
 * T3i (row WELD, `jupivo-67-gidi531`): a `break` inside a `fork`/`fork
 * again` branch is ALSO excluded -- `InstructionFork.createFtile`
 * (`InstructionFork.java:122-130`) never calls or forwards a branch's
 * `getWeldingPoints()`, so it never reaches `whileBlock.getWeldingPoints()`
 * at all; `out.forkBodyRanges` (set by `walk-fork-branches.ts`) names
 * exactly those node-index ranges.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorWhile.java:101-116
 */
function pushWhileWeldings(out: Out, bodyNodeStart: number, bodyNodeEnd: number, elbowX: number): void {
  for (let i = bodyNodeStart; i < bodyNodeEnd; i++) {
    const breakNode = out.nodes[i]!;
    if (breakNode.kind !== 'break' || isInsideForkBody(out, i)) continue;
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

/** A child hook, child-LOCAL point first (`FtileWhile.java:179-186,228-232,
 *  621-641`), walk origin last (the snake's `UTranslate`, `Worm.java:67-79`):
 *  `(x + offset) + hook` left ends one ULP apart, which `Direction.fromVector`'s
 *  exact `==` (`Direction.java:110-130`) rejects. Cf. `pushTopDownSiblingEdge`. */
export function childHook(origin: GPoint, offset: GPoint, tile: Tile, hook: HookName): GPoint {
  const local = tile.getCoord(hook);
  return { x: origin.x + (offset.x + local.x), y: origin.y + (offset.y + local.y) };
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
  readonly header: DiamondConditionTile;
  readonly body: Tile;
  readonly myLane: string | undefined;
  readonly out: Out;
}

/** {@link WhileFrame}'s `specialOut`/`specialPos`/`specialInLane` trio --
 *  split out of {@link buildWhileFrame} to keep that function's own NLOC
 *  under the file's limit (D-new, mission add2-T3b, family WSPEC). */
function buildWhileSpecialFields(
  t: GtileWhile,
  x: number,
  y: number,
  myLane: string | undefined,
): Pick<WhileFrame, 'specialOut' | 'specialPos' | 'specialInLane' | 'backIncoming' | 'backOutgoing'> {
  return {
    backIncoming: t.backIncoming,
    backOutgoing: t.backOutgoing,
    specialOut: t.specialOut,
    specialPos: { x: x + t.specialOffsetX, y: y + t.specialOffsetY },
    specialInLane: t.specialOut !== undefined ? laneIn(t.specialOut, myLane) : undefined,
  };
}

/** {@link WhileFrame}'s {@link childHook} points (split for the NLOC limit). */
function buildWhileHookFields(
  o: WhileOrigins,
): Pick<WhileFrame, 'headerEast' | 'headerWest' | 'headerSouth' | 'bodyNorth' | 'bodySouth'> {
  const { t, header, body } = o;
  const origin = { x: o.x, y: o.y };
  const headerOffset = { x: t.headerOffsetX, y: t.headerOffsetY };
  const bodyOffset = { x: t.bodyOffsetX, y: t.bodyOffsetY };
  return {
    headerEast: childHook(origin, headerOffset, header, EAST_HOOK),
    headerWest: childHook(origin, headerOffset, header, WEST_HOOK),
    headerSouth: childHook(origin, headerOffset, header, SOUTH_HOOK),
    bodyNorth: childHook(origin, bodyOffset, body, NORTH_HOOK),
    bodySouth: childHook(origin, bodyOffset, body, SOUTH_HOOK),
  };
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
    ...buildWhileHookFields(o),
    southHook: { x: x + t.getCoord(SOUTH_HOOK).x, y: y + t.getCoord(SOUTH_HOOK).y },
    bodyBottomY: bY + body.height,
    xx: x + t.width,
    elbowX: x + HEXAGON_HALF_SIZE,
    dimTotalWidth: t.width,
    headerOutLane: laneOut(header, myLane),
    headerInLane: laneIn(header, myLane),
    bodyInLane: laneIn(body, myLane),
    bodyOutLane: laneOut(body, myLane),
    backward: t.backward,
    backPos: { x: x + t.backwardOffsetX, y: y + t.backwardOffsetY },
    backInLane: t.backward !== undefined ? laneIn(t.backward, myLane) : undefined,
    backOutLane: t.backward !== undefined ? laneOut(t.backward, myLane) : undefined,
    ...buildWhileSpecialFields(t, x, y, myLane),
  };
}

export function walkWhile(t: GtileWhile, x: number, y: number, myLane: string | undefined, out: Out): void {
  const rawChildren = t.children;
  // D1 (widened add3 T3a, CONDSTYLE-EMPTY): the header is a
  // `DiamondConditionTile` -- `GtileDiamondInside`/`GtileDiamondSquare`/
  // `GtileDiamondEmpty`, dispatched by `tile-layout.ts#buildWhileHeader`.
  const header = rawChildren[0] as unknown as DiamondConditionTile;
  const body = rawChildren[1]!;
  // Each child sits so its OWN `left` lands under the tile's merged `left`
  // (`FtileWhile.java:621-641`: `x = dimTotal.getLeft() - child.getLeft()`),
  // never centred by `width / 2` -- an asymmetric body (an `if`) would slant
  // the forward and back edges.
  const hX = x + t.headerOffsetX;
  const hY = y + t.headerOffsetY;

  const bX = x + t.bodyOffsetX;
  const bY = y + t.bodyOffsetY;
  // D13 (WORD, mission add2-T3b): `drawU` draws `whileBlock` BEFORE
  // `diamond1` (`FtileWhile.java:556-557`) -- the body's own nodes land
  // first in document order, the header hexagon second. Only the NODE
  // draw order moves; every geometry formula above is unaffected by which
  // child is walked first.
  const bodyNodeStart = out.nodes.length;
  walkTile(body, bX, bY, { kindHint: null, lane: myLane }, out);
  const bodyNodeEnd = out.nodes.length;

  pushWhileHeader(header, hX, hY, myLane, out);

  const frame = buildWhileFrame({ t, x, y, hX, hY, bX, bY, header, body, myLane, out });

  // `drawU` draws `specialOut` (if set) THEN `backward` (if set), both
  // only ever as plain leaves (`FtileWhile.java:558-562`; `specialOut` is
  // always a `stop`/`end`, `backward` always a plain action box,
  // `InstructionWhile.java:121-122`) -- `walkTile`'s generic dispatch is
  // correct for both, same reason `walk-repeat.ts#pushRepeatBackwardNode`
  // cites.
  const gate = whileLaneGate(frame, myLane);
  walkWhileSpecialOut(frame, gate, myLane);
  if (t.backward !== undefined)
    walkTile(t.backward, frame.backPos.x, frame.backPos.y, { kindHint: null, lane: myLane }, out);

  // D7: In/Back(Simple|Empty|Backward), then Out(Special), then weldings.
  pushWhileBack(frame);
  if (t.specialOut !== undefined) pushWhileOutSpecial(frame, gate);
  else pushWhileOut(frame);
  pushWhileWeldings(out, bodyNodeStart, bodyNodeEnd, frame.elbowX);
}
