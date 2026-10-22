/**
 * Sequence diagram layout -- the self-message half of message geometry, split
 * out of sequence-layout-message.ts the way upstream splits
 * `CommunicationTile` from `CommunicationTileSelf`.
 *
 * @see ~/git/plantuml/.../sequencediagram/teoz/CommunicationTileSelf.java:129-153
 * (`drawU`: `levelIgnore`/`levelConsidere`, the `x1` shift, `setDeltaX1`)
 */

import type { ActivationEvent, MessageEvent } from './ast.js';
import type { EventProcessingContext } from './sequence-layout-events.js';
import { activationLevel } from './sequence-layout-events.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';

/** Arrow endpoints/direction resolved for a single message. */
export interface MessageEndpoints {
  fromX: number;
  toX: number;
  arrowDirection: 'right' | 'left' | 'self';
  /** Self messages only — see {@link MessageGeo.selfReturnX}. */
  selfReturnX?: number;
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
  // Both life events share the message's command, hence its builder
  // (`SequenceDiagram.java:371-372`).
  const { styleBuilder } = event;
  const own: ActivationEvent[] = [
    ...(event.deactivates === participantId ? [{ kind: 'deactivate' as const, participantId, styleBuilder }] : []),
    ...(event.activates === participantId ? [{ kind: 'activate' as const, participantId, styleBuilder }] : []),
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
export function liveOffsetSelf(
  endpoints: MessageEndpoints,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): MessageEndpoints {
  const levelIgnore = activationLevel(ctx.activationStart, event.from);
  const levelConsidere = levelAfterBoundEvents(event.from, event, ctx, bound);

  let base = endpoints.fromX + LIVE_DELTA_SIZE * levelIgnore;
  if (levelIgnore < levelConsidere) base += LIVE_DELTA_SIZE * (levelConsidere - levelIgnore);

  const deltaX1 = (levelIgnore - levelConsidere) * LIVE_DELTA_SIZE;
  const fromX = base + (deltaX1 < 0 ? deltaX1 : 0);
  return {
    ...endpoints,
    fromX,
    toX: endpoints.toX + (fromX - endpoints.fromX),
    selfReturnX: base + (deltaX1 > 0 ? -deltaX1 : 1),
  };
}
