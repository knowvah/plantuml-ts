import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { SEQUENTIAL_ASSEMBLY_GAP } from '../activity-layout-constants.js';
import { measureSide } from './gtile-diamond-inside.js';

/**
 * T1b pass 2: `FtileFactoryDelegatorAssembly#assembly`'s own height
 * reservation (`FtileFactoryDelegatorAssembly.java:58-62`) -- `height
 * += textBlock.calculateDimension(stringBounder).getHeight()` ONLY when
 * `nextChild` carries a pending `-> label;` ({@link Tile.inLabel}'s own
 * doc, `tiles/tile.ts`); `SEQUENTIAL_ASSEMBLY_GAP`'s base 35 always
 * applies regardless (that constant's own doc).
 */
function sequentialGap(nextChild: Tile, bounder: StringBounder, theme: Theme): number {
  if (nextChild.inLabel === undefined) return SEQUENTIAL_ASSEMBLY_GAP;
  // add4-T3j: `textBlock` is the create7 SIMPLE_LINE arrow block
  // (`FtileFactoryDelegator.java:103-112`, read at `FtileFactoryDelegatorAssembly
  // .java:59-62`), padding and stripe floor included.
  return SEQUENTIAL_ASSEMBLY_GAP + measureSide(nextChild.inLabel.label, bounder, theme).height;
}

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
   *
   * The per-pair vertical gap itself ({@link SEQUENTIAL_ASSEMBLY_GAP}) is
   * NOT from `FtileAssemblySimple` (a zero-gap merge) -- it is
   * `Swimlanes`'s single `FtileFactoryDelegatorAssembly` decorator, which
   * wraps the WHOLE factory once and so applies to every `assembly()` call
   * this n-ary flattening represents. See that constant's own doc comment
   * for the full mechanism (raw 35, then a global compression pass).
   */
  constructor(children: Tile[], bounder: StringBounder, theme: Theme) {
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
    for (let i = 0; i < children.length; i++) {
      offsets.push(y);
      const next = children[i + 1];
      const gap = next === undefined ? 0 : sequentialGap(next, bounder, theme);
      y += children[i]!.height + gap;
    }
    this.childOffsets = offsets;
    this.height = y;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: this.children.length === 0 ? 0 : this.children[0]!.getCoord(NORTH_HOOK).y };
      case SOUTH_HOOK:
        return { x: this.left, y: this.outY() };
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
   * The sequence's out y: the LAST child's own out y plus that child's
   * offset, not the sequence's bottom edge.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:49-50
   *   -- `if (geo2.hasPointOut()) result = new FtileGeometry(width, height,
   *   left, geo1.getInY(), geo2.getOutY() + geo1.getHeight())`: each
   *   pairwise `appendBottom` keeps the lower tile's own outY shifted by
   *   the upper tile's height, so an n-ary fold ends at the last child's
   *   outY + its offset ({@link childOffsets}, which already carries the
   *   `FtileFactoryDelegatorAssembly` gap).
   * @see net/sourceforge/plantuml/activitydiagram3/InstructionList.java:153-154
   *   -- a one-instruction list is that instruction's own ftile, so its
   *   out point is the child's, unchanged.
   */
  private outY(): number {
    const n = this.children.length;
    if (n === 0) return 0;
    return this.childOffsets[n - 1]! + this.children[n - 1]!.getCoord(SOUTH_HOOK).y;
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
