/**
 * Layout constants for the activity diagram layout engine.
 */

import type { Theme } from '../../core/theme.js';

export const NODE_MARGIN_Y = 20;
export const NODE_MARGIN_X = 40;

/**
 * The RAW (pre-compression) vertical gap `FtileFactoryDelegatorAssembly
 * #assembly` inserts between EVERY pair of sequentially-joined tiles --
 * top-level, inside a fork/split branch, an if-branch, a switch-case body,
 * a repeat body, anywhere `Swimlanes`'s single shared factory decorator
 * runs (`Swimlanes.java:145`: `factory = new
 * FtileFactoryDelegatorAssembly(factory)`, applied once, for the whole
 * diagram). A second, labelled-arrow term (`height += textBlock
 * .calculateDimension(...).getHeight()`, `:59-62`) is added at THIS
 * constant's own call site (`tiles/gtile-top-down.ts#sequentialGap`,
 * T1b pass 2), not as a second constant here, whenever the NEXT child
 * carries a pending `-> label;` ({@link Tile.inLabel}'s own doc).
 *
 * This raw gap is NEVER the rendered number by itself: `ActivityDiagram3
 * #getTextBlock` (`:209-210`) always runs `CompressionXorYBuilder.build
 * (ON_X, ...)` then `build(ON_Y, ...)` over the WHOLE assembled diagram
 * afterward (ported as {@link compressGeometry}, wired by
 * `assign-coordinates-full.ts#compressAndAssemble`). Compression scans ink
 * GLOBALLY on the Y axis (every shape's y-extent, independent of x,
 * `SlotFinder.java:111-162`) and removes any ink-free Y-band wider than
 * `2 * margin` (`CompressionXorYBuilder.java:66`'s `smaller(5.0)`) down to
 * exactly that `2 * margin = 10` px. A top-level gap with no sibling ink in
 * its Y-band compresses 35 -> 20 (verified: `scripts/oracle-render.sh` on
 * `:A;\n:B;` renders boxes 32px apart with NOTHING else in that band but a
 * 10px trailing arrowhead, exactly `2*5 + 10`); a fork/split-branch gap
 * whose Y-band is occupied by a sibling branch's box stays the full raw 35
 * (verified on a two-branch fork with one branch carrying two sequential
 * actions: 35px gap, uncompressed, not a different constant -- the SAME
 * raw value, the SAME compression pass, a different outcome only because
 * the ink differs). Was an unsourced flat `NODE_MARGIN_Y = 20` baked
 * directly into the pre-compression layout in `gtile-top-down.ts`, which
 * happened to reproduce the (degenerate, saturated) top-level answer by
 * coincidence while leaving every branch-internal gap 15px short.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/FtileFactoryDelegatorAssembly.java:58-62
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/Swimlanes.java:145
 * @see net/sourceforge/plantuml/activitydiagram3/ActivityDiagram3.java:204-213
 */
export const SEQUENTIAL_ASSEMBLY_GAP = 35;

/**
 * T1b pass 2: the activity-scoped `arrow` font size
 * (`plantuml.skin:373`, `activityDiagram { arrow { FontSize 11 } }`),
 * used ONLY at LAYOUT time (`tiles/gtile-top-down.ts#sequentialGap`,
 * `layout/tile-layout-inlabel.ts#inLabelReservation`) to size an
 * in-link label's own height/ink reservation -- `walkTile`'s own
 * signature carries no `Theme`, unlike `renderer.ts#renderEdgeLabel`'s
 * `activityFontSize(theme, 'arrow')` (the SAME default, resolved
 * theme-aware at render time). A `skinparam ArrowFontSize` override
 * would be reflected in the FINAL render but not in this layout-time
 * reservation -- a residual, not fixed here (threading `Theme` through
 * every `walkTile`/`pushTopDownSiblingEdge` call site is a much larger
 * change than this constant).
 */
export const ARROW_LABEL_LAYOUT_FONT_SIZE = 11;
export const START_STOP_RADIUS = 10;

/**
 * `stop`'s outer (bullseye) ellipse radius. `FtileCircleStop#drawU`
 * (`:87-89`) delegates ALL drawing to a `CircleEnd` field, never drawing
 * anything itself; `CircleEnd` has its OWN `SIZE = 22` (`:55`) -- the SAME
 * number `FtileCircleStop#calculateDimensionFtile` (`:92-94`,
 * `new FtileGeometry(SIZE, SIZE, SIZE/2, 0)`) uses for the TILE, so tile
 * diameter and the drawn outer ellipse's diameter are one constant by
 * construction, not two independently-chosen numbers. Was an unsourced 14
 * (T1c, `plans/activity-divergence-drive`, D3) shared with the former
 * `GtileKill` tile (deleted by T2b: kill/detach draw nothing).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleStop.java:55,87-94
 * @see net/sourceforge/plantuml/svek/image/CircleEnd.java:55,72-73
 */
export const STOP_OUTER_RADIUS = 11;

/**
 * `CircleEnd#drawU`'s inner (filled) ellipse: `delta = 5` (`:88`) insets
 * the small ellipse on every side, so its diameter is `SIZE - delta*2` and
 * its radius is the outer radius minus this same `delta` -- not an
 * independent fraction of the outer radius (the port's old `* 0.55` was
 * unsourced and is deleted).
 * @see net/sourceforge/plantuml/svek/image/CircleEnd.java:88-89
 */
export const STOP_INNER_DELTA = 5;

/**
 * `end`'s outer ellipse radius. `FtileCircleEndCross` draws itself (no
 * delegate, unlike `stop`): own `SIZE = 20` (`:61`), reused unchanged by
 * `calculateDimensionFtile` (`:119-121`) for the tile.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleEndCross.java:61,98-121
 */
export const END_OUTER_RADIUS = 10;

/**
 * `end`'s cross stroke thickness -- hardcoded in `drawU` (`:110`),
 * independent of the style's own `LineThickness` ({@link
 * CIRCLE_END_LINE_THICKNESS} in `activity-style-defaults.ts`, which strokes
 * only the outer ellipse). Drives the inset diagonals: `size2 = (SIZE -
 * thickness) / sqrt(2)` (`:111`), `delta = (SIZE - size2) / 2` (`:112`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileCircleEndCross.java:109-115
 */
export const END_CROSS_THICKNESS = 2.5;

/** `Opale.java:56` -- `public static final int marginX1 = 6;`, the note
 *  box's own LEFT text inset (also the renderer's `labelX = x + 6`,
 *  `activity-renderer-shapes.ts#renderNote`). `GtileNote`'s sizing used an
 *  unsourced `NOTE_H_PAD=16` (doubled, +32) until `activity-divergence-
 *  drive-3` T2a (family NOTE-SIZE) replaced it with Opale's own two
 *  distinct margins below -- filed `activity-note-width-overscan` is
 *  CLOSED by this change. */
export const NOTE_MARGIN_X1 = 6;
/** `Opale.java:57` -- `public static final int marginX2 = 15;`, the note
 *  box's own RIGHT text inset (asymmetric: the fold corner at the
 *  top-right, `NOTE_CORNER_SIZE`, needs more clearance than the left
 *  edge). See {@link NOTE_MARGIN_X1}'s doc for the T2a replacement. */
export const NOTE_MARGIN_X2 = 15;
/** `Opale.java:53` -- `private static final int cornersize = 10;`, the
 *  note balloon's dog-ear fold triangle size, used by BOTH the no-link
 *  path (`getPolygonNormal`, `:149-171`) and every spiked direction
 *  (`getPolygonLeft/Right/Up/Down`, `:175-265`) for their shared
 *  `lineTo(width, cornersize)` / `lineTo(width - cornersize, 0)` pair and
 *  by `getCorner` (`:134-147`) for the fold triangle itself. Purely a draw
 *  geometry constant -- the TILE's own width/height ({@link
 *  NOTE_MARGIN_X1}/{@link NOTE_MARGIN_X2}/{@link NOTE_MARGIN_Y}, `gtile-
 *  note.ts`) are a separate concern. */
export const NOTE_CORNER_SIZE = 10;
/** `Opale.java:173` -- `private final double delta = 4;`, the spike's
 *  vertical half-span at the note edge it leaves from. */
export const NOTE_SPIKE_DELTA = 4;
/** `Opale.java:58` -- `private final int marginY = 5;`, the text block's
 *  own top inset (`Opale#drawU`, `:127`:
 *  `textBlock.drawU(ug.apply(new UTranslate(marginX1, marginY)))`). Was
 *  an unsourced `NOTE_FOLD` (8) reused for the label baseline, which
 *  landed 5.889px low on `volefo-41-tolo996`'s single-line note. */
export const NOTE_MARGIN_Y = 5;
/** `FtileWithNoteOpale.java:85` -- `private final double suppSpace = 20;`,
 *  the gap this composite's `getTranslate`/`getTranslateForOpale` (`:155-
 *  167,177-193`) reserves between the note balloon and the tile it wraps.
 *  Mission `activity-divergence-drive-2` T3g (family NOTE). */
export const NOTE_OPALE_GAP = 20;
/** The fork's black join bar's height. `GtileSplit` overrides with
 *  {@link THIN_SPLIT_HEIGHT} instead (`gtile-split.ts`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/AbstractParallelFtilesBuilder.java:64
 *   -- `protected final double barHeight = 6;`. Was an unsourced `8`. */
export const BAR_HEIGHT = 6;
/** The split's thin join-line height/stroke-width, replacing `BAR_HEIGHT`
 *  for `GtileSplit` (`gtile-split.ts`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileThinSplit.java:61
 *   -- `private final double height = 1.5;`. */
export const THIN_SPLIT_HEIGHT = 1.5;
/** N (add2 T3i): `end fork {label}`'s own join-bar label margin.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vertical/FtileBlackBlock.java:65
 *   -- `private final double labelMargin = 5;`. */
export const JOIN_LABEL_MARGIN = 5;
/** Per-branch horizontal margin on EACH side of a fork/split branch
 *  (`computeNewFtile`'s `xMargin`, applied via `FtileUtils
 *  .addHorizontalMargin`). Replaces the fork's unsourced `BAR_OVERHANG`
 *  (10, module-local to `gtile-fork.ts` before apc-T4) and the fork's use
 *  of {@link NODE_MARGIN_X} as the between-branch gap -- upstream has no
 *  separate "between branches" constant; every branch is independently
 *  margined by this same value on both sides, then packed with no other
 *  gap (`FtileForkInner.java:90-113`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/AbstractParallelFtilesBuilder.java:130
 *   -- `final double xMargin = 14;`. */
export const PARALLEL_X_MARGIN = 14;
/** Vertical padding centred above/below a fork/split branch's own height
 *  to bring it up to the tallest branch's height, applied TWICE (once on
 *  each side, via `FtileHeightFixedCentered` fixing every branch to
 *  `maxHeight + 2 * spaceArroundBlackBar`).
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/AbstractParallelFtilesBuilder.java:129
 *   -- `final double spaceArroundBlackBar = 20;`. */
export const SPACE_AROUND_BLACK_BAR = 20;

export const DIAMOND_MIN = 20;
export const DIAMOND_LABEL_PAD = 10;

// ---------------------------------------------------------------------------
// Canvas origin (T1a, D2) -- `Recentred` + the document margin + the SVG
// writer's own ceiling. Replaces the flat `LAYOUT_MARGIN = 12` that used to
// live in `layout/tile-coordinates.ts` (memory `activity-canvas-margin-
// premise-was-false`: the 12 was measured off a golden, never read from the
// Java). See `assign-coordinates-full.ts#computeCanvasOrigin` for the
// algorithm these feed.
// ---------------------------------------------------------------------------

/**
 * `Recentred#drawU`'s own fixed inner pad -- it translates its child by
 * `(-minMax.getMinX() + 5, -minMax.getMinY() + 5)`, independent of (and
 * BEFORE) the document margin's own translate.
 * @see net/sourceforge/plantuml/activitydiagram3/Recentred.java:47-59
 */
export const RECENTRED_PAD = 5;

/**
 * `Recentred#getMinMax`'s own `enlarge(15, 15)` -- grows the ink box's FAR
 * corner by 15 on each axis (the near corner, read by `drawU`'s translate
 * above, is untouched by `enlarge`), so `Recentred`'s OWN reported size is
 * `(M - m) + RECENTRED_ENLARGE` -- this is `RenderFragment.preChromeWidth`/
 * `preChromeHeight`'s target value (T3j): the size jar's `DiagramChromeFactory
 * .create` receives as the diagram's "original" `TextBlock`, BEFORE the
 * document margin wraps the chrome-decorated result.
 * @see net/sourceforge/plantuml/activitydiagram3/Recentred.java:56
 */
export const RECENTRED_ENLARGE = 15;

/**
 * `TitledDiagram#getDefaultMargins()` -- `ClockwiseTopRightBottomLeft
 * .same(10)`; `ActivityDiagram3` declares no override. T3j (journal row 36):
 * unlike `CucaDiagram`'s asymmetric `(0, 5, 5, 0)` (`class/layout-ink-
 * extent.ts`), this margin is symmetric on every side, so wrapping it around
 * an already-composed (chrome-included) block requires an explicit SHIFT of
 * that block's body by `(ACTIVITY_DOCUMENT_MARGIN, ACTIVITY_DOCUMENT_MARGIN)`
 * -- not just a pad of the declared width/height -- see
 * `canvas-origin.ts#applyActivityDocumentMargin`.
 * @see net/sourceforge/plantuml/TitledDiagram.java:275
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:172-173,199-202,510-516
 */
export const ACTIVITY_DOCUMENT_MARGIN = 10;

/** A `ClockwiseTopRightBottomLeft` document margin. */
export interface DocumentMargin {
  readonly top: number;
  readonly right: number;
  readonly bottom: number;
  readonly left: number;
}

/** `ClockwiseTopRightBottomLeft.same(ACTIVITY_DOCUMENT_MARGIN)`. */
const DEFAULT_DOCUMENT_MARGIN: DocumentMargin = {
  top: ACTIVITY_DOCUMENT_MARGIN,
  right: ACTIVITY_DOCUMENT_MARGIN,
  bottom: ACTIVITY_DOCUMENT_MARGIN,
  left: ACTIVITY_DOCUMENT_MARGIN,
};

/**
 * `TextBlockExporter#calculateMargin`: the merged `{root, document}` style's
 * `Margin` when it has one (`theme.diagramMargin`, `build-theme.ts
 * #withDocumentStyle`), else `getDefaultMargins()` -- `same(10)`
 * (add4-T2e THEME-MARGIN: `!theme amiga`'s `root { Margin 5 }`,
 * `themes/puml-theme-amiga.puml:40`).
 *
 * The exporter translates the block by `(left, top)` and sizes the canvas
 * `dim + left + right` x `dim + top + bottom`, so every node/edge/swimlane's
 * near-corner shift is `RECENTRED_PAD + left` (resp. `top`) and the canvas
 * span's constant term is `RECENTRED_ENLARGE + left + right` (resp. `top +
 * bottom`) -- `5 + 10 = 15` and `15 + 10 + 10 = 35` by default.
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:172-173,199-202,510-516
 */
export function activityDocumentMargin(theme: Theme): DocumentMargin {
  return theme.diagramMargin ?? DEFAULT_DOCUMENT_MARGIN;
}

/**
 * The theme the activity layout and its warning banner run with. A diagram
 * with title/legend/caption/header/footer/mainframe chrome is margined by
 * `layout/document-margin.ts#applyActivityChrome`, which `src/index.ts`
 * calls with no theme and which therefore undoes and re-applies the fixed
 * `ACTIVITY_DOCUMENT_MARGIN`; such a diagram keeps that default here too,
 * so the inverse stays exact. Residual (add4-T2e): the jar applies the
 * theme's margin there as well (`TextBlockExporter.java:510-516`).
 */
export function documentMarginTheme(theme: Theme, hasChrome: boolean): Theme {
  if (!hasChrome || theme.diagramMargin === undefined) return theme;
  const { diagramMargin: _ignored, ...rest } = theme;
  return rest;
}

/**
 * `SvgGraphics#ensureVisible`'s own `(int)(x + 1)` cast: the FIRST point it
 * is asked to keep visible is `option.getMinDim()` -- i.e. the floating-point
 * dimension `TextBlockExporter#calculateFinalDimension` just computed -- so
 * the emitted SVG `width`/`height` attribute is always one pixel larger than
 * that computed dimension (confirmed against the oracle: `kodiji-34-mofe202`,
 * a lone `start` circle, measures a 54×54 ink+margin box by the formula above
 * but renders `width="55px" height="55px"`).
 * @see net/sourceforge/plantuml/klimt/drawing/svg/SvgGraphics.java:129-136,142-143
 */
export const SVG_CANVAS_CEIL = 1;
