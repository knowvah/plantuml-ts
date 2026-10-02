/**
 * Pure geometry for `FtileSwitchWithManyLinks`'s two cross-swimlane
 * connectors (D12, mission `activity-divergence-drive-2` T1p-e). NOT YET
 * WIRED into `tile-coordinates.ts`/`walk-switch.ts`'s live render path --
 * see this task's handback report for why (the second-pass lane-delta
 * dispatch these shapes need lives in `swimlane-loop-translate.ts`, outside
 * T1p-e's write-set). Parameterized so wiring is a pure call-site change
 * once that file is in scope: feed it the SAME `mp1a`/`mp2b` (lane-shifted
 * endpoints) `swimlane-placement.ts#routeEdge` already computes for every
 * other cross-lane shape.
 *
 * Both shapes read `p1.y`/diamond half-extents from the UNTRANSLATED frame
 * -- safe because the swimlane translate is X-only (`ConnectionCross
 * .java:63`'s `UTranslate.dx`, `shiftNode`'s own doc in
 * `swimlane-placement.ts`), so `p1.y === mp1a.y` and `p2.y === mp2b.y`
 * always; callers need not track the untranslated Y separately.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java:297-350
 *   -- `ConnectionHorizontalThenVerticalCrossSwimlane#drawTranslate`
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/cond/FtileSwitchWithManyLinks.java:352-404
 *   -- `ConnectionVerticalThenHorizontalCrossSwimlane#drawTranslate`
 */

import type { GPoint } from '../tiles/points.js';

/** `diamond1.calculateDimension(stringBounder)`'s own `width`/`height`,
 *  halved -- the only two fields `ConnectionHorizontalThenVerticalCrossSwimlane
 *  #drawTranslate` reads off `dimDiamond1` (`:328,331,333`). */
export interface DiamondHalfExtent {
  readonly halfWidth: number;
  readonly halfHeight: number;
}

/**
 * `ConnectionHorizontalThenVerticalCrossSwimlane#drawTranslate`
 * (`FtileSwitchWithManyLinks.java:318-339`): the snake starts at an X
 * offset from `mp1a` by diamond1's own half-width (toward `mp2b`'s side),
 * at diamond1's own half-height ABOVE `mp1a`'s Y (which equals the
 * untranslated `p1.y` -- the translate is X-only), then runs horizontally
 * to `mp2b`'s X at that same Y, then straight down into `mp2b`. No point is
 * pushed at `mp1a` itself -- the snake's own first point already carries
 * the half-width offset (`:331,333`, no prior `addPoint`).
 */
export function routeSwitchHorizontalThenVerticalCross(
  mp1a: GPoint,
  mp2b: GPoint,
  diamond1: DiamondHalfExtent,
): GPoint[] {
  const towardMp2b = mp1a.x > mp2b.x ? -diamond1.halfWidth : diamond1.halfWidth;
  const y = mp1a.y - diamond1.halfHeight;
  return [
    { x: mp1a.x + towardMp2b, y },
    { x: mp2b.x, y },
    mp2b,
  ];
}

/** `'left'` when `mp1a` sits to the RIGHT of `mp2b` (the approach enters
 *  diamond2 from its own right side, hence an arrow pointing left); mirrors
 *  `Direction.LEFT`/`Direction.RIGHT`
 *  (`FtileSwitchWithManyLinks.java:373-379`). */
export type SwitchCrossDirection = 'left' | 'right';

export interface SwitchVerticalThenHorizontalCrossResult {
  readonly points: GPoint[];
  readonly direction: SwitchCrossDirection;
}

/**
 * `ConnectionVerticalThenHorizontalCrossSwimlane#drawTranslate`
 * (`FtileSwitchWithManyLinks.java:363-393`): the snake starts AT `mp1a`
 * (unlike the horizontal-then-vertical sibling, `:383` DOES push it), runs
 * straight down to diamond2's own half-height below `mp2b`'s Y, then
 * horizontally into diamond2's own half-width offset from `mp2b`'s X --
 * approaching from the side the arrow points away from (`direction ===
 * 'left'` enters from diamond2's right edge, `+halfWidth`; `'right'` enters
 * from its left edge, `-halfWidth`).
 */
export function routeSwitchVerticalThenHorizontalCross(
  mp1a: GPoint,
  mp2b: GPoint,
  diamond2: DiamondHalfExtent,
): SwitchVerticalThenHorizontalCrossResult {
  const direction: SwitchCrossDirection = mp1a.x > mp2b.x ? 'left' : 'right';
  const y = mp2b.y + diamond2.halfHeight;
  const x = direction === 'left' ? mp2b.x + diamond2.halfWidth : mp2b.x - diamond2.halfWidth;
  return {
    points: [mp1a, { x: mp1a.x, y }, { x, y }],
    direction,
  };
}
