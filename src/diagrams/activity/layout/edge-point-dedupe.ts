import type { GPoint } from '../tiles/points.js';

/**
 * Mirrors `Worm#addPoint` (`Worm.java:262-266`): drop a point that
 * exactly equals ("==" on both doubles) the point immediately before it.
 * This is the one edge-construction seam every `tile-coordinates.ts`
 * `pushEdge` call passes through (`decisions.md` D2) -- no tolerance; two
 * points one ulp apart are both kept, matching the jar's own near-zero
 * segments (`.agent-notes/apc-T0.md`). Split into its own sibling module
 * because adding it to `tile-coordinates.ts` would cross the file's
 * 500-line cap (mission `activity-parallel-connectors` README, "Push
 * forward").
 */
export function dedupeAdjacentPoints(points: readonly GPoint[]): GPoint[] {
  const result: GPoint[] = [];
  for (const p of points) {
    const prev = result[result.length - 1];
    if (prev !== undefined && prev.x === p.x && prev.y === p.y) continue;
    result.push(p);
  }
  return result;
}
