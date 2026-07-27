/**
 * Mutable parse state and shared helpers for the sequence diagram parser.
 *
 * Split out of `parser.ts` (the `COMMANDS` dispatch table lives in
 * `sequence-commands.ts`) purely to stay under the project's 500-line file
 * cap; this file owns `ParseState`, the `Command` dispatch-entry shape, and
 * the mutation helpers (`ensureParticipant`, `emit`, `applyAutonumber`, …)
 * that both `parser.ts` and `sequence-commands.ts` depend on.
 */

import type {
  BoxGroup,
  FrameEvent,
  MessageEvent,
  MessageStyle,
  NoteEvent,
  Participant,
  ParticipantType,
  SequenceDiagramAST,
  SequenceEvent,
} from './ast.js';
import { createAnnotations } from '../../core/annotations/index.js';
import { createSpriteRegistry } from '../../core/sprite-commands.js';

// ---------------------------------------------------------------------------
// Mutable parse state (local to each parseSequence call)
// ---------------------------------------------------------------------------

export interface ParseState {
  ast: SequenceDiagramAST;
  /** Stack of open FrameEvents. Empty = top-level. */
  frameStack: FrameEvent[];
  /** Participant id → index in ast.participants */
  participantIndex: Map<string, number>;
  /** When inside a multi-line note, accumulate here. */
  pendingNote: NoteEvent | null;
  /** Track the most recent message sender for `return` command. */
  lastMessageFrom: string | null;
  lastMessageTo: string | null;
  /** The currently open box group (between `box` and `end box`). */
  currentBox: BoxGroup | null;
  /** Monotonically incrementing counter used to generate unique box ids. */
  boxCounter: number;
}

// ---------------------------------------------------------------------------
// Command dispatch entry shape
// ---------------------------------------------------------------------------

export interface Command {
  pattern: RegExp;
  execute(state: ParseState, match: RegExpExecArray): void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function makeDefaultAST(): SequenceDiagramAST {
  return {
    participants: [],
    events: [],
    autonumber: { enabled: false, start: 1, current: 1 },
    options: {
      hideFootbox: false,
      messageAlign: 'left',
    },
    boxes: [],
    annotations: createAnnotations(),
    sprites: createSpriteRegistry(),
  };
}

/** Return the event array for the current scope (inner frame or top-level). */
export function currentEvents(state: ParseState): SequenceEvent[] {
  const top = state.frameStack[state.frameStack.length - 1];
  if (top === undefined) return state.ast.events;
  const branches = top.branches;
  const last = branches[branches.length - 1];
  return last ?? state.ast.events;
}

/** Ensure a participant exists; create it if it does not. */
export function ensureParticipant(
  state: ParseState,
  id: string,
  type: ParticipantType = 'participant',
  display?: string,
  color?: string,
): void {
  if (state.participantIndex.has(id)) return;
  const order = state.ast.participants.length;
  const p: Participant = {
    id,
    display: display ?? id,
    type,
    order,
    ...(color !== undefined ? { color } : {}),
    ...(state.currentBox !== null ? { boxId: state.currentBox.id } : {}),
  };
  state.ast.participants.push(p);
  state.participantIndex.set(id, order);
  if (state.currentBox !== null) {
    state.currentBox.participantIds.push(id);
  }
}

/** Emit a SequenceEvent into the current scope. */
export function emit(state: ParseState, event: SequenceEvent): void {
  currentEvents(state).push(event);
}

/** Apply autonumber to a message if enabled. */
export function applyAutonumber(
  state: ParseState,
  msg: MessageEvent,
): MessageEvent {
  if (!state.ast.autonumber.enabled) return msg;
  const num = state.ast.autonumber.current;
  state.ast.autonumber.current += 1;
  return { ...msg, sequenceNumber: num };
}

// ---------------------------------------------------------------------------
// Arrow pattern → MessageStyle
// ---------------------------------------------------------------------------

/** Map raw arrow tokens to MessageStyle values. */
export const ARROW_STYLE_MAP: Readonly<Record<string, MessageStyle>> = {
  '->': 'sync',
  '->>': 'async',
  '-->': 'reply',
  '-->>': 'replyAsync',
  '->?': 'lost',
  '?->': 'found',
};

// ---------------------------------------------------------------------------
// participant-family declaration parsing
// ---------------------------------------------------------------------------

/** Parsed `participant`-family declaration: id, display name, and optional
 *  color, resolved from the various supported syntaxes (`participant
 *  Alice`, `participant "Alice Smith" as A #pink`, …). */
export interface ParticipantDeclaration {
  id: string;
  display: string;
  color: string | undefined;
}

/** Parse the trailing text of a `participant|actor|...` command into an
 *  id/display/color triple. */
export function parseParticipantDeclaration(rest: string): ParticipantDeclaration {
  // Try: "Display Name" as Alias [#color]
  const quotedAlias = /^"([^"]+)"\s+as\s+(\S+)(?:\s+(#\w+))?$/.exec(rest);
  if (quotedAlias !== null) {
    return { display: quotedAlias[1]!, id: quotedAlias[2]!, color: quotedAlias[3] };
  }
  // Try: unquoted Name as Alias [#color]
  const unquotedAlias = /^(\S+)\s+as\s+(\S+)(?:\s+(#\w+))?$/.exec(rest);
  if (unquotedAlias !== null) {
    return { display: unquotedAlias[1]!, id: unquotedAlias[2]!, color: unquotedAlias[3] };
  }
  // Try: Name [#color]
  const withColor = /^(\S+)\s+(#\w+)$/.exec(rest);
  if (withColor !== null) {
    return { id: withColor[1]!, display: withColor[1]!, color: withColor[2] };
  }
  const id = rest.trim();
  return { id, display: id, color: undefined };
}
