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

import type { MessageEvent, MessageGeo, ParticipantGeo } from './ast.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { emitActivation, openActivation, pushActivation } from './sequence-layout-events.js';
import { fontSpecOf } from './sequence-layout-shared.js';
import { messageLabelBlock, messageLabelRows } from './text-block-geo.js';

export function handleMessageEvent(
  event: MessageEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const fromGeo = ctx.participantMap.get(event.from);
  const toGeo = ctx.participantMap.get(event.to);
  // Skip gracefully if either participant is unknown
  if (fromGeo === undefined || toGeo === undefined) return;

  const endpoints = resolveMessageEndpoints(event, fromGeo, toGeo, ctx);
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
