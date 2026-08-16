/**
 * `note on link`'s own note-image dimension -- split out of
 * class-layout-edge-labels.ts purely to keep that file under the project's
 * 500-line cap (T10 addition).
 *
 * `EntityImageNoteLink` (the note operand `computeMergedLabelBox` merges
 * into an edge label) is NOT the same upstream component as a plain
 * `note left of X`/freestanding note: it builds a `ComponentRoseNote` via
 * `Rose#createComponentNote` (`svek/image/EntityImageNoteLink.java:57-66`),
 * not the `EntityImageNote`/`BodyEnhanced2` path `note-layout-measure.ts
 * #measureNote` itself models (`EntityImageNote.java:117`,
 * `EntityImageTips.java:185`). Verified independently (not inherited from a
 * comment): `Rose#createComponentNote`'s `ComponentType.NOTE` branch
 * (`skin/rose/Rose.java:114-116`) constructs `new ComponentRoseNote(...)`.
 *
 * `ComponentRoseNote`'s constructor (`skin/rose/ComponentRoseNote.java:65-71`)
 * sets its STYLE padding to `ClockwiseTopRightBottomLeft.topRightBottomLeft(5,
 * 15, 5, 6)` for the default (non-CENTER) text alignment
 * (`EntityImageNoteLink.java:63-64` never passes a `NotePosition`, so
 * `Rose#createComponentNote`'s 5-arg overload always takes the
 * non-`OVER_SEVERAL` branch, `Rose.java:109-111`, and `AlignmentParam
 * .noteTextAlignment` defaults LEFT) -- top=5/right=15/bottom=5/left=6, the
 * IDENTICAL three numbers as `Opale#marginX1`(6)/`marginX2`(15)/`marginY`(5)
 * `measureNote` already applies via `AbstractTextualComponent#getTextWidth`/
 * `getTextHeight` (`skin/AbstractTextualComponent.java:106-114`: pureText +
 * padding.left + padding.right / pureText + padding.top + padding.bottom).
 * `ComponentRoseNote#getPreferredWidth`/`getPreferredHeight`
 * (`ComponentRoseNote.java:82-91`) then add its OWN CONSTRUCTOR-passed
 * `paddingX`/`paddingY` a SECOND time, `2 *` each (`Rose.java:65-66`, both
 * 5) -- `pureText + 21` (what `measureNote` alone returns) vs
 * `pureText + 21 + 10 = pureText + 31` (here); height `pureText + 10` vs
 * `pureText + 20`.
 *
 * Reuses `measureNote`'s own ATOM-AWARE per-line width/height
 * (`lineWidths`/`lineHeights`, sprite atoms included) rather than a raw
 * string measurement -- `measureNote`'s CREOLE ENGINE is still the right
 * "pure text" measurer (same font, same atom scan) for the simple,
 * single-block note bodies this backlog's `note on link` fixtures carry (no
 * `--`/`==` separator, no bullet, no table); only its OUTER margin (Opale
 * alone) is the wrong one for this component, which is corrected below. A
 * `<$name>` sprite atom resolves through the SAME registry attached/
 * freestanding notes use (`sprites`, threaded from `ast.sprites` -- see
 * `class-layout-edge-labels.ts#NoteBoxContext`'s doc comment); with no
 * registry entry it measures 0x0 (`creole-atoms-measure.ts:49-50`), matching
 * upstream's `StripeSimple.addSprite`'s "unknown name contributes nothing".
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { measureNote } from './note-layout-measure.js';
import { OPALE_MARGIN_X1, OPALE_MARGIN_X2, OPALE_MARGIN_Y } from '../../core/svek/image/Opale.js';

/** `Rose.java:65-66` -- `paddingX`/`paddingY`, both 5, passed into every
 *  `ComponentRoseNote` by `Rose#createComponentNote`. */
const ROSE_NOTE_PADDING = 5;

/** Two-dimensional size, matching `computeMergedLabelBox`'s own `noteDim`
 *  shape (`core/edge-label-box.ts`). */
export interface LinkNoteDim {
  readonly width: number;
  readonly height: number;
}

/**
 * `EntityImageNoteLink`'s real dimension -- see this module's own doc
 * comment for the full derivation. `text` is the RAW `Relationship
 * .linkNote` value (already `.trim()`-med by `class-notes.ts#applyNoteOnLink`,
 * never creole-stripped here -- `measureNote`'s own engine handles that).
 */
export function measureLinkNoteDim(
  text: string,
  theme: Theme,
  measurer: StringMeasurer,
  sprites?: SpriteRegistry,
): LinkNoteDim {
  const note = measureNote(text, theme, measurer, sprites);
  const maxLineWidth = note.lineWidths.length === 0 ? 0 : Math.max(...note.lineWidths);
  const totalLineHeight = note.lineHeights.reduce((sum, h) => sum + h, 0);
  return {
    width: maxLineWidth + OPALE_MARGIN_X1 + OPALE_MARGIN_X2 + 2 * ROSE_NOTE_PADDING,
    height: totalLineHeight + 2 * OPALE_MARGIN_Y + 2 * ROSE_NOTE_PADDING,
  };
}
