/**
 * The json block's own width/height -- `JsonDiagram#calculateDimension`.
 *
 * The jar does NOT size a json block from its node extents — it ink-walks
 * the whole drawing. Reproduced here, because a flat "+2 versus the node
 * extent" is what this looks like from the outside and it encodes nothing:
 *
 *   `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`)
 *     → `TextBlockUtils.getMinMax(this, sb, true)` → a `LimitFinder` walk
 *     → `MinMax#getDimension` = `maxX - minX` (`MinMax.java:151-153`)
 *
 * jff-T2b: the margin (`TextBlockExporter#calculateFinalDimension`, `:198-203`)
 * and `SvgGraphics#ensureVisible`'s `+1` (`SvgGraphics.java:129-135`) are the
 * exporter's, added after the chrome by core's `exportTo`
 * (`TextBlockExporter.java:159-177`), so they are no longer folded in here.
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

/** `JsonCurve#drawSpot` — `new UEllipse(6, 6)` drawn at `-3, -3`. */
const SPOT_RADIUS = 3;

/** `JsonDiagram#calculateDimension` (`JsonDiagram.java:130-137`): the ink extent, float. */
export interface DocumentDimensions {
  width: number;
  height: number;
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
  const head = buildArrowHeadPath(edge.points, edge.ep);
  const nums = head === '' ? [] : head.split(' ').filter((t) => t !== '' && !Number.isNaN(Number(t)));
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push({ x: Number(nums[i]), y: Number(nums[i + 1]) });
  }
  return points;
}

/**
 * The block's ink extent. A walk that met no ink is an empty `MinMax`, whose
 * extent this port reads as 0 x 0.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/jsondiagram/JsonDiagram.java:130-137
 */
export function documentDimensions(nodes: readonly JsonNodeGeo[], edges: readonly JsonEdgeGeo[]): DocumentDimensions {
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
  if (inkX.length === 0) return { width: 0, height: 0 };
  // `MinMax#getDimension` is `maxX - minX` (`MinMax.java:151-153`) — an
  // EXTENT, so the minimum matters as much as the maximum.
  return {
    width: Math.max(...inkX) - Math.min(...inkX),
    height: Math.max(...inkY) - Math.min(...inkY),
  };
}
