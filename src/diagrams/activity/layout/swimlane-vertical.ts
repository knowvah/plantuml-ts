/**
 * The swimlane title band's vertical sizing -- split out of
 * `swimlane-placement.ts` (its 500-line hook), re-exported from there.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:309-315
 *   -- `getTitlesHeight`, ported below as {@link measureSwimlaneTitlesHeight}.
 */

import type { Theme } from '../../../core/theme.js';
import type { ActivityEdgeGeo, ActivityNodeGeo, SwimlaneGeo } from '../activity-geometry.types.js';
import type { Reservation } from './hexagon-reservations.js';
import { swimlaneTitleDimension } from './swimlane-title.js';
import { shiftAll } from './canvas-origin-shift.js';

/** What `getTitle(swimlane)` reads off one placed lane: its display (else
 *  its name, `Swimlane.java:60,74-80`) and `getActualWidth()`. */
export type TitledLane = Pick<SwimlaneGeo, 'name' | 'display' | 'actualWidth' | 'width'>;

/**
 * D2: the title band's height is the MAX, over lanes, of that lane's own
 * `getTitle(swimlane)` block's height (`Swimlanes#getTitlesHeight`,
 * `:309-315`) -- the same creole block the title draws
 * (`swimlane-title.ts`), so a `|name|LABEL` display, a wrapped
 * (`swimlaneWrapTitleWidth`) title and a small font all measure what is
 * drawn. A small `SwimlaneTitleFontSize` floors at 10 inside the block
 * (`AtomText#calculateDimensionSlow`, `klimt/creole/legacy/AtomText.java
 * :179-181`): `sikino-19-vuca111` (8 -> 10), `pakema-21-xema183` (18),
 * `cemipu-87-dinu624` (30). Shared by the vertical content translate and
 * the chrome band so both read one value.
 */
export function measureSwimlaneTitlesHeight(lanes: readonly TitledLane[], theme: Theme): number {
  let max = 0;
  for (const lane of lanes) {
    const actualWidth = lane.actualWidth ?? lane.width;
    max = Math.max(max, swimlaneTitleDimension(lane.display ?? lane.name, theme, actualWidth).height);
  }
  return max;
}

export interface SwimlaneVertical {
  readonly contentY: number;
  readonly titlesHeight: number;
  /** `getTitleHeightTranslate(...).getDy()` (`:304-307`). */
  readonly dy: number;
}

/**
 * `Swimlanes#drawU`'s own `swimlanes().size() > 1` guard (`:275`): a
 * single lane draws no chrome and reserves no vertical space; a real
 * multi-lane diagram draws the whole block translated down by
 * `getTitleHeightTranslate` -- `titlesHeight + 5`, or 0 when no title has
 * height (`:304-307`). Measured AFTER the lane widths are set (the title
 * height reads `getActualWidth()` through an `auto` wrap,
 * `computeSizeInternal`, `:407-413`), so the caller walks the content at
 * `baseY` and applies `dy` afterwards, as upstream translates the drawn
 * `full` block (`:342-343`).
 */
export function resolveSwimlaneVertical(lanes: readonly TitledLane[], baseY: number, theme: Theme): SwimlaneVertical {
  if (lanes.length <= 1) return { contentY: baseY, titlesHeight: 0, dy: 0 };
  const titlesHeight = measureSwimlaneTitlesHeight(lanes, theme);
  const dy = titlesHeight > 0 ? titlesHeight + 5 : 0;
  return { contentY: baseY + dy, titlesHeight, dy };
}

/** Placed content around the dividers' reservations, which keep their `y`. */
export interface PlacedContent {
  readonly nodes: ActivityNodeGeo[];
  readonly edges: ActivityEdgeGeo[];
  readonly before: Reservation[];
  readonly after: Reservation[];
}

/** `getTitleHeightTranslate`'s `dy` applied to placed content. */
export function translateContentY(content: PlacedContent, dy: number): PlacedContent {
  if (dy === 0) return content;
  const shift = (reservations: Reservation[]) => shiftAll({ nodes: [], edges: [], swimlanes: [], reservations }, 0, dy);
  const moved = shiftAll({ nodes: content.nodes, edges: content.edges, swimlanes: [], reservations: [] }, 0, dy);
  return {
    nodes: moved.nodes,
    edges: moved.edges,
    before: shift(content.before).reservations,
    after: shift(content.after).reservations,
  };
}
