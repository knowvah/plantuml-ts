import type { GtileFork } from '../tiles/gtile-fork.js';
import { GtileMerge, MERGE_DIAMOND_SIZE } from '../tiles/gtile-merge.js';
import type { GPoint, HookName } from '../tiles/points.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, pushNode, walkTile } from './tile-coordinates.js';

/**
 * The fixed values every branch in one fork/split shares -- bundled to
 * keep both functions below under the file's 5-parameter limit.
 */
export interface ForkBranchContext {
  readonly x: number;
  readonly y: number;
  readonly joinBarY: number;
  readonly myLane: string | undefined;
  /**
   * The bar-side lane for a JOIN: the join bar itself, and each branch's
   * out-drop landing point. `laneOut(t, myLane)` on the fork/split tile
   * ITSELF (mission `activity-lane-capture` D1/T6/T7) -- both kinds now
   * carry their own captured `swimlaneOut`, so this is never the last
   * branch's own lane or the opener lane.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:77
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:110
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:246-261
   *   -- `ConnectionOut#drawU`, the split branch's out-drop.
   */
  readonly myLaneOut: string | undefined;
  /** `t.barHeight` -- 6 for fork, 1.5 (`THIN_SPLIT_HEIGHT`) for split. The
   *  in-drop's start y is the TOP bar/line's own bottom edge, which is this
   *  many px below `y` (D4; `simuti`'s drops start at `56.5 = 55 + 1.5`). */
  readonly barHeight: number;
}

/**
 * `first..last` (D4's span, `ParallelBuilderSplit.java:87-113,150-176`) over
 * the branches selected by `onlyContinuing` (`false` for the top line: every
 * branch, unconditional; `true` for the join line: only `hasPointOut()`
 * branches), taken at the branch's own `hook` x, THEN CLAMPED to the
 * composite's own centre x (`:104-109`, `:171-176` -- `geom.getLeft()` is
 * the branches-only assembly's own in/out x, which for our symmetric
 * `GtileFork.getCoord` is `t.width / 2`, the SAME value on both hooks). The
 * loop mirrors the Java's `if (first == 0) first = ...; last = ...;` --
 * first/last of the QUALIFYING branches in source order, not a min/max
 * reduction (branches never reorder, so the two coincide here).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:87-113
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:150-176
 */
export function computeSplitExtent(
  t: GtileFork,
  hook: HookName,
  onlyContinuing: boolean,
): { first: number; last: number } {
  const centreX = t.getCoord(NORTH_HOOK).x;
  let first = centreX;
  let last = centreX;
  let sawAny = false;
  for (let i = 0; i < t.children.length; i++) {
    const branch = t.children[i]!;
    if (onlyContinuing && !branch.hasPointOut()) continue;
    const candidate = t.branchOffsets[i]! + branch.getCoord(hook).x;
    if (!sawAny) {
      first = candidate;
      sawAny = true;
    }
    last = candidate;
  }
  if (last < centreX) last = centreX;
  if (first > centreX) first = centreX;
  return { first, last };
}

/**
 * D1: `ConnectionIn#drawU`
 * (`ParallelBuilderSplit.java:194-203`; `ParallelBuilderFork.java:151-163`)
 * draws a straight vertical drop at the BRANCH's own north x -- never the
 * bar centre. `doStep1` appends one of these per branch, unconditionally
 * (`ParallelBuilderSplit.java:97`, `ParallelBuilderFork.java:93`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:88-101
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:87-97
 */
function pushBranchIn(branch: Tile, bX: number, bY: number, ctx: ForkBranchContext, out: Out): void {
  const north = branch.getCoord(NORTH_HOOK);
  const inX = bX + north.x;
  pushEdge(
    out,
    [
      { x: inX, y: ctx.y + ctx.barHeight },
      { x: inX, y: bY + north.y },
    ],
    ctx.myLane,
    laneIn(branch, ctx.myLane),
    'parallel-in',
  );
}

/**
 * D1: `ConnectionOut#drawU`
 * (`ParallelBuilderSplit.java:246-261`; `ParallelBuilderFork.java:202-216`)
 * draws the drop at the BRANCH's own south x. `doStep2` appends one per
 * branch, but only `if (dim.hasPointOut())` -- a branch ending in
 * `detach`/`kill` contributes none, and the rest keep source order
 * (`ParallelBuilderSplit.java:165-166`, `ParallelBuilderFork.java:125-126`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderSplit.java:155-167
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderFork.java:120-127
 */
function pushBranchOut(branch: Tile, bX: number, bY: number, ctx: ForkBranchContext, out: Out): void {
  if (!branch.hasPointOut()) return;
  const south = branch.getCoord(SOUTH_HOOK);
  const outX = bX + south.x;
  pushEdge(
    out,
    [
      { x: outX, y: bY + south.y },
      { x: outX, y: ctx.joinBarY },
    ],
    laneOut(branch, ctx.myLane),
    ctx.myLaneOut,
    'parallel-out',
  );
}

/**
 * Split out of `tile-coordinates.ts`'s `walkTile` switch only to keep
 * that file under the 500-line cap (mission `activity-parallel-
 * connectors` README, "Push forward"); this is the fork/split case's
 * per-branch loop verbatim, not a new abstraction. `walkTile`/`pushEdge`
 * are re-imported from there, so this module and `tile-coordinates.ts`
 * import each other -- safe because neither calls the other until
 * `assignCoordinates` actually walks the tile tree, well after both
 * modules finish loading.
 *
 * Mission `activity-edge-draw-order` D4/T3: THREE passes, not one per
 * branch. Upstream builds a parallel as `doStep2(inner, doStep1(inner))`
 * (`AbstractParallelFtilesBuilder.java:166-169`); `doStep1` collects one
 * `ConnectionIn` per branch into a single list and wraps the branches with
 * it (`ParallelBuilderSplit.java:88-101`, `ParallelBuilderFork.java:87-97`),
 * then `doStep2` collects one `ConnectionOut` per branch WITH an out point
 * and wraps again (`ParallelBuilderSplit.java:155-177`,
 * `ParallelBuilderFork.java:120-130`). `FtileWithConnection.drawU` draws its
 * delegate BEFORE its own connections (`FtileWithConnection.java:69-74`), so
 * the jar's edge run is every branch's internal edges, then every
 * in-connector in branch order, then every out-connector. Lanes,
 * coordinates and counts are identical to the per-branch interleaving this
 * replaced -- only each edge's position in `out.edges` changes.
 */
export function walkForkBranches(t: GtileFork, ctx: ForkBranchContext, out: Out): void {
  const placed = t.children.map((branch, i) => ({
    branch,
    bX: ctx.x + t.branchOffsets[i]!,
    bY: ctx.y + t.branchTopYs[i]!,
  }));
  // `inner` -- each branch's own internals, in branch order.
  for (const p of placed) walkTile(p.branch, p.bX, p.bY, { kindHint: null, lane: ctx.myLane }, out);
  // `doStep1` -- every `ConnectionIn`, unconditional.
  for (const p of placed) pushBranchIn(p.branch, p.bX, p.bY, ctx, out);
  // `doStep2` -- every `ConnectionOut`, `hasPointOut()` branches only.
  for (const p of placed) pushBranchOut(p.branch, p.bX, p.bY, ctx, out);
}

/** The fork's top bar is a full-`barWidth` rect in `myLane` (D4,
 *  unconditional). The split's top line is `computeSplitExtent` over
 *  EVERY branch (D4/D3, `ParallelBuilderSplit.java:87-113`), in the
 *  FIRST branch's entry lane (`list99.get(0).getSwimlaneIn()`,
 *  `ParallelBuilderSplit.java:83`). */
function pushTopBarOrLine(t: GtileFork, x: number, y: number, myLane: string | undefined, out: Out): void {
  if (t.kind === 'gtile-fork') {
    pushNode(
      out,
      { id: out.nextId('fork-bar'), kind: 'fork-bar', x, y, width: t.barWidth, height: t.barHeight },
      myLane,
    );
    return;
  }
  const { first, last } = computeSplitExtent(t, NORTH_HOOK, false);
  pushNode(
    out,
    { id: out.nextId('split-bar'), kind: 'split-bar', x: x + first, y, width: last - first, height: t.barHeight },
    laneIn(t.children[0]!, myLane),
  );
}

/** The fork's join bar is unconditional (D5's amendment -- a fork never
 *  becomes `FtileKilled`), drawn in the fork's own OUT lane (`myLaneOut`,
 *  mission `activity-lane-capture` D1/T6 -- upstream's `out`, not the last
 *  branch's own exit lane). The split's join line only exists when
 *  `t.hasPointOut()` (D4/D5, `ParallelBuilderSplit.java:139-141`'s
 *  `FtileKilled` guard), spanning `computeSplitExtent` over branches
 *  WITH an out point, in the LAST branch's exit lane
 *  (`swimlaneOutForStep2()`, `AbstractParallelFtilesBuilder.java:208-210`) --
 *  T1's Q2 confirmed this descent already matches upstream for a non-empty
 *  last branch, so T7 leaves it reading `lastBranch` directly rather than
 *  `myLaneOut`; in practice the two agree, since nothing changes the
 *  current lane between the last branch's own close and `end split`. */
function pushJoinBarOrLine(
  t: GtileFork,
  x: number,
  joinBarY: number,
  myLane: string | undefined,
  myLaneOut: string | undefined,
  out: Out,
): void {
  if (t.kind === 'gtile-fork') {
    pushNode(
      out,
      { id: out.nextId('join-bar'), kind: 'join-bar', x, y: joinBarY, width: t.barWidth, height: t.barHeight },
      myLaneOut,
    );
    return;
  }
  if (!t.hasPointOut()) return;
  const lastBranch = t.children[t.children.length - 1]!;
  const { first, last } = computeSplitExtent(t, SOUTH_HOOK, true);
  pushNode(
    out,
    {
      id: out.nextId('split-join-bar'),
      kind: 'split-join-bar',
      x: x + first,
      y: joinBarY,
      width: last - first,
      height: t.barHeight,
    },
    laneOut(lastBranch, myLane),
  );
}

/**
 * The fork/split case's full node/edge emission: top bar/line, every
 * branch with its connectors (`walkForkBranches`), then the join
 * bar/line -- upstream's own assembly order
 * (`ParallelBuilderFork.java:87-131`, `ParallelBuilderSplit.java
 * :77-179`: both build the join tile AFTER the branches, never before).
 * Delegated from `tile-coordinates.ts`'s `walkTile` switch to keep that
 * file under the 500-line cap (mission `activity-parallel-connectors`
 * README, "Push forward").
 */
export function walkForkOrSplit(t: GtileFork, x: number, y: number, myLane: string | undefined, out: Out): void {
  // D12/T1p-c: `GtileMerge` keeps the inherited `kind === 'gtile-fork'`
  // (that file's own doc) purely so `tile-coordinates.ts`'s switch -- out
  // of this task's write-set -- routes it here unchanged; branch out to
  // `walkMerge` before any fork/split-specific logic runs.
  if (t instanceof GtileMerge) {
    walkMerge(t, x, y, myLane, out);
    return;
  }
  // Mission `activity-lane-capture` D1/T6/T7: both fork's and split's
  // bar-side OUT lane is the compound's own `swimlaneOut` (falling back to
  // `swimlane`/`myLane`) -- `laneOut(t, myLane)` short-circuits on the
  // tile's own field before ever descending into a branch (`swimlane-
  // lanes.ts#laneOut`), so this is a no-op for any tile that never sets
  // `swimlaneOut` (T7 is the first task to set it on `GtileSplit`).
  const myLaneOut = laneOut(t, myLane);
  pushTopBarOrLine(t, x, y, myLane, out);
  const joinBarY = y + t.height - t.barHeight;
  walkForkBranches(t, { x, y, joinBarY, myLane, myLaneOut, barHeight: t.barHeight }, out);
  pushJoinBarOrLine(t, x, joinBarY, myLane, myLaneOut, out);
}

// ---------------------------------------------------------------------------
// fork ... end merge (ForkStyle.MERGE, D12/T1p-c)
// ---------------------------------------------------------------------------

/** The join diamond's own geometry, computed once and threaded to every
 *  branch's out-connector (`mergeArrival`) and the final node push. Bundles
 *  `myLane` too, purely to keep `pushMergeOut` at the file's 5-parameter
 *  limit (same device `ForkBranchContext` already uses above). */
interface MergeDiamondGeo {
  readonly centerX: number;
  readonly top: number;
  readonly myLane: string | undefined;
}

/**
 * `ConnectionHorizontalThenVertical#arrivalOnDiamond`
 * (`ParallelBuilderMerge.java:174-189`): a branch exiting left of the
 * diamond's own west edge lands on the WEST vertex, right of the east edge
 * on the EAST vertex, else (including exactly centred) the NORTH vertex.
 * The decoration (`asToRight`/`asToLeft`/`asToDown`) is never stored
 * explicitly in this port -- `arrows-regular.ts#arrowDirection` derives it
 * from the edge's own final segment, which agrees with upstream's explicit
 * choice for the WEST/EAST cases (the segment's sign necessarily matches
 * which side `startX` fell on) and for an EXACTLY centred branch (the
 * `(x1,y2)->(x2,y2)` segment collapses to zero length via
 * `dedupeAdjacentPoints`, leaving a pure vertical drop, `arrowDirection`'s
 * own `dx===0` -> `'down'` case). A branch within the diamond's span but
 * NOT exactly centred (asymmetric branch widths) would derive `'left'`/
 * `'right'` here against upstream's explicit `'down'` -- a known, narrow
 * residual; no corpus/authored fixture in this task's cohort exercises it
 * (confirmed against `mepeze-15-nuge493`'s exactly-centred middle branch).
 */
function mergeArrival(startX: number, diamond: MergeDiamondGeo): GPoint {
  const a = diamond.centerX - MERGE_DIAMOND_SIZE / 2;
  const b = diamond.centerX + MERGE_DIAMOND_SIZE / 2;
  const midY = diamond.top + MERGE_DIAMOND_SIZE / 2;
  if (startX < a) return { x: a, y: midY };
  if (startX > b) return { x: b, y: midY };
  return { x: diamond.centerX, y: diamond.top };
}

/**
 * `ConnectionHorizontalThenVertical#drawU` (`ParallelBuilderMerge.java:
 * 135-159`): branch south -> horizontal -> vertical into the diamond,
 * gated on `hasPointOut()` exactly like `pushBranchOut`. Both edge
 * endpoints share one lane (`laneOut(branch, myLane)`): the Java class
 * does NOT implement `ConnectionTranslatable` (commented out,
 * `ParallelBuilderMerge.java:121`), i.e. it has no cross-swimlane routing
 * upstream -- tagging both ends with the same lane means `routeEdge`
 * (`swimlane-placement.ts`) never treats this edge as lane-crossing,
 * matching that absence rather than inventing support upstream never had.
 */
function pushMergeOut(branch: Tile, bX: number, bY: number, diamond: MergeDiamondGeo, out: Out): void {
  if (!branch.hasPointOut()) return;
  const south = branch.getCoord(SOUTH_HOOK);
  const x1 = bX + south.x;
  const y1 = bY + south.y;
  const target = mergeArrival(x1, diamond);
  const lane = laneOut(branch, diamond.myLane);
  pushEdge(out, [{ x: x1, y: y1 }, { x: x1, y: target.y }, target], lane, lane);
}

/** The join diamond itself -- reuses the `'if-merge'` node kind (D12):
 *  both are the SAME upstream class, a label-less `FtileDiamond`
 *  (`vertical/FtileDiamond.java`), so the existing `renderIfMerge`/
 *  `canvas-origin.ts`/`compress/shapes-of.ts` handling for that kind
 *  already applies correctly, unmodified. `myLane` (not a distinct
 *  `swimlaneOutForStep2()` descent): D12's merge builder reads
 *  `list99.get(0).getSwimlaneIn()`/the base class's own
 *  `swimlaneOutForStep2()` default internally rather than the
 *  `InstructionFork`-captured fields `GtileFork`'s `withSwimlane`/
 *  `withSwimlaneOut` set (`tile-layout.ts#tileFork`) -- the two coincide
 *  whenever nothing changes lane between the fork opener/closer and the
 *  first/last branch's own edge, true of every row in this task's cohort;
 *  not re-derived from the branches here for that reason. */
function pushMergeDiamondNode(diamond: MergeDiamondGeo, out: Out): void {
  pushNode(
    out,
    {
      id: out.nextId('if-merge'),
      kind: 'if-merge',
      x: diamond.centerX - MERGE_DIAMOND_SIZE / 2,
      y: diamond.top,
      width: MERGE_DIAMOND_SIZE,
      height: MERGE_DIAMOND_SIZE,
    },
    diamond.myLane,
  );
}

/**
 * `fork ... end merge` (`ForkStyle.MERGE`, D12/T1p-c): the top bar and
 * every branch's `ConnectionIn` are IDENTICAL to the fork case
 * (`ParallelBuilderMerge.doStep1` is byte-for-byte `ParallelBuilderFork
 * .doStep1`, both builders' own `ConnectionIn` classes share the same
 * `drawU`/`drawTranslate` bodies) -- only the OUT side differs
 * (`ConnectionHorizontalThenVertical` into a diamond, not `ConnectionOut`
 * into a join bar), so this reuses `pushBranchIn` as-is and never calls
 * `pushBranchOut`/`pushJoinBarOrLine`.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/ParallelBuilderMerge.java:71-119
 */
export function walkMerge(t: GtileFork, x: number, y: number, myLane: string | undefined, out: Out): void {
  pushNode(
    out,
    { id: out.nextId('fork-bar'), kind: 'fork-bar', x, y, width: t.barWidth, height: t.barHeight },
    myLane,
  );

  const placed = t.children.map((branch, i) => ({
    branch,
    bX: x + t.branchOffsets[i]!,
    bY: y + t.branchTopYs[i]!,
  }));
  const diamond: MergeDiamondGeo = {
    centerX: x + t.getCoord(NORTH_HOOK).x,
    top: y + t.height - MERGE_DIAMOND_SIZE,
    myLane,
  };
  const inCtx: ForkBranchContext = { x, y, joinBarY: diamond.top, myLane, myLaneOut: myLane, barHeight: t.barHeight };

  for (const p of placed) walkTile(p.branch, p.bX, p.bY, { kindHint: null, lane: myLane }, out);
  for (const p of placed) pushBranchIn(p.branch, p.bX, p.bY, inCtx, out);
  for (const p of placed) pushMergeOut(p.branch, p.bX, p.bY, diamond, out);

  pushMergeDiamondNode(diamond, out);
}
