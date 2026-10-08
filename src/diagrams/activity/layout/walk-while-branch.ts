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
import { isInsideForkBody } from './walk-fork-branches.js';

/**
 * The hexagon node, then north, then the hexagon's OWN label, then west --
 * `FtileDiamondInside#drawU`'s own order (T3k): the polygon and the own
 * label are two SEPARATE draw calls upstream, never one combined blob, so
 * the own label lands AFTER north, not baked into the polygon push
 * (`renderNode`'s own `'while-header'` case draws the polygon only when
 * labelled; the own label draws through the `'if-own-label'` node below).
 * Still pushed under the ORIGINAL `'while-header'` kind (not a dedicated
 * one) so `canvas-origin.ts`'s polygon fudge and `shapes-of.ts`'s
 * condition-box treatment, both already keyed on that name, apply
 * unchanged; the SAME kind also covers the label-less case (`renderNode`'s
 * own ternary falls to `renderDiamond`). North is the "is"/entry label,
 * west is the "is not"/exit label; south/east are never set on this tile
 * (kept out, unlike `walk-repeat.ts`'s copy, which uses both). `laneAt`
 * resolves the header's OWN `.swimlane` over the parent's inherited
 * `myLane` -- the same resolution `walkTile`'s own dispatch
 * (`tile-coordinates.ts:117-118`) applies to every tile it walks; pushing
 * a node directly (never through `walkTile`, D1) means this helper must
 * apply it itself. `tileWhile` (`tile-layout.ts`) never calls
 * `withSwimlane` on the header today, so `header.swimlane` is always
 * `undefined` here and `hexLane === myLane` -- kept for parity with
 * `pushRepeatCondition`'s own fix and so a future `tileWhile` change that
 * DOES lane the header does not silently regress.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102
 *
 * Generalized (add3 T3a, CONDSTYLE-EMPTY) to any {@link DiamondCondition
 * Tile} header, not just the hexagon: the polygon's own box is the
 * ALONE shape, i.e. `[header.getCoord(NORTH_HOOK).y, header.getCoord
 * (SOUTH_HOOK).y)` -- for `GtileDiamondInside`/`GtileDiamondSquare`
 * (`inY = 0` always) this reduces to the OLD `{y: hY, height: SOUTH_HOOK
 * .y}` exactly; for `GtileDiamondEmpty` (`inY` = its own north-label
 * reserve, possibly nonzero) the alone box is shifted DOWN by that
 * reserve and is always exactly 24 tall, matching `FtileDiamond`'s own
 * fixed-size rhombus (`gtile-diamond-empty.ts`'s own doc).
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
  emitDiamondLabels(header, { x: hX, y: hY }, ['north'], hexLane, out);
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
  /** `ConnectionIn#getP1` / `ConnectionBackEmpty`'s start: diamond1's out. */
  readonly headerSouth: GPoint;
  /** `ConnectionIn#getP2`: the body's point in. */
  readonly bodyNorth: GPoint;
  /** `ConnectionBackSimple#getP1`: the body's point out. */
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
 * `ConnectionOutSpecial` (`FtileWhile.java:513-552`): REPLACES
 * `ConnectionOut` entirely when `specialOut` is set (`FtileWhile.create`,
 * `:163-166`). `p1 = translateDiamond1 + (0,0)`, `y1 = p1.y + inY + half`
 * with `inY = 0` and `half = hexHeight / 2` -- exactly this port's
 * `WEST_HOOK` (`frame.headerWest`, same mid-height point `pushWhileOut`
 * reads). `p2` is the special tile's own `NORTH_HOOK`, translated by
 * `frame.specialPos` (`getTranslateForSpecial`, `GtileWhile`'s own class
 * doc). Draw: `(x1,y1) -> (x2,y1) -> (x2,y2)`, `asToDown`, no emphasize,
 * default merge (FULL, `Snake.create(skinParam, color, arrow)`, `:533`).
 * Mission add2-T3b, family WSPEC.
 */
function pushWhileOutSpecial(frame: WhileFrame): void {
  const { out, headerWest, specialPos, specialOut, headerOutLane, specialInLane } = frame;
  const special = specialOut!;
  const p2 = { x: specialPos.x + special.getCoord(NORTH_HOOK).x, y: specialPos.y + special.getCoord(NORTH_HOOK).y };
  pushEdge(out, [headerWest, { x: p2.x, y: headerWest.y }, p2], headerOutLane, specialInLane);
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

/**
 * A child's hook in absolute coordinates, grouped as upstream groups it:
 * the child-LOCAL point first (`getTranslateDiamond1`/`getTranslateForWhile`
 * `.getTranslated(geo.getPointOut())`, `FtileWhile.java:179-186,228-232,
 * 621-641`), THEN the walk origin, which upstream adds last as the snake's
 * own `UTranslate` (`Worm.java:67-79` `move`, resolved per point). Folding
 * the origin into the offset first (`(x + offset) + hook`) left the in-edge
 * and back-edge ends one ULP apart on a resolved creole width (xovigi
 * under the FULL-block hexagon sizing: 168.97500000000002 vs 168.975), and
 * `Direction.fromVector`'s exact `==` (`Direction.java:110-130`), which
 * `snake-merge-worm.ts#directionOf` mirrors, then rejects the segment.
 * Same grouping fix as `tile-coordinates.ts#pushTopDownSiblingEdge`.
 */
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

/** Builds the {@link WhileFrame} every `Connection*` push reads from --
 *  split out of {@link walkWhile} only to keep that function's own NLOC
 *  under the file's limit. */
function buildWhileFrame(o: WhileOrigins): WhileFrame {
  const { t, x, y, hX, hY, bX, bY, header, body, myLane, out } = o;
  const origin = { x, y };
  const headerOffset = { x: t.headerOffsetX, y: t.headerOffsetY };
  const bodyOffset = { x: t.bodyOffsetX, y: t.bodyOffsetY };
  return {
    out,
    header,
    body,
    hX,
    hY,
    bX,
    bY,
    headerEast: childHook(origin, headerOffset, header, EAST_HOOK),
    headerWest: childHook(origin, headerOffset, header, WEST_HOOK),
    headerSouth: childHook(origin, headerOffset, header, SOUTH_HOOK),
    bodyNorth: childHook(origin, bodyOffset, body, NORTH_HOOK),
    bodySouth: childHook(origin, bodyOffset, body, SOUTH_HOOK),
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
  if (t.specialOut !== undefined)
    walkTile(t.specialOut, frame.specialPos.x, frame.specialPos.y, { kindHint: null, lane: myLane }, out);
  if (t.backward !== undefined)
    walkTile(t.backward, frame.backPos.x, frame.backPos.y, { kindHint: null, lane: myLane }, out);

  // D7: In/Back(Simple|Empty|Backward), then Out(Special), then weldings.
  pushWhileBack(frame);
  if (t.specialOut !== undefined) pushWhileOutSpecial(frame);
  else pushWhileOut(frame);
  pushWhileWeldings(out, bodyNodeStart, bodyNodeEnd, frame.elbowX);
}
