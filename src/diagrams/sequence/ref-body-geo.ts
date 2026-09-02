/**
 * ref-body-geo.ts — the `ref over` frame's own geometry
 * (`ComponentRoseReference`), split verbatim out of `text-block-geo.ts` when
 * that file reached the project's 500-line cap.
 *
 * A pure move: every constant, function and doc comment below is the one
 * `text-block-geo.ts` carried, and that module re-exports all of them, so no
 * caller's import changed. `ComponentRoseReference` is the one sequence
 * component whose label is CONTENT rather than a condition, which is what
 * makes it separable from the message-label half that stayed behind.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/ComponentRoseReference.java
 */
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { displayLines } from './text-block-geo.js';

/** The body padding `ComponentRoseReference` hands to `super` --
 *  `topRightBottomLeft(4, 4, 4, 4)`, so the same value on all four sides
 *  (`ComponentRoseReference.java:69-70`). */
const REF_PADDING = 4;
/** `heightFooter` -- the band below the body block
 *  (`ComponentRoseReference.java:61`). */
const REF_HEIGHT_FOOTER = 5;
/** `xMargin` -- the inset between the component's box and its bounds
 *  (`ComponentRoseReference.java:62`). */
const REF_X_MARGIN = 2;
/** `getHeaderWidth` adds a flat `30 + 15` to the header text's own width
 *  (`ComponentRoseReference.java:145-148`). */
const REF_HEADER_EXTRA_WIDTH = 45;
/** The header text itself: `stringsToDisplay.subList(0, 1)`, the frame's
 *  keyword (`ComponentRoseReference.java:78`). */
const REF_HEADER_TEXT = 'ref';

/**
 * `reference { FontSize 12 }` (`plantuml.skin:145-151`) — a `ref over` body
 * does NOT use the ambient sequence font.
 *
 * A4 found this: the body was measured at `theme.fontSize` (14), which was
 * invisible while the port emitted no `textLength` and a merely-approximate x,
 * and became a visible glyph distortion the moment it emitted one. On
 * `cekora-30-diso384` the jar writes `textLength="26.625"` for `short` and
 * this port wrote 31.063 — the same string measured at two different sizes.
 *
 * The header keyword beside it is `referenceHeader { FontSize 13, FontStyle
 * bold }` (`:153-160`), which `computeHeaderTab` already applies.
 */
export const REFERENCE_FONT_SIZE = 12;

/** The font a `ref over` BODY line is measured and drawn at. */
export function refBodyFontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: REFERENCE_FONT_SIZE };
}

/**
 * `referenceHeader { FontSize 13, FontStyle bold }` (`plantuml.skin:153-160`)
 * — the `ref` KEYWORD's own font, which `ComponentRoseReference`'s constructor
 * builds `textHeader` with (`fcHeader = styleHeader.getFontConfiguration(...)`,
 * `:75,79`) and which `getHeaderWidth`/`getHeaderHeight` therefore measure at.
 *
 * Same defect as the body's, found the same way: `refBodyWidth` takes
 * `max(body, header)`, so correcting the body font alone let the header term
 * — still measured at the ambient 14 — start dominating and win with a wrong
 * number. `sojufi-84-bexi933` is where that showed.
 */
export function refHeaderFontSpecOf(theme: Theme): FontSpec {
  return { family: theme.fontFamily, size: REFERENCE_HEADER_FONT_SIZE, weight: 'bold' };
}

/** `referenceHeader { FontSize 13 }` (`plantuml.skin:153-160`). Equal to
 *  `HEADER_FONT_SIZE`, and deliberately NOT shared with it: they are two
 *  different style buckets that happen to agree today. */
const REFERENCE_HEADER_FONT_SIZE = 13;

/**
 * A `ref over` frame's BODY, one entry per source line.
 *
 * `ref` is the one frame type whose label is content rather than a condition:
 * `CommandReferenceMultilinesOverSeveral` accumulates the block's plain-text
 * lines, and `ComponentRoseReference#drawInternalU` draws them as their own
 * text block INSIDE the box (`:126-136`), below the header — where every other
 * frame type draws a bracketed `[condition]` beside the tab. Empty for any
 * other frame type, which is what keeps this a `ref`-only path.
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseReference.java#drawInternalU
 */
export function refBodyLines(frameType: string, label: string): readonly string[] {
  if (frameType !== 'ref') return [];
  const body = label.trim();
  // `CommandReferenceOverSeveral.java:132` builds `reference.getStrings()`
  // with `Display.getWithNewlines`, so a single-line `ref over A : a\nb` is a
  // two-line body exactly as the `ref … end ref` block form is.
  return body === '' ? [] : displayLines(body).map((l) => l.trim());
}

/** `getHeaderHeight` -- the header text's height plus `2 * 1`
 *  (`ComponentRoseReference.java:140-143`). */
function refHeaderHeight(theme: Theme, measurer: StringMeasurer): number {
  return measurer.measure(REF_HEADER_TEXT, refHeaderFontSpecOf(theme)).height + 2;
}

/**
 * `getPreferredHeight` = text height + header height + footer
 * (`ComponentRoseReference.java:150-153`), where `getTextHeight` is the text
 * block's own height plus the top and bottom padding
 * (`AbstractTextualComponent.java:110-114`).
 */
export function refBodyHeight(
  body: readonly string[],
  theme: Theme,
  measurer: StringMeasurer,
): number {
  if (body.length === 0) return 0;
  const textHeight =
    body.length * measurer.measure('M', refBodyFontSpecOf(theme)).height + 2 * REF_PADDING;
  return textHeight + refHeaderHeight(theme, measurer) + REF_HEIGHT_FOOTER;
}

/**
 * `getPreferredWidth` = max(text width, header width) + 2 * xMargin
 * (`ComponentRoseReference.java:155-159`), where `getTextWidth` is the widest
 * line plus the left and right padding
 * (`AbstractTextualComponent.java:106-108`). The shadow delta that term also
 * carries is 0 here: this port draws no shadow.
 */
export function refBodyWidth(
  body: readonly string[],
  theme: Theme,
  measurer: StringMeasurer,
): number {
  if (body.length === 0) return 0;
  const widest = Math.max(
    ...body.map((l) => measurer.measure(l, refBodyFontSpecOf(theme)).width),
  );
  const headerWidth =
    measurer.measure(REF_HEADER_TEXT, refHeaderFontSpecOf(theme)).width + REF_HEADER_EXTRA_WIDTH;
  return Math.max(widest + 2 * REF_PADDING, headerWidth) + 2 * REF_X_MARGIN;
}

