/**
 * Marks/reads the "redraw this node once per swimlane" tag T1p-f ports
 * from `FtileSwitchWithDiamonds#drawU`'s `Mode.BIG_DIAMOND` branch
 * (`net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/
 * FtileSwitchWithDiamonds.java:136-138`): that branch calls
 * `tile.drawU(...)` directly on every case tile, bypassing
 * `UGraphicInterceptorOneSwimlane`'s swimlane gate (`vcompact/
 * UGraphicInterceptorOneSwimlane.java:66-75`, the `instanceof Ftile`
 * branch's `if (contained) tile.drawU(this)`). `Swimlanes
 * #drawWhenSwimlanes` (`Swimlanes.java:328-343`) re-walks the WHOLE tree
 * once per lane (`full.drawU(new UGraphicInterceptorOneSwimlane(ug,
 * swimlane, ...).apply(swimlane.getTranslate())...)`), so a case tile the
 * bypass reaches is redrawn, ungated, in EVERY lane's own pass -- at that
 * pass's own lane translate, regardless of the tile's own swimlane tag.
 *
 * The bypass only has a visible effect when the case tile itself paints
 * (a `TileLeaf`): a composite case's own `drawU` only recursively calls
 * the STILL-gated `ug.draw(child)` on its children, so bypassing its own
 * direct call paints nothing extra -- `walk-switch.ts` only tags nodes
 * for a case that resolves (after unwrapping the single-child
 * `GtileTopDown` our own `tile-layout.ts` always wraps a case body in,
 * even a one-statement body -- see `unwrapSingleChildTopDown`'s own doc)
 * to a leaf. Confirmed against `ruzazu-94-meso880`'s oracle: its
 * multi-statement case (a real composite even after unwrapping) draws
 * its own leaf children once each (gated normally by their OWN tags),
 * while its single-statement sibling case (unwraps to a bare leaf)
 * draws three "Act" boxes total -- one from the composite's own
 * properly-gated child, plus one per lane (2) for the bypassed leaf.
 *
 * Lives outside `activity-geometry.types.ts`/`ActivityNodeGeo` (T1p-f's
 * write-set excludes that file): a string tag set directly on the node
 * object, written by `walk-switch.ts` during the pass-1 walk and read by
 * `swimlane-placement.ts#placeSwimlanes` when building its own final
 * node list -- the same "metadata alongside, not inside, the public
 * shape" pattern `EdgeMeta` already uses for edges.
 */
import type { ActivityNodeGeo } from '../activity-geometry.types.js';

/** Own-property key the tag lives under. Not part of {@link
 *  ActivityNodeGeo}'s declared shape, so every reader/writer here goes
 *  through {@link TaggedNode}. */
const BIG_DIAMOND_DUPLICATE_TAG = '__switchBigDiamondDuplicate';

type TaggedNode = ActivityNodeGeo & { [BIG_DIAMOND_DUPLICATE_TAG]?: true };

/** Called once, synchronously, per node a bypassed leaf case pushes
 *  during the pass-1 walk (`walk-switch.ts`). Mutates `node` in place --
 *  the SAME object `placeSwimlanes` later reads from its own `nodes`
 *  input, per `assign-coordinates-full.ts`'s single shared array. */
export function markBigDiamondDuplicate(node: ActivityNodeGeo): void {
  (node as TaggedNode)[BIG_DIAMOND_DUPLICATE_TAG] = true;
}

export function isBigDiamondDuplicate(node: ActivityNodeGeo): boolean {
  return (node as TaggedNode)[BIG_DIAMOND_DUPLICATE_TAG] === true;
}

/** Strips the tag from a per-lane COPY before it leaves {@link
 *  placeSwimlanes} -- never mutates `node` itself; callers always pass a
 *  freshly spread object. */
export function withoutBigDiamondDuplicateTag(node: ActivityNodeGeo): ActivityNodeGeo {
  const copy: TaggedNode = { ...node };
  delete copy[BIG_DIAMOND_DUPLICATE_TAG];
  return copy;
}
