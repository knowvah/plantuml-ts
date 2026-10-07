import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder } from './tile.js';
import { TileLeaf } from './tile.js';
import type { Theme } from '../../../core/theme.js';
import { activityFontSize } from '../activity-style-defaults.js';
import { creoleTextLines } from '../../../core/svek/image/creole-text-lines.js';
import { measurerAdapterOf } from './gtile-action.js';

/** add3-T3f (PADDING, padding-only edit per this task's write-set): the
 *  bare `skinparam padding N` key (`theme-root-fields.ts#padding`), added
 *  to BOTH axes of the condition label's own measured dimension before
 *  {@link hexagonAlone} sizes the hexagon around it --
 *  `ConditionalBuilder.java:244`'s `new SheetBlock1(sheet, diamondLineBreak,
 *  skinParam.getPadding())` feeds this SAME global key into the hexagon's
 *  inner `tbTest`, whose `calculateDimensionSlow` (`SheetBlock1.java:194-
 *  197`, single-arg `.delta()`) adds it to width AND height alike --
 *  `measureLabel` below is this port's stand-in for measuring that real
 *  `tbTest`, so the term is added here rather than inside it. */
function withGlobalPadding(dim: { width: number; height: number }, theme: Theme): { width: number; height: number } {
  const pad = theme.padding ?? 0;
  if (pad === 0) return dim;
  return { width: dim.width + 2 * pad, height: dim.height + 2 * pad };
}

/** `Hexagon.hexagonHalfSize`. @see net/sourceforge/plantuml/activitydiagram3/ftile/Hexagon.java:46 */
const HEXAGON_HALF_SIZE = 12;
/** `AtomText#calculateDimensionSlow`'s own per-line height floor (L, T3d):
 *  `if (h < 10) h = 10`. Applied per LINE inside {@link measureLabel}, not
 *  once to the summed total -- each creole line is its own `AtomText`.
 * @see net/sourceforge/plantuml/klimt/creole/legacy/AtomText.java:179-181 */
const ATOM_TEXT_MIN_HEIGHT = 10;

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

interface LabelDim {
  readonly text: string;
  readonly width: number;
  readonly height: number;
}

/**
 * `TextBlockUtils.empty(0, 0)` for an unset label -- measured as a literal
 * 0x0 box, never handed to the bounder (an empty-string query on a real
 * bounder can still report a nonzero line height). A multi-line label
 * (real `\n`s, already unescaped by `if-dispatch.ts#unescapeLabelNewlines`
 * before this constructor ever sees them -- D5, `bazuma-86-metu353`) is
 * measured ONE LINE AT A TIME and folded to width=MAX, height=SUM, instead
 * of a single `getDimension` call on the whole string (which summed every
 * character's width on ONE reported line, including the two now-unescaped
 * `\`/`n` glyphs, and never reserved room for the extra lines below).
 * `renderIfLabel`'s own `textLines` draw pass already advances by exactly
 * `fontSize` per line (`ASCENT_FRACTION`, `activity-renderer-shapes.ts`);
 * summing each line's OWN reported height (every line here is `fontSize`
 * per `measure`'s own `height: font.size`, `core/measurer.ts:190`)
 * reproduces that same N*fontSize total without a second hard-coded
 * constant. Jar-verified on `bazuma-86-metu353`'s 6-line else label: its
 * `<text>` elements sit 11.0 apart (== `fontSize`), one `y` step per line.
 */
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
 * add4-T2d (DIAMOND-CREOLE-WIDTH, `mazoka-64-nixi123`): the condition text
 * is a creole `Sheet`, not raw text -- `ConditionalBuilder#getShape1` builds
 * `skinParam.sheet(styleDiamonFont, horizontalAlignment, CreoleMode.FULL)
 * .createSheet(labelTest)` inside a `SheetBlock1`
 * (`vcompact/cond/ConditionalBuilder.java:241-244`), so `**[EOL]**` is
 * measured as its bold atom `[EOL]`, never with its four `*`. Each line's
 * width goes through the SAME real lexer `gtile-action.ts#creoleLineWidth`
 * uses (`creoleTextLines`); the per-line height fold is
 * {@link measureLabel}'s.
 */
function measureCondition(text: string, bounder: StringBounder, fontSize: number, family: string): LabelDim {
  const dim = measureLabel(text, bounder, fontSize);
  if (dim.width === 0) return dim;
  const measurer = measurerAdapterOf(bounder);
  const widths = text
    .split('\n')
    .map((line) => creoleTextLines(line, { family, size: fontSize }, measurer)[0]?.width ?? 0);
  return { ...dim, width: Math.max(...widths) };
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

  constructor(label: string, labels: DiamondInsideLabels, bounder: StringBounder, theme: Theme) {
    super();
    this.label = label;
    const arrowSize = activityFontSize(theme, 'arrow');
    this.north = measureLabel(labels.north, bounder, arrowSize);
    this.south = measureLabel(labels.south, bounder, arrowSize);
    this.west = measureLabel(labels.west, bounder, arrowSize);
    this.east = measureLabel(labels.east, bounder, arrowSize);

    const diamondSize = activityFontSize(theme, 'diamond');
    // IFNL (T3d, `vaxiki-78-nice114`): a multi-line condition (unescaped
    // real `\n`s, `if-dispatch.ts#unescapeLabelNewlines`) needs the SAME
    // per-line fold as the north/south/east/west labels above -- a single
    // `getDimension` call on the whole string reports one oversized line,
    // not `label.calculateDimension`'s own per-`AtomText` sum
    // (`AtomText.java` via `SheetBlock1`/`TextBlockLineCentered`).
    const dimLabel = withGlobalPadding(measureCondition(label, bounder, diamondSize, theme.fontFamily), theme);
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
