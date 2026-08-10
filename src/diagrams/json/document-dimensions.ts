/**
 * The json document's own width/height.
 *
 * The jar does NOT size a json document from its node extents — it ink-walks
 * the whole drawing, adds the margins, and truncates. Reproduced here in that
 * order, because a flat "+2 versus the node extent" is what this looks like
 * from the outside and it encodes nothing:
 *
 *   `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`)
 *     → `TextBlockUtils.getMinMax(this, sb, true)` → a `LimitFinder` walk
 *   `TextBlockExporter#calculateFinalDimension` (`:199-203`)
 *     → `+ margin.left + margin.right`, `TitledDiagram#getDefaultMargins()`
 *       = `same(10)` (`TitledDiagram.java:275-277`)
 *   `SvgGraphics#ensureVisible` → {@link ENSURE_VISIBLE_BUMP}
 *
 * Split out of `layout.ts` when the edge walk below pushed that file past this
 * repo's 500-line cap; document sizing is a coherent unit of its own.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/drawing/LimitFinder.java
 */

import { veryFirstPoint, buildArrowHeadPath } from './JsonCurve.js';
import type { JsonNodeGeo, JsonEdgeGeo } from './layout.js';

/**
 * `LimitFinder#drawRectangle` records a rectangle's ink as
 * `addPoint(x - 1, y - 1)` … `addPoint(x + w - 1, y + h - 1)`
 * (`LimitFinder.java:184-188`) — so a rect contributes its top-left corner
 * MINUS ONE to the minimum.
 */
const INK_MIN_CORNER = -1;

/**
 * `SvgGraphics#ensureVisible` stores `maxX = (int)(x + 1)`
 * (`SvgGraphics.java:129-134`), and `maxX`/`maxY` ARE the emitted
 * `width`/`height`/`viewBox` (`:799-811`). The truncation is applied by
 * `klimt/document-shell.ts#assembleDocumentShell`, which already `Math.trunc`s
 * these values; only the `+1` belongs here.
 */
export const ENSURE_VISIBLE_BUMP = 1;

/** `JsonCurve#drawSpot` — `new UEllipse(6, 6)` drawn at `-3, -3`. */
const SPOT_RADIUS = 3;

interface Margin {
  left: number;
  top: number;
  x: number;
  y: number;
}

export interface DocumentDimensions {
  /** The emitted `width`/`height`/`viewBox` — post-`ensureVisible`. */
  width: number;
  height: number;
  /** `calculateFinalDimension()` — pre-`ensureVisible`, what `scale` divides by. */
  finalWidth: number;
  finalHeight: number;
}

/**
 * Every point an EDGE contributes to the ink walk: its spot, its spline, and
 * its arrowhead.
 *
 * This is the part `layout.ts` used to omit, on the stated assumption that
 * "on every measured fixture the rightmost/bottommost ink IS a node edge,
 * because json edges run BETWEEN nodes". True of the right and bottom; false
 * of the LEFT. `JsonCurve#getVeryFirst` places the spot `VERY_FIRST_LINE` (13)
 * back from the spline start, so when the parent node sits at the left margin
 * the spot lands OUTSIDE it — on `yaml/vapoda-87-piku740` the spot's circle
 * reaches x=0 against a leftmost node rect at x=5, and the jar's document is
 * 4px wider than this port's for exactly that reason.
 */
function edgeInkPoints(edge: JsonEdgeGeo): Array<{ x: number; y: number }> {
  const points: Array<{ x: number; y: number }> = [...edge.points];
  const spot = veryFirstPoint(edge.points);
  if (spot !== undefined) {
    points.push(
      { x: spot.x - SPOT_RADIUS, y: spot.y - SPOT_RADIUS },
      { x: spot.x + SPOT_RADIUS, y: spot.y + SPOT_RADIUS },
    );
  }
  // The arrowhead is a filled path, not a node edge; its tip can overhang.
  const head = buildArrowHeadPath(edge.points);
  const nums = head === '' ? [] : head.split(' ').filter((t) => t !== '' && !Number.isNaN(Number(t)));
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push({ x: Number(nums[i]), y: Number(nums[i + 1]) });
  }
  return points;
}

/** A diagram with nothing drawn still gets its margins. */
function zeroDimensions(margin: Margin): DocumentDimensions {
  return {
    width: margin.x + ENSURE_VISIBLE_BUMP,
    height: margin.y + ENSURE_VISIBLE_BUMP,
    finalWidth: margin.x,
    finalHeight: margin.y,
  };
}

export function documentDimensions(
  nodes: readonly JsonNodeGeo[],
  edges: readonly JsonEdgeGeo[],
  margin: Margin,
): DocumentDimensions {
  const inkX: number[] = [];
  const inkY: number[] = [];
  for (const n of nodes) {
    inkX.push(n.x + INK_MIN_CORNER, n.x + n.width);
    inkY.push(n.y + INK_MIN_CORNER, n.y + n.height);
  }
  for (const e of edges) {
    for (const p of edgeInkPoints(e)) {
      inkX.push(p.x);
      inkY.push(p.y);
    }
  }
  if (inkX.length === 0) return zeroDimensions(margin);
  // `MinMax#getDimension` is `maxX - minX` (`MinMax.java:151-153`) — an
  // EXTENT, so the minimum matters as much as the maximum.
  const finalWidth = Math.max(...inkX) - Math.min(...inkX) + margin.x;
  const finalHeight = Math.max(...inkY) - Math.min(...inkY) + margin.y;
  return {
    width: finalWidth + ENSURE_VISIBLE_BUMP,
    height: finalHeight + ENSURE_VISIBLE_BUMP,
    finalWidth,
    finalHeight,
  };
}
