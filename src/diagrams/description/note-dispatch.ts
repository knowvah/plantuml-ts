/**
 * The note-command dispatch phase of the descriptive-diagram parser's line
 * loop — split out of `parser.ts` (T8b, unknown-bucket-routing-repair)
 * purely to keep that file under the project's 500-line cap once the
 * "Nothing to note to" refusal (`CommandFactoryNoteOnEntity.java:295-303`)
 * needed the same `refuse`/`ParseRefusal` machinery `parser.ts#dispatchCommand`
 * already uses for the identical execution-refusal pattern
 * (`PSystemCommandFactory.java:180-186`).
 */
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';
import { classifyNoteOpen, isNoteTerminator } from './note-grammar.js';
import { closePendingNote, executeNoteOpen, type ParseState } from './parse-state.js';

/** `1` when the line was consumed by this phase, `null` when it doesn't
 *  apply and the next dispatch phase should be tried. */
export type NoteLineOutcome = number | null;

/**
 * A note-command multi-line body owns every line until its terminator
 * (CommandMultilines2) — never re-dispatched through COMMANDS, so a body
 * line that happens to look like another command (e.g. razefo-71-pice114's
 * embedded `{{ skinparam note { ... } }}`) is never misparsed as one.
 *
 * T8b: `executeNoteOpen` (parse-state.ts) can set `state.executionError`
 * itself — the on-entity forms' shared "Nothing to note to" refusal.
 * Checked the same way `dispatchCommand` checks it after a `COMMANDS`
 * match: turn it into a `kind: 'execution'` `ParseRefusal` at this line.
 */
export function tryNoteHandling(
  state: ParseState,
  line: string,
  i: number,
  rawLine: number,
): NoteLineOutcome | ParseRefusal {
  if (state.pendingNote !== undefined) {
    if (isNoteTerminator(line, state.pendingNote.terminator)) {
      closePendingNote(state);
    } else {
      state.pendingNote.lines.push(line);
    }
    return 1;
  }
  const noteOpen = classifyNoteOpen(line);
  if (noteOpen !== undefined) {
    executeNoteOpen(state, noteOpen);
    if (state.executionError !== undefined) {
      const message = state.executionError;
      return refuse('execution', rawLine, i + 1, message);
    }
    return 1;
  }
  return null;
}
