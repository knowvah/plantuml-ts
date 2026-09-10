import type { GConnection } from './gconnection.js';
import type { GPoint } from '../tiles/points.js';

/**
 * D1 (`plans/activity-parallel-connectors/decisions.md`): nothing upstream
 * ever routes an if/switch branch connector through a shared "from.x ===
 * to.x" collapse -- that shortcut existed only to hide the fork/split
 * bar-centre elbow this port no longer draws (see `tile-coordinates.ts`'s
 * `walkForkBranches`). The one place a coincident point is dropped is
 * `pushEdge`'s `dedupeAdjacentPoints` (D2, `Worm#addPoint`,
 * `Worm.java:262-266`) -- this class always returns the raw three-point
 * shape, duplicate middle point included when `from.x === to.x`.
 */
export class GConnectionSideThenVerticalThenSide implements GConnection {
  getPoints(from: GPoint, to: GPoint): GPoint[] {
    return [from, { x: from.x, y: to.y }, to];
  }
}
