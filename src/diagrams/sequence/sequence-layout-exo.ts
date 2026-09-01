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

import type { MessageExoEvent, MessageExoType, MessageGeo } from './ast.js';
import type { ArrowConfiguration } from './sequence-arrowhead.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { activationLevel } from './sequence-layout-events.js';
import { ARROW_PADDING_X, arrowFontSpecOf, fontSpecOf, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { messageLabelBlock, messageLabelRows } from './text-block-geo.js';
import { ARROW_DELTA_X, DIAM_CIRCLE } from './sequence-arrowhead.js';
import { LEFT_MARGIN } from './sequence-layout-participants.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------


/** The right margin between a leading `MessageNumber` and the label beside it
 *  — `TextBlockUtils.withMargin(tb1, 0, 4, 0, 0)` (`Display.java:706`). Same
 *  value `text-block-geo.ts` places the number with; duplicated rather than
 *  imported because that module is not this task's to widen. */
const MESSAGE_NUMBER_MARGIN = 4;

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

/** The autonumber run's text, when the message carries one. Mirrors
 *  `sequence-layout-message.ts#numberTextOf`, which is private to the module
 *  another task owns this batch. */
function numberTextOf(event: MessageExoEvent): string | undefined {
  if (event.sequenceLabel !== undefined) return event.sequenceLabel;
  return event.sequenceNumber === undefined ? undefined : String(event.sequenceNumber);
}

/** The label block's own width — the number, its margin and the widest label
 *  line, exactly as `messageLabelBlock` lays them out. */
function labelBlockWidth(event: MessageExoEvent, ctx: EventProcessingContext): number {
  // Same font `messageLabelBlock` lays the block out with — `arrow
  // { FontSize 13 }` (`plantuml.skin:306-308`).
  const fontSpec = arrowFontSpecOf(ctx.theme);
  const numberText = numberTextOf(event);
  const numberWidth = numberText === undefined ? 0 : ctx.measurer.measure(numberText, fontSpec).width;
  const gap = numberText === undefined ? 0 : MESSAGE_NUMBER_MARGIN;
  const lines = event.label === '' ? [] : event.label.split('\n');
  const labelWidth =
    lines.length === 0 ? 0 : Math.max(...lines.map((l) => ctx.measurer.measure(l, fontSpec).width));
  return numberWidth + gap + labelWidth;
}

/**
 * `comp.getPreferredDimension(...).getWidth()` for the arrow component —
 * `getTextWidth + getArrowDeltaX` (`skin/rose/ComponentRoseArrow.java:
 * 347-349`), where `getTextWidth` is the text block plus both paddings.
 * This is the whole width an exo message asks the diagram for
 * (`CommunicationExoTile.java:326-330`).
 */
function exoPreferredWidth(event: MessageExoEvent, ctx: EventProcessingContext): number {
  return labelBlockWidth(event, ctx) + 2 * ARROW_PADDING_X + ARROW_DELTA_X;
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
function exoSpan(event: MessageExoEvent, posC: number, ctx: EventProcessingContext): ExoSpan {
  const width = exoPreferredWidth(event, ctx);
  const right = isRightBorder(event.exoType);
  const point1 = right ? posC : posC - width;
  const point2 = right ? point1 + width : posC;

  // `isFromLeftBorderMessage`/`isFromRightBorderMessage` are exactly "this
  // border, and not a short arrow" (`CommunicationExoTile.java:249-255`).
  let x1 = right || event.shortArrow ? point1 : BORDER1;
  let x2 = point2;

  // `livingSpace.getLevelAt(this, IGNORE_FUTURE_DEACTIVATE)`
  // (`CommunicationExoTile.java:122`) -- the participant's real nesting
  // depth, which is what the two lines below were always written to
  // multiply. It was pinned at 0-or-1 while the port's activation model
  // could not count past one; the stack can, so this is now the number
  // upstream reads.
  //
  // An exo message has ONE participant and no `activates` field of its own
  // (the `+`/`-` suffix is emitted as a separate `ActivationEvent` AFTER
  // this message, `command-exo-arrow.ts`), so there is no future-activate
  // term to add: the stack already holds everything bound before it.
  const level = activationLevel(ctx.activationStart, event.participant);
  if (level > 0) {
    if (right) x1 += LIVE_DELTA_SIZE * level;
    else x2 += LIVE_DELTA_SIZE * (level - 2);
  }

  x1 += leftCircleInset(event.arrow, event.exoType);
  x2 -= rightCircleInset(event.arrow, event.exoType);
  return { x1, x2, point1, point2 };
}

/**
 * Where the label block's left edge lands: `getOldPaddingX1()`, plus
 * `getArrowDeltaX()` when the drawn head points right-to-left, plus the
 * positive part of `Area#textDeltaX` — which is how upstream keeps a
 * border-stretched arrow's label beside its PARTICIPANT instead of dragging
 * it to the middle of the stretch.
 * @see skin/rose/ComponentRoseArrow.java:173-179; teoz/CommunicationExoTile.java:112-117
 */
function exoLabelLeft(event: MessageExoEvent, span: ExoSpan): number {
  const right = isRightBorder(event.exoType);
  const textDeltaX = event.shortArrow ? 0 : right ? span.point2 - span.x2 : span.point1 - span.x1;
  const reverseHead = getDirection(event.exoType) === -1 ? ARROW_DELTA_X : 0;
  return span.x1 + ARROW_PADDING_X + reverseHead + Math.max(0, textDeltaX);
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
): MessageGeo {
  const rightwards = getDirection(event.exoType) === 1;
  // A2 changed `messageLabelBlock`'s third parameter from a centre to the
  // block's LEFT edge, which is what `exoLabelLeft` already computes — the
  // `+ blockWidth / 2` here existed only to turn it back into a centre for the
  // old signature. Exo x placement is `MessageExoArrow`'s, a different upstream
  // component, and is deliberately unchanged by this task.
  const block = messageLabelBlock(
    event.label,
    numberTextOf(event),
    exoLabelLeft(event, span),
    y,
    ctx.theme,
    ctx.measurer,
  );
  return {
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
    ...(event.sequenceNumber !== undefined ? { sequenceNumber: event.sequenceNumber } : {}),
    ...(event.sequenceLabel !== undefined ? { sequenceLabel: event.sequenceLabel } : {}),
    ...(event.url !== undefined ? { url: event.url } : {}),
    ...(event.stereotype !== undefined ? { stereotype: event.stereotype } : {}),
    ...(event.lifeColor !== undefined ? { lifeColor: event.lifeColor } : {}),
  };
}

/**
 * Lay one exo message out and advance the cursor, on the same vertical
 * rhythm as a between-lifelines message: a multi-line label grows UPWARD from
 * its arrow, so its extra rows are reserved before the arrow is placed.
 *
 * `cursor.lastMessageY` is set for the same reason `handleMessageEvent` sets
 * it — the parser emits an exo message's `+`/`-` activation as separate
 * `ActivationEvent`s around it, and `handleActivateEvent` starts the bar at
 * `lastMessageY`. Leaving it unset would start every exo-triggered bar one
 * message-spacing BELOW its own arrow.
 */
export function handleMessageExoEvent(
  event: MessageExoEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const participant = ctx.participantMap.get(event.participant);
  // Skip gracefully if the participant is unknown, as `handleMessageEvent` does.
  if (participant === undefined) return;

  const lineHeight = ctx.measurer.measure('M', fontSpecOf(ctx.theme)).height;
  const rows = messageLabelRows(event.label, numberTextOf(event));
  cursor.y += Math.max(0, rows - 1) * lineHeight;

  const messageGeo = buildExoGeo(event, exoSpan(event, participant.centerX, ctx), cursor.y, ctx);
  ctx.eventGeos.push(messageGeo);
  cursor.lastMessageY = messageGeo.y;
  cursor.y += ctx.theme.sequence.messageSpacing + lineHeight;
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
