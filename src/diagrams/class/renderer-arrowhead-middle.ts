/**
 * renderer-arrowhead-middle.ts — cdd-T7 (A5/M4, A2a/M6): mid-link
 * decoration (`-0)-` etc.), `MiddleCircle`/`MiddleCircleCircled#drawU`.
 * Split out of `renderer-arrowhead.ts` (cdd3-T33, 500-line hook cap) —
 * a pure move, re-exported from that file so no consumer's import path
 * changed. See that file's own header doc comment for the shared
 * "throwaway `UGraphicSvg` document" drawing strategy this module reuses.
 */
import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { Paint } from '../../core/paint.js';
import { UGraphicSvg } from '../../core/klimt/drawing/svg/u-graphic-svg.js';
import { basicSvgOption } from '../../core/klimt/drawing/svg/svg-graphics.js';
import { Fore } from '../../core/klimt/Fore.js';
import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate } from '../../core/klimt/UTranslate.js';
import { UEllipse } from '../../core/klimt/shape/UEllipse.js';
import { extractFlatContent } from '../../core/klimt/document-shell.js';
import { buildDotPathFromSplinePoints } from '../../core/svek/svek-edge-geometry.js';
import type { MiddleDecor } from './class-arrow-middle-decor.js';
import type { EdgeGeo } from './layout.js';

/** Extremities/mid-decor never draw text, so this `StringBounder` is
 *  never actually invoked; it exists only to satisfy `UGraphicSvg.build`'s
 *  required 4th parameter (mirrors `renderer-arrowhead.ts`'s own
 *  identically-purposed constant). */
const NO_TEXT_BOUNDER = { calculateDimension: (): { width: number } => ({ width: 0 }) };

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
 *  per-function param-count cap (mirrors `renderer-arrowhead.ts
 *  #ExtremityDrawCtx`). */
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
  // cdd-B8FU: same double-scaling trap `renderer-arrowhead.ts
  // #drawExtremityMarkup`/`renderer-edge-extras.ts
  // #renderEdgeVisibilityIcon` document -- `point` is `dotPath.getMiddle()
  // .point`, derived from the ALREADY-scaled `points` (`class-scale-
  // geo-edge.ts`), and this draws through the SAME scale-aware klimt
  // pipeline, so it must be unscaled before translating.
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
 * cdd7-T1a (D2): `LinkMiddleDecor#getMiddleFactory(backColor,
 * diagramBackColor)`'s two colours (`LinkMiddleDecor.java:49-60`).
 * `SvekEdge.java:986` passes `(arrowLollipopColor, backgroundColor)`:
 * `backColor` fills the inner circle (`MiddleCircleCircled.java:76,88`),
 * `diagramBackColor` paints the BOTH-mode knock-out disc (`:71-73`).
 */
export interface MiddleDecorColors {
  readonly backColor: Paint;
  readonly diagramBackColor: Paint;
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
  colors: MiddleDecorColors,
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
    backColor: colors.backColor,
    diagramBackColor: colors.diagramBackColor,
    k,
  });
}
