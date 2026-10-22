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
  headGeometrySelf,
} from './sequence-arrowhead.js';
import { messagePaintOf } from './sequence-arrow-paint.js';
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
