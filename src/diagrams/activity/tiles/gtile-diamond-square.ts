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
 *  same constant as `gtile-diamond-inside.ts`'s own copy.
 * @see net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181 */
const ATOM_TEXT_MIN_HEIGHT = 10;

interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/** Same multi-line fold as `gtile-diamond-inside.ts#measureLabel` -- kept
 *  as its own copy rather than a shared import so this file stays a
 *  self-contained, faithful mirror of `FtileDiamondSquare` the way
 *  `FtileDiamondSquare.java` is its own file, not a subclass override of
 *  `FtileDiamondInside.java` (the two upstream classes share only the
 *  abstract `FtileDiamondWIP` base, not a drawing method). */
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
 * The `INSIDE_DIAMOND` condition shape (`skinparam ConditionStyle
 * InsideDiamond`) -- a plain 4-point rhombus (`Hexagon.asPolygonSquare`,
 * UNCLOSED unlike `asPolygon`'s repeated-first-point 5/7-point forms) with
 * up to four label slots, sized and positioned by `FtileDiamondSquare`
 * (`vertical/FtileDiamondSquare.java`), NOT `FtileDiamondInside`'s hexagon
 * formula -- see this class's own method docs for exactly where the two
 * diverge.
 *
 * `calculateDimensionFtile` (Java `:109-112`) does NOT add the north
 * label's height to the Ftile's own reported height, unlike
 * `GtileDiamondInside` -- `this.height` below IS the diamond-alone size;
 * mirrored verbatim even though it means a tall north/south label can
 * visually overflow this tile's own bounding box upstream too.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondSquare.java
 */
export class GtileDiamondSquare extends TileLeaf implements DiamondConditionTile {
  readonly kind = 'gtile-diamond-square' as const;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  private north: LabelDim;
  private south: LabelDim;
  private west: LabelDim;
  private east: LabelDim;

  constructor(label: string, labels: DiamondInsideLabels, bounder: StringBounder, theme: Theme) {
    super();
    this.label = label;
    const arrowSize = activityFontSize(theme, 'arrow');
    this.north = measureLabel(labels.north, bounder, arrowSize);
    this.south = measureLabel(labels.south, bounder, arrowSize);
    this.west = measureLabel(labels.west, bounder, arrowSize);
    this.east = measureLabel(labels.east, bounder, arrowSize);

    const diamondSize = activityFontSize(theme, 'diamond');
    // IFNL-class fix (T3d): per-line fold, same reason as
    // `gtile-diamond-inside.ts`'s own `dimLabel` fix.
    const dimLabel = measureLabel(label, bounder, diamondSize);
    if (dimLabel.width === 0 || dimLabel.height === 0) {
      this.width = HEXAGON_HALF_SIZE * 2;
      this.height = HEXAGON_HALF_SIZE * 2;
    } else {
      // `dimLabel.delta(24, 24)` (`FtileDiamondSquare.java:120`) -- BOTH
      // axes padded by the full `hexagonHalfSize * 2`, never `atLeast`'d
      // against it first (the hexagon variant's `atLeast(24,24).delta(24,0)`
      // pads width only and floors each axis at 24 -- a genuinely different
      // formula, not a copy-paste of the same one).
      this.width = dimLabel.width + HEXAGON_HALF_SIZE * 2;
      this.height = dimLabel.height + HEXAGON_HALF_SIZE * 2;
    }
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.width / 2, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.width / 2, y: this.height };
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
   * `FtileDiamondSquare#drawU` (`:93-104`). `north`/`south` share the
   * SAME position (the diamond's own bottom, `:93-94`) -- the identical
   * "fix why north and south are the same" quirk the hexagon variant
   * also mirrors. `west` offsets by the FIXED `Hexagon.hexagonHalfSize`
   * (`:101`), not this tile's own `height / 2` -- genuinely different from
   * `GtileDiamondInside#labelAt`'s `west`, which DOES use its own
   * hexHeight/2. `east` adds a further `+5` on top of that same constant
   * (`:104`) that `west` does not get -- an asymmetry upstream states
   * outright, not a transcription slip.
   */
  labelAt(side: DiamondSide): { x: number; y: number; width: number; height: number; label: string } | null {
    const dim = this[side];
    if (dim.text === '') return null;
    switch (side) {
      case 'north':
      case 'south':
        return { x: 4 + this.width / 2, y: this.height, width: dim.width, height: dim.height, label: dim.text };
      case 'west':
        return {
          x: -dim.width,
          y: -dim.height + HEXAGON_HALF_SIZE,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
      case 'east':
        return {
          x: this.width,
          y: -dim.height + HEXAGON_HALF_SIZE + 5,
          width: dim.width,
          height: dim.height,
          label: dim.text,
        };
    }
  }

  /** See `GtileDiamondInside#swapEastWest`'s own doc comment -- same
   *  mutating-setter mirror of `FtileDiamondWIP.java:68-73`. */
  swapEastWest(): void {
    const tmp = this.west;
    this.west = this.east;
    this.east = tmp;
  }

  /** Always `true` -- see `GtileDiamondInside#hasPointOut`'s own doc. */
  hasPointOut(): boolean {
    return true;
  }
}
