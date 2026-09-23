/**
 * renderer-arrowhead-ink.ts — `edgeExtremityInk`, split out of `renderer-
 * arrowhead.ts` when cdd-T29 round 2's `scaleK` threading pushed that file
 * back over the 500-line hook cap (pre-authorised split, same precedent as
 * this round's other splits) -- a pure move, re-imported back unchanged.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import { LimitFinder } from '../../core/klimt/drawing/LimitFinder.js';
import type { EdgeGeo } from './layout.js';
import { place } from '../../core/svek/svek-edge-extremity.js';
import { decorName } from './renderer-arrowhead.js';

/**
 * `Math.atan2` from `from` toward `to` -- see `renderer-arrowhead.ts
 * #segmentAngle`'s own doc comment for the full `DotPath` derivation this
 * mirrors; duplicated here (not imported) since that module does not
 * export it, and re-deriving `atan2(dy, dx)` inline would be a worse
 * dependency than one small duplicate.
 */
function segmentAngle(from: Point2D, to: Point2D): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/**
 * G2 N54: the "arrowhead-polygon ink not modeled" gap `layout-ink-extent.ts`'s
 * own file doc comment names (`UPolygon` / `HACK_X_FOR_POLYGON=10`,
 * `LimitFinder#drawUPolygon`, `LimitFinder.ts:172-176`) -- jar-verified at
 * N53 against `janeba-15-duja043`'s `B extends A` extension arrowhead
 * (`minX_raw = -9.0349`, matching the polygon's own raw left edge `0.9651`
 * minus `HACK_X_FOR_POLYGON` to 4 decimal places, see
 * `plans/g2-class-svg/ledger.md` N53 Mechanism 2).
 *
 * Reuses the SAME `place`/`segmentAngle` placement `renderer-arrowhead.ts
 * #buildEdgeArrowheads` already computes for the real draw pass (rather
 * than re-deriving polygon vertex math independently -- a second,
 * divergence-prone port of `ExtremityTriangle`/`ExtremityArrow`/
 * `ExtremityDiamond`'s own geometry), and walks the placed
 * `Extremity#drawU` through a REAL `LimitFinder` -- the exact upstream
 * mechanism (`SvekResult#calculateDimension`'s ink walk IS a `LimitFinder`
 * over `SvekEdge#drawU`'s own extremity draw calls; `layout-ink-extent.ts`'s
 * own header doc comment, point 1). Every decor's SPECIFIC shape gets
 * EXACTLY the ink rule jar's `LimitFinder` dispatch applies to it --
 * `UPolygon` (EXTENDS/ARROW/ARROW_TRIANGLE/AGGREGATION/COMPOSITION):
 * `HACK_X_FOR_POLYGON`-padded x, unpadded y; `UEllipse` (CIRCLE*):
 * unpadded; `URectangle` (SQUARE): the classic `-1`/`+1` inset;
 * `UPath`/`ULine` (PARENTHESIS/CROWFOOT-family/PLUS/NOT_NAVIGABLE/etc): plain
 * bbox -- NOT a one-size-fits-all polygon assumption.
 *
 * `backgroundColor` is passed as a fixed `'none'` dummy: ink geometry
 * never depends on fill color (only the `Back`/`Fore` VISUAL state
 * `LimitFinder#apply` accepts but never folds into its own `addPoint`
 * accumulator).
 */
export interface EdgeExtremityInk {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/** Extremities never draw text (see `renderer-arrowhead.ts
 *  #NO_TEXT_BOUNDER`'s own doc comment) -- this stub is never actually
 *  invoked. */
const INK_STRING_BOUNDER: StringBounder = {
  calculateDimension: () => new XDimension2D(0, 0),
};

/**
 * Returns the union ink extent of `edge`'s tail/head extremity shapes, or
 * `undefined` when neither end carries a decor (a plain `--` association)
 * or the edge has fewer than two points to anchor a placement angle on --
 * mirrors `buildEdgeArrowheads`'s own early-return conditions exactly,
 * since an edge that draws no extremity contributes no extremity ink.
 *
 * Ink is a LAYOUT-time concern (`layout-ink-extent.ts` calls this from the
 * UNSCALED document-dims walk, before `class-scale-geo.ts` ever runs) --
 * unlike `buildEdgeArrowheads`, this function takes no `k` and stays on
 * the raw `edge.points` unconditionally.
 */
export function edgeExtremityInk(edge: EdgeGeo): EdgeExtremityInk | undefined {
  const tailName = decorName(edge.sourceDecor);
  const headName = decorName(edge.targetDecor);
  if (tailName === undefined && headName === undefined) return undefined;
  if (edge.points.length < 2) return undefined;

  const first = edge.points[0]!;
  const second = edge.points[1]!;
  const last = edge.points[edge.points.length - 1]!;
  const secondToLast = edge.points[edge.points.length - 2]!;

  const finder = LimitFinder.create(INK_STRING_BOUNDER, false);
  if (tailName !== undefined) {
    const tailAngle = segmentAngle(first, second) + Math.PI;
    place(tailName, first, tailAngle, 'none').drawable.drawU(finder);
  }
  if (headName !== undefined) {
    const headAngle = segmentAngle(secondToLast, last);
    place(headName, last, headAngle, 'none').drawable.drawU(finder);
  }
  return { minX: finder.getMinX(), minY: finder.getMinY(), maxX: finder.getMaxX(), maxY: finder.getMaxY() };
}
