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
import {
  ARROW_LABEL_HEAD_CLEARANCE,
  ARROW_LABEL_PADDING_X1,
  messageLabelBlock,
  messageLabelRows,
} from './text-block-geo.js';

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
  if (endpoints.arrowDirection === 'self') return endpoints.fromX + ARROW_LABEL_PADDING_X1;
  // The component spans the arrow, so its origin is the LEFTMOST end whichever
  // way the message runs. `fromX`/`toX` are that origin, not the drawn line:
  // the renderer applies upstream's own `start += getArrowDeltaX() / 2` shift
  // for a FULL NORMAL head (`ComponentRoseArrow.java:129-133`) itself.
  const start = Math.min(endpoints.fromX, endpoints.toX);
  const leftEnd =
    endpoints.arrowDirection === 'left' ? event.arrow.dressing2 : event.arrow.dressing1;
  const clearance = leftEnd.head === 'NONE' ? 0 : ARROW_LABEL_HEAD_CLEARANCE;
  return start + ARROW_LABEL_PADDING_X1 + clearance;
}

/** Build the MessageGeo for a resolved set of endpoints at the given y. */
function buildMessageGeo(
  event: MessageEvent,
  endpoints: MessageEndpoints,
  y: number,
  ctx: EventProcessingContext,
): MessageGeo {
  const block = messageLabelBlock(
    event.label, numberTextOf(event), labelLeftOf(event, endpoints), y, ctx.theme, ctx.measurer,
  );
  return {
    labelLines: block.lines,
    ...(block.number !== undefined ? { labelNumber: block.number } : {}),
    kind: 'message',
    fromX: endpoints.fromX,
    toX: endpoints.toX,
    ...(endpoints.selfReturnX !== undefined ? { selfReturnX: endpoints.selfReturnX } : {}),
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
  if (endpoints.arrowDirection === 'self')
    return liveOffsetSelf(endpoints, event, ctx, bound);
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

/**
 * `getLevelAt(this, CONSIDER_FUTURE_DEACTIVATE)` — the level AFTER the life
 * events bound to this message, where {@link liveLevelAt}'s
 * IGNORE_FUTURE_DEACTIVATE is the level with the activates counted and the
 * deactivates not, and a plain `activationLevel` is the level with neither.
 *
 * The loop below is `getLevelAtInternal`'s own (`LiveBoxes.java:126-146`),
 * including its stopping rule: once BOTH an activate and a deactivate have
 * been seen for this participant it breaks BEFORE applying the second, so a
 * `--++` and a `++--` on one message do not cancel out — the first one wins
 * and the order decides which. `Math.max(0, level - 1)` is the same clamp
 * every other deactivate gets.
 */
function levelAfterBoundEvents(
  participantId: string,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): number {
  // The message's own `++`/`--` come first, in `manageActivations`' order:
  // `spec.charAt(0)` then `spec.charAt(2)` (`CommandArrow.java:444-466`).
  // This port stores them as two fields and so cannot tell `--++` from
  // `++--`; deactivate-then-activate is taken, which is `--++`, the form the
  // corpus writes. Recorded rather than silently assumed.
  const own: ActivationEvent[] = [
    ...(event.deactivates === participantId
      ? [{ kind: 'deactivate' as const, participantId }]
      : []),
    ...(event.activates === participantId
      ? [{ kind: 'activate' as const, participantId }]
      : []),
  ];

  let level = activationLevel(ctx.activationStart, participantId);
  let seenActivate = false;
  let seenDeactivate = false;
  for (const life of [...own, ...bound]) {
    if (life.participantId !== participantId) continue;
    if (life.kind === 'activate') {
      seenActivate = true;
      if (seenDeactivate) break;
      level++;
    } else {
      seenDeactivate = true;
      if (seenActivate) break;
      level = Math.max(0, level - 1);
    }
  }
  return level;
}

/**
 * `CommunicationTileSelf#drawU:129-147` plus the two lines of
 * `ComponentRoseSelfArrow#drawRightSide` that read what it sets (`:92-93`).
 *
 * ```java
 * levelIgnore    = getLevelAt(this, IGNORE_FUTURE_ACTIVATE);
 * levelConsidere = getLevelAt(this, CONSIDER_FUTURE_DEACTIVATE);
 * if (!isReverseDefine()) {
 *     x1 += LIVE_DELTA_SIZE * levelIgnore;
 *     if (levelIgnore < levelConsidere)
 *         x1 += LIVE_DELTA_SIZE * (levelConsidere - levelIgnore);
 * }
 * area.setDeltaX1((levelIgnore - levelConsidere) * LIVE_DELTA_SIZE);
 * ```
 *
 * IGNORE_FUTURE_ACTIVATE turns off BOTH lookahead arms in
 * `getLevelAtInternal` (`:130,137`), so `levelIgnore` is simply the level
 * before anything bound to this message — which is what the stack already
 * holds when layout reaches the message. `levelConsidere` is the level after
 * all of it: {@link levelAfterBoundEvents}.
 *
 * The two horizontal segments then split by `deltaX1`, and they split even
 * when nothing is live: `x2`'s `: 1` fallback puts the returning segment one
 * pixel right of the outgoing one unconditionally.
 *
 * Jar-verified end to end. `jobadi-87-jegi648` (`activate Bob` then
 * `Bob -> Bob`, levels 1 and 1): base `29.469 + 5`, `deltaX1 = 0`, so
 * `34.469` and `35.469` — the golden's two segments exactly.
 * `gesiba-07-rise357` (`B -> B ++` inside `A -> B ++`, levels 1 and 2):
 * base `55.044 + 5 + 5`, `deltaX1 = -5`, so `60.044` and `66.044` — again
 * exactly the golden's, and the head tip sits on the second.
 *
 * NOT ported: `isReverseDefine()`, i.e. a self message written `A <- A`.
 * Upstream skips the `x1` shift entirely for it and hands the whole job to
 * `drawLeftSide`, whose own three-branch `dx`/`level` arithmetic (`:177-190`)
 * mirrors the loop rather than offsetting it. This port does not record
 * `reverseDefine` on a self message at all, so the case cannot be
 * distinguished here yet; see DIVERGENCES.md.
 */
function liveOffsetSelf(
  endpoints: MessageEndpoints,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): MessageEndpoints {
  const levelIgnore = activationLevel(ctx.activationStart, event.from);
  const levelConsidere = levelAfterBoundEvents(event.from, event, ctx, bound);

  let base = endpoints.fromX + LIVE_DELTA_SIZE * levelIgnore;
  if (levelIgnore < levelConsidere)
    base += LIVE_DELTA_SIZE * (levelConsidere - levelIgnore);

  const deltaX1 = (levelIgnore - levelConsidere) * LIVE_DELTA_SIZE;
  const fromX = base + (deltaX1 < 0 ? deltaX1 : 0);
  return {
    ...endpoints,
    fromX,
    toX: endpoints.toX + (fromX - endpoints.fromX),
    selfReturnX: base + (deltaX1 > 0 ? -deltaX1 : 1),
  };
}

/** Arrow endpoints/direction resolved for a single message. */
interface MessageEndpoints {
  fromX: number;
  toX: number;
  arrowDirection: 'right' | 'left' | 'self';
  /** Self messages only — see {@link MessageGeo.selfReturnX}. */
  selfReturnX?: number;
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
