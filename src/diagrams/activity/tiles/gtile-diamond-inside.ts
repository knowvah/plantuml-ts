import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import { measurerAdapterOf } from './gtile-action.js';
import { klimtStringBounder } from '../activity-creole-sheet.js';
import { activityDisplayBlock, activityTextFontConfiguration } from '../activity-text-sheet.js';
import { diamondTestBlock } from '../activity-text-sheet-diamond.js';
import { HorizontalAlignment } from '../../../core/klimt/geom/HorizontalAlignment.js';
import { CreoleMode } from '../../../core/klimt/creole/CreoleMode.js';
import type { TextBlock } from '../../../core/klimt/shape/TextBlock.js';
import type { FontConfiguration } from '../../../core/klimt/shape/UText.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;
export type DiamondSide = 'north' | 'south' | 'west' | 'east';

export interface DiamondInsideLabels {
  north?: string;
  south?: string;
  west?: string;
  east?: string;
}

/**
 * The public contract `GtileIfDown`/`GtileIfWithLinks` need from an
 * if-condition diamond tile, regardless of WHICH `ConditionStyle` built
 * it. Upstream has no equivalent type -- `FtileDiamondInside` and
 * `FtileDiamondSquare` are sibling subclasses of the abstract
 * `FtileDiamondWIP` (`vertical/FtileDiamondWIP.java`), never one typed as
 * the other -- but TypeScript's private-field nominal typing (`north`/
 * `south`/`west`/`east` are `private` on both classes, so two classes
 * with identically-shaped private members are NOT structurally
 * assignable to each other) makes a formal interface the only way to let
 * `GtileDiamondSquare` (T2c, `skinparam ConditionStyle InsideDiamond`)
 * stand in wherever `GtileDiamondInside` is accepted today. add2 T3h
 * widened `gtile-if-down.ts`'s and `gtile-if-with-links.ts`'s `diamond1`
 * params (and `conditional-builder.ts`'s own construction) to this
 * interface, wiring `InsideDiamond` end to end. `GtileDiamondInside
 * implements` it below so the surface is enforced at compile time.
 */
export interface DiamondConditionTile {
  // add2 T3h: `kind`/`swimlane`/`swimlaneOut` added so this interface is
  // ALSO a structural `Tile` (`tiles/tile.ts`) -- `walk-if-down.ts`/
  // `walk-if-with-links.ts` (T3f's write-set, not touched) pass `diamond1`
  // to several `Tile`-typed parameters; both concrete classes already
  // carry these fields via `TileLeaf`, so this is a widening, not a new
  // requirement on either implementer.
  readonly kind: string;
  readonly swimlane?: string;
  readonly swimlaneOut?: string;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  getCoord(hook: HookName): GPoint;
  labelAt(side: DiamondSide): { x: number; y: number; width: number; height: number; label: string } | null;
  swapEastWest(): void;
  hasPointOut(): boolean;
}

export interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/** `TextBlock#calculateDimension` through the tile's own `StringBounder`
 *  (`klimtStringBounder` over `measurerAdapterOf`, the seam
 *  `gtile-action.ts#computeActionSize` sizes the action Sheet with). */
function blockDimension(
  tb: TextBlock,
  bounder: StringBounder,
  fc: FontConfiguration,
): { width: number; height: number } {
  const dim = tb.calculateDimension(
    klimtStringBounder(measurerAdapterOf(bounder), { family: fc.family, size: fc.size }),
  );
  return { width: dim.getWidth(), height: dim.getHeight() };
}

/**
 * A side label (`north`/`south`/`west`/`east`): `getLabelPositive`'s
 * `create0(fontArrow, LEFT, skinParam, labelLineBreak, CreoleMode.SIMPLE_LINE)`
 * (`ConditionalBuilder.java:280-283`), the block `renderIfLabel` draws --
 * creole resolved, each stripe's `AtomText` floor (`AtomText.java:179-181`)
 * and `SheetBlock1`'s padding on both axes (`SheetBlock1.java:194-197`)
 * included. An unset side stays a literal 0x0 box, never handed to the
 * bounder. `creoleMode` FULL is `Display#create(fcArrow, LEFT, skinParam)`
 * (`Display.java:614-617`), the side labels `FtileIfLongHorizontal`/
 * `FtileIfLongVertical` build (`FtileIfLongHorizontal.java:172-173,186`,
 * `FtileIfLongVertical.java:155-156`).
 */
export function measureSide(
  text: string | undefined,
  bounder: StringBounder,
  theme: Theme,
  creoleMode: CreoleMode = CreoleMode.SIMPLE_LINE,
): LabelDim {
  const t = text ?? '';
  if (t === '') return { text: t, width: 0, height: 0 };
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'arrow'), 'arrow');
  const tb = activityDisplayBlock(t, theme, {
    fontConfiguration: fc,
    horizontalAlignment: HorizontalAlignment.LEFT,
    creoleMode,
  });
  return { text: t, ...blockDimension(tb, bounder, fc) };
}

/**
 * The condition's own `tbTest` (`ConditionalBuilder.java:240-247`): the
 * diamond-font `CreoleMode.FULL` Sheet in a `SheetBlock1` carrying
 * `skinParam.getPadding()` -- `activity-text-sheet-diamond.ts
 * #diamondTestBlock`, the block `renderHexagonOwnLabel` draws. An empty
 * condition stays 0x0 (`hexagonAlone`'s special case). The same extent as
 * the `create0(fcTest, defaultTextAlignment, FULL)` block an `elseif`
 * hexagon carries (`FtileIfLongHorizontal.java:175-177`): a stencil never
 * changes a `SheetBlock2` dimension.
 */
export function measureCondition(text: string, bounder: StringBounder, theme: Theme): LabelDim {
  if (text === '') return { text, width: 0, height: 0 };
  const fc = activityTextFontConfiguration(theme, activityFontSize(theme, 'diamond'), 'diamond');
  return { text, ...blockDimension(diamondTestBlock(text, theme), bounder, fc) };
}

/**
 * The hexagon-alone dimension. Special-cased to a literal 24x24 for an
 * empty condition label -- NOT `atLeast(24,24).delta(24,0)`, which would
 * wrongly add the 24 width pad even to a zero-width label.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:106-116
 */
function hexagonAlone(dimLabel: { width: number; height: number }): { width: number; height: number } {
  if (dimLabel.width === 0 || dimLabel.height === 0) {
    return { width: HEXAGON_HALF_SIZE * 2, height: HEXAGON_HALF_SIZE * 2 };
  }
  return {
    width: Math.max(dimLabel.width, HEXAGON_HALF_SIZE * 2) + HEXAGON_HALF_SIZE * 2,
    height: Math.max(dimLabel.height, HEXAGON_HALF_SIZE * 2),
  };
}

/**
 * The `INSIDE_HEXAGON` condition shape shared by the `down` and
 * `with-links` builders (D2) -- a hexagon condition with up to four label
 * slots. `.width`/`.height` are `calculateDimensionFtile`'s (hexagon +
 * north label height); every hook and {@link labelAt} anchor uses the
 * HEXAGON-ALONE height instead (`hexHeight`), since `north`/`south` render
 * BELOW the hexagon, never above it, and the shape's own in/out points sit
 * at the hexagon's own top/bottom edge regardless of the north label.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:84-125
 */
export class GtileDiamondInside extends TileLeaf implements DiamondConditionTile {
  readonly kind = 'gtile-diamond-inside' as const;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  private readonly hexHeight: number;
  private north: LabelDim;
  private south: LabelDim;
  private west: LabelDim;
  private east: LabelDim;

  /** @param sideMode `SIMPLE_LINE` for an `if` (`ConditionalBuilder.java:280-283`),
   *  `FULL` for a while / repeat (`FtileWhile.java:123,127-128`, `FtileRepeat.java:130-131`). */
  constructor(
    label: string,
    labels: DiamondInsideLabels,
    bounder: StringBounder,
    theme: Theme,
    sideMode: CreoleMode = CreoleMode.SIMPLE_LINE,
  ) {
    super();
    this.label = label;
    this.north = measureSide(labels.north, bounder, theme, sideMode);
    this.south = measureSide(labels.south, bounder, theme, sideMode);
    this.west = measureSide(labels.west, bounder, theme, sideMode);
    this.east = measureSide(labels.east, bounder, theme, sideMode);

    // `FtileDiamondInside#calculateDimensionAlone` reads `label
    // .calculateDimension` (`FtileDiamondInside.java:106-116`) -- the Sheet,
    // one stripe per real `\n` (IFNL, T3d, `vaxiki-78-nice114`).
    const dimLabel = measureCondition(label, bounder, theme);
    const hex = hexagonAlone(dimLabel);
    this.width = hex.width;
    this.hexHeight = hex.height;
    this.height = hex.height + this.north.height;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.hexHeight };
      case EAST_HOOK:
        return { x: this.width, y: this.hexHeight / 2 };
      case WEST_HOOK:
        return { x: 0, y: this.hexHeight / 2 };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * The label's own top-left `{x, y, width, height, label}` in this tile's
   * local frame, or `null` when that slot is unset. `north`/`south` share
   * the SAME position (the hexagon's own bottom) -- both are drawn there
   * unconditionally by upstream, a quirk this mirrors rather than "fixes".
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:91-102
   */
  labelAt(side: DiamondSide): { x: number; y: number; width: number; height: number; label: string } | null {
    const dim = this[side];
    if (dim.text === '') return null;
    switch (side) {
      case 'north':
      case 'south':
        return { x: 4 + this.width / 2, y: this.hexHeight, width: dim.width, height: dim.height, label: dim.text };
      case 'west':
        return {
          x: -dim.width,
          y: this.hexHeight / 2 - dim.height,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
      case 'east':
        return {
          x: this.width,
          y: this.hexHeight / 2 - dim.height,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
    }
  }

  /**
   * Swaps the west/east label slots in place, mirroring upstream's own
   * mutating setter (used by `FtileIfDown`'s `ConnectionElse1` path, D8 —
   * not called by `with-links`, but part of this tile's shared API).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondWIP.java:68-73
   */
  swapEastWest(): void {
    const tmp = this.west;
    this.west = this.east;
    this.east = tmp;
  }

  /**
   * Always `true` -- the hexagon's own `FtileGeometry` is built with the
   * four-argument `(dim, left, inY, outY)` constructor (a real `outY`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside.java:115
   */
  hasPointOut(): boolean {
    return true;
  }
}
