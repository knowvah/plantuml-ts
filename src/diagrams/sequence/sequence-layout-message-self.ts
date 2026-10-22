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
import { activationLevel } from './sequence-layout-activation.js';
import { LIVE_DELTA_SIZE } from './sequence-layout-shared.js';
import { ARROW_LABEL_PADDING_X1 } from './text-block-geo.js';
import { selfCompWidth } from './sequence-note-anchor.js';

/** Arrow endpoints/direction resolved for a single message. */
export interface MessageEndpoints {
  fromX: number;
  toX: number;
  arrowDirection: 'right' | 'left' | 'self';
  /** Self messages only — see {@link MessageGeo.selfReturnX}. */
  selfReturnX?: number;
  /** Self messages only: the component's origin, `x1` after
   *  `CommunicationTileSelf#drawU`'s shift (`:140-147`) -- where the loop's
   *  far end and the label are measured from. */
  selfOriginX?: number;
  /** Reverse self messages only: {@link MessageGeo.selfLevel}. */
  selfLevel?: number;
}

/** `xRight = arrowWidth - 3` with `arrowWidth = 45`
 *  (`ComponentRoseSelfArrow.java:59-60`): the loop's vertical stroke, from
 *  the component origin (`:124-126`). */
export const SELF_ARROW_X_RIGHT = 42;

/** A self message's label: `getTextBlock().drawU(ug.apply(UTranslate.dx(
 *  getOldPaddingX1())))` (`ComponentRoseSelfArrow.java:88`) on the
 *  component origin -- never on the outgoing segment's `deltaX1` start. */
export function selfLabelLeft(endpoints: MessageEndpoints): number {
  return (endpoints.selfOriginX ?? endpoints.fromX) + ARROW_LABEL_PADDING_X1;
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
 * pixel right of the outgoing one unconditionally. Only the outgoing segment
 * moves by a negative `deltaX1`; the vertical stroke stays at `xRight` and the
 * label at `getOldPaddingX1()`, both from the component origin `x1`
 * (`ComponentRoseSelfArrow.java:88,91-93,124-126`). The port carries that
 * origin as `selfOriginX` and the vertical stroke's x as `toX`.
 *
 * `jobadi-87-jegi648` (`activate Bob` then `Bob -> Bob`, levels 1 and 1):
 * base `29.469 + 5`, `deltaX1 = 0`, so `34.469` and `35.469` — the golden's
 * two segments. `gesiba-07-rise357` (`B -> B ++` inside `A -> B ++`, levels 1
 * and 2): base `55.044 + 5 + 5`, `deltaX1 = -5`, so the segments at `60.044`
 * and `66.044` -- but the loop end and label on `65.044`, which the earlier
 * reading of this code (both from `60.044`) did not match: the golden still
 * diffed there (sdd2 research C, SELFX).
 *
 * A REVERSE self message (`A <- A`, `isReverseDefine()`) skips the shift and is
 * {@link liveOffsetSelfReverse}'s.
 */
export function liveOffsetSelf(
  endpoints: MessageEndpoints,
  event: MessageEvent,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): MessageEndpoints {
  const levelIgnore = activationLevel(ctx.activationStart, event.from);
  const levelConsidere = levelAfterBoundEvents(event.from, event, ctx, bound);
  if (event.arrow.reverseDefine === true)
    return liveOffsetSelfReverse(endpoints, event, ctx, levelIgnore, levelConsidere);

  let base = endpoints.fromX + LIVE_DELTA_SIZE * levelIgnore;
  if (levelIgnore < levelConsidere) base += LIVE_DELTA_SIZE * (levelConsidere - levelIgnore);

  const deltaX1 = (levelIgnore - levelConsidere) * LIVE_DELTA_SIZE;
  return {
    ...endpoints,
    fromX: base + (deltaX1 < 0 ? deltaX1 : 0),
    toX: base + SELF_ARROW_X_RIGHT,
    selfReturnX: base + (deltaX1 > 0 ? -deltaX1 : 1),
    selfOriginX: base,
  };
}

/**
 * `ComponentRoseSelfArrow#drawLeftSide:177-190`'s `x1`/`x2` before any
 * decoration touches them: how far in from the component's right edge
 * (`prefTextWidth`) the upper and lower segments end.
 *
 * ```java
 * double x1 = 0, x2 = 1;  extraLiveDeltaIndent = level * deltaSize;
 * if (dx < 0)      { x2 += (level > 0 ? -extraLiveDeltaIndent : deltaSize); }
 * else if (dx > 0) { x1 += (level > 1) ? deltaSize - extra : 0;
 *                    x2 += (level == 1 ? -deltaSize : 0); }
 * else if (level > 1) { x1 -= extra - deltaSize;  x2 -= extra - deltaSize; }
 * ```
 * `dx` is `area.getDeltaX1()`, `level` `area.getLevel()` and `deltaSize`
 * `area.getLiveDeltaSize()` (`CommunicationTileSelf.java:150-156`).
 */
export function leftSideInsets(levelIgnore: number, levelConsidere: number): { x1: number; x2: number } {
  const dx = (levelIgnore - levelConsidere) * LIVE_DELTA_SIZE;
  const extra = levelIgnore * LIVE_DELTA_SIZE;
  let x1 = 0;
  let x2 = 1;
  if (dx < 0) {
    x2 += levelIgnore > 0 ? -extra : LIVE_DELTA_SIZE;
  } else if (dx > 0) {
    x1 += levelIgnore > 1 ? LIVE_DELTA_SIZE - extra : 0;
    x2 += levelIgnore === 1 ? -LIVE_DELTA_SIZE : 0;
  } else if (levelIgnore > 1) {
    x1 -= extra - LIVE_DELTA_SIZE;
    x2 -= extra - LIVE_DELTA_SIZE;
  }
  return { x1, x2 };
}

/**
 * `CommunicationTileSelf#drawU` for `isReverseDefine()`: no `x1` shift; the
 * origin is `getMinX()` (`:263-270`), `posC - getCompWidth() - (levelIgnore >
 * 0 ? LIVE_DELTA_SIZE : 0)`, and the component draws its loop against its
 * RIGHT edge, `origin + prefTextWidth = posC - liveDeltaWidthAdjustment`
 * (`ComponentRoseSelfArrow#drawLeftSide:195-200` translates by
 * `prefTextWidth - xRight`, `prefTextWidth - x1`, `prefTextWidth - x2`).
 *
 * The geo carries the loop in the three absolute numbers the right-hand side
 * already uses, re-read for the mirror image (the renderer inverts them,
 * `renderer-message-self.ts`): `toX` is the vertical stroke (`origin +
 * prefTextWidth - xRight`), `fromX` the upper anchor `edge - x1` and
 * `selfReturnX` the lower anchor `edge - x2`, `edge` being the component's
 * right edge. The label stays at `origin + getOldPaddingX1()`.
 */
function liveOffsetSelfReverse(
  endpoints: MessageEndpoints,
  event: MessageEvent,
  ctx: EventProcessingContext,
  levelIgnore: number,
  levelConsidere: number,
): MessageEndpoints {
  const adjust = levelIgnore > 0 ? LIVE_DELTA_SIZE : 0;
  const edge = endpoints.fromX - adjust;
  const { x1, x2 } = leftSideInsets(levelIgnore, levelConsidere);
  return {
    ...endpoints,
    fromX: edge - x1,
    toX: edge - SELF_ARROW_X_RIGHT,
    selfReturnX: edge - x2,
    selfOriginX: edge - selfCompWidth(event, ctx),
    selfLevel: levelIgnore,
  };
}
