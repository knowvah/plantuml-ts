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
import type { Command as CoreCommand } from '../../core/command/Command.js';
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
  /** When inside a multi-line `ref over ... / end ref` block (T13,
   *  `CommandReferenceMultilinesOverSeveral`), accumulate its text here —
   *  same shape as `pendingNote`, kept separate because a `ref`'s body text
   *  becomes a `FrameEvent.label`, not a `NoteEvent.text`. */
  pendingRef: FrameEvent | null;
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

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java:42-58 */
export type Command = CoreCommand<ParseState>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function makeDefaultAST(): SequenceDiagramAST {
  return {
    participants: [],
    events: [],
    autonumber: { enabled: false, start: 1, current: 1, step: 1, prefix: '' },
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

/**
 * `AutoNumber#getNextMessageNumber` (`AutoNumber.java:75-81`): format the
 * CURRENT value, then advance by `step` (`DottedNumber#incrementMinor`,
 * `DottedNumber.java:75-79` — the last segment only).
 */
export function applyAutonumber(
  state: ParseState,
  msg: MessageEvent,
): MessageEvent {
  const auto = state.ast.autonumber;
  if (!auto.enabled) return msg;
  const num = auto.current;
  auto.current += auto.step;
  const dottedLabel = auto.prefix === '' ? undefined : `${auto.prefix}${String(num)}`;
  const label =
    auto.format !== undefined
      ? formatAutonumber(auto.format, num, auto.prefix)
      : dottedLabel;
  return {
    ...msg,
    sequenceNumber: num,
    ...(label !== undefined ? { sequenceLabel: label } : {}),
  };
}

/**
 * `java.text.DecimalFormat` subset: a run of one-or-more `0` characters is
 * the zero-pad placeholder (`new DecimalFormat(df).format(n)`,
 * `CommandAutonumber.java:119-123`); every other character — including
 * creole markup like `<b>`/`<font ...>` — is copied through verbatim. Other
 * `DecimalFormat` pattern characters (`#`, `,`, `.`) are not ported: none
 * appear in the corpus bucket's format strings.
 */
export function formatAutonumber(format: string, num: number, prefix: string): string {
  const digits = prefix === '' ? String(num) : `${prefix}${String(num)}`;
  const run = /0+/.exec(format);
  if (run === null) return format;
  const padded = prefix === '' ? digits.padStart(run[0].length, '0') : digits;
  return format.slice(0, run.index) + padded + format.slice(run.index + run[0].length);
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

/**
 * T13: reverse arrows (`<-`, `<--`, `<<-`, `<<--`). Upstream's `CommandArrow`
 * parses these through the SAME regex as `->` and derives `reverseDefine`
 * from an `<`/`\`/`/` in the LEFT dressing (`hasDressing1butx`,
 * `CommandArrow.java:302,306-314`), then swaps `p1`/`p2` so the message is
 * still constructed sender-to-receiver ("keep the order",
 * `CommandArrow.java:322-325`, citing
 * https://github.com/plantuml/plantuml/issues/1819#issuecomment-2158524871).
 * This port has no unified dressing grammar (see the `MessageEvent` doc
 * comment on `headCircle`/`headCross`), so reverse tokens are a second,
 * dedicated table read by a dedicated command rather than a generalisation
 * of `ARROW_STYLE_MAP`'s forward one. `async` here means "the arrow carries
 * an open (`>>`-style) head", mirrored onto the LEFT `<<` for a reverse
 * token exactly as `sync2 = dressing1.contains("<<")` does at
 * `CommandArrow.java:329-330`.
 * @see sequencediagram/command/CommandArrow.java:296-338
 */
export const REVERSE_ARROW_STYLE_MAP: Readonly<Record<string, MessageStyle>> = {
  '<-': 'sync',
  '<<-': 'async',
  '<--': 'reply',
  '<<--': 'replyAsync',
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

// ---------------------------------------------------------------------------
// autonumber START — dotted numbers (DottedNumber.java, T13)
// ---------------------------------------------------------------------------

/** A parsed `autonumber START` value: everything before the last `\d+` run
 *  (verbatim, including separators like `.`/`-`/`:`) as `prefix`, and the
 *  last run itself as `value` — the only segment `incrementMinor` ever
 *  changes (`DottedNumber.java:75-79`). A plain `"5"` yields `prefix: ''`. */
export interface DottedStart {
  readonly prefix: string;
  readonly value: number;
}

/** @see sequencediagram/DottedNumber.java:53-58 (`create`) */
export function parseDottedStart(raw: string): DottedStart {
  const lastRun = /(\d+)(?!.*\d)/.exec(raw);
  if (lastRun === null || lastRun.index === undefined) return { prefix: '', value: 1 };
  return { prefix: raw.slice(0, lastRun.index), value: Number(lastRun[1]) };
}

// ---------------------------------------------------------------------------
// hide unlinked (CommandHideUnlinked.java, T13)
// ---------------------------------------------------------------------------

/** Every participant id referenced by an event, recursing into frame
 *  branches (an `alt` branch's messages still "link" the participant).
 *  @see sequencediagram/SequenceDiagram.java (removeHiddenParticipants) */
export function linkedParticipantIds(events: readonly SequenceEvent[]): Set<string> {
  const linked = new Set<string>();
  for (const event of events) collectLinkedIds(event, linked);
  return linked;
}

function collectLinkedIds(event: SequenceEvent, linked: Set<string>): void {
  if (event.kind === 'message') {
    linked.add(event.from);
    linked.add(event.to);
  } else if (event.kind === 'note') {
    for (const p of event.participants) linked.add(p);
  } else if (event.kind === 'activate' || event.kind === 'deactivate') {
    linked.add(event.participantId);
  } else if (event.kind === 'frame') {
    for (const branch of event.branches)
      for (const inner of branch) collectLinkedIds(inner, linked);
  }
}

/** `hide unlinked` (`options.hideUnlinked`): drop participants no event
 *  references, and prune them out of any box's `participantIds` too so a
 *  box background doesn't span a column that no longer renders.
 *  @see sequencediagram/command/CommandHideUnlinked.java */
export function applyHideUnlinked(ast: SequenceDiagramAST): void {
  if (ast.options.hideUnlinked !== true) return;
  const linked = linkedParticipantIds(ast.events);
  ast.participants = ast.participants.filter((p) => linked.has(p.id));
  for (const box of ast.boxes) {
    box.participantIds = box.participantIds.filter((id) => linked.has(id));
  }
}
