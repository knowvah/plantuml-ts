/**
 * layout-ink-transition.ts — the state engine's TRANSITION ink path, plus
 * the `InkBox` accumulator primitives it and `layout-ink-extent.ts`'s
 * per-shape node adders share.
 *
 * Split out of `layout-ink-extent.ts` (500-line cap; the same reported-split
 * convention `core/spline-clip.ts` and the class engine's own
 * `class-ink-shapes.ts` / `class-ink-box.ts` pair already follow). The
 * primitives live HERE rather than in `layout-ink-extent.ts` so this module
 * can be imported by it without an import cycle — exactly the arrangement
 * `class-ink-shapes.ts` has for the class engine.
 *
 * SI31 T5 (G15) added a composite-anchor spline clip HERE, for the ink fold
 * only. SI32 T2 retired it: the clip now runs once per layout result, at
 * construction, in `state-composite-pass.ts#buildLevelTransitionGeos` and
 * `layout.ts#buildFlatTransitionGeos` (`state-transition-clip.ts`), so
 * `TransitionGeo.points` is ALREADY the trimmed curve by the time this module
 * — or the renderer — sees it. That is upstream's own arrangement:
 * `SvekEdge#solveLine` REASSIGNS `dotPath = dotPath.simulateCompound(...)`
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java
 * :671-672`) inside the edge loop of `DotStringFactory#solve`
 * (`DotStringFactory.java:458-459`), and only afterwards does
 * `GraphvizImageBuilder.java:287-288` build the `SvekResult` whose
 * `calculateDimension` is this ink walk and whose `drawU` draws. Measuring
 * and drawing therefore see the same curve, and this module simply folds the
 * points it is handed.
 */
import type { TransitionGeo } from './state-geo-types.js';
import { transitionArrowheadInk } from './renderer-arrowhead.js';

export interface InkBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function newInkBox(): InkBox {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

export function addPoint(box: InkBox, x: number, y: number): void {
  if (x < box.minX) box.minX = x;
  if (y < box.minY) box.minY = y;
  if (x > box.maxX) box.maxX = x;
  if (y > box.maxY) box.maxY = y;
}

/** One transition's own ink contribution — plain points
 *  (`LimitFinder#drawDotPath`-equivalent: no inset), its label box, and,
 *  gated by `arrowheadInk`, the head-side arrowhead's own ink
 *  (`renderer-arrowhead.ts#transitionArrowheadInk`, `HACK_X_FOR_POLYGON`-
 *  padded internally via its own `LimitFinder` walk). `'always'` (document-
 *  level, pre-existing, unchanged) vs `'self-loop'` (`from===to` only,
 *  composite-level, mission T9) — see `layout-ink-extent.ts`'s module doc
 *  comment's mechanism-7 paragraph for why the latter is scoped, not
 *  unconditional. `transition.points` arrives ALREADY compound-clipped
 *  (`state-transition-clip.ts`, `SvekEdge.java:671-672`) — see this module's
 *  own doc comment. */
export function addTransitionInk(
  box: InkBox,
  transition: TransitionGeo,
  labelInk: boolean,
  arrowheadInk: 'always' | 'self-loop',
): void {
  for (const p of transition.points) addPoint(box, p.x, p.y);
  // G8 T2: fold the label's own BOX at the RETURNED (graphviz) position, not
  // just its anchor POINT -- only when present AND opted in (`labelInk`);
  // `computeStateDocumentDims`/`computeStateInkShift` pass `false` and keep
  // the point-only fold. `transition-label-ink` T3: `TextBlockMarged#drawU`'s
  // own `UEmpty` (`klimt/shape/TextBlockMarged.java:79-87`), so this is
  // `drawEmpty` over `label.inkBox` (`LimitFinder.java:159-162`).
  if (transition.label !== undefined) {
    const ink = transition.label.inkBox;
    if (labelInk && ink !== undefined) {
      addPoint(box, ink.x, ink.y);
      addPoint(box, ink.x + ink.width, ink.y + ink.height);
    } else {
      addPoint(box, transition.label.x, transition.label.y);
    }
  }
  if (arrowheadInk === 'self-loop' && transition.from !== transition.to) return;
  const arrowInk = transitionArrowheadInk(transition);
  if (arrowInk !== undefined) {
    addPoint(box, arrowInk.minX, arrowInk.minY);
    addPoint(box, arrowInk.maxX, arrowInk.maxY);
  }
}
