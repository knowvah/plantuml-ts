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

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { Back } from '../../core/klimt/Back.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import { UTranslate, type Point2D } from '../../core/klimt/UTranslate.js';
import { UEllipse } from '../../core/klimt/shape/UEllipse.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import { UPolygon } from '../../core/klimt/shape/UPolygon.js';
import type { Theme } from '../../core/theme.js';
import type { ArrowCircle, ArrowHeadKind, ArrowSegment, HeadGeometry } from './sequence-arrowhead.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { noGradient } from '../../core/paint.js';
import { Fore } from '../../core/klimt/Fore.js';

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
 * The polygon head's stroke (no constant: the drawing applies none): nothing applies a stroke before
 * `drawDressing1`/`drawDressing2` draw it (`ComponentRoseArrow.java:230,267`;
 * `ComponentRoseSelfArrow.java:149,172`), so it is the `UGraphic`'s initial
 * `UStroke.simple()` — 1, whatever the style's thickness. Jar-verified with
 * `skinparam sequenceArrowThickness 2`: shaft `stroke-width:2`, polygon
 * `stroke-width:1`. (The page draws at scale 1, so no `k` multiplies it.)
 * @see klimt/drawing/AbstractCommonUGraphic.java:58
 */

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
// Drawing — tip-local geometry through the page's `UGraphic`
// ---------------------------------------------------------------------------

/** What an end draws with: the message's merged arrow paint. */
export interface HeadInk {
  readonly paint: SequencePaint;
}

/** `getForegroundColor()` as the `Fore` the component applies ONCE, at the
 *  top of `drawInternalU` (`ComponentRoseArrow.java:91`,
 *  `ComponentRoseSelfArrow.java:80`): a `<line>` and a head cannot carry a
 *  gradient (`headColorOf`). */
export function arrowFore(paint: SequencePaint): Fore {
  return new Fore(headColorOf(paint));
}

/** `ug.apply(getForegroundColor().bg()).draw(polygon)` -- filled AND stroked.
 *  The graphic already carries the `Fore` ({@link arrowFore}) and the default
 *  `UStroke.simple()` (thickness 1); the polygon's
 *  points are `sequence-arrowhead.ts`'s tip-local ones (rotation and the
 *  circle's push-off already applied), the tip being the graphic's translate.
 *  @see skin/rose/ComponentRoseArrow.java:230,267
 *  @see skin/rose/ComponentRoseSelfArrow.java:149,172 */
function drawHeadPolygon(ug: UGraphic, points: readonly Point2D[], ink: HeadInk): void {
  ug.apply(new Back(headColorOf(ink.paint))).draw(new UPolygon(points));
}

/** One stroke of an open or saltire head: the segment's start is its own
 *  translate (`ug.apply(new UTranslate(spaceCrossX, -dx / 2))`, `:220-223`;
 *  the circle's push-off `ug.apply(UTranslate.dx(..))`, `:206`, for the open
 *  pair), its vector `new ULine(dx, dy)`. A start at the tip applies none. */
function drawSegment(ug: UGraphic, [a, b]: ArrowSegment): void {
  const from = a.x === 0 && a.y === 0 ? ug : ug.apply(new UTranslate(a.x, a.y));
  from.draw(ULine.create(a, b));
}

/** The ASYNC pair and the CROSSX saltire -- stroked, never filled.
 *  - ASYNC: `getArrowConfiguration().applyThicknessOnly(ug).draw(new ULine(..)
 *    .rotate(..))` per stroke (`:211-216,248-253`): each stroke on its own
 *    `applyThicknessOnly` instance, the rotation already in the segment;
 *  - CROSSX: `ug = ug.apply(UStroke.withThickness(2))` once, then
 *    `ug.apply(new UTranslate(..)).draw(new ULine(..))` per stroke
 *    (`:219-223,256-260`). */
function drawHeadLines(ug: UGraphic, segments: readonly ArrowSegment[], kind: ArrowHeadKind, ink: HeadInk): void {
  const stroke = UStroke.withThickness(lineThicknessOf(kind, ink.paint));
  if (kind === 'CROSSX') {
    const stroked = ug.apply(stroke);
    for (const segment of segments) drawSegment(stroked, segment);
    return;
  }
  for (const segment of segments) drawSegment(ug.apply(stroke), segment);
}

/**
 * The `o` decoration: stroked in the foreground colour at `thinCircle`,
 * filled with the component's background colour.
 *
 * ```java
 * ug.apply(UStroke.withThickness(thinCircle)).apply(getForegroundColor())
 *     .apply(getBackgroundColor().bg())
 *     .apply(new UTranslate(-diamCircle / 2 - thinCircle,
 *         -diamCircle / 2 - thinCircle / 2)).draw(circle);
 * ```
 * The circle is carried as its centre; its top-left is `diamCircle / 2` back.
 * @see skin/rose/ComponentRoseArrow.java:201-204,237-239
 */
function drawHeadCircle(ug: UGraphic, circle: ArrowCircle, ink: HeadInk): void {
  const radius = circle.d / 2;
  ug.apply(UStroke.withThickness(circle.thickness))
    .apply(arrowFore(ink.paint))
    .apply(new Back(noGradient(ink.paint.fill)))
    .apply(new UTranslate(circle.cx - radius, circle.cy - radius))
    .draw(UEllipse.build(circle.d, circle.d));
}

/**
 * One arrow end drawn at `tip`, in `ug`'s frame (the arrow component's, with
 * its {@link arrowFore} applied). The circle comes FIRST: both
 * `drawDressing1` and `drawDressing2` draw it before they have looked at the
 * head at all.
 *
 * `ug.apply(new UTranslate(pos, posArrow + inclination))` is the tip
 * (`ComponentRoseArrow.java:151-154`); every shape is then drawn on an
 * instance whose last change is an `apply`, so a decorator that restarts at
 * each `apply` (`UGraphicHandwritten.java:114-116`) restarts per shape.
 * @see skin/rose/ComponentRoseArrow.java:199-233,235-270
 */
export function drawArrowHead(ug: UGraphic, head: HeadGeometry, kind: ArrowHeadKind, tip: Point2D, ink: HeadInk): void {
  const at = ug.apply(new UTranslate(tip.x, tip.y));
  if (head.circle !== undefined) drawHeadCircle(at, head.circle, ink);
  if (head.polygon !== undefined) drawHeadPolygon(at, head.polygon, ink);
  else if (head.lines !== undefined) drawHeadLines(at, head.lines, kind, ink);
}
