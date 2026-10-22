/**
 * Sequence diagram layout — message-arrow geometry, split out of
 * sequence-layout-events.ts to keep both files under the size cap.
 *
 * Handles `MessageEvent` ONLY. A `MessageExoEvent` is a separate
 * `SequenceEvent` member (D3) and never reaches here: upstream's
 * `MessageExo.isSelfMessage()` returns false even though its two participants
 * are the same object (`MessageExo.java:99-101`), so `resolveMessageEndpoints`
 * below — which reads `event.from === event.to` as "self" — would place every
 * exo arrow on a self loop. Exo geometry is `MessageExoArrow`'s, laid out in
 * its own module against the diagram BORDER.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream advances a running
 * Y cursor as it visits each event in source order)
 * @see .../sequencediagram/graphic/MessageExoArrow.java
 */

import type { ActivationEvent, MessageEvent, MessageGeo, ParticipantGeo } from './ast.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { activationLevel } from './sequence-layout-events.js';
import { popActivation, pushActivation, recordMessageStep, type ArrowEnds } from './sequence-layout-activation.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { isBelowForResponse, belowLabelAnchorY } from './sequence-response-below.js';
import { liveOffsetSelf, selfLabelLeft, type MessageEndpoints } from './sequence-layout-message-self.js';
import { atomFontSpec } from './sequence-creole-text-atom.js';
import type { SequencePaint } from './sequence-skin-param.js';
import { inclination1Of, inclination2Of } from './sequence-arrowhead.js';
import { reverseArrowConfiguration } from './renderer-arrowhead.js';
import { createTileHeight, markCreated, withCreateEnd } from './sequence-layout-create.js';
import { messageTileGaugeOf, type TileMetrics, type YGauge } from './sequence-y-gauge.js';
import { handleDestroy, messageDestroyCrosses } from './sequence-layout-life-event.js';
import { messagePaint } from './sequence-arrow-paint.js';
import {
  ARROW_LABEL_HEAD_CLEARANCE,
  ARROW_LABEL_PADDING_X1,
  messageLabelBlock,
  messageLabelRows,
  numberTextOf,
} from './text-block-geo.js';

/** A message tile as `TileBuilder.buildOne` hands it on: its gauge in the
 *  chain and the metrics that gauge was built from. */
export interface PlacedTile {
  readonly gauge: YGauge;
  readonly metrics: TileMetrics;
}

/**
 * The two numbers a `CommunicationTile`/`CommunicationTileSelf` feeds its
 * gauge (`CommunicationTile.java:97-117`, `CommunicationTileSelf.java:87-90`):
 * the arrow component's `getYPoint` and the tile's `getPreferredHeight`, which
 * for a `create` message is at least the created head's height (`:395-402`).
 * `undefined` for a message this port skips (an unknown participant), which
 * builds no tile.
 */
export function messageTileMetrics(event: MessageEvent, ctx: EventProcessingContext): TileMetrics | undefined {
  const toGeo = ctx.participantMap.get(event.to);
  if (!ctx.participantMap.has(event.from) || toGeo === undefined) return undefined;
  const isSelf = event.from === event.to;
  const blockH = labelBlockHeightOf(
    event,
    messagePaint(event.styleBuilder, event.stereotype, event.arrow, isSelf),
    ctx,
  );
  const incl = inclinationsOf(event, ctx);
  const advance = messageTileAdvance(blockH, isSelf, incl.incl1 + incl.incl2, isBelowForResponse(event));
  const height = event.create === true ? createTileHeight(advance.tileHeight, toGeo) : advance.tileHeight;
  return { contactRelative: isSelf ? selfArrowYPoint(blockH) : advance.arrowY, height };
}

/**
 * `ComponentRoseSelfArrow#getYPoint` (`:309-313`): `(textHeight +
 * textAndArrowHeight) / 2 + getPaddingX()`, the middle of the loop's drop --
 * NOT where its first stroke is drawn (`getTextHeight + getPaddingY`,
 * `getStartPoint:298-301`). `getPaddingX()` is `AbstractComponent`'s 0
 * (`AbstractComponent.java:151-153`; the arrow overrides only `getPaddingY`).
 * It is the self tile's contact point (`CommunicationTileSelf.java:74-77`),
 * which a `&` group aligns.
 */
export function selfArrowYPoint(blockH: number): number {
  const textHeight = blockH + 2 * ARROW_TEXT_PADDING_Y;
  return (textHeight + (textHeight + SELF_ARROW_ONLY_HEIGHT)) / 2 + SELF_ARROW_PADDING_X;
}

/** `AbstractComponent#getPaddingX` (`:151-153`), which no arrow component
 *  overrides. */
const SELF_ARROW_PADDING_X = 0;

/** The label block's height measured in the arrow style's font (13 by
 *  default, not the ambient 14) -- the font `messageLabelBlock` draws with, so
 *  reserve and draw cannot disagree (`planning/sizer-renderer-parity.md`). */
function labelBlockHeightOf(event: MessageEvent, paint: SequencePaint, ctx: EventProcessingContext): number {
  const lineHeight = ctx.measurer.measure('M', atomFontSpec(paint.font)).height;
  return messageLabelRows(event.label, numberTextOf(event)) * lineHeight;
}

/**
 * Lay one message out on the tile `TileBuilder` placed: the arrow sits
 * `contactRelative` below the gauge's `min` (`CommunicationTile#drawU`
 * translates by the gauge min, `AbstractComponent#drawU:142-143` by
 * `getPaddingY`), and the cursor stands on the gauge's `max`.
 */
export function handleMessageEvent(
  event: MessageEvent,
  tile: PlacedTile,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[] = [],
): void {
  const fromGeo = ctx.participantMap.get(event.from);
  const toGeo = ctx.participantMap.get(event.to);
  // `messageTileMetrics` built no tile for an unknown participant.
  if (fromGeo === undefined || toGeo === undefined) return;

  // `addMessage` sets `lastEventWithDeactivate = m` (`SequenceDiagram.java:
  // 204`); `dealWith` is participant1-or-participant2 membership.
  const participants = [event.from, event.to];
  ctx.lastMessageParticipants = participants;

  const endpoints = messageEndpointsOf(event, fromGeo, toGeo, ctx, bound);
  // `message.getUsedStyles()` at tile time (`CommunicationTile.java:163`,
  // `CommunicationTileSelf.java:106`) over the builder captured at the
  // command (`AbstractMessage.java:89-97`).
  const paint = messagePaint(event.styleBuilder, event.stereotype, event.arrow, endpoints.arrowDirection === 'self');
  const top = tile.gauge.min;
  const incl = inclinationsOf(event, ctx);
  const blockH = labelBlockHeightOf(event, paint, ctx);
  const advance = messageTileAdvance(
    blockH,
    event.from === event.to,
    incl.incl1 + incl.incl2,
    isBelowForResponse(event),
  );
  const messageGeo = buildMessageGeo(event, endpoints, top + advance.arrowY, ctx, paint);
  if (event.create === true) markCreated(messageGeo, toGeo, top, advance.tileHeight);
  ctx.eventGeos.push(messageGeo);
  ctx.messageTileGauges?.set(event, messageTileGaugeOf(tile.gauge, tile.metrics));
  cursor.y = tile.gauge.max;

  // A self arrow's end point is `getArrowOnlyHeight` below its start
  // (`ComponentRoseSelfArrow.java:298-307`); a flat arrow's ends share its y.
  const loop = endpoints.arrowDirection === 'self' ? SELF_ARROW_ONLY_HEIGHT : 0;
  // A flat arrow's step is `getStartPoint().getY()` = `getYPoint + inclination2`
  // (`CommunicationTile.java:194-198`, `ComponentRoseArrow.java:313-318`).
  const stepY = messageGeo.y + (loop > 0 ? 0 : incl.incl2);
  const arrow: ArrowEnds = { start: stepY, end: stepY + loop, self: loop > 0 };
  ctx.lastMessageCrosses = { of: participants, crosses: messageDestroyCrosses(event, arrow, bound, ctx) };
  applyMessageActivation(event, arrow, cursor, ctx);
}

/** The arrow's two ends after the create edge and the live-box offsets, and
 *  the two live levels a note wrapper written after it reads
 *  (`ctx.lastMessageLevels`). */
function messageEndpointsOf(
  event: MessageEvent,
  fromGeo: ParticipantGeo,
  toGeo: ParticipantGeo,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): MessageEndpoints {
  const resolved = withCreateEnd(event, resolveMessageEndpoints(event, fromGeo, toGeo, ctx), toGeo);
  ctx.lastMessageLevels = new Map(
    [event.from, event.to].map((id) => [id, liveLevelAt(id, event, ctx, bound)] as const),
  );
  return liveOffsetEndpoints(resolved, event, ctx, bound);
}

/**
 * Where the arrow sits inside its own tile, and how tall that tile is.
 *
 * ```java
 * // flat, ComponentRoseArrow:341-344
 * getTextHeight + getArrowDeltaY() + 2 * getPaddingY() + inclination1 + inclination2
 * // self, ComponentRoseSelfArrow:316-323
 * getTextHeight + getArrowDeltaY() + getArrowOnlyHeight() + 2 * getPaddingY()
 * ```
 *
 * with `getTextHeight = blockH + padding.top + padding.bottom` = `blockH + 2`
 * (`AbstractTextualComponent:110-114`, padding `topRightBottomLeft(1, 7, 1, 7)`
 * at `AbstractComponentRoseArrow:62`), `getArrowDeltaY() = 4` (`:55,92-94`),
 * `getPaddingY() = 4` (`:96-99`) and `getArrowOnlyHeight() = 13`
 * (`ComponentRoseSelfArrow:321-323`). So a one-line flat message advances 27,
 * not the 34 this port used, and a self message 40.
 *
 * The arrow's own y is `getYPoint = getTextHeight + getPaddingY`
 * (`ComponentRoseArrow:329-335`) below the tile top, which the drawn line
 * agrees with: `AbstractComponent#drawU:142-143` translates by `getPaddingY()`
 * and `drawInternalU:142-158` puts `posArrow = getTextHeight`. It is the same
 * `blockH + 6` for a self message — `drawRightSide:124-126` draws its three
 * strokes at `textHeight` inside a component already offset by `getPaddingY`.
 *
 * `blockH` is the label block's own height, which is `0` for an unlabelled
 * message (`StringBounderFromWidthTable#calculateDimension:64-80` over an
 * empty `Display`) — `jobadi-87-jegi648`'s bare `Bob -> Bob` puts its loop at
 * `y1="53"`, six below its tile top of 47.
 *
 * `inclination` is `inclination1 + inclination2` of the configuration the
 * tile builds (`ComponentRoseArrow.getPreferredHeight:342-343`), the `A ->(30)
 * B` slanted forms; 0 for every other message and for a self arrow, whose
 * component reads none (`ComponentRoseSelfArrow:316-323`).
 */
export function messageTileAdvance(
  blockH: number,
  isSelf: boolean,
  inclination = 0,
  below = false,
): { arrowY: number; tileHeight: number } {
  const textHeight = blockH + 2 * ARROW_TEXT_PADDING_Y;
  // `isBelowForResponse`: `getYPoint` is `getPaddingY()` alone and
  // `getPreferredHeight` is unguarded (`ComponentRoseArrow.java:330-332,341-344`).
  const arrowY = below ? ARROW_PADDING_Y : textHeight + ARROW_PADDING_Y;
  const loop = isSelf ? SELF_ARROW_ONLY_HEIGHT : 0;
  return { arrowY, tileHeight: textHeight + ARROW_DELTA_Y + loop + 2 * ARROW_PADDING_Y + inclination };
}

/**
 * The two inclinations of the configuration the tile's component is built
 * from: `message.getArrowConfiguration()`, `.reverse()`d when the tile is
 * reverse (`CommunicationTile.getComponent:158-159`), read through
 * `getInclination1/2` (`ComponentRoseArrow.java:68-69`). Reverse is
 * `point1 > point2` (`CommunicationTile.isReverse:125-132`) -- the port's
 * `'left'` direction. A self message has no inclination.
 */
function inclinationsOf(event: MessageEvent, ctx: EventProcessingContext): { incl1: number; incl2: number } {
  if (event.arrow.inclination === undefined || event.from === event.to) return { incl1: 0, incl2: 0 };
  const fromIdx = ctx.participantIndex.get(event.from) ?? 0;
  const toIdx = ctx.participantIndex.get(event.to) ?? 0;
  const config = fromIdx > toIdx ? reverseArrowConfiguration(event.arrow) : event.arrow;
  return { incl1: inclination1Of(config), incl2: inclination2Of(config) };
}

/** `AbstractComponentRoseArrow:62` — `topRightBottomLeft(1, 7, 1, 7)`, the
 *  vertical half. The horizontal half is `ARROW_PADDING_X`. */
const ARROW_TEXT_PADDING_Y = 1;
/** `AbstractComponentRoseArrow#getPaddingY:96-99`. */
const ARROW_PADDING_Y = 4;
/** `AbstractComponentRoseArrow#getArrowDeltaY:55,92-94`. */
const ARROW_DELTA_Y = 4;
/** `ComponentRoseSelfArrow#getArrowOnlyHeight:321-323` — the loop's drop, and
 *  the extra a self tile reserves over a flat one. `renderer-message.ts`'s
 *  `SELF_LOOP_HEIGHT` is the same number on the drawing side. */
const SELF_ARROW_ONLY_HEIGHT = 13;

/**
 * Optional scalar fields carried from `event` onto its `MessageGeo`
 * unchanged. `sequenceNumber`/`sequenceLabel` predate this task;
 * `url`/`stereotype`/`lifeColor` were declared by T6 but never copied
 * through here -- carried unchanged from `AbstractMessageEvent`
 * (`CommandArrow.java:404-413`) so the renderer can draw them (T16).
 */
function passthroughFields(
  event: MessageEvent,
): Pick<MessageGeo, 'sequenceNumber' | 'sequenceLabel' | 'url' | 'stereotype' | 'lifeColor'> {
  return {
    ...(event.sequenceNumber !== undefined ? { sequenceNumber: event.sequenceNumber } : {}),
    ...(event.sequenceLabel !== undefined ? { sequenceLabel: event.sequenceLabel } : {}),
    ...(event.url !== undefined ? { url: event.url } : {}),
    ...(event.stereotype !== undefined ? { stereotype: event.stereotype } : {}),
    ...(event.lifeColor !== undefined ? { lifeColor: event.lifeColor } : {}),
  };
}

/**
 * The left edge of a message's label block.
 *
 * Upstream's default `messagePosition` is LEFT, and its component is drawn
 * translated to the arrow's own start, so the label sits a fixed padding right
 * of where the line begins:
 *
 * ```java
 * textPos = getOldPaddingX1()
 *     + (direction2 == ArrowDirection.RIGHT_TO_LEFT_REVERSE || direction2 == ArrowDirection.BOTH_DIRECTION
 *             ? getArrowDeltaX()
 *             : 0);
 * ```
 * @see ~/git/plantuml/.../skin/rose/ComponentRoseArrow.java:164-179
 *
 * The clearance term asks whether there is a HEAD at the arrow's LEFT end, so
 * the text can be pushed clear of it. Upstream phrases that as a direction —
 * RIGHT_TO_LEFT_REVERSE when `dressing1` has a head and `dressing2` does not,
 * BOTH_DIRECTION when both do (`ArrowConfiguration.java:181-192`) — because
 * upstream keeps every arrow left-to-right in coordinates and encodes the
 * message's direction in WHICH DRESSING carries the head.
 *
 * This port encodes it the other way: `bob <- alice` comes out of the parser
 * with `dressing1.head = NONE`, `dressing2.head = NORMAL` and `fromX > toX`.
 * So the dressing sitting at the geometric left end is `dressing1` for a
 * rightward message and `dressing2` for a leftward one, and asking `dressing1`
 * directly would silently never fire. Jar-verified on `bosedo-77-loge384`,
 * whose three messages are two rightward and one leftward: the jar puts the
 * two rightward labels at `28.681 + 7` and the leftward one at `28.681 + 17`.
 *
 * A SELF message takes the padding alone —
 * `ComponentRoseSelfArrow#drawInternalU:88` is
 * `getTextBlock().drawU(ug.apply(UTranslate.dx(getOldPaddingX1())))`, with no
 * clearance term at all.
 */
function labelLeftOf(event: MessageEvent, endpoints: MessageEndpoints): number {
  if (endpoints.arrowDirection === 'self') return selfLabelLeft(endpoints);
  // The component spans the arrow, so its origin is the LEFTMOST end whichever
  // way the message runs. `fromX`/`toX` are that origin, not the drawn line:
  // the renderer applies upstream's own `start += getArrowDeltaX() / 2` shift
  // for a FULL NORMAL head (`ComponentRoseArrow.java:129-133`) itself.
  const start = Math.min(endpoints.fromX, endpoints.toX);
  const leftEnd = endpoints.arrowDirection === 'left' ? event.arrow.dressing2 : event.arrow.dressing1;
  const clearance = leftEnd.head === 'NONE' ? 0 : ARROW_LABEL_HEAD_CLEARANCE;
  return start + ARROW_LABEL_PADDING_X1 + clearance;
}

/** Build the MessageGeo for a resolved set of endpoints at the given y. The
 *  label is a text block in the arrow style's font
 *  (`AbstractTextualComponent.java:80-92`). */
function buildMessageGeo(
  event: MessageEvent,
  endpoints: MessageEndpoints,
  y: number,
  ctx: EventProcessingContext,
  paint: SequencePaint,
): MessageGeo {
  const left = labelLeftOf(event, endpoints);
  const block = messageLabelBlock(
    event.label,
    numberTextOf(event),
    left,
    belowLabelAnchorY(event, y, labelBlockHeightOf(event, paint, ctx), ARROW_TEXT_PADDING_Y),
    ctx,
    paint.font,
  );
  return {
    paint,
    labelLines: block.lines,
    ...(block.number !== undefined ? { labelNumber: block.number } : {}),
    kind: 'message',
    fromX: endpoints.fromX,
    toX: endpoints.toX,
    ...(endpoints.selfReturnX !== undefined ? { selfReturnX: endpoints.selfReturnX } : {}),
    ...(endpoints.selfLevel !== undefined ? { selfLevel: endpoints.selfLevel } : {}),
    y,
    label: event.label,
    arrow: event.arrow,
    arrowDirection: endpoints.arrowDirection,
    ...passthroughFields(event),
  };
}

/**
 * `livingSpace.getLevelAt(this, EventsHistoryMode.IGNORE_FUTURE_DEACTIVATE)`
 * for one endpoint of one message.
 *
 * IGNORE_FUTURE_DEACTIVATE names both halves: a life event bound to THIS
 * message counts if it is an ACTIVATE (`mode != IGNORE_FUTURE_ACTIVATE`,
 * `LiveBoxes.java:130-135`) and does NOT count if it is a DEACTIVATE
 * (`mode == CONSIDER_FUTURE_DEACTIVATE`, `:137-142`). So an arrow that
 * activates its target already dodges the bar it is about to open, and one
 * that deactivates its source still leaves from the bar it is about to
 * close.
 *
 * The port satisfies the second half for free -- `applyMessageActivation`
 * runs AFTER the geometry, so a `--` has not popped the stack yet. The first
 * half is what `bound` and `event.activates` add.
 */
function liveLevelAt(
  participantId: string,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): number {
  let level = activationLevel(ctx.activationStart, participantId);
  if (event.activates === participantId) level++;
  for (const life of bound) if (life.kind === 'activate' && life.participantId === participantId) level++;
  return level;
}

/**
 * `CommunicationTile#drawU`'s two level branches (`:328-350`), which move a
 * message's endpoints out of the way of the activation bars they land on.
 *
 * The two branches are NOT mirror images, and the asymmetry is upstream's,
 * kept verbatim:
 *
 * ```java
 * if (isReverse) {                              // right-to-left
 *     if (level1 == 1)      x1 -= LIVE_DELTA_SIZE;
 *     else if (level1 > 2)  x1 += LIVE_DELTA_SIZE * (level1 - 2);
 *     x2 += LIVE_DELTA_SIZE * level2;
 * } else {                                      // left-to-right
 *     if (level2 > 0) level2 = level2 - 2;
 *     x1 += LIVE_DELTA_SIZE * level1;
 *     x2 += LIVE_DELTA_SIZE * level2;
 * }
 * ```
 *
 * Note what the reverse branch does NOT do: `level1 == 2` gets no adjustment
 * at all, falling between the `== 1` and `> 2` arms. That reads like an
 * off-by-one and it is not corrected here -- see this project's rule on
 * apparent upstream bugs.
 *
 * `x1` is participant1, the SENDER, in both branches; `isReverse` is
 * `point1 > point2` (`:125-132`), i.e. this port's `arrowDirection ===
 * 'left'`. A SELF message has one lifeline and its own tile
 * (`CommunicationTileSelf:129-138`, two different history modes plus an
 * `Area.deltaX1`/`level` the self-loop component reads); it is left alone
 * here.
 *
 * Jar-verified. `rugeco-70-muro754`, forward, `a ->> b --++` with `a`
 * already activated: `x1 = 34 + 5 = 39`, which is the golden's `x1="39"`
 * from a lifeline at 34; and `level2 = 1` for the target it activates, so
 * `x2 = 133.769 - 5 = 128.769`. `kejoke-76-curu931`, reverse,
 * `Particpant_A <- Particpant_B` into an activated `A`: `level2 = 1` puts
 * the left end at `57.075 + 5 = 62.075`, which is where the golden's arrow
 * starts.
 */
function liveOffsetEndpoints(
  endpoints: MessageEndpoints,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): MessageEndpoints {
  if (endpoints.arrowDirection === 'self') return liveOffsetSelf(endpoints, event, ctx, bound);
  const level1 = liveLevelAt(event.from, event, ctx, bound);
  const level2 = liveLevelAt(event.to, event, ctx, bound);
  ctx.messageLevels?.set(event, { level1, level2 });
  let { fromX, toX } = endpoints;

  if (endpoints.arrowDirection === 'left') {
    if (level1 === 1) fromX -= LIVE_DELTA_SIZE;
    else if (level1 > 2) fromX += LIVE_DELTA_SIZE * (level1 - 2);
    toX += LIVE_DELTA_SIZE * level2;
  } else {
    fromX += LIVE_DELTA_SIZE * level1;
    toX += LIVE_DELTA_SIZE * (level2 > 0 ? level2 - 2 : 0);
  }
  return { ...endpoints, fromX, toX };
}

/** Resolve arrow endpoints/direction for a message, including self-messages. */
function resolveMessageEndpoints(
  event: MessageEvent,
  fromGeo: ParticipantGeo,
  toGeo: ParticipantGeo,
  ctx: EventProcessingContext,
): MessageEndpoints {
  const fromX = fromGeo.centerX;

  if (event.from === event.to) {
    // Self-message: offset toX to the right of the lifeline.
    // activationWidth (10) + offset (20) = 30 per spec.
    return {
      fromX,
      toX: fromX + ctx.theme.sequence.activationWidth + 20,
      arrowDirection: 'self',
    };
  }

  const toX = toGeo.centerX;
  // participantIndex always has both keys when participantMap does
  const fromIdx = ctx.participantIndex.get(event.from) ?? 0;
  const toIdx = ctx.participantIndex.get(event.to) ?? 0;
  // Note: the ternary is hoisted to its own statement (not inlined into the
  // object literal below) because lizard's TS tokenizer misparses a `<`/`>`
  // comparison used as an object-literal property value as a generic type
  // argument, corrupting function-boundary detection for the rest of the file.
  const arrowDirection: 'right' | 'left' = fromIdx < toIdx ? 'right' : 'left';
  return { fromX, toX, arrowDirection };
}

/**
 * The message tile's `onGaugeResolved` (`CommunicationTile.java:187-199`,
 * `CommunicationTileSelf.java:113-126`) records its `LiveBoxes` step; its own
 * `++`/`--`/`!!` are life events right after it (`CommandArrow
 * #manageActivations`, `:444-466`), which move the walk's level once the
 * arrow's geometry has read it. Where the bars start and end is `LiveBoxes`'
 * (`sequence-layout-activation.ts`).
 *
 * `!!` is a DESTROY life event after the message, exactly as a `destroy` line
 * there would be (`SequenceDiagram.java:369-371`): it closes the level
 * (`LifeEvent#isDeactivateOrDestroy`) and its tile stops the lifeline.
 */
function applyMessageActivation(
  event: MessageEvent,
  arrow: ArrowEnds,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  recordMessageStep(ctx, event, arrow, cursor.y);
  if (event.deactivates !== undefined) popActivation(ctx.activationStart, event.deactivates);
  if (event.activates !== undefined) pushActivation(ctx.activationStart, event.activates);
  if (event.destroys !== undefined) {
    popActivation(ctx.activationStart, event.destroys);
    handleDestroy(event.destroys, cursor, ctx);
  }
}
