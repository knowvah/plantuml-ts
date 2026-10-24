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
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import type { FontConfiguration } from '../../core/klimt/shape/UText.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { ExtraLine } from '../../core/klimt/drawing/svg/driver-text-svg-decorations.js';
import { applyPadder, padderGeoAt, type MessagePadder, type PaddedLabelBlock } from './sequence-message-padder.js';
import type { LabelPadderGeo } from './geo-message.js';
import { defaultMessageFont } from './sequence-arrow-paint.js';
import { componentLabelBlock, offsetRun, type SequenceRunShape } from './sequence-creole-sheet.js';
import type { SpriteRegistry } from '../../core/sprite-registry.js';
import type { Paint } from '../../core/paint.js';
import type { SequenceRunImage } from './sequence-text.js';

// ---------------------------------------------------------------------------
// Display -> lines — Display#getWithNewlines
// ---------------------------------------------------------------------------

/**
 * A sequence display's LINES.
 *
 * `Display#getWithNewlines(Pragma, String)` (`Display.java:262-346`) is what
 * every sequence display passes through before it can become a text block,
 * and this is the one place this engine calls it. Upstream's own call sites,
 * all of them:
 *
 *   - `CommandArrow.java:348` — a message label; `:161-170` — a participant
 *     auto-created by an arrow line;
 *   - `CommandParticipant.java:153` — a declared participant's `FULL` display,
 *     and `SequenceDiagram.java:123,168` for one created from its code alone;
 *   - `CommandReferenceOverSeveral.java:132` — a `ref over` body;
 *   - `CommandDivider.java:84`, `CommandDelay.java:83`,
 *     `CommandExoArrowAny.java:86`, `CommandReturn.java:125`,
 *     `CommandBoxStart.java:128`, `CommandNewpage.java:92`;
 *   - `AbstractTextualComponent.java:64` — the base every sequence component
 *     built from a raw `CharSequence` label reaches, and
 *     `ComponentRoseGroupingHeader.java:89` for a group's `[comment]`.
 *
 * A participant's STEREOTYPE is deliberately not on that list:
 * `CommandParticipant.java:174-180` hands the raw `<<...>>` run to
 * `Stereotype.build`, which never constructs a `Display` at all, so its rows
 * do not split however many escapes they carry.
 *
 * The escape it splits on is the two-character sequence backslash-n in the
 * SOURCE, never a real newline: `parseWithNewlines` has no real-newline
 * branch, because upstream's `Display` is a `List<CharSequence>` long before
 * anything reads it.
 *
 * ## Why a real newline is split here as well
 *
 * This port has no `Display` type, so a display arrives at layout as one
 * string — and its parser already lowers the escape to a REAL newline for the
 * two surfaces that needed it first (`command-note-factory.ts:119`,
 * `command-misc.ts:89`), then joins the multi-line `ref`/`note` block forms
 * with one (`parser.ts:122`). A real newline in a display therefore means
 * exactly what a second `displayData` entry means upstream, and the outer
 * split is this port's stand-in for "the display is already several entries"
 * — NOT a second escape scanner. Removing it would drop the multi-line `ref`
 * body and the multi-line note back to a single line.
 *
 * `splitDisplayLines` returns an `align` alongside the lines, resolved from a
 * `\l`/`\r` escape (`Display.java:290-295`). {@link displayLines} drops it;
 * {@link displayLinesAligned} keeps it for the one consumer that builds a
 * `create0` block from a raw label, {@link messageLabelLayout}
 * (`Display.java:648-649`). The BREAK those two escapes also cause is
 * honoured either way, which is upstream's behaviour.
 *
 * ## The JAWS deprecation warning: sequence does NOT surface it
 *
 * `Display#addWarning` (`Display.java:348-353`) raises a `JawsWarning` for
 * every escape consumed, and upstream's sequence commands thread the real
 * `diagram.getPragma()` in, so upstream WOULD raise one here. This port does
 * not, for two reasons that hold together: the split happens at LAYOUT time
 * where no `Pragma` is reachable — precisely why `splitDisplayLines` passes
 * `Pragma.createEmpty()` (`DisplayNewlines.ts:336-359`) — and the emission is
 * gated on `PragmaKey.SHOW_DEPRECATION`, off unless the source opts in, with
 * nothing in this port reading `Pragma#getWarnings()` back out. So a live
 * `Pragma` would render identically today. Recorded rather than left
 * implicit: an engine that DOES hold a `Pragma` should call
 * `parseWithNewlines` with it rather than inherit this decision by accident.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java#getWithNewlines
 */
export function displayLines(text: string): readonly string[] {
  return displayLinesAligned(text).lines;
}

/** {@link displayLines} plus `Display#getNaturalHorizontalAlignment`: the
 *  LAST `\r` (RIGHT) / `\l` (LEFT), `undefined` for none (`Display.java:290-298`). */
export interface AlignedDisplayLines {
  readonly lines: readonly string[];
  readonly align: HorizontalAlignment | undefined;
}

/** `splitDisplayLines` says `'center'` for "no escape" (`Display.java:290-295`). */
const NATURAL_ALIGN = { left: HorizontalAlignment.LEFT, right: HorizontalAlignment.RIGHT } as const;

/**
 * {@link displayLines} plus the natural alignment `create0` lets override the
 * component's own (`Display.java:648-649`). Upstream scans once, so the last
 * escape in the whole text wins; this keeps the last entry that set one.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/creole/Display.java#getWithNewlines
 */
export function displayLinesAligned(text: string): AlignedDisplayLines {
  let align: HorizontalAlignment | undefined;
  const lines = text.split('\n').flatMap((entry) => {
    const split = splitDisplayLines(entry);
    if (split.align !== 'center') align = NATURAL_ALIGN[split.align];
    return split.lines;
  });
  return { lines, align };
}

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
  /** `DriverTextSvg`'s TRIMMED width (`:113-126`), set only when the draw
   *  would trim the run; see `run-draw-metrics.ts`. Absent = `textWidth`. */
  readonly drawWidth?: number;
  /** `DriverTextSvg`'s leading-space `x` shift. Absent = 0. */
  readonly drawDx?: number;
  /** `measure(text, font).height - getDescent(font, text)` — the distance from
   *  the line box's top to the baseline. Measured rather than derived: the
   *  `size - size/4.5` shorthand in `renderer-frame-header.ts` disagrees with
   *  `FixedMeasurer`, whose descent is `lineHeight/4.5` (D1, D2). */
  readonly textAscent: number;
  /** `measure(text, font).height` — one line box, i.e. the baseline-to-baseline
   *  advance between consecutive runs of the same block. */
  readonly textLineHeight: number;

  // -------------------------------------------------------------------------
  // Per-run style (mission `sequence-creole` D3; sdd2 T6b)
  //
  // Every field below is OPTIONAL and absent on a plain run. They are what
  // `DriverTextSvg#draw` reads off one `FontConfiguration` before emitting a
  // `<text>` (`DriverTextSvg.java:93-180`), resolved once in layout by
  // `sequence-label-primitives.ts#textRunOf` from the `UText` core's creole
  // drew. They are flat scalars rather than the `FontConfiguration` because a
  // run is GEOMETRY: `scale-geo.ts` multiplies its numerics.
  // -------------------------------------------------------------------------

  /** `fontConfiguration.containsStyle(FontStyle.BOLD)` — absent, never
   *  `false`, when the run is not bold. */
  readonly bold?: boolean;
  /** `fontConfiguration.containsStyle(FontStyle.ITALIC)`. */
  readonly italic?: boolean;
  /** The run's OWN resolved fill (`fontConfiguration.getColor()`), set by a
   *  `<color:…>`/`[[url]]` run. Absent means "the caller's ambient text
   *  colour", which is what every pre-creole run relies on. */
  readonly color?: string;
  /** The whole `text-decoration` attribute, already assembled from the
   *  UNDERLINE/STRIKE/WAVE flags (`DriverTextSvg.java:139-160`) — one string,
   *  because SVG takes one attribute and upstream builds one `StringBuilder`. */
  readonly decoration?: string;
  /** The run's own font family, when creole changed it (`""mono""` ->
   *  `Parser.MONOSPACED`). Absent means the caller's ambient family. The
   *  `monospaced` -> CSS `monospace` rename is a DRAW-time concern
   *  (`SvgGraphics.java:720-722`, `core/svg-text-font.ts`), so this carries
   *  PlantUML's own logical name, not the CSS one. */
  readonly fontFamily?: string;
  /**
   * The run's own EFFECTIVE font size, when creole changed it (`<size:N>`, a
   * `==` heading cascade, or a `<sup>`/`<sub>` mute). Absent means the
   * caller's ambient size.
   *
   * It is a length, so `scale-geo.ts#scaleRun` multiplies it — upstream's
   * `SvgGraphics#format` multiplies an emitted `font-size` by the scale
   * exactly as it does a coordinate (`SvgGraphics.java:693`), which is the
   * same reason `scaleSequenceTheme` already scales `theme.fontSize`.
   */
  readonly fontSize?: number;
  /** Set when the run came from a `[[url]]` creole command's captured label
   *  (`core/klimt/creole/atom/Atom.ts#CreoleAtomUrl`) — the renderer wraps its
   *  `<text>` in `core/svg.ts#linkWrap`. Shaped for that emitter, which is why
   *  it is `{url, tooltip}` and not a richer link type. */
  readonly url?: { readonly url: string; readonly tooltip: string };
  /** Set ONLY on a `<math>`/`<latex>` run, which carries an image and no text
   *  at all — `AtomMath#drawU` paints one image and nothing else
   *  (`AtomMath.java:78-97`). `textWidth` is then the IMAGE's own width, so a
   *  following run still advances off it; `image.y` is the image's own top
   *  edge, since an image has no baseline to hang off. An `<img>`, a raster
   *  sprite and a `{{ }}` embed take the same field (`DriverImageSvg`). */
  readonly image?: SequenceRunImage;
  /** `DriverTextSvg`'s numeric `font-weight` where {@link bold} alone does
   *  not say it: a face weight (`java:97-103`), e.g. `900` inside a sprite. */
  readonly fontWeight?: string;
  /** A `<back:color>` run's `SvgGraphics#text` `textBackColor`, the
   *  `feFlood` filter (`DriverTextSvg.java:159-173`). */
  readonly textBackColor?: string;
  /** An extended-colour underline/strike (`<u:red>`), drawn as `<line>`s
   *  after the text (`DriverTextSvg.java:129-157,180`, `ExtraLines`). */
  readonly extraLines?: readonly ExtraLine[];
  /** Set ONLY on a non-text, non-image primitive -- a `----` rule's `ULine`,
   *  a table grid, a vector sprite's paths -- drawn through core's
   *  `UGraphicSvg` (`sequence-text.ts`). */
  readonly shape?: SequenceRunShape;
}

// ---------------------------------------------------------------------------
// `ref` frame body — ComponentRoseReference
//
// Moved verbatim to `ref-body-geo.ts` when this file reached the 500-line cap
// and the `<math>`/`<latex>` image field below had to fit. Re-exported here so
// no caller's import moved with it.
// ---------------------------------------------------------------------------

export { refBodyLines, refBodyHeight } from './ref-body-geo.js';

// ---------------------------------------------------------------------------
// Message label — ComponentRoseArrow + Display#createMessageNumber
// ---------------------------------------------------------------------------

/** The autonumber run's text, when a message carries one.
 *  `getLabelNumbered` prepends it as a `MessageNumber`
 *  (`AbstractMessage.java:200-206`); the formatted `sequenceLabel` wins over
 *  the bare `sequenceNumber` when both are present. */
export function numberTextOf(event: {
  readonly sequenceLabel?: string | undefined;
  readonly sequenceNumber?: number | undefined;
}): string | undefined {
  if (event.sequenceLabel !== undefined) return event.sequenceLabel;
  return event.sequenceNumber === undefined ? undefined : String(event.sequenceNumber);
}

/**
 * `AbstractComponentRoseArrow`'s own padding:
 * `ClockwiseTopRightBottomLeft.topRightBottomLeft(1, 7, 1, 7)`
 * (`AbstractComponentRoseArrow.java:62`), read back as `getOldPaddingX1()` =
 * `padding.getLeft()` and `getOldPaddingY()` = `padding.getTop()`
 * (`AbstractTextualComponent.java:116-126`), and handed to `create0` as the
 * block's `marginX1`/`marginX2` (`:91`).
 *
 * Jar-verified on `TeozTimelineIssues_0003_Test`: all three of its arrows put
 * the label exactly 7 right of the arrow line's own start —
 * `25.894 -> 32.894`, `20.894 -> 27.894` twice.
 */
export const ARROW_LABEL_PADDING_X1 = 7;
/** The same padding's right side (`AbstractComponentRoseArrow.java:62`). */
const ARROW_LABEL_PADDING_X2 = 7;
/** The same padding's top/bottom, added twice by `getTextHeight` (`AbstractTextualComponent.java:110-114`). */
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

/** A message's label as placed primitives. `number` is the FIRST primitive
 *  the autonumber's own block drew and any remainder rides at the FRONT of
 *  `lines`, upstream's own draw order: `createMessageNumber` merges `tb1`
 *  LEFT of `tb2` into ONE block (`Display.java:703-712`), read back as
 *  `[number, ...lines]`. `lines` is flat, one entry per primitive. */
export interface MessageLabelBlock {
  readonly lines: readonly TextRun[];
  readonly number?: TextRun;
  /** The padder's box behind the label (`Padder.java:113-131`). */
  readonly padder?: LabelPadderGeo;
}

/** What {@link messageLabelBlock} lays a label out with -- the
 *  `EventProcessingContext` fields it reads. `theme` is no longer read by the
 *  block itself (the font is the arrow style's); it stays because the context
 *  that satisfies this interface is the layout's own. */
export interface MessageLabelEnv {
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  readonly sprites?: SpriteRegistry | undefined;
  /** `SkinParam#sequenceDiagramPadder`, `undefined` for `Padder.NONE`. */
  readonly padder?: MessagePadder | undefined;
}

/**
 * The arrow component's text block (`AbstractTextualComponent.java:84-92`):
 * `getLabelNumbered` prepends the number to `Display.getWithNewlines(label)`
 * (`AbstractMessage.java:200-206`), so an empty label with a number keeps its
 * one empty line; an empty label with none is a `TextBlockEmpty`. The block
 * is built at the ARROW style's font and alignment (`arrow { FontSize 13 }`,
 * `plantuml.skin:316-317`), drawn after `ug.apply(getForegroundColor())`
 * (`ComponentRoseArrow.java:91,179`, `ComponentRoseSelfArrow.java:80,88`; no
 * `Back`) -- the ink a `--title--` rule in the label is stroked with.
 */
export function messageLabelLayout(
  label: string,
  numberText: string | undefined,
  font: FontConfiguration,
  env: MessageLabelMeasureEnv,
  draw: {
    readonly align?: HorizontalAlignment | undefined;
    readonly fore?: Paint | undefined;
    readonly styleWidth?: LineBreakStrategy | undefined;
  } = {},
): PaddedLabelBlock {
  const { lines, align: natural } = displayLinesAligned(label);
  const opts = {
    sprites: env.sprites,
    align: natural ?? draw.align, // `Display.java:648-649`
    ink: draw.fore === undefined ? undefined : { fore: draw.fore },
    numberText,
    marginX1: ARROW_LABEL_PADDING_X1,
    marginX2: ARROW_LABEL_PADDING_X2,
    maxWidth: arrowMaxWidth(draw.styleWidth, env.theme?.maxMessageSize),
  };
  return applyPadder(componentLabelBlock(lines, font, opts, env.measurer), env.padder);
}

/** What a label is measured with: the measurer and sprites, plus -- when the
 *  caller passes the layout's own context, as every layout caller does -- the
 *  theme `skinparam maxMessageSize` is read from. */
export type MessageLabelMeasureEnv = Pick<MessageLabelEnv, 'measurer' | 'sprites' | 'padder'> & {
  readonly theme?: Pick<Theme, 'maxMessageSize'> | undefined;
};

/**
 * The arrow component's `LineBreakStrategy`: the style's own `MaximumWidth`
 * when it is positive, else `skinparam maxMessageSize`.
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/Rose.java:289-292
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:971-978
 *
 * The theme holds `maxMessageSize` as its resolved `getMaxWidth()` pixel
 * width (`skinparam-theme-builder.ts#resolveMaxMessageSize`), a negative one
 * kept: `Fission` splits at its `Math.abs` (`Fission.java:63-101`).
 */
export function arrowMaxWidth(
  styleWidth: LineBreakStrategy | undefined,
  maxMessageSize: number | undefined,
): LineBreakStrategy {
  if (styleWidth !== undefined && styleWidth.getMaxWidth() > 0) return styleWidth;
  return maxMessageSize === undefined ? LineBreakStrategy.NONE : new LineBreakStrategy(String(maxMessageSize));
}

/**
 * Place a message's label, and its autonumber when it has one.
 *
 * `leftX` is the BLOCK's left edge — where the autonumber starts when there is
 * one, and where the label starts when there is not; upstream's default
 * `messagePosition` is LEFT (`ComponentRoseArrow.java:163-178`).
 *
 * `arrowY` is the ARROW's own y, not a text y. Upstream places the component's
 * origin at the block top and puts the arrow `getTextHeight` below it
 * (`posArrow = getTextHeight(stringBounder)`, `yText = 0`,
 * `ComponentRoseArrow.java:141-148`), so a multi-line label grows UPWARD,
 * leaving the arrow where the caller put it.
 *
 * `font` is the message style's font, colour already resolved for the draw
 * (`sequence-arrow-paint.ts#messagePaint`'s `font`); it defaults to the
 * default skin's, for a block built with no message in hand.
 */
export function messageLabelBlock(
  label: string,
  numberText: string | undefined,
  leftX: number,
  arrowY: number,
  env: MessageLabelEnv,
  font: FontConfiguration = defaultMessageFont(),
): MessageLabelBlock {
  return placeMessageLabel({ label, numberText, leftX, arrowY, font }, env);
}

/** What {@link placeMessageLabel} places: {@link messageLabelBlock}'s
 *  parameters, plus the arrow style's alignment. */
export interface MessageLabelSpec {
  readonly label: string;
  readonly numberText: string | undefined;
  readonly leftX: number;
  readonly arrowY: number;
  readonly font: FontConfiguration;
  /** The arrow style's `HorizontalAlignment`, the sheet's: each stripe's
   *  shift inside the block is `SheetBlock1#initMap`'s `(maxWidth - width) /
   *  coef` (`SheetBlock1.java:155-193`). */
  readonly rowAlign?: HorizontalAlignment | undefined;
  /** The arrow's `getForegroundColor()` (its `LineColor`, the arrow colour
   *  over it), applied before the block draws. */
  readonly fore?: Paint | undefined;
  /** The arrow style's `wrapWidth()` (`Rose.java:289`). */
  readonly styleWidth?: LineBreakStrategy | undefined;
}

/** The arrow style's three reads a label is placed with: its font, its
 *  alignment and its `getForegroundColor()` (`AbstractTextualComponent.java:
 *  80-81`, `ComponentRoseArrow.java:91`). */
export function labelDrawOf(paint: {
  readonly font: FontConfiguration;
  readonly align: HorizontalAlignment | undefined;
  readonly stroke: Paint;
  readonly wrapWidth?: LineBreakStrategy | undefined;
}): Pick<MessageLabelSpec, 'font' | 'rowAlign' | 'fore' | 'styleWidth'> {
  return { font: paint.font, rowAlign: paint.align, fore: paint.stroke, styleWidth: paint.wrapWidth };
}

/** {@link messageLabelBlock} with the label's row alignment. The block's TOP
 *  sits one `getTextHeight` -- the block plus the padding on both sides
 *  (`AbstractTextualComponent.java:110-114`) -- above the arrow. */
export function placeMessageLabel(request: MessageLabelSpec, env: MessageLabelEnv): MessageLabelBlock {
  const { label, numberText, leftX, arrowY, font, rowAlign, fore, styleWidth } = request;
  const block = messageLabelLayout(label, numberText, font, env, { align: rowAlign, fore, styleWidth });
  const top = arrowY - (block.height + 2 * ARROW_LABEL_PADDING_Y);
  const padder =
    env.padder !== undefined && block.padderBox !== undefined
      ? { padder: padderGeoAt(env.padder, block.padderBox, { x: leftX, y: top }) }
      : {};
  if (block.primitives.length === 0) return { lines: [], ...padder };
  const placed = block.primitives.map((r) => offsetRun(r, leftX, top));
  if (numberText === undefined) return { lines: placed, ...padder };
  const [first, ...rest] = placed;
  return first === undefined ? { lines: [], ...padder } : { lines: rest, number: first, ...padder };
}

/** `HColors.transparent()` as `SvgGraphics` writes it: the sprite tint a
 *  transparent `FontColor` leaves (`font.color === null`, `UText.ts`). */
export const TRANSPARENT_SVG = '#00000000';

/** The label block's height, `textBlock.calculateDimension(...).getHeight()`
 *  -- what `getTextHeight` adds the padding to (`AbstractTextualComponent
 *  .java:110-114`), so a caller reserving with this and one placing with
 *  {@link placeMessageLabel} read ONE block. */
export function messageLabelHeight(
  label: string,
  numberText: string | undefined,
  font: FontConfiguration,
  env: MessageLabelMeasureEnv,
  styleWidth?: LineBreakStrategy,
): number {
  return messageLabelLayout(label, numberText, font, env, { styleWidth }).height;
}

/**
 * The width of the label block {@link messageLabelBlock} lays out, for the
 * participant row: `Display#createMessageNumber` merges the number, a 4px
 * right margin and the label (`Display.java:703-712`), measured in `font`,
 * the message's ARROW-style font (`AbstractTextualComponent.java:80-92`).
 */
export function messageLabelWidth(
  label: string,
  numberText: string | undefined,
  font: FontConfiguration,
  env: MessageLabelMeasureEnv,
  styleWidth?: LineBreakStrategy,
): number {
  return messageLabelLayout(label, numberText, font, env, { styleWidth }).width;
}
