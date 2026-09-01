/**
 * Small shared leaf utilities for sequence diagram layout.
 * No dependencies on sibling layout modules — keeps the module graph a DAG.
 */

import type { FontSpec } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';

/** Derive the font spec used for sequence-diagram text measurement.
 *
 *  This is the AMBIENT size (`root { FontSize 14 }`, `plantuml.skin:14`),
 *  which is what a participant head uses. A message label does NOT (see
 *  {@link arrowFontSpecOf}), nor does a note ({@link noteFontSpecOf}), nor a
 *  `ref` body (`text-block-geo.ts#refBodyFontSpecOf`) — three declared style
 *  buckets that each carry their own size. */
export function fontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: theme.fontSize };
}

/** `arrow { FontSize 13 }` (`plantuml.skin:306-308`) — the message-label
 *  font, one point smaller than the ambient one every other sequence element
 *  uses. Every golden with a message label emits `font-size="13"` beside
 *  `font-size="14"` participant text. Same shape as `DIVIDER_FONT_SIZE`
 *  (`divider-style.ts:60`), which is the same 13 from `plantuml.skin:174`. */
export const ARROW_FONT_SIZE = 13;

/** The font a message label is measured and drawn with. Layout and render
 *  must both call this: reserving space at one size and drawing at another is
 *  the sizer/renderer split `planning/sizer-renderer-parity.md` exists to
 *  prevent. */
export function arrowFontSpecOf(theme: Theme): FontSpec {
  // Absolute, not scaled off `theme.fontSize`: `arrow { FontSize 13 }` is a
  // declared value in the style tree, exactly as `divider-style.ts` treats
  // `plantuml.skin:174`'s 13 — a `root` font-size change does not move it.
  return { family: theme.fontFamily, size: ARROW_FONT_SIZE };
}

/**
 * `note { FontSize 13 }` (`plantuml.skin:312-316`) — the root-level note
 * style, declared in the same block as `arrow { FontSize 13 }` above it.
 *
 * A5 found this the way A4 found the `ref` body's: the note body was measured
 * and drawn at the ambient 14, which merely displaced text while the port
 * emitted no `textLength`, and became a glyph distortion the moment it emitted
 * one. Jar-verified on `bocusa-16-ciju126`, whose `1. right` note carries
 * `font-size="13" textLength="36.075"`.
 */
export const NOTE_FONT_SIZE = 13;

/** The font a note body is measured and drawn with — both, or the box and its
 *  text disagree (`planning/sizer-renderer-parity.md`). */
export function noteFontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: NOTE_FONT_SIZE };
}

/**
 * `CommunicationTile.LIVE_DELTA_SIZE` — half an activation bar's width, and
 * the step by which a live participant pushes the things anchored on its
 * lifeline sideways.
 *
 * It is read by every tile that has to dodge a bar: `CommunicationTile`
 * moves a message's two endpoints by it (`:333-350`),
 * `CommunicationExoTile` its one endpoint (`:122-129`), `NoteTile` its box
 * (`:153`), and `CommunicationTileSelf` its loop (`:133-135`). Shared here
 * for the same reason upstream keeps one `public static final`: those four
 * must agree.
 *
 * `renderer-lifeline.ts` deliberately does NOT use it for the bars'
 * own per-level indent -- `LiveBoxes#drawOneLevel` derives that from the
 * box's own `getWidth() / 2` (`:365-368`), and the two coincide at 5 only
 * because the box is 10 wide.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTile.java:172
 */
export const LIVE_DELTA_SIZE = 5;

/** The arrow component's horizontal text padding, both sides:
 *  `topRightBottomLeft(1, 7, 1, 7)` (`skin/rose/AbstractComponentRoseArrow
 *  .java:62`), read back by `getTextWidth` (`skin/AbstractTextualComponent
 *  .java:106-108`).
 *
 *  Lives here because both the exo path and the participant-row constraint
 *  solve need the SAME number: `ComponentRoseArrow#getPreferredWidth:347-349`
 *  is one formula, and a message asks the diagram for that width whether its
 *  far end is a border or another lifeline. */
export const ARROW_PADDING_X = 7;
