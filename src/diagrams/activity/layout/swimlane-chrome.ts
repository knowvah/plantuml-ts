/**
 * The swimlane title band and divider Y-range, derived from the placed lane
 * geometry. Moved out of `swimlane-placement.ts` (add4-T1g, that file's own
 * 500-line hook); `swimlane-placement.ts` re-exports both symbols so every
 * existing importer is untouched.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:358-367
 */

import type { SwimlaneBandGeo, SwimlaneDividerY, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Reservation } from './hexagon-reservations.js';

export interface SwimlaneChrome {
  swimlaneBand: SwimlaneBandGeo;
  swimlaneDividerY: SwimlaneDividerY;
}

/**
 * `Swimlanes#drawTitlesBackground`'s fixed left inset: the band is drawn at
 * `ug.apply(UTranslate.dx(5))` from the swimlane block's own origin
 * (`Swimlanes.java:366`) -- the SAME `5` as `getHalfMissingSpace`'s
 * `i == 0` branch (`:437-438`) and the `2 * 5` in the band's own width
 * (`:363`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:363-366
 */
export const SWIMLANE_BAND_INSET_X = 5;

/**
 * Derives the band rect and the divider Y-range from the already-placed
 * lane geometry (`placeSwimlanes`'s own `swimlanes` output) plus the
 * block's own top (`baseY`) and content bottom (`contentBottomY` -- the
 * real content's own bottom edge, `bounds.maxY` shifted by the SAME
 * `canvas-origin.ts#computeCanvasOrigin` translate `baseY` itself already
 * carries; see `canvas-origin.ts#finalizeGeometry`).
 *
 * Band x: `Swimlanes#drawTitlesBackground` (`:358-367`) draws at
 * `ug.apply(dx(5))` from the block origin -- NOT at the first divider.
 * The first divider's `UEmpty` sits at the first lane's CONTENT left minus
 * the divider width (`:331,345-346`), which is `(actualWidth -
 * contentWidth) / 2` right of the origin's `5`, so the two coincide only
 * when no `skinparam swimlaneWidth` floor (`:399-411`) pads the first
 * lane. `bandX` is that `origin + 5` in the caller's frame (pass 1:
 * `baseX + 5`; after compression/shift: the band reservation's own x,
 * {@link bandReservationX}). Absent, the band falls back to the first
 * divider -- the unfloored case, where both are equal.
 *
 * Band width: `swimlanesSpecial().last().getTranslate().getDx() - 2*5 - 1`
 * (`:363`), so the band's right edge is `lastSpecial.dx - 6` in the block
 * frame. The trailing special lane's `dx` is `xpos_n + (x1_n + 5) + min/2`
 * (`:426-428`; its MinMax is `getEmpty(true)`, `:119-120`, so its minX and
 * content width are 0 and its actual width is `min`), and its divider's
 * line sits at `xpos_n + x1_n + min/2` = the last lane's `x + width`
 * (`swimlane-lane-origins.ts#trailingDivider`). The right edge is
 * therefore `last.x + last.width - 1`, independent of `bandX`.
 * Verified against the pinned jar's `pakema-21-xema183` (band 20 / 348.275,
 * dividers 20 .. 369.275) and the add4-T1b `swimw-*` A/B fixtures (floored:
 * band 16 / 302.5, dividers 33 .. 319.5).
 *
 * Divider Y-range: `LaneDivider#drawU` draws one full-height `ULine` per
 * boundary, `height = dimensionFull.getHeight() + titleHeightTranslate
 * .getDy()` (`Swimlanes.java:423-424`) -- from the block's own top to its
 * content bottom.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:358-367
 */
export function computeSwimlaneChrome(
  swimlanes: readonly SwimlaneGeo[],
  baseY: number,
  titlesHeight: number,
  contentBottomY: number,
  bandX?: number,
): Partial<SwimlaneChrome> {
  // Same `size() > 1` guard as `resolveSwimlaneVertical`: a single lane
  // draws no chrome, so there is nothing to derive.
  if (swimlanes.length <= 1) return {};
  const first = swimlanes[0]!;
  const last = swimlanes[swimlanes.length - 1]!;
  const x = bandX ?? first.x;
  return {
    swimlaneBand: { x, y: baseY, width: last.x + last.width - 1 - x, height: titlesHeight },
    swimlaneDividerY: { y1: baseY, y2: contentBottomY },
  };
}

/**
 * The band's own reservation x -- the one `Reservation` that ignores BOTH
 * axes for compression (`URectangle.ignoreForCompressionOnX()
 * .ignoreForCompressionOnY()`, `Swimlanes.java:364-365`), pushed by
 * `assign-coordinates-full.ts#withBandReservation`. Carried through the
 * compress pass and the canvas shift with every other reservation, so it
 * is `origin + 5` in whatever frame `reservations` is in. `undefined` when
 * no band was reserved (a single lane).
 */
export function bandReservationX(reservations: readonly Reservation[]): number | undefined {
  return reservations.find((r) => r.ignoreX === true && r.ignoreY === true)?.x;
}
