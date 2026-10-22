/**
 * sdd2 T5d: note widths reach the participant row -- `NotesTile
 * #addConstraints` (`teoz/NotesTile.java:202-226`) and the note reaches of
 * `GroupingTile#stableMaxX`/`#stableMinX` (`:538-590`) and `getNotesWidth`
 * (`:1015-1021`).
 *
 * Expected lifeline centres are the jar's, read off the corpus `in.svg`
 * (lifeline hit-rect x + 3.5): cofuse-78-keri294, butosi-00-mali446,
 * putici-74-zenu027.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { NoteEvent } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import {
  scanMessageLabels,
  type SpanConstraint,
} from '../../../src/diagrams/sequence/sequence-layout-participant-constraints.js';
import { noteComponentWidth, noteTiles } from '../../../src/diagrams/sequence/sequence-note-width.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();
const env = { measurer, sprites: undefined };

function parse(lines: readonly string[]) {
  return astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
}

function centres(lines: readonly string[]): number[] {
  return layoutSequence(parse(lines), defaultTheme, measurer).participants.map((p) => p.centerX);
}

function constraints(lines: readonly string[]): SpanConstraint[] {
  const ast = parse(lines);
  const sorted = [...ast.participants].sort((a, b) => a.order - b.order);
  const out: SpanConstraint[] = [];
  scanMessageLabels(ast.events, sorted, { measurer, levels: undefined, sprites: ast.sprites }, out);
  return out;
}

function notesOf(lines: readonly string[]): NoteEvent[] {
  return parse(lines).events.filter((e): e is NoteEvent => e.kind === 'note');
}

describe('NotesTile#addConstraints (NotesTile.java:202-226)', () => {
  it('pushes B past A2 in a `/ note` group (cofuse-78: jar centres 102.728, 218.919)', () => {
    const got = centres([
      'participant "A" as A',
      'participant "B" as B',
      'note over A: A1',
      '/ note over A: A2 this line throws an error',
      '/ note over B: B1',
    ]);
    expect(got[0]).toBeCloseTo(102.728, 3);
    expect(got[1]).toBeCloseTo(218.919, 3);
  });

  it('mirrors the case when the later note is anchored further left (:219-222)', () => {
    const lines = ['participant A', 'participant B', 'note over B: wide second anchor text', '/ note over A: first'];
    const [wB, wA] = notesOf(lines).map((n) => noteComponentWidth(n, env));
    // x(B note) = cB - wB/2 must clear x2(A note) = cA + wA/2.
    expect(constraints(lines)).toEqual([{ from: 0, to: 1, span: wA! / 2 + wB! / 2 }]);
  });

  it('skips two notes anchored on the same participant (:212-214)', () => {
    expect(constraints(['participant A', 'note over A: one', '/ note over A: two'])).toEqual([]);
  });

  it('stacks a later LEFT note leftward of the earlier one on the same participant (:180-190)', () => {
    const lines = [
      'participant A',
      'participant B',
      'note left of A: first',
      '/ note left of A: second',
      '/ note left of B: third',
    ];
    const [first, , third] = notesOf(lines).map((n) => noteComponentWidth(n, env));
    // third (on B) clears the right edge of `first` (posC(A)) and of the
    // stacked `second` (posC(A) - first); the two A notes bind each other not.
    const spans = constraints(lines)
      .map((c) => c.span)
      .sort((x, y) => x - y);
    expect(spans).toHaveLength(2);
    expect(spans[0]).toBeCloseTo(third! - first!, 6);
    expect(spans[1]).toBeCloseTo(third!, 6);
  });

  it('puts B at the jar centre for a parallel pair (butosi-00: 43.538, 104.113)', () => {
    const got = centres(['participant P1', 'rnote over P2 : note 1', '/ note over P1 : note 2']);
    expect(got[0]).toBeCloseTo(43.538, 3);
    expect(got[1]).toBeCloseTo(104.113, 3);
  });
});

describe('note grouping', () => {
  it('joins a `/ note` to the tile before it and ignores a note on a message', () => {
    const ast = parse([
      'A -> B : m',
      'note right : on message',
      'note over A: one',
      '/ note over B: two',
      'note over A: lone',
    ]);
    expect(noteTiles(ast.events).map((t) => t.map((n) => n.text))).toEqual([['one', 'two'], ['lone']]);
  });
});

describe('GroupingTile note reaches (GroupingTile.java:538-590)', () => {
  it('pushes D past a right note on a message inside the group (putici-74: D at 487.269)', () => {
    const got = centres([
      'opt',
      'opt',
      'Axxx ->Bxxx : message1',
      'note left : this is a note',
      'else',
      'Axxx ->Bxxx : message2',
      'note over Axxx, Bxxx : this a very long note',
      'end',
      'Bxxx->Cxxx : message3',
      'note right : this is also long',
      'end',
      'opt',
      'Cxxx -> Dxxx : message4',
      'note left of Dxxx : this is to note',
      'end',
    ]);
    expect(got[2]).toBeCloseTo(319.806, 3);
    expect(got[3]).toBeCloseTo(487.269, 3);
  });

  it("adds a nested group's `end` note width to the margin (GroupingTile.java:613,1015-1021)", () => {
    const body = (note: readonly string[]): string[] => [
      'participant A',
      'participant B',
      'participant C',
      'opt',
      'opt',
      'A -> B : m',
      'end',
      ...note,
      'end',
      'B -> C : x',
    ];
    const plain = constraints(body([]));
    const noted = constraints(body(['note right: Some explication']));
    const width = noteComponentWidth(notesOf(['participant A', 'note over A: Some explication'])[0]!, env);
    const widest = (all: readonly SpanConstraint[]): number =>
      Math.max(...all.filter((c) => c.from === 0 && c.to === 2 && c.createdIndex === 2).map((c) => c.span));
    // The title reach of the outer group (A to C) grows by the nested group's
    // `end` note on its right.
    expect(widest(noted) - widest(plain)).toBeCloseTo(width, 6);
  });
});

describe('GroupingTile note reaches, per tile class (stableMaxX/stableMinX :538-590)', () => {
  const PARTICIPANTS = ['participant A', 'participant B', 'participant C', 'participant D'];
  /** `MARGINX + EXTERNAL_MARGINX2` (`GroupingTile.java:425,479`). */
  const CLEARANCE = 25;
  const TEXT = 'a note of some width';
  const width = (kind = 'note over A'): number =>
    noteComponentWidth(notesOf(['participant A', `${kind}: ${TEXT}`])[0]!, env);
  const inGroup = (...body: string[]): string[] => [...PARTICIPANTS, 'group g', ...body, 'end'];
  const spanOf = (lines: readonly string[], from: number, to: number): number[] =>
    constraints(lines)
      .filter((c) => c.from === from && c.to === to && c.createdIndex === to)
      .map((c) => c.span);

  /** The preceding participant's demands: a left edge is a plain centre span. */
  const leftSpans = (lines: readonly string[], from: number, to: number): number[] =>
    constraints(lines)
      .filter((c) => c.from === from && c.to === to && c.createdIndex === undefined)
      .map((c) => c.span);

  it('a right NoteTile reaches posC + width (NoteTile.getStableMaxX :236-241)', () => {
    expect(spanOf(inGroup('B -> B : s', `note right of B: ${TEXT}`), 1, 2)).toContain(width() + CLEARANCE);
  });

  it('an over NoteTile reaches posC + width / 2 on the right', () => {
    expect(spanOf(inGroup(`note over B: ${TEXT}`), 1, 2)).toContain(width() / 2 + CLEARANCE);
  });

  it('a left NoteTile reaches posC on the right and posC - width on the left', () => {
    expect(spanOf(inGroup(`note left of C: ${TEXT}`), 2, 3)).toContain(CLEARANCE);
    expect(leftSpans(inGroup(`note left of B: ${TEXT}`), 0, 1)).toContain(width() + CLEARANCE);
  });

  it('an over-several NoteTile reaches only posB of its first participant on the left (:257)', () => {
    expect(spanOf(inGroup(`note over B, C: ${TEXT}`), 0, 1)).toContain(CLEARANCE);
  });

  it('a member of a `Notes` group is not whitelisted (NotesTile composes a RealMax)', () => {
    const lines = inGroup(`note right of B: ${TEXT}`, `/ note right of B: ${TEXT}`);
    expect(spanOf(lines, 1, 2)).not.toContain(width() + CLEARANCE);
  });

  it('a right note on a reverse message hangs from the sender (TileBuilder.java:113-115)', () => {
    const lines = inGroup('C -> B : m', `note right : ${TEXT}`);
    expect(spanOf(lines, 2, 3)).toContain(width() + CLEARANCE);
  });

  it('a left note on a message hangs from the sender (TileBuilder.java:108-110)', () => {
    expect(leftSpans(inGroup('B -> C : m', `note left : ${TEXT}`), 0, 1)).toContain(width() + CLEARANCE);
  });

  it('a right note on a create message starts at posD, which is not a reach', () => {
    expect(spanOf(inGroup('B -> C ** : m', `note right : ${TEXT}`), 2, 3)).not.toContain(width() + CLEARANCE);
  });

  it('a self message adds its note to the drawn loop (CommunicationTileSelfNoteRight.java:174-178)', () => {
    const plain = spanOf(inGroup('B -> B : s'), 1, 2);
    const noted = spanOf(inGroup('B -> B : s', `note right : ${TEXT}`), 1, 2);
    expect(Math.max(...noted) - Math.max(...plain)).toBeCloseTo(width(), 6);
  });

  it('a self message adds its left note to the drawn loop on the left (CommunicationTileSelfNoteLeft.java:174-178)', () => {
    const plain = leftSpans(inGroup('B <- B : s'), 0, 1);
    const noted = leftSpans(inGroup('B <- B : s', `note left : ${TEXT}`), 0, 1);
    expect(Math.max(...noted) - Math.max(...plain)).toBeCloseTo(width(), 6);
  });

  it('an exo message takes note 0 position for every note (TileBuilder.java:128-136)', () => {
    expect(leftSpans(inGroup('[-> B : e', `note left : ${TEXT}`), 0, 1)).toContain(width() + CLEARANCE);
  });
});

describe('noteLiveEntries', () => {
  it('maps a right NoteTile in a group to its live level (NoteTile.java:155-173)', () => {
    const lines = [
      'participant A',
      'participant B',
      'participant C',
      'A -> B : m',
      'activate B',
      'group g',
      'note right of B: lvl',
      'end',
    ];
    const noted = constraints(lines)
      .filter((c) => c.from === 1 && c.to === 2 && c.createdIndex === 2)
      .map((c) => c.span);
    const w = noteComponentWidth(notesOf(['participant A', 'note over A: lvl'])[0]!, env);
    // level 1 at the note: posC + 5 + width, plus the frame clearance.
    expect(noted).toContain(5 + w + 25);
  });
});

describe('title overhang (GroupingTile.java:654-661, NoteTile.java:243-251)', () => {
  const header = ['participant A', 'participant B', 'participant C'];
  const group = (...body: string[]): string[] => [...header, 'group a long enough group title', ...body, 'end'];
  const titleReach = (lines: readonly string[]): number =>
    Math.max(
      ...constraints(lines)
        .filter((c) => c.from === 0 && c.to === 2 && c.createdIndex === 2)
        .map((c) => c.span),
    );
  const noteWidth = noteComponentWidth(notesOf(['participant A', 'note over A: text'])[0]!, env);

  it('a left NoteTile on the leftmost participant lowers the title reach by its width', () => {
    const base = titleReach(group('A -> B : m'));
    expect(base - titleReach(group('A -> B : m', 'note left of A: text'))).toBeCloseTo(noteWidth, 6);
  });

  it('an over NoteTile lowers it by half its width', () => {
    const base = titleReach(group('A -> B : m'));
    expect(base - titleReach(group('A -> B : m', 'note over A: text'))).toBeCloseTo(noteWidth / 2, 6);
  });
});
