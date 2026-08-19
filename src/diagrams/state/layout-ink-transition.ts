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
 * SI31 T5 (G15) adds the composite-anchor spline clip. Upstream trims a
 * cluster-sourced or cluster-targeted edge back to the cluster rectangle in
 * Java, not through graphviz: `SvekEdge#solveLine` calls
 *
 *   dotPath = dotPath.simulateCompound(lhead == null ? null : lhead.getRectangleArea(),
 *                                      ltail == null ? null : ltail.getRectangleArea());
 *
 * (`~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/SvekEdge.java
 * :671-672`), where `ltail`/`lhead` are non-null exactly when the edge's own
 * start/end DOT id addresses a cluster instead of a real node
 * (`SvekEdge.java:252-258`: `startUid.startsWith(Cluster.CENTER_ID)` /
 * `endUid.startsWith(Cluster.CENTER_ID)`). That clip happens BEFORE the path
 * is drawn, so `LimitFinder`/`SvekResult#calculateDimension` only ever see
 * the trimmed curve — which is why the in-cluster segment we used to fold
 * inflated `fovafu-44-mifu394`'s composite by exactly the distance from the
 * discarded control point to the cluster frontier (+7.820 px: the oracle's
 * `205.82` maps to `200.820` in the jar's frame, A's right frontier is
 * `193`). See `docs/graphviz-issues/15-cluster-anchor-point-ranked-with-
 * target.md` (the 2026-08-19 reclassification note) for the full derivation
 * and for why graphviz's own `dot_compoundEdges` cannot do this clip for
 * this shape even when asked.
 *
 * This port's `Cluster.CENTER_ID` analogue is `state-composite-classify.ts
 * #zaentId` — `edgeEndpointId` (same file) substitutes `__zaent_<id>` for a
 * `'cluster'`-kind endpoint, so an endpoint id present in
 * {@link buildCompositeAnchorRects}'s map is precisely upstream's non-null
 * `ltail`/`lhead`.
 *
 * Scope note (deliberate, not an oversight): the clip is applied to the
 * spline FOLD only. `transitionArrowheadInk` still reads the raw
 * `transition.points` because the state renderer also still draws the raw
 * path — folding a clipped-derived arrowhead would reserve ink for a marker
 * we do not paint there. Clipping the DRAWN path (upstream clips `dotPath`
 * once, and every downstream extremity in `SvekEdge.java:681-735` reads the
 * clipped path) is a renderer-side follow-on.
 */
import type { StateNodeGeo, TransitionGeo } from './state-geo-types.js';
import { transitionArrowheadInk } from './renderer-arrowhead.js';
import { clipSplineStart, clipSplineEnd, type ClipRect } from '../../core/spline-clip.js';
import { zaentId } from './state-composite-classify.js';

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

/** Recursive half of {@link buildCompositeAnchorRects} — named so the public
 *  entry point stays a one-liner and neither function carries an accumulator
 *  parameter its caller has to understand. */
function collectAnchorRects(nodes: readonly StateNodeGeo[], into: Map<string, ClipRect>): void {
  for (const node of nodes) {
    into.set(zaentId(node.id), {
      x: node.x,
      y: node.y,
      width: node.width,
      height: node.height,
    });
    collectAnchorRects(node.children, into);
  }
}

/**
 * Every node's own rectangle keyed by the anchor id an edge endpoint carries
 * when it addresses that node's CLUSTER (`zaentId`) — this pass's lookup for
 * upstream's `ltail.getRectangleArea()` / `lhead.getRectangleArea()`.
 *
 * Keyed unconditionally rather than only for `'cluster'`-kind nodes: the
 * classification lives in the parse/layout layer, not on `StateNodeGeo`, and
 * a `__zaent_` key can only be hit by an endpoint that `edgeEndpointId`
 * already resolved to a cluster — a leaf endpoint carries its plain id and
 * never matches. Descends into `children` so a nested composite's anchor is
 * found at whatever depth the pass hands us.
 */
export function buildCompositeAnchorRects(
  states: readonly StateNodeGeo[],
): ReadonlyMap<string, ClipRect> {
  const rects = new Map<string, ClipRect>();
  collectAnchorRects(states, rects);
  return rects;
}

/**
 * `DotPath#simulateCompound(head, tail)` applied to one transition's spline
 * — `SvekEdge.java:671-672`. Tail branch first, then head, matching
 * `DotPath.java:424-459` (tail) and `:460-489` (head); both absent is
 * upstream's `head == null && tail == null -> return this` short-circuit.
 * Returns `transition.points` itself (not a copy) when nothing is clipped,
 * so the common case allocates nothing and no caller can mutate geometry the
 * renderer also reads.
 */
function clipTransitionPoints(
  transition: TransitionGeo,
  anchorRects: ReadonlyMap<string, ClipRect>,
): ReadonlyArray<{ x: number; y: number }> {
  const tail = anchorRects.get(transition.from);
  const head = anchorRects.get(transition.to);
  if (tail === undefined && head === undefined) return transition.points;
  let points = transition.points;
  if (tail !== undefined) points = clipSplineStart(points, tail);
  if (head !== undefined) points = clipSplineEnd(points, head);
  return points;
}

/** One transition's own ink contribution — plain points
 *  (`LimitFinder#drawDotPath`-equivalent: no inset), its label box, and,
 *  gated by `arrowheadInk`, the head-side arrowhead's own ink
 *  (`renderer-arrowhead.ts#transitionArrowheadInk`, `HACK_X_FOR_POLYGON`-
 *  padded internally via its own `LimitFinder` walk). `'always'` (document-
 *  level, pre-existing, unchanged) vs `'self-loop'` (`from===to` only,
 *  composite-level, mission T9) — see `layout-ink-extent.ts`'s module doc
 *  comment's mechanism-7 paragraph for why the latter is scoped, not
 *  unconditional. The folded spline is the COMPOUND-CLIPPED one
 *  ({@link clipTransitionPoints}, `SvekEdge.java:671-672`) — see this
 *  module's own doc comment. */
export function addTransitionInk(
  box: InkBox,
  transition: TransitionGeo,
  labelInk: boolean,
  arrowheadInk: 'always' | 'self-loop',
  anchorRects: ReadonlyMap<string, ClipRect>,
): void {
  for (const p of clipTransitionPoints(transition, anchorRects)) addPoint(box, p.x, p.y);
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
