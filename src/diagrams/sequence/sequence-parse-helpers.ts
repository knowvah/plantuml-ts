/**
 * Mutable parse state and shared helpers for the sequence diagram parser.
 *
 * Split out of `parser.ts` (the `COMMANDS` dispatch table lives in
 * the `command-*.ts` family modules) purely to stay under the 500-line file
 * cap; this file owns `ParseState`, the `Command` dispatch-entry shape, and
 * the mutation helpers (`ensureParticipant`, `emit`, `applyAutonumber`, …)
 * that both `parser.ts` and the `command-*.ts` modules depend on.
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
  decl?: { display?: string; color?: string | undefined; stereotype?: string | undefined },
): void {
  if (state.participantIndex.has(id)) return;
  const order = state.ast.participants.length;
  const p: Participant = {
    id,
    display: decl?.display ?? id,
    type,
    order,
    ...(decl?.color !== undefined ? { color: decl.color } : {}),
    ...(decl?.stereotype !== undefined ? { stereotype: decl.stereotype } : {}),
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
  /** The `<<...>>` run, guillemets INCLUDED as upstream captures them
   *  (`StereotypePattern.mandatory` = `(\<\<.+?\>\>)`), or undefined. */
  stereotype: string | undefined;
}

/** `([%pLN_.@]+)` -- upstream's participant CODE class, the same one
 *  `CommandArrow`'s PART1CODE/PART2CODE use
 *  (`CommandParticipantA.java:63`). */
const CODE = String.raw`[\p{L}\p{N}_.@]+`;

/**
 * Strip the tail every participant form shares, right to left.
 *
 * All four of `CommandParticipantA`/`A2`/`A3`/`A4` end with the same run:
 * `StereotypePattern.optional("STEREO")`, `getOrderRegex()`,
 * `UrlBuilder.OPTIONAL`, then `ColorParser.exp1()`
 * (`CommandParticipantA.java:63-69`, and the identical tails on the other
 * three). Peeling it off first is what lets the NAME forms below stay simple
 * -- and is why `participant Alice <<alice>>` used to fall through to the
 * bare-name branch and take the stereotype into the participant's identity,
 * so a later `Alice -> Bob` created a SECOND participant.
 */
function stripParticipantTail(rest: string): {
  head: string;
  color: string | undefined;
  stereotype: string | undefined;
} {
  let head = rest.trim();
  let color: string | undefined;
  let stereotype: string | undefined;
  const color1 = /^(.*?)\s+(#\w+)$/.exec(head);
  if (color1 !== null) { head = color1[1]!.trim(); color = color1[2]; }
  const url = /^(.*?)\s*\[\[.*\]\]$/.exec(head);
  if (url !== null) head = url[1]!.trim();
  const order = /^(.*?)\s+order\s+-?\d{1,7}$/i.exec(head);
  if (order !== null) head = order[1]!.trim();
  const stereo = /^(.*?)\s*(<<.+?>>)$/.exec(head);
  if (stereo !== null) { head = stereo[1]!.trim(); stereotype = stereo[2]; }
  return { head, color, stereotype };
}

/** The NAME part, in upstream's four registered forms. */
function parseParticipantName(head: string): { id: string; display: string } {
  const a = new RegExp(String.raw`^"([^"]+)"\s+as\s+(${CODE})$`, 'u').exec(head);
  if (a !== null) return { display: a[1]!, id: a[2]! };
  const a2 = new RegExp(String.raw`^(${CODE})\s+as\s+"([^"]+)"$`, 'u').exec(head);
  if (a2 !== null) return { id: a2[1]!, display: a2[2]! };
  const a3 = new RegExp(String.raw`^(${CODE})\s+as\s+(${CODE})$`, 'u').exec(head);
  if (a3 !== null) return { display: a3[1]!, id: a3[2]! };
  const a4 = /^"([^"]+)"$/.exec(head);
  if (a4 !== null) return { id: a4[1]!, display: a4[1]! };
  return { id: head, display: head };
}

/**
 * Parse the trailing text of a `participant|actor|...` command.
 *
 * Mirrors the four registered forms -- `["FULL" as] CODE`
 * (`CommandParticipantA`), `CODE as "FULL"` (`A2`), `FULL as CODE` (`A3`) and
 * `"CODE"` (`A4`) -- over the shared tail stripped by
 * {@link stripParticipantTail}.
 */
export function parseParticipantDeclaration(rest: string): ParticipantDeclaration {
  const { head, color, stereotype } = stripParticipantTail(rest);
  return { ...parseParticipantName(head), color, stereotype };
}

/**
 * `manageActivations` -- the life-event an `++`/`--`/`**`/`!!` suffix on a
 * message produces.
 *
 * Upstream switches on the FIRST CHARACTER ONLY (`CommandArrow.java:443-456`),
 * so `--++` is a plain deactivate and `++--` a plain activate; and the two
 * directions are NOT symmetric -- `+` activates p2, the message TARGET, while
 * `-` deactivates p1, the message SOURCE (`:447`, `:450`). `*` (CREATE, at
 * `:396`) and `!` (DESTROY, `:453`) both act on the target; this port has no
 * CREATE/DESTROY variant on `ActivationEvent`, so they collapse onto
 * activate/deactivate as the pre-existing note on the arrow command records.
 */
export function activationFlags(
  spec: string,
  from: string,
  to: string,
): { activates?: string; deactivates?: string } {
  switch (spec.trim().charAt(0)) {
    case '+':
    case '*':
      return { activates: to };
    case '-':
      return { deactivates: from };
    case '!':
      return { deactivates: to };
    default:
      return {};
  }
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

/** `hide stereotype` (`options.hideStereotype`): drop every participant's
 *  stereotype so neither the layout nor the renderer sees one. Applied
 *  post-parse for the same reason `applyHideUnlinked` is — the directive can
 *  appear after the declarations it affects. See `hideStereotypeCommand`
 *  (`command-arrow.ts`) for the upstream registration chain. */
export function applyHideStereotype(ast: SequenceDiagramAST): void {
  if (ast.options.hideStereotype !== true) return;
  for (const p of ast.participants) delete p.stereotype;
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
