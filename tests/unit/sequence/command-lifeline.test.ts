/**
 * T9: the `CommandActivate`/`CommandDeactivateShort` family
 * (`SequenceDiagramFactory.java:103-104`).
 *
 * Two defects fixed here:
 *  - `CommandActivate.executeArg` calls `diagram.getOrCreateParticipant`
 *    UNCONDITIONALLY before `diagram.activate(...)` (`CommandActivate
 *    .java:109`), so `activate X`/`deactivate X`/`destroy X` DECLARE X when
 *    it has no prior `participant X` line. This port previously only
 *    emitted the `ActivationEvent`, so a source whose only mention of X was
 *    `activate X` rendered no lifeline for X at all.
 *  - `deactivate "quoted name"` (a WHO with a space) did not match
 *    `deactivateCommand`'s old `\S+`-only pattern -- `CommandActivate`'s WHO
 *    group, `([%pLN_.@]+|[%g][^%g]+[%g])` (`:65`), is shared by all three
 *    TYPE values, not just `activate`.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandActivate.java:55-120
 * @see ~/git/plantuml/.../sequencediagram/command/CommandDeactivateShort.java
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { ActivationEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import {
  activateCommand,
  deactivateShortCommand,
} from '../../../src/diagrams/sequence/command-lifeline.js';
import { makeDefaultAST, type ParseState } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function activationEvents(ast: SequenceDiagramAST): ActivationEvent[] {
  return ast.events.filter((e): e is ActivationEvent => e.kind === 'activate' || e.kind === 'deactivate');
}

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

describe('activate declares its participant (getOrCreateParticipant, :109)', () => {
  it('declares X when `activate X` is the ONLY mention of X', () => {
    const ast = parse(['activate C']);
    expect(ast.participants).toHaveLength(1);
    expect(ast.participants[0]).toMatchObject({ id: 'C', display: 'C', type: 'participant' });
  });

  it('declares Bob even when `activate Bob` precedes every other reference', () => {
    const ast = parse(['activate Bob', 'Bob -> Alice: hello']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Bob', 'Alice']);
  });

  it('does not duplicate a participant that was already declared', () => {
    const ast = parse(['participant Alice', 'activate Alice']);
    expect(ast.participants).toHaveLength(1);
  });

  it('declares X on a bare `deactivate X` too (shared WHO/declare, :109)', () => {
    const ast = parse(['deactivate X']);
    expect(ast.participants).toHaveLength(1);
    expect(ast.participants[0]?.id).toBe('X');
  });

  it('declares X on `destroy X` too', () => {
    const ast = parse(['destroy X']);
    expect(ast.participants).toHaveLength(1);
    expect(ast.participants[0]?.id).toBe('X');
  });
});

describe('activate: quoted WHO alternative (a name with a space)', () => {
  it('matches `activate "Some Name"`', () => {
    const match = activateCommand.pattern.exec('activate "Some Name"');
    expect(match).not.toBeNull();
    expect(match?.[1]).toBe('"Some Name"');
  });

  it('declares the quoted participant with the space stripped of quoting', () => {
    const ast = parse(['activate "Long Alice"']);
    expect(ast.participants[0]).toMatchObject({ id: 'Long Alice', display: 'Long Alice' });
  });

  it('accepts a quoted WHO on `deactivate` too', () => {
    const ast = parse(['activate "actor 1"', 'deactivate "actor 1"']);
    const events = activationEvents(ast);
    expect(events).toHaveLength(2);
    expect(events.map((e) => e.participantId)).toEqual(['actor 1', 'actor 1']);
    expect(events.map((e) => e.kind)).toEqual(['activate', 'deactivate']);
  });
});

// `deactivateShortCommand` is not yet a `SEQUENCE_COMMANDS` entry (that file
// is another batch-3 task's write-set this iteration -- see the mission
// report), so these exercise the command object directly rather than
// through `parseSequence`. `lastMessageTo` is set by hand to stand in for
// what `command-arrow.ts`'s message rules normally leave behind.
describe('bare `deactivate` (CommandDeactivateShort)', () => {
  it('matches a bare `deactivate` line with no participant', () => {
    const match = deactivateShortCommand.pattern.exec('deactivate');
    expect(match).not.toBeNull();
  });

  it('deactivates the target of the most recent message', () => {
    const state = freshState();
    state.lastMessageTo = 'Bob';
    const match = deactivateShortCommand.pattern.exec('deactivate');
    deactivateShortCommand.execute(state, match as RegExpExecArray);
    expect(state.ast.events).toHaveLength(1);
    expect(state.ast.events[0]).toMatchObject({ kind: 'deactivate', participantId: 'Bob' });
  });

  it('re-targets after the last-message cursor changes', () => {
    const state = freshState();
    state.lastMessageTo = 'Bob';
    const match = deactivateShortCommand.pattern.exec('deactivate');
    deactivateShortCommand.execute(state, match as RegExpExecArray);
    state.lastMessageTo = 'Carol';
    deactivateShortCommand.execute(state, match as RegExpExecArray);
    expect(state.ast.events.map((e) => (e as ActivationEvent).participantId)).toEqual(['Bob', 'Carol']);
  });

  it('is a no-op with no preceding message (nothing to deactivate)', () => {
    const state = freshState();
    const match = deactivateShortCommand.pattern.exec('deactivate');
    expect(match).not.toBeNull();
    deactivateShortCommand.execute(state, match as RegExpExecArray);
    expect(state.ast.events).toHaveLength(0);
  });
});
