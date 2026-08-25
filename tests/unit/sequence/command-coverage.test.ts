/**
 * T13 (mission dispatch-by-parse-attempt): unit coverage for the commands
 * ported in `sequence-commands.ts` (in-place widenings) and
 * `sequence-commands-2.ts` (net-new commands) to close the sequence
 * engine's refusal-coverage bucket. Each `describe` block cites the
 * upstream `Command` it exercises.
 */
import { describe, it, expect } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type {
  FrameEvent,
  MessageEvent,
  NoteEvent,
  SequenceDiagramAST,
  SequenceEvent,
} from '../../../src/diagrams/sequence/ast.js';

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

function messages(events: SequenceEvent[]): MessageEvent[] {
  return events.filter((e): e is MessageEvent => e.kind === 'message');
}

// ---------------------------------------------------------------------------
// !pragma — CommandPragma.java:101-134 (no-op recognition)
// ---------------------------------------------------------------------------

describe('!pragma', () => {
  it('recognises !pragma teoz true without affecting the AST', () => {
    const ast = parse(['participant Alice', '!pragma teoz true', 'Alice -> Alice : hi']);
    expect(ast.participants).toHaveLength(1);
    expect(messages(ast.events)).toHaveLength(1);
  });

  it('recognises !pragma svgparser sax', () => {
    const ast = parse(['!pragma svgparser sax', 'Alice -> Bob : hi']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Alice', 'Bob']);
  });
});

// ---------------------------------------------------------------------------
// rotate — CommandRotate.java:56-71
// ---------------------------------------------------------------------------

describe('rotate', () => {
  it('is recognised as a no-op', () => {
    const ast = parse(['rotate', 'Alice -> Bob : hi']);
    expect(messages(ast.events)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// scale — scale-command.ts (CommandScale*.java, 6 forms)
// ---------------------------------------------------------------------------

describe('scale', () => {
  it('stores a simple factor', () => {
    const ast = parse(['scale 2', 'Alice -> Bob : hi']);
    expect(ast.scale).toEqual({ kind: 'simple', factor: 2 });
  });

  it('stores a width-and-height form', () => {
    const ast = parse(['scale 100x30', 'Alice -> Bob : hi']);
    expect(ast.scale).toEqual({ kind: 'widthAndHeight', width: 100, height: 30 });
  });
});

// ---------------------------------------------------------------------------
// create — CommandParticipant.java:80-86,142-201
// ---------------------------------------------------------------------------

describe('create', () => {
  it('declares a plain-type participant', () => {
    const ast = parse(['create Dog', 'Dog -> Dog : bark']);
    expect(ast.participants[0]).toMatchObject({ id: 'Dog', type: 'participant' });
  });

  it('declares a typed participant', () => {
    const ast = parse(['create actor Bob', 'Bob -> Bob : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'Bob', type: 'actor' });
  });

  it('supports "create X as Y"', () => {
    const ast = parse(['create ThisIsTheLongNameOfAnInstance as T', 'T -> T : hi']);
    expect(ast.participants[0]).toMatchObject({ id: 'T', display: 'ThisIsTheLongNameOfAnInstance' });
  });
});

// ---------------------------------------------------------------------------
// newpage / minwidth / ignorenewpage / autonewpage / set separator
// ---------------------------------------------------------------------------

describe('page/layout no-ops', () => {
  it('recognises newpage and @newpage', () => {
    const ast = parse(['Alice -> Bob : a', 'newpage', 'Alice -> Bob : b', '@newpage', 'Alice -> Bob : c']);
    expect(messages(ast.events)).toHaveLength(3);
  });

  it('recognises minwidth, ignorenewpage, autonewpage, set separator', () => {
    const ast = parse([
      'minwidth 600',
      'ignorenewpage',
      'autonewpage 140',
      'set separator none',
      'Alice -> Bob : hi',
    ]);
    expect(messages(ast.events)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// hide unlinked / hide stereotype — CommandHideUnlinked.java:56-61
// ---------------------------------------------------------------------------

describe('hide unlinked', () => {
  it('drops participants no event references', () => {
    const ast = parse(['participant Alice', 'participant Ghost', 'hide unlinked', 'Alice -> Alice : hi']);
    expect(ast.participants.map((p) => p.id)).toEqual(['Alice']);
  });

  it('accepts the @unlinked spelling and hide stereotype', () => {
    const ast = parse(['hide @unlinked', 'hide stereotype', 'Alice -> Bob : hi']);
    expect(messages(ast.events)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// autoactivate — CommandAutoactivate.java
// ---------------------------------------------------------------------------

describe('autoactivate', () => {
  it('is recognised (write-only)', () => {
    const ast = parse(['autoactivate on', 'Alice -> Bob : hi', 'autoactivate off']);
    expect(messages(ast.events)).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// autonumber — CommandAutonumber.java:58-74, DottedNumber.java:75-79
// ---------------------------------------------------------------------------

describe('autonumber', () => {
  it('applies a step', () => {
    const ast = parse(['autonumber 100 10', 'Alice -> Bob : a', 'Alice -> Bob : b']);
    const [a, b] = messages(ast.events);
    expect(a?.sequenceNumber).toBe(100);
    expect(b?.sequenceNumber).toBe(110);
  });

  it('renders a dotted start as prefix + incrementing last segment', () => {
    const ast = parse(['autonumber 1.1', 'Alice -> Bob : a', 'Alice -> Bob : b']);
    const [a, b] = messages(ast.events);
    expect(a?.sequenceLabel).toBe('1.1');
    expect(b?.sequenceLabel).toBe('1.2');
  });

  it('applies a quoted zero-pad format', () => {
    const ast = parse(['autonumber "<b>[000]"', 'Alice -> Bob : a']);
    expect(messages(ast.events)[0]?.sequenceLabel).toBe('<b>[001]');
  });
});

// ---------------------------------------------------------------------------
// end opt / end group / par2 / also — CommandGrouping.java:64-73
// ---------------------------------------------------------------------------

describe('frame keyword widening', () => {
  it('closes with a trailing keyword ("end opt")', () => {
    const ast = parse(['opt', 'Alice -> Bob : hi', 'end opt']);
    const frame = ast.events[0];
    expect(frame?.kind).toBe('frame');
    expect((frame as FrameEvent).frameType).toBe('opt');
  });

  it('supports par2 and the unspaced endbox', () => {
    const ast = parse(['box "B"', 'participant Alice', 'endbox', 'par2', 'Alice -> Alice : hi', 'end']);
    expect(ast.boxes[0]?.label).toBe('B');
    const frame = ast.events.find((e): e is FrameEvent => e.kind === 'frame');
    expect(frame?.frameType).toBe('par2');
  });

  it('supports "also" as an alias for "else"', () => {
    const ast = parse(['alt cond', 'Alice -> Bob : a', 'also other', 'Alice -> Bob : b', 'end']);
    const frame = ast.events[0] as FrameEvent;
    expect(frame.branchLabels).toEqual(['cond', 'other']);
  });
});

// ---------------------------------------------------------------------------
// ref over — CommandReferenceOverSeveral.java / CommandReferenceMultilinesOverSeveral.java
// ---------------------------------------------------------------------------

describe('ref over', () => {
  it('parses the single-line form', () => {
    const ast = parse(['participant Alice', 'participant Bob', 'ref over Alice, Bob : short text']);
    const frame = ast.events[0] as FrameEvent;
    expect(frame.frameType).toBe('ref');
    expect(frame.label).toBe('short text');
  });

  it('parses the multi-line form, closed by "end ref"', () => {
    const ast = parse(['ref over Bob', 'line one', 'line two', 'end ref']);
    const frame = ast.events[0] as FrameEvent;
    expect(frame.frameType).toBe('ref');
    expect(frame.label).toBe('line one\nline two');
  });

  it('a bare "end" also closes a multi-line ref', () => {
    const ast = parse(['ref over Bob', 'body', 'end']);
    const frame = ast.events[0] as FrameEvent;
    expect(frame.label).toBe('body');
  });
});

// ---------------------------------------------------------------------------
// reverse / decorated arrows — CommandArrow.java:296-338
// ---------------------------------------------------------------------------

describe('reverse and decorated arrows', () => {
  it('swaps from/to for a plain reverse arrow', () => {
    const [msg] = messages(parse(['Bob <- Alice : hello']).events);
    expect(msg).toMatchObject({ from: 'Alice', to: 'Bob', style: 'sync' });
  });

  it('a dashed reverse arrow is a reply', () => {
    const [msg] = messages(parse(['Alice <-- Bob : response']).events);
    expect(msg).toMatchObject({ from: 'Bob', to: 'Alice', style: 'reply' });
  });

  it('places a circle decoration at the arrowhead for ->o', () => {
    const [msg] = messages(parse(['Alice ->o Bob : hello']).events);
    expect(msg).toMatchObject({ from: 'Alice', to: 'Bob', headCircle: true });
  });

  it('places a cross decoration at the tail for x->', () => {
    const [msg] = messages(parse(['Bob x-> Alice : hop']).events);
    expect(msg).toMatchObject({ from: 'Bob', to: 'Alice', tailCross: true });
  });

  it('does not mis-parse an exo-arrow bracket form as a participant', () => {
    // `[o<-x b` is CommandExoArrowAny's syntax (unported, T13 residual);
    // this asserts the bracketed token is REFUSED, not swallowed as a
    // literal participant named "[o<-x".
    const line = refusalLine(['participant b', '[o<-x b : hop']);
    expect(line).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// note on arrow / styled note / note across
// ---------------------------------------------------------------------------

describe('note attached to the last message', () => {
  it('note left attaches to the message source, note right to its target', () => {
    const ast = parse(['Alice -> Bob : hello', 'note left : L', 'note right : R']);
    const notes = ast.events.filter((e): e is NoteEvent => e.kind === 'note');
    expect(notes[0]).toMatchObject({ position: 'left', participants: ['Alice'], text: 'L' });
    expect(notes[1]).toMatchObject({ position: 'right', participants: ['Bob'], text: 'R' });
  });

  it('a multi-line bare note accumulates text until "end note"', () => {
    const ast = parse(['Alice -> Bob : hello', 'note left', 'line 1', 'line 2', 'end note']);
    const note = ast.events.find((e): e is NoteEvent => e.kind === 'note');
    expect(note?.text).toBe('line 1\nline 2');
  });

  it('does nothing when there is no prior message', () => {
    const ast = parse(['participant Alice', 'note left : orphan']);
    expect(ast.events.filter((e) => e.kind === 'note')).toHaveLength(0);
  });
});

describe('rnote/hnote and note<<stereotype>>', () => {
  it('rnote over a single participant renders as a rect-shaped note', () => {
    const ast = parse(['participant Bob', 'rnote over Bob', 'text', 'end note']);
    const note = ast.events.find((e): e is NoteEvent => e.kind === 'note');
    expect(note).toMatchObject({ shape: 'rect', position: 'over', participants: ['Bob'] });
  });

  it('note<<stereotype>> over A is recognised', () => {
    const ast = parse(['participant A', 'note<<st1>> over A : text 1']);
    const note = ast.events.find((e): e is NoteEvent => e.kind === 'note');
    expect(note?.text).toBe('text 1');
  });
});

describe('note across', () => {
  it('spans every participant declared so far', () => {
    const ast = parse(['participant A', 'participant B', 'note across : spanning']);
    const note = ast.events.find((e): e is NoteEvent => e.kind === 'note');
    expect(note?.participants).toEqual(['A', 'B']);
  });
});

// ---------------------------------------------------------------------------
// box stereotype / unquoted label — CommandBoxStart.java:65-77
// ---------------------------------------------------------------------------

describe('box widening', () => {
  it('accepts an unquoted label with a gradient color', () => {
    const ast = parse(['box BoxOfAlice #yellow/blue', 'participant Alice', 'end box']);
    expect(ast.boxes[0]).toMatchObject({ label: 'BoxOfAlice', color: '#yellow/blue' });
  });

  it('accepts a trailing stereotype', () => {
    const ast = parse(['box "Tier 1"  <<Client>>', 'participant Alice', 'end box']);
    expect(ast.boxes[0]?.label).toBe('Tier 1');
  });
});
