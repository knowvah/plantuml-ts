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
import type {
  ArrowConfiguration,
  ArrowHeadKind,
} from './sequence-arrowhead.js';
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
  decl?: {
    display?: string;
    color?: string | undefined;
    stereotype?: string | undefined;
    url?: ParticipantUrl | undefined;
  },
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
    ...(decl?.url !== undefined ? { url: decl.url } : {}),
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
    spec.cross1 === true ? 'CROSSX'
      : spec.async1 === true ? 'ASYNC'
        : spec.both === true ? 'NORMAL' : 'NONE';
  const head2: ArrowHeadKind =
    spec.cross2 === true ? 'CROSSX' : spec.async2 === true ? 'ASYNC' : 'NORMAL';
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
  /** The participant's `[[url{tooltip}]]`, RESOLVED (B3). Carries the tooltip
   *  because the jar's `<a title=...>` is `Url#getTooltip()`, which falls back
   *  to the url itself when none was written (`core/url/Url.ts:35-36`) —
   *  `sefako-72-jono850` emits both forms side by side. */
  url: ParticipantUrl | undefined;
}

/** A resolved participant hyperlink: the href and the tooltip the jar puts in
 *  both `title` and `xlink:title`. Shaped for `core/svg.ts#linkWrap`. */
export interface ParticipantUrl {
  readonly url: string;
  readonly tooltip: string;
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
  url: string | undefined;
} {
  let head = rest.trim();
  let color: string | undefined;
  let stereotype: string | undefined;
  let url: string | undefined;
  const color1 = /^(.*?)\s+(#\w+)$/.exec(head);
  if (color1 !== null) { head = color1[1]!.trim(); color = color1[2]; }
  // B3: the `[[...]]` run is CAPTURED now, not just peeled off. It was
  // discarded here and in both callers, which is why all 89 `<a>` elements in
  // the corpus were missing.
  const urlRun = /^(.*?)\s*(\[\[.*\]\])$/.exec(head);
  if (urlRun !== null) { head = urlRun[1]!.trim(); url = urlRun[2]; }
  const order = /^(.*?)\s+order\s+-?\d{1,7}$/i.exec(head);
  if (order !== null) head = order[1]!.trim();
  const stereo = /^(.*?)\s*(<<.+?>>)$/.exec(head);
  if (stereo !== null) { head = stereo[1]!.trim(); stereotype = stereo[2]; }
  return { head, color, stereotype, url };
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
  const { head, color, stereotype, url } = stripParticipantTail(rest);
  return { ...parseParticipantName(head), color, stereotype, url: participantUrlOf(url) };
}

/**
 * A participant's `[[...]]` run, resolved to href + tooltip (B3).
 *
 * `urlOf` above reduces the same `Url` to its href alone, which is all a
 * MESSAGE needs — a message url is parsed and deliberately not drawn
 * (`renderer-message.ts`). A participant's reaches the SVG, and the jar puts
 * the tooltip in `title` and `xlink:title`, so both halves survive here.
 */
export function participantUrlOf(raw: string | undefined): ParticipantUrl | undefined {
  if (raw === undefined) return undefined;
  const resolved = new UrlBuilder(null, UrlMode.STRICT).getUrl(raw);
  if (resolved === null || resolved === undefined) return undefined;
  return { url: resolved.getUrl(), tooltip: resolved.getTooltip() };
}

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
 * `*` (CREATE, at `:396`) and `!` (DESTROY, `:453`) both act on the target;
 * this port has no CREATE/DESTROY variant on `ActivationEvent`, so they
 * collapse onto activate/deactivate as the pre-existing note on the arrow
 * command records.
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
  const head =
    arrow.dressing2.head !== 'NONE' ? arrow.dressing2.head : arrow.dressing1.head;
  if (head !== 'NORMAL' && head !== 'ASYNC') return {};
  return arrow.dashed ? { deactivates: from } : { activates: to };
}

export function activationFlags(
  spec: string,
  from: string,
  to: string,
): { activates?: string; deactivates?: string } {
  const trimmed = spec.trim();
  const flags: { activates?: string; deactivates?: string } = {};
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
    case '!':
      flags.deactivates = to;
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
  } else if (event.kind === 'messageExo') {
    // `isAlone` asks every event `dealWith(p)`, and `MessageExo.dealWith`
    // answers `participant == someone` (`MessageExo.java:90-92`) — so an exo
    // message links its ONE endpoint and nothing else.
    // @see sequencediagram/SequenceDiagram.java:535-541
    linked.add(event.participant);
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
