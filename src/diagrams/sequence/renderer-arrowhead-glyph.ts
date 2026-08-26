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
import type {
  ArrowCircle,
  ArrowHeadKind,
  ArrowSegment,
  HeadGeometry,
} from './sequence-arrowhead.js';
import { scaleHeadGeometry } from './scale-geo.js';

/**
 * The two colours `drawDressing1`/`drawDressing2` reach for:
 * `getForegroundColor()` strokes (and, via `.bg()`, FILLS) every head, and
 * `getBackgroundColor()` fills the `o` circle only.
 * @see skin/rose/ComponentRoseArrow.java:201-204,238-241
 */
interface ArrowPaint {
  readonly color: string;
  readonly background: string;
}

export function paintOf(theme: Theme): ArrowPaint {
  return { color: theme.colors.arrow, background: theme.colors.background };
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
 * Head stroke thickness. `withDirectionNormal()` seeds `thickness = 1` and
 * `AbstractComponentRoseArrow`'s constructor overwrites it with the style's
 * own stroke, which is `UStroke.simple()` — 1 — for every fixture this port
 * can produce.
 * @see skin/ArrowConfiguration.java:88-92
 * @see skin/rose/AbstractComponentRoseArrow.java:66-68
 */
export const ARROW_THICKNESS = 1;

/**
 * The CROSSX saltire is the ONE head kind upstream strokes at 2, on both
 * sides and in the self component. `HeadGeometry.lines` cannot carry a
 * thickness (T1's interface contract), so it is applied here, at the
 * emitter, from the head kind.
 * @see skin/rose/ComponentRoseArrow.java:219,256
 * @see skin/rose/ComponentRoseSelfArrow.java:132,135,153,157
 */
const CROSSX_THICKNESS = 2;

function lineThicknessOf(kind: ArrowHeadKind): number {
  return kind === 'CROSSX' ? CROSSX_THICKNESS : ARROW_THICKNESS;
}

// ---------------------------------------------------------------------------
// Emission — tip-local geometry to markup
// ---------------------------------------------------------------------------

/** `ug.apply(getForegroundColor().bg()).draw(polygon)` — filled AND stroked. */
function headPolygonMarkup(
  points: readonly Point2D[],
  tip: Point2D,
  paint: ArrowPaint,
  k: number,
): string {
  const translated = points.map((p) => ({ x: tip.x + p.x, y: tip.y + p.y }));
  return polygon(translated, {
    fill: paint.color,
    stroke: paint.color,
    strokeWidth: ARROW_THICKNESS * k,
  });
}

/** The ASYNC stroke pair and the CROSSX saltire — stroked, never filled. */
function headLinesMarkup(
  segments: readonly ArrowSegment[],
  kind: ArrowHeadKind,
  tip: Point2D,
  paint: ArrowPaint,
  k: number,
): string {
  const thickness = lineThicknessOf(kind) * k;
  return segments
    .map(([a, b]) =>
      line(tip.x + a.x, tip.y + a.y, tip.x + b.x, tip.y + b.y, {
        stroke: paint.color,
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
function headCircleMarkup(
  arrowCircle: ArrowCircle,
  tip: Point2D,
  paint: ArrowPaint,
): string {
  const radius = arrowCircle.d / 2;
  return ellipse(tip.x + arrowCircle.cx, tip.y + arrowCircle.cy, radius, radius, {
    fill: paint.background,
    stroke: paint.color,
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
  paint: ArrowPaint,
  k: number,
): string {
  // `head` is `sequence-arrowhead.ts`'s tip-local, unscaled vocabulary —
  // scaled here, once, before use (see scale-geo.ts's header for why
  // scaling this OUTPUT is arithmetically identical to threading `k`
  // through every constant that module builds it from).
  const scaled = scaleHeadGeometry(head, k);
  const circleMarkup =
    scaled.circle === undefined ? '' : headCircleMarkup(scaled.circle, tip, paint);
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
