/**
 * Layout constants for the activity diagram layout engine (see `layout.old.ts`).
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
export const NOTE_SIDE_GAP = 16;
export const BAR_HEIGHT = 8;
/**
 * NOT retired despite the boxed-header model it sized being replaced
 * (`activity-swimlane-rendering` T6) -- `layout.old.ts:53` (the superseded,
 * off-the-render-path engine) still imports this constant, and that file is
 * out of every task's write-set (mission stop condition 5). The live
 * renderer (`renderer.ts` / `activity-renderer-swimlanes.ts`) no longer
 * reads it; the divider-and-floating-title band height is measured instead
 * (`swimlane-placement.ts#measureSwimlaneTitlesHeight`, D2).
 */
export const SWIMLANE_HEADER_H = 28;
export const SWIMLANE_MIN_WIDTH = 120;
export const DEFAULT_WIDTH = 600;
export const LAYOUT_MARGIN = 12;

/** The horizontal clearance a loop's back-edge routes around its body
 *  (`gtile-repeat`/`gtile-while`). */
export const BACK_EDGE_MARGIN = 20;

export const DIAMOND_MIN = 20;
export const DIAMOND_LABEL_PAD = 10;
