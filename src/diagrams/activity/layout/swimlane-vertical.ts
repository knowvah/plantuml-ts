/**
 * The swimlane title band's vertical sizing -- split out of
 * `swimlane-placement.ts` (this task's own 500-line hook) to make room
 * for T1p-g's `ConnectionHline` routing. A pure move: no behavior
 * changed here, re-imported from `swimlane-placement.ts` so its own
 * `TITLE_ASCENT_FRACTION` export and every existing importer
 * (`assign-coordinates-full.ts`, this file's own tests) are untouched.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:309-315
 *   -- `getTitlesHeight`, ported below as {@link measureSwimlaneTitlesHeight}.
 */

import type { StringBounder } from '../tiles/tile.js';
import type { Theme } from '../../../core/theme.js';
import { swimlaneTitleFontSize } from '../activity-style-defaults.js';

/**
 * D2: the title band's height is the MAX, over lanes, of that lane's own
 * title `TextBlock`'s height (`Swimlanes#getTitlesHeight`, `:309-315`) --
 * never the raw `SwimlaneTitleFontSize` constant. Each title's own height
 * is floored at 10 by `AtomText#calculateDimensionSlow`
 * (`klimt/creole/legacy/AtomText.java:179-181`: `if (h < 10) h = 10;`),
 * which is why a small `SwimlaneTitleFontSize` does not shrink the band
 * proportionally. Confirmed against three pinned fixtures:
 * `SwimlaneTitleFontSize 8` -> band height 10 (`sikino-19-vuca111`, floored);
 * the default 18 -> 18 (`pakema-21-xema183`, already >= 10, unaffected);
 * `TitleFontSize 30` -> 30 (`cemipu-87-dinu624`, unaffected). Shared by
 * `tile-coordinates.ts` (vertical content reservation) and the swimlane
 * chrome renderer (band rect height) so both measure the exact same value
 * -- D2 forbids a second, independent implementation of this number.
 */
export function measureSwimlaneTitlesHeight(
  laneNames: readonly string[],
  bounder: StringBounder,
  theme: Theme,
): number {
  const titleFontSize = swimlaneTitleFontSize(theme);
  let max = 0;
  for (const name of laneNames) {
    max = Math.max(max, bounder.getDimension(name, titleFontSize).height);
  }
  return Math.max(max, 10);
}

export interface SwimlaneVertical {
  readonly contentY: number;
  readonly titlesHeight: number;
}

/**
 * `Swimlanes#drawU`'s own `swimlanes().size() > 1` guard (`:275`): a
 * single lane draws no chrome and reserves no vertical space; a real
 * multi-lane diagram pushes content down by `titlesHeight + 5`
 * (`getTitleHeightTranslate`, `:304-307`). Called once from
 * `assignCoordinates` before the pass-1 walk.
 */
export function resolveSwimlaneVertical(
  laneNames: readonly string[],
  baseY: number,
  bounder: StringBounder,
  theme: Theme,
): SwimlaneVertical {
  if (laneNames.length <= 1) return { contentY: baseY, titlesHeight: 0 };
  const titlesHeight = measureSwimlaneTitlesHeight(laneNames, bounder, theme);
  return { contentY: baseY + titlesHeight + 5, titlesHeight };
}
