/**
 * `shapes-of.ts`'s pure node-box geometry helpers -- split into their own
 * sibling file (mission `activity-divergence-drive-3` T3i) purely to keep
 * `shapes-of.ts` under the 500-line hook cap; no behavior change, a
 * mechanical extraction of four self-contained functions with no
 * dependency on anything else in that file besides `ActivityNodeGeo`.
 */

import type { ActivityNodeGeo } from '../../activity-geometry.types.js';
import { activityPadding } from '../../activity-style-defaults.js';
import { boxStyleName, boxStyleOutlineX, boxStyleShield } from '../../tiles/gtile-action.js';

/**
 * `FtileIfHexagon`/`GtileHexagonInside`'s drawn extents when a condition
 * label IS present (`activity-renderer-shapes.ts#renderHexagon`: a
 * `<polygon>` spanning the node's own box, `[x, x+w] x [y, y+h]`).
 */
export function hexagonBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  return { x: node.x, y: node.y, width: node.width, height: node.height };
}

/**
 * `renderDiamond`'s rhombus (`size = node.width / 2`): x spans `[x, x+w]`.
 * On y it sits at the box BOTTOM, not its centre: `FtileDiamond#drawU`
 * translates by the north label's height before drawing the polygon --
 * `final double suppY1 = north.calculateDimension(...).getHeight(); ug =
 * ug.apply(UTranslate.dy(suppY1));` (`FtileDiamond.java:87-89`) -- so it
 * spans `[y + h - 2*size, y + h]`, the same `cy` the renderer uses.
 */
export function diamondBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  const size = node.width / 2;
  const cy = node.y + node.height - size;
  return { x: node.x, y: cy - size, width: node.width, height: size * 2 };
}

/**
 * `if-split`/`while-header` render a hexagon ONLY when labelled
 * (`activity-renderer-shapes.ts#renderNode`'s own `node.label !== undefined
 * && node.label !== '' ? renderHexagon(...) : renderDiamond(...)`);
 * `repeat-cond` always renders a hexagon.
 */
export function conditionBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  if (node.kind === 'repeat-cond') return hexagonBox(node);
  return node.label !== undefined && node.label !== '' ? hexagonBox(node) : diamondBox(node);
}

/**
 * `renderNote`'s Opale balloon path: the box extended to include the
 * spike tip on whichever side the note sits (`activity-renderer-shapes.ts
 * #renderNote`'s `bodyPath` -- both the left- and right-spike cases route
 * through `spike.x`/`spike.y`, so the drawn extents are the box union the
 * spike point).
 */
export function noteBox(node: ActivityNodeGeo): { x: number; y: number; width: number; height: number } {
  const spike = node.spikeTip;
  if (spike === undefined) return { x: node.x, y: node.y, width: node.width, height: node.height };
  const minX = Math.min(node.x, spike.x);
  const maxX = Math.max(node.x + node.width, spike.x);
  const minY = Math.min(node.y, spike.y);
  const maxY = Math.max(node.y + node.height, spike.y);
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY };
}

/**
 * add4-T3e: a `BoxStyle`d action draws its `drawMe` outline (`FtileBox.java
 * :222`) instead of the rect, and `SlotFinder` occupies a `UPolygon`/`UPath`
 * by its points' min/max (`SlotFinder.java:113-118,147-155`) plus each
 * `UText` line (`:127-135`, LEFT-aligned at `padding`). On X that is the
 * union of {@link boxStyleOutlineX} and the text's `[padding, width -
 * shield - padding]`; on Y the outline spans the box (timeEvent's text
 * keeps its top band occupied). `undefined` for PLAIN and the rect-drawn
 * styles, whose ink is the node box.
 */
export function boxStyleBox(
  node: ActivityNodeGeo,
): { x: number; y: number; width: number; height: number } | undefined {
  if (node.kind !== 'action') return undefined;
  const style = boxStyleName(node.stereotype);
  if (style === undefined) return undefined;
  const outline = boxStyleOutlineX(style, node.width, node.height);
  const pad = activityPadding('activity');
  const minX = Math.min(outline.minX, pad);
  const maxX = Math.max(outline.maxX, node.width - boxStyleShield(style) - pad);
  return { x: node.x + minX, y: node.y, width: maxX - minX, height: node.height };
}
