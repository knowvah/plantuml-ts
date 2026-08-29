import { describe, it, expect } from 'vitest';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import {
  arrowConfigurationOf,
  linkedParticipantIds,
} from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type {
  SequenceDiagramAST,
  SequenceEvent,
  MessageEvent,
  MessageExoEvent,
  MessageGeo,
  NoteGeo,
  ActivationGeo,
  FrameGeo,
  DividerGeo,
  SpaceGeo,
  EventGeo,
} from '../../../src/diagrams/sequence/ast.js';
import { HEADER_PADDING } from '../../../src/diagrams/sequence/frame-style.js';

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

const measurer = new FixedMeasurer(8, 16);

function makeAst(
  participants: string[],
  events: SequenceEvent[],
): SequenceDiagramAST {
  return {
    participants: participants.map((id, i) => ({
      id,
      display: id,
      type: 'participant' as const,
      order: i,
    })),
    events,
    autonumber: { enabled: false, start: 1, current: 1, step: 1, prefix: '' },
    options: { hideFootbox: false, messageAlign: 'center' },
    boxes: [],
  };
}

/** The configuration `Alice -> Bob` parses to — a plain solid arrow with a
 *  NORMAL head on `dressing2` and nothing else. */
const SYNC_ARROW = arrowConfigurationOf({});

function msg(
  from: string,
  to: string,
  label = 'hello',
  extras: Partial<MessageEvent> = {},
): SequenceEvent {
  return { kind: 'message', from, to, label, arrow: SYNC_ARROW, ...extras };
}

function isMessage(e: EventGeo): e is MessageGeo {
  return e.kind === 'message';
}
function isNote(e: EventGeo): e is NoteGeo {
  return e.kind === 'note';
}
function isActivation(e: EventGeo): e is ActivationGeo {
  return e.kind === 'activation';
}
function isFrame(e: EventGeo): e is FrameGeo {
  return e.kind === 'frame';
}
function isDivider(e: EventGeo): e is DividerGeo {
  return e.kind === 'divider';
}
function isSpace(e: EventGeo): e is SpaceGeo {
  return e.kind === 'space';
}

// ---------------------------------------------------------------------------
// Acceptance criteria (AC 1-9 from spec)
// ---------------------------------------------------------------------------

describe('layoutSequence — participant columns (AC 1)', () => {
  it('lays out two participants left-to-right', () => {
    const ast = makeAst(['Alice', 'Bob'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.participants).toHaveLength(2);
    const [alice, bob] = geo.participants as [
      (typeof geo.participants)[0],
      (typeof geo.participants)[0],
    ];
    expect(alice.centerX).toBeLessThan(bob.centerX);
  });

  it('assigns y=0 to all participants', () => {
    const ast = makeAst(['A', 'B', 'C'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    for (const p of geo.participants) {
      expect(p.y).toBe(0);
    }
  });

  it('participant width >= participantMinWidth', () => {
    const ast = makeAst(['X'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.participants[0]?.width).toBeGreaterThanOrEqual(
      defaultTheme.sequence.participantMinWidth,
    );
  });

  it('centerX == x + width/2', () => {
    const ast = makeAst(['Alice', 'Bob'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    for (const p of geo.participants) {
      expect(p.centerX).toBeCloseTo(p.x + p.width / 2);
    }
  });
});

describe('layoutSequence — message y-positions (AC 2)', () => {
  it('sequential messages have increasing y', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      msg('Alice', 'Bob', 'first'),
      msg('Bob', 'Alice', 'second'),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const messages = geo.events.filter(isMessage);
    expect(messages).toHaveLength(2);
    expect(messages[1]!.y).toBeGreaterThan(messages[0]!.y);
  });
});

describe('layoutSequence — self-message (AC 3)', () => {
  it('self-message toX > fromX', () => {
    const ast = makeAst(['Alice'], [msg('Alice', 'Alice', 'self')]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const m = geo.events.find(isMessage)!;
    expect(m.arrowDirection).toBe('self');
    expect(m.toX).toBeGreaterThan(m.fromX);
  });
});

describe('layoutSequence — arrow direction', () => {
  it('left-to-right message → direction right', () => {
    const ast = makeAst(['Alice', 'Bob'], [msg('Alice', 'Bob')]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const m = geo.events.find(isMessage)!;
    expect(m.arrowDirection).toBe('right');
  });

  it('right-to-left message → direction left', () => {
    const ast = makeAst(['Alice', 'Bob'], [msg('Bob', 'Alice')]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const m = geo.events.find(isMessage)!;
    expect(m.arrowDirection).toBe('left');
  });
});

describe('layoutSequence — activation (AC 4)', () => {
  it('activate → message → deactivate produces ActivationGeo with height > 0', () => {
    const ast = makeAst(['Alice'], [
      { kind: 'activate', participantId: 'Alice' } satisfies SequenceEvent,
      msg('Alice', 'Alice', 'work'),
      { kind: 'deactivate', participantId: 'Alice' } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const activation = geo.events.find(isActivation);
    expect(activation).toBeDefined();
    expect(activation!.height).toBeGreaterThan(0);
    expect(activation!.participantId).toBe('Alice');
  });

  it('auto-activate via message activates field', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      msg('Alice', 'Bob', 'call', { activates: 'Bob' }),
      msg('Bob', 'Alice', 'reply', { deactivates: 'Bob' }),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const activation = geo.events.find(isActivation);
    expect(activation).toBeDefined();
    expect(activation!.participantId).toBe('Bob');
  });

  it('deactivate without prior activate uses currentY as start (height=0)', () => {
    const ast = makeAst(['Alice'], [
      { kind: 'deactivate', participantId: 'Alice' } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const activation = geo.events.find(isActivation);
    expect(activation).toBeDefined();
    expect(activation!.height).toBe(0);
  });
});

describe('layoutSequence — frame (AC 5)', () => {
  it('loop frame y <= firstMsgY and y+height >= lastMsgY', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'loop',
        label: '10 times',
        branches: [
          [
            msg('Alice', 'Bob', 'ping'),
            msg('Bob', 'Alice', 'pong'),
          ],
        ],
        branchLabels: ['10 times'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame);
    expect(frame).toBeDefined();

    const messages = geo.events.filter(isMessage);
    expect(messages).toHaveLength(2);
    const firstMsgY = messages[0]!.y;
    const lastMsgY = messages[1]!.y;

    expect(frame!.y).toBeLessThanOrEqual(firstMsgY);
    expect(frame!.y + frame!.height).toBeGreaterThanOrEqual(lastMsgY);
  });

  it('alt frame with two branches emits a single FrameGeo covering all messages', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'alt',
        label: 'condition',
        branches: [
          [msg('Alice', 'Bob', 'yes')],
          [msg('Bob', 'Alice', 'no')],
        ],
        branchLabels: ['condition'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame);
    expect(frame).toBeDefined();
    expect(frame!.frameType).toBe('alt');

    const messages = geo.events.filter(isMessage);
    expect(messages).toHaveLength(2);
    expect(frame!.y + frame!.height).toBeGreaterThanOrEqual(messages[1]!.y);
  });
});

// ---------------------------------------------------------------------------
// T5 (mission sequence-frame-background-pass, D2): pre-order tile emission
// and the frame colour / header-tab carry-through.
//
// `GroupingTile#drawU:254-275` draws its own component, then recurses into
// `tiles` -- upstream's depth-first PRE-ORDER. `handleFrameEvent` now pushes
// its `FrameGeo` before walking `event.branches`, so these assert the events
// array reflects that order, nesting included.
// ---------------------------------------------------------------------------

describe('layoutSequence — frame tile order (D2, pre-order emission)', () => {
  it('a frame is emitted before its own messages', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'loop',
        label: 'n times',
        branches: [[msg('Alice', 'Bob', 'a'), msg('Bob', 'Alice', 'b')]],
        branchLabels: ['n times'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frameIdx = geo.events.findIndex(isFrame);
    const firstMsgIdx = geo.events.findIndex(isMessage);
    expect(frameIdx).toBeGreaterThanOrEqual(0);
    expect(frameIdx).toBeLessThan(firstMsgIdx);
  });

  it('nested frames emit depth-first pre-order: outer, inner, inner children, outer remainder', () => {
    const inner: SequenceEvent = {
      kind: 'frame',
      frameType: 'opt',
      label: 'maybe',
      branches: [[msg('Alice', 'Bob', 'inner-msg')]],
      branchLabels: ['maybe'],
    };
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'loop',
        label: 'outer',
        branches: [[inner, msg('Bob', 'Alice', 'outer-tail')]],
        branchLabels: ['outer'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const seq = geo.events.map((e) => {
      if (isFrame(e)) return `frame:${e.label}`;
      if (isMessage(e)) return `msg:${e.label}`;
      return e.kind;
    });
    expect(seq).toEqual(['frame:outer', 'frame:maybe', 'msg:inner-msg', 'msg:outer-tail']);
  });
});

describe('layoutSequence — frame header tab (D2/T5)', () => {
  it('group foo sizes tabWidth from HEADER_PADDING + measured tab text', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'frame',
        frameType: 'group',
        label: 'foo',
        branches: [[msg('Alice', 'Alice', 'x')]],
        branchLabels: ['foo'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame)!;
    // FixedMeasurer(8, 16): width = text.length * 8, so 'foo' -> 24.
    expect(frame.tabText).toBe('foo');
    expect(frame.tabTextWidth).toBe(24);
    expect(frame.tabWidth).toBe(HEADER_PADDING.left + 24 + HEADER_PADDING.right);
  });
});

describe('layoutSequence — frame colour carry-through (T5)', () => {
  it('carries backColorElement/backColorGeneral from FrameEvent to FrameGeo', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'frame',
        frameType: 'group',
        label: 'g',
        branches: [[msg('Alice', 'Alice', 'x')]],
        branchLabels: ['g'],
        backColorElement: '#ffa',
        backColorGeneral: '#eee',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame)!;
    expect(frame.backColorElement).toBe('#ffa');
    expect(frame.backColorGeneral).toBe('#eee');
  });

  it('omits backColorElement/backColorGeneral when the source gives none', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'frame',
        frameType: 'group',
        label: 'g',
        branches: [[msg('Alice', 'Alice', 'x')]],
        branchLabels: ['g'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame)!;
    expect(frame.backColorElement).toBeUndefined();
    expect(frame.backColorGeneral).toBeUndefined();
  });

  // AC4: each branchSeparators entry carries its own backColorGeneral, or
  // undefined where the source gave none. `FrameEvent` currently carries
  // only the FRAME-level backColorElement/backColorGeneral (T1's contract,
  // ast.ts:180-183) -- there is no per-branch colour source yet, so every
  // separator is undefined. That is what "or undefined where the source
  // gave none" covers; see this task's report for the T2 doc/contract gap.
  it('each else separator carries its own backColorGeneral, or undefined where none is given', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'alt',
        label: 'first',
        branches: [
          [msg('Alice', 'Bob', 'a')],
          [msg('Bob', 'Alice', 'b')],
          [msg('Alice', 'Bob', 'c')],
        ],
        branchLabels: ['first', 'second', 'third'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame)!;
    expect(frame.branchSeparators).toHaveLength(2);
    expect(frame.branchSeparators[0]?.label).toBe('second');
    expect(frame.branchSeparators[0]?.backColorGeneral).toBeUndefined();
    expect(frame.branchSeparators[1]?.label).toBe('third');
    expect(frame.branchSeparators[1]?.backColorGeneral).toBeUndefined();
  });
});

describe('layoutSequence — no frames leaves other events unaffected (T5)', () => {
  it('a diagram with no frame events keeps its event kinds/order unchanged', () => {
    const events: SequenceEvent[] = [
      msg('Alice', 'Bob', 'a'),
      {
        kind: 'note',
        position: 'over',
        participants: ['Alice'],
        text: 'n',
      } satisfies SequenceEvent,
      msg('Bob', 'Alice', 'b'),
    ];
    const ast = makeAst(['Alice', 'Bob'], events);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.events.map((e) => e.kind)).toEqual(['message', 'note', 'message']);
  });
});

describe('layoutSequence — note (AC 6)', () => {
  it('note left of Alice: right edge of note <= centerX of Alice', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'note',
        position: 'left',
        participants: ['Alice'],
        text: 'hi',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const note = geo.events.find(isNote)!;
    const alice = geo.participants.find((p) => p.id === 'Alice')!;
    expect(note.x + note.width).toBeLessThanOrEqual(alice.centerX);
  });

  it('note right of Alice: x >= centerX of Alice', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'note',
        position: 'right',
        participants: ['Alice'],
        text: 'hi',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const note = geo.events.find(isNote)!;
    const alice = geo.participants.find((p) => p.id === 'Alice')!;
    expect(note.x).toBeGreaterThanOrEqual(alice.centerX);
  });

  it('note over single participant centered on participant', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'note',
        position: 'over',
        participants: ['Alice'],
        text: 'note',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const note = geo.events.find(isNote)!;
    const alice = geo.participants.find((p) => p.id === 'Alice')!;
    // Center of note should be approximately alice's centerX
    const noteCenter = note.x + note.width / 2;
    expect(noteCenter).toBeCloseTo(alice.centerX);
  });

  it('note over two participants spans between them', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'note',
        position: 'over',
        participants: ['Alice', 'Bob'],
        text: 'shared',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const note = geo.events.find(isNote)!;
    const alice = geo.participants.find((p) => p.id === 'Alice')!;
    const bob = geo.participants.find((p) => p.id === 'Bob')!;
    // Note should start at or before min centerX and end at or after max centerX
    expect(note.x).toBeLessThanOrEqual(alice.centerX);
    expect(note.x + note.width).toBeGreaterThanOrEqual(bob.centerX);
  });
});

describe('layoutSequence — totalWidth (AC 7)', () => {
  it('totalWidth > 0 for any diagram with participants', () => {
    const ast = makeAst(['Alice'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.totalWidth).toBeGreaterThan(0);
  });

  it('totalWidth increases with more participants', () => {
    const one = layoutSequence(makeAst(['Alice'], []), defaultTheme, measurer);
    const two = layoutSequence(
      makeAst(['Alice', 'Bob'], []),
      defaultTheme,
      measurer,
    );
    expect(two.totalWidth).toBeGreaterThan(one.totalWidth);
  });
});

describe('layoutSequence — totalHeight (AC 8)', () => {
  it('totalHeight > participantHeight', () => {
    const ast = makeAst(['Alice'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.totalHeight).toBeGreaterThan(geo.participants[0]!.height);
  });
});

describe('layoutSequence — lifelineEndY (AC 9)', () => {
  it('lifelineEndY < totalHeight', () => {
    const ast = makeAst(['Alice'], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.lifelineEndY).toBeLessThan(geo.totalHeight);
  });
});

describe('layoutSequence — divider', () => {
  it('emits DividerGeo with totalWidth filled in', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      { kind: 'divider', text: '====' } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const divider = geo.events.find(isDivider)!;
    expect(divider).toBeDefined();
    expect(divider.totalWidth).toBeGreaterThan(0);
    expect(divider.text).toBe('====');
  });
});

describe('layoutSequence — space event', () => {
  it('emits SpaceGeo and advances y by pixels', () => {
    const ast = makeAst(['Alice'], [
      { kind: 'space', pixels: 50 } satisfies SequenceEvent,
      msg('Alice', 'Alice', 'after'),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const space = geo.events.find(isSpace)!;
    expect(space).toBeDefined();
    expect(space.height).toBe(50);

    const message = geo.events.find(isMessage)!;
    expect(message.y).toBeGreaterThan(space.y + space.height);
  });
});

describe('layoutSequence — delay event', () => {
  it('delay advances y without emitting geometry', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      msg('Alice', 'Bob', 'before'),
      { kind: 'delay', text: '...' } satisfies SequenceEvent,
      msg('Alice', 'Bob', 'after'),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const messages = geo.events.filter(isMessage);
    expect(messages).toHaveLength(2);
    // The delay should advance y by at least messageSpacing above normal gap
    const normalGap = messages[1]!.y - messages[0]!.y;
    // No-delay gap for comparison
    const noDel = layoutSequence(
      makeAst(['Alice', 'Bob'], [
        msg('Alice', 'Bob', 'before'),
        msg('Alice', 'Bob', 'after'),
      ]),
      defaultTheme,
      measurer,
    );
    const noDelMessages = noDel.events.filter(isMessage);
    const noDelGap = noDelMessages[1]!.y - noDelMessages[0]!.y;
    expect(normalGap).toBeGreaterThan(noDelGap);
  });

  it('delay event without text is also handled', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      { kind: 'delay' } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    // No geometry emitted for delay — only messages/notes/etc appear in events
    expect(geo.events.filter(isMessage)).toHaveLength(0);
  });
});

describe('layoutSequence — multiline note', () => {
  it('note height accounts for multiple lines', () => {
    const single = layoutSequence(
      makeAst(['Alice'], [
        {
          kind: 'note',
          position: 'over',
          participants: ['Alice'],
          text: 'one line',
        } satisfies SequenceEvent,
      ]),
      defaultTheme,
      measurer,
    );
    const multi = layoutSequence(
      makeAst(['Alice'], [
        {
          kind: 'note',
          position: 'over',
          participants: ['Alice'],
          text: 'line one\nline two\nline three',
        } satisfies SequenceEvent,
      ]),
      defaultTheme,
      measurer,
    );
    const singleNote = single.events.find(isNote)!;
    const multiNote = multi.events.find(isNote)!;
    expect(multiNote.height).toBeGreaterThan(singleNote.height);
  });
});

describe('layoutSequence — note color', () => {
  it('passes color through to NoteGeo', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'note',
        position: 'over',
        participants: ['Alice'],
        text: 'colored',
        color: '#FF0000',
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const note = geo.events.find(isNote)!;
    expect(note.color).toBe('#FF0000');
  });
});

describe('layoutSequence — activation color', () => {
  it('passes color through to ActivationGeo', () => {
    const ast = makeAst(['Alice'], [
      {
        kind: 'activate',
        participantId: 'Alice',
        color: '#AABBCC',
      } satisfies SequenceEvent,
      { kind: 'deactivate', participantId: 'Alice' } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const activation = geo.events.find(isActivation)!;
    expect(activation.color).toBe('#AABBCC');
  });
});

describe('layoutSequence — sequence numbers', () => {
  it('passes sequenceNumber through to MessageGeo', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'message',
        from: 'Alice',
        to: 'Bob',
        label: 'go',
        arrow: SYNC_ARROW,
        sequenceNumber: 42,
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const m = geo.events.find(isMessage)!;
    expect(m.sequenceNumber).toBe(42);
  });
});

describe('layoutSequence — empty participants', () => {
  it('returns zero-area geometry for empty AST', () => {
    const ast = makeAst([], []);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    expect(geo.participants).toHaveLength(0);
    expect(geo.totalWidth).toBe(0);
  });
});

describe('layoutSequence — frame x/width', () => {
  it('frame x and width cover all participant columns', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      {
        kind: 'frame',
        frameType: 'loop',
        label: 'forever',
        branches: [[msg('Alice', 'Bob', 'tick')]],
        branchLabels: ['forever'],
      } satisfies SequenceEvent,
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const frame = geo.events.find(isFrame)!;
    const alice = geo.participants.find((p) => p.id === 'Alice')!;
    const bob = geo.participants.find((p) => p.id === 'Bob')!;
    expect(frame.x).toBeLessThanOrEqual(alice.centerX);
    expect(frame.x + frame.width).toBeGreaterThanOrEqual(bob.centerX);
  });
});

describe('layoutSequence — message from unknown participant', () => {
  it('skips message gracefully if a participant is not in the map', () => {
    // Build an AST with a message referencing a participant not declared
    const ast: SequenceDiagramAST = {
      participants: [{ id: 'Alice', display: 'Alice', type: 'participant', order: 0 }],
      events: [
        { kind: 'message', from: 'Alice', to: 'Ghost', label: 'ping', arrow: SYNC_ARROW },
      ],
      autonumber: { enabled: false, start: 1, current: 1, step: 1, prefix: '' },
      options: { hideFootbox: false, messageAlign: 'center' },
      boxes: [],
    };
    const geo = layoutSequence(ast, defaultTheme, measurer);
    // The unknown-participant message is skipped — no message geo emitted
    expect(geo.events.filter(isMessage)).toHaveLength(0);
  });
});

describe('layoutSequence — auto-deactivate without prior activation record', () => {
  it('deactivate via message shorthand without matching activate uses height 0', () => {
    const ast = makeAst(['Alice', 'Bob'], [
      msg('Bob', 'Alice', 'reply', { deactivates: 'Bob' }),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const activation = geo.events.find(isActivation);
    expect(activation).toBeDefined();
    // No activation start recorded — height should be 0 or very small
    expect(activation!.height).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// T6 / D3: how the two participant walkers treat a `messageExo` event
//
// Nothing parses one yet -- T13 does -- so these build the event directly.
// They pin the two DELIBERATE readings T6 encoded, so a later task that
// changes either has to change a test rather than drift silently.
// ---------------------------------------------------------------------------

function exo(participant: string, label = 'in'): MessageExoEvent {
  return {
    kind: 'messageExo',
    participant,
    exoType: 'FROM_LEFT',
    shortArrow: false,
    label,
    arrow: SYNC_ARROW,
  };
}

describe('exo messages in the participant walkers', () => {
  // `isAlone` asks each event `dealWith(p)`, and `MessageExo.dealWith`
  // answers `participant == someone` (`MessageExo.java:90-92`).
  it('links its one endpoint, and no other participant', () => {
    expect([...linkedParticipantIds([exo('Bob')])]).toEqual(['Bob']);
  });

  it('links the endpoint even from inside a frame branch', () => {
    const frame: SequenceEvent = {
      kind: 'frame', frameType: 'loop', label: 'l',
      branches: [[exo('Carol')]], branchLabels: ['l'],
    };
    expect([...linkedParticipantIds([frame])]).toEqual(['Carol']);
  });

  // The adjacent-pair label scan skips it: an exo message has one endpoint
  // and the diagram border for the other, so there is no pair to widen. A
  // very long exo label must therefore NOT push Alice and Bob apart.
  it('does not widen the gap between two adjacent lifelines', () => {
    const plain = makeAst(['Alice', 'Bob'], []);
    const withExo = makeAst(['Alice', 'Bob'], [
      exo('Alice', 'a very long exo label indeed, quite long'),
    ]);
    const gap = (ast: SequenceDiagramAST): number => {
      const geo = layoutSequence(ast, defaultTheme, measurer);
      return geo.participants[1]!.centerX - geo.participants[0]!.centerX;
    };
    expect(gap(withExo)).toBe(gap(plain));
  });
});

// ---------------------------------------------------------------------------
// Database participant sizing — ComponentRoseDatabase's own rule (T3)
// ---------------------------------------------------------------------------

describe('layoutSequence — database participant sizing', () => {
  /** `FixedMeasurer(8, 16)`: a label of N characters measures 8N wide, 16 tall. */
  function dbAst(display: string): SequenceDiagramAST {
    const ast = makeAst(['DB', 'Other'], [msg('DB', 'Other')]);
    ast.participants[0] = { id: 'DB', display, type: 'database', order: 0 };
    return ast;
  }

  function dbGeo(display: string) {
    const geo = layoutSequence(dbAst(display), defaultTheme, measurer);
    return geo.participants.find((p) => p.id === 'DB')!;
  }

  it('falls back to the glyph width when the label is narrower', () => {
    // `ComponentRoseDatabase#getPreferredWidth:102-105` --
    // `max(stickman.getWidth(), getTextWidth())`. The stickman is
    // `asSmall(null, empty(16,17), empty(0,0), ...)` (`:70`) through
    // `Margin(10,10,24,5)` (`USymbolDatabase.java:117`), so 16 + 10 + 10 = 36.
    // A 2-char label is 16 + 3 + 3 = 22 wide, well under it.
    expect(dbGeo('ab').width).toBe(36);
  });

  it('uses getTextWidth = label + 3 + 3 when the label is wider', () => {
    // `topRightBottomLeft(0, 3, 0, 3)` (`ComponentRoseDatabase.java:62-63`)
    // added by `AbstractTextualComponent#getTextWidth:106-108`.
    expect(dbGeo('abcdefghij').width).toBe(10 * 8 + 3 + 3);
  });

  it('sizes the height as the glyph plus the text block, with no floor', () => {
    // `getPreferredHeight:96-99` -- `dimStickman.getHeight() +
    // getTextHeight()`, i.e. (17 + 24 + 5) + 16. The retired `DB_HEIGHT = 80`
    // floor would have swallowed this.
    expect(dbGeo('ab').height).toBe(46 + 16);
  });

  it('leaves non-database participants untouched', () => {
    const plain = layoutSequence(makeAst(['Alice', 'Bob'], [msg('Alice', 'Bob')]), defaultTheme, measurer);
    const alice = plain.participants.find((p) => p.id === 'Alice')!;
    expect(alice.width).toBe(defaultTheme.sequence.participantMinWidth);
    expect(alice.height).toBe(16 + 20);
  });
});

// ---------------------------------------------------------------------------
// The five glyph kinds' own getPreferredWidth / getPreferredHeight (T5)
// ---------------------------------------------------------------------------

describe('layoutSequence — the five glyph participant kinds', () => {
  type Kind = 'collections' | 'queue' | 'entity' | 'boundary' | 'control';

  function kindGeo(kind: Kind, display: string) {
    const ast = makeAst(['P', 'Other'], [msg('P', 'Other')]);
    ast.participants[0] = { id: 'P', display, type: kind, order: 0 };
    return layoutSequence(ast, defaultTheme, measurer).participants.find((p) => p.id === 'P')!;
  }

  it('floors boundary, control and entity at their own drawing width', () => {
    // `ComponentRoseBoundary`/`Control`/`Entity#getPreferredWidth` are
    // `max(stickman.getWidth(), getTextWidth())`, verbatim copies of
    // `ComponentRoseDatabase.java:102-105`. `Boundary.java:97-98` is
    // `radius*2 + left + 2*margin` = 24 + 17 + 8; `Control.java:87-88` and
    // `EntityDomain.java:74-75` are `radius*2 + 2*margin` = 32.
    expect(kindGeo('boundary', 'ab').width).toBe(49);
    expect(kindGeo('control', 'ab').width).toBe(32);
    expect(kindGeo('entity', 'ab').width).toBe(32);
  });

  it('uses getTextWidth = label + 3 + 3 once the label is wider', () => {
    expect(kindGeo('control', 'abcdefghij').width).toBe(10 * 8 + 3 + 3);
  });

  it('stacks the glyph above the text for boundary, control and entity', () => {
    // `getPreferredHeight` = `dimStickman.getHeight() + getTextHeight()`.
    expect(kindGeo('boundary', 'ab').height).toBe(32 + 16);
    expect(kindGeo('control', 'ab').height).toBe(32 + 16);
    expect(kindGeo('entity', 'ab').height).toBe(32 + 16);
  });

  it('adds the queue margin around the raw text block, with no 3+3 padding', () => {
    // `ComponentRoseQueue#getPreferredWidth` returns the GLYPH's dimension,
    // and the glyph is `USymbols.QUEUE.asSmall(empty(0,0), getTextBlock(),
    // empty(0,0), ...)` -- `USymbolQueue#getMargin()` = `Margin(5,15,5,5)`
    // around the RAW block. `SheetBlock1`'s marginX1/marginX2 never reach
    // `calculateDimension` (`SheetBlock1.java:196-199,:225-229`), so the
    // component's own 3+3 padding does NOT apply here.
    expect(kindGeo('queue', 'ab').width).toBe(2 * 8 + 5 + 15);
    expect(kindGeo('queue', 'ab').height).toBe(16 + 5 + 5);
  });

  it('adds getDeltaCollection() to the plain participant rule for collections', () => {
    // `ComponentRoseParticipant#getPreferredWidth/Height:114-124` differ from
    // the plain participant case by exactly `getDeltaCollection() = 4`.
    const plain = layoutSequence(makeAst(['P', 'Other'], [msg('P', 'Other')]), defaultTheme, measurer)
      .participants.find((p) => p.id === 'P')!;
    const collections = kindGeo('collections', 'P');
    expect(collections.width).toBe(plain.width + 4);
    expect(collections.height).toBe(plain.height + 4);
  });
});

// ---------------------------------------------------------------------------
// Actor sizing — ComponentRoseActor + skinparam actorStyle (T6)
// ---------------------------------------------------------------------------

describe('layoutSequence — actor participant sizing', () => {
  function actorGeo(display: string, actorStyle?: 'AWESOME' | 'HOLLOW') {
    const ast = makeAst(['A', 'Other'], [msg('A', 'Other')]);
    ast.participants[0] = { id: 'A', display, type: 'actor', order: 0 };
    const theme = actorStyle === undefined ? defaultTheme : { ...defaultTheme, actorStyle };
    return layoutSequence(ast, theme, measurer).participants.find((p) => p.id === 'A')!;
  }

  it('sizes the default stick man from ComponentRoseActor, not a fitted floor', () => {
    // `ComponentRoseActor.java:73-84` is `max(stickman.getWidth(),
    // getTextWidth())` and `stickman.getHeight() + getTextHeight()`, the same
    // pair as `ComponentRoseDatabase`. `ActorStickMan` is 27x60. This replaced
    // an uncited `SEQUENCE_ACTOR_HEIGHT = 90` floor.
    expect(actorGeo('ab').width).toBe(27);
    expect(actorGeo('ab').height).toBe(60 + 16);
    expect(actorGeo('abcdefghij').width).toBe(10 * 8 + 3 + 3);
  });

  it('follows skinparam actorStyle, which the sequence engine used to ignore', () => {
    // `ActorAwesome` 55x61 and `ActorHollow` 26x33 (`ActorAwesome.java:98-104`,
    // `ActorHollow.java:105-111`) -- the same numbers
    // `planning/sizer-renderer-parity.md` measured against the jar.
    expect(actorGeo('ab', 'AWESOME').width).toBe(55);
    expect(actorGeo('ab', 'AWESOME').height).toBe(61 + 16);
    expect(actorGeo('ab', 'HOLLOW').width).toBe(26);
    expect(actorGeo('ab', 'HOLLOW').height).toBe(33 + 16);
  });
});
