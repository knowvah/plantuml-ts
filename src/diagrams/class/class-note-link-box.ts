/**
 * `note on link`'s own note-image dimension -- split out of
 * class-layout-edge-labels.ts purely to keep that file under the project's
 * 500-line cap (T10 addition). Thin class-side adapter over the shared core
 * port (`shared-seam-extraction` T6, D1) -- this file supplies the class
 * engine's own creole/sprite-aware pure-text strategy; the padding math and
 * the fontFamily-only fallback now live once, in
 * `core/svek/image/EntityImageNoteLink.ts`.
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
 * Full padding derivation (Opale's 6/15/5 plus `ComponentRoseNote`'s own
 * constructor `paddingX`/`paddingY` a second time) lives on
 * `core/rose-note-dim.ts#roseNoteDim`, which the core port applies.
 *
 * Reuses `measureNote`'s own ATOM-AWARE per-line width/height
 * (`lineWidths`/`lineHeights`, sprite atoms included) rather than a raw
 * string measurement -- `measureNote`'s CREOLE ENGINE is still the right
 * "pure text" measurer (same font, same atom scan) for the simple,
 * single-block note bodies this backlog's `note on link` fixtures carry (no
 * `--`/`==` separator, no bullet, no table); only its OUTER margin (Opale
 * alone) is the wrong one for this component, which the core port corrects.
 * A `<$name>` sprite atom resolves through the SAME registry attached/
 * freestanding notes use (`sprites`, threaded from `ast.sprites` -- see
 * `class-layout-edge-labels.ts#NoteBoxContext`'s doc comment); with no
 * registry entry it measures 0x0 (`creole-atoms-measure.ts:49-50`), matching
 * upstream's `StripeSimple.addSprite`'s "unknown name contributes nothing".
 */
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { SpriteRegistry } from '../../core/sprite-commands.js';
import { measureNote } from './note-layout-measure.js';
import { measureLinkNoteDim as coreMeasureLinkNoteDim } from '../../core/svek/image/EntityImageNoteLink.js';

/** Two-dimensional size, matching `computeMergedLabelBox`'s own `noteDim`
 *  shape. */
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
  return coreMeasureLinkNoteDim(text, { family: theme.fontFamily }, measurer, (t, m) => {
    const note = measureNote(t, theme, m, sprites);
    const maxLineWidth = note.lineWidths.length === 0 ? 0 : Math.max(...note.lineWidths);
    const totalLineHeight = note.lineHeights.reduce((sum, h) => sum + h, 0);
    return { width: maxLineWidth, height: totalLineHeight };
  });
}
