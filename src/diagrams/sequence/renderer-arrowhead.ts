/**
 * renderer-arrowhead.ts — the sequence engine's arrow EMISSION layer.
 *
 * `sequence-arrowhead.ts` (T1) returns tip-local geometry and nothing else.
 * This module is the other half of `ComponentRoseArrow#drawInternalU`: it
 * says WHERE along the message each dressing is translated to, how much of
 * the line each head kind eats, and it turns the geometry into markup
 * through `core/svg.js`'s shape emitters. It exists as its own file because
 * `renderer.ts` is already at 467 of the repo's 500-line cap — the class
 * engine split its own `renderer-arrowhead.ts` out for the same reason.
 *
 * THE COORDINATE FRAME, which is the whole substance of the port. Upstream's
 * arrow component always draws LEFT TO RIGHT in its own local frame, whatever
 * direction the message runs: `CommunicationTile#drawU` translates to
 * `min(x1, x2)` and hands the component an `Area` of width `|x2 - x1|`
 * (`teoz/CommunicationTile.java:337-339` reverse, `:350-352` forward), and
 * `#getComponent` has already swapped both dressings when `isReverse()`
 * (`:145-146`, itself `point1 > point2` at `:125-131`). So a right-to-left
 * message is not drawn backwards — it is drawn forwards from a REVERSED
 * configuration, and its head lands on `dressing1` at the LEFT end.
 *
 * Verified against two cached goldens, byte for byte, not derived on paper:
 *
 *   - `mebidu-16-ruve297` (`Bob -> Alice`, left to right). Bob's lifeline
 *     81.538, Alice's 133.231, so width = 51.693. `pos2 = width - 2` puts the
 *     tip at 131.231 and the golden's polygon reads
 *     `121.231,62,131.231,66,121.231,70,125.231,66`; `len = width - 1 -
 *     arrowDeltaX / 2` ends the line at 127.231 and the golden's line reads
 *     `x1="81.538" ... x2="127.231"`.
 *   - `bajapi-70-tevi384` (`Bob -> Alice` with Alice on the left, i.e.
 *     reversed). Same two lifelines at 67 and 227.581, width 160.581.
 *     `pos1 = 1` puts the tip at 68 and the golden reads
 *     `78,118,68,122,78,126,74,122`; `start = arrowDeltaX / 2` and
 *     `len = width - 1 - arrowDeltaX / 2` give `x1="72" ... x2="226.581"`,
 *     which is the golden's line exactly.
 *
 * Every `file:line` below is relative to
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`; a bare `:NNN` is
 * relative to the nearest preceding named file.
 *
 * @see skin/rose/ComponentRoseArrow.java (drawInternalU, drawDressing1/2)
 * @see skin/rose/ComponentRoseSelfArrow.java (drawRightSide)
 * @see sequencediagram/teoz/CommunicationTile.java (the frame and the reverse)
 * @see plans/sequence-root-chrome/decisions.md (D2, D3)
 */

import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { Theme } from '../../core/theme.js';
import { line, polygon, ellipse } from '../../core/svg.js';
import type { MessageGeo } from './ast.js';
import {
  ARROW_DELTA_X,
  DIAM_CIRCLE,
  SPACE_CROSS_X,
  THIN_CIRCLE,
  headGeometryNormalSide,
  headGeometryReverseSide,
  headGeometrySelf,
  inclination1Of,
  inclination2Of,
  inclinationAngle1,
  inclinationAngle2,
} from './sequence-arrowhead.js';
import type {
  ArrowCircle,
  ArrowConfiguration,
  ArrowDressing,
  ArrowHeadKind,
  ArrowSegment,
  HeadGeometry,
} from './sequence-arrowhead.js';
import type { ScaledTheme } from './scale-geo.js';
import { scaleHeadGeometry, scaledDashPattern } from './scale-geo.js';

// ---------------------------------------------------------------------------
// Paint
// ---------------------------------------------------------------------------

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

function paintOf(theme: Theme): ArrowPaint {
  return { color: theme.colors.arrow, background: theme.colors.background };
}

/**
 * `niceArrow` is the constructor argument `Rose#createComponentArrow` passes
 * as `param.strictUmlStyle() == false` — `:296` for the self component,
 * `:340` for the flat one.
 * @see skin/rose/Rose.java:296,340
 */
function niceArrowOf(theme: Theme): boolean {
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
const ARROW_THICKNESS = 1;

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
function renderArrowHead(
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

/**
 * `ArrowConfiguration#reverse` — both dressings and both decorations swap,
 * and upstream's constructor call passes EVERY other field straight through:
 * `body`, `color`, `isSelf`, `thickness`, `reverseDefine` and `inclination`.
 * Spread-then-override rather than a field list, so a future addition to
 * `ArrowConfiguration` survives the reverse instead of being silently
 * dropped — which is exactly what happened to `inclination` while this was a
 * field list and nothing produced one.
 * @see skin/ArrowConfiguration.java:110-113
 */
export function reverseArrowConfiguration(
  configuration: ArrowConfiguration,
): ArrowConfiguration {
  return {
    ...configuration,
    dressing1: configuration.dressing2,
    dressing2: configuration.dressing1,
    decoration1: configuration.decoration2,
    decoration2: configuration.decoration1,
  };
}

/**
 * How much of `len` the head-side `o` circle eats. Note that upstream keys
 * this on the HEAD being absent, not on the decoration.
 * @see skin/rose/ComponentRoseArrow.java:103-109
 */
function decorationTrim2(configuration: ArrowConfiguration, k: number): number {
  if (configuration.decoration2 !== 'CIRCLE') return 0;
  if (configuration.dressing2.head === 'NONE') return (DIAM_CIRCLE / 2) * k;
  return (DIAM_CIRCLE / 2 + THIN_CIRCLE) * k;
}

/**
 * The tail-side `o` circle's trim, applied to BOTH `start` and `len`. Written
 * as three head-keyed branches rather than the negation of one because that
 * is how upstream writes it, and because CROSSX — which falls through all
 * three — trims nothing at all.
 * @see skin/rose/ComponentRoseArrow.java:111-124
 */
function decorationTrim1(configuration: ArrowConfiguration, k: number): number {
  if (configuration.decoration1 !== 'CIRCLE') return 0;
  const head = configuration.dressing1.head;
  if (head === 'NONE') return (DIAM_CIRCLE / 2) * k;
  if (head === 'ASYNC') return (DIAM_CIRCLE / 2 + THIN_CIRCLE) * k;
  if (head === 'NORMAL') return (DIAM_CIRCLE / 2 + THIN_CIRCLE) * k;
  return 0;
}

/**
 * How much of the line one dressing's head eats, side-independent: upstream
 * writes the same two magnitudes twice, once per side, differing only in
 * whether `start` advances too (`:126-127` / `:129-132` for the polygon,
 * `:134-135` / `:137-140` for the saltire).
 * @see skin/rose/ComponentRoseArrow.java:126-140
 */
function dressingTrim(dressing: ArrowDressing, k: number): number {
  let trim = 0;
  if (dressing.part === 'FULL' && dressing.head === 'NORMAL')
    trim += (ARROW_DELTA_X / 2) * k;
  if (dressing.head === 'CROSSX') trim += 2 * SPACE_CROSS_X * k;
  return trim;
}

/** Where the line runs and where the two dressings are translated to, all in
 *  the component's own left-to-right local frame. */
interface ArrowExtent {
  readonly start: number;
  readonly len: number;
  readonly pos1: number;
  readonly pos2: number;
}

/**
 * The `(n)` slope, resolved per side. `incl1`/`incl2` are the y offsets
 * `drawInternalU` adds to each dressing's translate (`:152-155`); `theta1`/
 * `theta2` are the rotations the heads at those positions take.
 *
 * SCALED HERE. `scale-geo.ts` carries `inclination` through untouched (it
 * spreads `MessageGeo`), so this is the "renderer scales its own remaining
 * literals in place, where each is combined with already-scaled geometry"
 * seam that module's header describes. `incl` and `lenFull` are both
 * multiplied by `k`, so the ANGLE is unchanged — `atan2(i·k, w·k) ==
 * atan2(i, w)` — and only the y offsets grow, as upstream's `format()`
 * would have grown them on the way out.
 */
interface ArrowSlope {
  readonly incl1: number;
  readonly incl2: number;
  readonly theta1: number;
  readonly theta2: number;
}

function arrowSlope(configuration: ArrowConfiguration, lenFull: number, k: number): ArrowSlope {
  const incl1 = inclination1Of(configuration) * k;
  const incl2 = inclination2Of(configuration) * k;
  return {
    incl1,
    incl2,
    theta1: inclinationAngle1(incl1, lenFull),
    theta2: inclinationAngle2(incl2, lenFull),
  };
}

/**
 * The body's two ends, in the local frame. Upstream draws the flat
 * `ULine(len, 0)` only when BOTH inclinations are zero; each sloped branch
 * has its own ends, and neither is the flat line's — `inclination1` runs the
 * segment back to local x 0 rather than to `start`, and `inclination2` runs
 * it out to `pos2` rather than to `start + len`. `inclination1` wins when
 * both are set, because upstream tests it first.
 * @see skin/rose/ComponentRoseArrow.java:157-162,182-186
 */
function arrowBodyEnds(extent: ArrowExtent, slope: ArrowSlope): readonly [Point2D, Point2D] {
  const lineEnd = { x: extent.start + extent.len, y: 0 };
  const lineStart = { x: extent.start, y: 0 };
  if (slope.incl1 === 0 && slope.incl2 === 0) return [lineStart, lineEnd];
  if (slope.incl1 !== 0) return [lineEnd, { x: 0, y: slope.incl1 }];
  return [lineStart, { x: extent.pos2, y: slope.incl2 }];
}

/**
 * `drawInternalU`'s opening arithmetic, verbatim. `pos1` and `pos2` are read
 * off the UNTRIMMED `start`/`len` (`:100-101` runs before every adjustment at
 * `:103-140`), which is why a head sits at `width - 2` however much the line
 * is shortened.
 * @see skin/rose/ComponentRoseArrow.java:96-140
 */
function arrowExtent(
  configuration: ArrowConfiguration,
  width: number,
  k: number,
): ArrowExtent {
  let start = 0;
  let len = width - 1 * k;
  const pos1 = start + 1 * k;
  const pos2 = len - 1 * k;
  len -= decorationTrim2(configuration, k);
  const decoration1 = decorationTrim1(configuration, k);
  start += decoration1;
  len -= decoration1;
  len -= dressingTrim(configuration.dressing2, k);
  const dressing1 = dressingTrim(configuration.dressing1, k);
  start += dressing1;
  len -= dressing1;
  return { start, len, pos1, pos2 };
}

// ---------------------------------------------------------------------------
// The two message branches
// ---------------------------------------------------------------------------

/**
 * A flat (non-self) message: both dressings, then the line, in that order —
 * `drawDressing1` and `drawDressing2` at `:151-156`, the body at `:157`. The
 * cached goldens agree: every one of them writes the `<polygon>` before the
 * `<line>` it belongs to.
 *
 * `lenFull` (`:98`) is the FULL component width, untrimmed — it is what the
 * two head rotations are taken against, and it is not `extent.len`.
 * @see skin/rose/ComponentRoseArrow.java:151-162
 */
export function renderFlatMessageArrow(
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: ScaledTheme,
): string {
  const k = theme.scaleK;
  // `CommunicationTile#isReverse` compares the two lifeline positions, not
  // the participants' declaration order (`:125-131`).
  const drawn =
    msg.fromX > msg.toX ? reverseArrowConfiguration(configuration) : configuration;
  const origin = { x: Math.min(msg.fromX, msg.toX), y: msg.y };
  const lenFull = Math.abs(msg.toX - msg.fromX);
  const extent = arrowExtent(drawn, lenFull, k);
  const slope = arrowSlope(drawn, lenFull, k);
  const [from, to] = arrowBodyEnds(extent, slope);
  const body = line(origin.x + from.x, origin.y + from.y, origin.x + to.x, origin.y + to.y, {
    stroke: theme.colors.arrow,
    strokeWidth: ARROW_THICKNESS * k,
    ...(configuration.dashed ? { strokeDasharray: scaledDashPattern(k) } : {}),
  });
  return flatArrowHeads(drawn, origin, extent, slope, theme) + body;
}

/** `drawDressing1` at `(pos1, inclination1)` then `drawDressing2` at
 *  `(pos2, inclination2)`, in that order — the y term is upstream's, at
 *  `:152` and `:154`, and is read off the UNTRIMMED positions like the x.
 *  @see skin/rose/ComponentRoseArrow.java:151-156 */
function flatArrowHeads(
  drawn: ArrowConfiguration,
  origin: Point2D,
  extent: ArrowExtent,
  slope: ArrowSlope,
  theme: ScaledTheme,
): string {
  const paint = paintOf(theme);
  const niceArrow = niceArrowOf(theme);
  const k = theme.scaleK;
  const head1 = renderArrowHead(
    headGeometryReverseSide(drawn.dressing1, drawn.decoration1, niceArrow, slope.theta1),
    drawn.dressing1.head,
    { x: origin.x + extent.pos1, y: origin.y + slope.incl1 },
    paint,
    k,
  );
  const head2 = renderArrowHead(
    headGeometryNormalSide(drawn.dressing2, drawn.decoration2, niceArrow, slope.theta2),
    drawn.dressing2.head,
    { x: origin.x + extent.pos2, y: origin.y + slope.incl2 },
    paint,
    k,
  );
  return head1 + head2;
}

/**
 * A self message's head geometry. `drawRightSide` dispatches on `dressing2`'s
 * head exactly like the flat component does — saltire at `:152-160`, the open
 * stroke pair at `:161-169`, the polygon at `:170-173` — and only the last of
 * those three goes through `getPolygon()`. Reading `getPart()` where upstream
 * does (`:162,166`) is the same value as `dressing2.part` here, because
 * `ArrowConfiguration#getPart` returns dressing2's whenever its head is not
 * NONE (`ArrowConfiguration.java:221-223`) and this branch has already
 * established that.
 *
 * The decoration is passed as NONE rather than threaded: a self `o` is drawn
 * by `:104-112` from `textHeight`/`arrowHeight`, geometry this port's self
 * loop does not carry (Gap SQ-5 keeps the spike's own 40 px loop).
 * @see skin/rose/ComponentRoseSelfArrow.java:152-173
 */
function selfHeadGeometry(
  configuration: ArrowConfiguration,
  reverseDefine: boolean,
  niceArrow: boolean,
): HeadGeometry {
  const dressing = configuration.dressing2;
  if (dressing.head === 'NORMAL')
    return headGeometrySelf(configuration, reverseDefine, niceArrow);
  // 0, not `slope.theta*`: no self component reads an inclination — the
  // token appears nowhere under `net/` outside `ArrowConfiguration` and
  // `ComponentRoseArrow` (verified by grep), so a self `(n)` draws square.
  return headGeometryReverseSide(dressing, 'NONE', niceArrow, 0);
}

/**
 * `isReverseDefine()` is set by an arrow whose LEFT dressing carries the
 * `<`/`\`/`/` (`CommandArrow.java:306-314`, `hasDressing1butx`).
 * `ArrowConfiguration` does not carry the flag in this port (only the fields
 * the drawing layer reads are modelled, `sequence-arrowhead.ts:74-94`), so
 * `drawLeftSide` (`ComponentRoseSelfArrow.java:84,176-273`) stays unreachable
 * and `getPolygon`'s `direction` is always +1.
 * @see sequencediagram/command/CommandArrow.java:306-314
 */
const SELF_REVERSE_DEFINE = false;

/**
 * The head at the foot of a self loop. Upstream puts the tip at `x2`, the
 * same x its returning bottom line starts from (`:126` draws the hline from
 * `x2`, `:172` translates the polygon by `dx(x2)`) — verified on
 * `botoku-28-cupe920`, whose bottom line reads `x1="79.863"` and whose
 * polygon reads `89.863,75,79.863,79,89.863,83,85.863,79`. This port keeps
 * that invariant against ITS own loop, whose returning segment ends at the
 * lifeline (Gap SQ-5), rather than transplanting upstream's `x2 = 1`
 * (`:93`) onto a loop 5 px narrower than the one it was measured for.
 * @see skin/rose/ComponentRoseSelfArrow.java:91-93,126,170-173
 */
export function renderSelfMessageHead(
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: ScaledTheme,
  tipY: number,
): string {
  const niceArrow = niceArrowOf(theme);
  return renderArrowHead(
    selfHeadGeometry(configuration, SELF_REVERSE_DEFINE, niceArrow),
    configuration.dressing2.head,
    { x: msg.fromX, y: tipY },
    paintOf(theme),
    theme.scaleK,
  );
}
