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

import type { DiamondConditionTile, DiamondSide } from '../tiles/gtile-diamond-inside.js';
import type { GPoint } from '../tiles/points.js';
import type { Out } from './tile-coordinates.js';
import { pushNode } from './tile-coordinates.js';

/** `ActivityNodeGeo.onDiamondBack` for a slot of `diamond`: every diamond
 *  but the EMPTY one draws its slots over its own back (that field's doc). */
export function diamondBackOf(diamond: { readonly kind: string }): { onDiamondBack?: true } {
  return diamond.kind === 'gtile-diamond-empty' ? {} : { onDiamondBack: true };
}

/**
 * Pushes one `if-label` node per `side` in `sides` whose `labelAt` is
 * non-null. `sides` is caller-supplied, in upstream `drawU`'s own order
 * (north, south, west, east), restricted to the sides that diamond can
 * ever set — mirrors `pushDiamond1`'s own `south`/`west`/`east` calls in
 * `walk-if-down.ts`.
 */
export function emitDiamondLabels(
  diamond: DiamondConditionTile,
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
        // add4-T3j: only the while/repeat walkers call this; their slots are
        // `create(fcArrow)` FULL blocks (`FtileWhile.java:123,127-128`,
        // `FtileRepeat.java:127-131`).
        ifLabelRole: 'full',
        ...diamondBackOf(diamond),
      },
      lane,
    );
  }
}

/**
 * `diamond`'s OWN label, pushed as its own `'if-own-label'` node, so it
 * lands between south and west in document order -- `FtileDiamondInside
 * #drawU`'s polygon and own label are two SEPARATE draw calls upstream,
 * never one combined blob (T3k, `FtileDiamondInside.java:84-102`). No-ops
 * on an empty label: the OLD combined push relied on `renderNode`'s own
 * `node.label !== ''` dispatch to skip the text (`renderDiamond`'s
 * unlabelled shape has no text at all); now that the label is its own
 * node, the caller must apply that same guard, which this function does
 * once so `walk-repeat.ts`/`walk-while-branch.ts` do not each repeat it.
 * `box` is the SAME `{x, y, width, height}` the polygon node itself was
 * pushed with (`renderHexagonOwnLabel` centers on that box).
 */
export function emitDiamondOwnLabel(
  diamond: DiamondConditionTile,
  box: { x: number; y: number; width: number; height: number },
  lane: string | undefined,
  out: Out,
): void {
  if (diamond.label === '') return;
  pushNode(out, { id: out.nextId('if-own-label'), kind: 'if-own-label', ...box, label: diamond.label }, lane);
}
