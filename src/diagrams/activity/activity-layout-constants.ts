/**
 * Layout constants for the activity diagram layout engine.
 */

export const NODE_MARGIN_Y = 20;
export const NODE_MARGIN_X = 40;
export const START_STOP_RADIUS = 10;
/** The connector-spot circle (`gtile-spot`). A DIFFERENT circle from
 *  {@link START_STOP_RADIUS} and from `abel/EntityPosition.RADIUS` — all
 *  three were once spelled `RADIUS` — and different again from json's
 *  own `SPOT_RADIUS = 3`, which is why this one is not called that. */
export const CONNECTOR_SPOT_RADIUS = 8;

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

/** The note box's own horizontal padding. Split out of the former
 *  `ACTION_H_PAD` by `activity-style-defaults` T4, which replaced that
 *  constant's ACTION-box uses with the resolved `activityPadding`.
 *
 *  Deliberately NOT routed through that resolver: upstream's `note` block
 *  (`plantuml.skin:322-326`) declares no `Padding`, so the resolved value
 *  is 0, and an activity note's box geometry comes from `Opale`
 *  (`ftile/vcompact/FtileWithNoteOpale.java`) rather than from
 *  `FtileBox`'s padding arithmetic at all. 16 is this port's own unsourced
 *  number and stays exactly as it was; substituting the resolved 0 would
 *  collapse every note box on a guess. Owned by the filed
 *  `activity-note-width-overscan` mission, not by this one. */
export const NOTE_H_PAD = 16;
export const NOTE_FOLD = 8;
/** `Opale.java:53` -- `private static final int cornersize = 10;`, the
 *  note balloon's dog-ear fold triangle size, used by BOTH the no-link
 *  path (`getPolygonNormal`, `:149-171`) and every spiked direction
 *  (`getPolygonLeft/Right/Up/Down`, `:175-265`) for their shared
 *  `lineTo(width, cornersize)` / `lineTo(width - cornersize, 0)` pair and
 *  by `getCorner` (`:134-147`) for the fold triangle itself. A DIFFERENT
 *  number from {@link NOTE_FOLD} (which sizes the note TILE, `gtile-
 *  note.ts`, filed separately as `activity-note-width-overscan`) -- the
 *  renderer's fold geometry is correct against the jar regardless of
 *  whether the tile's own width/height are. */
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
 * The near-corner shift every node/edge/swimlane receives, regardless of
 * shape: upstream's symmetric document margin (`same(10)`) PLUS `Recentred`'s
 * own fixed inner pad. `Recentred#drawU` translates its child by
 * `(-minMax.getMinX() + 5, -minMax.getMinY() + 5)` BEFORE the document
 * margin's own `(10, 10)` translate wraps it
 * (`TextBlockExporter#exportTo`'s `ug.apply(new UTranslate(margin.getLeft(),
 * margin.getTop()))`) -- the two compose to `10 + 5 = 15` on the near side.
 * @see net/sourceforge/plantuml/TitledDiagram.java:275 -- `getDefaultMargins()`
 *   returns `ClockwiseTopRightBottomLeft.same(10)`; `ActivityDiagram3`
 *   declares no override.
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:172-173,199-202,510-516
 * @see net/sourceforge/plantuml/activitydiagram3/Recentred.java:47-59
 */
export const CANVAS_ORIGIN_SHIFT = 15;

/**
 * The constant term in `totalDimension = (M - m) + CANVAS_PADDING_TOTAL`,
 * where `M`/`m` are the ink's own (fudged) max/min per axis
 * (`computeCanvasOrigin`): `Recentred#getMinMax`'s `enlarge(15, 15)` grows
 * the FAR corner by 15 (leaving the near corner, `m`, untouched), then the
 * document margin's `same(10)` adds 10 on BOTH sides
 * (`TextBlockExporter#calculateFinalDimension`) -- `15 + 10 + 10 = 35`.
 * @see net/sourceforge/plantuml/activitydiagram3/Recentred.java:56 -- `enlarge(15, 15)`
 * @see net/sourceforge/plantuml/core/TextBlockExporter.java:199-202
 */
export const CANVAS_PADDING_TOTAL = 35;

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
