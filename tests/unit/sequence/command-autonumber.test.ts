/**
 * T9: `CommandAutonumberStop` (`SequenceDiagramFactory.java:147`),
 * `CommandAutonumberResume` (`:148`) and `CommandAutonumberIncrement`
 * (`:149`).
 *
 * None of the three is yet a `SEQUENCE_COMMANDS` entry -- that file is
 * another batch-3 task's write-set this iteration (see the mission report
 * for the exact lines to add), so every test here exercises the exported
 * command objects directly (`pattern.exec` + `execute`) rather than going
 * through `parseSequence`.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandAutonumberStop.java
 * @see ~/git/plantuml/.../sequencediagram/command/CommandAutonumberResume.java
 * @see ~/git/plantuml/.../sequencediagram/command/CommandAutonumberIncrement.java
 * @see ~/git/plantuml/.../sequencediagram/DottedNumber.java
 */
import { describe, expect, it } from 'vitest';
import {
  autonumberIncrementCommand,
  autonumberResumeCommand,
  autonumberStopCommand,
} from '../../../src/diagrams/sequence/command-autonumber.js';
import { makeDefaultAST, type ParseState } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';

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

function run(command: { pattern: RegExp; execute(s: ParseState, m: RegExpExecArray): void }, state: ParseState, line: string): void {
  const match = command.pattern.exec(line);
  if (match === null) throw new Error(`pattern did not match: ${line}`);
  command.execute(state, match);
}

describe('autonumber stop', () => {
  it('matches `autonumber stop`', () => {
    expect(autonumberStopCommand.pattern.exec('autonumber stop')).not.toBeNull();
  });

  it('disables numbering but keeps the current value', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 1, current: 5, step: 1, prefix: '' };
    run(autonumberStopCommand, state, 'autonumber stop');
    expect(state.ast.autonumber).toMatchObject({ enabled: false, current: 5 });
  });
});

describe('autonumber resume', () => {
  it('re-enables numbering without touching step/format when bare', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: false, start: 1, current: 3, step: 5, prefix: '', format: '<b>0</b>' };
    run(autonumberResumeCommand, state, 'autonumber resume');
    expect(state.ast.autonumber).toMatchObject({ enabled: true, current: 3, step: 5, format: '<b>0</b>' });
  });

  it('replaces the increment when INC is given', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: false, start: 1, current: 1, step: 9, prefix: '' };
    run(autonumberResumeCommand, state, 'autonumber resume 3');
    expect(state.ast.autonumber).toMatchObject({ enabled: true, step: 3 });
  });

  it('replaces the format when a quoted FORMAT is given, leaving step alone', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: false, start: 1, current: 1, step: 7, prefix: '' };
    run(autonumberResumeCommand, state, 'autonumber resume "<font color=red><b>Message 0  "');
    expect(state.ast.autonumber).toMatchObject({
      enabled: true,
      step: 7,
      format: '<font color=red><b>Message 0  ',
    });
  });

  it('replaces both INC and FORMAT when both are given', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: false, start: 1, current: 1, step: 1, prefix: '' };
    run(autonumberResumeCommand, state, 'autonumber resume 1 "<font color=blue><b>Message 0  "');
    expect(state.ast.autonumber).toMatchObject({
      enabled: true,
      step: 1,
      format: '<font color=blue><b>Message 0  ',
    });
  });
});

describe('autonumber inc', () => {
  it('matches `autonumber inc` with no position and with a letter', () => {
    expect(autonumberIncrementCommand.pattern.exec('autonumber inc')).not.toBeNull();
    expect(autonumberIncrementCommand.pattern.exec('autonumber inc B')).not.toBeNull();
  });

  it('bumps the second-to-last segment with no POS (`1.1` -> `2.1`)', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 1, current: 1, step: 1, prefix: '1.' };
    run(autonumberIncrementCommand, state, 'autonumber inc');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('2.1');
  });

  it('bumps the only segment with no POS on a plain number', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 40, current: 40, step: 10, prefix: '' };
    run(autonumberIncrementCommand, state, 'autonumber inc');
    expect(state.ast.autonumber.current).toBe(41);
    expect(state.ast.autonumber.prefix).toBe('');
  });

  it('walks `1.1.1` through inc B / inc A / inc B exactly like the jar (dotted fixture)', () => {
    // Mirrors tests/corpus/sequence/sameli-92-dape565.puml's own comments.
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 1, current: 1, step: 1, prefix: '1.1.' };
    run(autonumberIncrementCommand, state, 'autonumber inc B');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('1.2.1');
    run(autonumberIncrementCommand, state, 'autonumber inc A');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('2.1.1');
    run(autonumberIncrementCommand, state, 'autonumber inc B');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('2.2.1');
  });

  it('preserves non-dot separators (`1-1:1` fixture)', () => {
    // Mirrors tests/corpus/sequence/bopizu-70-rese737.puml.
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 1, current: 1, step: 1, prefix: '1-1:' };
    run(autonumberIncrementCommand, state, 'autonumber inc B');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('1-2:1');
    run(autonumberIncrementCommand, state, 'autonumber inc A');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('2-1:1');
  });

  it('is a no-op for a POS beyond the segment count (defensive guard)', () => {
    const state = freshState();
    state.ast.autonumber = { enabled: true, start: 1, current: 1, step: 1, prefix: '' };
    run(autonumberIncrementCommand, state, 'autonumber inc Z');
    expect(`${state.ast.autonumber.prefix}${state.ast.autonumber.current}`).toBe('1');
  });
});
