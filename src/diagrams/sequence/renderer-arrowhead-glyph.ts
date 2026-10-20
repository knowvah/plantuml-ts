/**
 * Arrow-head GLYPH drawing: the paint, the polygon, the async lines and the
 * decoration circle that one arrow END draws.
 *
 * Split out of `renderer-arrowhead.ts` at the `sequence-command-coverage`
 * batch-5 close, for the project's 500-line file cap: T15 left that module at
 * 498 lines and T17 adds exogenous-arrow rendering to it. The seam is one the
 * code already had -- nothing here reaches forward into the extent/slope
 * geometry that stayed behind, so the move is import-only and changes no
 * behavior.
 *
 * Upstream draws all of this from `skin/rose/ComponentRoseArrow.java`; the
 * per-form citations travel with each function.
 */

import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { Theme } from '../../core/theme.js';
import { line, polygon, ellipse } from '../../core/svg.js';
import type { ArrowCircle, ArrowHeadKind, ArrowSegment, HeadGeometry } from './sequence-arrowhead.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { scaleHeadGeometry } from './scale-geo.js';
import { noGradient } from '../../core/paint.js';

/**
 * What one arrow end reads off the message's merged arrow style
 * (`sequence-arrow-paint.ts#messagePaint`), read lazily, as the component
 * reads only what it draws:
 * - `stroke` — `getForegroundColor()`, the style's `LineColor`
 *   (`AbstractComponentRoseArrow.java:65,80-82`): every head's stroke and,
 *   via `.bg()`, the polygon's fill (`ComponentRoseArrow.java:230,267`);
 * - `fill` — `getBackgroundColor()`, the style's `BackGroundColor`
 *   (`:66,84-86`): the `o` circle's fill only (`:203,239`). The default skin
 *   pins it to black (`plantuml.skin:306-310` `arrow { BackGroundColor
 *   black }`), not the document background;
 * - `thickness` — `arrowConfiguration.withThickness(stroke.getThickness())`
 *   (`:67-68`), which `applyThicknessOnly` strokes the ASYNC pair with
 *   (`ArrowConfiguration.java:262-264`; `ComponentRoseArrow.java:211-216,
 *   248-253`).
 *
 * The glyph draws flat (cdd7-T1a D3): a gradient line colour paints its
 * first stop.
 */
function headColorOf(paint: SequencePaint): string {
  return noGradient(paint.stroke);
}

/**
 * `niceArrow` is the constructor argument `Rose#createComponentArrow` passes
 * as `param.strictUmlStyle() == false` — `:296` for the self component,
 * `:340` for the flat one.
 * @see skin/rose/Rose.java:296,340
 */
export function niceArrowOf(theme: Theme): boolean {
  return theme.strictUml !== true;
}

/**
 * The polygon head's stroke: nothing applies a stroke before
 * `drawDressing1`/`drawDressing2` draw it (`ComponentRoseArrow.java:230,267`;
 * `ComponentRoseSelfArrow.java:149,172`), so it is the `UGraphic`'s initial
 * `UStroke.simple()` — 1, whatever the style's thickness. Jar-verified with
 * `skinparam sequenceArrowThickness 2`: shaft `stroke-width:2`, polygon
 * `stroke-width:1`.
 * @see klimt/drawing/AbstractCommonUGraphic.java:58
 */
const POLYGON_THICKNESS = 1;

/**
 * The CROSSX saltire is stroked at a literal 2, on both sides and in the self
 * component, whatever the style. `HeadGeometry.lines` cannot carry a
 * thickness (T1's interface contract), so it is applied here, at the
 * emitter, from the head kind.
 * @see skin/rose/ComponentRoseArrow.java:219,256
 * @see skin/rose/ComponentRoseSelfArrow.java:132,135,153,157
 */
const CROSSX_THICKNESS = 2;

/** CROSSX at its literal 2; the ASYNC pair at the style thickness (`applyThicknessOnly`). */
function lineThicknessOf(kind: ArrowHeadKind, paint: SequencePaint): number {
  return kind === 'CROSSX' ? CROSSX_THICKNESS : paint.thickness;
}

// ---------------------------------------------------------------------------
// Emission — tip-local geometry to markup
// ---------------------------------------------------------------------------

/** `ug.apply(getForegroundColor().bg()).draw(polygon)` — filled AND stroked. */
function headPolygonMarkup(points: readonly Point2D[], tip: Point2D, paint: SequencePaint, k: number): string {
  const translated = points.map((p) => ({ x: tip.x + p.x, y: tip.y + p.y }));
  const color = headColorOf(paint);
  return polygon(translated, {
    fill: color,
    stroke: color,
    strokeWidth: POLYGON_THICKNESS * k,
  });
}

/** The ASYNC stroke pair and the CROSSX saltire — stroked, never filled. */
function headLinesMarkup(
  segments: readonly ArrowSegment[],
  kind: ArrowHeadKind,
  tip: Point2D,
  paint: SequencePaint,
  k: number,
): string {
  const thickness = lineThicknessOf(kind, paint) * k;
  const color = headColorOf(paint);
  return segments
    .map(([a, b]) =>
      line(tip.x + a.x, tip.y + a.y, tip.x + b.x, tip.y + b.y, {
        stroke: color,
        strokeWidth: thickness,
      }),
    )
    .join('');
}

/**
 * The `o` decoration: stroked in the foreground colour at `thinCircle`,
 * filled with the component's background colour.
 * @see skin/rose/ComponentRoseArrow.java:201-204,237-239
 */
function headCircleMarkup(arrowCircle: ArrowCircle, tip: Point2D, paint: SequencePaint): string {
  const radius = arrowCircle.d / 2;
  return ellipse(tip.x + arrowCircle.cx, tip.y + arrowCircle.cy, radius, radius, {
    fill: noGradient(paint.fill),
    stroke: headColorOf(paint),
    'stroke-width': arrowCircle.thickness,
  });
}

/**
 * One arrow end, translated from tip-local coordinates to the document. The
 * circle comes FIRST: both `drawDressing1` and `drawDressing2` draw it before
 * they have looked at the head at all.
 * @see skin/rose/ComponentRoseArrow.java:199-233,235-270
 */
export function renderArrowHead(
  head: HeadGeometry,
  kind: ArrowHeadKind,
  tip: Point2D,
  paint: SequencePaint,
  k: number,
): string {
  // `head` is `sequence-arrowhead.ts`'s tip-local, unscaled vocabulary —
  // scaled here, once, before use (see scale-geo.ts's header for why
  // scaling this OUTPUT is arithmetically identical to threading `k`
  // through every constant that module builds it from).
  const scaled = scaleHeadGeometry(head, k);
  const circleMarkup = scaled.circle === undefined ? '' : headCircleMarkup(scaled.circle, tip, paint);
  const shapeMarkup =
    scaled.polygon !== undefined
      ? headPolygonMarkup(scaled.polygon, tip, paint, k)
      : scaled.lines !== undefined
        ? headLinesMarkup(scaled.lines, kind, tip, paint, k)
        : '';
  return circleMarkup + shapeMarkup;
}

// ---------------------------------------------------------------------------
// Placement — drawInternalU's start / len / pos1 / pos2
// ---------------------------------------------------------------------------
