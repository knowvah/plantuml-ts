/**
 * T8: `FactorySequenceNoteCommand`'s four previously-unported groups —
 * PARTICIPANT's optional `of`, VMERGE, STYLE (`hnote`/`rnote` combined with
 * `of`-optional/PARALLEL/VMERGE), and StereotypePattern — plus the sibling
 * fix to `FactorySequenceNoteOnArrowCommand`'s STEREO1/STEREO2 spacing.
 *
 * `tests/unit/sequence/parser.test.ts`'s "note events" block already covers
 * the pre-existing `note left of|right of|over` fast path (`noteCommand`);
 * this file exercises only what `styledNoteCommand`/`noteOnArrowCommand`
 * newly accept.
 *
 * @see command/note/sequence/FactorySequenceNoteCommand.java:76-98
 * @see command/note/sequence/FactorySequenceNoteOnArrowCommand.java:78-103
 */
import { describe, expect, it } from 'vitest';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { NoteEvent, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';

function parse(lines: string[]): SequenceDiagramAST {
  const result = parseSequence(lines);
  if ('refused' in result) {
    throw new Error(`parseSequence refused (${result.kind}) at line ${String(result.line)}: ${result.message}`);
  }
  return result;
}

function firstNote(ast: SequenceDiagramAST): NoteEvent {
  const ev = ast.events.find((e): e is NoteEvent => e.kind === 'note');
  if (ev === undefined) throw new Error('expected a note event');
  return ev;
}

describe('PARTICIPANT: `of` is optional (FactorySequenceNoteCommand.java:83-85,102)', () => {
  it('note over Bob : x -- "over" never took "of" -- still attaches to Bob', () => {
    const ast = parse(['participant Bob', 'note over Bob : x']);
    const ev = firstNote(ast);
    expect(ev.position).toBe('over');
    expect(ev.participants).toEqual(['Bob']);
    expect(ev.text).toBe('x');
  });

  it('note left Bob : x -- no "of" -- attaches to Bob same as "left of"', () => {
    const ast = parse(['participant Bob', 'note left Bob : x']);
    const ev = firstNote(ast);
    expect(ev.position).toBe('left');
    expect(ev.participants).toEqual(['Bob']);
    expect(ev.text).toBe('x');
  });

  it('note right FMSSrv: text -- bare identifier, no "of", no colon-space', () => {
    const ast = parse(['participant FMSSrv', 'note right FMSSrv: Not decided how to send no data.']);
    const ev = firstNote(ast);
    expect(ev.position).toBe('right');
    expect(ev.participants).toEqual(['FMSSrv']);
    expect(ev.text).toBe('Not decided how to send no data.');
  });

  it('note left "Long Alice" : hello -- quoted participant, no "of"', () => {
    const ast = parse(['participant "Long Alice" as A', 'note left "Long Alice" : hello']);
    const ev = firstNote(ast);
    expect(ev.participants).toEqual(['Long Alice']);
    expect(ev.text).toBe('hello');
  });

  it('note over Alice, "Long Alice" : ok -- comma list unquotes each entry', () => {
    const ast = parse([
      'participant Alice',
      'participant "Long Alice" as B',
      'note over Alice, "Long Alice" : ok',
    ]);
    const ev = firstNote(ast);
    expect(ev.participants).toEqual(['Alice', 'Long Alice']);
  });

  it('trailing color needs no leading space -- C#tomato', () => {
    const ast = parse(['participant A', 'participant C', 'note over A, C#tomato: text']);
    const ev = firstNote(ast);
    expect(ev.participants).toEqual(['A', 'C']);
    expect(ev.color).toBe('#tomato');
    expect(ev.text).toBe('text');
  });

  it('compound color spec -- #green;line:lightblue', () => {
    const ast = parse(['participant A', 'note over A #green;line:lightblue : text1']);
    const ev = firstNote(ast);
    expect(ev.color).toBe('#green;line:lightblue');
    expect(ev.text).toBe('text1');
  });

  it('compound color spec with leading key -- #back:green;line:lightblue', () => {
    const ast = parse(['participant B', 'note over B #back:green;line:lightblue : text2']);
    const ev = firstNote(ast);
    expect(ev.color).toBe('#back:green;line:lightblue');
  });

  it('two-stop gradient color -- #yellow/blue, multi-line form', () => {
    const ast = parse(['participant Alice', 'note over Alice #yellow/blue', 'body', 'end note']);
    const ev = firstNote(ast);
    expect(ev.color).toBe('#yellow/blue');
    expect(ev.text).toBe('body');
  });
});

describe('VMERGE: leading `/` merges vertically (FactorySequenceNoteCommand.java:79,96)', () => {
  it('/ note over Bob : x -- parses, does not refuse, carries vmerge:true', () => {
    const ast = parse(['participant Bob', 'note over Bob : first', '/ note over Bob : second']);
    const notes = ast.events.filter((e): e is NoteEvent => e.kind === 'note');
    expect(notes).toHaveLength(2);
    expect(notes[0]?.vmerge).toBeUndefined();
    expect(notes[1]?.vmerge).toBe(true);
    expect(notes[1]?.text).toBe('second');
  });

  it('/ note over Alice3 (multi-line, no colon) still opens a pending note', () => {
    const ast = parse(['participant Alice3', '/ note over Alice3', 'body line', 'end note']);
    const ev = firstNote(ast);
    expect(ev.vmerge).toBe(true);
    expect(ev.text).toBe('body line');
  });

  it('/ note right of Alice: NOTE2 -- vmerge combines with the "of" form', () => {
    const ast = parse(['participant Alice', '/ note right of Alice: NOTE2']);
    const ev = firstNote(ast);
    expect(ev.position).toBe('right');
    expect(ev.vmerge).toBe(true);
    expect(ev.text).toBe('NOTE2');
  });
});

describe('PARALLEL: leading `&` (FactorySequenceNoteCommand.java:78,95, D4)', () => {
  it('& note right of David : x -- parses, does not refuse, carries parallel:true', () => {
    const ast = parse(['participant David', '& note right of David : Should be same level as "1"']);
    const ev = firstNote(ast);
    expect(ev.position).toBe('right');
    expect(ev.parallel).toBe(true);
    expect(ev.text).toBe('Should be same level as "1"');
  });

  it('D4: parallel is stored on the event but nothing reads it for layout', () => {
    // The event carries `parallel: true`; this test only pins that the
    // field is populated, not any renderer behaviour -- the classic
    // renderer has no consumer of it (D4), so there is nothing else to
    // assert here without reaching into teoz-only code this port does not
    // have.
    const ast = parse(['participant Ken', '& note right of Ken: txt']);
    expect(firstNote(ast).parallel).toBe(true);
  });
});

describe('STYLE: hnote/rnote combined with of-optional/PARALLEL/VMERGE', () => {
  it('hnote left Alice: text -- no "of", style hnote, shape rect', () => {
    const ast = parse(['participant Alice', 'hnote left Alice: hnote text']);
    const ev = firstNote(ast);
    expect(ev.style).toBe('hnote');
    expect(ev.shape).toBe('rect');
    expect(ev.participants).toEqual(['Alice']);
    expect(ev.text).toBe('hnote text');
  });

  it('rnote right Bob: text -- no "of", style rnote, shape rect', () => {
    const ast = parse(['participant Bob', 'rnote right Bob: rnote text']);
    const ev = firstNote(ast);
    expect(ev.style).toBe('rnote');
    expect(ev.shape).toBe('rect');
    expect(ev.participants).toEqual(['Bob']);
  });

  it('hnote over Alice: text -- style stored even in the plain "over" shape', () => {
    const ast = parse(['participant Alice', 'hnote over Alice: over text']);
    const ev = firstNote(ast);
    expect(ev.style).toBe('hnote');
    expect(ev.position).toBe('over');
  });
});

describe('StereotypePattern: <<stereo>> before or after the position', () => {
  it('note <<red>> over Alice: x -- STEREO1, before the position', () => {
    const ast = parse(['participant Alice', 'note <<red>> over Alice: x']);
    const ev = firstNote(ast);
    expect(ev.stereotype).toBe('<<red>>');
    expect(ev.position).toBe('over');
  });

  it('note over Alice <<red>>: x -- STEREO2, after the participant', () => {
    const ast = parse(['participant Alice', 'note over Alice <<red>>: x']);
    const ev = firstNote(ast);
    expect(ev.stereotype).toBe('<<red>>');
  });

  it('note <<red>> left -- on-arrow form, STEREO1 with a space (spacing fix)', () => {
    const ast = parse(['participant A', 'participant B', 'A -> B: hi', 'note <<red>> left', 'something', 'end note']);
    const ev = firstNote(ast);
    expect(ev.stereotype).toBe('<<red>>');
    expect(ev.position).toBe('left');
    expect(ev.text).toBe('something');
  });

  it('note left <<red>> -- on-arrow form, STEREO2 (previously unported)', () => {
    const ast = parse(['participant A', 'participant B', 'A -> B: hi', 'note left <<red>>', 'something', 'end note']);
    const ev = firstNote(ast);
    expect(ev.stereotype).toBe('<<red>>');
    expect(ev.position).toBe('left');
  });
});

describe('noteOnArrowCommand: style and color are now stored on the event', () => {
  it('hnote right: text -- style hnote, shape rect, attaches to last message target', () => {
    const ast = parse(['participant A', 'participant B', 'A -> B: hi', 'hnote right: hexagonal']);
    const ev = firstNote(ast);
    expect(ev.style).toBe('hnote');
    expect(ev.shape).toBe('rect');
    expect(ev.participants).toEqual(['B']);
    expect(ev.text).toBe('hexagonal');
  });

  it('note left #palegreen: text -- color captured via the shared NOTE_COLOR grammar', () => {
    const ast = parse(['participant A', 'participant B', 'A -> B: hi', 'note left #palegreen: colored']);
    const ev = firstNote(ast);
    expect(ev.color).toBe('#palegreen');
    expect(ev.participants).toEqual(['A']);
  });
});

describe('mixed markers on one line', () => {
  it('& / note over Bob : x -- PARALLEL and VMERGE both fire', () => {
    const ast = parse(['participant Bob', '& / note over Bob : x']);
    const ev = firstNote(ast);
    expect(ev.parallel).toBe(true);
    expect(ev.vmerge).toBe(true);
  });
});
