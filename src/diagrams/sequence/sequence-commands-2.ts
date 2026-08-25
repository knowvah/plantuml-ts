/**
 * Second command dispatch table for the sequence diagram parser (T13,
 * mission dispatch-by-parse-attempt/batch-4). `sequence-commands.ts` owns
 * the ORIGINAL spike table plus in-place widenings of its existing rules
 * (box/autonumber/frame keywords/arrow activation); this file owns commands
 * that did not exist at all before T13 — kept separate purely to stay under
 * the project's 500-line file cap. `parser.ts` runs `COMMANDS` in full
 * before trying any entry here, so nothing below may shadow an existing
 * rule; each pattern here matches ONLY shapes `COMMANDS` does not.
 *
 * Every rule cites the upstream `Command`/`Command`-factory class it ports,
 * per repo convention (`CLAUDE.md#translation-java--typescript`).
 */

import type { MessageEvent, NoteEvent, ParticipantType } from './ast.js';
import {
  activationFlags,
  applyAutonumber,
  emit,
  ensureParticipant,
  parseParticipantDeclaration,
  REVERSE_ARROW_STYLE_MAP,
  type Command,
  type ParseState,
} from './sequence-parse-helpers.js';
import { matchScaleCommand } from '../../core/scale-command.js';

/**
 * `!pragma NAME [VALUE]` — `CommandPragma`, registered on EVERY factory via
 * `CommonCommands.addCommonCommands2` -> `addCommonCommands1`
 * (`SequenceDiagramFactory.java:100`). Recognised as a no-op: of
 * `executeArg`'s three special-cased names (`svgsize`, `graphviz_dot`,
 * `layout`), none is reachable from this port's sequence corpus bucket
 * (183 `teoz true`, 31 `svgparser sax`, 1 `showDeprecation true` — none of
 * `svgsize`/`graphviz_dot`/`layout`), so every instance falls through to the
 * plain `system.getPragma().define(name, value)` branch, which has no
 * representable effect on `SequenceDiagramAST`. Same "recognised, no
 * observable effect" precedent as `state/state-commands.ts`'s rule 3a.
 * @see command/CommandPragma.java:101-134
 */
const pragmaCommand: Command = {
  pattern: /^!pragma\s+[A-Za-z_][A-Za-z_0-9]*(?:\s+.*)?$/,
  execute() {
    /* ignored — see doc comment above */
  },
};

/** `rotate` — `CommandRotate`: accepted for backward compatibility, no
 *  effect. Upstream's own `explainArg` says so explicitly.
 *  @see command/CommandRotate.java:56-71 */
const rotateCommand: Command = {
  pattern: /^rotate\s*$/i,
  execute() {
    /* ignored — upstream's executeArg is a bare CommandExecutionResult.ok() */
  },
};

/** `hide stereotype` — reached in sequence diagrams through
 *  `SequenceDiagramFactory:100` -> `CommonCommands#addCommonCommands1` ->
 *  `addCommonHides` (`CommonCommands.java:103-106`) ->
 *  `CommandHideShowByGender`, whose `stereotype` arm is `:195`. T13 recorded
 *  this as an unmodelled no-op after grepping only `sequencediagram/command/`
 *  and the CommonCommands ADD list, and flagged it for re-checking: the
 *  registration is one level down, in `addCommonHides`. Now honoured —
 *  suppresses the participant stereotype run, which the jar's own goldens
 *  confirm both ways (`secida-27-jaco323` carries `hide stereotype` and shows
 *  bare names; `birocu-87-xubi808` has none and shows `«APIGateway»`). */
const hideStereotypeCommand: Command = {
  pattern: /^hide\s+stereotype\s*$/i,
  execute(state) {
    state.ast.options.hideStereotype = true;
  },
};

/** `hide unlinked` / `show unlinked` / `hide @unlinked` — `CommandHideUnlinked`.
 *  Stored as an option; applied post-parse by `applyHideUnlinked`
 *  (`parser.ts`) so every event has already been visited (an unlinked
 *  participant must see the WHOLE event list, not a prefix of it).
 *  @see sequencediagram/command/CommandHideUnlinked.java:56-61 */
const hideUnlinkedCommand: Command = {
  pattern: /^(hide|show)\s+@?unlinked\s*$/i,
  execute(state, match) {
    state.ast.options.hideUnlinked = match[1]!.toLowerCase() === 'hide';
  },
};

/** `autoactivate on|off` — `CommandAutoactivate`. Recognised and stored;
 *  this port's arrow command does not yet read `diagram.isAutoactivate()`
 *  (`CommandArrow.java:435-439` — the auto-activate-on-plain-arrow branch),
 *  so the flag is currently write-only. Getting the fixture out of the
 *  refusal bucket does not require wiring a reader: the source still
 *  renders (its messages, notes, frames draw normally), just without the
 *  auto-activation bars upstream would additionally draw. */
const autoactivateCommand: Command = {
  pattern: /^autoactivate\s+(on|off)\s*$/i,
  execute() {
    /* recognised, write-only — see doc comment above */
  },
};

/** `scale ...` (6 forms) — shared `scale-command.ts` (`CommonCommands
 *  #addCommonScaleCommands`, registered for every `TitledDiagram` factory
 *  including sequence). Stored as a `ScaleSpec`; resolved to a factor and
 *  applied as an SVG transform at `renderSequence` (see `ast.ts`'s
 *  `SequenceDiagramAST.scale` doc comment for why the multiplier is applied
 *  in THIS engine's own renderer rather than in `src/core/`). */
const scaleCommand: Command = {
  pattern: /^scale\s/i,
  execute(state, match) {
    const spec = matchScaleCommand(match.input);
    if (spec !== undefined) state.ast.scale = spec;
  },
};

/** `newpage [label]` / `@newpage` — `CommandNewpage`. Splits the diagram
 *  into multiple images upstream; this port's layout has no multi-page
 *  concept (a single `SequenceGeometry` per source), so — like `rotate` —
 *  it is recognised and otherwise ignored: the diagram renders as one
 *  continuous page, which is what this port already does for every other
 *  multi-page-capable engine (no engine in this port implements pagination).
 *  @see sequencediagram/command/CommandNewpage.java:60-69 */
const newpageCommand: Command = {
  pattern: /^@?newpage(?:(?:\s*:\s*|\s+).*)?\s*$/i,
  execute() {
    /* ignored — see doc comment above; no multi-page layout exists */
  },
};

/** `create [participant|actor|...] X` — `CommandParticipant`'s CREATE
 *  branch: declares the participant (defaulting to type `participant`) and
 *  triggers a CREATE life event on it (`LifeEventType.CREATE`,
 *  `CommandParticipant.java:194-199`). This port's layout always renders a
 *  participant's header box at the top row regardless of first use, so the
 *  CREATE life event's deferred-appearance visual (the box appearing only
 *  at the create line, `LifeEventType.CREATE`'s handling in
 *  `ComponentRoseParticipant`) is not reproduced — a documented
 *  simplification: `create` behaves as sugar for a plain participant
 *  declaration here, same scope cut as `autoactivate`'s write-only flag.
 *  @see sequencediagram/command/CommandParticipant.java:80-86,142-201 */
const createCommand: Command = {
  pattern:
    /^create\s+(?:(participant|actor|boundary|control|entity|queue|database|collections)\s+)?(.+)$/i,
  execute(state, match) {
    const type = (match[1]?.toLowerCase() ?? 'participant') as ParticipantType;
    const { id, display, color, stereotype } = parseParticipantDeclaration(match[2]!.trim());
    ensureParticipant(state, id, type, { display, color, stereotype });
  },
};

/** `minwidth N` — `CommandMinwidth`, `ignorenewpage`/`autonewpage N` —
 *  `CommandIgnoreNewpage`/`CommandAutoNewpage`, all no-op-for-this-port
 *  siblings of `newpageCommand`: `minwidth` sets a layout hint this port's
 *  layout does not read, `ignorenewpage`/`autonewpage` govern pagination
 *  this port does not implement (see `newpageCommand`'s doc comment).
 *  @see command/CommonCommands.java:71 (minwidth)
 *  @see sequencediagram/command/CommandIgnoreNewpage.java
 *  @see sequencediagram/command/CommandAutoNewpage.java */
const minwidthOrPagingCommand: Command = {
  pattern: /^(?:minwidth\s+\d+|ignorenewpage|autonewpage\s+\d+)\s*$/i,
  execute() {
    /* ignored — see doc comment above */
  },
};

/** `set separator NAME|none` — no dedicated `sequencediagram/command/`
 *  class was found for this form (grepped the package); recognised as a
 *  no-op alongside the other unmodelled directives in this file. Flagged as
 *  a residual worth re-checking in a follow-up. */
const setSeparatorCommand: Command = {
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
 *  leading `REF` background-color group and the inline `[[url]]` are
 *  matched and discarded: `FrameGeo` carries no per-frame color or URL.
 *  @see sequencediagram/command/CommandReferenceOverSeveral.java:67-82 */
function ensureRefParticipants(state: ParseState, raw: string): void {
  const participants = raw
    .split(',')
    .map((s) => s.trim().replace(/^"(.*)"$/, '$1'))
    .filter((s) => s.length > 0);
  for (const p of participants) ensureParticipant(state, p);
}

const refOverCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?\s*:\s*(.*)$/i,
  execute(state, match) {
    ensureRefParticipants(state, match[2]!);
    const label = match[3]!.trim();
    emit(state, { kind: 'frame', frameType: 'ref', label, branches: [[]], branchLabels: [label] });
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
 * `handlePendingNote` does for multi-line notes.
 * @see sequencediagram/command/CommandReferenceMultilinesOverSeveral.java:60-77
 */
const refOverMultilineCommand: Command = {
  pattern: /^ref(#\w+)?\s+over\s+([^:[\]]+?)(?:\s*\[\[.*?\]\])?(?:\s*#\w+)?\s*$/i,
  execute(state, match) {
    ensureRefParticipants(state, match[2]!);
    state.pendingRef = { kind: 'frame', frameType: 'ref', label: '', branches: [[]], branchLabels: [''] };
  },
};

/**
 * Reverse and/or decorated arrows: `A <- B`, `A <-- B`, `A <<- B`,
 * `A <<-- B`, and the `o`/`x` circle/cross decorations on either end
 * (`Alice ->o Bob`, `x-> Alice`, `<-o`, …). `COMMANDS`'s rule 17 already
 * handles plain undecorated forward arrows, so this rule only needs to
 * cover what it does not: a leading `<` (reverse), or an `o`/`x` adjacent
 * to the shaft on either side. `[^\s[\]]+` (not `\S+`) deliberately EXCLUDES
 * bracket-containing tokens, so the exo-arrow forms (`[->`, `->]`, `[o<-x`,
 * …) fall through unmatched rather than being mis-parsed as a literal
 * participant named e.g. `"[o<-x"` — `CommandExoArrowLeft`/
 * `CommandExoArrowRight`/`CommandExoArrowAny` are a distinct, unported
 * command family (T13's report lists them as a residual).
 *
 * Decoration side mapping: a decoration written next to the FIRST token
 * (`leadDecor`) belongs to whichever participant ends up as `from`/`to`
 * after the reverse swap below — mirrors `CommandArrow`'s own
 * `circleAtStart`/`circleAtEnd` swap under `reverseDefine`
 * (`CommandArrow.java:322-338`).
 * @see sequencediagram/command/CommandArrow.java:296-338
 */
interface DecoratedArrowMatch {
  readonly tokenA: string;
  readonly leadDecor: string | undefined;
  readonly leftAngle: string | undefined;
  readonly dashes: string;
  readonly rightAngle: string | undefined;
  readonly trailDecor: string | undefined;
  readonly tokenB: string;
  readonly label: string;
}

/** Decoration/style/direction resolved from a `DecoratedArrowMatch` — the
 *  pure half of `decoratedArrowCommand`, split out to stay under the
 *  complexity hook's per-function limit. Mirrors `CommandArrow`'s
 *  `reverseDefine` swap of `circleAtStart`/`circleAtEnd`
 *  (`CommandArrow.java:322-338`). */
function resolveDecoratedArrow(m: DecoratedArrowMatch): Omit<MessageEvent, 'kind'> {
  const reversed = m.leftAngle !== undefined;
  const arrowKey = `${m.leftAngle ?? ''}${m.dashes}${m.rightAngle ?? ''}`;
  const style =
    (reversed ? REVERSE_ARROW_STYLE_MAP[arrowKey] : undefined) ??
    (m.dashes.length > 1 ? 'reply' : 'sync');
  const head = reversed ? m.leadDecor : m.trailDecor;
  const tail = reversed ? m.trailDecor : m.leadDecor;

  return {
    from: reversed ? m.tokenB : m.tokenA,
    to: reversed ? m.tokenA : m.tokenB,
    label: m.label,
    style,
    ...(head === 'o' ? { headCircle: true } : {}),
    ...(tail === 'o' ? { tailCircle: true } : {}),
    ...(head === 'x' ? { headCross: true } : {}),
    ...(tail === 'x' ? { tailCross: true } : {}),
  };
}

/** Strip one layer of matching double quotes, as `StringUtils
 *  #eventuallyRemoveStartingAndEndingDoubleQuote` does for every quoted
 *  participant token upstream reads. */
function unquote(token: string): string {
  return token.replace(/^"(.*)"$/, '$1');
}

const decoratedArrowCommand: Command = {
  // T13: `(?:&\s*)?` accepts the leading PARALLEL marker
  // (`CommandArrow.java:90`, `ARROW_DRESSING1` group's sibling `PARALLEL`)
  // discarded here — `MessageEvent` has no `goParallel()` flag to carry it
  // to. `(?:\[[^\]]*\])?` skips an inline `[#color]`/`[bold]` style bracket
  // between the dash run and the arrowhead (`CommandArrow.java:106`,
  // `getColorOrStylePattern`) — matched and discarded, same scope cut as
  // the `ref`/`box` color groups elsewhere in this file. Quoted endpoints
  // (`"Application thread" -> "DB connection"`) are unquoted via
  // {@link unquote}. The decoration groups also accept `/`/`//`/`\`/`\\`
  // (upstream's TOP_PART/BOTTOM_PART half-head dressings,
  // `CommandArrow.java:361-365`) so a line carrying one is recognised
  // rather than refused; only `o`/`x` are mapped onto
  // `headCircle`/`headCross` below, so the half-head effect itself is not
  // reproduced (an `ArrowPart` this port's `sequence-arrowhead.ts` already
  // models but nothing in the parser has fed until now — left unfed,
  // documented rather than wired, given T13's time budget).
  // T20 (defect 5 of `diagnosis-24-score-rises.md`): the endpoints are
  // upstream's own `PART1CODE`/`PART2CODE` = `([%pLN_.@]+)`
  // (`CommandArrow.java:93,119`), and an `ACTIVATION` group
  // `(\+\+|\*\*|!!|--|--\+\+|\+\+--)?` follows PART2 (`:126`) exactly as it
  // does on the `->`-only sibling in `sequence-commands.ts`. Without both,
  // `Alice <- Bob--: 500` let `--` be absorbed into the target token and
  // declared a phantom participant named `Bob--`; the loose `[^\s[\]]+`
  // class did the same for any endpoint abutting punctuation.
  pattern:
    /^(?:&\s*)?("[^"]+"|[\p{L}\p{N}_.@]+)\s*([ox]|\\{1,2}|\/{1,2})?(<<?)?(-+)(?:\[[^\]]*\])?(>>?)?([ox]|\\{1,2}|\/{1,2})?\s*("[^"]+"|[\p{L}\p{N}_.@]+?)(\s*(?:\+\+|--\+\+|\+\+--|--|\*\*|!!))?\s*(?::\s*(.*))?$/u,
  execute(state, match) {
    if (match[3] === undefined && match[5] === undefined) return; // not an arrow

    const resolved = resolveDecoratedArrow({
      tokenA: unquote(match[1]!),
      leadDecor: match[2],
      leftAngle: match[3],
      dashes: match[4]!,
      rightAngle: match[5],
      trailDecor: match[6],
      tokenB: unquote(match[7]!),
      label: match[9]?.trim() ?? '',
    });

    ensureParticipant(state, resolved.from);
    ensureParticipant(state, resolved.to);
    // The ACTIVATION suffix applies on this path too -- upstream has ONE
    // `CommandArrow` for both directions, and `manageActivations` reads the
    // RESOLVED p1/p2, i.e. the message's source and target after the
    // reverse-define swap (`CommandArrow.java:315-338,443-456`).
    const msg = applyAutonumber(state, {
      kind: 'message',
      ...resolved,
      ...activationFlags(match[8] ?? '', resolved.from, resolved.to),
    });
    state.lastMessageFrom = resolved.from;
    state.lastMessageTo = resolved.to;
    emit(state, msg);
  },
};

/**
 * `note left`/`note right`/`note top`/`note bottom` (bare — no participant),
 * single- or multi-line — `FactorySequenceNoteOnArrowCommand`: attaches to
 * the LAST event able to carry a note (`SequenceDiagram#getLastEventWithNote`,
 * typically the last message), positioned relative to IT rather than to a
 * named participant. `left`/`right` resolve to the message's `from`/`to`
 * (verified against `sequence/cijozi-08-mavu547`'s golden: `note left` after
 * `A->B` draws at x=40, left of A's lifeline; `note right` at x=154, right
 * of B's). `top`/`bottom` (hover above/below the whole message, spanning
 * both ends) map onto this engine's `over` position with both endpoints —
 * an approximation, since `NoteEvent.position` has no distinct
 * above/below-the-arrow geometry. Silently does nothing when there is no
 * prior message, mirroring `executeInternal`'s own `if (event == null)
 * return ok()`.
 * @see command/note/sequence/FactorySequenceNoteOnArrowCommand.java:209-213
 */
const noteOnArrowCommand: Command = {
  pattern: /^(note|hnote|rnote)(?:<<[^>]*>>)?\s+(left|right|top|bottom)(?:\s+(#\S+))?\s*(?::\s*(.*))?\s*$/i,
  execute(state, match) {
    if (state.lastMessageFrom === null || state.lastMessageTo === null) return;
    const style = match[1]!.toLowerCase();
    const rawPosition = match[2]!.toLowerCase();
    const color = match[3];
    const inlineText = match[4];
    const position: NoteEvent['position'] =
      rawPosition === 'left' ? 'left' : rawPosition === 'right' ? 'right' : 'over';
    const participants =
      position === 'over'
        ? [state.lastMessageFrom, state.lastMessageTo]
        : [position === 'left' ? state.lastMessageFrom : state.lastMessageTo];
    const shape = style === 'note' ? {} : ({ shape: 'rect' } as const);
    const base = {
      kind: 'note' as const,
      position,
      participants,
      ...shape,
      ...(color !== undefined ? { color } : {}),
    };

    if (inlineText !== undefined) {
      emit(state, { ...base, text: inlineText.replace(/\\n/g, '\n') });
    } else {
      state.pendingNote = { ...base, text: '' };
    }
  },
};

/**
 * `note<<stereotype>> left of X` / `rnote over X` / `hnote over X, Y` —
 * `FactorySequenceNoteCommand` (single participant, "of" optional) and
 * `FactorySequenceNoteOverSeveralCommand` (comma list). `COMMANDS`'s rule 8
 * already covers the plain `note left of|right of|over` shape; this rule
 * covers what it does not: a `<<stereotype>>` between the STYLE keyword and
 * the position, and the `rnote`/`hnote` STYLE keywords themselves. The
 * stereotype is matched and discarded — neither shape is modelled on
 * `NoteEvent` (no long-time-user-visible regression: the note itself still
 * renders with its text, only the small stereotype badge is absent).
 * @see command/note/sequence/FactorySequenceNoteCommand.java:81-91
 */
const styledNoteCommand: Command = {
  pattern:
    /^(note|hnote|rnote)(?:<<[^>]*>>)?\s+(left of|right of|over)\s+([^:#\n]+?)(?:\s+(#\w+))?(?:\s*:\s*(.+))?\s*$/i,
  execute(state, match) {
    const style = match[1]!.toLowerCase();
    const rawPos = match[2]!.toLowerCase();
    const position: NoteEvent['position'] =
      rawPos === 'left of' ? 'left' : rawPos === 'right of' ? 'right' : 'over';
    const participants = match[3]!
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    const color = match[4];
    const inlineText = match[5];
    const shape = style === 'note' ? {} : ({ shape: 'rect' } as const);
    const base = { kind: 'note' as const, position, participants, ...shape, ...(color !== undefined ? { color } : {}) };

    if (inlineText !== undefined) {
      emit(state, { ...base, text: inlineText.replace(/\\n/g, '\n') });
    } else {
      state.pendingNote = { ...base, text: '' };
    }
  },
};

/**
 * `note across` / `rnote across` / `hnote across : text` —
 * `FactorySequenceNoteAcrossCommand`: spans every participant declared so
 * far. Modelled as an `over` note listing every currently-known participant
 * id (`computeOverNotePosition`'s multi-participant branch already spans
 * min..max centerX across the given list, which for "every participant" IS
 * upstream's across-the-whole-diagram span).
 * @see command/note/sequence/FactorySequenceNoteAcrossCommand.java:78-88
 */
const noteAcrossCommand: Command = {
  pattern: /^(note|hnote|rnote)\s+a(?:c)?cross\s*(?::\s*(.*))?\s*$/i,
  execute(state, match) {
    const style = match[1]!.toLowerCase();
    const inlineText = match[2];
    const participants = state.ast.participants.map((p) => p.id);
    const shape = style === 'note' ? {} : ({ shape: 'rect' } as const);
    const base = { kind: 'note' as const, position: 'over' as const, participants, ...shape };

    if (inlineText !== undefined) {
      emit(state, { ...base, text: inlineText.replace(/\\n/g, '\n') });
    } else {
      state.pendingNote = { ...base, text: '' };
    }
  },
};

export const COMMANDS_2: readonly Command[] = [
  pragmaCommand,
  rotateCommand,
  hideStereotypeCommand,
  hideUnlinkedCommand,
  autoactivateCommand,
  scaleCommand,
  newpageCommand,
  minwidthOrPagingCommand,
  setSeparatorCommand,
  createCommand,
  refOverCommand,
  refOverMultilineCommand,
  noteOnArrowCommand,
  styledNoteCommand,
  noteAcrossCommand,
  decoratedArrowCommand,
];
