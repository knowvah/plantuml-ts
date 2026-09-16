import type { GtileFork } from '../tiles/gtile-fork.js';
import type { HookName } from '../tiles/points.js';
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
