/**
 * The diagram's event list as `SequenceDiagram#events` holds it, rebuilt from
 * this port's AST for `sequence-live-boxes.ts` -- every event `LiveBoxes`
 * walks, in source order, each life event bound the way
 * `SequenceDiagram#activate` binds it.
 *
 * Split out of `sequence-live-boxes.ts` (500-line file cap, sdd2 T2b).
 *
 * Where the AST and upstream's list differ:
 * - a message's `++`/`--`/`!!` are LIFE EVENTS right after it upstream
 *   (`CommandArrow#manageActivations`, `:444-466`), fields here;
 * - a note on a message is attached to it (`AbstractMessage#addNote`), never
 *   an event, so only a standalone note is one;
 * - `/ note` merges into the standalone note before it, making a `Notes`
 *   (`SequenceDiagram#addNote`, `:226-241`) -- which is NOT a `Note`, so
 *   `LiveBoxes` treats it like any other event;
 * - a group is a `GroupingStart`, its branches' events, one `else`
 *   `GroupingLeaf` per later branch and the `end` leaf
 *   (`SequenceDiagram#grouping`, `:420-446`).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/SequenceDiagram.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/AbstractMessage.java
 */

import type { ActivationEvent, MessageEvent, MessageExoEvent, NoteEvent, SequenceEvent } from './ast.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';

/** `LifeEventType` -- `CREATE` is left out: it binds no level and records a
 *  step no bar can start at (see {@link flattenLiveEvents}). */
export type LifeEventType = 'ACTIVATE' | 'DEACTIVATE' | 'DESTROY';

/** An `AbstractMessage`: a `Message` or a `MessageExo`. */
export interface LiveMessage {
  readonly kind: 'message';
  readonly source: MessageEvent | MessageExoEvent;
  /** What `dealWith` accepts: `p1`/`p2` (`Message.java:73-75`), the exo's
   *  one participant (`MessageExo.java:90-92`). */
  readonly participants: readonly string[];
  /** `Message#isSelfMessage`; an exo never is (`MessageExo.java:99-101`). */
  readonly self: boolean;
  readonly exo: boolean;
  /** `setParallelBrother(getLastAbstractMessage())` for a `&` message
   *  (`SequenceDiagram.java:200-202,217-223`). */
  readonly parallelBrother: LiveMessage | undefined;
  readonly styleBuilder: StyleBuilder;
  /** `lifeEventsType` (`AbstractMessage.java:82,147-160`): what the life
   *  events bound to it do -- for a self message, only its own participant's. */
  readonly lifeEventsType: Set<LifeEventType>;
}

/** A `LifeEvent` (`LifeEvent.java`). */
export interface LiveLifeEvent {
  readonly kind: 'life';
  readonly type: LifeEventType;
  readonly participant: string;
  /** The `Fashion` back colour (`LIFECOLOR` on `++`, `#color` on `activate`). */
  readonly color: string | undefined;
  /** `getSkinParam().getCurrentStyleBuilder()` at the command
   *  (`SequenceDiagram.java:371-372`). */
  readonly styleBuilder: StyleBuilder;
  /** `getMessage()`: the message `activate` bound it to (`:401-404`). */
  readonly message: LiveMessage | undefined;
}

export interface LiveNote {
  readonly kind: 'note';
}

/** Every other event: a group start, `else` or `end`, a divider, delay,
 *  space, newpage, reference -- and a vmerged `Notes`. */
export interface LiveOther {
  readonly kind: 'other';
  /** A `Notes` (several vmerged notes), which a later `/ note` joins. */
  readonly notes?: true;
}

export type LiveEvent = LiveMessage | LiveLifeEvent | LiveNote | LiveOther;

/** The flat list, and how to find an AST event's place in it. */
export interface LiveEvents {
  readonly events: readonly LiveEvent[];
  /** A message, exo message or `activate`/`deactivate` AST event's own entry. */
  readonly ofSource: ReadonlyMap<SequenceEvent, LiveEvent>;
  /** The life events a message's own `--`/`++`/`!!` wrote, in list order. */
  readonly ownOf: ReadonlyMap<MessageEvent, readonly LiveLifeEvent[]>;
}

/** `AbstractMessage#isParallelWith` (`:118-122`): the same message, or one
 *  this one is chained to by `&` brothers. */
export function isParallelWith(message: LiveMessage, other: LiveMessage): boolean {
  for (let m: LiveMessage | undefined = message; m !== undefined; m = m.parallelBrother) if (m === other) return true;
  return false;
}

/** `SequenceDiagram`'s parse-time state the list is built under. */
interface Builder {
  readonly events: LiveEvent[];
  readonly ofSource: Map<SequenceEvent, LiveEvent>;
  readonly ownOf: Map<MessageEvent, LiveLifeEvent[]>;
  /** `lastEventWithDeactivate` (`:145`): a message, or `'leaf'` for the
   *  divider / group `end` that closes the last one off (`:275,443`). */
  lastEventWithDeactivate: LiveMessage | 'leaf' | undefined;
  /** `getLastAbstractMessage()` (`:217-223`). */
  lastAbstractMessage: LiveMessage | undefined;
}

/**
 * Upstream's event list for `events`. `CREATE` is dropped: `LiveBoxes` counts
 * neither its level (`isActivate`/`isDeactivateOrDestroy` are both false) nor
 * finds it bound to a message parallel with the one before it, so its step
 * never extends or starts a bar.
 */
export function flattenLiveEvents(events: readonly SequenceEvent[]): LiveEvents {
  const b: Builder = {
    events: [],
    ofSource: new Map(),
    ownOf: new Map(),
    lastEventWithDeactivate: undefined,
    lastAbstractMessage: undefined,
  };
  addAll(b, events);
  return { events: b.events, ofSource: b.ofSource, ownOf: b.ownOf };
}

function addAll(b: Builder, events: readonly SequenceEvent[]): void {
  for (const event of events) add(b, event);
}

function add(b: Builder, event: SequenceEvent): void {
  switch (event.kind) {
    case 'message':
    case 'messageExo':
      return addMessage(b, event);
    case 'activate':
    case 'deactivate':
      return addLife(b, event);
    case 'note':
      return addNote(b, event);
    case 'frame':
      return addFrame(b, event.frameType === 'ref' ? [] : event.branches);
    case 'divider':
      b.events.push(other());
      b.lastEventWithDeactivate = 'leaf';
      return;
    default:
      b.events.push(other());
  }
}

/** A fresh event: each one is its own key in `LiveBoxes`' maps. */
function other(): LiveOther {
  return { kind: 'other' };
}

/** `addMessage` (`:199-215`), then the message's own life events in
 *  `manageActivations`' order (`spec.charAt(0)`, then `charAt(2)`). The two
 *  fields cannot tell `--++` from `++--`; `--++`, the corpus's form, is taken
 *  -- as `sequence-layout-message-self.ts` does. */
function addMessage(b: Builder, event: MessageEvent | MessageExoEvent): void {
  const exo = event.kind === 'messageExo';
  const participants = exo ? [event.participant] : [event.from, event.to];
  const message: LiveMessage = {
    kind: 'message',
    source: event,
    participants,
    self: !exo && event.from === event.to,
    exo,
    parallelBrother: event.parallel === true ? b.lastAbstractMessage : undefined,
    styleBuilder: event.styleBuilder,
    lifeEventsType: new Set(),
  };
  b.events.push(message);
  b.ofSource.set(event, message);
  b.lastEventWithDeactivate = message;
  b.lastAbstractMessage = message;
  if (!exo) b.ownOf.set(event, ownLifeEvents(b, event));
}

function ownLifeEvents(b: Builder, event: MessageEvent): LiveLifeEvent[] {
  const own: [LifeEventType, string | undefined, string | undefined][] = [
    ['DEACTIVATE', event.deactivates, undefined],
    // `activationColor` rides on the activate leg only (`CommandArrow.java:445-450`).
    ['ACTIVATE', event.activates, event.lifeColor],
    ['DESTROY', event.destroys, undefined],
  ];
  return own.flatMap(([type, participant, color]) =>
    participant === undefined ? [] : [activate(b, type, participant, color, event.styleBuilder)],
  );
}

function addLife(b: Builder, event: ActivationEvent): void {
  const type: LifeEventType =
    event.kind === 'activate' ? 'ACTIVATE' : event.destroy === true ? 'DESTROY' : 'DEACTIVATE';
  b.ofSource.set(event, activate(b, type, event.participantId, event.color, event.styleBuilder));
}

/** `SequenceDiagram#activate` (`:367-404`): the life event joins the list and
 *  binds to `lastEventWithDeactivate` when that is a message dealing with
 *  its participant. A self message records only its own participant's type
 *  (`AbstractMessage#addLifeEvent`, `:150-153`), which `dealWith` already
 *  guarantees. */
function activate(
  b: Builder,
  type: LifeEventType,
  participant: string,
  color: string | undefined,
  styleBuilder: StyleBuilder,
): LiveLifeEvent {
  const last = b.lastEventWithDeactivate;
  const message = typeof last === 'object' && last.participants.includes(participant) ? last : undefined;
  const life: LiveLifeEvent = { kind: 'life', type, participant, color, styleBuilder, message };
  message?.lifeEventsType.add(type);
  b.events.push(life);
  return life;
}

/** `addNote(n, tryMerge)` (`:226-241`) for a standalone note; a note on a
 *  message is not an event. */
function addNote(b: Builder, event: NoteEvent): void {
  if (event.onMessage === true) return;
  const last = b.events[b.events.length - 1];
  if (event.vmerge === true && last !== undefined && (last.kind === 'note' || (last.kind === 'other' && last.notes))) {
    b.events[b.events.length - 1] = { kind: 'other', notes: true };
    return;
  }
  b.events.push({ kind: 'note' });
}

/** `grouping` (`:420-446`): the start, each branch after an `else` leaf, the
 *  `end` leaf -- which becomes `lastEventWithDeactivate`. A `ref` is one
 *  `Reference` event and leaves it alone. */
function addFrame(b: Builder, branches: readonly (readonly SequenceEvent[])[]): void {
  b.events.push(other());
  if (branches.length === 0) return;
  branches.forEach((branch, i) => {
    if (i > 0) b.events.push(other());
    addAll(b, branch);
  });
  b.events.push(other());
  b.lastEventWithDeactivate = 'leaf';
}
