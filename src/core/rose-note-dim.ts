/**
 * The note operand `computeMergedLabelBox` (`core/edge-label-box.ts`) merges
 * into an edge label: `EntityImageNoteLink`'s own dimension.
 *
 * Lives beside `edge-label-box.ts` rather than inside it (mission
 * `edge-label-box-followups` D5 asked for the latter) only because that file
 * sits at exactly the project's 500-line cap and every line in it carries an
 * upstream citation; the seam is unchanged -- the merge model still owns its
 * operand's padding. `shared-seam-extraction` T6 collapsed the former three
 * engine copies (`state-dot-graph.ts:172`, `state-composite-edge-label.ts
 * :49`, `class-note-link-box.ts:70`) onto ONE shared entry point,
 * `core/svek/image/EntityImageNoteLink.ts#measureLinkNoteDim`, which applies
 * THIS module's padding formula to whatever pure text dimension the caller
 * supplies (or its own naive fallback) -- this file's own seam (padding
 * only) is unchanged by that move.
 *
 * `EntityImageNoteLink` is NOT the plain-note component every engine's own
 * note sizer models. Its constructor (`svek/image/EntityImageNoteLink.java
 * :61-66`) builds `skin.createComponentNote(...)`, whose `ComponentType.NOTE`
 * branch is `new ComponentRoseNote(styles[0], stringsToDisplay, paddingX,
 * paddingY, ...)` (`skin/rose/Rose.java:114-116`).
 *
 * That component pads TWICE:
 *
 * 1. `ComponentRoseNote`'s `super(...)` call (`skin/rose/ComponentRoseNote
 *    .java:66-70`) passes STYLE padding `ClockwiseTopRightBottomLeft
 *    .topRightBottomLeft(5, 15, 5, 6)` for the default (non-CENTER) text
 *    alignment -- `EntityImageNoteLink.java:63-65` passes no `NotePosition`,
 *    so `Rose#createComponentNote`'s 5-arg overload (`Rose.java:89-92`)
 *    forwards `null`, the `OVER_SEVERAL` branch is never taken, and
 *    `AlignmentParam.noteTextAlignment` resolves against a `null` default
 *    (`Rose.java:109`) -- so `textAlignment == CENTER` is false unless a
 *    skinparam says otherwise. Those are the SAME
 *    three numbers as `Opale#marginX1`(6)/`marginX2`(15)/`marginY`(5), applied
 *    by `AbstractTextualComponent#getTextWidth`/`getTextHeight`.
 * 2. `getPreferredWidth`/`getPreferredHeight` (`ComponentRoseNote.java:81-90`)
 *    then add the CONSTRUCTOR-passed `paddingX`/`paddingY` -- both 5,
 *    `Rose.java:65-66` -- a second time, `2 *` each.
 *
 * Net: `pure + 6 + 15 + 2*5 = pure + 31` wide, `pure + 2*5 + 2*5 = pure + 20`
 * tall. (`symbolContext.getDeltaShadow()` is the third term in both
 * preferred-size expressions; `note` carries no shadow in `plantuml.skin`, so
 * it contributes 0 -- the same reading `class-note-link-box.ts` already
 * carries.)
 */
import { OPALE_MARGIN_X1, OPALE_MARGIN_X2, OPALE_MARGIN_Y } from './svek/image/Opale.js';

/** `Rose.java:65-66` -- `paddingX`/`paddingY`, both 5, passed into every
 *  `ComponentRoseNote` by `Rose#createComponentNote` (`Rose.java:114-115`). */
const ROSE_NOTE_PADDING = 5;

/** Two-dimensional size, matching `computeMergedLabelBox`'s own `noteDim`
 *  operand shape. */
export interface RoseNoteDim {
  readonly width: number;
  readonly height: number;
}

/**
 * `pure` is the note body's OWN creole `TextBlock` dimension -- the block
 * `AbstractTextualComponent` wraps, with no outer margin of its own. Passing
 * an already-margined note box here double-counts Opale's 6/15/5.
 */
export function roseNoteDim(pure: RoseNoteDim): RoseNoteDim {
  return {
    width: pure.width + OPALE_MARGIN_X1 + OPALE_MARGIN_X2 + 2 * ROSE_NOTE_PADDING,
    height: pure.height + 2 * OPALE_MARGIN_Y + 2 * ROSE_NOTE_PADDING,
  };
}
