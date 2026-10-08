/**
 * The per-lane `Connection` gate every swimlane pass applies to a composite
 * tile's NON-`ConnectionTranslatable` connections, shared by the if-walkers
 * that port it (`walk-if-long-vertical.ts`, `walk-if-long-horizontal.ts`).
 *
 * `Swimlanes#drawWhenSwimlanes` draws the content once per lane through
 * `UGraphicInterceptorOneSwimlane` (`Swimlanes.java:318-356`). Its
 * `Connection` branch draws a connection in lane `L` iff `tile1` is null or
 * its `getSwimlaneOut()` is null or `L`, and the same for `tile2`'s
 * `getSwimlaneIn()` (`UGraphicInterceptorOneSwimlane.java:93-104`; the
 * measuring twin is `UGraphicInterceptorAllSwimlanes.java:129-143`). The
 * composite itself reaches lane `L` only when `L` is in its own
 * `getSwimlanes()` (`UGraphicInterceptorOneSwimlane.java:68-75`). The
 * cross-lane pass draws only `ConnectionTranslatable`s
 * (`ConnectionCross.java:49-64`), so a non-translatable connection whose
 * two tiles sit in different lanes is drawn by NO pass.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/UGraphicInterceptorOneSwimlane.java:93-104
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/ConnectionCross.java:49-64
 */

import type { Tile } from '../tiles/tile.js';
import { collectTouchedLanes } from './tile-coordinates-group.js';

/**
 * A composite's own `getSwimlanes()`: its `swimlaneIn` (when known) plus
 * every listed child's touched lanes. `undefined` when the diagram has no
 * lanes at all -- no interceptor pass runs, so nothing is gated
 * (`Swimlanes.java:318-356`).
 */
export function compositeLaneGate(
  swimlaneIn: string | undefined,
  children: readonly Tile[],
  myLane: string | undefined,
): ReadonlySet<string> | undefined {
  const lanes = new Set<string>();
  if (swimlaneIn !== undefined) lanes.add(swimlaneIn);
  for (const tile of children) collectTouchedLanes(tile, lanes);
  if (lanes.size === 0 && myLane === undefined) return undefined;
  return lanes;
}

/**
 * Whether some lane pass draws a non-translatable connection whose `tile1`
 * out lane is `lane1` and `tile2` in lane is `lane2` (`undefined` = null
 * tile or null lane, contained in every lane). `gate` = the composite's
 * {@link compositeLaneGate}; `undefined` = no swimlanes, always drawn.
 */
export function nonTranslatableConnectionDrawn(
  gate: ReadonlySet<string> | undefined,
  lane1: string | undefined,
  lane2: string | undefined,
): boolean {
  if (gate === undefined) return true;
  for (const lane of gate) {
    if ((lane1 === undefined || lane1 === lane) && (lane2 === undefined || lane2 === lane)) return true;
  }
  return false;
}
