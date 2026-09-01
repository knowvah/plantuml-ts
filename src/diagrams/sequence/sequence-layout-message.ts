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
import {
  activationLevel,
  emitActivation,
  openActivation,
  pushActivation,
} from './sequence-layout-events.js';
import { fontSpecOf, LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { messageLabelBlock, messageLabelRows } from './text-block-geo.js';

export function handleMessageEvent(
  event: MessageEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[] = [],
): void {
  const fromGeo = ctx.participantMap.get(event.from);
  const toGeo = ctx.participantMap.get(event.to);
  // Skip gracefully if either participant is unknown
  if (fromGeo === undefined || toGeo === undefined) return;

  const endpoints = liveOffsetEndpoints(
    resolveMessageEndpoints(event, fromGeo, toGeo, ctx),
    event,
    ctx,
    bound,
  );
  const lineHeight = ctx.measurer.measure('M', fontSpecOf(ctx.theme)).height;
  // A multi-line label grows UPWARD from its arrow (`text-block-geo.ts`), so
  // the extra rows are reserved BEFORE the arrow is placed, not after.
  const rows = messageLabelRows(event.label, numberTextOf(event));
  cursor.y += Math.max(0, rows - 1) * lineHeight;

  const messageGeo = buildMessageGeo(event, endpoints, cursor.y, ctx);
  ctx.eventGeos.push(messageGeo);
  cursor.lastMessageY = messageGeo.y;

  cursor.y += ctx.theme.sequence.messageSpacing + lineHeight;

  // Handle auto-activate/deactivate via ++ / -- shorthand on message
  applyMessageActivation(event, messageGeo, cursor, ctx);
}

/** The autonumber run's text, when the message carries one.
 *  `getLabelNumbered` prepends it as a `MessageNumber`
 *  (`AbstractMessage.java:200-206`); the formatted `sequenceLabel` wins over
 *  the bare `sequenceNumber` when both are present. */
function numberTextOf(event: MessageEvent): string | undefined {
  if (event.sequenceLabel !== undefined) return event.sequenceLabel;
  return event.sequenceNumber === undefined ? undefined : String(event.sequenceNumber);
}

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

/** Build the MessageGeo for a resolved set of endpoints at the given y. */
function buildMessageGeo(
  event: MessageEvent,
  endpoints: MessageEndpoints,
  y: number,
  ctx: EventProcessingContext,
): MessageGeo {
  const centerX = endpoints.arrowDirection === 'self'
    ? endpoints.fromX + 20
    : (endpoints.fromX + endpoints.toX) / 2;
  const block = messageLabelBlock(
    event.label, numberTextOf(event), centerX, y - 5, ctx.theme, ctx.measurer,
  );
  return {
    labelLines: block.lines,
    ...(block.number !== undefined ? { labelNumber: block.number } : {}),
    kind: 'message',
    fromX: endpoints.fromX,
    toX: endpoints.toX,
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
  for (const life of bound)
    if (life.kind === 'activate' && life.participantId === participantId) level++;
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
  if (endpoints.arrowDirection === 'self') return endpoints;
  const level1 = liveLevelAt(event.from, event, ctx, bound);
  const level2 = liveLevelAt(event.to, event, ctx, bound);
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

/** Arrow endpoints/direction resolved for a single message. */
interface MessageEndpoints {
  fromX: number;
  toX: number;
  arrowDirection: 'right' | 'left' | 'self';
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

/** Apply the `++`/`--` auto-activate/deactivate shorthand on a message. */
function applyMessageActivation(
  event: MessageEvent,
  messageGeo: MessageGeo,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  if (event.activates !== undefined) {
    // Activation starts at the arrow y, not after the post-arrow spacing
    // advance. LIFECOLOR rides along on the `+`/`*` activate leg only --
    // `manageActivations`'s `-`/`!` legs always pass `null`
    // (`CommandArrow.java:439,445-450`), so a deactivate never recolors.
    pushActivation(ctx.activationStart, event.activates, {
      y: messageGeo.y,
      ...(event.lifeColor !== undefined ? { color: event.lifeColor } : {}),
    });
  }
  if (event.deactivates !== undefined) {
    // End at the arrow y. If that would give zero/negative height (the
    // activate and deactivate land at the same y), fall back to the
    // post-spacing cursor.y so the bar is always visible.
    const deactStartY = openActivation(ctx.activationStart, event.deactivates)?.y;
    const deactEndY =
      deactStartY !== undefined && messageGeo.y <= deactStartY
        ? cursor.y
        : messageGeo.y;
    emitActivation(event.deactivates, deactEndY, ctx.participantMap, ctx.activationStart, ctx.eventGeos);
  }
}
