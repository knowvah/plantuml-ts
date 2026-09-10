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
 * D1: `ConnectionIn#drawU`/`ConnectionOut#drawU`
 * (`ParallelBuilderSplit.java:194-203,246-261`; `ParallelBuilderFork.java
 * :151-163,202-216`) draw a straight vertical drop at the BRANCH's own
 * north/south x -- never the bar centre. The out connector is emitted
 * only `if (geo.hasPointOut())`.
 */
function pushBranchConnectors(branch: Tile, bX: number, bY: number, ctx: ForkBranchContext, out: Out): void {
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
  );

  if (branch.hasPointOut()) {
    const south = branch.getCoord(SOUTH_HOOK);
    const outX = bX + south.x;
    pushEdge(
      out,
      [
        { x: outX, y: bY + south.y },
        { x: outX, y: ctx.joinBarY },
      ],
      laneOut(branch, ctx.myLane),
      ctx.myLane,
    );
  }
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
 */
export function walkForkBranches(t: GtileFork, ctx: ForkBranchContext, out: Out): void {
  for (let i = 0; i < t.children.length; i++) {
    const branch = t.children[i]!;
    const bX = ctx.x + t.branchOffsets[i]!;
    const bY = ctx.y + t.branchTopY;
    walkTile(branch, bX, bY, { kindHint: null, lane: ctx.myLane }, out);
    pushBranchConnectors(branch, bX, bY, ctx, out);
  }
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
 *  becomes `FtileKilled`). The split's join line only exists when
 *  `t.hasPointOut()` (D4/D5, `ParallelBuilderSplit.java:139-141`'s
 *  `FtileKilled` guard), spanning `computeSplitExtent` over branches
 *  WITH an out point, in the LAST branch's exit lane
 *  (`swimlaneOutForStep2()`, `AbstractParallelFtilesBuilder.java:208-210`). */
function pushJoinBarOrLine(t: GtileFork, x: number, joinBarY: number, myLane: string | undefined, out: Out): void {
  const lastBranch = t.children[t.children.length - 1]!;
  if (t.kind === 'gtile-fork') {
    pushNode(
      out,
      { id: out.nextId('join-bar'), kind: 'join-bar', x, y: joinBarY, width: t.barWidth, height: t.barHeight },
      laneOut(lastBranch, myLane),
    );
    return;
  }
  if (!t.hasPointOut()) return;
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
  pushTopBarOrLine(t, x, y, myLane, out);
  const joinBarY = y + t.height - t.barHeight;
  walkForkBranches(t, { x, y, joinBarY, myLane, barHeight: t.barHeight }, out);
  pushJoinBarOrLine(t, x, joinBarY, myLane, out);
}
