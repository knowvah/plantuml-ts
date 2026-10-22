/**
 * The individually-registered commands of `initCommandsList`'s trailing run
 * that are neither pagination nor autonumber: `CommandDivider` (`:142`),
 * `CommandHSpace` (`:143`), `CommandReferenceOverSeveral` (`:144`),
 * `CommandReferenceMultilinesOverSeveral` (`:145`), `CommandAutoactivate`
 * (`:150`), `CommandFootbox` (`:151`) and `CommandDelay` (`:152`) — plus
 * `CommandHideEmptyDescription`, reached via `SequenceDiagramFactory.java:100`
 * -> `CommonCommands#addCommonCommands1` (`command/CommonCommands.java:58`)
 * -> `addCommonHides` (`:104`), the same `addCommonHides` fan-out that
 * `command-common.ts` already documents for `hide stereotype`/`hide
 * unlinked` (T13). Grouped here rather than in `command-common.ts` because
 * that module is outside this task's write-set (T10, misc-commands).
 *
 * `CommandFootboxOld` (`:153`) and `CommandLinkAnchor` (`:155`) close that run
 * upstream and have no rule here yet; `CommandUrl` (`:154`) is `urlCommand`. `setSeparatorCommand` has no counterpart anywhere in the sequence
 * registration list — see its own doc comment.
 *
 * `dividerCommand`, `delayWithTextCommand`/`bareDelayCommand` and
 * `spaceCommand` were widened by T10 to match their upstream regex exactly
 * (empty divider label, the `…` ellipsis alternative on `CommandDelay`, and
 * `CommandHSpace`'s `\|+` one-or-more trailing pipes) — each cites its Java
 * `file:line` at its own declaration below.
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:100-153
 */

import type { DelayEvent, DividerEvent, FrameEvent, SpaceEvent } from './ast.js';
import { currentStyleBuilder } from './sequence-skin-param.js';
import { HColorSet } from '../../core/klimt/color/HColorSet.js';
import { NoSuchColorException } from '../../core/klimt/color/NoSuchColorException.js';
import { getRegexp as urlRegexp, transform as urlTransform } from '../../core/url/UrlBuilder.js';
import { NO_SUCH_COLOR } from './command-note-factory.js';
import {
  emit,
  ensureParticipant,
  participantUrlOf,
  setLastEventWithNoteSpan,
  type Command,
  type ParseState,
} from './sequence-parse-helpers.js';

// 2. hide footbox
export const hideFootboxCommand: Command = {
  pattern: /^hide\s+footbox\s*$/i,
  execute(state) {
    state.ast.options.hideFootbox = true;
  },
};

/**
 * `hide|show empty description` — `CommandHideEmptyDescription`. Sequence
 * diagrams have no state "description" compartment (that concept belongs to
 * `StateDiagram`), so this port has nothing to suppress: recognised as a
 * no-op, same "recognised, no observable effect" precedent as
 * `command-common.ts`'s `pragmaCommand`/`rotateCommand`. T10 measured the
 * only pinned fixture (`boxibe-39-luco835`) reaching this line and confirmed
 * it is exactly this command, not `CommandHideShowByGender`'s `hide
 * stereotype` arm (`command-common.ts`'s `hideStereotypeCommand`) or
 * `CommandHideUnlinked`'s `hide unlinked` arm — those are distinct keywords
 * ("stereotype"/"unlinked" vs. "empty description") with no overlap.
 * @see command/CommonCommands.java:58,104
 * @see statediagram/command/CommandHideEmptyDescription.java:57-63
 */
export const hideEmptyDescriptionCommand: Command = {
  pattern: /^(?:hide|show)\s+empty\s+description\s*$/i,
  execute() {
    /* ignored — no state descriptions exist in a sequence diagram */
  },
};

/**
 * `== text ==` — `CommandDivider`. The LABEL group is `(.*)` upstream, i.e.
 * it accepts an EMPTY label (`====` with nothing between the two `==` runs);
 * this port previously required at least one character (`(.+?)`), which
 * refused `valiva-41-fabo221`'s line 4 `====`. It is also GREEDY, so the spaces
 * before the closing `==` stay in the label (`== diver 1 ==` -> `diver 1 `),
 * and the box is one space wider (`DriverTextSvg` then trims the drawn text).
 * @see sequencediagram/command/CommandDivider.java:57-62
 */
export const dividerCommand: Command = {
  pattern: /^==\s*(.*)\s*==\s*$/,
  execute(state, match) {
    const ev: DividerEvent = {
      kind: 'divider',
      // `CommandDivider#executeArg` runs the label through
      // `Display.getWithNewlines`, so a literal `\n` is a LINE BREAK, not two
      // characters -- `pigifu-13-kele137`'s `== divi\nlines ==` draws a
      // two-line label box in the jar. Unescaped here, at parse time, exactly
      // as `command-note-factory.ts:119` already does for note bodies.
      //
      // `getWithNewlines` also maps `\t` to a tab, `\\` to a backslash, and
      // `\r`/`\l` to a break that additionally sets the block's natural
      // horizontal alignment (`Display.java:288-313`). None of those is
      // handled here: no sequence label in this port handles them, and making
      // the divider the sole exception would be a worse divergence than the
      // shared gap. Engine-wide, filed with the other sequence text gaps.
      text: match[1]!.replace(/\\n/g, '\n'),
      styleBuilder: currentStyleBuilder(state.style), // `SequenceDiagram.java:270`
    };
    // `SequenceDiagram#divider` (`:270-276`): a divider closes off the
    // message before it for a bare life event that follows.
    state.life.lastEventWithDeactivate = 'notMessage';
    emit(state, ev);
  },
};

/**
 * `...text...` / `…text…` — `CommandDelay`'s labelled form. Upstream is ONE
 * regex, `^(?:\.{3}|…)(?:(.*)(?:\.{3}|…))?$` (leading delimiter, then an
 * OPTIONAL [LABEL + trailing delimiter] group); this port keeps the
 * pre-existing two-entry split (`delayWithTextCommand` / `bareDelayCommand`
 * below) rather than consolidating into one dispatch entry, to avoid
 * renaming exports `sequence-command-registry.ts` (T7's write-set this
 * batch) already references — not a structural divergence, since the two
 * patterns are provably disjoint (this one requires >=1 char or an ellipsis
 * after the leading delimiter; the bare form below requires exactly zero),
 * so dispatch order between them is immaterial. Widened over the prior
 * version in two ways: (1) either delimiter, independently, on either side
 * — neither side has to match the other, since upstream's regex does not
 * require it; (2) the LABEL group may be EMPTY (`......` — six transcribed
 * dots: leading `...` + trailing `...` with nothing between), which the
 * previous `(.+?)\s*\.\.\.\s*$` `(.+?)` (1-or-more) refused.
 * `loguci-83-mobe896`'s `…title…` (line 4) needed the delimiter widening;
 * `dolefo-13-kovu702`'s `......` (line 11, times three) needed the
 * empty-label widening. The anchored `$` means the split between LABEL and
 * its trailing delimiter is unique regardless of greedy vs. lazy, so a
 * direct transcription of upstream's greedy `(.*)` is faithful.
 * @see sequencediagram/command/CommandDelay.java:57-61
 */
export const delayWithTextCommand: Command = {
  pattern: /^(?:\.{3}|…)(.*)(?:\.{3}|…)$/,
  execute(state, match) {
    const ev: DelayEvent = { kind: 'delay', text: match[1]!, styleBuilder: currentStyleBuilder(state.style) };
    state.life.lastDelay = true; // `SequenceDiagram#delay` (`:288-292`)
    emit(state, ev);
  },
};

/**
 * Bare `...` / `…` — `CommandDelay`'s unlabelled form (upstream's optional
 * LABEL group absent entirely, `arg.get("LABEL", 0) == null` ->
 * `Display.empty()`). Widened to accept the Unicode ellipsis alternative,
 * which the prior `/^\.\.\.\s*$/` did not — `loguci-83-mobe896`'s bare `…`
 * (line 2).
 * @see sequencediagram/command/CommandDelay.java:57-61
 */
export const bareDelayCommand: Command = {
  pattern: /^(?:\.{3}|…)$/,
  execute(state) {
    const ev: DelayEvent = { kind: 'delay', styleBuilder: currentStyleBuilder(state.style) }; // `:289`
    state.life.lastDelay = true; // `SequenceDiagram#delay` (`:288-292`)
    emit(state, ev);
  },
};

/**
 * `||N||` / `|||` — `CommandHSpace`. The trailing pipe run is `\|+`
 * upstream (one or more), not exactly one; this port required exactly one
 * trailing pipe, which refused `xucibo-16-zisi974`'s `||50||` (two trailing
 * pipes) and `fotiku-67-lilu728`/`telavi-12-pifu671`'s `||0||`. Widened to
 * `\|+` to match. The default-pixel value (5 here vs. upstream's documented
 * 25, `CommandHSpace.java:69`) is untouched — out of this widening's scope,
 * and none of the pinned fixtures exercise the bare-default path.
 * @see sequencediagram/command/CommandHSpace.java:56-61
 */
export const spaceCommand: Command = {
  pattern: /^\|\|(\d+)?\|+$/,
  execute(state, match) {
    const pixels = match[1] !== undefined ? parseInt(match[1], 10) : 5;
    const ev: SpaceEvent = { kind: 'space', pixels };
    emit(state, ev);
  },
};

/** `autoactivate on|off` — `CommandAutoactivate`, i.e.
 *  `SequenceDiagram#setAutoactivate` (`:556-563`). Read by
 *  `command-arrow.ts`/`command-exo-arrow.ts`'s
 *  {@link autoActivationFlags}: while on, an arrow with no explicit
 *  `++`/`--`/`!` gets one implicitly (`CommandArrow.java:435-439`). */
export const autoactivateCommand: Command = {
  pattern: /^autoactivate\s+(on|off)\s*$/i,
  execute(state, match) {
    state.ast.options.autoactivate = match[1]!.toLowerCase() === 'on';
  },
};

/** `set separator NAME|none` — no dedicated `sequencediagram/command/`
 *  class was found for this form (grepped the package); recognised as a
 *  no-op alongside the other unmodelled directives in this file. Flagged as
 *  a residual worth re-checking in a follow-up. */
export const setSeparatorCommand: Command = {
  pattern: /^set\s+separator\s+\S+\s*$/i,
  execute() {
    /* ignored — see doc comment above */
  },
};

/** `ref over A, B [, C...] : text` — `CommandReferenceOverSeveral`. Modelled
 *  as a one-branch, empty-body `FrameEvent` (`frameType: 'ref'`) whose label
 *  carries the text: `FrameGeo`'s layout already spans the full participant
 *  range for every frame type (`sequence-layout-events.ts
 *  #handleFrameEvent`), which is coarser than upstream's exact A..B span but
 *  matches this engine's STANDING simplification for every other frame kind
 *  (`loop`/`alt`/… already span the whole diagram width, not just their
 *  referenced participants) — not a new divergence introduced here. The
 *  inline `[[url]]` is matched and discarded: `FrameGeo` carries no URL.
 *  The leading `REF` colour is the reference's `backColorElement`
 *  ({@link refBackColorElement}).
 *
 *  Returns the resolved participant ids (T11, ubrr batch 2): `Reference
 *  implements EventWithNote` (`Reference.java:54`), so its own
 *  `participants` list is one of the three upstream `getLastEventWithNote`
 *  anchors (`ParseState.lastEventWithNoteLeft`'s doc comment); `Reference
 *  #addNote` accepts only LEFT/RIGHT (`:166-171`, never TOP/BOTTOM/OVER),
 *  which is why first/last of THIS list -- not the whole diagram -- is the
 *  right span for a `ref`-anchored note.
 *  @see sequencediagram/command/CommandReferenceOverSeveral.java:67-82 */
function ensureRefParticipants(state: ParseState, raw: string): string[] {
  const participants = raw
    .split(',')
    .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
    .filter((s) => s.length > 0);
  for (const p of participants) ensureParticipant(state, p);
  return participants;
}

/**
 * The `REF` group, resolved where both ref commands resolve it, before any
 * participant is created: `getIHtmlColorSet().getColor(s1)`
 * (`CommandReferenceOverSeveral.java:118-119`,
 * `CommandReferenceMultilinesOverSeveral.java:130-131`). An unknown colour
 * throws `NoSuchColorException`, the command's `badColor()`
 * (`SingleLineCommand2.java:174-177`, `AbstractDiagram.java:173-178`), so
 * the line refuses (`state.executionError`) and `refused` is returned. The
 * colour is kept raw, resolved late (`ref-body-geo.ts#referencePaints` lays
 * it over the header's `BackGroundColor`, `Reference.java:99-101`).
 */
function refBackColorElement(state: ParseState, raw: string | undefined): { readonly color?: string } | 'refused' {
  if (raw === undefined) return {};
  try {
    HColorSet.instance().getColor(raw);
  } catch (e) {
    if (!(e instanceof NoSuchColorException)) throw e;
    state.executionError = NO_SUCH_COLOR;
    return 'refused';
  }
  return { color: raw };
}

/** A `Reference` (`Reference.java:104-106`) with the builder current now. */
function refFrame(state: ParseState, label: string, participants: string[], backColorElement?: string): FrameEvent {
  const styleBuilder = currentStyleBuilder(state.style);
  const branchStyleBuilders = [styleBuilder];
  return {
    kind: 'frame',
    frameType: 'ref',
    label,
    branches: [[]],
    branchLabels: [label],
    participants,
    styleBuilder,
    branchStyleBuilders,
    ...(backColorElement !== undefined ? { backColorElement } : {}),
  };
}

export const refOverCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?\s*:\s*(.*)$/i,
  execute(state, match) {
    const back = refBackColorElement(state, match[1]);
    if (back === 'refused') return;
    const participants = ensureRefParticipants(state, match[2]!);
    setLastEventWithNoteSpan(state, participants);
    const label = match[3]!.trim();
    emit(state, refFrame(state, label, participants, back.color)); // `CommandReferenceOverSeveral.java:140-141`
  },
};

/**
 * `ref over A, B [, C...]` with NO trailing `: text` — the multi-line
 * opener, `CommandReferenceMultilinesOverSeveral`. Its closer is `end` /
 * `end ref` / `endref` (`Pattern2.cmpile("^end[%s]?(ref)?$")`,
 * `:79-80`) — a BARE `end` closes it too, which is why this uses its own
 * `state.pendingRef` slot rather than `state.frameStack`: pushing onto
 * `frameStack` would let the dispatch loop try to parse the ref's plain-text
 * BODY lines as ordinary commands (they are prose, e.g. "This can be on" /
 * "several lines" — not `Command`-shaped), refusing on the first one.
 * `handlePendingRef` (`parser.ts`) intercepts body lines the same way
 * `handlePendingNote` does for multi-line notes. The `EventWithNote` span
 * (T11, ubrr batch 2) is set HERE, at the opening line, not at `end ref`:
 * upstream's `Reference` object is built from the header regex's own
 * PARTICIPANT group regardless of which command variant closes it, and its
 * identity (hence its note anchor) does not depend on the body text.
 * @see sequencediagram/command/CommandReferenceMultilinesOverSeveral.java:60-77
 */
export const refOverMultilineCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?(?:\s*#\w+)?\s*$/i,
  execute(state, match) {
    const back = refBackColorElement(state, match[1]);
    if (back === 'refused') return;
    const participants = ensureRefParticipants(state, match[2]!);
    setLastEventWithNoteSpan(state, participants);
    // Captured at the opener: upstream executes the whole block as one
    // command (`CommandReferenceMultilinesOverSeveral.java:152-153`).
    state.pendingRef = refFrame(state, '', participants, back.color);
  },
};

/** `url of CODE is [[url]]` -- `CommandUrl`: attaches a link to a participant
 *  (declaring it when absent, `getOrCreateParticipant` `:94`) by
 *  `p.setUrl(...)` (`:97`), so it replaces any url the declaration gave. The
 *  head is then wrapped in `<a>` by the path a `participant X [[url]]` already
 *  takes (`Participant#url`). CODE is NOT unquoted (`:93`, `explainArg`).
 *  The URL leaf is `UrlBuilder.MANDATORY` -- `(` + `getRegexp()` + `)`
 *  (`UrlBuilder.java:48`). `topurl` is not modelled, as for participants.
 *  @see sequencediagram/command/CommandUrl.java:60-70,88-100 */
export const urlCommand: Command = {
  pattern: new RegExp(
    urlTransform(String.raw`^url\s*(?:of|for)?\s+([\p{L}\p{N}_.@]+|[%g][^%g]+[%g])\s+(?:is)?\s*(${urlRegexp()})$`),
    'iu',
  ),
  execute(state, match) {
    const code = match[1]!;
    ensureParticipant(state, code);
    const p = state.ast.participants[state.participantIndex.get(code)!]!;
    const url = participantUrlOf(match[2]);
    if (url === undefined) delete p.url;
    else p.url = url;
  },
};
