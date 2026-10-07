/**
 * `shapes-of.ts`'s pure node-box geometry helpers -- split into their own
 * sibling file (mission `activity-divergence-drive-3` T3i) purely to keep
 * `shapes-of.ts` under the 500-line hook cap; no behavior change, a
 * mechanical extraction of four self-contained functions with no
 * dependency on anything else in that file besides `ActivityNodeGeo`.
 */

import type { ActivityNodeGeo } from '../../activity-geometry.types.js';

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
