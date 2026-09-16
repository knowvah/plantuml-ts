import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { NODE_MARGIN_Y } from '../activity-layout-constants.js';

export class GtileTopDown extends TileComposite {
  readonly kind = 'gtile-top-down' as const;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly children: readonly Tile[];
  readonly childOffsets: readonly number[];
  readonly childOffsetsX: readonly number[];

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileAssemblySimple.java:124-141
   *   -- `getFtileGeometry` is `tile1.calculateDimension(...).appendBottom(
   *   tile2.calculateDimension(...))`; `getTranslateFor` places tile1 at
   *   `dx(left - tile1.left)` and tile2 at `(left - tile2.left,
   *   dim1.height)` -- every child is shifted so its OWN `left` lands under
   *   the merged `left`, not centred on the composite's width.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:44-56
   *   -- `appendBottom`: `left = max(left1, left2)`,
   *   `width = max(w1 + (left - left1), w2 + (left - left2))`,
   *   `height = h1 + h2`, `inY = geo1.inY`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:48-82,190-192
   *   -- a tile's `left` IS its in/out x: `pointIn = (left, inY)`,
   *   `pointOut = (left, outY)`.
   */
  constructor(children: Tile[], _bounder: StringBounder, _theme: Theme) {
    super();
    this.children = children;
    if (children.length === 0) {
      this.width = 0;
      this.height = 0;
      this.left = 0;
      this.childOffsets = [];
      this.childOffsetsX = [];
      return;
    }
    const lefts = children.map((c) => c.getCoord(NORTH_HOOK).x);
    const left = Math.max(...lefts);
    this.left = left;
    this.width = Math.max(...children.map((c, i) => left - lefts[i]! + c.width));
    this.childOffsetsX = lefts.map((l) => left - l);
    const offsets: number[] = [];
    let y = 0;
    for (const child of children) {
      offsets.push(y);
      y += child.height + NODE_MARGIN_Y;
    }
    this.childOffsets = offsets;
    this.height = y - NODE_MARGIN_Y;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: this.children.length === 0 ? 0 : this.children[0]!.getCoord(NORTH_HOOK).y };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.left, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.height / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.height / 2 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * The out state of the last child whose `kind` is not `'gtile-note'`;
   * `true` when no such child exists (an empty sequence).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileWithNotes.java:195-212
   *   -- `calculateDimensionFtile` keeps the WRAPPED tile's own geometry
   *   (`dim1`, the delegate's dimension) unchanged; the jar's
   *   `InstructionList` never holds a note as an `Instruction` element at
   *   all -- a trailing note is an attachment, not an AST sibling, so it
   *   never gets a vote on `hasPointOut`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:42-54
   *   -- `appendBottom`: `if (geo2.hasPointOut())` takes the LOWER (later)
   *   tile's out state; the upper tile's is discarded.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileEmpty.java:91-92
   *   -- an empty sequence upstream is a single `FtileEmpty`, whose
   *   `calculateDimensionEmpty()` always has an out point.
   */
  hasPointOut(): boolean {
    for (let i = this.children.length - 1; i >= 0; i--) {
      const child = this.children[i]!;
      if (child.kind !== 'gtile-note') return child.hasPointOut();
    }
    return true;
  }
}
