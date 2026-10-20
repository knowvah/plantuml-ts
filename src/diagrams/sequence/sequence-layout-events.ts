/**
 * Sequence diagram layout — event geometry (Step 2 of layoutSequence).
 * Extracted from layout.ts to keep file size and per-function complexity
 * within limits; see layout.ts for the overall pipeline.
 *
 * @see .../sequencediagram/SequenceDiagram.java (upstream advances a running
 * Y cursor as it visits each event in source order)
 */

import type {
  ActivationEvent,
  DelayEvent,
  DestroyCross,
  DividerGeo,
  EventGeo,
  NewpageEvent,
  NewpageGeo,
  ParticipantGeo,
  SequenceEvent,
  SpaceEvent,
  SpaceGeo,
  TextRun,
} from './ast.js';
import type { StyleBuilder } from '../../core/style/StyleBuilder.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { handleNoteEvent } from './sequence-layout-note.js';
import { NEWPAGE_TILE_HEIGHT } from './newpage-style.js';
import type { MessageLabelEnv } from './text-block-geo.js';
import { handleMessageEvent } from './sequence-layout-message.js';
import { layoutDelay } from './sequence-delay.js';
import type { MessageLevels } from './sequence-layout-participants.js';
import { handleMessageExoEvent } from './sequence-layout-exo.js';
import type { ActivationStack } from './sequence-layout-activation.js';
import { handleActivateEvent, handleDeactivateEvent } from './sequence-layout-life-event.js';
import { handleDividerEvent } from './sequence-layout-divider.js';
import { handleFrameEvent } from './sequence-layout-frame.js';
import { newpageStyle, paintOf } from './sequence-skin-param.js';

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
}

/** Running Y cursor plus the y of the most recent message arrow. */
export interface EventCursor {
  y: number;
  lastMessageY: number | undefined;
}

/**
 * Process a list of events, mutating `ctx.eventGeos`/`ctx.dividerGeos` in
 * place. Returns the updated Y position after all events are processed.
 */
export function processEvents(events: SequenceEvent[], startY: number, ctx: EventProcessingContext): number {
  const cursor: EventCursor = { y: startY, lastMessageY: undefined };
  for (let i = 0; i < events.length; i++) {
    dispatchEvent(events[i]!, cursor, ctx, boundLifeEvents(events, i));
  }
  return cursor.y;
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

/** Route a single event to its kind-specific handler. */
function dispatchEvent(
  event: SequenceEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
  bound: readonly ActivationEvent[],
): void {
  switch (event.kind) {
    case 'message':
      // Every bar this message opens is painted from its builder (see
      // `sequence-layout-activation.ts`'s head).
      ctx.activationStart.lastMessageStyleBuilder = event.styleBuilder;
      handleMessageEvent(event, cursor, ctx, bound);
      return;
    // Exo geometry is its own module, never `handleMessageEvent`'s:
    // `MessageExo.isSelfMessage()` is FALSE (`MessageExo.java:99-101`, D3)
    // although both of its participants are the same, so the `from === to`
    // reading there would put every exo arrow on a self loop.
    case 'messageExo':
      ctx.activationStart.lastMessageStyleBuilder = event.styleBuilder;
      handleMessageExoEvent(event, cursor, ctx);
      return;
    case 'note':
      handleNoteEvent(event, cursor, ctx);
      return;
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
