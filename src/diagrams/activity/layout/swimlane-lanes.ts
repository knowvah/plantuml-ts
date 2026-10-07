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

/** `GtileTopDown` (a branch's own sequential body) and `GtileGroup`
 *  (`group`/`partition`, `tiles/gtile-group.ts`'s own `kind` doc) both
 *  carry exactly this shape -- {@link laneIn}/{@link laneOut} only ever
 *  need `.children`, never anything else either class adds. */
interface ChildBearing {
  readonly children: readonly Tile[];
}

/** T3i (row PART-XLANE): kinds whose `getSwimlaneIn()`/`getSwimlaneOut()`
 *  DELEGATE to their inner tile (`FtileGroup.java:131-137`: both
 *  one-line `return inner.getSwimlaneXxx();`) -- `'gtile-top-down'`
 *  (a branch body, pre-existing) and `'gtile-group'`/`'gtile-partition'`
 *  (a `partition { ... }`/`group { ... }` frame, newly added). Kept as
 *  an explicit allowlist, not a generic `'children' in tile` check: the
 *  Java source deliberately does NOT override `getSwimlaneIn/Out()` for
 *  `if`/`while`/`switch`/fork/repeat (this file's own doc, `D1`), so a
 *  blanket recursion would be unfaithful for those kinds. */
const DELEGATING_KINDS = new Set(['gtile-top-down', 'gtile-group', 'gtile-partition']);

/** A tile's OWN lane if `tile-layout.ts` set one (`Tile.swimlane`), else
 * the inherited ambient lane. */
export function laneAt(tile: Tile, inherited: string | undefined): string | undefined {
  return tile.swimlane ?? inherited;
}

/**
 * A composite's entry lane -- upstream's `getSwimlaneIn()`
 * (`ftile/Swimable.java`), an UNCONDITIONAL one-line delegation for
 * every kind in {@link DELEGATING_KINDS} (`FtileGroup.java:131-133`:
 * `return inner.getSwimlaneIn();`, no own field read first) -- checked
 * BEFORE `tile.swimlane`, not after. A `GtileTopDown` branch wrapper
 * never has its own `.swimlane` anyway (`tile-layout.ts` never wraps
 * one), so this ordering is a no-op for it; `GtileGroup`/`GtilePartition`
 * DO get one from `tile-layout-structural.ts#tileGroup`'s own
 * `withSwimlane(tile, node.swimlane)` (the group's OWN entry lane, used
 * for OTHER purposes, e.g. `collectTouchedLanes`) -- reading that field
 * here instead of delegating would be the exact T3i PART-XLANE bug this
 * reordering fixes (confirmed emitting the group's entry lane for an
 * edge that must use its EXIT child's lane instead).
 */
export function laneIn(tile: Tile, inherited: string | undefined): string | undefined {
  if (DELEGATING_KINDS.has(tile.kind)) {
    const children = (tile as unknown as ChildBearing).children;
    // T3i fix-up: an EMPTY body (`partition P1 {}`, `sifite-87-ziti434`)
    // has nothing of its own to delegate to -- fall back to THIS tile's
    // own `.swimlane` (not the caller's `inherited`) before recursing,
    // so a non-empty body's deeper leaf tags still win when they exist,
    // but an empty one keeps the group's own declared lane.
    if (children.length > 0) return laneIn(children[0]!, tile.swimlane ?? inherited);
  }
  if (tile.swimlane !== undefined) return tile.swimlane;
  return inherited;
}

/**
 * A composite's exit lane -- upstream's `getSwimlaneOut()`; mirrors
 * {@link laneIn} but descends into the LAST child. Reads `swimlaneOut`
 * before delegating (mission `activity-lane-capture` D1): fork, split and
 * repeat hold a distinct exit lane (`InstructionFork.java:69` et al.); if,
 * while and switch never set `swimlaneOut`, so this is a no-op for them.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimable.java
 */
export function laneOut(tile: Tile, inherited: string | undefined): string | undefined {
  if (tile.swimlaneOut !== undefined) return tile.swimlaneOut;
  if (DELEGATING_KINDS.has(tile.kind)) {
    const children = (tile as unknown as ChildBearing).children;
    // Same empty-body fallback as `laneIn` above.
    if (children.length > 0) return laneOut(children[children.length - 1]!, tile.swimlane ?? inherited);
  }
  if (tile.swimlane !== undefined) return tile.swimlane;
  return inherited;
}
