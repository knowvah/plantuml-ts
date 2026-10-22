/**
 * Sequence diagram layout — EXO message geometry (`[-> Bob`, `Bob ->]`, …).
 *
 * An exo message is the one message kind with an end on the diagram BORDER
 * rather than on a lifeline, so it is laid out here rather than by
 * `sequence-layout-message.ts`: `MessageExo.isSelfMessage()` is FALSE even
 * though `getParticipant1() == getParticipant2()`
 * (`sequencediagram/MessageExo.java:99-101`), and that file reads
 * `from === to` as a self loop (D3).
 *
 * WHICH UPSTREAM ENGINE THIS MIRRORS — measured, not assumed.
 * The brief pointed at `sequencediagram/graphic/MessageExoArrow.java`. That
 * class is DEAD upstream and dead in the oracle jar:
 * `SequenceDiagram.java:306-309` builds a `SequenceDiagramFileMakerTeoz`
 * unconditionally (the `SequenceDiagramFileMakerPuma2` branch beside it is
 * commented out), and the jar contains no `DrawableSet`,
 * `DrawableSetInitializer` or `Step1MessageExo` class at all — the only code
 * that ever constructed a `MessageExoArrow`. Every exo pixel the oracle emits
 * comes from `sequencediagram/teoz/CommunicationExoTile.java`, so that is what
 * this module ports. The two engines agree on the SHAPE (border-anchored end,
 * `preferredWidth` for a short arrow, which decoration index pairs with which
 * exo type) and disagree on two VALUES, both verified against the jar:
 *
 *   1. the circle inset is `diamCircle / 2 + 2` = 6 (`CommunicationExoTile
 *      .java:138-147`), not `diamCircle` = 8 (`MessageExoArrow.java:90-94`);
 *   2. teoz's width term carries no circle addend (`CommunicationExoTile
 *      #addConstraints:334-341`, `#getMaxX:230-232`), where
 *      `MessageExoArrow#getPreferredWidth:135-150` adds `diamCircle` in four
 *      cases.
 *
 * Evidence: for `[o-> Bob : hi` the jar starts the arrow body at x=6 and
 * leaves the participant at `centerX = preferredWidth` exactly as the
 * undecorated `[-> Bob : hi` does. `MessageExoArrow` would have given 8 and
 * pushed the participant 8px right.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationExoTile.java
 * @see ~/git/plantuml/.../sequencediagram/graphic/MessageExoArrow.java
 */

import type { ActivationEvent, MessageExoEvent, MessageExoType, MessageGeo } from './ast.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { activationLevel } from './sequence-layout-events.js';
import { ARROW_PADDING_X, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { messageTileAdvance, type PlacedTile } from './sequence-layout-message.js';
import { messageTileGaugeOf, type TileMetrics } from './sequence-y-gauge.js';
import {
  labelDrawOf,
  placeMessageLabel,
  messageLabelHeight,
  messageLabelWidth,
  numberTextOf,
} from './text-block-geo.js';
import { ARROW_DELTA_X, DIAM_CIRCLE } from './sequence-arrowhead.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';
import { arrowDirectionOf, labelTextPos, messagePaint, messagePosition } from './sequence-arrow-paint.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** How far a matching-side `ArrowDecoration.CIRCLE` pulls the border end in.
 *  @see teoz/CommunicationExoTile.java:138-147 */
const CIRCLE_INSET = DIAM_CIRCLE / 2 + 2;

/**
 * `tileArguments.getBorder1()` — the left edge of the DRAWING SPACE
 * (`teoz/PlayingSpace.java:318-320`, the min of the x origin and every tile's
 * own `getMinX`).
 *
 * `LEFT_MARGIN`, not 0. Upstream draws the body shifted by `dx(-min1)` inside
 * a 10px document margin (`SequenceDiagramFileMakerTeoz.java:132,135-136`),
 * so `border1` lands ON that margin in image coordinates — it is the left
 * edge of the CONTENT, not of the image. The jar on `[<- Bob : hello` puts
 * the border-end head at x=11, one pixel off a border at 10; anchoring at 0
 * put it at 1 and made every left-border exo arrow overhang the page.
 */
const BORDER1 = LEFT_MARGIN;

// ---------------------------------------------------------------------------
// Type predicates — MessageExoType.java:55-61
// ---------------------------------------------------------------------------

/** `MessageExoType.isRightBorder()`. @see MessageExoType.java:59-61 */
function isRightBorder(type: MessageExoType): boolean {
  return type === 'FROM_RIGHT' || type === 'TO_RIGHT';
}

/** `MessageExoType.getDirection()` — `+1` points right, `-1` points left.
 *  @see MessageExoType.java:41-53 */
function getDirection(type: MessageExoType): 1 | -1 {
  return type === 'FROM_LEFT' || type === 'TO_RIGHT' ? 1 : -1;
}

/**
 * The inset on the arrow's LEFT end. `decoration1` pairs with `FROM_LEFT` and
 * `decoration2` with `TO_LEFT` — the asymmetry is upstream's own, and it is
 * the same in both engines: `CommunicationExoTile.java:138-141` and
 * `MessageExoArrow.java:90-94`. It follows from `CommandExoArrowAny.java:
 * 108-134`, where a message going TO a border reads `ARROW_SUPPCIRCLE1` as
 * end 1 and one coming FROM a border swaps the two.
 */
function leftCircleInset(arrow: ArrowConfiguration, type: MessageExoType): number {
  if (arrow.decoration1 === 'CIRCLE' && type === 'FROM_LEFT') return CIRCLE_INSET;
  if (arrow.decoration2 === 'CIRCLE' && type === 'TO_LEFT') return CIRCLE_INSET;
  return 0;
}

/** The mirror on the RIGHT end: `decoration2` pairs with `TO_RIGHT`,
 *  `decoration1` with `FROM_RIGHT`.
 *  @see teoz/CommunicationExoTile.java:143-147 */
function rightCircleInset(arrow: ArrowConfiguration, type: MessageExoType): number {
  if (arrow.decoration2 === 'CIRCLE' && type === 'TO_RIGHT') return CIRCLE_INSET;
  if (arrow.decoration1 === 'CIRCLE' && type === 'FROM_RIGHT') return CIRCLE_INSET;
  return 0;
}

// ---------------------------------------------------------------------------
// Widths
// ---------------------------------------------------------------------------

/** The label block's own width -- `getPureTextWidth`, the arrow component's
 *  text block (`AbstractTextualComponent.java:94-98`): the number, its 4 px
 *  margin and the label (`Display.java:703-712`), at the arrow style's font
 *  (`plantuml.skin:316-317`). */
function labelBlockWidth(event: MessageExoEvent, ctx: EventProcessingContext, paint: SequencePaint): number {
  return messageLabelWidth(event.label, numberTextOf(event), paint.font, ctx, paint.wrapWidth);
}

/**
 * `comp.getPreferredDimension(...).getWidth()` for the arrow component —
 * `getTextWidth + getArrowDeltaX` (`skin/rose/ComponentRoseArrow.java:
 * 347-349`), where `getTextWidth` is the text block plus both paddings.
 * This is the whole width an exo message asks the diagram for
 * (`CommunicationExoTile.java:326-330`).
 */
function exoPreferredWidth(event: MessageExoEvent, ctx: EventProcessingContext, paint: SequencePaint): number {
  return labelBlockWidth(event, ctx, paint) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
}

// ---------------------------------------------------------------------------
// Span
// ---------------------------------------------------------------------------

/** An exo arrow's four x values: the participant-side anchors upstream calls
 *  `point1`/`point2`, and the drawn ends `x1`/`x2` after the border swap, the
 *  livebox level and the circle insets. */
interface ExoSpan {
  x1: number;
  x2: number;
  /** `getPoint1` (`CommunicationExoTile.java:200-205`). */
  point1: number;
  /** `getPoint2` (`:207-212`). */
  point2: number;
  /** `Area#textDeltaX`, taken from `getPoint1/2` and `getPoint1/2Value`
   *  BEFORE the livebox shift and the circle insets
   *  (`CommunicationExoTile.java:122-124`). */
  textDeltaX: number;
}

/**
 * `getPoint1`/`getPoint2` and their `…Value` border overrides
 * (`CommunicationExoTile.java:200-226`), then the livebox shift (`:120-126`)
 * and the circle insets (`:137-147`).
 *
 * `x2` is PROVISIONAL for a non-short right-border message: upstream reads
 * `tileArguments.getBorder2()`, which is not known until every tile's extent
 * has been maxed (`PlayingSpace.java:75-96`). `anchorExoBorder` below applies
 * it once `layout.ts` has the diagram's width.
 */
function exoSpan(event: MessageExoEvent, posC: number, ctx: EventProcessingContext, paint: SequencePaint): ExoSpan {
  const width = exoPreferredWidth(event, ctx, paint);
  const right = isRightBorder(event.exoType);
  const point1 = right ? posC : posC - width;
  const point2 = right ? point1 + width : posC;

  // `isFromLeftBorderMessage`/`isFromRightBorderMessage` are exactly "this
  // border, and not a short arrow" (`CommunicationExoTile.java:249-255`).
  let x1 = right || event.shortArrow ? point1 : BORDER1;
  let x2 = point2;

  // `CommunicationExoTile.java:122-124`: read before `:128-135` and `:137-147`.
  const textDeltaX = event.shortArrow ? 0 : right ? point2 - x2 : point1 - x1;

  // `livingSpace.getLevelAt(this, IGNORE_FUTURE_DEACTIVATE)`
  // (`CommunicationExoTile.java:122`) -- the participant's real nesting
  // depth, which is what the two lines below were always written to
  // multiply. It was pinned at 0-or-1 while the port's activation model
  // could not count past one; the stack can, so this is now the number
  // upstream reads.
  //
  // `CommunicationExoTile.java:128` reads the level with
  // IGNORE_FUTURE_DEACTIVATE, which counts the activates bound to this message
  // (`LiveBoxes.java:164-170`): `ctx.lastMessageLevels`, set just above.
  const level =
    ctx.lastMessageLevels?.get(event.participant) ?? activationLevel(ctx.activationStart, event.participant);
  if (level > 0) {
    if (right) x1 += LIVE_DELTA_SIZE * level;
    else x2 += LIVE_DELTA_SIZE * (level - 2);
  }

  x1 += leftCircleInset(event.arrow, event.exoType);
  x2 -= rightCircleInset(event.arrow, event.exoType);
  return { x1, x2, point1, point2, textDeltaX };
}

/**
 * Where the label block's left edge lands: `ComponentRoseArrow#drawInternalU`'s
 * `textPos` -- LEFT is `getOldPaddingX1()` plus `getArrowDeltaX()` when the
 * drawn head points right-to-left; CENTER and RIGHT measure against the
 * component's width (`Rose.java:299-342` picks which) -- plus the positive
 * part of `Area#textDeltaX`, which is how upstream keeps a border-stretched
 * arrow's label beside its PARTICIPANT instead of dragging it to the middle
 * of the stretch.
 *
 * The component is built on the message's config, `reverse()`d for direction
 * -1, so the dressings swap then (`CommunicationExoTile.java:96-98`).
 *
 * A non-short RIGHT-border arrow's `x2` is provisional until the diagram's
 * width is known (see {@link exoSpan}), so CENTER and RIGHT there cannot be
 * measured yet and fall back to LEFT -- an open item, not upstream's rule.
 * @see skin/rose/ComponentRoseArrow.java:164-179; teoz/CommunicationExoTile.java:112-117
 */
function exoLabelLeft(
  event: MessageExoEvent,
  span: ExoSpan,
  ctx: EventProcessingContext,
  paint: SequencePaint,
): number {
  const dir = arrowDirectionOf(event.arrow, getDirection(event.exoType) === -1);
  const widthKnown = event.shortArrow || !isRightBorder(event.exoType);
  const position = widthKnown
    ? messagePosition(event.styleBuilder, dir, event.arrow.reverseDefine === true)
    : undefined;
  const textPos = labelTextPos({
    position,
    dir,
    width: span.x2 - span.x1,
    textDeltaX: span.textDeltaX,
    textWidth: labelBlockWidth(event, ctx, paint),
    padX1: ARROW_PADDING_X,
    padX2: ARROW_PADDING_X,
  });
  return span.x1 + textPos + Math.max(0, span.textDeltaX);
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/** Build the `MessageGeo` for an exo message at the given y. `fromX`/`toX`
 *  run in the message's own direction, so the renderer's own `fromX > toX`
 *  reversal reproduces `getComponent`'s `arrowConfiguration.reverse()`
 *  (`CommunicationExoTile.java:96-98`). */
function buildExoGeo(
  event: MessageExoEvent,
  span: ExoSpan,
  y: number,
  ctx: EventProcessingContext,
  paint: SequencePaint,
): MessageGeo {
  const rightwards = getDirection(event.exoType) === 1;
  // A2 changed `messageLabelBlock`'s third parameter from a centre to the
  // block's LEFT edge, which is what `exoLabelLeft` already computes — the
  // `+ blockWidth / 2` here existed only to turn it back into a centre for the
  // old signature. Exo x placement is `MessageExoArrow`'s, a different upstream
  // component, and is deliberately unchanged by this task.
  const block = placeMessageLabel(
    {
      label: event.label,
      numberText: numberTextOf(event),
      leftX: exoLabelLeft(event, span, ctx, paint),
      arrowY: y,
      ...labelDrawOf(paint),
    },
    ctx,
  );
  return {
    paint,
    kind: 'message',
    fromX: rightwards ? span.x1 : span.x2,
    toX: rightwards ? span.x2 : span.x1,
    y,
    label: event.label,
    arrow: event.arrow,
    arrowDirection: rightwards ? 'right' : 'left',
    labelLines: block.lines,
    exoType: event.exoType,
    shortArrow: event.shortArrow,
    ...(block.number !== undefined ? { labelNumber: block.number } : {}),
    ...(block.padder !== undefined ? { labelPadder: block.padder } : {}),
    ...(event.sequenceNumber !== undefined ? { sequenceNumber: event.sequenceNumber } : {}),
    ...(event.sequenceLabel !== undefined ? { sequenceLabel: event.sequenceLabel } : {}),
    ...(event.url !== undefined ? { url: event.url } : {}),
    ...(event.stereotype !== undefined ? { stereotype: event.stereotype } : {}),
    ...(event.lifeColor !== undefined ? { lifeColor: event.lifeColor } : {}),
  };
}

/**
 * The arrow component's `getYPoint` and `getPreferredHeight` an exo tile feeds
 * its gauge (`CommunicationExoTile.java:81-84,93-95,155-159`).
 *
 * `CommunicationExoTile#getComponent:97-104` builds a `ComponentRoseArrow`, the
 * same component a between-lifelines message uses, so its tile has the same
 * height and the same contact point and `messageTileAdvance` is shared, not
 * duplicated. The font is the arrow style's for the same reason it is there.
 * An exo arrow is `ComponentRoseArrow`, never the self component: its
 * direction is never SELF (`CommunicationExoTile.java:96-98,107`).
 * `undefined` when the participant is unknown: the port builds no tile.
 */
export function exoTileMetrics(event: MessageExoEvent, ctx: EventProcessingContext): TileMetrics | undefined {
  if (!ctx.participantMap.has(event.participant)) return undefined;
  const advance = exoAdvanceOf(event, exoPaintOf(event), ctx);
  return { contactRelative: advance.arrowY, height: advance.tileHeight };
}

function exoPaintOf(event: MessageExoEvent): SequencePaint {
  return messagePaint(event.styleBuilder, event.stereotype, event.arrow, false);
}

function exoAdvanceOf(event: MessageExoEvent, paint: SequencePaint, ctx: EventProcessingContext) {
  return messageTileAdvance(
    messageLabelHeight(event.label, numberTextOf(event), paint.font, ctx, paint.wrapWidth),
    false,
  );
}

/**
 * Lay one exo message out on the tile `TileBuilder` placed
 * (`TileBuilder.java:123-127`): the arrow `contactRelative` below the gauge's
 * min, the cursor on its max.
 *
 * `ctx.lastMessageLevels` is the level a note wrapper reads:
 * `livingSpace.getLevelAt(this, IGNORE_FUTURE_DEACTIVATE)`
 * (`CommunicationTileNoteRight.java:125`), the stack plus every `activate`
 * bound to this message (`LiveBoxes.java:130-135`).
 */
export function handleMessageExoEvent(
  event: MessageExoEvent,
  tile: PlacedTile,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[] = [],
): void {
  const participant = ctx.participantMap.get(event.participant);
  // `exoTileMetrics` built no tile for an unknown participant.
  if (participant === undefined) return;

  // An exo message is an `AbstractMessage` too, so it is a `destroy`'s binding
  // target on the same terms (`SequenceDiagram.java:204`).
  ctx.lastMessageParticipants = [event.participant];
  const futureActivates = bound.filter((b) => b.kind === 'activate' && b.participantId === event.participant);
  ctx.lastMessageLevels = new Map([
    [event.participant, activationLevel(ctx.activationStart, event.participant) + futureActivates.length],
  ]);

  const paint = exoPaintOf(event);
  const advance = exoAdvanceOf(event, paint, ctx);
  const top = tile.gauge.min;
  const span = exoSpan(event, participant.centerX, ctx, paint);
  const messageGeo = buildExoGeo(event, span, top + advance.arrowY, ctx, paint);
  ctx.eventGeos.push(messageGeo);
  ctx.messageTileGauges?.set(event, messageTileGaugeOf(tile.gauge, tile.metrics));
  cursor.y = tile.gauge.max;
}

// ---------------------------------------------------------------------------
// Diagram-width participation
// ---------------------------------------------------------------------------

/** The border end of a right-border exo geo — `toX` for `TO_RIGHT`, `fromX`
 *  for `FROM_RIGHT`, i.e. always the larger of the two. */
function borderEndIsToX(geo: MessageGeo): boolean {
  return geo.exoType === 'TO_RIGHT';
}

/**
 * `CommunicationExoTile#getMaxX` — `getPoint2()`, which for a right-border
 * message is `posC + preferredWidth`. `PlayingSpace` maxes it with every
 * other tile's to place the right border (`PlayingSpace.java:75-96`), so THIS
 * is how an exo message widens the document. `undefined` for anything that is
 * not a right-border exo: a left-border one ends on its own lifeline.
 *
 * Short arrows count too — `getMaxX` never consults `isShortArrow`.
 * @see teoz/CommunicationExoTile.java:230-232
 */
export function exoRightExtent(geo: MessageGeo): number | undefined {
  if (geo.exoType === undefined || !isRightBorder(geo.exoType)) return undefined;
  const drawnEnd = borderEndIsToX(geo) ? geo.toX : geo.fromX;
  return drawnEnd + rightCircleInset(geo.arrow, geo.exoType);
}

/**
 * Re-anchor every non-short right-border exo onto the now-known right border,
 * the `getPoint2Value` branch that reads `tileArguments.getBorder2()`
 * (`CommunicationExoTile.java:221-226`). The circle inset is re-applied on top
 * of the border, exactly as `drawU` applies it after the border swap
 * (`:143-147`).
 */
export function anchorExoBorders(geos: readonly MessageGeo[], border2: number): void {
  for (const geo of geos) {
    if (geo.exoType === undefined || !isRightBorder(geo.exoType)) continue;
    if (geo.shortArrow === true) continue;
    const x2 = border2 - rightCircleInset(geo.arrow, geo.exoType);
    if (borderEndIsToX(geo)) geo.toX = x2;
    else geo.fromX = x2;
  }
}
