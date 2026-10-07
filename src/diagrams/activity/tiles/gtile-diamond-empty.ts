import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import type { DiamondConditionTile, DiamondInsideLabels, DiamondSide } from './gtile-diamond-inside.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;
/** `AtomText#calculateDimensionSlow`'s own per-line height floor (L, T3d),
 *  same constant as every other diamond file's own copy.
 * @see net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181 */
const ATOM_TEXT_MIN_HEIGHT = 10;

interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/** Same multi-line fold as every other diamond file's own copy (D5: no
 *  shared helper module between builder-specific tile files). */
function measureLabel(text: string | undefined, bounder: StringBounder, fontSize: number): LabelDim {
  const t = text ?? '';
  if (t === '') return { text: t, width: 0, height: 0 };
  let width = 0;
  let height = 0;
  for (const line of t.split('\n')) {
    const dim = bounder.getDimension(line, fontSize);
    if (dim.width > width) width = dim.width;
    height += Math.max(dim.height, ATOM_TEXT_MIN_HEIGHT);
  }
  return { text: t, width, height };
}

/**
 * The `EMPTY_DIAMOND` condition shape (`skinparam ConditionStyle Diamond`
 * -- `ConditionStyle.fromString`'s own `"Diamond"`/`"EmptyDiamond"` match,
 * `svek/ConditionStyle.java:48-50`) -- a FIXED 24x24 blank rhombus with up
 * to four label slots, genuinely different from `GtileDiamondInside`/
 * `GtileDiamondSquare`: `FtileDiamond`'s own constructor takes NO
 * condition-text argument at all (only `north`/`south`/`east`/`west`
 * `TextBlock`s via `withNorth`/`withSouth`/`withWest`/`withEast`) and its
 * `calculateDimensionFtile` NEVER measures any of them for `width` --
 * `width` is unconditionally `Hexagon.hexagonHalfSize * 2` regardless of
 * how wide any label is (`FtileDiamond.java:108-112`; a long side label can
 * visually overflow this tile's own box, the SAME preserved-quirk pattern
 * `GtileDiamondSquare`'s own doc already documents for its north/south).
 *
 * The condition TEXT itself is therefore always supplied by the CALLER as
 * one of the four slots, never as this tile's own `label` (always `''`,
 * so `diamond-labels.ts#emitDiamondOwnLabel`'s centered-own-label draw is a
 * no-op here -- `FtileDiamond#drawU` never draws a centered inscription):
 * `FtileWhile.create`'s EMPTY_DIAMOND branch and `ConditionalBuilder
 * #getShape1`'s EMPTY_DIAMOND branch both route the condition text to
 * `.withNorth(testTb)`, ALWAYS at the `styleDiamond`/`fcTest`/`fcDiamond`
 * FONT bucket (`FtileFactoryDelegatorWhile.java:86`,
 * `ConditionalBuilder.java:241-244`) -- this class's own `testLabel`
 * constructor parameter mirrors that: always north, always measured at
 * `activityFontSize(theme, 'diamond')`, NEVER read from {@link labels}.
 * `FtileRepeat.create`'s EMPTY_DIAMOND branch instead routes its test text
 * to `.withEast(tbTest)` at the ARROW bucket (`fontConfiguration1 =
 * conditionStyle == INSIDE_HEXAGON ? fcDiamond : fcArrow`,
 * `FtileRepeat.java:124-125,156-158` -- EMPTY_DIAMOND takes the `: fcArrow`
 * branch) -- `tile-layout.ts#tileRepeatCondition`'s own EMPTY_DIAMOND call
 * passes `''` for `testLabel` and the condition text through
 * `labels.east` instead, which this class measures at the ARROW bucket
 * like every other slot.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamond.java
 */
export class GtileDiamondEmpty extends TileLeaf implements DiamondConditionTile {
  readonly kind = 'gtile-diamond-empty' as const;
  readonly label = '';
  readonly width = HEXAGON_HALF_SIZE * 2;
  readonly height: number;
  /** `suppY1`/`inY` (`FtileDiamond.java:109,111`): the diamond polygon's
   *  own top edge sits this far below the tile's own top -- nonzero
   *  whenever {@link north} (the test text, for while/if) is set; always
   *  `0` for repeat, which never populates `north` on this class. */
  private readonly inY: number;
  private north: LabelDim;
  private south: LabelDim;
  private west: LabelDim;
  private east: LabelDim;

  constructor(testLabel: string, labels: DiamondInsideLabels, bounder: StringBounder, theme: Theme) {
    super();
    const arrowSize = activityFontSize(theme, 'arrow');
    this.south = measureLabel(labels.south, bounder, arrowSize);
    this.west = measureLabel(labels.west, bounder, arrowSize);
    this.east = measureLabel(labels.east, bounder, arrowSize);
    // `styleDiamond`/`fcTest`/`fcDiamond` bucket -- this class's own doc.
    const diamondSize = activityFontSize(theme, 'diamond');
    this.north = measureLabel(testLabel, bounder, diamondSize);
    this.inY = this.north.height;
    // `FtileDiamond.java:109-111`: `dim = (24, 24 + suppY1)`.
    this.height = HEXAGON_HALF_SIZE * 2 + this.inY;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: this.inY };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
      case EAST_HOOK:
        return { x: this.width, y: this.inY + HEXAGON_HALF_SIZE };
      case WEST_HOOK:
        return { x: 0, y: this.inY + HEXAGON_HALF_SIZE };
      /* c8 ignore next 3 */
      default: {
        const _exhaustive: never = hook;
        throw new Error(`Unknown hook: ${String(_exhaustive)}`);
      }
    }
  }

  /**
   * `FtileDiamond#drawU` (`:85-105`), translated into this tile's own
   * absolute frame (its own `ug.apply(UTranslate.dy(suppY1))` pre-shift
   * folded in, since this port's `labelAt`/`emitDiamondLabels` convention
   * reports every position relative to the TILE's own top, not the
   * diamond-alone box's top -- same convention `GtileDiamondInside`/
   * `GtileDiamondSquare` already use). North/south share the SAME `x =
   * Hexagon.hexagonHalfSize * 1.5 = 18` -- a DIFFERENT constant from
   * `GtileDiamondInside`/`GtileDiamondSquare`'s own `4 + width/2 = 16`,
   * verified directly against the Java rather than copied from either
   * sibling file. West/east both offset by the FIXED
   * `Hexagon.hexagonHalfSize`, exactly like `GtileDiamondInside`'s own
   * `west`/`east` (unlike `GtileDiamondSquare`'s east-only `+5` asymmetry).
   */
  labelAt(side: DiamondSide): { x: number; y: number; width: number; height: number; label: string } | null {
    const dim = this[side];
    if (dim.text === '') return null;
    switch (side) {
      case 'north':
        return { x: HEXAGON_HALF_SIZE * 1.5, y: 0, width: dim.width, height: dim.height, label: dim.text };
      case 'south':
        return { x: HEXAGON_HALF_SIZE * 1.5, y: this.height, width: dim.width, height: dim.height, label: dim.text };
      case 'west':
        return {
          x: -dim.width,
          y: this.inY - dim.height + HEXAGON_HALF_SIZE,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
      case 'east':
        return {
          x: this.width,
          y: this.inY - dim.height + HEXAGON_HALF_SIZE,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
    }
  }

  /** See `GtileDiamondInside#swapEastWest`'s own doc -- same mutating-
   *  setter mirror of `FtileDiamondWIP.java:68-73`. */
  swapEastWest(): void {
    const tmp = this.west;
    this.west = this.east;
    this.east = tmp;
  }

  /**
   * Always `true` -- `calculateDimensionFtile` builds the four-argument
   * `FtileGeometry(dim, left, inY, outY)` constructor (a real `outY`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamond.java:111
   */
  hasPointOut(): boolean {
    return true;
  }
}
