import type { GPoint, HookName } from './points.js';
import { EAST_HOOK, NORTH_BORDER, NORTH_HOOK, SOUTH_BORDER, SOUTH_HOOK, WEST_HOOK } from './points.js';
import type { StringBounder, Tile } from './tile.js';
import { TileComposite } from './tile.js';
import type { GtileDiamondInside } from './gtile-diamond-inside.js';
import type { GtileDiamondSquare } from './gtile-diamond-square.js';
import type { GtileDiamondEmpty } from './gtile-diamond-empty.js';
import type { Theme } from '../../../core/theme.js';
import { HEXAGON_HALF_SIZE } from '../layout/hexagon-reservations.js';
import { SEQUENTIAL_ASSEMBLY_GAP } from '../activity-layout-constants.js';

/**
 * `FtileDiamond`'s own fixed box (`FtileDiamond.java:108-112`,
 * `2*hexagonHalfSize` -- the SAME size `GtileRepeatEntry` already uses for
 * the label-less entry diamond `FtileRepeat.create` builds when `entry ==
 * null`), reused here for the break-weld target diamond
 * (`FtileFactoryDelegatorRepeat.java:126`'s `diamondBreak`, D-new).
 */
const WELD_DIAMOND_SIZE = 2 * HEXAGON_HALF_SIZE;

/**
 * `FtileEmpty` (`ftile/FtileEmpty.java:60-93`): diamond2's degenerate
 * form, substituted for the condition hexagon when the repeat has no test
 * AND is the last instruction of its own parent list (`FtileRepeat.java:
 * 143-144`, `if (noOut && Display.isNull(test)) diamond2 = new
 * FtileEmpty(...)`; `noOut` = `InstructionRepeat.isLastOfTheParent()`,
 * `InstructionRepeat.java:117-121,170`). A true 0x0 pass-through -- no
 * polygon, no label, no space of its own (`calculateDimensionEmpty`:
 * `width=height=0`, so every hook collapses to the origin, matching
 * `FtileEmpty.drawU`'s own empty body). `kind` is the discriminant
 * {@link RepeatConditionTile}'s two members narrow on; `'gtile-repeat-
 * empty'` so it can never collide with a real tile kind elsewhere in the
 * switch-based dispatchers this port already has.
 */
export class RepeatConditionEmpty implements Tile {
  readonly kind = 'gtile-repeat-empty' as const;
  readonly width = 0;
  readonly height = 0;
  readonly label = '';
  /** `FtileEmpty`'s own `swimlane` field (`FtileEmpty.java:48,58-67`) is
   *  always `null` at this class's only call site -- `FtileRepeat.create`
   *  (`:143-144`) uses the swimlane-less `new FtileEmpty(skinParam, w, h)`
   *  overload, never the `Swimlane`-carrying one. Declared explicitly
   *  (not left absent) so {@link RepeatConditionTile}'s union still
   *  exposes {@link Tile}'s own optional `swimlane`/`swimlaneOut` fields
   *  to every reader that narrows on the union rather than on this class
   *  alone. Mutable (not `readonly`), matching every other concrete tile
   *  class -- `tile-layout.ts#withSwimlane`/`withSwimlaneOut` assign both
   *  fields post-construction, the same build-time seam every other leaf
   *  tile goes through. */
  swimlane?: string = undefined;
  swimlaneOut?: string = undefined;

  getCoord(_hook: HookName): GPoint {
    return { x: 0, y: 0 };
  }

  /** `FtileEmpty` builds its `FtileGeometry` via the five-argument
   *  constructor (`calculateDimensionEmpty`: `outY = height = 0`, never
   *  the `FtileKilled`-only two-argument overload that leaves `outY`
   *  unset) -- `hasPointOut()` is `true`. */
  hasPointOut(): boolean {
    return true;
  }
}

/**
 * `FtileRepeat.create`'s diamond2 slot: the real condition hexagon
 * (`INSIDE_HEXAGON`, default), the INSIDE_DIAMOND square (CSTYLE, add2
 * T3i: `FtileRepeat.java:159-161`), the EMPTY_DIAMOND blank rhombus
 * (CONDSTYLE-EMPTY, add3 T3a: `FtileRepeat.java:156-159` --
 * `.withEast(tbTest)`, the condition drawn as an EAST label rather than
 * centered), or {@link RepeatConditionEmpty} for the no-test/last-of-
 * parent case (D-new, mission `add2-T3b`, family RNOOUT).
 */
export type RepeatConditionTile = GtileDiamondInside | GtileDiamondSquare | GtileDiamondEmpty | RepeatConditionEmpty;

/** {@link computeWeldLayout}'s return: the merged `left`/`width`/`height`
 *  every existing offset formula reads, the uniform horizontal `shiftX`
 *  every existing child offset must add, and the weld-diamond's own
 *  placement (`undefined` when this repeat has no breaks). Declared here,
 *  before every function that reads it -- Lizard's TypeScript reader
 *  otherwise folds a trailing interface into the NLOC of whichever
 *  function precedes it (`walk-repeat.ts#RepeatFrame`'s own doc cites the
 *  same reader quirk). */
interface WeldLayout {
  readonly left: number;
  readonly width: number;
  readonly height: number;
  readonly shiftX: number;
  readonly weldDiamond: { readonly offsetX: number; readonly offsetY: number } | undefined;
}

/** Every child's own `*OffsetX`/`*OffsetY` ({@link GtileRepeat}'s own
 *  fields) -- split out of the constructor to keep it under the file's
 *  NLOC cap; the formulas themselves are unchanged (`FtileRepeat.java:
 *  744-765`'s `getTranslateDiamond1/2`, `:730-742`'s `getTranslateFor
 *  Repeat`, `:750-757`'s `getTranslateBackward`), each now reading the
 *  RAW (pre-weld) `left`/`height`/`width` plus {@link computeWeldLayout}'s
 *  own uniform `shiftX` on every X term (D-new: a weld never moves a Y
 *  offset, only ever adds the horizontal margin). Declared here for the
 *  same reader-quirk reason as {@link WeldLayout}. */
interface ChildOffsets {
  readonly entryOffsetX: number;
  readonly bodyOffsetX: number;
  readonly bodyOffsetY: number;
  readonly conditionOffsetX: number;
  readonly conditionOffsetY: number;
  readonly backwardOffsetX: number;
  readonly backwardOffsetY: number;
}

/** {@link computeChildOffsets}'s own parameter bundle, kept at the file's
 *  5-parameter cap. */
interface ChildOffsetDims {
  readonly rawLeft: number;
  readonly rawWidth: number;
  readonly rawHeight: number;
  readonly bodyLeft: number;
  readonly entry: Tile;
  readonly body: Tile;
  readonly condition: RepeatConditionTile;
  readonly backward: Tile | undefined;
  readonly shiftX: number;
}

/** {@link computeRawDims}'s return: the PRE-weld `left`/`width`/`height`
 *  (`FtileRepeat.java:701-786`'s own `getLeft`/`getRight`/
 *  `calculateDimensionInternal`, unchanged by D-new) plus `body`'s own
 *  `NORTH_HOOK.x`, read by both {@link computeWeldLayout}'s caller and
 *  {@link computeChildOffsets}. Declared here for the same reader-quirk
 *  reason as {@link WeldLayout}. */
interface RawDims {
  readonly rawLeft: number;
  readonly rawWidth: number;
  readonly rawHeight: number;
  readonly bodyLeft: number;
}

/**
 * `FtileFactoryDelegatorRepeat.repeat()`'s own `repeat.getWeldingPoints()`
 * read (`:123`), done here as a scan over `body`'s already-built Tile tree
 * rather than a build-time `WeldingPoint` list (this port's `Tile`
 * interface has no equivalent, and `tile-layout.ts#tileRepeat` -- the only
 * seam that could thread such a list through -- is outside this task's
 * write-set, common.md "stop and report instead"). Counts EVERY
 * `'gtile-break'` leaf anywhere in the subtree, including inside a NESTED
 * while/repeat -- `walk-repeat.ts#pushRepeatWeldings`'s own walk-time scan
 * has the SAME limitation, documented there (mirroring `walk-while-
 * branch.ts#pushWhileWeldings`'s own documented gap), so this count and
 * that scan always agree with each other, even though neither matches the
 * jar's true loop-boundary semantics for that double-nested case.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileBreak.java:65-68
 */
function countWeldingBreaks(tile: Tile): number {
  if (tile.kind === 'gtile-break') return 1;
  if (tile instanceof TileComposite) {
    return tile.children.reduce((n, c) => n + countWeldingBreaks(c), 0);
  }
  return 0;
}

/**
 * `FtileFactoryDelegatorRepeat.repeat()`'s own weld-diamond assembly
 * (`:123-169`): `FtileUtils.addHorizontalMargin(result, 10, 0)` (`:127`)
 * shifts the existing construct right by 10, then `assembly(...)`
 * (`:127`) stacks `diamondBreak` below it and re-merges `left`/`width`
 * via `FtileGeometryMerger`'s own `left = max(...)`/`width = max(dx-
 * adjusted widths)` (`FtileGeometryMerger.java:38-49`) -- ported term for
 * term since the LEFT-RAIL the first weld routes through (`tileX` in
 * `walk-repeat.ts`) must land OUTSIDE every existing child shape.
 * `SEQUENTIAL_ASSEMBLY_GAP` (35, RAW pre-compression) is the jar's own
 * `FtileFactoryDelegatorAssembly#assembly` gap between ANY two
 * sequentially-joined tiles (`:58`, `activity-layout-constants.ts`'s own
 * doc) -- reused unchanged for the condition-exit-to-diamond-entry
 * internal edge `walk-repeat.ts` draws, never re-derived, since the SAME
 * compression pass that already collapses every OTHER top-level gap to
 * 20px when its Y-band carries no sibling ink (`compress-geometry.ts`)
 * applies here too.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorRepeat.java:123-169
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/FtileGeometryMerger.java:38-49
 */
function computeWeldLayout(rawLeft: number, rawWidth: number, rawHeight: number, weldCount: number): WeldLayout {
  if (weldCount === 0) {
    return { left: rawLeft, width: rawWidth, height: rawHeight, shiftX: 0, weldDiamond: undefined };
  }
  const marginLeft = rawLeft + 10;
  const marginWidth = rawWidth + 10;
  const diamondLeft = WELD_DIAMOND_SIZE / 2;
  const mergedLeft = Math.max(marginLeft, diamondLeft);
  const dx1 = mergedLeft - marginLeft;
  const dx2 = mergedLeft - diamondLeft;
  const width = Math.max(marginWidth + dx1, WELD_DIAMOND_SIZE + dx2);
  const height = rawHeight + SEQUENTIAL_ASSEMBLY_GAP + WELD_DIAMOND_SIZE;
  return {
    left: mergedLeft,
    width,
    height,
    shiftX: mergedLeft - rawLeft,
    weldDiamond: { offsetX: mergedLeft - diamondLeft, offsetY: rawHeight + SEQUENTIAL_ASSEMBLY_GAP },
  };
}

/**
 * `tbTest.calculateDimension().getWidth()` (`FtileRepeat.java:706`): `0`
 * for every `conditionStyle` except EMPTY_DIAMOND, where `tbTest` is the
 * SAME `TextBlock` `condition` itself draws as its own `east` label
 * (`:157-158`'s `.withEast(tbTest)` -- this class's only EMPTY_DIAMOND
 * constructor call, `tile-layout.ts#tileRepeatCondition`, never sets any
 * OTHER slot on that branch, so `east` and `tbTest` are always the same
 * text here). `GtileDiamondEmpty.width` itself stays a fixed 24 regardless
 * of this text's width (`gtile-diamond-empty.ts`'s own doc) -- this is the
 * separate outer floor term the jar applies instead.
 */
function repeatTbTestWidth(condition: RepeatConditionTile): number {
  if (condition.kind !== 'gtile-diamond-empty') return 0;
  return condition.labelAt('east')?.width ?? 0;
}

/**
 * `FtileRepeat.java:767-786`'s own `getLeft`/`getRight`, then
 * `:701-717`'s `calculateDimensionInternal` -- split out of the
 * constructor to keep it under the file's NLOC cap (D-new); formulas
 * unchanged from before this task except the {@link repeatTbTestWidth}
 * floor term (add3 T3a, CONDSTYLE-EMPTY: `:706,709` -- `width = max(width,
 * w + 2*hexagonHalfSize)`, applied BEFORE `backward`'s own `+=` term and
 * the final `+2*hexagonHalfSize`, same order as below).
 */
function computeRawDims(entry: Tile, body: Tile, condition: RepeatConditionTile, backward: Tile | undefined): RawDims {
  const bodyLeft = body.getCoord(NORTH_HOOK).x;
  const entryHalf = entry.width / 2;
  const conditionHalf = condition.width / 2;
  const rawLeft = Math.max(bodyLeft, entryHalf, conditionHalf);
  const right = Math.max(body.width - bodyLeft, entryHalf, conditionHalf);
  const contentWidth = rawLeft + right;
  const tbTestFloor = repeatTbTestWidth(condition) + 2 * HEXAGON_HALF_SIZE;
  let innerWidth = Math.max(contentWidth, 2 * HEXAGON_HALF_SIZE, tbTestFloor);
  if (backward !== undefined) innerWidth += backward.width;
  const rawWidth = innerWidth + 2 * HEXAGON_HALF_SIZE;
  const rawHeight = entry.height + body.height + condition.height + 8 * HEXAGON_HALF_SIZE;
  return { rawLeft, rawWidth, rawHeight, bodyLeft };
}

function computeChildOffsets(d: ChildOffsetDims): ChildOffsets {
  const { rawLeft, rawWidth, rawHeight, bodyLeft, entry, body, condition, backward, shiftX } = d;
  const space = rawHeight - entry.height - body.height - condition.height;
  return {
    entryOffsetX: rawLeft - entry.width / 2 + shiftX,
    bodyOffsetX: rawLeft - bodyLeft + shiftX,
    bodyOffsetY: entry.height + space / 2,
    conditionOffsetX: rawLeft - condition.width / 2 + shiftX,
    conditionOffsetY: rawHeight - condition.height,
    backwardOffsetX: (backward !== undefined ? rawWidth - backward.width : 0) + shiftX,
    backwardOffsetY: backward !== undefined ? (rawHeight - backward.height) / 2 : 0,
  };
}

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
 * `bounder`/`theme` are bundled into one trailing object solely to keep
 * the constructor's own parameter count at the hook's 5-parameter limit
 * once {@link RepeatBackConnection} is added as a real parameter -- neither
 * field is read (kept from before this bundling, when they were named
 * `_bounder`/`_theme`); `tile-layout.ts#tileRepeat` is this class's only
 * call site, so the bundling is invisible to every other tileXxx builder's
 * own `(bounder, theme)` calling convention. `backward` joined the bundle
 * for the same reason (mission `activity-divergence-drive` T3h) rather
 * than becoming a 6th positional parameter.
 */
export interface GtileRepeatContext {
  readonly bounder: StringBounder;
  readonly theme: Theme;
  /**
   * `FtileRepeat`'s own `backward` field (`FtileRepeat.java:84,92-99`):
   * the `backward:LABEL;` activity drawn on the loop's own return edge,
   * when the repeat body has one (`InstructionRepeat.java:79,124-132,
   * 152-161` -- `getGtileBackward`/`getFtileBackward`, built from the
   * SAME `factory.activity(...)` call every ordinary action tile uses).
   * `tile-layout.ts#tileRepeat` is the seam that extracts the `backward`
   * AST node from `node.body` and builds this tile -- outside this task's
   * write-set (overview.md, "report the seam rather than editing").
   * `undefined` for every repeat that has none, which is every call site
   * until that seam is wired.
   */
  readonly backward?: Tile | undefined;
  /** BACKLBL (add2 T3i): `backward:LABEL;`'s own leading `(incoming)`/
   *  trailing `(outgoing)` decorations -- `FtileRepeat.java:170-178,182-
   *  187` (`incoming1`/`incoming2`), carried through to `walk-repeat-
   *  backward.ts` via `RepeatFrame`. Unread when {@link backward} is
   *  unset. */
  readonly backIncoming?: string | undefined;
  readonly backOutgoing?: string | undefined;
}

/**
 * `FtileRepeat`'s three `getMyChildren()` members -- an entry point (a
 * label-less diamond, `GtileRepeatEntry`, or the inline `repeat :label;`
 * action tile), the loop body, and the condition hexagon (mission
 * `activity-loop-tile-port`, T5, D2); the prior interim's home-grown third
 * child and `BACK_EDGE_MARGIN`/`NODE_MARGIN_Y` arithmetic were retired in
 * favour of the jar's own formulas below. A fourth, OPTIONAL `backward`
 * tile (mission `activity-divergence-drive` T3h, previously "0 fixtures" --
 * false, see journal rows 24/34) is carried separately
 * ({@link GtileRepeat.backward}), matching `FtileRepeat.getMyChildren()`
 * (`FtileRepeat.java:87-90`) itself excluding `backward` from that list even
 * though `drawU` draws it (`:690-691`) and `getSwimlanes()` includes it
 * (`:113-115`).
 */
export class GtileRepeat extends TileComposite {
  readonly kind = 'gtile-repeat' as const;
  readonly width: number;
  readonly height: number;
  readonly children: readonly [Tile, Tile, RepeatConditionTile];
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
   *  decided once at build time by `tile-layout.ts#tileRepeat` (D5, T6).
   *  Unread by `walk-repeat.ts` when {@link backward} is set -- the jar's
   *  own selection (`FtileRepeat.java:181-196`) never reaches this branch
   *  in that case either. */
  readonly backConnection: RepeatBackConnection;
  /** {@link GtileRepeatContext.backward}, carried onto the instance. */
  readonly backward: Tile | undefined;
  /** {@link GtileRepeatContext.backIncoming}/{@link GtileRepeatContext.backOutgoing},
   *  carried onto the instance. */
  readonly backIncoming: string | undefined;
  readonly backOutgoing: string | undefined;
  /** `getTranslateBackward`'s `x`/`y` (`FtileRepeat.java:750-757`): `x =
   *  dimTotal.width - backward.width`, `y = (dimTotal.height -
   *  backward.height) / 2` -- flush to the tile's own right edge,
   *  vertically centred. `0` when {@link backward} is unset (unread by
   *  `walk-repeat.ts` in that case, mirroring `conditionOffsetX` etc.'s
   *  own always-computed style). */
  readonly backwardOffsetX: number;
  readonly backwardOffsetY: number;
  /** {@link computeWeldLayout}'s own `weldDiamond`: the break-weld target
   *  diamond's placement in THIS tile's own frame, `undefined` when this
   *  repeat has no `break` (D-new, `countWeldingBreaks`). */
  readonly weldDiamond: { readonly offsetX: number; readonly offsetY: number } | undefined;

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
   *   8*hexagonHalfSize`; `backward` never widens `height` (no term above
   *   reads it). `if (backward != null) width += backward.w;` (`:710-711`)
   *   IS applied below, before the final `+2*hexagonHalfSize` -- `backward`
   *   never widens `getLeft()`/`getRight()` either (neither reads it).
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
   * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileRepeat.java:750-757
   *   -- `getTranslateBackward`: `x = dimTotal.w - backward.w`,
   *   `y = (dimTotal.h - backward.h) / 2` -- read AFTER `width`/`height`
   *   are final, since both already include `backward`'s own width term.
   */
  constructor(
    entry: Tile,
    body: Tile,
    condition: RepeatConditionTile,
    backConnection: RepeatBackConnection,
    ctx: GtileRepeatContext,
  ) {
    super();
    this.backConnection = backConnection;
    ({ backward: this.backward, backIncoming: this.backIncoming, backOutgoing: this.backOutgoing } = ctx);
    const dims = computeRawDims(entry, body, condition, ctx.backward);
    const weld = computeWeldLayout(dims.rawLeft, dims.rawWidth, dims.rawHeight, countWeldingBreaks(body));
    this.left = weld.left;
    this.width = weld.width;
    this.height = weld.height;
    this.weldDiamond = weld.weldDiamond;

    const offsets = computeChildOffsets({
      ...dims,
      entry,
      body,
      condition,
      backward: ctx.backward,
      shiftX: weld.shiftX,
    });
    this.entryOffsetX = offsets.entryOffsetX;
    this.bodyOffsetX = offsets.bodyOffsetX;
    this.bodyOffsetY = offsets.bodyOffsetY;
    this.conditionOffsetX = offsets.conditionOffsetX;
    this.conditionOffsetY = offsets.conditionOffsetY;
    this.backwardOffsetX = offsets.backwardOffsetX;
    this.backwardOffsetY = offsets.backwardOffsetY;

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
