/**
 * T11 (mission sequence-command-coverage): `parser.ts`'s dispatch hook for
 * T10's `matchParticipantMultilineCommand` — the port of
 * `CommandParticipantMultilines` (`SequenceDiagramFactory.java:110`).
 *
 * T10 unit-tests the matcher itself in `command-participant.test.ts`; what is
 * tested HERE is the seam T10 could not wire (`parser.ts` was this batch's
 * T11 write-set): that `runDispatchLoop` intercepts the block ahead of the
 * flat `SEQUENCE_COMMANDS` table, and specifically ahead of
 * `participantCommand`, whose `(.+)` capture would otherwise swallow the
 * trailing `[` into the participant id.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

describe('participant [ ... ] blocks reach the multiline matcher', () => {
  it('consumes the whole block, so the body never reaches command dispatch', () => {
    const ast = parse(['participant MyParticipant [', '=MyTitle', '----', '""MySubTitle""', ']', 'participant Bob']);

    expect(ast.participants.map((p) => p.id)).toEqual(['MyParticipant', 'Bob']);
    expect(ast.participants[0]?.display).toBe('=MyTitle\n----\n""MySubTitle""');
  });

  it('wins over `participantCommand`, whose `(.+)` would swallow the trailing `[`', () => {
    const ast = parse(['participant Bob [', 'body', ']']);

    // Without the hook this id is `Bob [` and `body` refuses on the next line.
    expect(ast.participants.map((p) => p.id)).toEqual(['Bob']);
    expect(ast.participants[0]?.display).toBe('body');
  });

  it('leaves an ordinary participant declaration to the flat command table', () => {
    const ast = parse(['participant Bob', 'participant Alice as A']);

    expect(ast.participants.map((p) => p.id)).toEqual(['Bob', 'A']);
  });

  it('does not consume an UNCLOSED block — the matcher declines and dispatch refuses', () => {
    const result = parseSequence(['participant Bob [', '=Title']);

    expect('refused' in result).toBe(true);
  });
});

describe('pinned corpus fixtures route SEQUENCE', () => {
  it('jozomu-87-tajo507 shape: a creole body then a message from the participant', () => {
    const ast = parse([
      'participant MyParticipant [',
      '=MyTitle',
      '----',
      '""MySubTitle""',
      ']',
      'participant Bob',
      'MyParticipant -> Bob',
    ]);

    expect(ast.participants.map((p) => p.id)).toEqual(['MyParticipant', 'Bob']);
    expect(ast.events.filter((e) => e.kind === 'message')).toHaveLength(1);
  });

  it('lafuzo-13-xura634 shape: the same block carrying an `order N` clause', () => {
    const ast = parse([
      'participant MyParticipant order 20 [',
      '=MyTitle',
      '----',
      '""MySubTitle""',
      ']',
      'participant Bob order 10',
    ]);

    expect(ast.participants.map((p) => p.id)).toEqual(['MyParticipant', 'Bob']);
  });
});
