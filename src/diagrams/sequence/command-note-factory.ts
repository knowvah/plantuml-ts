/**
 * The note-command factories. Upstream builds these from four factory
 * objects, each registered twice — a single-line form early and a multi-line
 * form later — which is why the family spans four separate slots in
 * `SequenceDiagramFactory#initCommandsList`:
 *
 *  - `FactorySequenceNoteCommand#createSingleLine` (`:117`),
 *    `FactorySequenceNoteOverSeveralCommand#createSingleLine` (`:120`),
 *    `FactorySequenceNoteAcrossCommand#createSingleLine` (`:122`)
 *  - `FactorySequenceNoteOnArrowCommand#createSingleLine` (`:132`)
 *  - the four `createMultiLine(false)` registrations (`:134-137`)
 *
 * @see ~/git/plantuml/.../sequencediagram/SequenceDiagramFactory.java:116-137
 */

import type { NoteEvent } from './ast.js';
import { emit, type Command } from './sequence-parse-helpers.js';

// ---------------------------------------------------------------------------
// Shared fragments: `ColorParser`'s two grammars and the `<<stereo>>` token.
// ---------------------------------------------------------------------------

/**
 * `ColorParser.COLOR_REGEXP` — a plain `#name` background color, OR a
 * two-stop gradient like `#yellow/blue` (one `-`/`\`/`|`/`/` separator
 * between two word runs).
 * @see klimt/color/ColorParser.java:44
 */
const NOTE_COLOR_ATOM = String.raw`#\w+[-\\|/]?\w+`;

/**
 * `ColorParser.PART2` — the compound `key:value(;key:value)*` form used by
 * `#green;line:lightblue` and `#back:green;line:lightblue`: an optional
 * leading plain color plus `;`, then one-or-more `keyword[:value]` pairs
 * drawn from the fixed `ColorParam`-backed keyword set.
 * @see klimt/color/ColorParser.java:45
 */
const NOTE_COLOR_COMPOUND =
  String.raw`#(?:\w+[-\\|/]?\w+;)?(?:(?:text|back|header|line|line\.dashed|line\.dotted|line\.bold|shadowing)(?::\w+[-\\|/]?\w+)?(?:;|(?![\w;:.])))+`;

/**
 * `ColorParser.COLORS_REGEXP = PART2 | COLOR_REGEXP` — compound tried
 * first, same alternation order upstream uses.
 * @see klimt/color/ColorParser.java:46
 */
const NOTE_COLOR = `(?:${NOTE_COLOR_COMPOUND})|(?:${NOTE_COLOR_ATOM})`;

/** `StereotypePattern.mandatory` — `<<...>>`, non-greedy so two
 *  stereotype-shaped runs on one line don't merge into one match.
 *  @see stereo/StereotypePattern.java:67 */
const NOTE_STEREO = String.raw`<<.+?>>`;

/** `StringUtils#eventuallyRemoveStartingAndEndingDoubleQuote` — strip one
 *  layer of matching double quotes off a participant token, so a quoted
 *  note target (`note left "Long Alice"`) resolves to the SAME id a
 *  quoted arrow endpoint creates (`command-arrow.ts`'s local `unquote`
 *  ports the identical upstream method for that command family). */
function unquote(token: string): string {
  return token.replace(/^"(.*)"$/, '$1');
}

// 8. note left of / right of / over
//
//    Single-line form (inline text after colon):
//      note left of Alice: some text
//      note over Alice, Bob: some text
//      note over Bob #yellow: colored note
//
//    Multi-line form (no colon on the header line):
//      note left of Alice [#color]
//      ...lines...
//      end note
//
//    Groups:
//      1 — position keyword (left of | right of | over)
//      2 — participant list (stops before : or #)
//      3 — optional color (NOTE_COLOR — plain or compound)
//      4 — optional inline text (everything after ": ")
//
// T8: the color group now shares `NOTE_COLOR` with `styledNoteCommand`
// rather than a bare `#\w+`. A plain `#\w+` color group left this command
// (tried FIRST in the registry) able to PARTIALLY match a compound color
// spec like `#back:green;line:lightblue` -- it captured only `#back` and
// swallowed the rest of the line (`:green;line:lightblue : text2`) as if
// it were a second `:`-prefixed text block, producing a wrong AST instead
// of falling through to `styledNoteCommand`'s correct compound handling.
// The participant class also now excludes `<`, same as `styledNoteCommand`
// -- this command models no stereotype, so a line carrying one (`note over
// Alice <<red>>: x`) must FAIL here and fall through, not silently swallow
// the `<<red>>` run into the participant id.
export const noteCommand: Command = {
  pattern: new RegExp(
    String.raw`^note\s+(left of|right of|over)\s+([^:#<\n]+?)(?:\s*(${NOTE_COLOR}))?(?:\s*:\s*(.+))?\s*$`,
    'i',
  ),
  execute(state, match) {
    const rawPos = match[1]!.toLowerCase();
    const position: NoteEvent['position'] =
      rawPos === 'left of'
        ? 'left'
        : rawPos === 'right of'
          ? 'right'
          : 'over';
    const rawParticipants = match[2]!;
    const color = match[3];
    const inlineText = match[4];

    // T8: unquote each entry so a quoted participant (`note over Bob,
    // "Long Alice"`) resolves to the SAME id `"Long Alice" -> Bob` created,
    // rather than a second, quote-literal participant.
    const participants = rawParticipants
      .split(',')
      .map((s) => unquote(s.trim()))
      .filter((s) => s.length > 0);

    if (inlineText !== undefined) {
      // Single-line form: replace literal \n escape sequences with real newlines,
      // then emit the note immediately.
      const text = inlineText.replace(/\\n/g, '\n');
      const ev: NoteEvent = {
        kind: 'note',
        position,
        participants,
        text,
        ...(color !== undefined ? { color } : {}),
      };
      emit(state, ev);
    } else {
      // Multi-line form: open a pending note; subsequent lines accumulate until
      // "end note".
      state.pendingNote = {
        kind: 'note',
        position,
        participants,
        text: '',
        ...(color !== undefined ? { color } : {}),
      };
    }
  },
};

// 9. end note — closes a multi-line note. T13: also accepts the
//    style-qualified closers `end hnote`/`end rnote` and the unspaced
//    `endnote`/`endhnote`/`endrnote` forms, mirroring
//    `Pattern2.cmpile("^end[%s]?(note|hnote|rnote)$")`.
// @see command/note/sequence/FactorySequenceNoteCommand.java:117
export const endNoteCommand: Command = {
  pattern: /^end\s*(?:note|hnote|rnote)\s*$/i,
  execute(state) {
    if (state.pendingNote !== null) {
      emit(state, state.pendingNote);
      state.pendingNote = null;
    }
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
 *
 * T8: the `<<stereo>>` group is `StereotypePattern.optional`, which wraps
 * BOTH sides in `spaceZeroOrMore()` — so `note <<red>> left` (stereotype
 * BEFORE the position) needs a space allowed between `note` and `<<red>>`,
 * which the original `(?:<<[^>]*>>)?` (no leading `\s*`) did not permit.
 * A second, independent stereotype slot exists AFTER the position too
 * (`note left <<red>>`) — upstream's STEREO2 — previously unported.
 * `arg.getLazzy("STEREO", 0)` returns whichever of STEREO1/STEREO2 fired.
 * `style` is now stored on the event too — `executeInternal` resolves
 * `NoteStyle.getNoteStyle(STYLE)` and feeds it straight into `new
 * Note(display, position, style, ...)` (`:221,225`), same as every other
 * note command in this family.
 * @see command/note/sequence/FactorySequenceNoteOnArrowCommand.java:78-103,221,225
 */
export const noteOnArrowCommand: Command = {
  pattern: new RegExp(
    String.raw`^(note|hnote|rnote)\s*(${NOTE_STEREO})?\s*(left|right|top|bottom)\s*(${NOTE_STEREO})?(?:\s*(${NOTE_COLOR}))?\s*(?::\s*(.*))?\s*$`,
    'i',
  ),
  execute(state, match) {
    if (state.lastMessageFrom === null || state.lastMessageTo === null) return;
    const style = match[1]!.toLowerCase();
    const stereo1 = match[2];
    const rawPosition = match[3]!.toLowerCase();
    const stereo2 = match[4];
    const color = match[5];
    const inlineText = match[6];
    const stereotype = stereo1 ?? stereo2;
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
      style: style as 'note' | 'hnote' | 'rnote',
      ...shape,
      ...(color !== undefined ? { color } : {}),
      ...(stereotype !== undefined ? { stereotype } : {}),
    };

    if (inlineText !== undefined) {
      emit(state, { ...base, text: inlineText.replace(/\\n/g, '\n') });
    } else {
      state.pendingNote = { ...base, text: '' };
    }
  },
};

/**
 * `[&][/] (note|hnote|rnote) [<<stereo>>] (left|right|over) [of] X[,Y] [<<stereo>>]
 * [#color] [: text]` — `FactorySequenceNoteCommand`, the fully general form.
 * `COMMANDS`'s rule 8 (`noteCommand`) already fast-paths the common
 * `note left of|right of|over` shape with no markers; this rule is the
 * canonical one and catches everything that needs at least one of the four
 * previously-unported groups:
 *
 *  - PARALLEL `(&[%s]*)?` — a leading `&` marks the note concurrent with the
 *    arrow above it (teoz-only rendering, D4: parsed and stored, not drawn).
 *  - VMERGE `(/)?` — a leading `/` merges this note vertically with the
 *    previous one (`tryMerge` -> `diagram.addNote(note, tryMerge)`).
 *  - PARTICIPANT `(?:of[%s]+)?(...)` — `of` is OPTIONAL: `note left Alice`
 *    is as valid as `note left of Alice`. This port keeps its own
 *    pre-existing generalization of allowing a comma list here (upstream
 *    splits that into a SEPARATE two-participant-only class,
 *    `FactorySequenceNoteOverSeveralCommand`, itself PARALLEL/VMERGE/STYLE
 *    symmetric with this one at `:76-117`) — a superset, not a regression.
 *  - STYLE `(note|hnote|rnote)` — `hnote`/`rnote` were already accepted
 *    here; what was missing is `of`-optional PARTICIPANT and PARALLEL/VMERGE
 *    applying to them too (`hnote left Alice`, `& rnote over Bob`).
 *  - StereotypePattern (STEREO1 before POSITION, STEREO2 after PARTICIPANT)
 *    — `note <<stereo>> left of X` / `note left of X <<stereo>>`.
 *    `arg.getLazzy("STEREO", 0)` picks whichever fired.
 *
 * COLOR now accepts `ColorParser`'s full grammar (`NOTE_COLOR`), not just a
 * single `#word` preceded by whitespace — `C#tomato` (zero space) and
 * `#green;line:lightblue` (compound spec) both parse.
 * @see command/note/sequence/FactorySequenceNoteCommand.java:76-98
 */
export const styledNoteCommand: Command = {
  pattern: new RegExp(
    String.raw`^(?:(&)\s*)?(?:(/)\s*)?(note|hnote|rnote)\s*(${NOTE_STEREO})?\s*(left|right|over)\s+(?:of\s+)?([^:#<\n]+?)\s*(${NOTE_STEREO})?(?:\s*(${NOTE_COLOR}))?\s*(?::\s*(.+))?\s*$`,
    'i',
  ),
  execute(state, match) {
    const parallel = match[1] !== undefined;
    const vmerge = match[2] !== undefined;
    const style = match[3]!.toLowerCase();
    const stereo1 = match[4];
    const rawPos = match[5]!.toLowerCase();
    const stereo2 = match[7];
    const color = match[8];
    const inlineText = match[9];
    const position: NoteEvent['position'] =
      rawPos === 'left' ? 'left' : rawPos === 'right' ? 'right' : 'over';
    const participants = match[6]!
      .split(',')
      .map((s) => unquote(s.trim()))
      .filter((s) => s.length > 0);
    const stereotype = stereo1 ?? stereo2;
    const shape = style === 'note' ? {} : ({ shape: 'rect' } as const);
    const base = {
      kind: 'note' as const,
      position,
      participants,
      style: style as 'note' | 'hnote' | 'rnote',
      ...shape,
      ...(color !== undefined ? { color } : {}),
      ...(stereotype !== undefined ? { stereotype } : {}),
      ...(vmerge ? { vmerge: true } : {}),
      ...(parallel ? { parallel: true } : {}),
    };

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
export const noteAcrossCommand: Command = {
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

