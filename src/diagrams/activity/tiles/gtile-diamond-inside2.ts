import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;

export type DiamondInside2Side = 'north' | 'west' | 'east';

export interface DiamondInside2Labels {
  north?: string;
  west?: string;
  east?: string;
}

interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/** Same convention as `GtileDiamondInside`'s own `measureLabel`: an unset
 *  label is a literal 0x0 box, never handed to the bounder. */
function measureLabel(text: string | undefined, bounder: StringBounder, fontSize: number): LabelDim {
  const t = text ?? '';
  if (t === '') return { text: t, width: 0, height: 0 };
  const dim = bounder.getDimension(t, fontSize);
  return { text: t, width: dim.width, height: dim.height };
}

/** Byte-identical to `gtile-diamond-inside.ts`'s own `hexagonAlone` (D5: no
 *  shared helper module between builder-specific tile files).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java:104-113
 *   -- `calculateDimensionAlone`. */
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
 * The per-branch `elseif` hexagon `FtileIfLongHorizontal` builds one of per
 * branch (D1/D2): a hexagon condition with an optional WEST in-label (a
 * `->label->` on the branch line -- `Branch#getInlabel()`, no AST analogue
 * in this port, a documented gap mirroring T1 Q0's `InstructionSpot` one:
 * zero corpus fixtures pass a non-empty `west`), an optional NORTH branch
 * label (the branch's own positive out-label, `.withNorth(tb1)`), and,
 * only on the LAST branch's diamond, an optional EAST label (the `else`
 * clause's own positive label, `.withEast(tb2)`).
 *
 * Two upstream quirks preserved verbatim (CLAUDE.md: never "fix" an
 * apparent bug inline) -- verified directly against the constructor chain
 * at `FtileDiamondInside2.java:74-77` composed with `FtileDiamondWIP.java:
 * 91-99` (mission `activity-if-tile-port` decision-journal, T5: this
 * traces as a NAME-preserving forward through two differently-ordered
 * parameter lists, not an east/west field swap -- `.withWest(x)` sets
 * `this.west`, `.withEast(x)` sets `this.east`, exactly as their names
 * say; the batch-4 overview's "quirk 1" claim does not hold up under a
 * full trace and is corrected here, not silently repeated):
 * - `drawU` translates BOTH `north` and `south` to the SAME point `(4 +
 *   hexWidth/2, hexHeight)` -- the hexagon's own bottom edge -- so a
 *   `.withNorth()` label always renders BELOW the hexagon, never above.
 *   Verified against `lifeve-53-zubi598`'s golden: "Yes" (the north-label
 *   call) at y=87.556, under a hexagon ending at y=79.
 * - the EAST label draws at `x = hexWidth` (the HEX-ALONE width), not this
 *   tile's own possibly-wider `.width` (when a long north label widens the
 *   box past `left`) -- the east label's own X never accounts for that
 *   widening.
 *
 * `.width`/`.height` are `calculateDimensionFtile`'s (hexagon + north
 * label height); {@link left}, {@link hexWidth}, {@link hexHeight} expose
 * the HEX-ALONE geometry the walker needs directly (`ConnectionHorizontal`'s
 * own `dimDiamond1.getLeft() * 2` point, the drawn hexagon's own polygon
 * size, and every label's own anchor) -- distinct from `.width`/`.height`
 * whenever the north label is wider than the hexagon's own half-width.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java
 */
export class GtileDiamondInside2 extends TileLeaf {
  readonly kind = 'gtile-diamond-inside2' as const;
  readonly label: string;
  readonly width: number;
  readonly height: number;
  readonly left: number;
  readonly hexWidth: number;
  readonly hexHeight: number;
  private readonly north: LabelDim;
  private readonly west: LabelDim;
  private readonly east: LabelDim;

  constructor(label: string, labels: DiamondInside2Labels, bounder: StringBounder, theme: Theme) {
    super();
    this.label = label;
    const arrowSize = activityFontSize(theme, 'arrow');
    this.north = measureLabel(labels.north, bounder, arrowSize);
    this.west = measureLabel(labels.west, bounder, arrowSize);
    this.east = measureLabel(labels.east, bounder, arrowSize);

    const diamondSize = activityFontSize(theme, 'diamond');
    const dimLabel = bounder.getDimension(label, diamondSize);
    const hex = hexagonAlone(dimLabel);
    this.hexWidth = hex.width;
    this.hexHeight = hex.height;
    this.left = hex.width / 2;
    // `calculateDimensionFtile` (`FtileDiamondInside2.java:115-123`): only
    // `north` feeds the height -- `south` is never populated by this
    // builder (never `.withSouth`-called), so its own height contribution
    // is moot, but the Java literally never reads it here either.
    this.height = hex.height + this.north.height;
    this.width = this.north.width > this.left ? this.left + this.north.width : hex.width;
  }

  getCoord(hook: HookName): GPoint {
    switch (hook) {
      case NORTH_HOOK:
      case NORTH_BORDER:
        return { x: this.left, y: 0 };
      case SOUTH_HOOK:
      case SOUTH_BORDER:
        return { x: this.left, y: this.hexHeight };
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
   * local frame (post the alignment shift applied by the caller, D4's
   * `alignDiamonds` fold), or `null` when unset. `north` returns the SAME
   * position `south` would (quirk 2, this class's own doc).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java:79-99
   */
  labelAt(side: DiamondInside2Side): { x: number; y: number; width: number; height: number; label: string } | null {
    const dim = this[side];
    if (dim.text === '') return null;
    if (side === 'north') {
      return { x: 4 + this.left, y: this.hexHeight, width: dim.width, height: dim.height, label: dim.text };
    }
    if (side === 'west') {
      return {
        x: -dim.width,
        y: this.hexHeight / 2 - dim.height,
        width: dim.width,
        height: dim.height,
        label: dim.text,
      };
    }
    return {
      x: this.hexWidth,
      y: this.hexHeight / 2 - dim.height,
      width: dim.width,
      height: dim.height,
      label: dim.text,
    };
  }

  /**
   * Always `true` -- built with the four-argument `(width, height, left,
   * inY)`... no, the FIVE-argument `(width, height, left, inY, outY)`
   * `FtileGeometry` ctor (a real `outY`).
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileDiamondInside2.java:120-123
   */
  hasPointOut(): boolean {
    return true;
  }
}
