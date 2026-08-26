/**
 * Parser for PlantUML sequence diagrams.
 *
 * Uses a command-dispatch table: an array of { pattern, execute } objects
 * tested against each trimmed line in priority order. First match wins.
 *
 * The command list (`SEQUENCE_COMMANDS`) lives in
 * `sequence-command-registry.ts`, one entry per registered command over the
 * per-family `command-*.ts` modules; the mutable-state helpers (ParseState,
 * emit, ensureParticipant, …) live in `sequence-parse-helpers.ts`. This file
 * owns only the top-level line loop and its dispatch priority.
 */

import type { SequenceDiagramAST } from './ast.js';
import { matchAnnotationCommand } from '../../core/annotations/index.js';
import { matchSpriteCommand } from '../../core/sprite-commands.js';
import { matchSpriteBase64Command } from './command-sprite.js';
import { EmbeddedDiagram, getEmbeddedType } from '../../core/EmbeddedDiagram.js';
import {
  applyHideStereotype,
  applyHideUnlinked,
  emit,
  makeDefaultAST,
  type ParseState,
} from './sequence-parse-helpers.js';
import { SEQUENCE_COMMANDS } from './sequence-command-registry.js';
import { refuse, type ParseRefusal } from '../../core/parse-refusal.js';

// ---------------------------------------------------------------------------
// Line-dispatch helpers
// ---------------------------------------------------------------------------

/**
 * `PSystemCommandFactory#addOneSingleLineManageEmbedded2` (`:288-307`): while
 * a multi-line command's block is being accumulated, a line that OPENS an
 * embedded diagram (`{{`, optionally `{{salt`/`{{json`/… —
 * `EmbeddedDiagram#getEmbeddedType`) swallows every following line up to its
 * matching `}}`, nesting-aware, and adds them ALL to the block without the
 * enclosing command ever evaluating them. That is why upstream's inner `end
 * note` does not close the OUTER note: `isMultilineCommandOk` (`:268-286`)
 * only calls `cmd.isValid` on what this function returned.
 *
 * Returned verbatim, including the two easy-to-miss details: the opening
 * `{{` line is itself part of the block (java:289-290), as is the closing
 * `}}` (java:295 adds `s` BEFORE the nesting check at `:296-302`); and an
 * unterminated block absorbs every remaining line rather than failing
 * (java's `while (it.hasNext())` simply falls through to `return lines`).
 */
function scanEmbeddedBlock(
  lines: readonly string[],
  i: number,
): { block: readonly string[]; consumed: number } {
  let nested = 1;
  for (let j = i + 1; j < lines.length; j++) {
    const s = lines[j] ?? '';
    if (getEmbeddedType(s) !== null) nested++;
    else if (s.trim() === EmbeddedDiagram.EMBEDDED_END) {
      nested--;
      if (nested === 0) return { block: lines.slice(i, j + 1), consumed: j - i + 1 };
    }
  }
  return { block: lines.slice(i), consumed: lines.length - i };
}

/** `BlocLines#add` for the accumulating note: the first line SETS the text,
 *  every later one appends on its own display line. */
function appendNoteText(state: ParseState, newLines: readonly string[]): void {
  for (const line of newLines) {
    const note = state.pendingNote!;
    note.text = note.text === '' ? line : note.text + '\n' + line;
  }
}

/**
 * If a multi-line note is currently accumulating, either close it (on
 * "end note"), swallow an embedded-diagram block whole (see
 * {@link scanEmbeddedBlock}), or append line `i` to its text. Returns the
 * number of lines consumed, or `null` when there is no pending note and
 * normal dispatch should run instead.
 */
function handlePendingNote(state: ParseState, lines: readonly string[], i: number): number | null {
  if (state.pendingNote === null) return null;
  const line = lines[i]!;

  // Check for "end note" first via the dispatch table so it is matched the
  // same way ordinary commands are, but only close the note if this really
  // is the "end note" command — any other pattern match here is ignored and
  // the line still accumulates into the note text below.
  const endNoteCmd = SEQUENCE_COMMANDS.find((c) => c.pattern.test(line));
  if (endNoteCmd !== undefined && /^end\s*(?:note|hnote|rnote)\s*$/i.test(line)) {
    const m = endNoteCmd.pattern.exec(line)!;
    endNoteCmd.execute(state, m);
    return 1;
  }

  if (getEmbeddedType(line) !== null) {
    const embedded = scanEmbeddedBlock(lines, i);
    appendNoteText(state, embedded.block);
    return embedded.consumed;
  }

  appendNoteText(state, [line]);
  return 1;
}

/**
 * T13: the `ref over ... / end ref` multi-line body — same shape as
 * {@link handlePendingNote}, kept separate because a `ref`'s accumulated
 * text lands on `FrameEvent.label`, not a `NoteEvent.text`.
 * @see command/sequencediagram/command/CommandReferenceMultilinesOverSeveral.java:79-80
 */
function handlePendingRef(state: ParseState, line: string): boolean {
  if (state.pendingRef === null) return false;

  if (/^end\s*(?:ref)?\s*$/i.test(line)) {
    emit(state, state.pendingRef);
    state.pendingRef = null;
    return true;
  }

  state.pendingRef.label = state.pendingRef.label === '' ? line : `${state.pendingRef.label}\n${line}`;
  state.pendingRef.branchLabels[0] = state.pendingRef.label;
  return true;
}

/**
 * Title/caption/legend/header/footer/mainframe are upstream `CommonCommand`s
 * registered FIRST by `SequenceDiagramFactory#initCommandsList`
 * (`CommonCommands.addCommonCommands1(cmds)` is the VERY FIRST call, line
 * 100, before `CommandParticipantA`/`CommandArrow`/note commands) -- unlike
 * class/state, where the equivalent call is registered LAST (see
 * class/parser.ts and state/parser.ts's docs on that divergence). Tried
 * here, before the ordinary command table and its silent drop of
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
  // both before `SEQUENCE_COMMANDS`), mirroring upstream's
  // `addCommonCommands1`
  // (addTitleCommands then addCommonCommands2/sprite) being registered
  // FIRST by SequenceDiagramFactory.
  const spriteMatch = matchSpriteCommand(trimmedLines, i, state.ast.sprites!);
  if (spriteMatch !== null) return spriteMatch.consumed;

  // `CommandSpriteBase64` (`CommonCommands.java:79`), registered by the same
  // `addCommonCommands2` call as the two grammars above — see
  // `command-sprite.ts` for why it is not inside `matchSpriteCommand` and why
  // its position after (rather than between) them is not observable.
  const base64Match = matchSpriteBase64Command(trimmedLines, i, state.ast.sprites!);
  if (base64Match !== null) return base64Match.consumed;

  return null;
}

/**
 * Normal dispatch: run `line` through `SEQUENCE_COMMANDS`, first match wins.
 * Returns whether some command claimed the line -- mirrors
 * `PSystemCommandFactory#getCandidate` (`:225-246`), which returns a `Step`
 * on the first matching `Command` or `null` when none of `cmds` matches.
 */
function dispatchCommand(state: ParseState, line: string): boolean {
  for (const cmd of SEQUENCE_COMMANDS) {
    const match = cmd.pattern.exec(line);
    if (match !== null) {
      cmd.execute(state, match);
      return true;
    }
  }
  return false;
}

/**
 * Trimmed, blank-filtered view (matchAnnotationCommand requires
 * already-trimmed lines -- see commands.ts's single-line matchers, which
 * test `^title...$` etc. with no internal trim). Each entry keeps its
 * position in `lines` so a refusal can name the ORIGINAL 0-based line, not
 * its position in this filtered view.
 */
function trimNonBlank(lines: readonly string[]): { text: string; origIndex: number }[] {
  return lines
    .map((l, origIndex) => ({ text: l.trim(), origIndex }))
    .filter((e) => e.text !== '');
}

/**
 * Runs the per-line dispatch loop against `lines`, mutating `state` as
 * commands match. Returns a `syntax` {@link ParseRefusal} at the first line
 * no command (nor the annotation/sprite matchers ahead of it) claims;
 * `null` when every line was consumed successfully.
 */
function runDispatchLoop(state: ParseState, lines: readonly string[]): ParseRefusal | null {
  const trimmedEntries = trimNonBlank(lines);
  const trimmedLines = trimmedEntries.map((e) => e.text);

  for (let i = 0; i < trimmedLines.length; i++) {
    const line = trimmedLines[i]!;

    // If we are accumulating a multi-line note, any line that is not
    // "end note" gets appended to the note text. Checked FIRST, before the
    // annotation matcher, so a `title`/`legend`-shaped line inside
    // `note ... end note` stays note text (decisions.md D3).
    const noteConsumed = handlePendingNote(state, trimmedLines, i);
    if (noteConsumed !== null) {
      i += noteConsumed - 1;
      continue;
    }
    if (handlePendingRef(state, line)) continue;

    const consumed = dispatchAnnotationOrSprite(state, trimmedLines, i);
    if (consumed !== null) {
      i += consumed - 1;
      continue;
    }

    if (!dispatchCommand(state, line)) {
      const origIndex = trimmedEntries[i]!.origIndex;
      return refuse('syntax', origIndex, origIndex, 'Syntax Error?');
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main parser entry point
// ---------------------------------------------------------------------------

/**
 * Parse an array of preprocessed PlantUML sequence diagram lines into an AST,
 * or a {@link ParseRefusal} when the source is not a (complete, valid)
 * sequence diagram.
 *
 * Two of the four upstream refusal points apply here:
 *
 *  - No `Command` in `SEQUENCE_COMMANDS` (nor the annotation/sprite matchers tried
 *    ahead of it) matches a line: `kind: 'syntax'`, mirroring the
 *    `SYNTAX_ERROR "Syntax Error?"` fallback built when `getCandidate`
 *    returns `null`.
 *    @see ~/git/plantuml/.../command/PSystemCommandFactory.java:169-175
 *  - The finished diagram has no participants: `kind: 'incomplete'`,
 *    mirroring `SequenceDiagram#isIncomplete`, which upstream's
 *    `finalizeDiagram` checks only after every line has already been
 *    accepted (`:159-161`), so it fires once, at the end, not per-line.
 *    @see ~/git/plantuml/.../sequencediagram/SequenceDiagram.java:585-587
 *
 * The other two do not apply to this engine (see the decision journal for
 * the citations ruling each one out):
 *
 *  - `execution` (`PSystemCommandFactory.java:180-186`) requires a command
 *    that can itself report failure (`CommandExecutionResult`). Every entry
 *    in `SEQUENCE_COMMANDS` has an `execute(state, match): void` that cannot
 *    fail --
 *    matching is the only success/failure signal this port's `Command` type
 *    carries, so there is no execution-failure channel to refuse from.
 *  - `final` (`PSystemCommandFactory.java:148-152`) is
 *    `SequenceDiagram#checkFinalError`, which only conditionally prunes
 *    hidden participants before delegating to
 *    `AbstractDiagram#checkFinalError` (`:161-163`), itself a hard-coded
 *    `return null`. The override never actually returns a non-null error.
 */
export function parseSequence(lines: readonly string[]): SequenceDiagramAST | ParseRefusal {
  const state: ParseState = {
    ast: makeDefaultAST(),
    frameStack: [],
    participantIndex: new Map(),
    pendingNote: null,
    pendingRef: null,
    lastMessageFrom: null,
    lastMessageTo: null,
    currentBox: null,
    boxCounter: 0,
  };

  const refusal = runDispatchLoop(state, lines);
  if (refusal !== null) return refusal;

  if (state.ast.participants.length === 0) {
    return refuse('incomplete', lines.length, lines.length, 'Sequence diagram has no participants');
  }

  applyHideStereotype(state.ast);
  applyHideUnlinked(state.ast);
  return state.ast;
}
