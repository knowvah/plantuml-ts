/**
 * T10 (mission sequence-command-coverage): unit coverage for
 * `command-participant.ts` — `participantCommand`/`createCommand` (already
 * wired, exercised end-to-end via `parseSequence`) and the NEW
 * `matchParticipantMultilineCommand` (`CommandParticipantMultilines.java`,
 * `SequenceDiagramFactory.java:110`).
 *
 * `matchParticipantMultilineCommand` is NOT yet wired into `parser.ts`'s
 * dispatch loop (see its doc comment in `command-participant.ts` — `parser.ts`
 * is T11's write-set this batch, not T10's), so it cannot be exercised via
 * `parseSequence` yet. This file tests it directly against a hand-built
 * `ParseState`, mirroring the exact shape `parseSequence` itself builds
 * (`parser.ts`'s `parseSequence` function).
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import {
  makeDefaultAST,
  type ParseState,
} from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { matchParticipantMultilineCommand } from '../../../src/diagrams/sequence/command-participant.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

/** Same shape `parseSequence` builds (`parser.ts`). */
function freshState(): ParseState {
  return {
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
}

// ---------------------------------------------------------------------------
// participant / actor / ... single-line -- CommandParticipantA..A4
// (SequenceDiagramFactory.java:106-109)
// ---------------------------------------------------------------------------

describe('participantCommand', () => {
  it('declares a bare participant', () => {
    const ast = parse(['participant Alice', 'Alice -> Alice : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'Alice', display: 'Alice' });
  });

  it('declares a quoted-display participant with an alias', () => {
    const ast = parse(['participant "Alice Smith" as A', 'A -> A : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'A', display: 'Alice Smith' });
  });
});

describe('createCommand', () => {
  it('declares a plain participant', () => {
    const ast = parse(['create Dog', 'Dog -> Dog : bark']);
    expect(ast.participants[0]).toMatchObject({ id: 'Dog', type: 'participant' });
  });
});

// ---------------------------------------------------------------------------
// participant CODE [ ... ] -- CommandParticipantMultilines
// (SequenceDiagramFactory.java:110; CommandParticipantMultilines.java:66-171)
// ---------------------------------------------------------------------------

describe('matchParticipantMultilineCommand', () => {
  it('returns null on a line that is not a multiline participant opener', () => {
    const state = freshState();
    expect(matchParticipantMultilineCommand(state, ['participant Alice'], 0)).toBeNull();
    expect(state.ast.participants).toHaveLength(0);
  });

  it('returns null when the block is unterminated', () => {
    const state = freshState();
    const lines = ['participant MyParticipant [', 'body line'];
    expect(matchParticipantMultilineCommand(state, lines, 0)).toBeNull();
    expect(state.ast.participants).toHaveLength(0);
  });

  it('parses jozomu-87-tajo507\'s block: a heading, a rule, and monospace text', () => {
    const state = freshState();
    const lines = [
      'participant MyParticipant [',
      '=MyTitle',
      '----',
      '""MySubTitle""',
      ']',
      'participant Bob',
    ];
    const consumed = matchParticipantMultilineCommand(state, lines, 0);
    expect(consumed).toBe(5); // open + 3 body lines + close
    expect(state.ast.participants).toHaveLength(1);
    expect(state.ast.participants[0]).toMatchObject({
      id: 'MyParticipant',
      display: '=MyTitle\n----\n""MySubTitle""',
      type: 'participant',
    });
  });

  it('parses lafuzo-13-xura634\'s block and discards "order N" from CODE', () => {
    const state = freshState();
    const lines = [
      'participant MyParticipant order 20 [',
      '=MyTitle',
      '----',
      '""MySubTitle""',
      ']',
    ];
    const consumed = matchParticipantMultilineCommand(state, lines, 0);
    expect(consumed).toBe(5);
    expect(state.ast.participants[0]?.id).toBe('MyParticipant');
    expect(state.ast.participants[0]?.display).toBe('=MyTitle\n----\n""MySubTitle""');
  });

  it('stores an empty body as a display equal to the CODE (empty block)', () => {
    const state = freshState();
    const lines = ['participant Empty [', ']'];
    const consumed = matchParticipantMultilineCommand(state, lines, 0);
    expect(consumed).toBe(2);
    expect(state.ast.participants[0]).toMatchObject({ id: 'Empty', display: 'Empty' });
  });

  it('captures a stereotype from the opening line head', () => {
    const state = freshState();
    const lines = ['participant Svc <<service>> [', 'line one', ']'];
    matchParticipantMultilineCommand(state, lines, 0);
    expect(state.ast.participants[0]).toMatchObject({ id: 'Svc', stereotype: '<<service>>' });
  });

  it('is a no-op when the participant already exists (matches ensureParticipant)', () => {
    const state = freshState();
    const lines = ['participant Bob [', 'ignored body', ']'];
    // Pre-register Bob the way an earlier `participant Bob` line would.
    state.ast.participants.push({ id: 'Bob', display: 'Bob', type: 'participant', order: 0 });
    state.participantIndex.set('Bob', 0);
    matchParticipantMultilineCommand(state, lines, 0);
    expect(state.ast.participants).toHaveLength(1);
    expect(state.ast.participants[0]?.display).toBe('Bob');
  });
});
