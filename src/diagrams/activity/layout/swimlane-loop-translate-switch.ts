/**
 * `switch`'s two translatable cross-swimlane shapes (mission
 * `activity-divergence-drive-2`, T1p-e), dispatched from
 * `swimlane-loop-translate.ts#routeLoopTranslate`. Applies the lane deltas
 * (`dx1`/`dx2`, same X-only translate every `LoopTranslate` shape receives)
 * to the untranslated `p1`/`p2` and defers to `switch-cross-shapes.ts`'s
 * pure point math -- this module's only job is the dx-application +
 * `ActivityEdgeGeo` rebuild every sibling `swimlane-loop-translate-*.ts`
 * module already does (`routeWhileBack`, `routeRepeatOut`, etc.).
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java:297-404
 */

import type { ActivityEdgeGeo } from '../activity-geometry.types.js';
import {
  routeSwitchHorizontalThenVerticalCross,
  routeSwitchVerticalThenHorizontalCross,
} from './switch-cross-shapes.js';
import type {
  LoopRouteResult,
  SwitchHorizontalThenVerticalCrossLoop,
  SwitchVerticalThenHorizontalCrossLoop,
} from './swimlane-loop-translate.js';

export function routeSwitchHorizontalThenVertical(
  loop: SwitchHorizontalThenVerticalCrossLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const mp1a = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2b = { x: loop.p2.x + dx2, y: loop.p2.y };
  const { width, height } = loop.diamond1;
  const points = routeSwitchHorizontalThenVerticalCross(mp1a, mp2b, { halfWidth: width / 2, halfHeight: height / 2 });
  return { edges: [{ ...edge, points }], reservations: [] };
}

export function routeSwitchVerticalThenHorizontal(
  loop: SwitchVerticalThenHorizontalCrossLoop,
  edge: ActivityEdgeGeo,
  dx1: number,
  dx2: number,
): LoopRouteResult {
  const mp1a = { x: loop.p1.x + dx1, y: loop.p1.y };
  const mp2b = { x: loop.p2.x + dx2, y: loop.p2.y };
  const { width, height } = loop.diamond2;
  const { points } = routeSwitchVerticalThenHorizontalCross(mp1a, mp2b, {
    halfWidth: width / 2,
    halfHeight: height / 2,
  });
  return { edges: [{ ...edge, points }], reservations: [] };
}
