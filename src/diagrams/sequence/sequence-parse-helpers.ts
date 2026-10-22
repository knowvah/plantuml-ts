/**
 * Mutable parse state and shared helpers for the sequence diagram parser.
 *
 * Split out of `parser.ts` (the `COMMANDS` dispatch table lives in
 * the `command-*.ts` family modules) purely to stay under the 500-line file
 * cap; this file owns `ParseState`, the `Command` dispatch-entry shape, and
 * the mutation helpers (`ensureParticipant`, `emit`, `applyAutonumber`, …)
 * that both `parser.ts` and the `command-*.ts` modules depend on.
 */

import { UrlBuilder } from '../../core/url/UrlBuilder.js';
import { UrlMode } from '../../core/url/UrlMode.js';
import type {
  BoxGroup,
  FrameEvent,
  MessageEvent,
  NoteEvent,
  Participant,
  ParticipantType,
  SequenceDiagramAST,
  SequenceEvent,
} from './ast.js';
import type { ArrowConfiguration, ArrowHeadKind } from './sequence-arrowhead.js';
import type { Command as CoreCommand } from '../../core/command/Command.js';
import type { ParticipantUrl } from './sequence-participant-declaration.js';
import type { LifeState } from './sequence-life-state.js';
import { createAnnotations } from '../../core/annotations/index.js';
import { createSpriteRegistry } from '../../core/sprite-commands.js';
import type { InternalSpriteStore } from '../../core/internal-sprite-store.js';
import type { InternalEmojiStore } from '../../core/internal-emoji-store.js';
import { currentStyleBuilder, type SequenceStyleDispatch } from './sequence-skin-param.js';

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
  /** The latest arrow's endpoints -- read by `endCommand`'s note anchor. */
  lastMessageFrom: string | null;
  lastMessageTo: string | null;
  /** T11 (ubrr batch 2): LEFT/RIGHT of the latest `EventWithNote` (`SequenceDiagram
   *  #getLastEventWithNote`, `:154-158`) -- set by `executeArrow`, `refOver*Command`
   *  and `endCommand`/`elseCommand`; read by `noteOnArrowCommand`, which
   *  documents the full three-class mechanism. `null` = none yet. */
  lastEventWithNoteLeft: string | null;
  lastEventWithNoteRight: string | null;
  /** The currently open box group (between `box` and `end box`). */
  currentBox: BoxGroup | null;
  /** Monotonically incrementing counter used to generate unique box ids. */
  boxCounter: number;
  /**
   * T11 (ubrr): a command whose regex MATCHED but whose upstream execution
   * semantics reject the line sets this before returning, mirroring
   * `CommandExecutionResult.error(...)` (`PSystemCommandFactory.java:180-
   * 186`). `dispatchOrdinaryLine` (parser.ts) checks it immediately after
   * every `dispatchCommand` call and turns it into a `kind: 'execution'`
   * `ParseRefusal` -- same precedent as `description`'s own
   * `ParseState.executionError` (`description/parse-state.ts`). `undefined`
   * (the default) means the command that just ran succeeded.
   */
  executionError: string | undefined;
  /** `SequenceDiagram`'s life-event bookkeeping -- `sequence-life-state.ts`. */
  life: LifeState;
  /** The diagram's style `SkinParam`, replayed per command (sdd1 D2/D3):
   *  every node reads `currentStyleBuilder(style)` where its Java
   *  constructor reads `getSkinParam().getCurrentStyleBuilder()`. */
  readonly style: SequenceStyleDispatch;
}

// ---------------------------------------------------------------------------
// Command dispatch entry shape
// ---------------------------------------------------------------------------

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/command/Command.java:42-58 */
export type Command = CoreCommand<ParseState>;

/**
 * The narrow "this pattern's match doesn't count" signal
 * `parseParticipantDeclaration` (`sequence-participant-declaration.ts`)
 * throws for a token order no `CommandParticipantA*` grammar accepts.
 *
 * This is DELIBERATELY NOT the same refusal shape as
 * `state.executionError` (see that field's own doc comment): this port's
 * `participantCommand`/`createCommand` patterns are a single `(.+)$`
 * catch-all, syntactically broader than upstream's four separate
 * `CommandParticipantA..A4` grammars, so they can MATCH a line (`actor ->
 * director`) that upstream's real per-class regexes would have DECLINED at
 * the `isValid`/candidate-selection stage, leaving a LATER command
 * (`CommandArrow`) to claim it instead. `parser.ts`'s `dispatchCommand`
 * catches exactly this class and treats the line as unclaimed by the
 * throwing command, trying the next registered command rather than
 * aborting the whole attempt (T11, ubrr — jar-verified against
 * `bulixe-06-boge494` and five siblings, all `actor -> director`-shaped: a
 * genuine `CommandExecutionResult`-style execution failure would abort
 * immediately, but this is a dispatch-level false positive, not an
 * execution failure).
 *
 * A pure helper reused from THREE call sites
 * (`command-participant.ts`'s `participantCommand`, `createCommand` and
 * `matchParticipantMultilineCommand`) throwing is simpler than plumbing an
 * error-union return through all three; the two `Command.execute` entries
 * leave it uncaught (propagating to `dispatchCommand`), and the
 * pre-dispatch multi-line matcher catches it locally and returns `null`
 * ("this construct did not match" — the line then reaches the SAME throw
 * again via `participantCommand`, through the ordinary table).
 */
export class SequenceCommandRefusal extends Error {}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** D6 (cdd6-T1c): mirrors `class/parser.ts:326-329`'s own pair. */
export function makeDefaultAST(internal?: InternalSpriteStore, emoji?: InternalEmojiStore): SequenceDiagramAST {
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
    sprites: createSpriteRegistry(internal, emoji),
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

/** Ensure a participant exists; create it if it does not, with the builder
 *  current now (`SequenceDiagram.java:126-131,169-172`). */
export function ensureParticipant(
  state: ParseState,
  id: string,
  type: ParticipantType = 'participant',
  decl?: {
    display?: string;
    color?: string | undefined;
    stereotype?: string | undefined;
    url?: ParticipantUrl | undefined;
    order?: number | undefined;
  },
): void {
  if (state.participantIndex.has(id)) return;
  const p: Participant = {
    id,
    display: decl?.display ?? id,
    type,
    order: state.ast.participants.length,
    ...(decl?.order !== undefined && decl.order !== 0 ? { declaredOrder: decl.order } : {}),
    ...(decl?.color !== undefined ? { color: decl.color } : {}),
    ...(decl?.stereotype !== undefined ? { stereotype: decl.stereotype } : {}),
    ...(decl?.url !== undefined ? { url: decl.url } : {}),
    ...(state.currentBox !== null ? { boxId: state.currentBox.id } : {}),
    styleBuilder: currentStyleBuilder(state.style),
  };
  addWithOrder(state, p);
  state.currentBox?.participantIds.push(id);
}

/**
 * `SequenceDiagram#addWithOrder` (`SequenceDiagram.java:182-190`): insert
 * before the first participant whose order is strictly greater, else append.
 * Then re-number `order`/`participantIndex` as the resulting list index.
 */
function addWithOrder(state: ParseState, p: Participant): void {
  const list = state.ast.participants;
  const mine = p.declaredOrder ?? 0;
  const at = list.findIndex((q) => mine < (q.declaredOrder ?? 0));
  if (at === -1) list.push(p);
  else list.splice(at, 0, p);
  list.forEach((q, i) => {
    q.order = i;
    state.participantIndex.set(q.id, i);
  });
}

/**
 * `SequenceDiagram#putParticipantInLast` (`SequenceDiagram.java:548-555`):
 * `participantsList.remove(p); addWithOrder(p);
 * participantEnglobers2.put(p, participantEnglober)`. `addWithOrder`
 * (`:182-190`) re-inserts it by its own declared order. The englober is re-bound to the CURRENT one, which
 * may be none (`put(p, null)`), so `boxId` is dropped when no box is open.
 * `order` is re-numbered as the list index, which is what this port keeps in
 * `order` and `participantIndex`.
 */
export function putParticipantInLast(state: ParseState, id: string): void {
  const participants = state.ast.participants;
  const at = state.participantIndex.get(id);
  if (at === undefined) throw new Error(`putParticipantInLast: unknown participant ${id}`);
  const [p] = participants.splice(at, 1);
  addWithOrder(state, p!);
  const old = state.ast.boxes.find((b) => b.id === p!.boxId);
  if (old !== undefined) old.participantIds = old.participantIds.filter((x) => x !== id);
  if (state.currentBox !== null) {
    p!.boxId = state.currentBox.id;
    state.currentBox.participantIds.push(id);
  } else {
    delete p!.boxId;
  }
}

/** Emit a SequenceEvent into the current scope. */
export function emit(state: ParseState, event: SequenceEvent): void {
  currentEvents(state).push(event);
}

/**
 * Sets `ParseState.lastEventWithNoteLeft`/`Right` to `ids`' first/last
 * entries (T11, ubrr batch 2; see that field's own doc comment). A no-op
 * for an empty list -- must never silently clear a still-valid anchor.
 */
export function setLastEventWithNoteSpan(state: ParseState, ids: readonly string[]): void {
  if (ids.length === 0) return;
  state.lastEventWithNoteLeft = ids[0]!;
  state.lastEventWithNoteRight = ids[ids.length - 1]!;
}

/**
 * `autonumber` with no quoted FORMAT formats with `<b>0</b>`
 * (`CommandAutonumber.java:119`): the number is creole bold, which is why the
 * jar draws it at `font-weight="700"`. `autonumber resume` keeps whatever
 * format is current (`AutoNumber.java:59-72`), and this port's `format`
 * field IS that state, so an absent field means this default.
 */
export const DEFAULT_AUTONUMBER_FORMAT = '<b>0</b>';

/**
 * `AutoNumber#getNextMessageNumber` (`AutoNumber.java:82-89`): format the
 * CURRENT value, then advance by `step` (`DottedNumber#incrementMinor`,
 * `DottedNumber.java:75-79` — the last segment only). The formatted string is
 * the `MessageNumber` `getLabelNumbered` puts first in the display
 * (`AbstractMessage.java:199-207`).
 */
export function applyAutonumber(state: ParseState, msg: MessageEvent): MessageEvent {
  const auto = state.ast.autonumber;
  if (!auto.enabled) return msg;
  const num = auto.current;
  auto.current += auto.step;
  return {
    ...msg,
    sequenceNumber: num,
    sequenceLabel: formatDottedNumber(auto.prefix, num, auto.format ?? DEFAULT_AUTONUMBER_FORMAT),
  };
}

/**
 * `DottedNumber#format(DecimalFormat)`: a single number with no separator
 * goes through the format; a dotted one IGNORES it and is always bold.
 *
 * ```java
 * if (nums.size() == 1 && separators.size() == 0)
 *     return format.format(nums.get(0));
 * return "<b>" + toString() + "</b>";
 * ```
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/sequencediagram/DottedNumber.java:106-111
 */
function formatDottedNumber(prefix: string, num: number, format: string): string {
  if (prefix === '') return formatAutonumber(format, num);
  return `<b>${prefix}${String(num)}</b>`;
}

/**
 * `java.text.DecimalFormat` subset: a run of one-or-more `0` characters is
 * the zero-pad placeholder (`new DecimalFormat(df).format(n)`,
 * `CommandAutonumber.java:119-123`); every other character — including
 * creole markup like `<b>`/`<font ...>` — is copied through verbatim. Other
 * `DecimalFormat` pattern characters (`#`, `,`, `.`) are not ported: none
 * appear in the corpus bucket's format strings.
 */
export function formatAutonumber(format: string, num: number): string {
  const run = /0+/.exec(format);
  if (run === null) return format;
  const padded = String(num).padStart(run[0].length, '0');
  return format.slice(0, run.index) + padded + format.slice(run.index + run[0].length);
}

// ---------------------------------------------------------------------------
// Arrow dressings → ArrowConfiguration (D1)
// ---------------------------------------------------------------------------

/**
 * `CommandArrow.executeArg`'s locals, in the arrow's OWN orientation: index 1
 * is the tail (`circleAtStart`, `sync1`, `dressing1`) and index 2 the head
 * (`circleAtEnd`, `sync2`, `dressing2`), i.e. AFTER the `reverseDefine` swap
 * a caller performs on `p1`/`p2` and on the two dressings
 * (`CommandArrow.java:315-338`). Every member defaults to false, which is
 * exactly the state `withDirectionNormal()` starts from.
 * @see sequencediagram/command/CommandArrow.java:296-338
 */
export interface ArrowSpec {
  /** `dotted = getLength(arg) > 1` — a `--` shaft rather than `-`
   *  (`CommandArrow.java:340`, applied at `:352-353`). */
  readonly dashed?: boolean;
  /** `sync1` — the tail carries an open `<<`/`\\`/`//` head (`:329,336`). */
  readonly async1?: boolean;
  /** `sync2` — the head carries an open `>>`/`\\`/`//` head (`:330,337`). */
  readonly async2?: boolean;
  /** `circleAtStart` (`:327,334`). */
  readonly circle1?: boolean;
  /** `circleAtEnd` (`:328,335`). */
  readonly circle2?: boolean;
  /** `xInDressing1` after the reverse remap (`:373-387`). */
  readonly cross1?: boolean;
  /** `xInDressing2` after the reverse remap (`:373-387`). */
  readonly cross2?: boolean;
  /** `hasDressing1butx && hasDressing2butx`, which selects
   *  `withDirectionBoth()` over `withDirectionNormal()` (`:351`). */
  readonly both?: boolean;
}

/**
 * Build the message's `ArrowConfiguration`, in `executeArg`'s own order:
 * direction first, then body, then the ASYNC heads, then the circles, then
 * the CROSSX heads — each later `withHeadN` overwriting the earlier one,
 * which is why `cross` wins over `async` here (`CommandArrow.java:351-390`).
 *
 * `withDirectionNormal()` starts from an empty `dressing1` and a
 * NORMAL-headed `dressing2`; `withDirectionBoth()` gives both dressings a
 * NORMAL head (`ArrowConfiguration.java:96-105`). `ArrowPart` and
 * `inclination` are left at their defaults: no caller feeds them yet.
 * @see sequencediagram/command/CommandArrow.java:351-393
 */
export function arrowConfigurationOf(spec: ArrowSpec): ArrowConfiguration {
  const head1: ArrowHeadKind =
    spec.cross1 === true ? 'CROSSX' : spec.async1 === true ? 'ASYNC' : spec.both === true ? 'NORMAL' : 'NONE';
  const head2: ArrowHeadKind = spec.cross2 === true ? 'CROSSX' : spec.async2 === true ? 'ASYNC' : 'NORMAL';
  return {
    dressing1: { head: head1, part: 'FULL' },
    dressing2: { head: head2, part: 'FULL' },
    decoration1: spec.circle1 === true ? 'CIRCLE' : 'NONE',
    decoration2: spec.circle2 === true ? 'CIRCLE' : 'NONE',
    dashed: spec.dashed === true,
  };
}

// ---------------------------------------------------------------------------
// participant-family declaration parsing
// ---------------------------------------------------------------------------

/**
 * Split into `sequence-participant-declaration.ts` to stay under the
 * 500-line file cap; re-exported here so `command-participant.ts`/`ast.ts`
 * need no import changes. `SequenceCommandRefusal` above is what that
 * module throws for a token order no `CommandParticipantA*` subclass
 * accepts (T11, ubrr).
 */
export type { ParticipantDeclaration, ParticipantUrl } from './sequence-participant-declaration.js';
export { parseParticipantDeclaration, participantUrlOf } from './sequence-participant-declaration.js';

/**
 * `manageActivations` -- the life-event an `++`/`--`/`**`/`!!` suffix on a
 * message produces.
 *
 * Upstream switches on `spec.charAt(0)` (`CommandArrow.java:446-456`) and
 * then, WHEN THE SPEC IS FOUR CHARACTERS LONG, switches a second time on
 * `spec.charAt(2)` (`:457-466`). So `--++` is TWO life events -- deactivate
 * p1 and activate p2 -- not one, and `++--` likewise. An earlier version of
 * this comment claimed upstream "switches on the FIRST CHARACTER ONLY" and
 * cited `:443-456`, stopping one line short of the code that refutes it; the
 * jar draws two activation rectangles for `Bob -> Carol --++` where this port
 * drew one. Found by T12 of `sequence-command-coverage`.
 *
 * The two directions are NOT symmetric -- `+` activates p2, the message
 * TARGET, while `-` deactivates p1, the message SOURCE (`:447`, `:450`).
 * `*` (CREATE, at `:396`) and `!` (DESTROY, `:453`) both act on the target.
 * CREATE is handled before the message (see the `case` below); DESTROY is
 * the message's `destroys`, a destroy bound to it
 * (`sequence-layout-life-event.ts#messageDestroyCrosses`).
 *
 * Ordering between the two events is not expressible in this return shape and
 * does not need to be: `sequence-layout-message.ts:135-148` keys both to the
 * same `messageGeo.y`, so the closing bar ends and the opening bar starts at
 * one y -- which is what the jar draws (Bob's bar closes at y 93, Carol's
 * opens at y 93).
 */
/**
 * `new UrlBuilder(skinParam("topurl"), STRICT).getUrl(raw)`, reduced to the
 * href `Url#getUrl()` returns. `topurl` is `null`: this port's sequence
 * parser carries no skinparam lookup at command time.
 *
 * Shared by the ordinary and exogenous arrow commands because upstream does
 * the same thing in both -- `msg.setUrl(urlBuilder.getUrl(url))` at
 * `CommandArrow.java:406-408` and `CommandExoArrowAny.java:140-141`. Both
 * store the RESOLVED url, never the raw `[[...]]` run.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/url/UrlBuilder.java:48-49,82-88
 */
export function urlOf(raw: string | undefined): string | undefined {
  if (raw === undefined) return undefined;
  return new UrlBuilder(null, UrlMode.STRICT).getUrl(raw)?.getUrl();
}

/**
 * `autoactivate`'s implicit life event, for an arrow that carried no explicit
 * `++`/`--`/`!` of its own.
 *
 * ```java
 * if (diagram.isAutoactivate() && (config.getHead() == ArrowHead.NORMAL
 *         || config.getHead() == ArrowHead.ASYNC))
 *     if (config.isDotted())
 *         diagram.activate(p1, LifeEventType.DEACTIVATE, null);
 *     else
 *         diagram.activate(p2, LifeEventType.ACTIVATE, activationColor);
 * ```
 *
 * Three conditions, all load-bearing and none of them dropped:
 *
 *  - it is an ELSE of `activationSpec != null` (`CommandArrow.java:432-433`
 *    returns before reaching it), so an explicit suffix always wins — which
 *    is why this returns `{}` for a non-empty `spec`;
 *  - only a `NORMAL` or `ASYNC` head qualifies. `ArrowConfiguration#getHead`
 *    (`:206-211`) prefers `dressing2`'s head and falls back to `dressing1`'s,
 *    so an arrow with no head at all (`->x`, `-[hidden]->`) auto-activates
 *    nothing;
 *  - DOTTED reverses the sense: a dotted arrow is a return, so it
 *    DEACTIVATES its sender rather than activating its receiver.
 *
 * `activationColor` is `LIFECOLOR`, which rides along on the activate leg
 * only — the same asymmetry {@link activationFlags} already carries.
 *
 * @see sequencediagram/command/CommandArrow.java:432-441
 * @see sequencediagram/command/CommandExoArrowAny.java:174-180
 */
export function autoActivationFlags(
  state: ParseState,
  spec: string,
  arrow: ArrowConfiguration,
  from: string,
  to: string,
): { activates?: string; deactivates?: string } {
  if (state.ast.options.autoactivate !== true || spec.trim() !== '') return {};
  const head = arrow.dressing2.head !== 'NONE' ? arrow.dressing2.head : arrow.dressing1.head;
  if (head !== 'NORMAL' && head !== 'ASYNC') return {};
  return arrow.dashed ? { deactivates: from } : { activates: to };
}

export function activationFlags(
  spec: string,
  from: string,
  to: string,
): { activates?: string; deactivates?: string; destroys?: string } {
  const trimmed = spec.trim();
  const flags: { activates?: string; deactivates?: string; destroys?: string } = {};
  switch (trimmed.charAt(0)) {
    case '+':
      flags.activates = to;
      break;
    // NO `case '*'`. `**` is CREATE, and `manageActivations`'s switch has no
    // `*` arm at all (`CommandArrow.java:444-456`): the create is handled
    // BEFORE the message is built (`:397-398`,
    // `diagram.activate(p2, LifeEventType.CREATE, null)`), and
    // `SequenceDiagram#activate` returns immediately for CREATE without
    // touching the life level (`:369-372`). So `A -> B **` draws no
    // activation bar -- `nepica-26-pali815`'s golden is `dummy -> a **` and
    // carries none. Treating `*` as `+` here used to be invisible because the
    // bar it opened was never closed and this port dropped unclosed bars; it
    // stopped being invisible when `flushOpenActivations` started closing
    // them.
    case '-':
      flags.deactivates = from;
      break;
    // `diagram.activate(p2, LifeEventType.DESTROY, null)` (`:453-455`): a
    // DESTROY, not a DEACTIVATE -- `AbstractMessage#isDeactivate` is false for
    // it (`AbstractMessage.java:179-181`), which is what keeps a self `!!`'s
    // step at its end point (`CommunicationTileSelf.java:120-125`).
    case '!':
      flags.destroys = to;
      break;
  }
  // `if (spec.length() == 4)` (`CommandArrow.java:457-466`) -- the second
  // life event of a doubled suffix such as `--++` / `++--`.
  if (trimmed.length === 4) {
    switch (trimmed.charAt(2)) {
      case '+':
        flags.activates = to;
        break;
      case '-':
        flags.deactivates = from;
        break;
    }
  }
  return flags;
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
// hide unlinked / hide stereotype
// ---------------------------------------------------------------------------

/**
 * Split into `sequence-hide-passes.ts` to stay under the 500-line file cap
 * (sdd1 T1b); re-exported here so `parser.ts` and the tests need no import
 * changes.
 */
export { applyHideStereotype, applyHideUnlinked, linkedParticipantIds } from './sequence-hide-passes.js';
