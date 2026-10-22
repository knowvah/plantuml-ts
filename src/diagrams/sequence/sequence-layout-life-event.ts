/**
 * Sequence diagram layout — the `activate` / `deactivate` / `destroy` life
 * events (`teoz/LifeEventTile.java`), and the destroy cross
 * (`skin/rose/ComponentRoseDestroy.java`) each destroy leaves.
 *
 * Split out of `sequence-layout-events.ts` (500-line file cap, sdd1 T2f);
 * that module dispatches here.
 *
 * ## Who draws a destroy cross, and where
 *
 * Upstream has two independent drawers, and which one fires depends on
 * whether `SequenceDiagram#activate` bound the destroy to the last message
 * (`SequenceDiagram.java:367-404`):
 *
 * - **Unbound** (`LifeEventTile#isDestroyWithoutMessage`, `:124-126`): the
 *   tile reserves the cross's height and draws it itself in the foreground
 *   pass, its top at the tile's y, centred on the lifeline (`:112-122`).
 * - **Bound to a `Message`**: `LiveBoxes#getStairs` flags that message's
 *   step (`isNextEventADestroy`, `LiveBoxes.java:212-234`, which accepts only
 *   a `Message`, so a destroy bound to an exo message draws NO cross), and
 *   the lifeline pass draws the cross centred on that step, at indent 0 after
 *   every bar (`drawDestroys`, `:390-396`), above 0 once per level closing
 *   there, right after that level's bar (`drawOneLevel`, `:409-417`) — and
 *   NOWHERE when the step's indent closes no level, e.g. `A -> B ++` then
 *   `destroy B` (jar-probed). {@link messageDestroyCrosses} resolves this at
 *   the message, where its bound life events are known.
 *
 * Either way the tile's own y is where the lifeline stops (`goDestroy`,
 * `LifeEventTile.java:65-72`; `sequence-layout-lifeline.ts`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LifeEventTile.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java
 */

import type { ActivationEvent, DestroyCross, DestroyGeo, EventGeo, MessageEvent, ParticipantGeo } from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import {
  ACTIVATION_HALF_WIDTH,
  activationLevel,
  popActivation,
  pushActivation,
  recordLifeStep,
  type ArrowEnds,
} from './sequence-layout-activation.js';
import type { EventCursor, EventProcessingContext } from './sequence-layout-events.js';
import { componentStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';

/** `ComponentRoseDestroy.crossSize` (`:57`); the component is `crossSize * 2`
 *  on both axes (`:68-70,72-74`), and `LifeEventTile:132-136` reserves that
 *  height for a destroy with no message. */
export const DESTROY_CROSS_SIZE = 9;

/**
 * A `LifeEventTile` for an `activate`: its step at the tile's top
 * (`LifeEventTile.java:65-69`) -- the bar's ends are `LiveBoxes`', which
 * binds the event to the last message (`SequenceDiagram.java:367-404`) -- and
 * the walk's level one up.
 */
export function handleActivateEvent(event: ActivationEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  recordLifeStep(ctx, event, cursor.y);
  pushActivation(ctx.activationStart, event.participantId);
}

/** A `LifeEventTile` for a `deactivate` or `destroy`: its step, the level one
 *  down (`LifeEvent#isDeactivateOrDestroy`), and a destroy's lifeline stop
 *  and cross (`:70-71`). */
export function handleDeactivateEvent(event: ActivationEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  recordLifeStep(ctx, event, cursor.y);
  popActivation(ctx.activationStart, event.participantId);
  if (event.destroy === true) handleDestroy(event.participantId, cursor, ctx);
}

/**
 * `LifeEventTile#isDestroyWithoutMessage:124-126` — `lifeEvent.getMessage() ==
 * null && lifeEvent.getType() == DESTROY`.
 *
 * `getMessage()` is set only when `SequenceDiagram#activate` reaches its
 * `setMessage` line (`:396-398`), which two earlier guards can skip: a
 * `lastEventWithDeactivate` that does not `dealWith(p)` returns at `:387`, and
 * one that is not an `AbstractMessage` — a group `end`, per `:438` — falls
 * past the `instanceof` test. Both leave the message null, so both make the
 * destroy standalone. `X -> X` followed by `destroy Y` is upstream's own
 * worked example, in the comment above `:387`.
 */
function isDestroyWithoutMessage(participantId: string, ctx: EventProcessingContext): boolean {
  return ctx.lastMessageParticipants?.includes(participantId) !== true;
}

/** `ComponentType.DESTROY`'s style, merged from the builder current at tile
 *  time with no stereotype (`LiveBoxesDrawer.java:78-81`,
 *  `LifeEventTile.java:103-110`); `ComponentRoseDestroy` reads `getStroke()`
 *  and `getColorLine()` (`:54,61`). */
export function destroyPaint(builder: StyleBuilder): SequencePaint {
  return paintOf(componentStyle(builder, 'DESTROY'), HColorSet.instance());
}

/**
 * The `LifeEventTile` of a destroy: its y stops the lifeline; an unbound one
 * reserves and draws its own cross, a bound one takes the crosses its
 * message's step resolved ({@link messageDestroyCrosses}).
 *
 * A `destroy p` line and an arrow's `!!` reach here alike: both are
 * `diagram.activate(p, DESTROY)`, which adds the same `LifeEvent` to the
 * event list (`SequenceDiagram.java:369-371`; `CommandArrow.java:453-455`).
 */
export function handleDestroy(participantId: string, cursor: EventCursor, ctx: EventProcessingContext): void {
  const participant = ctx.participantMap.get(participantId);
  if (participant === undefined) return;
  const unbound = isDestroyWithoutMessage(participantId, ctx);
  const tileCross: DestroyCross = {
    x: participant.centerX - DESTROY_CROSS_SIZE,
    y: cursor.y,
    drawnBy: 'tile',
    level: 0,
  };
  const step = ctx.lastMessageCrosses?.of === ctx.lastMessageParticipants ? ctx.lastMessageCrosses?.crosses : undefined;
  const crosses = unbound ? [tileCross] : (step?.get(participantId) ?? []);
  // A second destroy bound to the same message finds the step's crosses
  // already taken: the step is drawn once.
  step?.delete(participantId);
  const geo: DestroyGeo = {
    kind: 'destroy',
    participantId,
    y: cursor.y,
    crosses,
    paint: destroyPaint(ctx.endStyleBuilder),
  };
  ctx.eventGeos.push(geo);
  if (unbound) cursor.y += DESTROY_CROSS_SIZE * 2;
}

/** One participant's life events bound to a message, in upstream's order:
 *  the arrow's own `++`/`--`/`!!` (`CommandArrow#manageActivations`, run as
 *  the arrow command executes) then the life events written after it. A
 *  destroy counts down like a deactivate (`LifeEvent#isDeactivateOrDestroy`,
 *  `LifeEvent.java:82-84`, read at `LiveBoxes.java:171`). */
function lifeEventsOf(event: MessageEvent, bound: readonly ActivationEvent[], p: string): ('up' | 'down')[] {
  const own: ('up' | 'down')[] = [];
  if (event.activates === p) own.push('up');
  if (event.deactivates === p) own.push('down');
  if (event.destroys === p) own.push('down');
  const after = bound.filter((b) => b.participantId === p).map((b) => (b.kind === 'activate' ? 'up' : 'down'));
  return [...own, ...after];
}

/**
 * `LiveBoxes#getLevelAtInternal(message, CONSIDER_FUTURE_DEACTIVATE)`
 * (`:143-210`): the level before the message, walked forward through its
 * bound life events — an activate after a deactivate (or the reverse) stops
 * the walk BEFORE it counts.
 */
export function stepIndent(levelBefore: number, events: readonly ('up' | 'down')[]): number {
  let level = levelBefore;
  let seenUp = false;
  let seenDown = false;
  for (const e of events) {
    if (e === 'up') {
      seenUp = true;
      if (seenDown) break;
      level++;
    } else {
      seenDown = true;
      if (seenUp) break;
      level = Math.max(0, level - 1);
    }
  }
  return level;
}

/**
 * The y of a message's step: `CommunicationTile` registers its arrow y
 * (`CommunicationTile.java:197-198`); a self message its end point when it
 * activates, its start when it deactivates, else its end
 * (`CommunicationTileSelf.java:120-125`).
 */
function stepY(arrow: ArrowEnds, events: readonly ('up' | 'down')[], deactivates: boolean): number {
  if (!arrow.self) return arrow.start;
  if (events.includes('up')) return arrow.end;
  return deactivates ? arrow.start : arrow.end;
}

/** The crosses one participant's flagged step yields (module head):
 *  `drawDestroyIfNeeded` centres the cross on the step's y, on a `ug`
 *  `drawOneLevel(L)` moved right by `(L - 1) * width / 2` (`:400`), or not
 *  moved at all by `drawDestroys`. */
function stepCrosses(centerX: number, y: number, levelBefore: number, indent: number): DestroyCross[] {
  const at = (level: number): DestroyCross => ({
    x: centerX + Math.max(0, level - 1) * ACTIVATION_HALF_WIDTH - DESTROY_CROSS_SIZE,
    y: y - DESTROY_CROSS_SIZE,
    drawnBy: 'liveboxes',
    level,
  });
  if (indent === 0) return [at(0)];
  // `drawOneLevel(L)` closes every open level above the step's indent.
  const closing: DestroyCross[] = [];
  for (let level = indent + 1; level <= levelBefore; level++) closing.push(at(level));
  return closing;
}

/**
 * The destroy crosses `LiveBoxes` will draw at this message's step, by
 * participant — only for participants a bound life event destroys
 * (`isNextEventADestroy`, `LiveBoxes.java:212-234`). Called before the
 * arrow's own `++`/`--` touch the activation stack, so the stack's depth is
 * the level before the message.
 */
export function messageDestroyCrosses(
  event: MessageEvent,
  arrow: ArrowEnds,
  bound: readonly ActivationEvent[],
  ctx: EventProcessingContext,
): Map<string, DestroyCross[]> {
  const crosses = new Map<string, DestroyCross[]>();
  for (const p of new Set([event.from, event.to])) {
    const centerX = ctx.participantMap.get(p)?.centerX;
    const destroyed = event.destroys === p || bound.some((b) => b.destroy === true && b.participantId === p);
    if (centerX === undefined || !destroyed) continue;
    const events = lifeEventsOf(event, bound, p);
    const deactivates =
      event.deactivates !== undefined || bound.some((b) => b.kind === 'deactivate' && b.destroy !== true);
    const levelBefore = activationLevel(ctx.activationStart, p);
    const y = stepY(arrow, events, deactivates);
    crosses.set(p, stepCrosses(centerX, y, levelBefore, stepIndent(levelBefore, events)));
  }
  return crosses;
}

/**
 * `getStairs` builds every step at `Math.max(createY, position)`
 * (`LiveBoxes.java:330`), `createY` being the participant's FIRST create
 * (`LivingSpace#getFirstCreateY`, `:170-176`), which a later `create` only
 * fixes once the walk has passed it -- so a `liveboxes` cross is clamped
 * here, after the walk. Jar-probed: `A -> B`, `destroy B`, `A -> A`,
 * `create B`, `A -> B` centres B's cross on the create's y, not the arrow's.
 */
export function clampDestroySteps(events: EventGeo[], participants: readonly ParticipantGeo[]): EventGeo[] {
  const createYs = new Map(participants.map((p) => [p.id, p.createY]));
  return events.map((e) => {
    const createY = e.kind === 'destroy' ? createYs.get(e.participantId) : undefined;
    if (e.kind !== 'destroy' || createY === undefined) return e;
    const clamp = (c: DestroyCross): DestroyCross =>
      c.drawnBy === 'liveboxes' ? { ...c, y: Math.max(createY - DESTROY_CROSS_SIZE, c.y) } : c;
    return { ...e, crosses: e.crosses.map(clamp) };
  });
}
