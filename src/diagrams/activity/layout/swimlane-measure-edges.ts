/**
 * The edges `computeDrawingWidths`' per-lane `LimitFinder`s see, split out
 * of `swimlane-placement.ts` (its 500-line hook, add4-T1b).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:378-394
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/UGraphicInterceptorAllSwimlanes.java:88-101
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import type { LaneEdge } from './swimlane-context.js';
import type { EdgeMeta } from './swimlane-placement.js';

/** Every SAME-lane edge (T3i, {@link LaneEdge}'s own doc: a cross-lane
 *  edge draws through the separate `Cross` class and never enters a
 *  lane's own `getMinMax()`), zipped from `edges`/`edgeMeta` -- the two
 *  arrays `placeSwimlanes` already keeps index-aligned (`PlacementResult
 *  .edgeMeta`'s own doc). add4-T1b: a `ConnectionHline` carrying
 *  `HlinePayload.measureLanes` is the one exception -- it enters EVERY
 *  listed lane (`swimlane-hline.ts`'s own field doc). */
export function sameLaneEdges(edges: readonly ActivityEdgeGeo[], edgeMeta: readonly EdgeMeta[]): LaneEdge[] {
  const out: LaneEdge[] = [];
  for (let i = 0; i < edges.length; i++) {
    const meta = edgeMeta[i]!;
    const hlineLanes = meta.hline?.measureLanes;
    if (hlineLanes !== undefined && hlineLanes.length > 0) {
      for (const lane of hlineLanes) out.push({ swimlane: lane, edge: edges[i]! });
      continue;
    }
    if (meta.lane1 === undefined || meta.lane1 !== meta.lane2) continue;
    out.push({ swimlane: meta.lane1, edge: edges[i]! });
  }
  return out;
}
