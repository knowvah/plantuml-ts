import type { GtileFork } from '../tiles/gtile-fork.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../tiles/points.js';
import type { Tile } from '../tiles/tile.js';
import { BAR_HEIGHT } from '../activity-layout-constants.js';
import { laneIn, laneOut } from './swimlane-placement.js';
import type { Out } from './tile-coordinates.js';
import { pushEdge, walkTile } from './tile-coordinates.js';

/**
 * The fixed values every branch in one fork/split shares -- bundled to
 * keep both functions below under the file's 5-parameter limit.
 */
export interface ForkBranchContext {
  readonly x: number;
  readonly y: number;
  readonly joinBarY: number;
  readonly myLane: string | undefined;
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
      { x: inX, y: ctx.y + BAR_HEIGHT },
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
