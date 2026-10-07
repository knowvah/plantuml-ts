/**
 * `tile-coordinates.ts`'s `'gtile-group'`/`'gtile-partition'` walk --
 * split into its own sibling file (mission `activity-divergence-drive-3`
 * T3i) purely to keep `tile-coordinates.ts` under the 500-line hook cap;
 * no behavior change, a mechanical extraction of the two functions named
 * in this task's write-set ("group placement in layout/tile-coordinates
 * .ts"). `walkTile`/`pushNode`/`Out` are imported back from
 * `tile-coordinates.ts`, which imports {@link walkTileGroup} here in
 * return -- a circular import that is safe because every use on both
 * sides is inside a function body, never at module-eval time.
 */

import type { Tile } from '../tiles/tile.js';
import type { GtileGroup } from '../tiles/gtile-group.js';
import type { Out } from './tile-coordinates.js';
import { pushNode, walkTile } from './tile-coordinates.js';

/**
 * T3h (row PART-XLANE, `vodobe-33-kefa909`/`notuli-49-xugi698`):
 * `FtileGroup.getSwimlanes()` (`:128-130`) delegates to `inner
 * .getSwimlanes()`, which for a sequential body resolves through
 * `FtileAssemblySimple.getSwimlanes()`'s union-of-children recursion
 * (`ftile/FtileAssemblySimple.java:148-153`) down to `FtileBox
 * .getSwimlanes()`'s own-field-only leaf case (`ftile/vertical/FtileBox
 * .java:110-115`: `swimlane == null ? emptySet() : singleton(swimlane)`).
 * No "inherited ambient lane" fallback anywhere in that chain -- every
 * real AST leaf already carries its OWN resolved `.swimlane`
 * (`tile-layout.ts`'s threading, `tile.ts`'s own doc), so a structural
 * tile with no AST node of its own (a diamond, a fork bar) contributes
 * nothing, exactly as the jar's generic `Ftile` would. Mirrored here as
 * a `children`-recursion generic over every `TileComposite` kind, not
 * `laneAt`/`laneIn`/`laneOut` (`swimlane-lanes.ts`) -- those port a
 * DIFFERENT upstream accessor pair (`Swimable.java`'s single-valued
 * `getSwimlaneIn()`/`getSwimlaneOut()`), never the full `Set<Swimlane>`.
 */
export function collectTouchedLanes(tile: Tile, out: Set<string>): void {
  if (tile.swimlane !== undefined) out.add(tile.swimlane);
  if ('children' in tile) {
    for (const child of (tile as unknown as { children: readonly Tile[] }).children) {
      collectTouchedLanes(child, out);
    }
  }
}

/**
 * The `'gtile-group'`/`'gtile-partition'` case, split out of `walkTile`'s
 * own switch purely to keep that function's NLOC from growing. It opens
 * no snake-merge scope (add4-T3c, see the walk call below).
 *
 * T3h: `FtileGroup.drawU` (`:209-227`) draws the SAME-sized frame
 * (`type.asBig(...)`, dims from the cached, lane-spanning `calculateDimension`)
 * every time it is invoked -- and `UGraphicInterceptorOneSwimlane.draw`
 * (`:66-75`) invokes `tile.drawU(this)` once per lane the group's
 * `getSwimlanes()` touches, since `drawWhenSwimlanes`'s own outer loop
 * (`Swimlanes.java:328-347`) runs that interceptor once per
 * `swimlanesSpecial()` entry. Net effect, verified against jar's own
 * `notuli-49-xugi698` SVG: two `<rect>` frames, BOTH `width="80.05"
 * height="130"`, one per touched lane, each at that lane's own x. One
 * `pushNode` per lane in {@link collectTouchedLanes}'s result (falling
 * back to `[myLane]`, a single push, when the body touches no lane of
 * its own -- the zero/one-lane case, byte-identical to the pre-T3h
 * single push). `bucketNodesByLane`'s own stable-order grouping
 * (`activity-renderer-swimlanes.ts`) means push order across DIFFERENT
 * lanes is immaterial; within a lane it still matters, which is why this
 * stays ahead of the content walk below, mirroring `drawU`'s own
 * frame-then-content order inside each lane's pass.
 */
export function walkTileGroup(tile: GtileGroup, x: number, y: number, myLane: string | undefined, out: Out): void {
  const gKind = tile.kind === 'gtile-group' ? 'group' : 'partition';
  const touched = new Set<string>();
  if (tile.children.length > 0) collectTouchedLanes(tile.children[0]!, touched);
  const lanes: ReadonlyArray<string | undefined> = touched.size > 0 ? [...touched] : [myLane];
  for (const lane of lanes) {
    pushNode(
      out,
      {
        id: out.nextId(gKind),
        kind: gKind,
        x,
        y,
        width: tile.width,
        height: tile.height,
        label: tile.title,
        ...(tile.backColor !== undefined ? { color: tile.backColor } : {}),
        ...(tile.usymbol !== undefined ? { usymbol: tile.usymbol } : {}),
      },
      lane,
    );
  }
  if (tile.children.length === 0) return;
  // add4-T3c: no snake scope. `FtileGroup#drawU` (`FtileGroup.java:209-227`)
  // draws `inner` straight onto the caller's UGraphic -- `new
  // UGraphicForSnake` exists only per lane (`Swimlanes.java:252,274,386`)
  // and in the measurement-only `getInnerMinMax` (`FtileGroup.java:152`),
  // so a snake inside a group merges with one outside it.
  walkTile(tile.children[0]!, x + tile.bodyOffsetX, y + tile.bodyOffsetY, { kindHint: null, lane: myLane }, out);
}
