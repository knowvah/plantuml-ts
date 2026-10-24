/** `drawRightSide`'s two horizontal insets, from the component origin, in
 *  upstream's unscaled units: `x1` the outgoing segment, `x2` the returning
 *  one, and `x2Head` where its head sits once the ASYNC pixel is given back. */
interface RightInsets {
  readonly circle1: number;
  readonly circle2: number;
  readonly x1: number;
  readonly x2: number;
  readonly x2Head: number;
}

/**
 * `drawRightSide:93-123` -- the insets the decorations and saltires push the
 * two strokes' ends by, in upstream's order. `circle1`/`circle2` are read
 * BEFORE those pushes (`:96-98,106-108`); the saltire adds `2 * spaceCrossX`
 * to its own end (`:114-120`) and an ASYNC `dressing2` pulls the shaft one
 * pixel left of its head (`:122-123`, restored at `:128-129`).
 * @see skin/rose/ComponentRoseSelfArrow.java:92-129
 */
function rightInsets(msg: MessageGeo, configuration: ArrowConfiguration, origin: number): RightInsets {
  const { dressing1, dressing2 } = configuration;
  let x1 = msg.fromX - origin;
  let x2 = (msg.selfReturnX ?? msg.fromX) - origin;
  const circle1 = x1;
  const circle2 = x2;
  if (configuration.decoration1 === 'CIRCLE') {
    x1 += DIAM_CIRCLE / 2 + THIN_CIRCLE + 1;
    x1 -= dressing1.head === 'NONE' ? THIN_CIRCLE + 1 : 0;
  }
  if (configuration.decoration2 === 'CIRCLE') x2 += DIAM_CIRCLE / 2 + THIN_CIRCLE;
  if (dressing1.head === 'CROSSX') x1 += 2 * SPACE_CROSS_X;
  if (dressing2.head === 'CROSSX') x2 += 2 * SPACE_CROSS_X;
  const x2Head = x2;
  if (dressing2.head === 'ASYNC') x2 -= 1;
  return { circle1, circle2, x1, x2, x2Head };
}

/** What a self loop's ends draw with: the arrow ink and the `niceArrow`
 *  constructor argument of its polygon (`Rose.java:296`). */
interface SelfInk extends HeadInk {
  readonly niceArrow: boolean;
}

/**
 * The right-hand loop's `o` circles, drawn on `ug2` (the stroked graphic):
 * top-left `(x1 + 1 - diamCircle / 2 - thinCircle, textHeight - diamCircle /
 * 2 - thinCircle / 2)` and `(x2 - diamCircle / 2 - thinCircle, textHeight +
 * arrowHeight - diamCircle / 2 - thinCircle / 2)`; the centre is `diamCircle
 * / 2` on from there. `textHeight` is the arrow row, the origin's y.
 * @see skin/rose/ComponentRoseSelfArrow.java:94-112
 */
function drawRightCircles(ug2: UGraphic, configuration: ArrowConfiguration, ins: RightInsets, ink: HeadInk): void {
  const circle = { cx: 0, cy: 0, d: DIAM_CIRCLE, thickness: THIN_CIRCLE } as const;
  if (configuration.decoration1 === 'CIRCLE') {
    const centre: Point2D = { x: ins.circle1 + 1 - THIN_CIRCLE, y: -(THIN_CIRCLE / 2) };
    drawArrowHead(ug2, { circle }, 'NONE', centre, ink);
  }
  if (configuration.decoration2 === 'CIRCLE') {
    const centre: Point2D = { x: ins.circle2 - THIN_CIRCLE, y: SELF_LOOP_HEIGHT - THIN_CIRCLE / 2 };
    drawArrowHead(ug2, { circle }, 'NONE', centre, ink);
  }
}

/** `:131-149`: the saltire (square to the component origin, not to `x1`),
 *  else the open pair, else the polygon, all at the outgoing segment's end. */
function drawRightDressing1(ug: UGraphic, configuration: ArrowConfiguration, ins: RightInsets, ink: SelfInk): void {
  const { dressing1 } = configuration;
  const at = (x: number): Point2D => ({ x: x, y: 0 });
  if (dressing1.head === 'CROSSX')
    drawArrowHead(ug, headGeometryReverseSide(dressing1, 'NONE', ink.niceArrow, 0), 'CROSSX', at(0), ink);
  else if (dressing1.head === 'ASYNC')
    drawArrowHead(ug, selfAsyncLines1(configurationPart(configuration)), 'ASYNC', at(ins.x1), ink);
  else if (dressing1.head === 'NORMAL')
    drawArrowHead(ug, headGeometrySelf(configuration, false, ink.niceArrow), 'NORMAL', at(ins.x1), ink);
}

/** `:152-173`: the same three forms at the foot of the returning segment. */
function drawRightDressing2(ug: UGraphic, configuration: ArrowConfiguration, ins: RightInsets, ink: SelfInk): void {
  const { dressing2 } = configuration;
  const at = (x: number): Point2D => ({ x: x, y: SELF_LOOP_HEIGHT });
  if (dressing2.head === 'CROSSX')
    drawArrowHead(ug, headGeometryReverseSide(dressing2, 'NONE', ink.niceArrow, 0), 'CROSSX', at(0), ink);
  else if (dressing2.head === 'ASYNC')
    drawArrowHead(ug, headGeometryReverseSide(dressing2, 'NONE', ink.niceArrow, 0), 'ASYNC', at(ins.x2Head), ink);
  else if (dressing2.head === 'NORMAL')
    drawArrowHead(ug, headGeometrySelf(configuration, false, ink.niceArrow), 'NORMAL', at(ins.x2Head), ink);
}

/**
 * `ComponentRoseSelfArrow#drawRightSide` (`:91-174`): the circles, the three
 * strokes, then `dressing1`, then `dressing2` -- the order upstream draws
 * them in. The strokes run `x1 -> xRight` at the top, down the vertical, and
 * `x2 -> xRight` at the foot; `xRight` is the layout's `toX`.
 *
 * ``java
 * ug = ug.apply(getForegroundColor());                                  // :80
 * final UGraphic ug2 = getArrowConfiguration().applyStroke(ug);         // :81
 * ug2.apply(new UTranslate(x1, textHeight)).draw(ULine.hline(xRight - x1));            // :124
 * ug2.apply(new UTranslate(xRight, textHeight)).draw(ULine.vline(arrowHeight));        // :125
 * ug2.apply(new UTranslate(x2, textHeight + arrowHeight)).draw(ULine.hline(xRight - x2)); // :126
 * ``
 *
 * The component's origin is `(msg.toX - xRight, msg.y)`: the tile's translates
 * and `textHeight` are one translate here (layout resolved their sum into
 * `msg.y`), so every `textHeight` above is 0 in this frame.
 */
export function drawSelfMessageRight(
  ug: UGraphic,
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: PageTheme,
): void {
  const paint = messagePaintOf(msg);
  const ink: SelfInk = { paint, niceArrow: niceArrowOf(theme) };
  // The component origin: `xRight = arrowWidth - 3` from it (`:59-60`), and
  // the layout carries `xRight` as `toX`.
  const origin = msg.toX - SELF_ARROW_X_RIGHT;
  const ins = rightInsets(msg, configuration, origin);
  const component = ug.apply(new UTranslate(origin, msg.y)).apply(arrowFore(paint));
  const ug2 = component.apply(strokeOf(paint));
  const xRight = SELF_ARROW_X_RIGHT;
  drawRightCircles(ug2, configuration, ins, ink);
  ug2.apply(new UTranslate(ins.x1, 0)).draw(ULine.hline(xRight - ins.x1));
  ug2.apply(new UTranslate(xRight, 0)).draw(ULine.vline(SELF_LOOP_HEIGHT));
  ug2.apply(new UTranslate(ins.x2, SELF_LOOP_HEIGHT)).draw(ULine.hline(xRight - ins.x2));
  drawRightDressing1(component, configuration, ins, ink);
  drawRightDressing2(component, configuration, ins, ink);
}

/**
 * The mirrored self loop: `ComponentRoseSelfArrow#drawLeftSide`
 * (`:176-273`), what a self message written `A <- A` draws
 * (`isReverseDefine()`, `:83-84`). Split out of `renderer-message.ts`, which
 * keeps the right-hand loop, the way upstream splits the two into
 * `drawRightSide` and `drawLeftSide`.
 *
 * Everything upstream measures from the component's right edge
 * (`prefTextWidth`), so the layout hands this module three absolute numbers
 * and a level instead of an origin
 * (`sequence-layout-message-self.ts#liveOffsetSelfReverse`):
 * `toX` the vertical stroke, `edge = toX + xRight`, and the anchors
 * `edge - x1` / `edge - x2` in `fromX` / `selfReturnX`.
 */

import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UTranslate, type Point2D } from '../../core/klimt/UTranslate.js';
import { ULine } from '../../core/klimt/shape/ULine.js';
import type { MessageGeo } from './ast.js';
import type { PageTheme } from './renderer-ug.js';
import type { ArrowConfiguration, ArrowSegment, HeadGeometry } from './sequence-arrowhead.js';
import {
  ARROW_DELTA_X,
  DIAM_CIRCLE,
  SPACE_CROSS_X,
  THIN_CIRCLE,
  headGeometryNormalSide,
  headGeometryReverseSide,
} from './sequence-arrowhead.js';
import { configurationPart, headGeometrySelf, selfAsyncLines1 } from './sequence-arrowhead-self.js';
import { messagePaintOf } from './sequence-arrow-paint.js';
import { arrowFore, drawArrowHead, niceArrowOf, type HeadInk } from './renderer-arrowhead-glyph.js';
import { strokeOf } from './renderer-line-component.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { SELF_ARROW_X_RIGHT } from './sequence-layout-message-self.js';

/** `getArrowOnlyHeight` (`ComponentRoseSelfArrow.java:321-323`). */
const SELF_LOOP_HEIGHT = 13;

/** The saltire's pair of strokes, `spaceCrossX / 2` left of its tip
 *  (`:243-247,257-262`): `ULine(dx, dx)` from `-dx / 2` and `ULine(dx, -dx)`
 *  from `+dx / 2`. */
const CROSS_STROKES: readonly ArrowSegment[] = [
  [
    { x: 0, y: -ARROW_DELTA_X / 2 },
    { x: ARROW_DELTA_X, y: ARROW_DELTA_X / 2 },
  ],
  [
    { x: 0, y: ARROW_DELTA_X / 2 },
    { x: ARROW_DELTA_X, y: -ARROW_DELTA_X / 2 },
  ],
];

/** The two insets the loop's ends take, after `drawLeftSide:200-239`'s
 *  decoration and saltire adjustments, in upstream's order. */
interface LeftInsets {
  readonly x1: number;
  readonly x2: number;
  readonly circle1: number;
  readonly circle2: number;
}

/**
 * `drawLeftSide:177-239` up to the `x1 += 1`: `circle1`/`circle2` are the
 * insets the circles are positioned from, read BEFORE the adjustments that
 * follow them (`:202-215` then `:218-226`).
 */
function adjustInsets(base: { x1: number; x2: number }, configuration: ArrowConfiguration, level: number): LeftInsets {
  const { dressing1, dressing2 } = configuration;
  const extra = level * LIVE_DELTA_SIZE;
  let { x1, x2 } = base;
  const circle1 = x1;
  const circle2 = x2;
  if (configuration.decoration1 === 'CIRCLE') {
    x1 += DIAM_CIRCLE / 2 - THIN_CIRCLE;
    x1 += dressing1.head === 'NONE' ? THIN_CIRCLE : 0;
  }
  if (configuration.decoration2 === 'CIRCLE') x2 += DIAM_CIRCLE / 2 + THIN_CIRCLE;
  const crossIndent = SPACE_CROSS_X + (level > 0 ? extra : SPACE_CROSS_X);
  if (dressing1.head === 'CROSSX') x1 += crossIndent;
  if (dressing2.head === 'CROSSX') x2 += crossIndent;
  return { x1, x2, circle1, circle2 };
}

/** `HeadGeometry` for one saltire, tip at `edge - x - spaceCrossX / 2`. */
const CROSS_GEOMETRY: HeadGeometry = { lines: CROSS_STROKES };

/**
 * The mirrored loop's circles (`:206-217`), on `ug2`: the centre is the
 * top-left plus `diamCircle / 2`; `at(inset)` is `prefTextWidth - inset` in
 * the component's frame, whose origin is `edge`.
 * @see skin/rose/ComponentRoseSelfArrow.java:202-217
 */
function drawLeftCircles(ug2: UGraphic, configuration: ArrowConfiguration, insets: LeftInsets, ink: HeadInk): void {
  const circle = { cx: 0, cy: 0, d: DIAM_CIRCLE, thickness: THIN_CIRCLE } as const;
  if (configuration.decoration1 === 'CIRCLE') {
    const centre: Point2D = { x: -(insets.circle1 - 1 + THIN_CIRCLE), y: -(THIN_CIRCLE / 2) };
    drawArrowHead(ug2, { circle }, 'NONE', centre, ink);
  }
  if (configuration.decoration2 === 'CIRCLE') {
    const centre: Point2D = {
      x: -(insets.circle2 - 2 + THIN_CIRCLE),
      y: SELF_LOOP_HEIGHT - THIN_CIRCLE / 2,
    };
    drawArrowHead(ug2, { circle }, 'NONE', centre, ink);
  }
}

/** The heads at the two ends (`:248-272`): past the strokes, the head's own
 *  offsets. `x1` is the outgoing inset after its `+ 1`, `x2Head` the
 *  returning one after `extraline` and the ASYNC pixel. */
function drawLeftHeads(
  component: UGraphic,
  configuration: ArrowConfiguration,
  ends: { readonly x1: number; readonly x2Head: number },
  ink: SelfInk,
): void {
  const { dressing1, dressing2 } = configuration;
  const bottom = SELF_LOOP_HEIGHT;
  if (dressing1.head === 'CROSSX') {
    drawArrowHead(component, CROSS_GEOMETRY, 'CROSSX', { x: -(ends.x1 + SPACE_CROSS_X / 2), y: 0 }, ink);
  } else if (dressing1.head === 'NORMAL') {
    // `:253-256`: translated by `prefTextWidth - x1` and then by `x1` again.
    drawArrowHead(component, headGeometrySelf(configuration, true, ink.niceArrow), 'NORMAL', { x: 0, y: 0 }, ink);
  }
  const tip2: Point2D = { x: -ends.x2Head, y: bottom };
  if (dressing2.head === 'CROSSX') {
    const tip: Point2D = { x: -(ends.x2Head + SPACE_CROSS_X / 2), y: bottom };
    drawArrowHead(component, CROSS_GEOMETRY, 'CROSSX', tip, ink);
  } else if (dressing2.head === 'ASYNC') {
    drawArrowHead(component, headGeometryNormalSide(dressing2, 'NONE', ink.niceArrow, 0), 'ASYNC', tip2, ink);
  } else if (dressing2.head === 'NORMAL') {
    drawArrowHead(component, headGeometrySelf(configuration, true, ink.niceArrow), 'NORMAL', tip2, ink);
  }
}

/**
 * The mirrored loop, circles first, then the three strokes, then the head at
 * each end (`:202-272`). Heads are drawn through {@link drawArrowHead},
 * whose tip-local geometry is the page's own.
 *
 * ``java
 * ug2.apply(new UTranslate(prefTextWidth - xRight, textHeight)).draw(ULine.hline(xRight - x1));  // :228
 * ug2.apply(new UTranslate(prefTextWidth - xRight, textHeight)).draw(ULine.vline(arrowHeight));  // :229
 * ug2.apply(new UTranslate(prefTextWidth - xRight, textHeight + arrowHeight))
 *     .draw(ULine.hline(xRight - x2 - extraline));                                                // :230
 * ``
 *
 * The component's origin is `(edge, msg.y)` (`edge = prefTextWidth`), so a
 * point `prefTextWidth - n` is `-n` in this frame.
 */
export function drawSelfMessageLeft(
  ug: UGraphic,
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  theme: PageTheme,
): void {
  const paint = messagePaintOf(msg);
  const ink: SelfInk = { paint, niceArrow: niceArrowOf(theme) };
  const { dressing2 } = configuration;
  const edge = msg.toX + SELF_ARROW_X_RIGHT;
  const base = { x1: edge - msg.fromX, x2: edge - (msg.selfReturnX ?? msg.fromX) };
  const insets = adjustInsets(base, configuration, msg.selfLevel ?? 0);
  const component = ug.apply(new UTranslate(edge, msg.y)).apply(arrowFore(paint));
  const ug2 = component.apply(strokeOf(paint));
  drawLeftCircles(ug2, configuration, insets, ink);

  // `:228-246`: `x1 += 1`, and the returning stroke gives up the pixel the
  // FULL NORMAL head will take back (`extraline`).
  const extraline = dressing2.part === 'FULL' && dressing2.head === 'NORMAL' ? 1 : 0;
  const x1 = insets.x1 + 1;
  const x2 = insets.x2;
  const xRight = SELF_ARROW_X_RIGHT;
  const vline = new UTranslate(-xRight, 0);
  ug2.apply(vline).draw(ULine.hline(xRight - x1));
  ug2.apply(vline).draw(ULine.vline(SELF_LOOP_HEIGHT));
  ug2.apply(new UTranslate(-xRight, SELF_LOOP_HEIGHT)).draw(ULine.hline(xRight - x2 - extraline));
  drawLeftHeads(component, configuration, { x1, x2Head: x2 + extraline + (dressing2.head === 'ASYNC' ? 1 : 0) }, ink);
}
