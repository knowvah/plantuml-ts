/**
 * The `laneAt`/`laneIn`/`laneOut` lane-inheritance helpers, split out of
 * `swimlane-placement.ts` (`plans/activity-lane-capture` T2) to keep that
 * file under the 500-line hook. A pure move: no behavior changed here.
 *
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimable.java
 *   -- `getSwimlaneIn()`/`getSwimlaneOut()`, the upstream accessor pair
 *   {@link laneIn}/{@link laneOut} mirror.
 */

import type { Tile } from '../tiles/tile.js';
import type { GtileTopDown } from '../tiles/gtile-top-down.js';

/** A tile's OWN lane if `tile-layout.ts` set one (`Tile.swimlane`), else
 * the inherited ambient lane. */
export function laneAt(tile: Tile, inherited: string | undefined): string | undefined {
  return tile.swimlane ?? inherited;
}

/**
 * A composite's entry lane -- upstream's `getSwimlaneIn()`
 * (`ftile/Swimable.java`). A `GtileTopDown` branch wrapper carries no
 * `.swimlane` of its own (`tile-layout.ts` never wraps it), so its entry
 * lane is its FIRST child's, recursively (a branch may itself switch
 * lanes partway through, e.g. `bideta-97-cezo697`'s else-branch).
 */
export function laneIn(tile: Tile, inherited: string | undefined): string | undefined {
  if (tile.swimlane !== undefined) return tile.swimlane;
  if (tile.kind === 'gtile-top-down') {
    const children = (tile as unknown as GtileTopDown).children;
    if (children.length > 0) return laneIn(children[0]!, inherited);
  }
  return inherited;
}

/**
 * A composite's exit lane -- upstream's `getSwimlaneOut()`; mirrors
 * {@link laneIn} but descends into the LAST child. Reads `swimlaneOut`
 * before `swimlane` (mission `activity-lane-capture` D1): fork, split and
 * repeat hold a distinct exit lane (`InstructionFork.java:69` et al.); if,
 * while and switch never set `swimlaneOut`, so this is a no-op for them.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimable.java
 */
export function laneOut(tile: Tile, inherited: string | undefined): string | undefined {
  if (tile.swimlaneOut !== undefined) return tile.swimlaneOut;
  if (tile.swimlane !== undefined) return tile.swimlane;
  if (tile.kind === 'gtile-top-down') {
    const children = (tile as unknown as GtileTopDown).children;
    if (children.length > 0) return laneOut(children[children.length - 1]!, inherited);
  }
  return inherited;
}
