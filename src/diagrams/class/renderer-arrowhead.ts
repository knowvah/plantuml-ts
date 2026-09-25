/**
 * renderer-arrowhead.ts — mission G2 N1, mechanism 2 ("SVG root shell"),
 * part C: replaces `class/renderer.ts`'s SVG-`<marker>`-reference
 * arrowheads (`arrowHeadRef` + `markerEnd`/`markerStart`) with the SAME
 * inline-polygon extremity shapes the description engine already draws
 * (`core/svek/extremity/*`, `SvekEdge.ts`) — jar's class-diagram corpus
 * contains ZERO `<marker>`/`markerEnd` (grep-verified,
 * `plans/g2-class-svg/ledger.md` N0 mechanism 2), exactly like
 * description's.
 *
 * Deliberately NOT a full `SvekEdge` adoption (`core/svek/SvekEdge.ts`):
 * that class also emits a `<g class="link" data-entity-1="..."
 * data-link-type="...">` group wrapper keyed by per-entity `ent%04d` uids
 * this port's class engine does not assign yet (classifiers/namespaces
 * have no uid plan — that is the N2 "geometry family" scope the ledger
 * defers, entity/cluster group-wrapping fidelity). This module draws ONLY
 * the extremity shape (`Extremity#drawU`) via a throwaway `UGraphicSvg`
 * document, extracting its markup with the SAME `core/klimt/
 * document-shell.ts` helpers `description/renderer.ts#unwrapKlimtSvg`
 * uses — reusing the byte-verified extremity machinery (G1 I9) without
 * adopting SvekEdge's group/uid concerns this iteration does not own.
 *
 * Placement math mirrors `SvekEdge`'s constructor (`SvekEdge.ts`) and its
 * underlying `DotPath#getStartAngle`/`getEndAngle` formula exactly
 * (`atan2` between the endpoint and its adjacent control point — see
 * `endpointAnchor` below) WITHOUT going through `buildDotPathFromSplinePoints`
 * itself: that helper throws on anything but a well-formed `1 + 3*n`
 * bezier-spline point list, and `EdgeGeo.points` is not always that shape
 * (a straight 2-point edge is a legitimate, existing input this module
 * must handle, not a "cannot happen" state — see `renderer.test.ts`'s
 * `makeEdgeGeo` helper). For a genuine `1 + 3*n` spline this produces the
 * IDENTICAL point/angle `DotPath` would (points[1]/points[n-2] ARE that
 * spline's first/last control points), so no conformance is lost for the
 * real-DOT-layout case; for any other point count it degrades gracefully
 * to a straight-line secant instead of throwing. The extremity is placed
 * at the RAW (untrimmed) first/last point, tail side negated by
 * `Math.PI` — the path itself is left untouched (`class/
 * renderer.ts#buildPathData`'s straight-line `d` construction is a
 * separate, N2-deferred geometry concern).
 *
 * @see plans/g2-class-svg/ledger.md (N1, mechanism 2 part B doc)
 */

import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { Paint } from '../../core/paint.js';
import type { UDrawable } from '../../core/klimt/shape/UDrawable.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UEllipse } from '../../core/klimt/shape/UEllipse.js';
import { place } from '../../core/svek/svek-edge-extremity.js';
import type { LinkDecorName } from '../../core/svek/extremity/link-decor.js';
import { extractFlatContent } from '../../core/klimt/document-shell.js';
import { buildDotPathFromSplinePoints } from '../../core/svek/svek-edge-geometry.js';
import type { LinkDecor } from './ast.js';
import type { MiddleDecor } from './class-arrow-middle-decor.js';
import type { EdgeGeo } from './layout.js';
import { kalEndTranslate, movePointsEnd, movePointsStart, plus } from './renderer-arrowhead-move.js';

/** `class/ast.ts#LinkDecor` -> `core/svek/extremity/link-decor.ts
 *  #LinkDecorName` — class's own decor union is already RESOLVED (parsed
 *  from the arrow token at parse time, `class-relationship-parser`-ish
 *  logic upstream of this module), unlike `SvekEdgeInput.tailDecor`/
 *  `.headDecor` (raw matched-substring tokens `lookupDecors1`/
 *  `lookupDecors2` resolve) — so this is a direct name-to-name mapping,
 *  not a token table. Every class decor kind maps 1:1 onto a
 *  `LinkDecorName` whose `buildExtremityFactory` entry ignores its
 *  `backgroundColor` param for most kinds (EXTENDS/ARROW/AGGREGATION/
 *  COMPOSITION/PARENTHESIS/CROWFOOT/CIRCLE_LINE/DOUBLE_LINE/LINE_CROWFOOT
 *  all construct their factory without reading it; SQUARE/PLUS DO read it —
 *  `link-decor.ts`'s own `BUILDERS` table), so the exact `Paint` passed as
 *  `backgroundColor` below is threaded through unconditionally for
 *  correctness against every kind this map produces.
 *
 *  G2 N28: widened past the original 4-entry D6 subset (triangle/open/
 *  diamond/filledDiamond) to cover the remaining `class/ast.ts#LinkDecor`
 *  members `headToDecor` (`class-arrow-grammar.ts`) now produces —
 *  square/plus/parenthesis/crowfoot/circleCrowfoot/circleLine/doubleLine/
 *  lineCrowfoot, each a 1:1 name match onto the already-built
 *  `LinkDecorName` of the same shape family. */
const DECOR_TO_NAME: Record<Exclude<LinkDecor, 'none'>, LinkDecorName> = {
  triangle: 'EXTENDS',
  open: 'ARROW',
  diamond: 'AGGREGATION',
  filledDiamond: 'COMPOSITION',
  square: 'SQUARE',
  plus: 'PLUS',
  parenthesis: 'PARENTHESIS',
  crowfoot: 'CROWFOOT',
  circleCrowfoot: 'CIRCLE_CROWFOOT',
  circleLine: 'CIRCLE_LINE',
  doubleLine: 'DOUBLE_LINE',
  lineCrowfoot: 'LINE_CROWFOOT',
  notNavigable: 'NOT_NAVIGABLE', // G2 N47
  // T5/M6: mechanical exhaustiveness completion for the two `LinkDecor`
  // members that mission added (`class-arrow-decor-map.ts`'s own doc
  // comment) -- both extremity shapes were already built
  // (`core/svek/extremity/link-decor.ts#BUILDERS.REDEFINES/.DEFINEDBY`),
  // this file's own dispatch just needed the two new decor names named.
  redefines: 'REDEFINES',
  definedBy: 'DEFINEDBY',
};

export function decorName(decor: LinkDecor): LinkDecorName | undefined {
  return decor === 'none' ? undefined : DECOR_TO_NAME[decor];
}

/** Extremities never draw text (every reachable class decor kind is a
 *  pure shape — triangle/arrow/diamond), so this `StringBounder` is never
 *  actually invoked; it exists only to satisfy `UGraphicSvg.build`'s
 *  required 4th parameter. */
const NO_TEXT_BOUNDER = { calculateDimension: (): { width: number } => ({ width: 0 }) };

/** Draws one placed extremity via a throwaway klimt document, matching
 *  `SvekEdge#drawExtremity`'s draw-context construction exactly: `Fore`
 *  (outline/stroke color) then a thickness-only `solid` stroke (extremity
 *  outlines are never dashed, regardless of the edge's own line style —
 *  `SvekEdge.ts`'s own `stroke.onlyThickness()` call) then `Back` (fill —
 *  the edge color for a filled decor, `'none'` for a hollow one). */
/**
 * cdd-T29 R2 (D4/journal row 175): `strokeWidth`/the drawable's OWN local
 * shape geometry (baked into `drawable` by `place()`'s `factory
 * .createUDrawable(point, angle, null)` call, in the SAME UNSCALED
 * coordinate space as `point`) are scaled by setting `SvgOption.scale = k`
 * on this throwaway klimt document -- `basicSvgOption`'s own already-
 * faithful `format()`/`finalizeRootAttributes` (`scale-command.ts`'s
 * module doc, jar-verified against `component/saveje-35-vumu271`)
 * multiplies EVERY emitted numeral by it, matching `SvgGraphics#format`
 * (`SvgGraphics.java:466-472`) exactly. The caller MUST pass an UNSCALED
 * `point`/`strokeWidth` here (never the already-scaled `EdgeGeo.points`/
 * `.strokeWidth` this file's OTHER caller, `renderer-edge.ts`, uses for
 * its own `<path>` -- see `buildEdgeArrowheads`'s own doc comment) or the
 * position/stroke would scale TWICE.
 */
function drawExtremityMarkup(
  drawable: UDrawable,
  isFill: boolean,
  color: Paint,
  strokeWidth: number,
  k: number,
): { body: string; extraDefs: string } {
  const ug = UGraphicSvg.build(0, basicSvgOption({ scale: k }), '$version$', NO_TEXT_BOUNDER);
  // G2 N31: `edge.strokeWidth` (`class-geo-builders.ts#buildStrokeOverride`,
  // already the resolved `-[thickness=N]->`/`bold` thickness -- N26) was
  // never read here; every extremity drew at a hardcoded thickness 1
  // regardless of the edge's own override, unlike `SvekEdge.ts#drawU`'s
  // real `stroke.onlyThickness()` (the SAME override, description-side).
  const thicknessOnlyStroke = UStroke.withThickness(strokeWidth);
  const context = ug
    .apply(new Fore(color))
    .apply(thicknessOnlyStroke)
    .apply(new Back(isFill ? color : 'none'));
  drawable.drawU(context);
  return extractFlatContent(ug.getSvgString());
}

export interface EdgeArrowheads {
  /** Tail-side (near `edge.points[0]`) extremity markup, or `''` if
   *  `edge.sourceDecor === 'none'`. */
  readonly tail: string;
  /** Head-side (near the last point) extremity markup, or `''` if
   *  `edge.targetDecor === 'none'`. */
  readonly head: string;
  /** Any `<defs>` payload either extremity emitted (gradients, etc.) —
   *  empty for every reachable class decor kind today (all four are
   *  plain-color shapes), carried through for correctness against future
   *  decor kinds/gradient themes. */
  readonly extraDefs: string;
  /**
   * G2 N28: the tail extremity's `SvekEdge#drawU` `dotPath.moveStartPoint
   * (trim.x, trim.y)` displacement (`svek-edge-extremity.ts#place`'s own
   * `PlacedExtremity.trim`) — `undefined` when the tail carries no decor.
   * Never applied by this module itself (it only draws the shape at the
   * RAW, untrimmed anchor point, matching jar's own extremity placement);
   * the caller (`renderer.ts#renderEdge`) applies it to the CONNECTING
   * PATH's endpoint via {@link applyDecorTrim} so the line stops at the
   * marker's outer edge instead of running underneath it — jar-verified
   * necessary against `zerofa-77-caro506` (a `SQUARE` decor whose `<rect>`
   * position already matched untrimmed, but whose connecting `<path>`
   * needed exactly this shift to reach zero-diff on that family).
   */
  readonly tailTrim?: Point2D;
  /** Head-side counterpart of {@link tailTrim} — `undefined` when the head
   *  carries no decor. cdd2-T12: both trims include their end's Kal
   *  translate (`translateForKal.compose(...)`, `SvekEdge.java:558-561`). */
  readonly headTrim?: Point2D;
}

const EMPTY_ARROWHEADS: EdgeArrowheads = { tail: '', head: '', extraDefs: '' };

/**
 * `Math.atan2` from `from` toward `to` — the direction of travel along
 * that segment. Matches `DotPath#getStartAngle`/`getEndAngle`'s own
 * `atan2(dy, dx)` formula exactly (see this module's header doc comment):
 * `DotPath.getEndAngle()` is `atan2(last - secondToLast)`, i.e.
 * `segmentAngle(secondToLast, last)`; `DotPath.getStartAngle()` is
 * `atan2(cp1 - start)`, i.e. `segmentAngle(first, second)`.
 */
function segmentAngle(from: Point2D, to: Point2D): number {
  return Math.atan2(to.y - from.y, to.x - from.x);
}

/** Shared draw inputs for both the tail and head extremity -- bundled to
 *  stay inside this project's per-function param-count cap (mirrors
 *  `class-body-enhanced-layout.ts#EnhancedLayoutCtx`'s identical
 *  rationale). `k` defaults to 1 so every pre-existing caller (this file's
 *  own unit tests) is unaffected; `renderer-edge.ts` passes the diagram's
 *  real resolved factor (cdd-T29 R2, D4/journal row 175). */
interface ExtremityDrawCtx {
  readonly color: Paint;
  readonly backgroundColor: Paint;
  readonly strokeWidth: number;
  readonly k: number;
}

/** One end's placed+drawn extremity -- split out of {@link buildEdgeArrowheads}
 *  purely to keep that function's own NLOC under this project's cap; shared
 *  by both the tail and head branches (identical work, different point/
 *  angle/decor-name inputs). See `drawExtremityMarkup`'s own doc comment for
 *  why `point`/`ctx.strokeWidth` are unscaled here and `ctx.k` is threaded
 *  through instead, and `buildEdgeArrowheads`'s own doc comment for the
 *  trim rescale. */
function placeAndDrawExtremity(
  name: LinkDecorName,
  point: Point2D,
  angle: number,
  ctx: ExtremityDrawCtx,
): { body: string; extraDefs: string; trim: Point2D } {
  const { color, backgroundColor, strokeWidth, k } = ctx;
  const placed = place(name, { x: point.x / k, y: point.y / k }, angle, backgroundColor);
  const drawn = drawExtremityMarkup(placed.drawable, placed.isFill, color, strokeWidth, k);
  return { ...drawn, trim: { x: placed.trim.x * k, y: placed.trim.y * k } };
}

/** The tail-side extremity (faces AWAY from the edge, back toward where it
 *  came from -- the travel direction leaving the start point, reversed by
 *  PI, matching `SvekEdge`'s `dotPath.getStartAngle() + Math.PI`) -- split
 *  out of {@link buildEdgeArrowheads} alongside {@link drawHeadExtremity}
 *  purely to keep that function's own NLOC under this project's cap. */
function drawTailExtremity(
  name: LinkDecorName | undefined,
  first: Point2D,
  second: Point2D,
  ctx: ExtremityDrawCtx,
): { body: string; extraDefs: string; trim: Point2D | undefined } {
  if (name === undefined) return { body: '', extraDefs: '', trim: undefined };
  const tailAngle = segmentAngle(first, second) + Math.PI;
  return placeAndDrawExtremity(name, first, tailAngle, ctx);
}

/** The head-side extremity (faces FORWARD, continuing the edge's own
 *  direction of travel as it arrives at the end point, NOT reversed --
 *  matching `SvekEdge`'s un-negated `dotPath.getEndAngle()`) -- see
 *  {@link drawTailExtremity}'s own doc comment for the split rationale. */
function drawHeadExtremity(
  name: LinkDecorName | undefined,
  secondToLast: Point2D,
  last: Point2D,
  ctx: ExtremityDrawCtx,
): { body: string; extraDefs: string; trim: Point2D | undefined } {
  if (name === undefined) return { body: '', extraDefs: '', trim: undefined };
  const headAngle = segmentAngle(secondToLast, last);
  return placeAndDrawExtremity(name, last, headAngle, ctx);
}

/**
 * Builds the inline-polygon/path markup for one edge's tail and head
 * extremities — the replacement for `class/renderer.ts`'s old
 * `targetMarker`/`sourceMarker` (`url(#...)` marker-ref) functions.
 * Returns {@link EMPTY_ARROWHEADS} when the edge has fewer than two
 * points to anchor a direction on, or neither end carries a decor (a
 * plain `--` association).
 */
/** Optional trailing knobs -- bundled to stay inside this project's
 *  per-function param-count cap (same rationale as {@link ExtremityDrawCtx}).
 *  - `resolvedStrokeWidth`: B7/M8's ALREADY-RESOLVED stroke width, passed in
 *    rather than re-derived. Upstream draws the connecting line and its
 *    extremities from one `styleLine.getStroke()` (`SvekEdge.java:874-876`),
 *    so the two must agree by construction; `edge.strokeWidth ?? 1` alone
 *    misses a width that came from the link's own `<<tag>>` style class.
 *    Absent -> the pre-B7 default (`edge.strokeWidth ?? 1`). Same coordinate
 *    space as `edge.points` -- ALREADY scaled by `k` (unscaled before the
 *    klimt sub-draw, `placeAndDrawExtremity`'s doc comment).
 *  - `k`: cdd-T29 R2 (D4/journal row 175), defaults to 1 so every
 *    pre-existing caller (this file's own unit tests) is unaffected;
 *    `renderer-edge.ts` passes the diagram's real resolved factor.
 */
export interface EdgeArrowheadOptions {
  readonly resolvedStrokeWidth?: number;
  readonly k?: number;
}

/**
 * Builds the inline-polygon/path markup for one edge's tail and head
 * extremities — the replacement for `class/renderer.ts`'s old
 * `targetMarker`/`sourceMarker` (`url(#...)` marker-ref) functions.
 * Returns {@link EMPTY_ARROWHEADS} when the edge has fewer than two
 * points to anchor a direction on, or neither end carries a decor (a
 * plain `--` association).
 */
export function buildEdgeArrowheads(
  edge: EdgeGeo,
  color: Paint,
  backgroundColor: Paint,
  options: EdgeArrowheadOptions = {},
): EdgeArrowheads {
  const tailName = decorName(edge.sourceDecor);
  const headName = decorName(edge.targetDecor);
  if (tailName === undefined && headName === undefined) return EMPTY_ARROWHEADS;
  if (edge.points.length < 2) return EMPTY_ARROWHEADS;

  const k = options.k ?? 1;
  const ctx: ExtremityDrawCtx = {
    color,
    backgroundColor,
    strokeWidth: (options.resolvedStrokeWidth ?? edge.strokeWidth ?? 1) / k,
    k,
  };
  // cdd2-T12 (Q-2): `getExtremitySimplier` (`SvekEdge.java:548-561`)
  // translates the decoration's centre by `kal.getTranslateForDecoration()`
  // and moves the path by `translateForKal.compose(decorTrim)` -- the angle
  // stays the PRE-move one, so both points of the angle pair shift together.
  const tk = kalEndTranslate(edge, 'start');
  const hk = kalEndTranslate(edge, 'end');
  const last = edge.points.length - 1;
  const tail = drawTailExtremity(tailName, plus(edge.points[0]!, tk), plus(edge.points[1]!, tk), ctx);
  const head = drawHeadExtremity(headName, plus(edge.points[last - 1]!, hk), plus(edge.points[last]!, hk), ctx);

  return {
    tail: tail.body,
    head: head.body,
    extraDefs: tail.extraDefs + head.extraDefs,
    ...(tail.trim !== undefined ? { tailTrim: plus(tail.trim, tk) } : {}),
    ...(head.trim !== undefined ? { headTrim: plus(head.trim, hk) } : {}),
  };
}

/**
 * Shortens `points` so the connecting `<path>` stops at the outer edge of
 * a drawn extremity instead of running underneath it -- the RENDER-side
 * counterpart of `SvekEdge#getExtremitySimplier`'s `dotPath.moveStartPoint`/
 * `.moveEndPoint` (`SvekEdge.java:558-561`), applied to the flat
 * `EdgeGeo.points` list `class/renderer.ts#buildPathData` consumes.
 *
 * cdd2-T12: `tailTrim`/`headTrim` are the WHOLE upstream move
 * (`translateForKal.compose(decorTrim)`, see {@link buildEdgeArrowheads}),
 * and the move is `DotPath#moveStartPoint`/`#moveEndPoint` whole
 * (`renderer-arrowhead-move.ts`) -- including `DotPath.java:206-211`'s
 * first-bezier removal branch, which `rezoba-58-xaze387`, `jojime-80-savu279`
 * and `lojiga-09-meka859` reach (CLIP-1b). Start first, then end, as
 * `SvekEdge.java:680-685` builds `extremity1` before `extremity2`.
 */
export function applyDecorTrim(
  points: EdgeGeo['points'],
  tailTrim: Point2D | undefined,
  headTrim: Point2D | undefined,
): EdgeGeo['points'] {
  if (tailTrim === undefined && headTrim === undefined) return points;
  if (points.length < 2) return points;
  let out: EdgeGeo['points'] = points;
  if (tailTrim !== undefined) out = movePointsStart(out, tailTrim.x, tailTrim.y);
  if (headTrim !== undefined) out = movePointsEnd(out, headTrim.x, headTrim.y);
  return out;
}

export { movePointsStart, movePointsEnd, kalEndTranslate } from './renderer-arrowhead-move.js';

// cdd-T29 R2: `EdgeExtremityInk`/`edgeExtremityInk` moved to `renderer-
// arrowhead-ink.ts` when this file's `scaleK` threading pushed it back
// over the 500-line hook cap (pre-authorised split) -- a pure move,
// re-exported so no consumer's import path changed.
export type { EdgeExtremityInk } from './renderer-arrowhead-ink.js';
export { edgeExtremityInk } from './renderer-arrowhead-ink.js';

// ---------------------------------------------------------------------------
// cdd-T7 (A5/M4, A2a/M6): mid-link decoration (`-0)-` etc.)
// ---------------------------------------------------------------------------

/** `MiddleCircle`/`MiddleCircleCircled`'s two hardcoded radii (both
 *  Java classes: `radius1 = 6`, `radius2 = 10`) -- NOT derived from any
 *  edge/theme value, matching upstream's own literals. */
const MIDDLE_RADIUS_INNER = 6;
const MIDDLE_RADIUS_OUTER = 10;
/** `MiddleCircle`/`MiddleCircleCircled#drawU`'s own `UStroke.withThickness
 *  (1.5)` -- a fixed value, independent of the edge's own resolved stroke
 *  width (unlike the head/tail extremities' `resolvedStrokeWidth`). */
const MIDDLE_STROKE_WIDTH = 1.5;

/**
 * `MiddleCircleCircled#drawU`/`MiddleCircle#drawU` — the arc(s) (for the
 * three `CIRCLE_CIRCLED*` members) plus the always-drawn filled inner
 * circle, all centred on {@link DotPath.getMiddle}'s own point.
 *
 * `angle` here is upstream's OWN already-transformed value (`angleDeg - 45`,
 * `SvekEdge.java:984-987` -- see {@link buildMiddleDecorMarkup}'s doc
 * comment for the `angleRad -> angleDeg -> -45` derivation), fed straight
 * into `UEllipse`'s own `start` parameter exactly as upstream does.
 *
 * @see ~/git/plantuml/.../svek/extremity/MiddleCircleCircled.java
 * @see ~/git/plantuml/.../svek/extremity/MiddleCircle.java
 */
/** Shared draw inputs -- bundled to stay inside this project's
 *  per-function param-count cap (mirrors {@link ExtremityDrawCtx}). */
interface MiddleDecorCtx {
  readonly strokeColor: Paint;
  readonly backColor: Paint;
  readonly diagramBackColor: Paint;
  readonly k: number;
}

function drawMiddleDecorShape(
  middleDecor: MiddleDecor,
  point: Point2D,
  angle: number,
  ctx: MiddleDecorCtx,
): {
  body: string;
  extraDefs: string;
} {
  const { strokeColor, backColor, diagramBackColor, k } = ctx;
  // cdd-B8FU: same double-scaling trap `drawExtremityMarkup`/`renderer-
  // edge-extras.ts#renderEdgeVisibilityIcon` document -- `point` is
  // `dotPath.getMiddle().point`, derived from the ALREADY-scaled `points`
  // (`class-scale-geo-edge.ts`), and this draws through the SAME
  // scale-aware klimt pipeline, so it must be unscaled before translating.
  const ug = UGraphicSvg.build(0, basicSvgOption({ scale: k }), '$version$', NO_TEXT_BOUNDER);
  const base = ug
    .apply(new Fore(strokeColor))
    .apply(UStroke.withThickness(MIDDLE_STROKE_WIDTH))
    .apply(new Back(backColor))
    .apply(new UTranslate(point.x / k, point.y / k));
  if (middleDecor === 'circleCircled') {
    const bigCircle = UEllipse.build(2 * MIDDLE_RADIUS_OUTER, 2 * MIDDLE_RADIUS_OUTER);
    base
      .apply(new Fore(diagramBackColor))
      .apply(new Back(diagramBackColor))
      .apply(new UTranslate(-MIDDLE_RADIUS_OUTER, -MIDDLE_RADIUS_OUTER))
      .draw(bigCircle);
  }
  if (middleDecor === 'circleCircled' || middleDecor === 'circleCircled1') {
    const arc1 = new UEllipse(2 * MIDDLE_RADIUS_OUTER, 2 * MIDDLE_RADIUS_OUTER, angle, 90);
    base.apply(new Back('none')).apply(new UTranslate(-MIDDLE_RADIUS_OUTER, -MIDDLE_RADIUS_OUTER)).draw(arc1);
  }
  if (middleDecor === 'circleCircled' || middleDecor === 'circleCircled2') {
    const arc2 = new UEllipse(2 * MIDDLE_RADIUS_OUTER, 2 * MIDDLE_RADIUS_OUTER, angle + 180, 90);
    base.apply(new Back('none')).apply(new UTranslate(-MIDDLE_RADIUS_OUTER, -MIDDLE_RADIUS_OUTER)).draw(arc2);
  }
  base
    .apply(new UTranslate(-MIDDLE_RADIUS_INNER, -MIDDLE_RADIUS_INNER))
    .draw(UEllipse.build(2 * MIDDLE_RADIUS_INNER, 2 * MIDDLE_RADIUS_INNER));
  return extractFlatContent(ug.getSvgString());
  // #lizard forgives -- faithful port of MiddleCircleCircled#drawU's own
  // three-branch (BOTH/MODE1/MODE2) dispatch plus MiddleCircle's always-on
  // inner circle, folded into one function since both share the SAME
  // radius/stroke setup (module doc comment above).
}

/**
 * Builds the arc+ellipse markup for `edge.middleDecor` (`-0)-` and its
 * three siblings), or `undefined` when the edge carries none or its point
 * list cannot support a real `DotPath` (fewer than 4 points, or not a
 * well-formed `1 + 3*n` bezier spline -- the same shape guard
 * `buildDotPathFromSplinePoints` itself enforces).
 *
 * `angleDeg = -angleRad * 180 / PI` then `angleDeg - 45` is
 * `SvekEdge.java:984-987` verbatim: `dotPath.getMiddle()` returns a
 * math-convention (y-down, CCW-positive) radian angle; upstream negates it
 * to its own UEllipse-arc degree convention before subtracting the fixed
 * 45° the two `MiddleCircleCircled` MODE arcs are centred at.
 */
export function buildMiddleDecorMarkup(
  points: EdgeGeo['points'],
  middleDecor: MiddleDecor | undefined,
  strokeColor: Paint,
  backgroundColor: Paint,
  // cdd-B8FU (D4/journal row 175): defaults to 1 so every pre-existing
  // caller (this file's own unit tests) is unaffected; `renderer-edge.ts`
  // passes the diagram's real resolved factor.
  k = 1,
): { body: string; extraDefs: string } | undefined {
  if (middleDecor === undefined) return undefined;
  if (points.length < 4 || (points.length - 1) % 3 !== 0) return undefined;
  const dotPath = buildDotPathFromSplinePoints(points);
  const middle = dotPath.getMiddle();
  const angleDeg = (-middle.angle * 180) / Math.PI;
  return drawMiddleDecorShape(middleDecor, middle.point, angleDeg - 45, {
    strokeColor,
    backColor: backgroundColor,
    diagramBackColor: backgroundColor,
    k,
  });
}
