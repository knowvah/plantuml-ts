/**
 * The sequence message padder: the box `skinparam SequenceMessage{Padding,
 * Margin,BorderColor,BackGroundColor}` draws behind each message label, and
 * the room it reserves around it. Split out of `sequence-skin-param.ts`
 * (500-line cap).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/SkinParam.java:1216-1229
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/Padder.java:107-137
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/skin/rose/AbstractComponentRoseArrow.java:72-75
 */
import { ColorMapper, toSvgPaint } from '../../core/klimt/color/ColorMapper.js';
import { HColorGradient } from '../../core/klimt/color/HColorGradient.js';
import { HColorSimple } from '../../core/klimt/color/HColorSimple.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { ClockwiseTopRightBottomLeft } from '../../core/klimt/geom/ClockwiseTopRightBottomLeft.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { Paint } from '../../core/paint.js';
import { PAINT_NONE } from '../../core/svg.js';
import type { LabelPadderGeo } from './geo-message.js';
import { offsetRun, type LabelBlock } from './sequence-creole-sheet.js';
import type { SequenceLegacyParams } from './sequence-skin-param.js';

/** `INT_OR_DECIMAL` (`SkinParam.java:133`). */
const INT_OR_DECIMAL = /^\d+(\.\d+)?$/;
/** `isDigits` (`SkinParam#getCornerInternal:912`). */
const DIGITS = /^\d+$/;

/** `Padder` (`Padder.java:46-53`) other than `Padder.NONE`, colours resolved
 *  to the paint `ug.apply(colour)` emits; an absent colour is
 *  `HColors.none()` (`Padder.java:113-122`), i.e. {@link PAINT_NONE}. */
export interface MessagePadder {
  readonly margin: ClockwiseTopRightBottomLeft;
  readonly padding: ClockwiseTopRightBottomLeft;
  readonly stroke: Paint;
  readonly fill: Paint;
  /** `URectangle#rounded` argument; emitted as `rx = ry = roundCorner / 2`. */
  readonly roundCorner: number;
}

/** The drawn box, and where the wrapped label block is drawn from. */
export interface PadderLayout {
  readonly width: number;
  readonly height: number;
  readonly box: { readonly x: number; readonly y: number; readonly width: number; readonly height: number };
  readonly labelX: number;
  readonly labelY: number;
}

/** `SkinParam#getAsDouble` (`:1158-1164`): one number for all four sides. */
function sidesOf(params: SequenceLegacyParams, key: string): ClockwiseTopRightBottomLeft {
  const value = params.getValue(key);
  return value !== null && INT_OR_DECIMAL.test(value)
    ? ClockwiseTopRightBottomLeft.same(Number.parseFloat(value))
    : ClockwiseTopRightBottomLeft.none();
}

/** `getIHtmlColorSet().getColorOrWhite(value)` painted (`:1223-1224`). */
function paintOfToken(value: string | null): Paint {
  if (value === null) return PAINT_NONE;
  const color = HColorSet.instance().getColorOrWhite(value);
  // The driver casts the applied colour to simple or gradient (the ClassCast
  // `sequence-paint.ts#svgPaint` mirrors for the style layer).
  if (color instanceof HColorSimple || color instanceof HColorGradient) return toSvgPaint(color, ColorMapper.IDENTITY);
  throw new Error('ClassCastException: a padder colour is a simple or gradient colour');
}

/**
 * `SkinParam#sequenceDiagramPadder`: `undefined` is `Padder.NONE`, returned
 * when padding and margin are zero and both colours are unset (`:1219-1220`).
 * The round corner is `getRoundCorner(CornerParam.DEFAULT, null)` — the
 * `roundcorner` skinparam when it is digits, else 0 (`:891-905`).
 */
export function sequenceDiagramPadder(params: SequenceLegacyParams): MessagePadder | undefined {
  const padding = sidesOf(params, 'SequenceMessagePadding');
  const margin = sidesOf(params, 'SequenceMessageMargin');
  const border = params.getValue('SequenceMessageBorderColor');
  const background = params.getValue('SequenceMessageBackGroundColor');
  if (padding.isZero() && margin.isZero() && border === null && background === null) return undefined;
  const corner = params.getValue('roundcorner');
  return {
    margin,
    padding,
    stroke: paintOfToken(border),
    fill: paintOfToken(background),
    roundCorner: corner !== null && DIGITS.test(corner) ? Number.parseFloat(corner) : 0,
  };
}

/**
 * `Padder#apply`: the wrapped block measures `padding.apply(margin.apply(dim))`
 * (`Padder.java:109-111`) and draws its rectangle `margin` in from the origin,
 * sized `padding.apply(dim)`, with the label a further `padding` in
 * (`:113-131`). `origin` is where the unwrapped block would have been drawn.
 */
export function layoutPadder(
  padder: MessagePadder,
  origin: { readonly x: number; readonly y: number },
  dim: { readonly width: number; readonly height: number },
): PadderLayout {
  const inner = new XDimension2D(dim.width, dim.height);
  const boxed = padder.padding.apply(inner);
  const outer = padder.margin.apply(boxed);
  const x = origin.x + padder.margin.getLeft();
  const y = origin.y + padder.margin.getTop();
  return {
    width: outer.getWidth(),
    height: outer.getHeight(),
    box: { x, y, width: boxed.getWidth(), height: boxed.getHeight() },
    labelX: x + padder.padding.getLeft(),
    labelY: y + padder.padding.getTop(),
  };
}

/** A {@link LabelBlock} wrapped by {@link applyPadder}: `padderBox` is the
 *  drawn rectangle, relative to the block origin. */
export interface PaddedLabelBlock extends LabelBlock {
  readonly padderBox?: PadderLayout['box'];
}

/**
 * `padder.apply(block)` on a laid-out label (`AbstractComponentRoseArrow.java
 * :72-75`): the dimensions become the wrapped ones (`Padder.java:109-111`) and
 * the primitives sit `margin + padding` in (`:113-131`). `undefined` is
 * `Padder.NONE`, which returns the block itself (`:103-105`).
 */
export function applyPadder(block: LabelBlock, padder: MessagePadder | undefined): PaddedLabelBlock {
  if (padder === undefined) return block;
  const laid = layoutPadder(padder, { x: 0, y: 0 }, block);
  return {
    width: laid.width,
    height: laid.height,
    primitives: block.primitives.map((p) => offsetRun(p, laid.labelX, laid.labelY)),
    padderBox: laid.box,
  };
}

/** The box and its paint, placed where the block's origin is. */
export function padderGeoAt(
  padder: MessagePadder,
  box: NonNullable<PaddedLabelBlock['padderBox']>,
  origin: { readonly x: number; readonly y: number },
): LabelPadderGeo {
  return {
    x: origin.x + box.x,
    y: origin.y + box.y,
    width: box.width,
    height: box.height,
    fill: padder.fill,
    stroke: padder.stroke,
    roundCorner: padder.roundCorner,
  };
}
