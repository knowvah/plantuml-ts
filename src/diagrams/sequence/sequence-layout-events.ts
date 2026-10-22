/**
 * Sequence diagram layout — event geometry (Step 2 of layoutSequence).
 * Extracted from layout.ts to keep file size and per-function complexity
 * within limits; see layout.ts for the overall pipeline.
 *
 * The walk is teoz's tile chain: `TileBuilder.buildSeveral` builds one tile
 * per event, each on the previous tile's `YGauge` (`sequence-y-gauge.ts`), and
 * folds a message's notes into wrapper tiles around it.
 *
 * @see .../sequencediagram/teoz/TileBuilder.java
 * @see .../sequencediagram/teoz/YGauge.java
 */

import type {
  AbstractMessageEvent,
  ActivationEvent,
  DelayEvent,
  DestroyCross,
  DividerGeo,
  EventGeo,
  MessageEvent,
  MessageExoEvent,
  NewpageEvent,
  NoteEvent,
  NewpageGeo,
  ParticipantGeo,
  SequenceEvent,
  SpaceEvent,
  SpaceGeo,
  TextRun,
} from './ast.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import {
  handleNoteEvent,
  handleNotesGroup,
  layoutNotesOnMessage,
  noteTileMetrics,
  notesGroupMetrics,
} from './sequence-layout-note.js';
import { NEWPAGE_TILE_HEIGHT } from './newpage-style.js';
import type { MessageLabelEnv } from './text-block-geo.js';
import { handleMessageEvent, messageTileMetrics } from './sequence-layout-message.js';
import { layoutDelay } from './sequence-delay.js';
import type { MessageLevels } from './sequence-layout-participants.js';
import { exoTileMetrics, handleMessageExoEvent } from './sequence-layout-exo.js';
import type { ActivationStack } from './sequence-layout-activation.js';
import { handleActivateEvent, handleDeactivateEvent } from './sequence-layout-life-event.js';
import { handleDividerEvent } from './sequence-layout-divider.js';
import { handleFrameEvent } from './sequence-layout-frame.js';
import { newpageStyle, paintOf } from './sequence-skin-param.js';
import {
  createGauge,
  createParallel,
  createPropagating,
  createWithContact,
  type MessageTileGauge,
  type TileMetrics,
  type YGauge,
} from './sequence-y-gauge.js';

export {
  activationLevel,
  emitActivation,
  flushOpenActivations,
  newActivationStack,
  openActivation,
  pushActivation,
  type ActivationStack,
} from './sequence-layout-activation.js';

/**
 * Shared, mutable context threaded through event processing. Grouping these
 * as one object keeps every handler's parameter count within limits and lets
 * nested frame branches recurse through the same participant geometry and
 * pending-activation records.
 */
export interface EventProcessingContext extends MessageLabelEnv {
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  activationStart: ActivationStack;
  eventGeos: EventGeo[];
  dividerGeos: DividerGeo[];
  /** The newpage tiles, in layout order — `PlayingSpace#getNewpageTiles`
   *  (`:326-336`). Collected alongside `dividerGeos` for the same reason:
   *  both need `totalWidth` back-filled once Step 3 knows it. */
  newpageGeos: NewpageGeo[];
  /**
   * The participants of `SequenceDiagram.lastEventWithDeactivate` when that
   * event is a MESSAGE, and `undefined` otherwise — a diagram-level field
   * upstream (`:145`), set by `addMessage` (`:204`) and reset to the
   * `GroupingLeaf` by a group `end` (`:438`).
   *
   * Only one reader: a `destroy` binds to it when it `dealWith`s the same
   * participant AND it is an `AbstractMessage` (`:387,396-398`), and an
   * unbound destroy is the one life event that reserves height. `undefined`
   * therefore covers both "nothing yet" and "the last one was a group end",
   * which are the same answer.
   */
  lastMessageParticipants?: readonly string[] | undefined;
  /** The destroy crosses a MESSAGE's step yields, by participant
   *  (`sequence-layout-life-event.ts#messageDestroyCrosses`), valid while
   *  `of` is still {@link lastMessageParticipants}: an exo message replaces
   *  that array, and its step draws none (`LiveBoxes.java:218`). */
  lastMessageCrosses?: { readonly of: readonly string[]; readonly crosses: Map<string, DestroyCross[]> } | undefined;
  /** The builder the tiles read after the parse: a destroy cross's
   *  (`LiveBoxesDrawer.java:78-81`, `LifeEventTile.java:107-110`). */
  endStyleBuilder: StyleBuilder;
  /** Where the walk records each message's two live levels for the
   *  participant row's next pass -- see `sequence-layout-participants.ts
   *  #MessageLevels`. */
  messageLevels?: MessageLevels;
  /** The live level of the last message's two ends, as the tile wrappers of
   *  a note written right after it read it: `getLevelAt(this,
   *  IGNORE_FUTURE_DEACTIVATE)` (`teoz/CommunicationTileNoteRight.java:105`),
   *  i.e. before that message's own `--` pops anything. */
  lastMessageLevels?: ReadonlyMap<string, number>;
  /** Every message's and exo message's tile gauge, keyed by its AST event --
   *  read through `sequence-y-gauge.ts#messageTileGauge`. Created by
   *  {@link processEvents}. */
  messageTileGauges?: Map<AbstractMessageEvent, MessageTileGauge>;
}

/** Running Y cursor. */
export interface EventCursor {
  y: number;
  /** The previous tile's gauge, which the next tile chains on
   *  (`TileBuilder.buildSeveral:69-73`, `currentY = tile.getYGauge()`).
   *  Between two tiles `y === gauge.max`. */
  gauge: YGauge;
}

/** A message or exo message: the two `AbstractMessage` kinds that carry
 *  notes (`AbstractMessage.java:58` implements `EventWithNote`). */
type NoteOwner = MessageEvent | MessageExoEvent;

/**
 * One event list as `TileBuilder` walks it: the tiles in order, every note on
 * a message folded into its owner rather than standing as a tile of its own,
 * and the gauge inputs, measured once.
 */
interface TileRun {
  readonly tiles: readonly SequenceEvent[];
  readonly notesOf: ReadonlyMap<NoteOwner, NoteEvent[]>;
  /** Each `Notes` group (`/ note`) by its first note, which stands for the
   *  group in `tiles`; the value is every member in order. */
  readonly groups: ReadonlyMap<NoteEvent, readonly NoteEvent[]>;
  readonly metrics: Map<SequenceEvent, TileMetrics | undefined>;
}

/**
 * Process a list of events, mutating `ctx.eventGeos`/`ctx.dividerGeos` in
 * place. Returns the last tile's gauge max -- the height the list occupies
 * (`PlayingSpace#drawUInternal:136-143`).
 */
export function processEvents(events: SequenceEvent[], startY: number, ctx: EventProcessingContext): number {
  ctx.messageTileGauges ??= new Map();
  const notesOf = notesOnMessages(events);
  const folded = new Set([...notesOf.values()].flat());
  const { tiles, groups } = mergeNotes(events.filter((e) => !folded.has(e as NoteEvent)));
  const run: TileRun = { tiles, notesOf, groups, metrics: new Map() };
  // `PlayingSpace.java:89`: the chain starts from a contact-less gauge.
  const cursor: EventCursor = { y: startY, gauge: createGauge(startY, 0) };
  for (let k = 0; k < run.tiles.length; k++) dispatchTile(run, k, cursor, ctx);
  return cursor.y;
}

/**
 * `SequenceDiagram#addNote(note, tryMerge)` (`:226-241`): a `/ note` right
 * after a standalone note joins it in a `Notes` event. "Right after" is
 * upstream's `events.get(size - 1)`, and a note on a message is not an event
 * there, so it neither merges nor breaks the run.
 */
function mergeNotes(events: readonly SequenceEvent[]): {
  tiles: SequenceEvent[];
  groups: Map<NoteEvent, NoteEvent[]>;
} {
  const tiles: SequenceEvent[] = [];
  const groups = new Map<NoteEvent, NoteEvent[]>();
  let last: SequenceEvent | undefined;
  for (const event of events) {
    if (event.kind === 'note' && event.onMessage === true) tiles.push(event);
    else if (event.kind === 'note' && event.vmerge === true && last?.kind === 'note') {
      // `last` stays the group's first note: it is the one in `tiles`.
      groups.set(last, [...(groups.get(last) ?? [last]), event]);
    } else {
      tiles.push(event);
      last = event;
    }
  }
  return { tiles, groups };
}

/**
 * `msg.getNoteOnMessages()`, per owner. `FactorySequenceNoteOnArrowCommand`
 * adds the note to `diagram.getLastEventWithNote()` (`:211`), the latest
 * event that is an `EventWithNote` (`SequenceDiagram.java:154-158`): an
 * `AbstractMessage`, a `Reference` or a `GroupingLeaf`. Life events, dividers
 * and standalone notes in between do not change the owner; a frame (its `end`
 * leaf, or a `ref`) does, and a note it owns is not a message's.
 *
 * A message's `top`/`bottom` note is folded too (`NoteTop`/`NoteBottom`,
 * `TileBuilder.java:117-120`); after an exo arrow every note is folded,
 * because there the position comes from note 0 (`TileBuilder.java:128-136`).
 * Only a note whose owner is a frame (`ref`, group `end`) stays stacked, drawn
 * by `legacyOverTile` (see `sequence-note-tile.ts`).
 */
function notesOnMessages(events: readonly SequenceEvent[]): Map<NoteOwner, NoteEvent[]> {
  const notesOf = new Map<NoteOwner, NoteEvent[]>();
  let owner: NoteOwner | undefined;
  for (const event of events) {
    if (event.kind === 'message' || event.kind === 'messageExo') owner = event;
    else if (event.kind === 'frame') owner = undefined;
    else if (owner !== undefined && foldsInto(owner, event)) notesOf.set(owner, [...(notesOf.get(owner) ?? []), event]);
  }
  return notesOf;
}

/** Whether `event` is a note on `owner` that a wrapper draws (see
 *  {@link notesOnMessages}). */
function foldsInto(owner: NoteOwner, event: SequenceEvent): event is NoteEvent {
  if (event.kind !== 'note' || event.onMessage !== true) return false;
  return owner.kind === 'messageExo' || event.position !== 'over' || event.side !== undefined;
}

/**
 * The life events upstream BINDS to `events[index]`, when that is a message.
 *
 * `SequenceDiagram#activate` calls `lifeEvent.setMessage(lastMessage)` for
 * every activate/deactivate that follows a message (`:396-399`), and
 * `LiveBoxes#getLevelAtInternal` then walks forward from the message picking
 * up exactly those (`le.getMessage() == msg`, `:120-125`) to decide the
 * level AT it.
 *
 * Upstream's walk skips notes (`nextButSkippingNotes`) and `continue`s past
 * a following MESSAGE rather than breaking; this breaks there instead, which
 * is equivalent — a life event after a later message is bound to THAT
 * message, so the `le.getMessage() == msg` test would reject it anyway.
 * It also breaks on anything else, which is upstream's own
 * `if (!(next instanceof LifeEvent || next instanceof AbstractMessage))
 * break;` — and that is what keeps a frame boundary from binding an
 * `activate` inside the frame to the message before it.
 */
function boundLifeEvents(events: readonly SequenceEvent[], index: number): ActivationEvent[] {
  const bound: ActivationEvent[] = [];
  for (let i = index + 1; i < events.length; i++) {
    const next = events[i]!;
    if (next.kind === 'note') continue;
    if (next.kind !== 'activate' && next.kind !== 'deactivate') break;
    bound.push(next);
  }
  return bound;
}

/** A tile that owns a contact line: `CommunicationTile`, `...TileSelf`,
 *  `CommunicationExoTile`, `NoteTile` -- each built by `createWithContact` or,
 *  when `&`-prefixed, `createParallel`. */
type ContactEvent = MessageEvent | MessageExoEvent | NoteEvent;

function isContactTile(event: SequenceEvent): event is ContactEvent {
  if (event.kind === 'note') return event.onMessage !== true;
  return event.kind === 'message' || event.kind === 'messageExo';
}

/**
 * A tile that passes the contact line on: `LifeEventTile` and `HSpaceTile`
 * (`createPropagating`, `LifeEventTile.java:91-95`, `HSpaceTile.java:58-62`),
 * and a note written under a message that this port still stacks as its own
 * tile -- upstream it is a wrapper, which propagates the line
 * (`CommunicationTileNoteBottomTopAbstract.java:85-94`).
 */
function isPropagating(event: SequenceEvent): boolean {
  if (event.kind === 'note') return event.onMessage === true;
  return event.kind === 'activate' || event.kind === 'deactivate' || event.kind === 'space';
}

function noteMetricsOf(run: TileRun, event: NoteEvent, ctx: EventProcessingContext): TileMetrics {
  const group = run.groups.get(event);
  return group === undefined ? noteTileMetrics(event, ctx) : notesGroupMetrics(group, ctx);
}

/** `Notes` is never `&`: it inherits `AbstractEvent#isParallel` = false
 *  (`NotesTile.java:84-91`), so a group, whatever its first note said, opens
 *  a line of its own. */
function isParallel(run: TileRun, event: ContactEvent): boolean {
  return event.parallel === true && !(event.kind === 'note' && run.groups.has(event));
}

function metricsOf(run: TileRun, event: ContactEvent, ctx: EventProcessingContext): TileMetrics | undefined {
  if (!run.metrics.has(event)) {
    const metrics =
      event.kind === 'message'
        ? messageTileMetrics(event, ctx)
        : event.kind === 'messageExo'
          ? exoTileMetrics(event, ctx)
          : noteMetricsOf(run, event, ctx);
    run.metrics.set(event, metrics);
  }
  return run.metrics.get(event);
}

/**
 * The contact offsets of the `&` members that will share the line the tile at
 * `k` opens: every following `&` contact tile reached through tiles that
 * propagate the line (`YGauge.java:147-150`) and through the members
 * themselves (`createParallel` hands its contact and origin on, `:144`). A
 * non-`&` contact tile opens a line of its own; anything else carries none.
 */
function parallelMembers(run: TileRun, k: number, ctx: EventProcessingContext): number[] {
  const members: number[] = [];
  for (let j = k + 1; j < run.tiles.length; j++) {
    const next = run.tiles[j]!;
    if (isPropagating(next)) continue;
    if (!isContactTile(next)) break;
    const metrics = metricsOf(run, next, ctx);
    // A tile this port skips (an unknown participant) is not in the chain.
    if (metrics === undefined) continue;
    if (!isParallel(run, next)) break;
    members.push(metrics.contactRelative);
  }
  return members;
}

/** Build the tile at `k` on the previous gauge and lay it out. */
function dispatchTile(run: TileRun, k: number, cursor: EventCursor, ctx: EventProcessingContext): void {
  const event = run.tiles[k]!;
  if (event.kind === 'note' && event.onMessage === true) return placeStackedNote(event, cursor, ctx);
  if (isContactTile(event)) return placeContactTile(run, k, cursor, ctx);
  const before = cursor.gauge;
  dispatchEvent(event, cursor, ctx);
  // Every other tile chains below the previous max: `createPropagating` for a
  // life event or a space, `YGauge.create(currentY.getMax(), ...)` for a
  // divider, delay, reference, newpage or group (`DividerTile.java:72`,
  // `DelayTile.java:68`, `ReferenceTile.java:74`, `NewpageTile.java:74`,
  // `GroupingTile.java:154,238`).
  const height = cursor.y - before.max;
  cursor.gauge = isPropagating(event) ? createPropagating(before, height) : createGauge(before.max, height);
}

/** A note on a message this port does not fold into a wrapper (see
 *  {@link notesOnMessages}): stacked below the previous tile, passing the
 *  contact line on like the wrapper it stands in for. */
function placeStackedNote(event: NoteEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const gauge = createPropagating(cursor.gauge, noteTileMetrics(event, ctx).height);
  handleNoteEvent(event, gauge, ctx);
  cursor.gauge = gauge;
  cursor.y = gauge.max;
}

/**
 * A contact tile: `createParallel` when `&`-prefixed (`CommunicationTile.java:
 * 114-117`, `CommunicationTileSelf.java:87-90`, `CommunicationExoTile.java:
 * 81-84`, `NoteTile.java:94-97`), else `createWithContact` raised by the
 * members that will share its line; then a message's note wrappers.
 */
function placeContactTile(run: TileRun, k: number, cursor: EventCursor, ctx: EventProcessingContext): void {
  const event = run.tiles[k] as ContactEvent;
  const metrics = metricsOf(run, event, ctx);
  if (metrics === undefined) return;
  const gauge = isParallel(run, event)
    ? createParallel(cursor.gauge, metrics)
    : createWithContact(cursor.gauge, metrics, parallelMembers(run, k, ctx));
  const tile = { gauge, metrics };
  const bound = boundLifeEvents(run.tiles, k);
  let outer = gauge;
  if (event.kind === 'note') {
    const group = run.groups.get(event);
    if (group === undefined) handleNoteEvent(event, gauge, ctx);
    else handleNotesGroup(group, gauge, ctx);
  } else {
    const firstGeo = ctx.eventGeos.length;
    if (event.kind === 'message') handleMessageEvent(event, tile, cursor, ctx, bound);
    else handleMessageExoEvent(event, tile, cursor, ctx, bound);
    const notes = run.notesOf.get(event) ?? [];
    outer = layoutNotesOnMessage(
      event,
      notes,
      { gauge, height: metrics.height, contactRelative: metrics.contactRelative, firstGeo },
      ctx,
    );
  }
  cursor.gauge = outer;
  cursor.y = outer.max;
}

/** Route a non-contact tile to its kind-specific handler. Messages, exo
 *  messages and notes are {@link placeContactTile}'s. */
function dispatchEvent(event: SequenceEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  switch (event.kind) {
    case 'activate':
      handleActivateEvent(event, cursor, ctx);
      return;
    case 'deactivate':
      handleDeactivateEvent(event, cursor, ctx);
      return;
    case 'frame':
      handleFrameEvent(event, cursor, ctx);
      return;
    case 'divider':
      handleDividerEvent(event, cursor, ctx);
      return;
    case 'delay':
      handleDelayEvent(event, cursor, ctx);
      return;
    case 'space':
      handleSpaceEvent(event, cursor, ctx);
      return;
    case 'newpage':
      handleNewpageEvent(event, cursor, ctx);
      return;
  }
}

/** A creole BLOCK's width -- the max over its stripes that
 *  `TextBlockSimple#calculateDimension` returns (`klimt/shape/TextBlockSimple
 *  .java:60-73`) and `AbstractTextualComponent#getTextWidth` pads (`:100-108`).
 *  Each run carries its line's offset in `x`, so one max IS that maximum; the
 *  `0` seed is the empty block. Cf. `sequence-layout-frame.ts#creoleLineWidth`,
 *  for ONE line. */
export function blockWidthOf(runs: readonly TextRun[]): number {
  return Math.max(0, ...runs.map((r) => r.x + r.textWidth));
}

/**
 * `DelayTile` (`teoz/DelayTile.java`): the tile reserves its `DELAY_TEXT`
 * component's height -- a bare `...` included, whose `Display.empty()` makes
 * it `0 + 4 + 4 + 20` -- and is laid out, drawn and allowed to cut the
 * lifelines and activation bars by `sequence-delay.ts`.
 */
function handleDelayEvent(event: DelayEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const geo = layoutDelay(event, cursor.y, [...ctx.participantMap.values()], ctx.measurer);
  ctx.eventGeos.push(geo);
  cursor.y += geo.height;
}

/**
 * `NewpageTile` (`teoz/NewpageTile.java:63-67`): a tile whose `YGauge` starts
 * at the running cursor and whose height is a CONSTANT
 * `getPreferredHeight()` — no measurement, no participant lookup. The cursor
 * advances by that height like it does past any other tile, which is what
 * makes `newpage` occupy 21px of the diagram rather than nothing.
 *
 * The tile draws nothing in the background pass (`drawU` returns early on
 * `isBackground`) and one `ULine.hline` in the foreground; the band it spans
 * is back-filled in Step 3. Its paint is `ComponentType.NEWPAGE`'s style,
 * merged in the constructor from the builder current at the command
 * (`Newpage.java:55-57`, `SequenceDiagram.java:248`), read by
 * `ComponentRoseNewpage` (`:54-64`: `getColorLine()`, `getStroke()`).
 */
function handleNewpageEvent(event: NewpageEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const newpageGeo: NewpageGeo = {
    paint: paintOf(newpageStyle(event.styleBuilder), HColorSet.instance()),
    kind: 'newpage',
    y: cursor.y,
    height: NEWPAGE_TILE_HEIGHT,
    bandX: 0, // both back-filled once totalWidth is known (Step 3)
    bandWidth: 0,
  };
  ctx.eventGeos.push(newpageGeo);
  ctx.newpageGeos.push(newpageGeo);
  cursor.y += newpageGeo.height;
}

function handleSpaceEvent(event: SpaceEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  const spaceGeo: SpaceGeo = {
    kind: 'space',
    y: cursor.y,
    height: event.pixels,
  };
  ctx.eventGeos.push(spaceGeo);
  // Exactly the requested pixels, and nothing beside them. `HSpaceTile:72-75`
  // returns the `HSpace`'s own pixel count as its preferred height, and
  // `ComponentRoseGroupingSpace#getPreferredHeight:66-69` returns the `space
  // N` argument -- neither adds a gap, because tiles chain flush.
  cursor.y += event.pixels;
}
