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
  ActivationGeo,
  DelayEvent,
  DividerEvent,
  DividerGeo,
  EventGeo,
  FrameEvent,
  FrameGeo,
  NoteEvent,
  NoteGeo,
  ParticipantGeo,
  SequenceEvent,
  SpaceEvent,
  SpaceGeo,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer, FontSpec } from '../../core/measurer.js';
import { fontSpecOf } from './sequence-layout-shared.js';
import { refBodyLines, refBodyHeight, refBodyWidth } from './text-block-geo.js';
import { handleMessageEvent } from './sequence-layout-message.js';
import { handleMessageExoEvent } from './sequence-layout-exo.js';
import {
  groupingHeaderDisplay,
  HEADER_PADDING,
  HEADER_FONT_SIZE,
  HEADER_FONT_BOLD,
} from './frame-style.js';

/** Pending activation-bar start record, keyed by participant id. */
type ActivationRecord = { y: number; color?: string };

/**
 * Shared, mutable context threaded through event processing. Grouping these
 * as one object keeps every handler's parameter count within limits and lets
 * nested frame branches recurse through the same participant geometry and
 * pending-activation records.
 */
export interface EventProcessingContext {
  theme: Theme;
  measurer: StringMeasurer;
  participantMap: Map<string, ParticipantGeo>;
  participantIndex: Map<string, number>;
  activationStart: Map<string, ActivationRecord>;
  eventGeos: EventGeo[];
  dividerGeos: DividerGeo[];
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
export function processEvents(
  events: SequenceEvent[],
  startY: number,
  ctx: EventProcessingContext,
): number {
  const cursor: EventCursor = { y: startY, lastMessageY: undefined };
  for (const event of events) {
    dispatchEvent(event, cursor, ctx);
  }
  return cursor.y;
}

/** Route a single event to its kind-specific handler. */
function dispatchEvent(event: SequenceEvent, cursor: EventCursor, ctx: EventProcessingContext): void {
  switch (event.kind) {
    case 'message': handleMessageEvent(event, cursor, ctx); return;
    // Exo geometry is its own module, never `handleMessageEvent`'s:
    // `MessageExo.isSelfMessage()` is FALSE (`MessageExo.java:99-101`, D3)
    // although both of its participants are the same, so the `from === to`
    // reading there would put every exo arrow on a self loop.
    case 'messageExo': handleMessageExoEvent(event, cursor, ctx); return;
    case 'note': handleNoteEvent(event, cursor, ctx); return;
    case 'activate': handleActivateEvent(event, cursor, ctx); return;
    case 'deactivate': handleDeactivateEvent(event, cursor, ctx); return;
    case 'frame': handleFrameEvent(event, cursor, ctx); return;
    case 'divider': handleDividerEvent(event, cursor, ctx); return;
    case 'delay': handleDelayEvent(event, cursor, ctx); return;
    case 'space': handleSpaceEvent(event, cursor, ctx); return;
  }
}

function handleNoteEvent(
  event: NoteEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const fontSpec = fontSpecOf(ctx.theme);
  const notePadding = 10;
  const lines = event.text.split('\n');
  const lineHeight = ctx.measurer.measure('M', fontSpec).height;
  const maxLineWidth = Math.max(
    ...lines.map((line) => ctx.measurer.measure(line, fontSpec).width),
  );
  const noteWidth = maxLineWidth + notePadding * 2;
  const noteHeight = lines.length * lineHeight + notePadding * 2;

  const noteGeo = buildNoteGeo(event, noteWidth, noteHeight, cursor.y, ctx.participantMap);
  ctx.eventGeos.push(noteGeo);
  cursor.y += noteHeight + ctx.theme.sequence.messageSpacing;
}

function handleActivateEvent(
  event: ActivationEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // Use the last message arrow y when available so the bar top aligns
  // with its triggering arrow, not with the post-arrow spacing position.
  ctx.activationStart.set(event.participantId, {
    y: cursor.lastMessageY ?? cursor.y,
    ...(event.color !== undefined ? { color: event.color } : {}),
  });
  cursor.lastMessageY = undefined;
}

function handleDeactivateEvent(
  event: ActivationEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // End at the last message arrow y. If that would give zero/negative
  // height (activate and deactivate at the same y), fall back to
  // post-spacing cursor.y so the bar is always visible.
  const deactStartY = ctx.activationStart.get(event.participantId)?.y;
  const rawEndY = cursor.lastMessageY ?? cursor.y;
  const deactEndY =
    deactStartY !== undefined && rawEndY <= deactStartY ? cursor.y : rawEndY;
  emitActivation(event.participantId, deactEndY, ctx.participantMap, ctx.activationStart, ctx.eventGeos);
  cursor.lastMessageY = undefined;
}

/** Vertical room an `else` separator line plus its bracketed condition
 *  occupies before the branch's own first event. */
const SEPARATOR_HEIGHT = 20;

/** Everything a frame's x/width/refBody needs that does NOT depend on
 *  where its branches leave the cursor: participant column bounds are
 *  fixed, and `refBodyLines` reads only `frameType`/`label`. Split out so
 *  `handleFrameEvent` can resolve these BEFORE the branch walk -- see the
 *  mutation-contract doc on `handleFrameEvent` (D2). */
function computeFrameBody(
  event: FrameEvent,
  ctx: EventProcessingContext,
): { x: number; width: number; refBody: { text: string; x: number }[]; body: readonly string[] } {
  const { minCx, maxCx } = participantCenterXBounds(ctx.participantMap);
  const body = refBodyLines(event.frameType, event.label);
  const x = minCx - 20;
  const width = Math.max(maxCx - minCx + 40, refBodyWidth(body, ctx.theme, ctx.measurer));
  const refBody = body.map((line) => ({
    text: line,
    x: x + (width - ctx.measurer.measure(line, fontSpecOf(ctx.theme)).width) / 2,
  }));
  return { x, width, refBody, body };
}

/** The header tab's `Display`, split by `groupingHeaderDisplay`
 *  (`GroupingTile.java:126-127`), then measured at `HEADER_FONT_SIZE` bold
 *  -- `ComponentRoseGroupingHeader.java:107-123` / `AbstractTextualComponent
 *  .java:106-114`, with `getSuppHeightForComment` and `commentMargin * 2`
 *  both 0 since this port draws no separate comment box measurement (the
 *  comment box itself is T4's, `renderer-frame-header.ts`). Layout is the
 *  only stage holding a measurer, hence resolved here.
 *  An empty `branchLabels[0]` is treated as "no comment" (`undefined`),
 *  matching how `groupingCommand` defaults a conditionless frame's label to
 *  `''` -- there is no separate "absent" state to distinguish it from. */
function computeHeaderTab(
  event: FrameEvent,
  ctx: EventProcessingContext,
): { tabText: string; tabComment?: string; tabTextWidth: number; tabWidth: number; tabHeight: number } {
  const rawComment = event.branchLabels[0];
  const comment = rawComment === undefined || rawComment === '' ? undefined : rawComment;
  const { tabText, tabComment } = groupingHeaderDisplay(event.frameType, comment);

  const fontSpec: FontSpec = {
    family: ctx.theme.fontFamily,
    size: HEADER_FONT_SIZE,
    weight: HEADER_FONT_BOLD ? 'bold' : 'normal',
  };
  const measured = ctx.measurer.measure(tabText, fontSpec);
  const tabTextWidth = measured.width;
  const tabWidth = HEADER_PADDING.left + tabTextWidth + HEADER_PADDING.right;
  const tabHeight = measured.height + HEADER_PADDING.top + HEADER_PADDING.bottom;

  return {
    tabText,
    ...(tabComment !== undefined ? { tabComment } : {}),
    tabTextWidth,
    tabWidth,
    tabHeight,
  };
}

/**
 * MUTATION CONTRACT (D2 -- reserve the slot, then fill it).
 *
 * `frameGeo` is pushed into `ctx.eventGeos` BEFORE `event.branches` is
 * walked, so upstream's depth-first PRE-ORDER emission falls out for free,
 * nested groups included: `GroupingTile#drawU:254-275` draws its own
 * component, then recurses into `tiles`, and a nested `handleFrameEvent`
 * call pushes ITS OWN FrameGeo mid-walk -- landing between this frame's
 * push and its post-walk field fill, exactly where upstream's recursive
 * `drawU` would land it.
 *
 * `x`, `width`, `refBody` (via `computeFrameBody`), the tab* fields (via
 * `computeHeaderTab`) and `y` are all resolved BEFORE the push: each comes
 * only from `ctx.participantMap` and `event`'s own `frameType`/`label`/
 * `branchLabels`, none of which the branch walk can change -- `y` in
 * particular is `frameStartY`, `cursor.y` at entry, fixed before any branch
 * advances it. Only `height` and `branchSeparators` depend on where the
 * branches leave the cursor, so those two start as placeholders (`0` and
 * `[]`) at push time and are overwritten by direct mutation on `frameGeo`
 * once `event.branches` has been walked -- mirroring upstream's own
 * construct-then-resolve-gauge split (the `Real`/`YGauge` chain is built at
 * construction, then read once solved).
 */
function handleFrameEvent(
  event: FrameEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const frameStartY = cursor.y;
  const frameHeaderHeight = 30;
  cursor.y += frameHeaderHeight;

  const { x, width, refBody, body } = computeFrameBody(event, ctx);
  const frameGeo: FrameGeo = {
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x,
    y: frameStartY,
    width,
    height: 0, // placeholder -- filled below once the branch walk resolves frameEndY
    ...(event.backColorElement !== undefined ? { backColorElement: event.backColorElement } : {}),
    ...(event.backColorGeneral !== undefined ? { backColorGeneral: event.backColorGeneral } : {}),
    branchSeparators: [], // placeholder -- populated by mutation in the loop below
    refBody,
    ...computeHeaderTab(event, ctx),
  };
  ctx.eventGeos.push(frameGeo);

  // Process each branch in sequence (alt frames have multiple branches).
  // Every branch after the first opens with an `else`, which upstream draws
  // as a dashed separator carrying that branch's own bracketed condition --
  // record the y it falls at, before the branch's own events advance the
  // cursor past it. `event.branchColors` (T2, D10) is index-aligned with
  // `branchLabels`, so `[i]` is this branch's own `else #color`, or
  // `undefined` where none was given -- `renderer-frame-blotter.ts` falls
  // back to the group colour itself when a band has none
  // (`GroupingTile.java:326-332`).
  event.branches.forEach((branch, i) => {
    if (i > 0) {
      const branchColor = event.branchColors?.[i];
      frameGeo.branchSeparators.push({
        y: cursor.y,
        label: event.branchLabels[i] ?? '',
        ...(branchColor !== undefined ? { backColorGeneral: branchColor } : {}),
      });
      cursor.y += SEPARATOR_HEIGHT;
    }
    cursor.y = processEvents(branch, cursor.y, ctx);
  });

  const frameEndY = cursor.y;
  frameGeo.height = Math.max(frameEndY - frameStartY, refBodyHeight(body, ctx.theme, ctx.measurer));
  cursor.y = frameEndY + ctx.theme.sequence.messageSpacing;
}

function handleDividerEvent(
  event: DividerEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const dividerGeo: DividerGeo = {
    kind: 'divider',
    text: event.text,
    y: cursor.y,
    totalWidth: 0, // back-filled after totalWidth is computed in Step 3
  };
  ctx.eventGeos.push(dividerGeo);
  ctx.dividerGeos.push(dividerGeo);
  cursor.y += 30;
}

function handleDelayEvent(
  _event: DelayEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  // Delay events carry no geometry — advance by one message spacing
  cursor.y += ctx.theme.sequence.messageSpacing;
}

function handleSpaceEvent(
  event: SpaceEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const spaceGeo: SpaceGeo = {
    kind: 'space',
    y: cursor.y,
    height: event.pixels,
  };
  ctx.eventGeos.push(spaceGeo);
  // Advance by the requested pixels plus one message spacing gap so that
  // the next element starts clearly after the space region ends
  cursor.y += event.pixels + ctx.theme.sequence.messageSpacing;
}

/**
 * Resolve participant centerX by id, returning 0 as a safe fallback for
 * participants not in the map (e.g., notes referencing unknown participants).
 */
function centerXOf(participantMap: Map<string, ParticipantGeo>, id: string): number {
  return participantMap.get(id)?.centerX ?? 0;
}

/**
 * Compute the bounding centerX range across all participants.
 * Returns [0, 0] when the map is empty (only possible in degenerate inputs
 * since layoutSequence returns early for empty participants).
 */
function participantCenterXBounds(
  participantMap: Map<string, ParticipantGeo>,
): { minCx: number; maxCx: number } {
  const centerXs = [...participantMap.values()].map((g) => g.centerX);
  if (centerXs.length === 0) return { minCx: 0, maxCx: 0 };
  return { minCx: Math.min(...centerXs), maxCx: Math.max(...centerXs) };
}

/** Resolved x offset and (possibly widened) width for a note. */
interface NotePosition {
  noteX: number;
  finalNoteWidth: number;
}

/**
 * Resolve a note's x offset and width based on its position keyword
 * ('left' / 'right' / 'over') and referenced participants.
 */
function computeNotePosition(
  event: NoteEvent,
  noteWidth: number,
  participantMap: Map<string, ParticipantGeo>,
): NotePosition {
  const notePadding = 10;

  if (event.position === 'left') {
    // Safe: parser guarantees at least one participant for 'left' notes
    const noteX = centerXOf(participantMap, event.participants[0]!) - noteWidth - notePadding;
    return { noteX, finalNoteWidth: noteWidth };
  }
  if (event.position === 'right') {
    // Safe: parser guarantees at least one participant for 'right' notes
    const noteX = centerXOf(participantMap, event.participants[0]!) + notePadding;
    return { noteX, finalNoteWidth: noteWidth };
  }
  return computeOverNotePosition(event, noteWidth, participantMap);
}

/** Resolve position/width for an 'over' note (one or many participants). */
function computeOverNotePosition(
  event: NoteEvent,
  noteWidth: number,
  participantMap: Map<string, ParticipantGeo>,
): NotePosition {
  const notePadding = 10;

  if (event.participants.length === 1) {
    // Safe: length === 1 means [0] is defined
    const noteX = centerXOf(participantMap, event.participants[0]!) - noteWidth / 2;
    return { noteX, finalNoteWidth: noteWidth };
  }

  // Span between two (or more) participants
  const centers = event.participants
    .map((id) => centerXOf(participantMap, id))
    .filter((cx) => cx > 0);
  const minCx = Math.min(...centers);
  const maxCx = Math.max(...centers);
  return { noteX: minCx - notePadding, finalNoteWidth: maxCx - minCx + notePadding * 2 };
}

/**
 * Build a NoteGeo from a NoteEvent given pre-computed note dimensions.
 * Extracted to isolate the position-branch logic and simplify processEvents.
 */
function buildNoteGeo(
  event: NoteEvent,
  noteWidth: number,
  noteHeight: number,
  currentY: number,
  participantMap: Map<string, ParticipantGeo>,
): NoteGeo {
  const { noteX, finalNoteWidth } = computeNotePosition(event, noteWidth, participantMap);

  return {
    kind: 'note',
    x: noteX,
    y: currentY,
    width: finalNoteWidth,
    height: noteHeight,
    text: event.text,
    ...(event.color !== undefined ? { color: event.color } : {}),
    ...(event.shape !== undefined ? { shape: event.shape } : {}),
  };
}

/**
 * Emit an ActivationGeo for a participant, consuming any pending activation
 * start record. When no record exists, height is 0 (deactivate without prior
 * activate).
 */
export function emitActivation(
  participantId: string,
  currentY: number,
  participantMap: Map<string, ParticipantGeo>,
  activationStart: Map<string, ActivationRecord>,
  eventGeos: EventGeo[],
): void {
  const record = activationStart.get(participantId);
  const startY = record?.y ?? currentY;
  const activationGeo: ActivationGeo = {
    kind: 'activation',
    participantId,
    lifelineX: centerXOf(participantMap, participantId),
    y: startY,
    height: currentY - startY,
    ...(record?.color !== undefined ? { color: record.color } : {}),
  };
  eventGeos.push(activationGeo);
  activationStart.delete(participantId);
}
