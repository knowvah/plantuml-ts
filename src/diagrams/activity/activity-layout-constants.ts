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
export const STOP_OUTER_RADIUS = 14;
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
