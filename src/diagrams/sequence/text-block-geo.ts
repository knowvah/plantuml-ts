/**
 * text-block-geo.ts — how a sequence-diagram `Display` becomes POSITIONED
 * text runs.
 *
 * Upstream keeps this concern in `Display`/`AbstractTextualComponent`: a
 * component hands its lines to a `TextBlock`, and the block decides how many
 * runs to emit, where each sits, and how a leading `MessageNumber` is merged
 * beside the rest. This module is the port of that decision for the two
 * sequence components that need it — `ComponentRoseReference` (the `ref`
 * body) and `ComponentRoseArrow` (a message label).
 *
 * It lives outside `sequence-layout-events.ts` because that file is at the
 * project's 500-line cap, and because these are pure geometry helpers with no
 * dependency on the event cursor — the same reason `sequence-layout-shared.ts`
 * exists. They take `theme` + `measurer` rather than the whole
 * `EventProcessingContext`, which also keeps the module graph a DAG.
 */

import type { StringMeasurer } from '../../core/measurer.js';
import type { Theme } from '../../core/theme.js';
import { arrowFontSpecOf, fontSpecOf } from './sequence-layout-shared.js';

/** One `<text>` the renderer will emit, already placed. */
export interface TextRun {
  readonly text: string;
  readonly x: number;
  readonly y: number;
}

const lineHeightOf = (theme: Theme, measurer: StringMeasurer): number =>
  measurer.measure('M', fontSpecOf(theme)).height;

const widthOf = (s: string, theme: Theme, measurer: StringMeasurer): number =>
  measurer.measure(s, fontSpecOf(theme)).width;

// ---------------------------------------------------------------------------
// `ref` frame body — ComponentRoseReference
// ---------------------------------------------------------------------------

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
  return body === '' ? [] : body.split('\n').map((l) => l.trim());
}

/** `getHeaderHeight` -- the header text's height plus `2 * 1`
 *  (`ComponentRoseReference.java:140-143`). */
function refHeaderHeight(theme: Theme, measurer: StringMeasurer): number {
  return measurer.measure(REF_HEADER_TEXT, fontSpecOf(theme)).height + 2;
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
  const textHeight = body.length * lineHeightOf(theme, measurer) + 2 * REF_PADDING;
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
  const widest = Math.max(...body.map((l) => widthOf(l, theme, measurer)));
  const headerWidth = widthOf(REF_HEADER_TEXT, theme, measurer) + REF_HEADER_EXTRA_WIDTH;
  return Math.max(widest + 2 * REF_PADDING, headerWidth) + 2 * REF_X_MARGIN;
}

// ---------------------------------------------------------------------------
// Message label — ComponentRoseArrow + Display#createMessageNumber
// ---------------------------------------------------------------------------

/** `TextBlockUtils.withMargin(tb1, 0, 4, 0, 0)` -- the right margin between a
 *  leading `MessageNumber` and the label beside it
 *  (`Display.java:706`). */
const MESSAGE_NUMBER_MARGIN = 4;

/** A message's label as placed text: its lines, plus the autonumber run that
 *  sits beside them when the message carries one. */
export interface MessageLabelBlock {
  readonly lines: readonly TextRun[];
  readonly number?: TextRun;
}

/**
 * Place a message's label, and its autonumber when it has one.
 *
 * `getLabelNumbered` puts the number FIRST in the display as a
 * `MessageNumber` (`AbstractMessage.java:200-206`), and `Display#createSheet`
 * routes a display whose element 0 is one to `createMessageNumber`
 * (`Display.java:662-664`). That builds the number as its OWN text block,
 * gives it a 4px right margin, and merges it left-to-right with the remaining
 * lines at `VerticalAlignment.CENTER` (`Display.java:703-712`) -- so the
 * number is a separate `<text>`, vertically centred against however many
 * lines the label has, and there is NO `": "` joining them.
 *
 * Two DELIBERATE divergences from upstream, both pre-existing and neither in
 * this change's scope:
 *
 *   1. The block is centred on the arrow's midpoint. Upstream's default
 *      `messagePosition` is LEFT, placing it at `getOldPaddingX1()` from the
 *      arrow's own origin (`ComponentRoseArrow.java:163-178`). Only the
 *      block's ORIGIN differs: lines are left-aligned WITHIN the block here
 *      exactly as they are upstream, which is why they share one `x`.
 *   2. `number.text` is whatever the autonumber format produced, creole
 *      markup included. Upstream runs it through `getCreole`
 *      (`Display.java:704`), so `<font color=red>[001]</font>` becomes a red
 *      `[001]`; this port emits the markup literally. That is a creole gap,
 *      not a text-block one.
 *
 * `baselineY` is the y of the LAST line: a multi-line label grows UPWARD from
 * the arrow, leaving the arrow where the caller put it.
 */
export function messageLabelBlock(
  label: string,
  numberText: string | undefined,
  centerX: number,
  baselineY: number,
  theme: Theme,
  measurer: StringMeasurer,
): MessageLabelBlock {
  // `AbstractTextualComponent` maps an empty display to a `TextBlockEmpty`,
  // which draws nothing (`AbstractTextualComponent.java:84-85`) -- so a
  // message with neither label nor number emits no `<text>` at all.
  const lines = label === '' ? [] : label.split('\n');
  if (lines.length === 0 && numberText === undefined) return { lines: [] };

  // The ARROW font, not the ambient one: `arrow { FontSize 13 }`
  // (`plantuml.skin:306-308`), and every golden with a message label emits
  // `font-size="13"` for it beside `font-size="14"` participant text.
  const spec = arrowFontSpecOf(theme);
  const lineHeight = measurer.measure('M', spec).height;
  const numberWidth = numberText === undefined ? 0 : measurer.measure(numberText, spec).width;
  const gap = numberText === undefined ? 0 : MESSAGE_NUMBER_MARGIN;
  const labelWidth =
    lines.length === 0 ? 0 : Math.max(...lines.map((l) => measurer.measure(l, spec).width));

  const blockLeft = centerX - (numberWidth + gap + labelWidth) / 2;
  const labelLeft = blockLeft + numberWidth + gap;
  const top = baselineY - Math.max(0, lines.length - 1) * lineHeight;

  const placed = lines.map((text, i) => ({ text, x: labelLeft, y: top + i * lineHeight }));
  if (numberText === undefined) return { lines: placed };
  // VerticalAlignment.CENTER against the label block (`Display.java:711`).
  const numberY = top + (Math.max(1, lines.length) - 1) * lineHeight / 2;
  return { lines: placed, number: { text: numberText, x: blockLeft, y: numberY } };
}

/** Rows a label block occupies, for the caller's vertical reservation. A
 *  number-only label still occupies one. */
export function messageLabelRows(label: string, numberText: string | undefined): number {
  if (label === '') return numberText === undefined ? 0 : 1;
  return label.split('\n').length;
}
