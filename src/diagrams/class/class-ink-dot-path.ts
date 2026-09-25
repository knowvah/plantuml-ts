/**
 * class-ink-dot-path.ts — the link path `LimitFinder` actually walks. Split
 * out of `class-ink-box.ts` (cdd2-T13, line cap).
 */
import type { EdgeGeo } from './layout.js';
import { applyDecorTrim, buildEdgeArrowheads } from './renderer-arrowhead.js';

/** Extremity ink never depends on paint (`renderer-arrowhead-ink.ts`'s own
 *  `'none'` dummy); only the returned trims are read here. */
const NO_PAINT = 'none';

/**
 * cdd2-T13 (Q-6): the DRAWN `DotPath` of `e` — `EdgeGeo.points` after the
 * extremity move. `SvekEdge#getExtremitySimplier` (`svek/SvekEdge.java
 * :539-562`) mutates `this.dotPath` in place with `moveStartPoint`/
 * `moveEndPoint(translateForKal.compose(decorTrim))`, which moves the end
 * point AND its neighbouring control point (`klimt/shape/DotPath.java
 * :206-216,229-234`), before `SvekEdge#drawU` draws that same path. The
 * canvas walk is a `LimitFinder` over that `drawU`, and
 * `LimitFinder#drawDotPath` (`klimt/drawing/LimitFinder.java:190-194`) takes
 * the min/max over every bezier end AND control point
 * (`DotPath.java:247-256`) — so the moved control point, not the
 * pre-move one, is the ink. `nenepe-70-keri784`: the head's control point
 * moves 106.724 -> 111.724 with the 5px arrow trim, and is the rightmost
 * ink; walking the pre-move list made our canvas 3px narrow.
 *
 * The trims are the renderer's own (`renderer-edge.ts#renderEdge` feeds the
 * same `buildEdgeArrowheads` result to the same `applyDecorTrim`), so the
 * walked path and the drawn path cannot drift apart. Unscaled (`k` = 1):
 * the ink walk runs before `class-scale-geo.ts`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java
 */
export function drawnEdgePoints(e: EdgeGeo): EdgeGeo['points'] {
  const arrowheads = buildEdgeArrowheads(e, NO_PAINT, NO_PAINT);
  return applyDecorTrim(e.points, arrowheads.tailTrim, arrowheads.headTrim);
}
