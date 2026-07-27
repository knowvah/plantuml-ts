/**
 * Parser for PlantUML sequence diagrams.
 *
 * Uses a command-dispatch table: an array of { pattern, execute } objects
 * tested against each trimmed line in priority order. First match wins.
 *
 * The command dispatch table (COMMANDS) and the mutable-state helpers
 * (ParseState, emit, ensureParticipant, …) live in `sequence-commands.ts` /
 * `sequence-parse-helpers.ts` respectively — split out of this file purely
 * to stay under the project's 500-line file cap; this file owns only the
 * top-level line loop and its dispatch priority.
 */

import type { SequenceDiagramAST } from './ast.js';
import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { makeDefaultAST, type ParseState } from './sequence-parse-helpers.js';
import { COMMANDS } from './sequence-commands.js';

// ---------------------------------------------------------------------------
// Line-dispatch helpers
// ---------------------------------------------------------------------------

/**
 * If a multi-line note is currently accumulating, either close it (on
 * "end note") or append `line` to its text. Returns `true` when the line
 * was consumed this way; `false` when there is no pending note and normal
 * dispatch should run instead.
 */
function handlePendingNote(state: ParseState, line: string): boolean {
  if (state.pendingNote === null) return false;

  // Check for "end note" first via the dispatch table so it is matched the
  // same way ordinary commands are, but only close the note if this really
  // is the "end note" command — any other pattern match here is ignored and
  // the line still accumulates into the note text below.
  const endNoteCmd = COMMANDS.find((c) => c.pattern.test(line));
  if (endNoteCmd !== undefined && /^end\s+note\s*$/i.test(line)) {
    const m = endNoteCmd.pattern.exec(line)!;
    endNoteCmd.execute(state, m);
    return true;
  }

  if (state.pendingNote.text === '') {
    state.pendingNote.text = line;
  } else {
    state.pendingNote.text += '\n' + line;
  }
  return true;
}

/**
 * Title/caption/legend/header/footer/mainframe are upstream `CommonCommand`s
 * registered FIRST by `SequenceDiagramFactory#initCommandsList`
 * (`CommonCommands.addCommonCommands1(cmds)` is the VERY FIRST call, line
 * 100, before `CommandParticipantA`/`CommandArrow`/note commands) -- unlike
 * class/state, where the equivalent call is registered LAST (see
 * class/parser.ts and state/parser.ts's docs on that divergence). Tried
 * here, before the ordinary `COMMANDS` table and its silent drop of
 * unrecognized lines, mirroring that registration order exactly. Returns
 * the number of trimmed lines consumed (>1 for a multi-line sprite block),
 * or `null` when neither matcher claimed the line.
 */
function dispatchAnnotationOrSprite(
  state: ParseState,
  trimmedLines: readonly string[],
  i: number,
): number | null {
  // makeDefaultAST() always sets annotations; the field is optional on
  // SequenceDiagramAST only so hand-authored literal fixtures elsewhere
  // compile unchanged.
  const annotationMatch = matchAnnotationCommand(trimmedLines, i, state.ast.annotations!);
  if (annotationMatch !== null) return annotationMatch.consumed;

  // `sprite $name [WxH/N[z]] { ... }` definitions (mission SI5b/T4): same
  // FIRST position as the annotation matcher (tried immediately after it,
  // both before `COMMANDS`), mirroring upstream's `addCommonCommands1`
  // (addTitleCommands then addCommonCommands2/sprite) being registered
  // FIRST by SequenceDiagramFactory.
  const spriteMatch = matchSpriteCommand(trimmedLines, i, state.ast.sprites!);
  if (spriteMatch !== null) return spriteMatch.consumed;

  return null;
}

/** Normal dispatch: run `line` through the `COMMANDS` table, first match wins. */
function dispatchCommand(state: ParseState, line: string): void {
  for (const cmd of COMMANDS) {
    const match = cmd.pattern.exec(line);
    if (match !== null) {
      cmd.execute(state, match);
      break;
    }
  }
}

// ---------------------------------------------------------------------------
// Main parser entry point
// ---------------------------------------------------------------------------

/**
 * Parse an array of preprocessed PlantUML sequence diagram lines into an AST.
 */
export function parseSequence(lines: readonly string[]): SequenceDiagramAST {
  const state: ParseState = {
    ast: makeDefaultAST(),
    frameStack: [],
    participantIndex: new Map(),
    pendingNote: null,
    lastMessageFrom: null,
    lastMessageTo: null,
    currentBox: null,
    boxCounter: 0,
  };

  // Trimmed, blank-filtered view (matchAnnotationCommand requires
  // already-trimmed lines -- see commands.ts's single-line matchers, which
  // test `^title...$` etc. with no internal trim).
  const trimmedLines = lines.map((l) => l.trim()).filter((l) => l !== '');

  for (let i = 0; i < trimmedLines.length; i++) {
    const line = trimmedLines[i]!;

    // If we are accumulating a multi-line note, any line that is not
    // "end note" gets appended to the note text. Checked FIRST, before the
    // annotation matcher, so a `title`/`legend`-shaped line inside
    // `note ... end note` stays note text (decisions.md D3).
    if (handlePendingNote(state, line)) continue;

    const consumed = dispatchAnnotationOrSprite(state, trimmedLines, i);
    if (consumed !== null) {
      i += consumed - 1;
      continue;
    }

    dispatchCommand(state, line);
  }

  return state.ast;
}
