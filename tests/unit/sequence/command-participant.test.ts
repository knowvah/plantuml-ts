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
import { makeDefaultAST, type ParseState } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import { matchParticipantMultilineCommand } from '../../../src/diagrams/sequence/command-participant.js';
import { newLifeState } from '../../../src/diagrams/sequence/sequence-life-state.js';
import {
  DEFAULT_SEQUENCE_STYLE_BUILDER,
  emptySequenceStyleDispatch,
  sequenceSource,
} from '../../helpers/sequence-source.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(sequenceSource(lines));
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
    lastEventWithNoteLeft: null,
    lastEventWithNoteRight: null,
    currentBox: null,
    boxCounter: 0,
    executionError: undefined,
    life: newLifeState(),
    style: emptySequenceStyleDispatch(),
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

// SequenceDiagram.java:548-555 putParticipantInLast; CommandParticipant.java:146-148
describe('re-declaring a participant moves it last', () => {
  const ids = (ast: SequenceDiagramAST): string[] => ast.participants.map((p) => p.id);

  it('single-line form moves the participant last and keeps its first display', () => {
    const ast = parse(['participant A', 'participant B', 'participant C', 'participant "Other" as A', 'A -> B : x']);
    expect(ids(ast)).toEqual(['B', 'C', 'A']);
    expect(ast.participants.map((p) => p.order)).toEqual([0, 1, 2]);
    expect(ast.participants[2]).toMatchObject({ id: 'A', display: 'A' });
  });

  it('multi-line form moves the participant last', () => {
    const ast = parse(['participant A', 'participant B', 'participant A [', 'body', ']', 'A -> B : x']);
    expect(ids(ast)).toEqual(['B', 'A']);
  });

  it('create participant of an existing one only moves it', () => {
    const ast = parse(['participant A', 'participant B', 'create participant A', 'B -> A : x']);
    expect(ids(ast)).toEqual(['B', 'A']);
  });

  it('bare create of an existing one (CommandActivate:63) does not move it', () => {
    // oracle: `participant A, participant B, create A` keeps titles A, B
    const ast = parse(['participant A', 'participant B', 'create A', 'B -> A : x']);
    expect(ids(ast)).toEqual(['A', 'B']);
  });

  it('re-binds the englober to the current box (or none)', () => {
    const ast = parse([
      'box "One"',
      'participant A',
      'end box',
      'participant B',
      'box "Two"',
      'participant A',
      'end box',
      'participant B',
      'A -> B : x',
    ]);
    expect(ids(ast)).toEqual(['A', 'B']);
    const [a, b] = ast.participants;
    expect(a?.boxId).toBe('box-2');
    expect(b?.boxId).toBeUndefined();
    expect(ast.boxes.map((x) => x.participantIds)).toEqual([[], ['A']]);
  });
});

// SequenceDiagram.java:182-190 addWithOrder; CommandParticipant.java:154-155.
// gepiju-13-negu183 / bugalu-47-ludi530 / lafuzo-13-xura634 sources.
describe('explicit participant order', () => {
  const ids = (ast: SequenceDiagramAST): string[] => ast.participants.map((p) => p.id);

  it('inserts before the first strictly greater order (ties append)', () => {
    const ast = parse(['participant A30 as P30 order 30', 'participant A20 order 20', 'participant A21 order 20']);
    expect(ids(ast)).toEqual(['A20', 'A21', 'P30']);
    expect(ast.participants.map((p) => p.order)).toEqual([0, 1, 2]);
    expect(ast.participants.map((p) => p.declaredOrder)).toEqual([20, 20, 30]);
  });

  it('sorts negative orders first', () => {
    const ast = parse([
      'participant A30 as P30 order -30',
      'participant A20 order -20',
      'participant A21 order 2123459',
    ]);
    expect(ids(ast)).toEqual(['P30', 'A20', 'A21']);
  });

  it('multi-line form carries its order (lafuzo-13)', () => {
    const ast = parse(['participant MyParticipant order 20 [', 'T', ']', 'participant Bob order 10']);
    expect(ids(ast)).toEqual(['Bob', 'MyParticipant']);
  });

  it('a re-declared participant is re-inserted by its own order', () => {
    const ast = parse(['participant A order 5', 'participant B', 'participant A']);
    expect(ids(ast)).toEqual(['B', 'A']);
  });
});

describe('createCommand', () => {
  it('declares a plain participant', () => {
    const ast = parse(['create Dog', 'Cat -> Dog : bark']);
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

  it("parses jozomu-87-tajo507's block: a heading, a rule, and monospace text", () => {
    const state = freshState();
    const lines = ['participant MyParticipant [', '=MyTitle', '----', '""MySubTitle""', ']', 'participant Bob'];
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
    const lines = ['participant MyParticipant order 20 [', '=MyTitle', '----', '""MySubTitle""', ']'];
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
    state.ast.participants.push({
      id: 'Bob',
      display: 'Bob',
      type: 'participant',
      order: 0,
      styleBuilder: DEFAULT_SEQUENCE_STYLE_BUILDER,
    });
    state.participantIndex.set('Bob', 0);
    matchParticipantMultilineCommand(state, lines, 0);
    expect(state.ast.participants).toHaveLength(1);
    expect(state.ast.participants[0]?.display).toBe('Bob');
  });
});

// ---------------------------------------------------------------------------
// T11 (ubrr, T5 mechanism 6): a <<stereotype>> between a QUOTED display and
// "as CODE" matches no registered CommandParticipantA/A2/A3/A4 grammar.
// @see sequencediagram/command/CommandParticipantA.java:52-69
// @see sequencediagram/command/CommandParticipantA2.java:51-65
// @see sequencediagram/command/CommandParticipantA3.java:51-65
// @see sequencediagram/command/CommandParticipantA4.java:51-61
// ---------------------------------------------------------------------------

describe('participantCommand refuses a misplaced stereotype (T11, ubrr)', () => {
  // Exemplar: `pacope-41-pufu938` -- `database "DB 2" <<&file>> as Db2`.
  // Jar-verified (three isolated 2-line probes, `scripts/oracle-render.sh`):
  // `database "DB 2" <<&file>> as Db2` / `<<$SpriteUsb>>` / `<<plain>>` all
  // render DESCRIPTION, never SEQUENCE -- the refusal is the token ORDER,
  // not the stereotype's content.
  //
  // `kind: 'syntax'`, not `'execution'`: this is a DISPATCH-level false
  // positive, not a true execution failure (see `dispatchCommand`'s own
  // doc comment, parser.ts) -- `participantCommand`'s single `(.+)$`
  // pattern syntactically over-matches where upstream's four narrower
  // `CommandParticipantA..A4` regexes would have declined the line
  // entirely, so `SequenceCommandRefusal` makes the dispatch loop try the
  // REST of `SEQUENCE_COMMANDS` (none of which match this line shape
  // either) rather than aborting immediately.
  it('refuses `syntax` for a quoted display, then <<stereotype>>, then "as CODE"', () => {
    const result = parseSequence(sequenceSource(['database "DB 2" <<&file>> as Db2']));
    if (!('refused' in result)) throw new Error('expected a refusal');
    expect(result.kind).toBe('syntax');
  });

  it('still refuses for a plain-text stereotype, not just an icon glyph', () => {
    const result = parseSequence(sequenceSource(['database "DB 2" <<plain>> as Db2']));
    expect('refused' in result && result.kind).toBe('syntax');
  });

  // Control: the SAME stereotype, in the upstream-accepted position (AFTER
  // "as CODE", unquoted display, `CommandParticipantA.java:63-64`), is not
  // refused.
  it('accepts the stereotype when it sits after CODE (upstream order)', () => {
    const ast = parse(['participant Db2 <<plain>>', 'Db2 -> Db2 : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'Db2', stereotype: '<<plain>>' });
  });

  // Control: a quoted display with NO stereotype at all still declares
  // normally -- the refusal is specific to the stereotype's position, not
  // to quoting in general.
  it('still accepts a quoted display with "as CODE" and no stereotype', () => {
    const ast = parse(['participant "DB 2" as Db2', 'Db2 -> Db2 : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'Db2', display: 'DB 2' });
  });
});
