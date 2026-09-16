import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { Theme } from '../../../core/theme.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';

/**
 * `FtileRepeat.create`'s back-connection selection (`FtileRepeat.java:
 * 186-199`, `backward == null`, D5): `'simple1'`/`'simple2'` are the
 * no-cross-lane-exit case (`swimlane == null || swimlane == swimlaneOut`),
 * split by whether the repeat's own lane sorts before every lane its body
 * touches; `'complex1'` is the cross-lane case (`swimlane != swimlaneOut`).
 * Decided once in `tile-layout.ts#tileRepeat` (build time, the same seam
 * `GtileIfDown.useElse1` is decided at) and stored here so `walk-repeat.ts`
 * never re-derives it from swimlane state it does not carry.
 */
export type RepeatBackConnection = 'simple1' | 'simple2' | 'complex1';

/**
 * `_bounder`/`_theme` are bundled into one trailing object solely to keep
 * the constructor's own parameter count at the hook's 5-parameter limit
 * once {@link RepeatBackConnection} is added as a real parameter -- neither
 * field is read (see the constructor's own `_bounder`/`_theme` names, kept
 * from before this bundling); `tile-layout.ts#tileRepeat` is this class's
 * only call site, so the bundling is invisible to every other tileXxx
 * builder's own `(bounder, theme)` calling convention.
 */
export interface GtileRepeatContext {
  readonly bounder: StringBounder;
  readonly theme: Theme;
}

/**
 * `FtileRepeat`'s three children -- an entry point (a label-less diamond,
 * `GtileRepeatEntry`, or the inline `repeat :label;` action tile), the loop
 * body, and the condition hexagon (mission `activity-loop-tile-port`, T5,
 * D2). `backward:` bodies are out of scope (0 fixtures; README "What this
 * mission does NOT do"; filed as `activity-loop-backward`) -- the prior
 * interim's home-grown third child and `BACK_EDGE_MARGIN`/`NODE_MARGIN_Y`
 * arithmetic are retired here in favour of the jar's own formulas below,
 * which have no term for it.
 */
export class GtileRepeat extends TileComposite {
  readonly kind = 'gtile-repeat' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly [Tile, Tile, GtileDiamondInside];
  readonly entryOffsetX: number;
  readonly entryOffsetY = 0;
  readonly bodyOffsetX: number;
  readonly bodyOffsetY: number;
  readonly conditionOffsetX: number;
  readonly conditionOffsetY: number;
  /** The jar's `getLeft()`: the merged `left` every child's own `left`
   *  lands under. */
  readonly left: number;
  /** {@link RepeatBackConnection}: which of the jar's `ConnectionBack
   *  Simple1`/`Simple2`/`Complex1` `walk-repeat.ts` draws for this repeat,
   *  decided once at build time by `tile-layout.ts#tileRepeat` (D5, T6). */
  readonly backConnection: RepeatBackConnection;

  /**
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:767-775
   *   -- `getLeft`: `max(repeat.left, dimDiamond1.w / 2, dimDiamond2.w / 2)`
   *   -- note BOTH diamond terms read `getWidth() / 2`, never `.getLeft()`,
   *   even though `diamond1` (the entry) may be an asymmetric inline action.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:777-786
   *   -- `getRight`: `max(repeat.w - repeat.left, dimDiamond1.w / 2,
   *   dimDiamond2.w / 2)`, the same width/2 terms.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:701-717
   *   -- `calculateDimensionInternal`: `width = max(getLeft() + getRight(),
   *   tbTest.w + 2*hexagonHalfSize) + 2*hexagonHalfSize`; `tbTest` is always
   *   `TextBlockUtils.empty(0, 0)` under `INSIDE_HEXAGON` (`:155`), so the
   *   floor is always `0 + 24`. `height = d1.h + repeat.h + d2.h +
   *   8*hexagonHalfSize`. The `backward != null` width term (`:710-711`) is
   *   out of scope (class doc).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:696-699
   *   -- `calculateDimensionFtile`: `left = getLeft()`, `inY = 0`, `outY =
   *   height` -- the geometry's `left` is UNPADDED by the `+24` gutters.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:730-742
   *   -- `getTranslateForRepeat`: `space = height - d1.h - d2.h - repeat.h`;
   *   `y = d1.h + space/2`; `x = left - repeat.left`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:744-748
   *   -- `getTranslateDiamond1` (the entry): `x = left - d1.w/2`, `y = 0`.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:759-765
   *   -- `getTranslateDiamond2` (the condition): `y2 = height - d2.h`,
   *   `x = left - d2.w/2`.
   */
  constructor(
    entry: Tile,
    body: Tile,
    condition: GtileDiamondInside,
    backConnection: RepeatBackConnection,
    _ctx: GtileRepeatContext,
  ) {
    super();
    this.backConnection = backConnection;
    const bodyLeft = body.getCoord(NORTH_HOOK).x;
    const entryHalf = entry.width / 2;
    const conditionHalf = condition.width / 2;
    this.left = Math.max(bodyLeft, entryHalf, conditionHalf);
    const right = Math.max(body.width - bodyLeft, entryHalf, conditionHalf);
    const contentWidth = this.left + right;
    this.width = Math.max(contentWidth, 2 * HEXAGON_HALF_SIZE) + 2 * HEXAGON_HALF_SIZE;
    this.height = entry.height + body.height + condition.height + 8 * HEXAGON_HALF_SIZE;

    const space = this.height - entry.height - body.height - condition.height;
    this.entryOffsetX = this.left - entryHalf;
    this.bodyOffsetX = this.left - bodyLeft;
    this.bodyOffsetY = entry.height + space / 2;
    this.conditionOffsetX = this.left - conditionHalf;
    this.conditionOffsetY = this.height - condition.height;

    this.children = [entry, body, condition];
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: 0 };
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
   * Unconditionally `true`: the exit is the condition diamond's own
   * "false" path, independent of the body's own out point.
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:696-698
   *   -- `calculateDimensionFtile` unconditionally returns
   *   `new FtileGeometry(dimTotal, getLeft(...), 0, dimTotal.getHeight())`.
   */
  hasPointOut(): boolean {
    return true;
  }
}
