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
function rightInsets(msg: MessageGeo, configuration: ArrowConfiguration, origin: number, k: number): RightInsets {
  const { dressing1, dressing2 } = configuration;
  let x1 = (msg.fromX - origin) / k;
  let x2 = ((msg.selfReturnX ?? msg.fromX) - origin) / k;
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

/**
 * The right-hand loop's `o` circles: stroked at `thinCircle`, top-left
 * `(x1 + 1 - diamCircle / 2 - thinCircle, textHeight - diamCircle / 2 -
 * thinCircle / 2)` and `(x2 - diamCircle / 2 - thinCircle, textHeight +
 * arrowHeight - diamCircle / 2 - thinCircle / 2)`; the centre is `diamCircle
 * / 2` on from there.
 * @see skin/rose/ComponentRoseSelfArrow.java:94-112
 */
function rightCircles(
  msg: MessageGeo,
  configuration: ArrowConfiguration,
  ins: RightInsets,
  origin: number,
  paint: SequencePaint,
  k: number,
): string {
  const circle = { cx: 0, cy: 0, d: DIAM_CIRCLE, thickness: THIN_CIRCLE } as const;
  const yBottom = msg.y + SELF_LOOP_HEIGHT * k;
  let out = '';
  if (configuration.decoration1 === 'CIRCLE') {
    const centre: Point2D = { x: origin + (ins.circle1 + 1 - THIN_CIRCLE) * k, y: msg.y - (THIN_CIRCLE / 2) * k };
    out += renderArrowHead({ circle }, 'NONE', centre, paint, k);
  }
  if (configuration.decoration2 === 'CIRCLE') {
    const centre: Point2D = { x: origin + (ins.circle2 - THIN_CIRCLE) * k, y: yBottom - (THIN_CIRCLE / 2) * k };
    out += renderArrowHead({ circle }, 'NONE', centre, paint, k);
  }
  return out;
}

/** `:131-149`: the saltire (square to the component origin, not to `x1`),
 *  else the open pair, else the polygon, all at the outgoing segment's end. */
function rightDressing1(
  configuration: ArrowConfiguration,
  ins: RightInsets,
  origin: number,
  y: number,
  paint: SequencePaint,
  theme: ScaledTheme,
): string {
  const { dressing1 } = configuration;
  const niceArrow = niceArrowOf(theme);
  const k = theme.scaleK;
  const at = (x: number): Point2D => ({ x: origin + x * k, y });
  if (dressing1.head === 'CROSSX')
    return renderArrowHead(headGeometryReverseSide(dressing1, 'NONE', niceArrow, 0), 'CROSSX', at(0), paint, k);
  if (dressing1.head === 'ASYNC')
    return renderArrowHead(selfAsyncLines1(configurationPart(configuration)), 'ASYNC', at(ins.x1), paint, k);
  if (dressing1.head === 'NORMAL')
    return renderArrowHead(headGeometrySelf(configuration, false, niceArrow), 'NORMAL', at(ins.x1), paint, k);
  return '';
}

/** `:152-173`: the same three forms at the foot of the returning segment. */
function rightDressing2(
  configuration: ArrowConfiguration,
  ins: RightInsets,
  origin: number,
  y: number,
  paint: SequencePaint,
  theme: ScaledTheme,
): string {
  const { dressing2 } = configuration;
  const niceArrow = niceArrowOf(theme);
  const k = theme.scaleK;
  const at = (x: number): Point2D => ({ x: origin + x * k, y });
  if (dressing2.head === 'CROSSX')
    return renderArrowHead(headGeometryReverseSide(dressing2, 'NONE', niceArrow, 0), 'CROSSX', at(0), paint, k);
  if (dressing2.head === 'ASYNC')
    return renderArrowHead(headGeometryReverseSide(dressing2, 'NONE', niceArrow, 0), 'ASYNC', at(ins.x2Head), paint, k);
  if (dressing2.head === 'NORMAL')
    return renderArrowHead(headGeometrySelf(configuration, false, niceArrow), 'NORMAL', at(ins.x2Head), paint, k);
  return '';
}

/**
 * `ComponentRoseSelfArrow#drawRightSide` (`:91-174`): the circles, the three
 * strokes, then `dressing1`, then `dressing2` -- the order upstream draws
 * them in. The strokes run `x1 -> xRight` at the top, down the vertical, and
 * `x2 -> xRight` at the foot; `xRight` is the layout's `toX`.
 */
export function renderSelfMessageRight(msg: MessageGeo, configuration: ArrowConfiguration, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const paint = messagePaintOf(msg);
  const stroke = shaftStyleOf(paint, k);
  // The component origin: `xRight = arrowWidth - 3` from it (`:59-60`), and
  // the layout carries `xRight` as `toX`.
  const origin = msg.toX - SELF_ARROW_X_RIGHT * k;
  const ins = rightInsets(msg, configuration, origin, k);
  const yTop = msg.y;
  const yBottom = yTop + SELF_LOOP_HEIGHT * k;
  const xRight = msg.toX;
  const x1 = origin + ins.x1 * k;
  const x2 = origin + ins.x2 * k;
  return (
    rightCircles(msg, configuration, ins, origin, paint, k) +
    line(x1, yTop, xRight, yTop, stroke) +
    line(xRight, yTop, xRight, yBottom, stroke) +
    line(x2, yBottom, xRight, yBottom, stroke) +
    rightDressing1(configuration, ins, origin, yTop, paint, theme) +
    rightDressing2(configuration, ins, origin, yBottom, paint, theme)
  );
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

import type { Point2D } from '../../core/klimt/UTranslate.js';
import { line } from '../../core/svg.js';
import type { MessageGeo } from './ast.js';
import type { ScaledTheme } from './scale-geo.js';
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
import type { SequencePaint } from './sequence-skin-param.js';
import { niceArrowOf, renderArrowHead } from './renderer-arrowhead-glyph.js';
import { shaftStyleOf } from './renderer-arrowhead.js';
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
 * The mirrored loop, circles first, then the three strokes, then the head at
 * each end (`:202-272`). Heads are drawn through {@link renderArrowHead},
 * whose tip-local geometry is unscaled and scaled there.
 */
export function renderSelfMessageLeft(msg: MessageGeo, configuration: ArrowConfiguration, theme: ScaledTheme): string {
  const k = theme.scaleK;
  const paint = messagePaintOf(msg);
  const stroke = shaftStyleOf(paint, k);
  const { dressing1, dressing2 } = configuration;
  const niceArrow = niceArrowOf(theme);

  const edge = msg.toX + SELF_ARROW_X_RIGHT * k;
  const base = { x1: (edge - msg.fromX) / k, x2: (edge - (msg.selfReturnX ?? msg.fromX)) / k };
  const insets = adjustInsets(base, configuration, msg.selfLevel ?? 0);
  const yTop = msg.y;
  const yBottom = yTop + SELF_LOOP_HEIGHT * k;
  const at = (inset: number): number => edge - inset * k;

  // `:206-217`: the circles, centre = top-left + `diamCircle / 2`.
  const circle = { cx: 0, cy: 0, d: DIAM_CIRCLE, thickness: THIN_CIRCLE } as const;
  let out = '';
  if (configuration.decoration1 === 'CIRCLE') {
    const centre: Point2D = { x: at(insets.circle1 - 1 + THIN_CIRCLE), y: yTop - (THIN_CIRCLE / 2) * k };
    out += renderArrowHead({ circle }, 'NONE', centre, paint, k);
  }
  if (configuration.decoration2 === 'CIRCLE') {
    const centre: Point2D = { x: at(insets.circle2 - 2 + THIN_CIRCLE), y: yBottom - (THIN_CIRCLE / 2) * k };
    out += renderArrowHead({ circle }, 'NONE', centre, paint, k);
  }

  // `:228-246`: `x1 += 1`, and the returning stroke gives up the pixel the
  // FULL NORMAL head will take back (`extraline`).
  const extraline = dressing2.part === 'FULL' && dressing2.head === 'NORMAL' ? 1 : 0;
  const x1 = insets.x1 + 1;
  const x2 = insets.x2;
  const vline = edge - SELF_ARROW_X_RIGHT * k;
  out +=
    line(vline, yTop, at(x1), yTop, stroke) +
    line(vline, yTop, vline, yBottom, stroke) +
    line(vline, yBottom, at(x2 + extraline), yBottom, stroke);

  // `:248-251`: past the strokes, the head's own offsets.
  const x2Head = x2 + extraline + (dressing2.head === 'ASYNC' ? 1 : 0);
  if (dressing1.head === 'CROSSX') {
    out += renderArrowHead(CROSS_GEOMETRY, 'CROSSX', { x: at(x1 + SPACE_CROSS_X / 2), y: yTop }, paint, k);
  } else if (dressing1.head === 'NORMAL') {
    // `:253-256`: translated by `prefTextWidth - x1` and then by `x1` again.
    out += renderArrowHead(headGeometrySelf(configuration, true, niceArrow), 'NORMAL', { x: edge, y: yTop }, paint, k);
  }
  const tip2: Point2D = { x: at(x2Head), y: yBottom };
  if (dressing2.head === 'CROSSX') {
    out += renderArrowHead(CROSS_GEOMETRY, 'CROSSX', { x: at(x2Head + SPACE_CROSS_X / 2), y: yBottom }, paint, k);
  } else if (dressing2.head === 'ASYNC') {
    out += renderArrowHead(headGeometryNormalSide(dressing2, 'NONE', niceArrow, 0), 'ASYNC', tip2, paint, k);
  } else if (dressing2.head === 'NORMAL') {
    out += renderArrowHead(headGeometrySelf(configuration, true, niceArrow), 'NORMAL', tip2, paint, k);
  }
  return out;
}
