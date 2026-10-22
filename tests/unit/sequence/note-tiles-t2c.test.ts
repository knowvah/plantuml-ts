/**
 * sdd2 T2c: the `Notes` group (`/ note`) and the lifeline / x a note on a
 * message starts at. Expected values cite the Java or a jar golden.
 */
import { describe, it, expect } from 'vitest';

import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { MessageGeo, NoteGeo, ParticipantGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

interface Laid {
  readonly notes: NoteGeo[];
  readonly messages: MessageGeo[];
  readonly participants: ParticipantGeo[];
}

function laid(lines: readonly string[]): Laid {
  const ast = parseSequence(sequenceSource([...lines])) as SequenceDiagramAST;
  const geo = layoutSequence(ast, defaultTheme, new DeterministicMeasurer());
  return {
    notes: geo.events.filter((e): e is NoteGeo => e.kind === 'note'),
    messages: geo.events.filter((e): e is MessageGeo => e.kind === 'message'),
    participants: geo.participants,
  };
}

/** `NoteTile`'s inset of the drawn box in its tile, `Rose.paddingX`. */
const BOX_INSET = 5;
const TALL = 'note over B : x\\ny\\nz';

describe('/ note (SequenceDiagram#addNote tryMerge -> Notes -> NotesTile)', () => {
  // `NotesTile#drawU:124-138`: one `dy(getYGauge().getMin())` for every note.
  it('draws every note of the group at the same top', () => {
    const { notes } = laid(['participant A', 'participant B', 'note over A : 1', '/ ' + TALL]);
    expect(notes).toHaveLength(2);
    expect(notes[1]!.y).toBe(notes[0]!.y);
  });

  // `NotesTile#getPreferredHeight:192-200`: the tallest member, nothing added.
  it('is as tall as its tallest member', () => {
    const merged = laid(['participant A', 'participant B', 'note over A : 1', '/ ' + TALL, 'A -> B : m']);
    const tallOnly = laid(['participant A', 'participant B', TALL, 'A -> B : m']);
    expect(merged.messages[0]!.y).toBe(tallOnly.messages[0]!.y);
  });

  it('without the slash the second note stacks below the first', () => {
    const { notes } = laid(['participant A', 'participant B', 'note over A : 1', TALL]);
    expect(notes[1]!.y).toBeGreaterThan(notes[0]!.y);
  });

  // `NotesTile#getX:152-165` + `getStackingOffset:180-190`: same side, same
  // participant -> the later note sits beyond the earlier one's whole width.
  it('stacks same-side notes of one participant side by side', () => {
    const { notes } = laid(['participant A', 'note left of A : one', '/ note left of A : second note']);
    const used1 = notes[1]!.maxX - notes[1]!.minX;
    expect(notes[1]!.minX).toBe(notes[0]!.minX - used1);
  });

  it('a note on a message between two notes breaks nothing: it is not an event', () => {
    const { notes } = laid([
      'participant A',
      'participant B',
      'note over A : 1',
      'A -> B : m',
      'note right : on m',
      '/ note over B : 2',
    ]);
    // upstream's last event is the message, not a Note: no merge
    expect(notes.find((n) => n.text === '2')!.y).toBeGreaterThan(notes.find((n) => n.text === '1')!.y);
  });
});

describe('the lifeline a note on a message hangs from (TileBuilder.java:108-115)', () => {
  it('forward message: left of the source, right of the target', () => {
    const { notes, participants } = laid(['participant A', 'participant B', 'A -> B : m', 'note right : r']);
    expect(notes[0]!.x).toBe(participants[1]!.centerX + BOX_INSET);
  });

  it('reverse message: right takes ls1, the source, which sits right of the target', () => {
    const { notes, participants } = laid(['participant A', 'participant B', 'B -> A : m', 'note right : r']);
    expect(notes[0]!.x).toBe(participants[1]!.centerX + BOX_INSET);
  });

  it('reverse message: left takes ls2, the target', () => {
    const { notes, participants } = laid(['participant A', 'participant B', 'B -> A : m', 'note left : l']);
    expect(notes[0]!.x + notes[0]!.maxX - notes[0]!.minX).toBe(participants[0]!.centerX + BOX_INSET);
  });
});

describe('a right note on a create message (CommunicationTileNoteRight.java:122-124)', () => {
  it('starts at the created head posD', () => {
    const { notes, participants } = laid(['participant A', 'A -> B ** : new', 'note right : r']);
    const b = participants[1]!;
    expect(notes[0]!.x).toBe(b.x + b.width + BOX_INSET);
  });
});

describe('a right note on a self message (CommunicationTileSelfNoteRight.java:108-110)', () => {
  // `ComponentRoseSelfArrow#getPreferredWidth:326-328`: the floor of 50.
  it('starts a short loop 50 right of the lifeline', () => {
    const { notes, participants } = laid(['participant A', 'A -> A : a', 'note right : r']);
    expect(notes[0]!.x).toBe(participants[0]!.centerX + 50 + BOX_INSET);
  });

  // The jar's own `fozeva-08-tife475`: "working in progress" is 112.694 wide,
  // + 2 * 7 padding; the note box is drawn at x=388.525 (golden `in.svg`).
  it('starts a long-label loop at the label width plus its paddings (fozeva golden)', () => {
    const { notes } = laid([
      'hide footbox',
      'participant "Bob on\\nseveral lines" as Bob',
      'actor Alice',
      'Bob -> Alice : hello',
      'note right of Alice',
      '  this is a note',
      'end note',
      'Alice -> Bob : Is it ok\\nwith a message that is\\non several lines?',
      'note right',
      '  This other note',
      '  should work',
      '  on several lines',
      'end note',
      '== This is a separation ==',
      'Bob -> Last : Yes it works!',
      'Last -> Last : working in progress',
      'note right : this is\\nanother note',
    ]);
    // The first two notes are the jar's 213.394: the second hangs from Alice,
    // the SOURCE of a reverse message (`TileBuilder.java:108-115`).
    expect(notes[1]!.x).toBeCloseTo(213.394, 2);
    expect(notes[2]!.x).toBeCloseTo(388.525, 2);
  });
});

describe('note bottom / note top on a message (CommunicationTileNoteBottom/Top)', () => {
  // Golden `macuca-31-lare733` (`in.svg`): Alice (centre 32.225) -> Bob (91),
  // `hello1` at y=66; `note bottom : my note`; `hello2`; `note top` of 2 lines.
  const SOURCE = [
    'Alice -> Bob : hello1',
    'note bottom : my note',
    'Alice -> Bob : hello2',
    'note top',
    '  my note',
    '  is on several line',
    'end note',
  ];

  // `CommunicationTileNoteBottom.java:59-77`: the note at `xNote = tile.getMinX()`
  // (+5 inset), `tile.getPreferredHeight() + spacey(10)` below the tile top;
  // the line from (middleMsg, contact) to (xNote + w/2, that + Rose.paddingY).
  it('bottom: the note sits below the message and a line joins them', () => {
    const { notes, messages } = laid(SOURCE);
    const bottom = notes[0]!;
    expect(bottom.x).toBeCloseTo(37.225, 3);
    expect(bottom.y).toBeCloseTo(89, 3);
    const c = bottom.connector!;
    expect([c.x1, c.y1, c.x2, c.y2]).toEqual([expect.closeTo(61.613, 2), 66, expect.closeTo(70.8, 2), 89]);
    expect(messages[0]!.y).toBe(66);
  });

  // `CommunicationTileNoteTop.java:59-75`: the note at the tile top, the
  // message drawn `note height + spacey` lower, the line from the message
  // contact down in the note to `noteHeight - 2 * Rose.paddingY`.
  it('top: the note is first and the message is pushed below it', () => {
    const { notes, messages } = laid(SOURCE);
    const top = notes[1]!;
    expect(top.y).toBeCloseTo(122, 3);
    expect(messages[1]!.y).toBeCloseTo(192, 3);
    const c = top.connector!;
    expect([c.x1, c.y1, c.x2, c.y2]).toEqual([expect.closeTo(61.613, 2), 192, expect.closeTo(96.15, 2), 153]);
  });

  // `CommunicationTileNoteBottomTopAbstract.java:134-138`.
  it('the tile is as tall as the message, the note and the 10px spacey together', () => {
    const { messages } = laid(SOURCE);
    // golden: hello1 at y=66, hello2 at y=192 (message + note + spacey + the
    // top note's own height and spacey, which pushes hello2 down)
    expect(messages[1]!.y - messages[0]!.y).toBeCloseTo(126, 3);
  });
});
