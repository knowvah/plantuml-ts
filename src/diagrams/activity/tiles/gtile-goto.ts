import type { GPoint, HookName } from './points.js';
import { NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, EAST_HOOK, WEST_HOOK } from './points.js';
import { TileLeaf } from './tile.js';
import type { ActivityGoto } from '../ast.js';
import type { Tile } from './tile.js';
import { GtileLabel } from './gtile-label.js';

/**
 * `goto NAME` -- jumps to the `label NAME` declared elsewhere. `FtileGoto`
 * extends `FtileEmpty` (zero size, draws nothing, same as {@link
 * GtileLabel}) but additionally overrides `calculateDimensionFtile` to
 * `calculateDimensionEmpty().withoutPointOut()` -- a `goto` tile has NO
 * out point, so the generic sibling-link machinery
 * (`layout/tile-coordinates.ts#pushTopDownSiblingEdge`'s own `if
 * (!prevChild.hasPointOut()) return` gate, already live for `kill`/
 * `detach` via `tile-layout.ts#withKilled`) draws no connecting line FROM
 * this tile to whatever sequential sibling follows. Verified empirically:
 * `start;:A;goto X;:B;stop;` renders `B` 10px lower than the same diagram
 * with the `goto X;` line deleted, with no line filling that gap
 * (`ast.ts`'s own doc, `.agent-notes/T2g-spot-label-goto.md`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGoto.java:41-53
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:47,83,87-92
 */
export class GtileGoto extends TileLeaf {
  readonly kind = 'gtile-goto' as const;
  readonly name: string;
  readonly width = 0;
  readonly height = 0;
  /** `false` when the parent draws this tile through a direct `drawU`
   *  (`UGraphicDispatchFtile` never sees it); set once by
   *  {@link markDecoratedSoleChild} right after construction, read by
   *  `layout/tile-coordinates.ts`. */
  dispatched = true;

  constructor(node: ActivityGoto) {
    super();
    this.name = node.name;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: 0, y: 0 };
      case EAST_HOOK:
      case WEST_HOOK:
        return { x: 0, y: 0 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /** @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGoto.java:51-53 */
  hasPointOut(): boolean {
    return false;
  }
}

/**
 * `InstructionList#createFtile` returns a sole instruction's own ftile with
 * no assembly around it (`InstructionList.java:146-157`); an if branch then
 * wraps it in `FtileMinWidthCentered` (`ConditionalBuilder.java:138-139,
 * 171-172`), an `FtileDecorate` whose `drawU` calls `ftile.drawU(ug)`
 * directly (`vertical/FtileDecorate.java:79-80`). A `goto`/`label` that is
 * a branch's ONLY tile therefore never reaches `UGraphicDispatchFtile#draw`
 * (`UGraphicDispatchFtile.java:70-85`): not recorded, no goto line. Inside
 * a longer list, `FtileAssemblySimple#drawU` uses `ug.draw(tile)`
 * (`FtileAssemblySimple.java:108-111`), so siblings stay dispatched.
 */
export function markDecoratedSoleChild(tiles: readonly Tile[]): void {
  if (tiles.length !== 1) return;
  const only = tiles[0];
  if (only instanceof GtileGoto || only instanceof GtileLabel) only.dispatched = false;
}
