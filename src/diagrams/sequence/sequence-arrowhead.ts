/**
 * sequence-arrowhead.ts — the sequence engine's arrow SHAPE vocabulary.
 *
 * The spike drew message arrowheads as SVG `<marker>` references
 * (`sequence/renderer.ts`, `arrowHeadRef` + `markerEnd`/`markerStart`); the
 * jar draws them as inline polygons and lines, from
 * `ComponentRoseArrow#drawDressing1`/`#drawDressing2` and
 * `ComponentRoseSelfArrow`. This module ports that vocabulary and nothing
 * else: it returns GEOMETRY — point lists and line segments in tip-local
 * coordinates — never SVG markup. The renderer translates and emits.
 *
 * "Tip-local" means the origin is the point upstream translates its
 * `UGraphic` to before drawing a head: `pos1` for `dressing1`, `pos2` for
 * `dressing2` (`ComponentRoseArrow.java:153-156`).
 *
 * An `ArrowConfiguration` is a pair of `ArrowDressing`s (tail side, head
 * side), each an `ArrowHead` x `ArrowPart`, plus a per-side
 * `ArrowDecoration`. This module ports that model as-is; the parser builds
 * one directly (`sequence-parse-helpers.ts#arrowConfigurationOf`, D1 of
 * mission sequence-command-coverage), which replaced the lossy
 * flat-enum adapter this file used to carry, so CROSSX, TOP_PART and
 * BOTTOM_PART — correct here but unfed while the flat enum stood — are now
 * reachable. D3 keeps the three polygon builders separate despite reading as
 * near-duplicates: the self variant differs by a sign convention and a `-1`
 * nudge.
 *
 * The inclination rotation (`:212,216,228,249,253,265`) IS ported, as
 * {@link inclinationAngle1}/{@link inclinationAngle2} plus the rotation the
 * two flat head builders apply. Only the polygon and the ASYNC stroke pair
 * rotate; upstream leaves the CROSSX saltire (`:218-223,255-260`) and the
 * `o` circle (`:202-204,240-241`) square, and the self component reads no
 * inclination at all (verified by grep over `src/main/java/net/`). Line
 * thickness stays the renderer's: upstream strokes the saltire at 2
 * (`:219,256`), and only the circle's thickness is expressible here.
 *
 * Every `file:line` below is relative to
 * `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`; a bare `:NNN` is
 * relative to the nearest preceding named file.
 *
 * @see skin/rose/ComponentRoseArrow.java
 * @see skin/rose/ComponentRoseSelfArrow.java
 * @see plans/sequence-root-chrome/decisions.md (D2, D3)
 */

import type { Point2D } from '../../core/klimt/UTranslate.js';

// ---------------------------------------------------------------------------
// The drawing model (D2)
// ---------------------------------------------------------------------------

/** Which shape an arrow end draws. @see skin/ArrowHead.java:38-40 */
export type ArrowHeadKind = 'NORMAL' | 'CROSSX' | 'ASYNC' | 'NONE';

/**
 * Whether an arrow end draws both halves of its head or one — the `\`/`/`
 * dressings (`sequencediagram/command/CommandArrow.java:361-365`).
 * @see skin/ArrowPart.java:38-40
 */
export type ArrowPart = 'FULL' | 'TOP_PART' | 'BOTTOM_PART';

/**
 * The optional circle an arrow end carries. It comes from an explicit `o` in
 * the arrow syntax — `CommandArrow.java:327-328,334-335,367-371`
 * (`circleAtStart`/`circleAtEnd`), `CommandExoArrowAny.java:109,115,122,128`
 * (`ARROW_SUPPCIRCLE1/2`) — and is orthogonal to `MessageExoType`, which is
 * what lost/found arrows are.
 * @see skin/ArrowDecoration.java:38-40
 */
export type ArrowDecoration = 'NONE' | 'CIRCLE';

/** One arrow end: head shape + how much of it. @see skin/ArrowDressing.java:40-80 */
export interface ArrowDressing {
  readonly head: ArrowHeadKind;
  readonly part: ArrowPart;
}

/**
 * A whole arrow's drawing configuration. `dressing1` is the tail side, drawn
 * reverse-pointing; `dressing2` is the head side, drawn normal-pointing
 * (`ComponentRoseArrow.java:153-156`). `dashed` is upstream's `isDotted()`,
 * i.e. `body == ArrowBody.DOTTED` (`ArrowConfiguration.java:198-200`). Only
 * the fields the drawing layer reads are carried; `color`, `thickness` and
 * `isSelf` stay with the renderer and the caller.
 * @see skin/ArrowConfiguration.java:45-61
 */
export interface ArrowConfiguration {
  readonly dressing1: ArrowDressing;
  readonly dressing2: ArrowDressing;
  readonly decoration1: ArrowDecoration;
  readonly decoration2: ArrowDecoration;
  readonly dashed: boolean;
  /** `withInclination(inclination1 + inclination2)`
   *  (`CommandArrow.java:393`) — the `->(10)` pixel offset summed over both
   *  dressings. Absent where upstream carries 0.
   *  @see skin/ArrowConfiguration.java:279-283 */
  readonly inclination?: number;
  /**
   * `ArrowBody.HIDDEN` — the `-[hidden]->` form
   * (`CommandArrow.java:495-496`), read back as
   * `ArrowConfiguration#isHidden` (`:202-203`).
   *
   * DRAWING only. `ComponentRoseArrow#drawInternalU:85-87` and
   * `ComponentRoseSelfArrow#drawInternalU:71-73` return on it before the
   * line, both arrowheads AND the label — but
   * `getPreferredHeight`/`getPreferredWidth` (`ComponentRoseArrow.java
   * :342-349`) are NOT guarded, so a hidden arrow still reserves its full
   * tile. Reserving space without ink is the whole point of the form, so
   * nothing in layout may read this field.
   *
   * Absent where upstream carries `ArrowBody.NORMAL`, matching
   * `inclination`'s own optional shape above.
   */
  readonly hidden?: boolean;
}

/** A line segment: an ordered start/end pair in tip-local coordinates. */
export type ArrowSegment = readonly [Point2D, Point2D];

/**
 * The circle an `ArrowDecoration.CIRCLE` end draws. `cx`/`cy` are the CENTRE:
 * upstream translates to the bounding box's top-left and re-derives
 * `cx = x + width / 2` (`klimt/drawing/svg/DriverEllipseSvg.java:73-74`).
 */
export interface ArrowCircle {
  readonly cx: number;
  readonly cy: number;
  readonly d: number;
  readonly thickness: number;
}

/**
 * What one arrow end draws, in tip-local coordinates. At most one of
 * `polygon`/`lines` is present — upstream's head branches are exclusive
 * (`ComponentRoseArrow.java:209-231`) — and `circle` is independent of both.
 */
export interface HeadGeometry {
  readonly polygon?: readonly Point2D[];
  readonly lines?: readonly ArrowSegment[];
  readonly circle?: ArrowCircle;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Head half-length. @see skin/rose/AbstractComponentRoseArrow.java:54 */
export const ARROW_DELTA_X = 10;

/** Head half-width. @see skin/rose/AbstractComponentRoseArrow.java:55 */
export const ARROW_DELTA_Y = 4;

/**
 * How far the "nice arrow" notch cuts into the head's base — `ArrowPart.FULL`
 * only, and only when `niceArrow`, which is `param.strictUmlStyle() == false`
 * (`skin/rose/Rose.java:296` self, `:340` flat), i.e. on unless the diagram
 * sets `skinparam style strictuml` (`skin/SkinParam.java:964-966`).
 * @see skin/rose/ComponentRoseArrow.java:287,307
 */
export const NICE_ARROW_INSET = 4;

/** Diameter of the `o` circle. @see skin/rose/ComponentRoseArrow.java:80 */
export const DIAM_CIRCLE = 8;

/**
 * `o` circle stroke thickness, and the gap it opens against the head.
 * @see skin/rose/ComponentRoseArrow.java:81
 */
export const THIN_CIRCLE = 1.5;

/** Tip-to-saltire clearance. @see skin/rose/ComponentRoseArrow.java:79 */
export const SPACE_CROSS_X = 6;

/**
 * How far a circle pushes its own head off the tip.
 * @see skin/rose/ComponentRoseArrow.java:206,243
 */
const CIRCLE_HEAD_SHIFT = DIAM_CIRCLE / 2 + THIN_CIRCLE;

/**
 * `drawDressing1`'s circle, as a centre: top-left
 * `(-diamCircle / 2 - thinCircle, -diamCircle / 2 - thinCircle / 2)` plus
 * `diamCircle / 2` on both axes gives `(-thinCircle, -thinCircle / 2)`.
 * @see skin/rose/ComponentRoseArrow.java:202-204
 */
const CIRCLE_REVERSE_SIDE: ArrowCircle = {
  cx: -THIN_CIRCLE,
  cy: -THIN_CIRCLE / 2,
  d: DIAM_CIRCLE,
  thickness: THIN_CIRCLE,
};

/**
 * `drawDressing2`'s circle, as a centre: top-left
 * `(-diamCircle / 2 + thinCircle, -diamCircle / 2 - thinCircle / 2)` gives
 * `(+thinCircle, -thinCircle / 2)`. The sign flip on `x` against the
 * dressing1 circle is upstream's, not a transcription slip.
 * @see skin/rose/ComponentRoseArrow.java:240-241
 */
const CIRCLE_NORMAL_SIDE: ArrowCircle = {
  cx: THIN_CIRCLE,
  cy: -THIN_CIRCLE / 2,
  d: DIAM_CIRCLE,
  thickness: THIN_CIRCLE,
};

// ---------------------------------------------------------------------------
// Translation helpers
// ---------------------------------------------------------------------------

/** `UPolygon#addPoint` / `ULine`'s (x, y) pair, as a `Point2D`. */
function pt(x: number, y: number): Point2D {
  return { x, y };
}

/**
 * Rotate about the tip, THEN shift along x — the order upstream imposes: it
 * rotates the shape (`:228,265`) and draws it into a `ug` already translated
 * by the circle's push-off (`:206,243`). The rotation is
 * `XAffineTransform.getRotateInstance`'s `(cos, sin, -sin, cos, 0, 0)`, i.e.
 * `x' = x·cos − y·sin`, `y' = x·sin + y·cos`, about the tip-local origin.
 * @see klimt/awt/XAffineTransform.java:110-114
 * @see klimt/shape/UPolygon.java:113-117
 * @see klimt/shape/ULine.java:59-65
 */
function place(p: Point2D, theta: number, dx: number): Point2D {
  if (theta === 0) return pt(p.x + dx, p.y);
  const cos = Math.cos(theta);
  const sin = Math.sin(theta);
  return pt(p.x * cos - p.y * sin + dx, p.x * sin + p.y * cos);
}

function placePoints(points: readonly Point2D[], theta: number, dx: number): Point2D[] {
  return points.map((p) => place(p, theta, dx));
}

function placeSegments(segs: readonly ArrowSegment[], theta: number, dx: number): ArrowSegment[] {
  return segs.map(([a, b]) => [place(a, theta, dx), place(b, theta, dx)]);
}

// ---------------------------------------------------------------------------
// Inclination — one stored offset, resolved per side
// ---------------------------------------------------------------------------

/**
 * `ArrowConfiguration#getInclination1` — the stored offset reaches the TAIL
 * dressing only when the head side carries nothing that would slope instead.
 * An absent `inclination` is upstream's 0.
 * @see skin/ArrowConfiguration.java:285-289
 */
export function inclination1Of(configuration: ArrowConfiguration): number {
  const head = configuration.dressing2.head;
  if (head === 'NONE' || head === 'CROSSX') return configuration.inclination ?? 0;
  return 0;
}

/**
 * `ArrowConfiguration#getInclination2`. Upstream's second test reads
 * `NORMAL || NORMAL` (`:294`) — the same member twice — so ASYNC is the only
 * head that falls through to 0. Kept as two branches, as upstream writes it.
 * @see skin/ArrowConfiguration.java:291-297
 */
export function inclination2Of(configuration: ArrowConfiguration): number {
  const inclination = configuration.inclination ?? 0;
  const head = configuration.dressing1.head;
  if (head === 'NONE' || head === 'CROSSX') return inclination;
  if (head === 'NORMAL') return inclination;
  return 0;
}

/**
 * The tail side's rotation, `atan2` over the FULL component width `lenFull`
 * (`:98`) rather than the trimmed line. The two sides differ in sign because
 * their heads point opposite ways: `drawDressing1` negates, `drawDressing2`
 * does not. Both arguments are lengths in one unit, so scaling the pair
 * uniformly leaves the angle unchanged.
 * @see skin/rose/ComponentRoseArrow.java:212,216,228
 */
export function inclinationAngle1(inclination1: number, lenFull: number): number {
  return Math.atan2(-inclination1, lenFull);
}

/** The head side's rotation.
 *  @see skin/rose/ComponentRoseArrow.java:249,253,265 */
export function inclinationAngle2(inclination2: number, lenFull: number): number {
  return Math.atan2(inclination2, lenFull);
}

// ---------------------------------------------------------------------------
// The three polygon builders — kept separate by D3
// ---------------------------------------------------------------------------

/**
 * Head-side (dressing2) polygon: points left, tip at the origin.
 * @see skin/rose/ComponentRoseArrow.java:272-291
 */
function getPolygonNormal(part: ArrowPart, niceArrow: boolean): Point2D[] {
  const dx = ARROW_DELTA_X;
  const dy = ARROW_DELTA_Y;
  if (part === 'TOP_PART') return [pt(-dx, -dy), pt(0, 0), pt(-dx, 0)];
  if (part === 'BOTTOM_PART') return [pt(-dx, 0), pt(0, 0), pt(-dx, dy)];
  const polygon = [pt(-dx, -dy), pt(0, 0), pt(-dx, +dy)];
  if (niceArrow) polygon.push(pt(-dx + NICE_ARROW_INSET, 0));
  return polygon;
}

/**
 * Tail-side (dressing1) polygon: points right, tip at the origin.
 * @see skin/rose/ComponentRoseArrow.java:292-311
 */
function getPolygonReverse(part: ArrowPart, niceArrow: boolean): Point2D[] {
  const dx = ARROW_DELTA_X;
  const dy = ARROW_DELTA_Y;
  if (part === 'TOP_PART') return [pt(dx, -dy), pt(0, 0), pt(dx, 0)];
  if (part === 'BOTTOM_PART') return [pt(dx, 0), pt(0, 0), pt(dx, dy)];
  const polygon = [pt(dx, -dy), pt(0, 0), pt(dx, dy)];
  if (niceArrow) polygon.push(pt(dx - NICE_ARROW_INSET, 0));
  return polygon;
}

/**
 * Self-message polygon. Unlike the two flat builders it takes its direction
 * from `isReverseDefine()` rather than from which dressing is being drawn,
 * and its part variants nudge the whole shape back by one along `x`.
 * @see skin/rose/ComponentRoseSelfArrow.java:275-296
 */
function getPolygonSelf(
  part: ArrowPart,
  direction: number,
  niceArrow: boolean,
): Point2D[] {
  const x = direction * ARROW_DELTA_X;
  const dy = ARROW_DELTA_Y;
  if (part === 'TOP_PART') return [pt(x - 1, -dy), pt(-1, 0), pt(x - 1, 0)];
  if (part === 'BOTTOM_PART') return [pt(x - 1, 0), pt(-1, 0), pt(x - 1, dy)];
  const polygon = [pt(x, -dy), pt(0, 0), pt(x, dy)];
  if (niceArrow) polygon.push(pt(x - direction * NICE_ARROW_INSET, 0));
  return polygon;
}

// ---------------------------------------------------------------------------
// The line-pair builders
// ---------------------------------------------------------------------------

/**
 * Tail-side open (ASYNC) head: two strokes leaving the tip to the right.
 * `ULine` is a vector from the current origin, so both start at the tip.
 * `BOTTOM_PART` drops the upper stroke, `TOP_PART` the lower.
 * @see skin/rose/ComponentRoseArrow.java:209-217
 */
function asyncLinesReverse(part: ArrowPart): ArrowSegment[] {
  const o = pt(0, 0);
  const lines: ArrowSegment[] = [];
  if (part !== 'BOTTOM_PART')
    lines.push([o, pt(ARROW_DELTA_X, -ARROW_DELTA_Y)]);
  if (part !== 'TOP_PART') lines.push([o, pt(ARROW_DELTA_X, ARROW_DELTA_Y)]);
  return lines;
}

/**
 * Head-side open (ASYNC) head: two strokes leaving the tip to the left.
 * @see skin/rose/ComponentRoseArrow.java:246-254
 */
function asyncLinesNormal(part: ArrowPart): ArrowSegment[] {
  const o = pt(0, 0);
  const dx = -ARROW_DELTA_X;
  const lines: ArrowSegment[] = [];
  if (part !== 'BOTTOM_PART') lines.push([o, pt(dx, -ARROW_DELTA_Y)]);
  if (part !== 'TOP_PART') lines.push([o, pt(dx, ARROW_DELTA_Y)]);
  return lines;
}

/**
 * Tail-side `x` saltire, `spaceCrossX` right of the tip.
 * @see skin/rose/ComponentRoseArrow.java:218-223
 */
function crossxLinesReverse(): ArrowSegment[] {
  const dx = ARROW_DELTA_X;
  const half = dx / 2;
  const x = SPACE_CROSS_X;
  return [
    [pt(x, -half), pt(x + dx, -half + dx)],
    [pt(x, half), pt(x + dx, half - dx)],
  ];
}

/**
 * Head-side `x` saltire, `spaceCrossX` left of the tip.
 * @see skin/rose/ComponentRoseArrow.java:255-260
 */
function crossxLinesNormal(): ArrowSegment[] {
  const dx = ARROW_DELTA_X;
  const half = dx / 2;
  const x = -SPACE_CROSS_X - dx;
  return [
    [pt(x, -half), pt(x + dx, -half + dx)],
    [pt(x, half), pt(x + dx, half - dx)],
  ];
}

// ---------------------------------------------------------------------------
// Head dispatch
// ---------------------------------------------------------------------------

/** `drawDressing2`'s head branch, rotated by `theta` then shifted by `dx`.
 *  The saltire passes 0: upstream never rotates it (`:255-260`). */
function normalSideShape(dressing: ArrowDressing, niceArrow: boolean, dx: number, theta: number): HeadGeometry {
  if (dressing.head === 'ASYNC')
    return { lines: placeSegments(asyncLinesNormal(dressing.part), theta, dx) };
  if (dressing.head === 'CROSSX')
    return { lines: placeSegments(crossxLinesNormal(), 0, dx) };
  if (dressing.head === 'NORMAL')
    return { polygon: placePoints(getPolygonNormal(dressing.part, niceArrow), theta, dx) };
  return {};
}

/** `drawDressing1`'s head branch; the saltire again passes 0 (`:218-223`). */
function reverseSideShape(dressing: ArrowDressing, niceArrow: boolean, dx: number, theta: number): HeadGeometry {
  if (dressing.head === 'ASYNC')
    return { lines: placeSegments(asyncLinesReverse(dressing.part), theta, dx) };
  if (dressing.head === 'CROSSX')
    return { lines: placeSegments(crossxLinesReverse(), 0, dx) };
  if (dressing.head === 'NORMAL')
    return { polygon: placePoints(getPolygonReverse(dressing.part, niceArrow), theta, dx) };
  return {};
}

/**
 * Head-side (`dressing2`) geometry — a left-pointing head with its tip at the
 * origin. A `CIRCLE` decoration draws its circle right of the tip and pushes
 * the head left by `diamCircle / 2 + thinCircle` UNCONDITIONALLY: unlike
 * `drawDressing1`, `drawDressing2` applies that translate at `:243`, before
 * it has looked at the head at all.
 * @see skin/rose/ComponentRoseArrow.java:235-270
 */
export function headGeometryNormalSide(
  dressing: ArrowDressing,
  decoration: ArrowDecoration,
  niceArrow: boolean,
  theta: number,
): HeadGeometry {
  if (decoration !== 'CIRCLE') return normalSideShape(dressing, niceArrow, 0, theta);
  return {
    ...normalSideShape(dressing, niceArrow, -CIRCLE_HEAD_SHIFT, theta),
    circle: CIRCLE_NORMAL_SIDE,
  };
}

/**
 * Tail-side (`dressing1`) geometry — a right-pointing head with its tip at
 * the origin. A `CIRCLE` decoration draws its circle left of the tip and
 * pushes the head right by `diamCircle / 2 + thinCircle` — but NOT for a
 * `CROSSX` head, which upstream exempts explicitly at `:205-206`.
 * @see skin/rose/ComponentRoseArrow.java:199-233
 */
export function headGeometryReverseSide(
  dressing: ArrowDressing,
  decoration: ArrowDecoration,
  niceArrow: boolean,
  theta: number,
): HeadGeometry {
  if (decoration !== 'CIRCLE') return reverseSideShape(dressing, niceArrow, 0, theta);
  let dx = CIRCLE_HEAD_SHIFT;
  if (dressing.head === 'CROSSX') dx = 0;
  return {
    ...reverseSideShape(dressing, niceArrow, dx, theta),
    circle: CIRCLE_REVERSE_SIDE,
  };
}

/**
 * `ArrowConfiguration#getPart` — dressing2's part wins unless its head is
 * NONE. The self builder reads this configuration-level part rather than a
 * per-dressing one, which is why this exists.
 * @see skin/ArrowConfiguration.java:221-226
 */
function configurationPart(configuration: ArrowConfiguration): ArrowPart {
  if (configuration.dressing2.head !== 'NONE')
    return configuration.dressing2.part;
  return configuration.dressing1.part;
}

/**
 * Self-message head geometry. Both of a self message's heads come from this
 * one polygon — `drawRightSide` draws it twice, translated to `x1` and to
 * `x2` (`ComponentRoseSelfArrow.java:147-149,167-169`) — so the direction is
 * the configuration's `isReverseDefine()`, not the side being drawn.
 * @see skin/rose/ComponentRoseSelfArrow.java:275-296
 */
export function headGeometrySelf(
  configuration: ArrowConfiguration,
  reverseDefine: boolean,
  niceArrow: boolean,
): HeadGeometry {
  let direction = 1;
  if (reverseDefine) direction = -1;
  return {
    polygon: getPolygonSelf(
      configurationPart(configuration),
      direction,
      niceArrow,
    ),
  };
}
