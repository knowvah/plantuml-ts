/**
 * The self message's head geometry, split out of `sequence-arrowhead.ts` for
 * the 500-line cap (T7a, sdd2). Everything here is
 * `skin/rose/ComponentRoseSelfArrow.java`'s: its `getPolygon()` and the
 * `dressing1` open-head pair, which differs from the flat component's.
 */

import type { Point2D } from '../../core/klimt/UTranslate.js';
import type { ArrowConfiguration, ArrowPart, ArrowSegment, HeadGeometry } from './sequence-arrowhead.js';
import { ARROW_DELTA_X, ARROW_DELTA_Y, NICE_ARROW_INSET } from './sequence-arrowhead.js';

function pt(x: number, y: number): Point2D {
  return { x, y };
}

/**
 * Self-message polygon. Unlike the two flat builders it takes its direction
 * from `isReverseDefine()` rather than from which dressing is being drawn,
 * and its part variants nudge the whole shape back by one along `x`.
 * @see skin/rose/ComponentRoseSelfArrow.java:275-296
 */
function getPolygonSelf(part: ArrowPart, direction: number, niceArrow: boolean): Point2D[] {
  const x = direction * ARROW_DELTA_X;
  const dy = ARROW_DELTA_Y;
  if (part === 'TOP_PART') return [pt(x - 1, -dy), pt(-1, 0), pt(x - 1, 0)];
  if (part === 'BOTTOM_PART') return [pt(x - 1, 0), pt(-1, 0), pt(x - 1, dy)];
  const polygon = [pt(x, -dy), pt(0, 0), pt(x, dy)];
  if (niceArrow) polygon.push(pt(x - direction * NICE_ARROW_INSET, 0));
  return polygon;
}

/**
 * `ArrowConfiguration#getPart` — dressing2's part wins unless its head is
 * NONE. The self builder reads this configuration-level part rather than a
 * per-dressing one, which is why this exists.
 * @see skin/ArrowConfiguration.java:221-226
 */
export function configurationPart(configuration: ArrowConfiguration): ArrowPart {
  if (configuration.dressing2.head !== 'NONE') return configuration.dressing2.part;
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
    polygon: getPolygonSelf(configurationPart(configuration), direction, niceArrow),
  };
}

/**
 * `dressing1`'s open head on the right-hand loop: both strokes leave the tip
 * to the RIGHT, `(dx, +dy)` first and `(dx, -dy)` second -- the flat
 * component's `drawDressing1` draws them the other way round with the
 * `BOTTOM_PART`/`TOP_PART` tests swapped (`ComponentRoseArrow.java:209-217`).
 * The part is `getPart()`, the configuration-level one.
 * @see skin/rose/ComponentRoseSelfArrow.java:138-146
 */
export function selfAsyncLines1(part: ArrowPart): HeadGeometry {
  const o = pt(0, 0);
  const lines: ArrowSegment[] = [];
  if (part !== 'BOTTOM_PART') lines.push([o, pt(ARROW_DELTA_X, ARROW_DELTA_Y)]);
  if (part !== 'TOP_PART') lines.push([o, pt(ARROW_DELTA_X, -ARROW_DELTA_Y)]);
  return { lines };
}
