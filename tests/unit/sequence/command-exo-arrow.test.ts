/**
 * `CommandExoArrowLeft` / `CommandExoArrowRight` over `CommandExoArrowAny`
 * (T13) — an exogenous message, one endpoint on a participant and the other
 * on the diagram border.
 *
 * The tables below are `getMessageExoType`'s two overrides read as truth
 * tables (`CommandExoArrowLeft.java:174-200`,
 * `CommandExoArrowRight.java:174-200`), plus the groups `executeArg` consumes
 * around them (`CommandExoArrowAny.java:71-184`). Nothing here asserts
 * geometry: exo layout is T14's and exo rendering T17's.
 *
 * @see ~/git/plantuml/.../sequencediagram/command/CommandExoArrowAny.java:62-220
 */

import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type {
  MessageExoEvent,
  MessageExoType,
  SequenceDiagramAST,
  SequenceEvent,
} from '../../../src/diagrams/sequence/ast.js';
import {
  EXO_ARROW_LEFT_SOURCE,
  EXO_ARROW_RIGHT_SOURCE,
  exoArrowLeftCommand,
  exoArrowRightCommand,
} from '../../../src/diagrams/sequence/command-exo-arrow.js';
import {
  makeDefaultAST,
  type ParseState,
} from '../../../src/diagrams/sequence/sequence-parse-helpers.js';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function parsed(...lines: readonly string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) throw new Error(`refused (${result.kind}): ${result.message}`);
  return result;
}

function events(...lines: readonly string[]): readonly SequenceEvent[] {
  return parsed(...lines).events;
}

function exo(...lines: readonly string[]): MessageExoEvent {
  const found = events(...lines).find((e) => e.kind === 'messageExo');
  if (found === undefined) throw new Error(`no exo message in ${lines.join(' / ')}`);
  return found;
}

function refused(line: string): boolean {
  return 'refused' in parseSequence([line]);
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

/** A `RegexResult` with only the groups named, standing in for a match the
 *  compiled pattern cannot actually produce — the only way to reach
 *  `getMessageExoType`'s `IllegalArgumentException` arm. */
function fabricatedMatch(groups: Readonly<Record<string, string>>): RegExpExecArray {
  return Object.assign([''], { index: 0, input: '', groups }) as unknown as RegExpExecArray;
}

// ---------------------------------------------------------------------------
// getMessageExoType — the two truth tables
// ---------------------------------------------------------------------------

describe('getMessageExoType', () => {
  /** `CommandExoArrowLeft.java:174-200`: a `]` in the LEADING border token
   *  selects the right border; `ARROW_DRESSING1` means FROM that border. */
  const LEFT_FORMS: readonly (readonly [string, MessageExoType])[] = [
    ['[-> Bob', 'FROM_LEFT'],
    ['[<- Bob', 'TO_LEFT'],
    [']-> Bob', 'FROM_RIGHT'],
    [']<- Bob', 'TO_RIGHT'],
    ['?-> Bob', 'FROM_LEFT'],
    ['?<- Bob', 'TO_LEFT'],
    ['-> Bob', 'FROM_LEFT'],
  ];

  /** `CommandExoArrowRight.java:174-200`: a `[` in the TRAILING border token
   *  selects the left border; `ARROW_DRESSING1` now points AWAY, so it is TO. */
  const RIGHT_FORMS: readonly (readonly [string, MessageExoType])[] = [
    ['Bob ->]', 'TO_RIGHT'],
    ['Bob <-]', 'FROM_RIGHT'],
    ['Bob ->[', 'TO_LEFT'],
    ['Bob <-[', 'FROM_LEFT'],
    ['Bob ->?', 'TO_RIGHT'],
    ['Bob <-?', 'FROM_RIGHT'],
    ['Bob ->', 'TO_RIGHT'],
  ];

  it.each(LEFT_FORMS)('reads %s as %s', (line, expected) => {
    const message = exo(line);
    expect(message.exoType).toBe(expected);
    expect(message.participant).toBe('Bob');
  });

  it.each(RIGHT_FORMS)('reads %s as %s', (line, expected) => {
    const message = exo(line);
    expect(message.exoType).toBe(expected);
    expect(message.participant).toBe('Bob');
  });

  it('refuses, rather than throwing, when neither dressing participated', () => {
    // Upstream ends both branches with `throw new IllegalArgumentException()`.
    // This port has no exception channel out of `Command.execute`, so it
    // emits nothing and leaves the diagram untouched.
    for (const command of [exoArrowLeftCommand, exoArrowRightCommand]) {
      for (const border of ['[', ']']) {
        const state = freshState();
        expect(() =>
          command.execute(
            state,
            fabricatedMatch({ PARTICIPANT: 'Bob', ARROW_SUPPCIRCLE2: border }),
          ),
        ).not.toThrow();
        expect(state.ast.events).toEqual([]);
        expect(state.ast.participants).toEqual([]);
      }
    }
  });

  it('declines a body that carries no dressing at all', () => {
    expect(EXO_ARROW_LEFT_SOURCE.length).toBeGreaterThan(0);
    expect(exoArrowLeftCommand.pattern.test('[- Bob')).toBe(false);
    expect(exoArrowRightCommand.pattern.test('Bob -]')).toBe(false);
    expect(refused('[- Bob')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isShortArrow
// ---------------------------------------------------------------------------

describe('isShortArrow', () => {
  it('is true for a `?` border token on either side', () => {
    expect(exo('?-> Bob').shortArrow).toBe(true);
    expect(exo('Bob ->?').shortArrow).toBe(true);
  });

  it('is false for `[`, `]` and for an absent border token', () => {
    expect(exo('[-> Bob').shortArrow).toBe(false);
    expect(exo('Bob ->]').shortArrow).toBe(false);
    expect(exo('-> Bob').shortArrow).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// The o / x decorations, on both sides
// ---------------------------------------------------------------------------

describe('ARROW_SUPPCIRCLE1 / ARROW_SUPPCIRCLE2', () => {
  it('puts a FROM message border decoration on end 1', () => {
    // `[o->` — ARROW_SUPPCIRCLE2 is the border side, and a FROM_* message
    // starts there (`CommandExoArrowAny.java:121-123`).
    const message = exo('[o-> Bob');
    expect(message.arrow.decoration1).toBe('CIRCLE');
    expect(message.arrow.decoration2).toBe('NONE');
  });

  it('puts a FROM message participant decoration on end 2', () => {
    const message = exo('[->o Bob');
    expect(message.arrow.decoration1).toBe('NONE');
    expect(message.arrow.decoration2).toBe('CIRCLE');
  });

  it('swaps both ends for a TO message', () => {
    // `:109-119` — a TO_* message starts AT the participant, so
    // ARROW_SUPPCIRCLE1 is end 1 and the border token is end 2.
    const toBorder = exo('[o<- Bob');
    expect(toBorder.exoType).toBe('TO_LEFT');
    expect(toBorder.arrow.decoration1).toBe('NONE');
    expect(toBorder.arrow.decoration2).toBe('CIRCLE');

    const toParticipant = exo('[<-o Bob');
    expect(toParticipant.arrow.decoration1).toBe('CIRCLE');
    expect(toParticipant.arrow.decoration2).toBe('NONE');
  });

  it('maps `x` to a CROSSX head on the same two ends', () => {
    expect(exo('[x-> Bob').arrow.dressing1.head).toBe('CROSSX');
    expect(exo('[->x Bob').arrow.dressing2.head).toBe('CROSSX');
    expect(exo('Bob ->x]').arrow.dressing2.head).toBe('CROSSX');
    expect(exo('Bob x->]').arrow.dressing1.head).toBe('CROSSX');
  });
});

// ---------------------------------------------------------------------------
// The rest of executeArg's ArrowConfiguration
// ---------------------------------------------------------------------------

describe('the exo ArrowConfiguration', () => {
  it('gives a plain arrow one NORMAL head and one bare end', () => {
    const message = exo('[-> Bob');
    expect(message.arrow.dressing1).toEqual({ head: 'NONE', part: 'FULL' });
    expect(message.arrow.dressing2).toEqual({ head: 'NORMAL', part: 'FULL' });
    expect(message.arrow.dashed).toBe(false);
  });

  it('ARROW_BOTHDRESSING heads both ends', () => {
    const message = exo('[<-> Bob');
    expect(message.arrow.dressing1.head).toBe('NORMAL');
    expect(message.arrow.dressing2.head).toBe('NORMAL');
  });

  it('a doubled dressing is ASYNC, and reaches end 1 only when both are headed', () => {
    // `withHead` leaves an `ArrowHead.NONE` dressing alone
    // (`ArrowConfiguration.java:124-136`).
    const oneWay = exo('[->> Bob');
    expect(oneWay.arrow.dressing1.head).toBe('NONE');
    expect(oneWay.arrow.dressing2.head).toBe('ASYNC');

    const bothWays = exo('[<<->> Bob');
    expect(bothWays.arrow.dressing1.head).toBe('ASYNC');
    expect(bothWays.arrow.dressing2.head).toBe('ASYNC');
  });

  it('dots the body on `--`', () => {
    expect(exo('[--> Bob').arrow.dashed).toBe(true);
    expect(exo('Bob -->]').arrow.dashed).toBe(true);
    expect(exo('[-> Bob').arrow.dashed).toBe(false);
  });

  it('applies ARROW_STYLE1/2 through applyStyle', () => {
    expect(exo('[-[dotted]-> Bob').arrow.dashed).toBe(true);
    expect(exo('Bob <-[dashed]-]').arrow.dashed).toBe(true);
  });

  it('reads a bracketed colour as two dashes, so the body is dotted', () => {
    // NOT a slip: `body` is `ARROW_BODYA + ARROW_BODYB` (`:74`), and
    // `-[#red]->` puts one dash on each side of the style, so `contains("--")`
    // holds. Jar-verified (`scripts/oracle-render.sh`): both
    // `Alice -[#red]-> Bob` and `[-[#red]-> Bob` render with
    // `stroke-dasharray:2,2`.
    expect(exo('[-[#red]-> Bob').arrow.dashed).toBe(true);
  });

  it('halves the head for `/` and `\\`, by the message direction', () => {
    // `getArrowPart` (`:186-200`): `/` is BOTTOM when getDirection() == 1.
    expect(exo('[-/ Bob').exoType).toBe('FROM_LEFT');
    expect(exo('[-/ Bob').arrow.dressing2.part).toBe('BOTTOM_PART');
    expect(exo('[\\- Bob').exoType).toBe('TO_LEFT');
    expect(exo('[\\- Bob').arrow.dressing2.part).toBe('BOTTOM_PART');
    expect(exo('[-\\ Bob').arrow.dressing2.part).toBe('TOP_PART');
    expect(exo('[/- Bob').arrow.dressing2.part).toBe('TOP_PART');
    expect(exo('[-> Bob').arrow.dressing2.part).toBe('FULL');
  });
});

// ---------------------------------------------------------------------------
// The trailing modifiers
// ---------------------------------------------------------------------------

describe('the trailing modifiers', () => {
  it('carries the LABEL', () => {
    expect(exo('[-> Bob : hello').label).toBe('hello');
    expect(exo('Bob ->] : bye').label).toBe('bye');
    expect(exo('[-> Bob').label).toBe('');
  });

  it('declares the participant, quotes stripped', () => {
    const ast = parsed('[-> "Bob Smith"');
    expect(ast.participants.map((p) => p.id)).toEqual(['Bob Smith']);
    expect(exo('[-> "Bob Smith"').participant).toBe('Bob Smith');
  });

  it('stores PARALLEL and ANCHOR without drawing them (D4)', () => {
    const parallel = exo('& [-> Bob');
    expect(parallel.parallel).toBe(true);
    expect(parallel.anchor).toBeUndefined();

    const anchored = exo('{start} [-> Bob : hi');
    expect(anchored.anchor).toBe('start');
    expect(anchored.parallel).toBeUndefined();
    expect(anchored.label).toBe('hi');
  });

  it('resolves the URL to its href', () => {
    expect(exo('[-> Bob [[http://example.com]] : hi').url).toBe('http://example.com');
    expect(exo('[-> Bob').url).toBeUndefined();
  });

  it('carries LIFECOLOR onto the message and onto the activation it starts', () => {
    const message = exo('[-> Bob ++ #gold');
    expect(message.lifeColor).toBe('#gold');
    const activation = events('[-> Bob ++ #gold').find((e) => e.kind === 'activate');
    expect(activation).toEqual({ kind: 'activate', participantId: 'Bob', color: '#gold' });
  });

  it('emits `*` BEFORE the message and `+`/`-`/`!` after it', () => {
    // `:106-108` runs CREATE before `addMessage`; `:148-166` runs the rest
    // after it.
    expect(events('[-> Bob *').map((e) => e.kind)).toEqual(['activate', 'messageExo']);
    expect(events('[-> Bob +').map((e) => e.kind)).toEqual(['messageExo', 'activate']);
    expect(events('[-> Bob -').map((e) => e.kind)).toEqual(['messageExo', 'deactivate']);
    expect(events('[-> Bob !').map((e) => e.kind)).toEqual(['messageExo', 'deactivate']);
    expect(events('[-> Bob').map((e) => e.kind)).toEqual(['messageExo']);
  });

  it('draws a number from the shared autonumber counter', () => {
    const all = events('autonumber', '[-> Bob', 'Bob -> Carol');
    const numbers = all
      .filter((e) => e.kind === 'messageExo' || e.kind === 'message')
      .map((e) => (e.kind === 'messageExo' || e.kind === 'message' ? e.sequenceNumber : undefined));
    expect(numbers).toEqual([1, 2]);
    expect(exo('[-> Bob').sequenceNumber).toBeUndefined();
  });

  it('formats the autonumber label the same way a plain message does', () => {
    const message = exo('autonumber 10 1 "<b>[000]"', '[-> Bob');
    expect(message.sequenceNumber).toBe(10);
    expect(message.sequenceLabel).toBe('<b>[010]');
  });
});

// ---------------------------------------------------------------------------
// Dispatch
// ---------------------------------------------------------------------------

describe('dispatch', () => {
  it('takes the lines CommandArrow declines, and no others', () => {
    const plain = events('A -> B');
    expect(plain.map((e) => e.kind)).toEqual(['message']);
    expect(EXO_ARROW_RIGHT_SOURCE.length).toBeGreaterThan(0);
    expect(exoArrowLeftCommand.pattern.test('A -> B')).toBe(false);
    expect(exoArrowRightCommand.pattern.test('A -> B')).toBe(false);
  });

  it('keeps the exo message out of MessageEvent (D3)', () => {
    const message = exo('[-> Bob');
    expect(message.kind).toBe('messageExo');
    expect(events('[-> Bob').some((e) => e.kind === 'message')).toBe(false);
  });

  it('mixes with ordinary messages in source order', () => {
    const all = events('Alice -> Bob : hi', '[-> Bob : from the left', 'Bob ->] : and out');
    expect(all.map((e) => e.kind)).toEqual(['message', 'messageExo', 'messageExo']);
    expect(parsed('Alice -> Bob : hi', '[-> Bob').participants.map((p) => p.id)).toEqual([
      'Alice',
      'Bob',
    ]);
  });
});
