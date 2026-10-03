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

import type { GtileRepeat, RepeatBackConnection, RepeatConditionTile } from '../tiles/gtile-repeat.js';
import type { GPoint } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { laneAt, laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';
import { emitDiamondLabels, emitDiamondOwnLabel } from './diamond-labels.js';
import type { LoopTranslate } from './swimlane-loop-translate.js';
import { pushRepeatBackwardConnections } from './walk-repeat-backward.js';
import { pushRepeatBack } from './walk-repeat-back-shapes.js';
import { pushRepeatWeldings } from './walk-repeat-weldings.js';

/** Every absolute-frame value {@link pushRepeatIn}/{@link pushRepeatBack}/
 *  {@link pushRepeatOut}/{@link pushRepeatWeldings} share, computed once so
 *  those functions stay within the file's parameter limit -- mirrors
 *  `walk-while-branch.ts`'s own `WhileFrame`. Declared here, before every
 *  function that reads it (Lizard's TypeScript reader otherwise folds a
 *  trailing interface into the NLOC of whichever function precedes it --
 *  `tile-layout.ts`'s own `tileNode` doc explains the same reader quirk). */
export interface RepeatFrame {
  readonly out: Out;
  readonly entry: Tile;
  readonly body: Tile;
  readonly condition: RepeatConditionTile;
  readonly entryX: number;
  readonly entryY: number;
  readonly bodyX: number;
  readonly bodyY: number;
  readonly condX: number;
  readonly condY: number;
  readonly tileX: number;
  readonly tileY: number;
  readonly tileWidth: number;
  /** Raw, pre-`tileX`-fold local X offsets (`GtileRepeat.entryOffsetX`/
   *  `bodyOffsetX`/`conditionOffsetX`, `gtile-repeat.ts:169-172`) -- kept
   *  alongside the already-folded `entryX`/`bodyX`/`condX` above so edge
   *  builders that need TWO tiles' x to agree bit-for-bit ({@link
   *  pushRepeatIn}, {@link pushRepeatOut}) can resolve each side's own
   *  local offset+hook round-trip FIRST and add `tileX` exactly once,
   *  LAST -- the same regroup `tile-coordinates.ts#pushTopDownSiblingEdge`
   *  already applies (`.agent-notes/T1b-snake-merge.md`'s AXIS_EPSILON
   *  section): `(tileX + offsetX) + hook.x`, evaluated as two separate
   *  large-magnitude adds, can round one ULP apart from the SAME
   *  computation done for a sibling tile with a different offset/hook
   *  pair, even though both are mathematically `tileX + left` upstream.
   */
  readonly entryOffsetX: number;
  readonly bodyOffsetX: number;
  readonly conditionOffsetX: number;
  readonly backConnection: RepeatBackConnection;
  readonly entryOutLane: string | undefined;
  readonly entryInLane: string | undefined;
  readonly bodyInLane: string | undefined;
  readonly bodyOutLane: string | undefined;
  readonly conditionInLane: string | undefined;
  readonly conditionOutLane: string | undefined;
  /** `GtileRepeat.weldDiamond` (D-new), carried onto the frame so
   *  {@link pushRepeatWeldings} never needs `t: GtileRepeat` as a separate
   *  parameter. */
  readonly weldDiamond: { readonly offsetX: number; readonly offsetY: number } | undefined;
  /** `[bodyNodeStart, bodyNodeEnd)`: the `out.nodes` index range the
   *  body's own `walkTile` call pushed into, same convention as
   *  `walk-while-branch.ts#walkWhile`'s own locals -- {@link
   *  pushRepeatWeldings} scans this range for `'break'` kind nodes (D-new). */
  readonly bodyNodeStart: number;
  readonly bodyNodeEnd: number;
}

/** Everything {@link buildRepeatFrame} needs, bundled to keep it (and
 *  {@link walkRepeat}, which builds this) under the file's parameter
 *  limit. Declared before every function for the same reader-quirk reason
 *  as {@link RepeatFrame}. */
interface RepeatOrigins {
  readonly t: GtileRepeat;
  readonly x: number;
  readonly y: number;
  readonly entryX: number;
  readonly entryY: number;
  readonly bodyX: number;
  readonly bodyY: number;
  readonly condX: number;
  readonly condY: number;
  readonly entry: Tile;
  readonly body: Tile;
  readonly condition: RepeatConditionTile;
  readonly myLane: string | undefined;
  readonly out: Out;
  readonly bodyNodeStart: number;
  readonly bodyNodeEnd: number;
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
 * through `walkTile`'s generic dispatch), then north/south, then the
 * hexagon's OWN label, then its east/west side labels -- `FtileDiamond
 * Inside#drawU`'s own order (T3k): the polygon and the own label are two
 * SEPARATE draw calls upstream, never one combined blob, so the own label
 * lands AFTER south, not baked into the polygon push (`renderNode`'s own
 * `'repeat-cond'` case draws the polygon only; the own label draws through
 * the `'if-own-label'` node below). Still pushed under the ORIGINAL
 * `'repeat-cond'` kind (not a dedicated one) so `canvas-origin.ts`'s
 * polygon fudge and `shapes-of.ts`'s condition-box treatment, both already
 * keyed on that name, apply unchanged. South is always the "not"/exit
 * label; east is the "is"/entry label unless `backwardExitsOnLeft`, which
 * moves it to west (mission `activity-divergence-drive` T3h,
 * `tile-layout-backward.ts`). `emitDiamondLabels` no-ops a side `labelAt`
 * never set (`diamond-labels.ts:40-41`), so passing north and both
 * east/west unconditionally is safe -- `repeatConditionLabels` picks east
 * XOR west, never both, and north is never set on this tile (kept for
 * parity with upstream's own unconditional `north.drawU` call). `laneAt`
 * resolves the condition's OWN `.swimlane` over the parent's inherited
 * `myLane`, same as `walkTile`'s own dispatch. The pushed node's `height`
 * is the hexagon-ALONE height, not `condition.height` (which would add a
 * north label's height, never set here, D1). D-new (RNOOUT): a
 * {@link RepeatConditionEmpty} draws nothing at all (`FtileEmpty.drawU`
 * is an empty body) -- the `kind` check below is this function's own
 * narrowing guard, same discriminated-union idiom
 * `walk-while-branch.ts#pushWhileHeader`'s own callers use elsewhere.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:150-151,210-219
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102
 */
function pushRepeatCondition(
  condition: RepeatConditionTile,
  condX: number,
  condY: number,
  myLane: string | undefined,
  out: Out,
): void {
  if (condition.kind === 'gtile-repeat-empty') return;
  const hexLane = laneAt(condition, myLane);
  const box = { x: condX, y: condY, width: condition.width, height: condition.getCoord(SOUTH_HOOK).y };
  pushNode(out, { id: out.nextId('repeat-cond'), kind: 'repeat-cond', ...box, label: condition.label }, hexLane);
  emitDiamondLabels(condition, { x: condX, y: condY }, ['north', 'south'], hexLane, out);
  emitDiamondOwnLabel(condition, box, hexLane, out);
  emitDiamondLabels(condition, { x: condX, y: condY }, ['east', 'west'], hexLane, out);
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
export function pushEdgeFlagged(
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
  const { t, x, y, entryX, entryY, bodyX, bodyY, condX, condY, entry, body, condition, myLane, out } = o;
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
    tileY: y,
    tileWidth: t.width,
    entryOffsetX: t.entryOffsetX,
    bodyOffsetX: t.bodyOffsetX,
    conditionOffsetX: t.conditionOffsetX,
    backConnection: t.backConnection,
    entryOutLane: laneOut(entry, myLane),
    entryInLane: laneIn(entry, myLane),
    bodyInLane: laneIn(body, myLane),
    bodyOutLane: laneOut(body, myLane),
    conditionInLane: laneIn(condition, myLane),
    conditionOutLane: laneOut(condition, myLane),
    weldDiamond: t.weldDiamond,
    bodyNodeStart: o.bodyNodeStart,
    bodyNodeEnd: o.bodyNodeEnd,
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
  const { out, entry, entryOffsetX, entryY, body, bodyOffsetX, bodyY, tileX, entryOutLane, bodyInLane } = frame;
  const p1 = { x: tileX + (entryOffsetX + entry.getCoord(SOUTH_HOOK).x), y: entryY + entry.getCoord(SOUTH_HOOK).y };
  const p2 = { x: tileX + (bodyOffsetX + body.getCoord(NORTH_HOOK).x), y: bodyY + body.getCoord(NORTH_HOOK).y };
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
 * T2h: `p1.x`/`p2.x` resolve the LOCAL `bodyOffsetX`/`conditionOffsetX` +
 * hook round-trip first and fold `tileX` in exactly once, last -- the SAME
 * regroup `tile-coordinates.ts#pushTopDownSiblingEdge` already applies
 * (`.agent-notes/T1b-snake-merge.md`'s AXIS_EPSILON section): the old
 * `bodyX + hook.x` (`bodyX` itself already `tileX + bodyOffsetX`) folded
 * `tileX` in BEFORE the hook add, letting this edge's two ends -- each a
 * DIFFERENT tile's own offset/hook pair -- round one ULP apart even though
 * both are mathematically `tileX + left` upstream (`FtileRepeat.java:
 * 285-293`'s own `getTranslateForRepeat`/`getTranslateDiamond2`, both
 * local-only, with the caller's absolute origin composed as one OUTER
 * translate afterward, never folded into this same sum). Reproduced on
 * `jupoxe-15-sugo110`: `snake-merge-worm.ts#directionOf` threw on this
 * exact pair, `(1421.58125,878)->(1421.5812500000002,926)`.
 */
function pushRepeatOut(frame: RepeatFrame): void {
  const { out, body, bodyOffsetX, bodyY, condition, conditionOffsetX, condY, tileX, bodyOutLane, conditionInLane } =
    frame;
  if (!body.hasPointOut()) return;
  const p1 = { x: tileX + (bodyOffsetX + body.getCoord(SOUTH_HOOK).x), y: bodyY + body.getCoord(SOUTH_HOOK).y };
  const p2 = {
    x: tileX + (conditionOffsetX + condition.getCoord(NORTH_HOOK).x),
    y: condY + condition.getCoord(NORTH_HOOK).y,
  };
  const loop: LoopTranslate = { kind: 'repeat-out', p1, p2 };
  pushEdge(out, [p1, p2], bodyOutLane, conditionInLane, { loop });
}

/**
 * The entry's own node push: the label-less `gtile-repeat-entry` diamond
 * via {@link pushRepeatEntry}, or -- for an inline `repeat :label;` entry
 * -- generic `walkTile` dispatch, same as every other real action tile.
 * Split out of {@link walkRepeat} to keep that function's own NLOC under
 * the file's limit.
 */
function pushRepeatEntryNode(entry: Tile, x: number, y: number, myLane: string | undefined, out: Out): void {
  if (entry.kind === 'gtile-repeat-entry') {
    pushRepeatEntry(entry, x, y, myLane, out);
  } else {
    walkTile(entry, x, y, { kindHint: null, lane: myLane }, out);
  }
}

/**
 * `drawU` draws `backward` LAST among nodes, only when set
 * (`FtileRepeat.java:690-691`) -- flush to the tile's own right edge
 * (`backwardOffsetX`/`Y`, `GtileRepeat`'s own class doc). `walkTile`'s
 * generic dispatch (not a dedicated `pushRepeatXxx`, unlike `entry`'s
 * `gtile-repeat-entry` case) is correct here: `backward` is always a plain
 * action box (`InstructionRepeat.java:182`, `factory.activity`), the same
 * leaf kind `walkTile`'s own `'gtile-action'` case already handles for
 * every ordinary body step. Split out of {@link walkRepeat} to keep that
 * function's own NLOC under the file's limit.
 */
function pushRepeatBackwardNode(t: GtileRepeat, x: number, y: number, myLane: string | undefined, out: Out): void {
  if (t.backward === undefined) return;
  const backX = x + t.backwardOffsetX;
  const backY = y + t.backwardOffsetY;
  walkTile(t.backward, backX, backY, { kindHint: null, lane: myLane }, out);
}

/**
 * `FtileRepeat.create` (`:181-196`): `backward != null` is checked BEFORE
 * `backConnection`'s own simple1/simple2/complex1 selection ever runs --
 * `ConnectionBackBackward1`/`Backward2` REPLACE it entirely, never add to
 * it. Split out of {@link walkRepeat} for the same reason as
 * {@link pushRepeatBackwardNode}.
 */
function pushRepeatBackDispatch(
  t: GtileRepeat,
  frame: RepeatFrame,
  x: number,
  y: number,
  myLane: string | undefined,
): void {
  if (t.backward === undefined) {
    pushRepeatBack(frame);
    return;
  }
  const backPos = { x: x + t.backwardOffsetX, y: y + t.backwardOffsetY };
  pushRepeatBackwardConnections(frame, t.backward, backPos, {
    backIn: laneIn(t.backward, myLane),
    backOut: laneOut(t.backward, myLane),
  });
}

/**
 * `FtileRepeat#drawU` (`FtileRepeat.java:685-692`) draws `repeat` (the
 * body) FIRST, then `diamond1` (the entry) SECOND, then `diamond2` (the
 * condition) THIRD, then `backward` (when set) LAST -- `getMyChildren`
 * (`:88-90`) returns the same `[repeat, diamond1, diamond2]` order. The
 * walk below mirrors that; it is NOT `entry, body, condition` (this
 * file's own prior order, corrected here -- mission `activity-divergence-
 * drive` T2a). Returns the built {@link RepeatFrame} so {@link walkRepeat}
 * can push this tile's own edges on top of it. Split out of
 * {@link walkRepeat} to keep that function's own NLOC under the file's
 * limit.
 *
 * Each child sits so its OWN `left` lands under the tile's merged `left`
 * (`FtileRepeat.java:730-765`), never centred by `width / 2` -- except the
 * entry, whose OWN `width / 2` is used even when it is asymmetric
 * (`:744-748`, `GtileRepeat`'s own class doc).
 */
function pushRepeatNodesAndBuildFrame(
  t: GtileRepeat,
  x: number,
  y: number,
  myLane: string | undefined,
  out: Out,
): RepeatFrame {
  const [entry, body, condition] = t.children;
  const bodyX = x + t.bodyOffsetX;
  const bodyY = y + t.bodyOffsetY;
  const bodyNodeStart = out.nodes.length;
  walkTile(body, bodyX, bodyY, { kindHint: null, lane: myLane }, out);
  const bodyNodeEnd = out.nodes.length;

  const entryX = x + t.entryOffsetX;
  const entryY = y + t.entryOffsetY;
  pushRepeatEntryNode(entry, entryX, entryY, myLane, out);

  const condX = x + t.conditionOffsetX;
  const condY = y + t.conditionOffsetY;
  pushRepeatCondition(condition, condX, condY, myLane, out);
  pushRepeatBackwardNode(t, x, y, myLane, out);

  const origins: RepeatOrigins = {
    t,
    x,
    y,
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
    bodyNodeStart,
    bodyNodeEnd,
  };
  return buildRepeatFrame(origins);
}

/**
 * Every child's own nodes first (body, entry, condition, backward, per
 * `drawU` above), then this tile's own edges -- `In`, the selected `Back`,
 * `Out`, in that order (`FtileRepeat.java:170-203`'s `conns` list,
 * appended after `drawU`'s own draw() calls via `FtileUtils.addConnection`/
 * `FtileWithConnection#drawU`, `FtileWithConnection.java:69-74`), then the
 * break weldings LAST (`FtileFactoryDelegatorRepeat.repeat()`'s own
 * `assembly(...)` call runs AFTER `FtileRepeat.create` returns, D-new).
 */
export function walkRepeat(t: GtileRepeat, x: number, y: number, myLane: string | undefined, out: Out): void {
  const frame = pushRepeatNodesAndBuildFrame(t, x, y, myLane, out);
  pushRepeatIn(frame);
  pushRepeatBackDispatch(t, frame, x, y, myLane);
  pushRepeatOut(frame);
  pushRepeatWeldings(frame);
}
