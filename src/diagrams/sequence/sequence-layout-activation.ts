/**
 * Sequence diagram layout — activation (livebox) bars: each participant's
 * `LiveBoxes` (`sequence-live-boxes.ts`), the steps the event walk records
 * into them as its tiles land, and the {@link ActivationGeo} every bar
 * `LiveBoxes#drawBoxes` draws becomes, painted from its merged
 * `activationBox` style.
 *
 * Upstream builds a participant's bars AFTER every gauge is resolved: each
 * tile's `onGaugeResolved` records its event's y (`LivingSpace
 * #addStepForLivebox`, `LivingSpace.java:94-96`), and the lifeline pass turns
 * those steps into `Stairs` (`LiveBoxes#getStairs`) and draws a bar per run
 * of steps at one indent (`drawOneLevel`). This module mirrors that order:
 * the walk records steps, {@link flushOpenActivations} draws.
 *
 * ## Which builder paints a bar
 *
 * A bar is painted from the builder of the step that OPENS it
 * (`LiveBoxes.java:405-407`, `LiveBoxesDrawer.java:99-103,137-140`): a
 * message's when the message's own lookahead level opens it (a `++`, or an
 * `activate` bound to it), a standalone `activate`'s otherwise.
 *
 * Split out of `sequence-layout-events.ts` (500-line file cap, sdd1 T2b);
 * that module re-exports every name here.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxes.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/teoz/LiveBoxesDrawer.java
 */

import type {
  AbstractMessageEvent,
  ActivationEvent,
  ActivationGeo,
  EventGeo,
  MessageEvent,
  Participant,
  ParticipantGeo,
  SequenceEvent,
} from './ast.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import type { Stereotype } from '../../core/stereo/Stereotype.js';
import { componentStyle, paintOf, type SequencePaint } from './sequence-skin-param.js';
import { participantStereotype } from './sequence-participant-paints.js';
import {
  ACTIVATION_HALF_WIDTH,
  LiveBoxes,
  flattenLiveEvents,
  type LiveBox,
  type LiveEvent,
  type LiveEvents,
  type LiveLifeEvent,
  type LiveMessage,
} from './sequence-live-boxes.js';
import type { MessageTileGauge } from './sequence-y-gauge.js';

export { ACTIVATION_HALF_WIDTH };

/** A message's own life events waiting for their `LifeEventTile`'s y. */
interface PendingOwn {
  readonly events: readonly LiveLifeEvent[];
  /** Flat index of the last of them. */
  readonly last: number;
  /** The message tile's max: their tiles' top when no note widens it. */
  readonly tileMax: number;
  readonly geoIndex: number;
}

/**
 * The walk's side of every `LiveBoxes`: the flat list they share, and where
 * each recorded step sits in `eventGeos` -- the slot the bar it closes is
 * emitted at, so a closing bar still precedes the destroy cross drawn after
 * it (`renderer-lifeline.ts#renderLiveboxes`). Single-threaded, one walk.
 */
interface LiveWalk {
  readonly list: LiveEvents;
  readonly flatIndex: ReadonlyMap<LiveEvent, number>;
  readonly boxes: ReadonlyMap<string, LiveBoxes>;
  readonly geoIndex: Map<LiveEvent, number>;
  /** The exo messages in list order, recorded from their published gauge
   *  (`CommunicationExoTile.java:197-203`) before any later step. */
  readonly exos: readonly LiveMessage[];
  exoNext: number;
  pendingOwn: PendingOwn | undefined;
  gauges: ReadonlyMap<AbstractMessageEvent, MessageTileGauge> | undefined;
}

/**
 * The walk's activation state.
 *
 * `levels` is each participant's level as the walk passes its events --
 * `LiveBoxes#getLevelAt`'s prefix count (`level++` on an activate,
 * `Math.max(0, level - 1)` on a deactivate or destroy, `:115-125`), which
 * every x offset reads before a message's own life events apply.
 */
export interface ActivationStack {
  readonly levels: Map<string, number>;
  /** Each participant's stereotype, merged into every one of its bars
   *  (`LiveBoxes.java:391,399` hand `p.getStereotype()` to the drawer). */
  readonly stereotypes: ReadonlyMap<string, Stereotype>;
  readonly live: LiveWalk;
}

/** The stack for `participants` over the diagram's top-level `events`
 *  (`LivingSpace.java:148`: one `LiveBoxes` per participant, all on
 *  `SequenceDiagram#events`). */
export function newActivationStack(
  participants: readonly Participant[],
  events: readonly SequenceEvent[] = [],
): ActivationStack {
  const stereotypes = new Map<string, Stereotype>();
  for (const p of participants) {
    // `participant.getStereotype()`: the decorated build (`CommandParticipant.java:176-181`).
    const stereotype = participantStereotype(p);
    if (stereotype !== undefined) stereotypes.set(p.id, stereotype);
  }
  const list = flattenLiveEvents(events);
  const live: LiveWalk = {
    list,
    flatIndex: new Map(list.events.map((e, i) => [e, i])),
    boxes: new Map(participants.map((p) => [p.id, new LiveBoxes(p.id, list.events)])),
    geoIndex: new Map(),
    exos: list.events.filter((e): e is LiveMessage => e.kind === 'message' && e.exo),
    exoNext: 0,
    pendingOwn: undefined,
    gauges: undefined,
  };
  return { levels: new Map(), stereotypes, live };
}

/** How deep `participantId` is at this point of the walk; 0 when nothing
 *  is open. */
export function activationLevel(activationStart: ActivationStack, participantId: string): number {
  return activationStart.levels.get(participantId) ?? 0;
}

/** An activate: `level++` (`LiveBoxes.java:120-121`). */
export function pushActivation(activationStart: ActivationStack, participantId: string): void {
  activationStart.levels.set(participantId, activationLevel(activationStart, participantId) + 1);
}

/** A deactivate or destroy: `Math.max(0, level - 1)` (`LiveBoxes.java:123-124`)
 *  -- one at level 0 leaves it there. */
export function popActivation(activationStart: ActivationStack, participantId: string): void {
  activationStart.levels.set(participantId, Math.max(0, activationLevel(activationStart, participantId) - 1));
}

/** The innermost open level, or `undefined` at level 0. */
export function openActivation(activationStart: ActivationStack, participantId: string): number | undefined {
  const level = activationLevel(activationStart, participantId);
  return level > 0 ? level : undefined;
}

/** {@link popActivation}, under the name `sequence-layout-events.ts`
 *  re-exports; bars are emitted by {@link flushOpenActivations} alone. */
export const emitActivation = popActivation;

/** What a step recorder reads from the walk's context. */
export interface StepContext {
  readonly activationStart: ActivationStack;
  readonly eventGeos: readonly EventGeo[];
  readonly messageTileGauges?: ReadonlyMap<AbstractMessageEvent, MessageTileGauge>;
}

/** A message arrow's two ends on the y axis (`getStartPoint`/`getEndPoint`). */
export interface ArrowEnds {
  readonly start: number;
  readonly end: number;
  readonly self: boolean;
}

/**
 * A message tile's `onGaugeResolved`: a `CommunicationTile` steps both
 * participants at its arrow y (`CommunicationTile.java:197-198`); a
 * `CommunicationTileSelf` steps its one only when the message activates (end
 * point), else deactivates (start point), else destroys (end point)
 * (`CommunicationTileSelf.java:113-126`). The message's own `++`/`--`/`!!`
 * life events wait for their own tiles' y (`LifeEventTile.java:65-69`).
 */
export function recordMessageStep(ctx: StepContext, event: MessageEvent, arrow: ArrowEnds, tileMax: number): void {
  const walk = ctx.activationStart.live;
  const message = walk.list.ofSource.get(event);
  if (message?.kind !== 'message') return;
  settle(ctx, walk.flatIndex.get(message), undefined);
  const y = arrow.self ? selfStepY(message, arrow) : arrow.start;
  if (y !== undefined) for (const p of message.participants) walk.boxes.get(p)?.addStep(message, y);
  walk.geoIndex.set(message, ctx.eventGeos.length);
  const own = walk.list.ownOf.get(event) ?? [];
  const last = own[own.length - 1];
  if (last !== undefined)
    walk.pendingOwn = { events: own, last: walk.flatIndex.get(last)!, tileMax, geoIndex: ctx.eventGeos.length };
}

function selfStepY(message: LiveMessage, arrow: ArrowEnds): number | undefined {
  if (message.lifeEventsType.has('ACTIVATE')) return arrow.end;
  if (message.lifeEventsType.has('DEACTIVATE')) return arrow.start;
  if (message.lifeEventsType.has('DESTROY')) return arrow.end;
  return undefined;
}

/** A `LifeEventTile`'s `onGaugeResolved` (`LifeEventTile.java:65-69`): the
 *  step at the tile's top, which is where the walk stands. */
export function recordLifeStep(ctx: StepContext, event: ActivationEvent, y: number): void {
  const walk = ctx.activationStart.live;
  const life = walk.list.ofSource.get(event);
  if (life?.kind !== 'life') return;
  settle(ctx, walk.flatIndex.get(life), y);
  walk.boxes.get(life.participant)?.addStep(life, y);
  walk.geoIndex.set(life, ctx.eventGeos.length);
}

/**
 * Record every step upstream resolves before list index `at` (all of them
 * when `undefined`, at the flush): the previous message's own life events,
 * then the exo messages laid out since.
 *
 * Own life events' tiles sit right under their message's tile and its note
 * wrappers. When the event at `at` is a life event the walk lays out flush
 * below them, `lifeY`, its top, is theirs; otherwise their y is the message
 * tile's max -- exact without notes, and with them still below every later
 * step, so it can neither cause nor miss a `+5` (`LiveBoxes.java:81-82`).
 */
function settle(ctx: StepContext, at: number | undefined, lifeY: number | undefined): void {
  const walk = ctx.activationStart.live;
  walk.gauges = ctx.messageTileGauges ?? walk.gauges;
  const pending = walk.pendingOwn;
  if (pending !== undefined)
    recordOwn(walk, pending, lifeY !== undefined && at === pending.last + 1 ? lifeY : pending.tileMax);
  catchUpExos(walk, ctx.eventGeos.length, at);
}

function recordOwn(walk: LiveWalk, pending: PendingOwn, y: number): void {
  for (const own of pending.events) {
    walk.boxes.get(own.participant)?.addStep(own, y);
    walk.geoIndex.set(own, pending.geoIndex);
  }
  walk.pendingOwn = undefined;
}

/** The exo messages before list index `upTo` (all of them when undefined). */
function catchUpExos(walk: LiveWalk, geoIndex: number, upTo: number | undefined): void {
  for (; walk.exoNext < walk.exos.length; walk.exoNext++) {
    const exo = walk.exos[walk.exoNext]!;
    if (upTo !== undefined && walk.flatIndex.get(exo)! >= upTo) return;
    const gauge = walk.gauges?.get(exo.source);
    if (gauge === undefined) continue;
    walk.boxes.get(exo.participants[0]!)?.addStep(exo, gauge.contactY);
    walk.geoIndex.set(exo, geoIndex);
  }
}

/**
 * `LivingSpace#drawLineAndLiveboxes`' `liveboxes.drawBoxes(ug, context,
 * getFirstCreateY(), height)` (`LivingSpace.java:150-176`) for every
 * participant, once the walk is done: the steps still waiting are recorded,
 * each participant's bars drawn from its stairs between its first create and
 * `endY`, and each bar emitted into `eventGeos` at the slot of the step that
 * closes it -- after the end, for one the closing `totalHeight` step closes.
 *
 * Nothing is "left open" upstream: a level that never returns to 0 is closed
 * by that last step (`LiveBoxes.java:335,409`), which is why a bar with no
 * deactivate runs to the end of the lifeline (`micaki-01-rexa741`).
 */
export function flushOpenActivations(
  activationStart: ActivationStack,
  endY: number,
  participantMap: Map<string, ParticipantGeo>,
  eventGeos: EventGeo[],
): void {
  settle({ activationStart, eventGeos }, undefined, undefined);
  const inserts: Insert[] = [];
  for (const [participantId, boxes] of activationStart.live.boxes) {
    const participant = participantMap.get(participantId);
    if (participant === undefined) continue;
    // `getFirstCreateY` (`:170-176`): 0 when the participant was never created.
    for (const box of boxes.drawBoxes(participant.createY ?? 0, endY))
      inserts.push(insertOf(activationStart, participant, box, eventGeos.length));
  }
  mergeAt(eventGeos, inserts);
}

/** A bar and the `eventGeos` slot it is emitted at. */
interface Insert {
  readonly at: number;
  readonly geo: ActivationGeo;
}

function insertOf(activationStart: ActivationStack, participant: ParticipantGeo, box: LiveBox, end: number): Insert {
  const at = box.closing === undefined ? undefined : activationStart.live.geoIndex.get(box.closing);
  return { at: at ?? end, geo: activationGeo(participant, box, activationStart) };
}

/** Each insert placed before the geo at its slot, in place; a stable sort
 *  keeps one participant's bars in level, then step, order. */
function mergeAt(eventGeos: EventGeo[], inserts: Insert[]): void {
  inserts.sort((a, b) => a.at - b.at);
  const merged: EventGeo[] = [];
  let next = 0;
  for (let i = 0; i <= eventGeos.length; i++) {
    for (; next < inserts.length && inserts[next]!.at === i; next++) merged.push(inserts[next]!.geo);
    if (i < eventGeos.length) merged.push(eventGeos[i]!);
  }
  eventGeos.splice(0, eventGeos.length, ...merged);
}

function activationGeo(participant: ParticipantGeo, box: LiveBox, activationStart: ActivationStack): ActivationGeo {
  return {
    kind: 'activation',
    participantId: participant.id,
    lifelineX: participant.centerX,
    y: box.y1,
    height: box.y2 - box.y1,
    level: box.level,
    ...(box.color !== undefined ? { color: box.color } : {}),
    paint: activationPaint(box, activationStart.stereotypes.get(participant.id)),
  };
}

/**
 * A bar's paint: `LiveBoxesDrawer#drawInternal` merges
 * `ACTIVATION_BOX_*`'s signature (`root, element, sequenceDiagram,
 * activationBox`, `ComponentType.java:82-84`) with the participant's
 * stereotype (`withTOBECHANGED(stereotype)`, `LiveBoxesDrawer.java:140`)
 * from the opening step's builder, and lets the step's colour override its
 * `BackGroundColor` (`style.eventuallyOverride(symbolContext)`,
 * `LiveBoxesDrawer.java:140-146`; `Style.java:214-223`). The colour is the
 * activating event's `getSpecificColors()` (`LiveBoxes.java:236-260`).
 *
 * A bar always opens at an event's step -- the builder-less `totalHeight`
 * step is the last and can open nothing `drawOneLevel` then closes.
 */
function activationPaint(box: LiveBox, stereotype: Stereotype | undefined): SequencePaint {
  if (box.styleBuilder === undefined) throw new Error('activation bar opened at the closing totalHeight step');
  const set = HColorSet.instance();
  const back = box.color === undefined ? undefined : set.getColorOrNull(box.color);
  return paintOf(
    componentStyle(box.styleBuilder, 'ACTIVATION_BOX', stereotype).eventuallyOverride('BackGroundColor', back),
    set,
  );
}
