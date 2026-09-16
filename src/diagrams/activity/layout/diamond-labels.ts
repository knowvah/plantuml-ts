/**
 * `emitDiamondLabels` — the shared `if-label` node emission every
 * `GtileDiamondInside` caller needs: one node per side in `sides` whose
 * `labelAt(side)` is non-null, translated into the walk's absolute frame.
 * Extracted from `walk-if-down.ts`'s own `pushDiamondLabel` (mission
 * `activity-loop-tile-port` T2, D1) for the while/repeat walkers.
 * `walk-if-down.ts` keeps its own copy — T2's write-set excludes it (stop 1
 * pre-authorises the split; journaled).
 *
 * The node-then-labels grouping below is not a stylistic choice: upstream
 * draws a hexagon's polygon, its own label, and every side label as ONE
 * atomic call (`FtileDiamondInside#drawU`), so wherever the diamond falls
 * in its parent's own child order, its side labels are emitted immediately
 * after it — never interleaved with a sibling node.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-102
 *   — `drawU`: polygon, then north, south, the diamond's own label, west,
 *   east, in that order.
 */

import type { DiamondSide, GtileDiamondInside } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import type { Out } from './tile-coordinates.js';
import { pushNode } from './tile-coordinates.js';

/**
 * Pushes one `if-label` node per `side` in `sides` whose `labelAt` is
 * non-null. `sides` is caller-supplied, in upstream `drawU`'s own order
 * (north, south, west, east), restricted to the sides that diamond can
 * ever set — mirrors `pushDiamond1`'s own `south`/`west`/`east` calls in
 * `walk-if-down.ts`.
 */
export function emitDiamondLabels(
  diamond: GtileDiamondInside,
  origin: GPoint,
  sides: readonly DiamondSide[],
  lane: string | undefined,
  out: Out,
): void {
  for (const side of sides) {
    const l = diamond.labelAt(side);
    if (l === null) continue;
    pushNode(
      out,
      {
        id: out.nextId('if-label'),
        kind: 'if-label',
        x: origin.x + l.x,
        y: origin.y + l.y,
        width: l.width,
        height: l.height,
        label: l.label,
      },
      lane,
    );
  }
}
