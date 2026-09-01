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

/**
 * One `<text>` the renderer will emit, already placed AND already measured.
 *
 * The three metric fields exist because the sequence renderers have no
 * `StringMeasurer` and must not acquire one (decisions.md D1): `sequenceText`
 * needs a measured width to emit the jar's `textLength`, and a baseline needs
 * an ascent. Layout has the measurer, so layout resolves all three and the run
 * carries them.
 *
 * They are **required**, not optional. An absent metric that defaulted to zero
 * would emit `textLength="0"` — a visible text distortion the geometry
 * comparator barely sees, since it charges the same 1 for a wrong number as
 * for a near-right one.
 *
 * This is the port's answer to `DriverTextSvg#draw`, which resolves exactly
 * these quantities from its `StringBounder` before emitting
 * (`~/git/plantuml/.../klimt/drawing/svg/DriverTextSvg.java:125-126,179`).
 */
export interface TextRun {
  readonly text: string;
  /** The run's LEFT edge — `DriverTextSvg`'s `x`, never a centre. */
  readonly x: number;
  /**
   * The run's BASELINE — `DriverTextSvg`'s `y`, never a block top and never a
   * vertical centre. A2 changed this: it used to be the top of the line box
   * for message labels, which is what an SVG `dominant-baseline` was
   * compensating for. Nothing type-checks the difference, so the word
   * "baseline" here is the contract.
   */
  readonly y: number;
  /** `measure(text, font).width` at this run's OWN font. Reaches `textLength`
   *  subject to `svg-shapes.ts#textLengthOf`'s `text.length() > 1` guard. */
  readonly textWidth: number;
  /** `measure(text, font).height - getDescent(font, text)` — the distance from
   *  the line box's top to the baseline. Measured rather than derived: the
   *  `size - size/4.5` shorthand in `renderer-frame-header.ts` disagrees with
   *  `FixedMeasurer`, whose descent is `lineHeight/4.5` (D1, D2). */
  readonly textAscent: number;
  /** `measure(text, font).height` — one line box, i.e. the baseline-to-baseline
   *  advance between consecutive runs of the same block. */
  readonly textLineHeight: number;
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

/**
 * `AbstractComponentRoseArrow`'s own padding:
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 7, 1, 7)`
 * (`AbstractComponentRoseArrow.java:62`), read back as `getOldPaddingX1()` =
 * `padding.getLeft()` and `getOldPaddingY()` = `padding.getTop()`
 * (`AbstractTextualComponent.java:116-126`).
 *
 * Jar-verified on `TeozTimelineIssues_0003_Test`: all three of its arrows put
 * the label exactly 7 right of the arrow line's own start —
 * `25.894 -> 32.894`, `20.894 -> 27.894` twice.
 */
export const ARROW_LABEL_PADDING_X1 = 7;
/** The same padding's top/bottom, which `getTextHeight` adds twice
 *  (`AbstractTextualComponent.java:110-114`). */
const ARROW_LABEL_PADDING_Y = 1;

/**
 * `getArrowDeltaX()` (`AbstractComponentRoseArrow.java:54`), added to the
 * label's left edge when the arrow carries a head at its LEFT end:
 *
 * ```java
 * textPos = getOldPaddingX1()
 *     + (direction2 == ArrowDirection.RIGHT_TO_LEFT_REVERSE || direction2 == ArrowDirection.BOTH_DIRECTION
 *             ? getArrowDeltaX()
 *             : 0);
 * ```
 * (`ComponentRoseArrow.java:174-177`) — the text is pushed clear of the head
 * it would otherwise overlap.
 */
export const ARROW_LABEL_HEAD_CLEARANCE = 10;

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
 * One DELIBERATE divergence from upstream remains, pre-existing and outside
 * this function's scope: `number.text` is whatever the autonumber format
 * produced, creole markup included. Upstream runs it through `getCreole`
 * (`Display.java:704`), so `<font color=red>[001]</font>` becomes a red
 * `[001]`; this port emits the markup literally. That is a creole gap, not a
 * text-block one.
 *
 * A2 closed the other one. The block used to be CENTRED on the arrow's
 * midpoint; upstream's default `messagePosition` is LEFT
 * (`ComponentRoseArrow.java:163-178`), so `leftX` is now the block's left edge
 * and the caller derives it from the arrow's own start. Lines were always
 * left-aligned WITHIN the block, which is why they still share one `x`.
 *
 * ## The two parameters that changed meaning in A2
 *
 * `leftX` is the BLOCK's left edge — where the autonumber starts when there is
 * one, and where the label starts when there is not.
 *
 * `arrowY` is the ARROW's own y, not a text y. Upstream places the component's
 * origin at the block top and puts the arrow `getTextHeight` below it
 * (`posArrow = getTextHeight(stringBounder)`, `yText = 0`,
 * `ComponentRoseArrow.java:141-148`), so the block is derived from the arrow
 * rather than the other way round. A multi-line label therefore grows UPWARD,
 * leaving the arrow where the caller put it — the same property the old
 * `baselineY` had, now expressed the way upstream expresses it.
 */
export function messageLabelBlock(
  label: string,
  numberText: string | undefined,
  leftX: number,
  arrowY: number,
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
  const labelLeft = leftX + numberWidth + gap;
  // `posArrow = getTextHeight(stringBounder)` with `yText = 0`
  // (`ComponentRoseArrow.java:141-148`): the block's TOP sits one
  // `getTextHeight` above the arrow, where `getTextHeight` is the text block
  // plus the padding on both sides (`AbstractTextualComponent.java:110-114`).
  const rows = Math.max(1, lines.length);
  const top = arrowY - (rows * lineHeight + 2 * ARROW_LABEL_PADDING_Y);

  // D1: the metrics are resolved HERE, where the measurer is, and travel on
  // the run. `ascent` is measured rather than derived from the font size --
  // see `TextRun.textAscent`.
  const ascent = lineHeight - measurer.getDescent(spec, 'M');
  // A2: `TextRun.y` is a BASELINE. The block's top is a line-box top, so every
  // run drops one ascent from wherever its line box begins.
  const baselineOfRow = (i: number): number => top + ascent + i * lineHeight;
  const runAt = (text: string, x: number, y: number): TextRun => ({
    text,
    x,
    y,
    textWidth: measurer.measure(text, spec).width,
    textAscent: ascent,
    textLineHeight: lineHeight,
  });

  const placed = lines.map((text, i) => runAt(text, labelLeft, baselineOfRow(i)));
  if (numberText === undefined) return { lines: placed };
  // VerticalAlignment.CENTER against the label block (`Display.java:711`).
  const numberY = baselineOfRow(0) + ((rows - 1) * lineHeight) / 2;
  return { lines: placed, number: runAt(numberText, leftX, numberY) };
}

/** Rows a label block occupies, for the caller's vertical reservation. A
 *  number-only label still occupies one. */
export function messageLabelRows(label: string, numberText: string | undefined): number {
  if (label === '') return numberText === undefined ? 0 : 1;
  return label.split('\n').length;
}
