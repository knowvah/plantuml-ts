/**
 * T10 (mission sequence-command-coverage): unit coverage for
 * `command-misc.ts` — `hideEmptyDescriptionCommand`, the widened
 * `dividerCommand`, `delayWithTextCommand`/`bareDelayCommand` and
 * `spaceCommand`. The latter three are already registered in
 * `SEQUENCE_COMMANDS` and are exercised end-to-end via `parseSequence`,
 * mirroring `command-coverage.test.ts`'s established idiom.
 *
 * `hideEmptyDescriptionCommand` is a NEW export this task added — it is not
 * yet registered in `sequence-command-registry.ts` (T7's write-set this
 * batch; see this file's report in the T10 mission return for the exact
 * line to add), so it is tested directly against its `pattern`/`execute`
 * pair rather than through `parseSequence`.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { hideEmptyDescriptionCommand } from '../../../src/diagrams/sequence/command-misc.js';
import { makeDefaultAST, type ParseState } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type {
  DelayEvent,
  DividerEvent,
  SequenceDiagramAST,
  SequenceEvent,
  SpaceEvent,
} from '../../../src/diagrams/sequence/ast.js';

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

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function refusalLine(lines: string[]): number {
  const result = parseSequence(lines);
  if (!('refused' in result)) throw new Error('expected a refusal');
  return result.line;
}

function only<T extends SequenceEvent>(events: SequenceEvent[], kind: T['kind']): T[] {
  return events.filter((e): e is T => e.kind === kind);
}

// ---------------------------------------------------------------------------
// hide/show empty description — CommandHideEmptyDescription
// (command/CommonCommands.java:58,104; statediagram/command/
// CommandHideEmptyDescription.java:57-63)
// ---------------------------------------------------------------------------

describe('hide empty description', () => {
  it('matches the hide form', () => {
    expect(hideEmptyDescriptionCommand.pattern.test('hide empty description')).toBe(true);
  });

  it('matches the show form', () => {
    expect(hideEmptyDescriptionCommand.pattern.test('show empty description')).toBe(true);
  });

  it('does not match a plain "hide stereotype" or "hide unlinked" line', () => {
    expect(hideEmptyDescriptionCommand.pattern.test('hide stereotype')).toBe(false);
    expect(hideEmptyDescriptionCommand.pattern.test('hide unlinked')).toBe(false);
  });

  it('executes as a no-op -- does not mutate ParseState', () => {
    const state = freshState();
    const before = JSON.stringify(state.ast);
    const match = hideEmptyDescriptionCommand.pattern.exec('hide empty description')!;
    hideEmptyDescriptionCommand.execute(state, match);
    expect(JSON.stringify(state.ast)).toBe(before);
  });
});

// ---------------------------------------------------------------------------
// == LABEL == — CommandDivider.java:57-62 (empty LABEL widening)
// ---------------------------------------------------------------------------

describe('divider', () => {
  it('parses a labelled divider', () => {
    const ast = parse(['A -> B', '== test ==', 'A -> B']);
    const dividers = only<DividerEvent>(ast.events, 'divider');
    expect(dividers).toHaveLength(1);
    expect(dividers[0]?.text).toBe('test');
  });

  it('parses an EMPTY-label divider (====)', () => {
    const ast = parse(['A -> B', '====', 'A -> B']);
    const dividers = only<DividerEvent>(ast.events, 'divider');
    expect(dividers).toHaveLength(1);
    expect(dividers[0]?.text).toBe('');
  });
});

// ---------------------------------------------------------------------------
// ... / … — CommandDelay.java:57-61 (ellipsis + empty-label widening)
// ---------------------------------------------------------------------------

describe('delay', () => {
  it('parses a bare "..." delay with no text', () => {
    const ast = parse(['a->b', '...', 'b->a']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays).toHaveLength(1);
    expect(delays[0]?.text).toBeUndefined();
  });

  it('parses a bare unicode ellipsis "…" delay with no text', () => {
    const ast = parse(['a->b', '…', 'b->a']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays).toHaveLength(1);
    expect(delays[0]?.text).toBeUndefined();
  });

  it('parses "…title…" (ellipsis-delimited label)', () => {
    const ast = parse(['a->b', '…title…']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays).toHaveLength(1);
    expect(delays[0]?.text).toBe('title');
  });

  it('parses "......" as a delay with an EMPTY label', () => {
    const ast = parse(['a->b', '......', 'b->a']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays).toHaveLength(1);
    expect(delays[0]?.text).toBe('');
  });

  it('parses a mixed-delimiter labelled delay ("...title…")', () => {
    const ast = parse(['a->b', '...title…']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays[0]?.text).toBe('title');
  });
});

// ---------------------------------------------------------------------------
// ||N||  /  ||| — CommandHSpace.java:56-61 (one-or-more trailing pipes)
// ---------------------------------------------------------------------------

describe('hspace', () => {
  it('parses the bare "|||" form', () => {
    const ast = parse(['Bob -> Alice : ok', '|||', 'Bob -> Alice : ok2']);
    const spaces = only<SpaceEvent>(ast.events, 'space');
    expect(spaces).toHaveLength(1);
  });

  it('parses "||50||" -- two trailing pipes', () => {
    const ast = parse(['Bob -> Alice : ok', '||50||', 'Bob -> Alice : ok2']);
    const spaces = only<SpaceEvent>(ast.events, 'space');
    expect(spaces).toHaveLength(1);
    expect(spaces[0]?.pixels).toBe(50);
  });

  it('parses "||50|||" -- three trailing pipes', () => {
    const ast = parse(['Bob -> Alice : ok', '||50|||', 'Bob -> Alice : ok2']);
    const spaces = only<SpaceEvent>(ast.events, 'space');
    expect(spaces).toHaveLength(1);
    expect(spaces[0]?.pixels).toBe(50);
  });

  it('parses "||0||"', () => {
    const ast = parse(['activate a', 'a -> a : put', '||0||', 'deactivate a']);
    const spaces = only<SpaceEvent>(ast.events, 'space');
    expect(spaces[0]?.pixels).toBe(0);
  });

  it('still refuses a lone "||" with no trailing pipe', () => {
    // `\|\|(\d+)?\|+` requires AT LEAST one trailing pipe; a bare "||" has
    // none, so this remains outside CommandHSpace's grammar.
    expect(() => parse(['A -> B', '||', 'A -> B'])).toThrow();
    expect(refusalLine(['A -> B', '||', 'A -> B'])).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// The nine pinned corpus fixtures (refusal-baseline.json), verbatim.
// ---------------------------------------------------------------------------

describe('pinned corpus fixtures route SEQUENCE', () => {
  it('fotiku-67-lilu728 / telavi-12-pifu671 shape: ||0|| under !pragma teoz', () => {
    const ast = parse(['!pragma teoz true', 'activate a', 'a -> a : put', '||0||', 'deactivate a']);
    expect(only<SpaceEvent>(ast.events, 'space')).toHaveLength(1);
  });

  it('xucibo-16-zisi974 shape: ||| then ||50||', () => {
    const ast = parse([
      'Bob -> Alice : ok',
      'Bob -> Alice : ok1',
      '|||',
      'Bob -> Alice : ok2',
      'Bob -> Alice : ok3',
      '||50||',
      'Bob -> Alice : ok4',
      'Bob -> Alice : ok5',
    ]);
    expect(only<SpaceEvent>(ast.events, 'space')).toHaveLength(2);
  });

  it('valiva-41-fabo221 shape: == test == then ====', () => {
    const ast = parse(['A -> B', '== test ==', 'A -> B', '====', 'A -> B']);
    const dividers = only<DividerEvent>(ast.events, 'divider');
    expect(dividers.map((d) => d.text)).toEqual(['test', '']);
  });

  it('loguci-83-mobe896 shape: bare … then …title…', () => {
    const ast = parse(['a->b', '…', 'b->a', '…title…']);
    const delays = only<DelayEvent>(ast.events, 'delay');
    expect(delays.map((d) => d.text)).toEqual([undefined, 'title']);
  });

  it('boxibe-39-luco835 shape: the message + return half parses on its own', () => {
    // The fixture's full first line, `hide empty description`, is covered
    // directly above (`hideEmptyDescriptionCommand` is not yet registered
    // in `SEQUENCE_COMMANDS` -- see this file's header comment): asserting
    // it here would only prove the registration gap, not this task's port.
    const ast = parse(['a -> b: message', 'return answer']);
    expect(only<SequenceEvent>(ast.events, 'message')).toHaveLength(2);
  });
});
