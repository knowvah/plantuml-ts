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
  MessageEvent,
  MessageGeo,
  NoteEvent,
  NoteGeo,
  ParticipantGeo,
  SequenceEvent,
  SpaceEvent,
  SpaceGeo,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { fontSpecOf } from './sequence-layout-shared.js';

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
interface EventCursor {
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
    case 'note': handleNoteEvent(event, cursor, ctx); return;
    case 'activate': handleActivateEvent(event, cursor, ctx); return;
    case 'deactivate': handleDeactivateEvent(event, cursor, ctx); return;
    case 'frame': handleFrameEvent(event, cursor, ctx); return;
    case 'divider': handleDividerEvent(event, cursor, ctx); return;
    case 'delay': handleDelayEvent(event, cursor, ctx); return;
    case 'space': handleSpaceEvent(event, cursor, ctx); return;
  }
}

function handleMessageEvent(
  event: MessageEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const fromGeo = ctx.participantMap.get(event.from);
  const toGeo = ctx.participantMap.get(event.to);
  // Skip gracefully if either participant is unknown
  if (fromGeo === undefined || toGeo === undefined) return;

  const endpoints = resolveMessageEndpoints(event, fromGeo, toGeo, ctx);
  const messageGeo = buildMessageGeo(event, endpoints, cursor.y);
  ctx.eventGeos.push(messageGeo);
  cursor.lastMessageY = messageGeo.y;

  const lineHeight = ctx.measurer.measure('M', fontSpecOf(ctx.theme)).height;
  cursor.y += ctx.theme.sequence.messageSpacing + lineHeight;

  // Handle auto-activate/deactivate via ++ / -- shorthand on message
  applyMessageActivation(event, messageGeo, cursor, ctx);
}

/** Build the MessageGeo for a resolved set of endpoints at the given y. */
function buildMessageGeo(
  event: MessageEvent,
  endpoints: MessageEndpoints,
  y: number,
): MessageGeo {
  return {
    kind: 'message',
    fromX: endpoints.fromX,
    toX: endpoints.toX,
    y,
    label: event.label,
    style: event.style,
    arrowDirection: endpoints.arrowDirection,
    ...(event.sequenceNumber !== undefined
      ? { sequenceNumber: event.sequenceNumber }
      : {}),
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
    // Activation starts at the arrow y, not after the post-arrow spacing advance.
    ctx.activationStart.set(event.activates, { y: messageGeo.y });
  }
  if (event.deactivates !== undefined) {
    // End at the arrow y. If that would give zero/negative height (the
    // activate and deactivate land at the same y), fall back to the
    // post-spacing cursor.y so the bar is always visible.
    const deactStartY = ctx.activationStart.get(event.deactivates)?.y;
    const deactEndY =
      deactStartY !== undefined && messageGeo.y <= deactStartY
        ? cursor.y
        : messageGeo.y;
    emitActivation(event.deactivates, deactEndY, ctx.participantMap, ctx.activationStart, ctx.eventGeos);
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

function handleFrameEvent(
  event: FrameEvent,
  cursor: EventCursor,
  ctx: EventProcessingContext,
): void {
  const frameStartY = cursor.y;
  const frameHeaderHeight = 30;
  cursor.y += frameHeaderHeight;

  // Process each branch in sequence (alt frames have multiple branches).
  // Every branch after the first opens with an `else`, which upstream draws
  // as a dashed separator carrying that branch's own bracketed condition --
  // record the y it falls at, before the branch's own events advance the
  // cursor past it.
  const branchSeparators: { y: number; label: string }[] = [];
  event.branches.forEach((branch, i) => {
    if (i > 0) {
      branchSeparators.push({ y: cursor.y, label: event.branchLabels[i] ?? '' });
      cursor.y += SEPARATOR_HEIGHT;
    }
    cursor.y = processEvents(branch, cursor.y, ctx);
  });

  const frameEndY = cursor.y;
  const { minCx, maxCx } = participantCenterXBounds(ctx.participantMap);

  const frameGeo: FrameGeo = {
    kind: 'frame',
    frameType: event.frameType,
    label: event.label,
    x: minCx - 20,
    y: frameStartY,
    width: maxCx - minCx + 40,
    height: frameEndY - frameStartY,
    branchSeparators,
  };
  ctx.eventGeos.push(frameGeo);
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
  };
}

/**
 * Emit an ActivationGeo for a participant, consuming any pending activation
 * start record. When no record exists, height is 0 (deactivate without prior
 * activate).
 */
function emitActivation(
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
