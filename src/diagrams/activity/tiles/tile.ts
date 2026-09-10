import type { GPoint, HookName } from './points.js';

// NOTE: StringBounder here uses getDimension(text, fontSizePt) for
// simplicity. This differs from src/core/measurer.ts StringMeasurer,
// which uses measure(text, FontSpec) where FontSpec carries family,
// size, weight, and style. If you need to bridge to FormulaMeasurer /
// CanvasMeasurer, wrap it: getDimension(t, sz) => measurer.measure(t,
// { family: 'sans-serif', size: sz }).
export interface StringBounder {
  getDimension(text: string, fontSizePt: number): { width: number; height: number };
}

export interface Tile {
  readonly kind: string;
  readonly width: number;
  readonly height: number;
  /**
   * The swimlane this tile's source `ActivityNode` was parsed in, if any.
   * Threaded from `ActivityNode.swimlane` (`ast.ts`) at tile-construction
   * time in `tile-layout.ts`; not yet consumed by layout or rendering.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimable.java
   *   -- `getSwimlaneIn()`/`getSwimlaneOut()`, the upstream accessor pair
   *   every `Instruction` (the Java AST node) exposes.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:476
   *   -- `getCurrentSwimlane()`, the parse-time "which lane am I in" the
   *   port's `ctx.currentSwimlane` (`dispatch-support.ts`) mirrors.
   */
  readonly swimlane?: string;
  getCoord(hook: HookName): GPoint;
  /**
   * Whether this tile has an outgoing connection point that a later
   * sibling or wrapping composite can route a link into. Mirrors
   * upstream's `outY == Double.MIN_NORMAL` sentinel: a tile built without
   * an out point (a stop, kill, break, or a branch that ends in one of
   * those) cannot be routed out of. Not yet consumed by layout or
   * rendering -- purely threaded so T2/T3 (the parallel-connector and bar
   * tasks) can gate on it.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:88-90
   *   -- the four-argument constructor (width, height, left, inY)
   *   delegates to the five-argument one with `outY = Double.MIN_NORMAL`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometry.java:141-143
   *   -- `hasPointOut()`, `outY != Double.MIN_NORMAL`.
   */
  hasPointOut(): boolean;
}

export abstract class TileLeaf implements Tile {
  abstract readonly kind: string;
  abstract readonly width: number;
  abstract readonly height: number;
  abstract getCoord(hook: HookName): GPoint;
  swimlane?: string;

  /**
   * Default `true` rather than `abstract`: every production `gtile-*.ts`
   * leaf overrides this with its own `@see` citation, so no in-scope tile
   * relies on the default. The default exists only so that test-only
   * `TileLeaf` stand-ins outside this task's write-set keep compiling
   * without also being edited here --
   * `tests/diagrams/activity/tiles/tile.test.ts`'s `FixedLeaf` and
   * `tests/diagrams/activity/layout/swimlane-placement.test.ts`'s
   * `FixedTile`.
   */
  hasPointOut(): boolean {
    return true;
  }
}

export abstract class TileComposite implements Tile {
  abstract readonly kind: string;
  abstract readonly width: number;
  abstract readonly height: number;
  abstract getCoord(hook: HookName): GPoint;
  abstract readonly children: readonly Tile[];
  swimlane?: string;

  /**
   * Default `true` for the same reason as `TileLeaf.hasPointOut` above:
   * every production `gtile-*.ts` composite overrides this explicitly (see
   * each file's own `@see`); the default only protects
   * `tests/diagrams/activity/tiles/tile.test.ts`'s test-only
   * `SimpleTwoChildComposite` from needing an edit here.
   */
  hasPointOut(): boolean {
    return true;
  }
}
