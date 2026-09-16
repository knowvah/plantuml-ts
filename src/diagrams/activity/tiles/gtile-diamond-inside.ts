import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

export type DiamondSide = 'north' | 'south' | 'west' | 'east';

export interface DiamondInsideLabels {
  north?: string;
  south?: string;
  west?: string;
  east?: string;
}

interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/**
 * `TextBlockUtils.empty(0, 0)` for an unset label -- measured as a literal
 * 0x0 box, never handed to the bounder (an empty-string query on a real
 * bounder can still report a nonzero line height).
 */
function measureLabel(text: string | undefined, bounder: StringBounder, fontSize: number): LabelDim {
  const t = text ?? '';
  if (t === '') return { text: t, width: 0, height: 0 };
  const dim = bounder.getDimension(t, fontSize);
  return { text: t, width: dim.width, height: dim.height };
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
export class GtileDiamondInside extends TileLeaf {
  readonly kind = 'gtile-diamond-inside' as const;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  private readonly hexHeight: number;
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
    const dimLabel = bounder.getDimension(label, diamondSize);
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
