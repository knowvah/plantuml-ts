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
//      3 — optional color (#word)
//      4 — optional inline text (everything after ": ")
export const noteCommand: Command = {
  pattern:
    /^note\s+(left of|right of|over)\s+([^:#\n]+?)(?:\s+(#\w+))?(?:\s*:\s*(.+))?\s*$/i,
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

    const participants = rawParticipants
      .split(',')
      .map((s) => s.trim())
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
 * @see command/note/sequence/FactorySequenceNoteOnArrowCommand.java:209-213
 */
export const noteOnArrowCommand: Command = {
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
export const styledNoteCommand: Command = {
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

