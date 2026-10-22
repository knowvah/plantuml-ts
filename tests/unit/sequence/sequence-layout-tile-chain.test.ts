/**
 * The teoz tile chain `processEvents` walks: notes folded into their message as
 * `CommunicationTileNote*` wrappers (`teoz/TileBuilder.java:102-136`) and `&`
 * tiles sharing one contact line (`teoz/YGauge.java:124-145`). Each walk runs
 * `processEvents` directly so the published `MessageTileGauge`s can be read.
 */
import { describe, it, expect } from 'vitest';

import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { computeParticipantLayout } from '../../../src/diagrams/sequence/sequence-layout-participants.js';
import {
  newActivationStack,
  processEvents,
  type EventProcessingContext,
} from '../../../src/diagrams/sequence/sequence-layout-events.js';
import { endOfParseStyleBuilder } from '../../../src/diagrams/sequence/sequence-layout-lifeline.js';
import { selfArrowYPoint } from '../../../src/diagrams/sequence/sequence-layout-message.js';
import { messageTileGauge, type MessageTileGauge } from '../../../src/diagrams/sequence/sequence-y-gauge.js';
import type {
  AbstractMessageEvent,
  DividerGeo,
  FrameGeo,
  MessageGeo,
  NoteGeo,
  SequenceDiagramAST,
  SequenceEvent,
} from '../../../src/diagrams/sequence/ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

/** Any start: every expectation below is relative to it. */
const START = 100;
/** `Rose.paddingY` (`Rose.java:66`), the note component's inset below its
 *  tile top (`AbstractComponent#drawU:142-143`). */
const NOTE_PADDING_Y = 5;
/** `getTextHeight + getPaddingY` of an UNLABELLED arrow: `0 + 1 + 1` text
 *  padding (`AbstractComponentRoseArrow.java:62`) + `getPaddingY` 4 (`:97-99`). */
const BARE_ARROW_Y = 6;

interface Walk {
  readonly ctx: EventProcessingContext;
  readonly end: number;
  readonly events: readonly SequenceEvent[];
  readonly messages: MessageGeo[];
  readonly notes: NoteGeo[];
}

function walk(lines: readonly string[]): Walk {
  const ast = parseSequence(sequenceSource([...lines])) as SequenceDiagramAST;
  const measurer = new DeterministicMeasurer();
  const layout = computeParticipantLayout(ast, defaultTheme, measurer);
  const ctx: EventProcessingContext = {
    theme: defaultTheme,
    measurer,
    sprites: ast.sprites,
    participantMap: layout.participantMap,
    participantIndex: layout.participantIndex,
    activationStart: newActivationStack(ast.participants),
    endStyleBuilder: endOfParseStyleBuilder(ast),
    eventGeos: [],
    dividerGeos: [],
    newpageGeos: [],
  };
  const end = processEvents(ast.events, START, ctx);
  return {
    ctx,
    end,
    events: ast.events,
    messages: ctx.eventGeos.filter((g): g is MessageGeo => g.kind === 'message'),
    notes: ctx.eventGeos.filter((g): g is NoteGeo => g.kind === 'note'),
  };
}

/** The gauge published for the `index`-th message or exo event. */
function gaugeOf(w: Walk, index: number): MessageTileGauge {
  const messages = w.events.filter((e) => e.kind === 'message' || e.kind === 'messageExo');
  const gauge = messageTileGauge(w.ctx, messages[index] as AbstractMessageEvent);
  if (gauge === undefined) throw new Error(`no gauge for message ${index}`);
  return gauge;
}

/** A standalone `NoteTile`'s preferred height: what one walk of just that
 *  note advances (`NoteTile#getPreferredHeight:175-180`). */
function noteTileHeight(text: string): number {
  return walk(['participant A', `note over A : ${text}`]).end - START;
}

describe('NOTEMSG: a note on a message is drawn beside it (CommunicationTileNoteRight/Left)', () => {
  it('draws `note right` at the message tile top and spans max(message, note)', () => {
    const w = walk(['A -> B : m', 'note right : n\\nn\\nn']);
    const tile = gaugeOf(w, 0);
    // `drawU:139`: `dy(getYGauge().getMin())`, the wrapped tile's min.
    expect(tile.top).toBe(START);
    expect(w.notes[0]!.y).toBe(START + NOTE_PADDING_Y);
    // `getPreferredHeight:144-148`: the taller of the two.
    expect(w.end).toBe(START + Math.max(tile.height, noteTileHeight('n\\nn\\nn')));
  });

  it('keeps the message tile height when the message is the taller (`note left`)', () => {
    const w = walk(['A -> B : 1\\n2\\n3\\n4\\n5', 'note left : n']);
    const tile = gaugeOf(w, 0);
    expect(tile.height).toBeGreaterThan(noteTileHeight('n'));
    expect(w.notes[0]!.y).toBe(tile.top + NOTE_PADDING_Y);
    expect(w.end).toBe(tile.top + tile.height);
  });

  it('folds into the last EventWithNote across a standalone note and a life event (SequenceDiagram.java:154-158)', () => {
    const w = walk(['A -> B : m', 'note over A : s', 'activate B', 'note right : r']);
    const right = w.notes.find((n) => n.text === 'r')!;
    expect(right.y).toBe(gaugeOf(w, 0).top + NOTE_PADDING_Y);
  });

  it('is not folded past a group end: a GroupingLeaf owns it', () => {
    const w = walk(['group g', 'A -> B : m', 'end', 'note right : r']);
    const frame = w.ctx.eventGeos.find((g): g is FrameGeo => g.kind === 'frame')!;
    expect(w.notes[0]!.y).toBeGreaterThan(frame.y + frame.height);
  });

  it('beside a self message always builds a ComponentType.NOTE (CommunicationTileSelfNoteRight.java:102)', () => {
    expect(walk(['A -> A : m', 'hnote right : r']).notes[0]!.shape).toBeUndefined();
    // `TileBuilder.java:113-115` + `NoteTile.getNoteComponentType`: not forced.
    expect(walk(['A -> B : m', 'hnote right : r']).notes[0]!.shape).toBe('hexagon');
  });

  it('publishes the message tile gauge: top, height and contact point', () => {
    const w = walk(['A -> B : m']);
    const tile = gaugeOf(w, 0);
    expect(tile.top).toBe(START);
    expect(tile.contactY).toBe(w.messages[0]!.y);
    expect(w.end).toBe(START + tile.height);
  });
});

describe('exo wrappers (TileBuilder.java:122-136)', () => {
  it('draws no note when note 0 is `top`/`bottom`', () => {
    const w = walk(['participant A', '[-> A : x', 'note top : t', 'note left : l']);
    expect(w.notes).toHaveLength(0);
    expect(w.end).toBe(gaugeOf(w, 0).top + gaugeOf(w, 0).height);
  });

  it("puts every note on note 0's side, at the exo tile top", () => {
    const w = walk(['participant A', '[-> A : x', 'note left : a', 'note right : b']);
    const tile = gaugeOf(w, 0);
    expect(w.notes.map((n) => n.y)).toEqual([tile.top + NOTE_PADDING_Y, tile.top + NOTE_PADDING_Y]);
    const centerX = w.ctx.participantMap.get('A')!.centerX;
    // `CommunicationTileNoteLeft#getNotePosition:112-116`: `posC - width`.
    for (const n of w.notes) expect(n.x + n.width).toBeLessThan(centerX);
    expect(tile.contactY).toBe(w.messages[0]!.y);
  });
});

describe('PAR: `&` tiles share one contact line (YGauge.createParallel)', () => {
  it('puts both arrows on one y', () => {
    const w = walk(['A -> B : 1', '& B -> C : 2']);
    expect(w.messages[1]!.y).toBe(w.messages[0]!.y);
    expect(gaugeOf(w, 1).top).toBe(START);
    expect(w.end).toBe(START + gaugeOf(w, 0).height);
  });

  it('lowers the head when a member has the taller contact point (YGauge.java:131)', () => {
    const w = walk(['A -> B : 1', '& B -> C : 2\\n3']);
    const head = gaugeOf(w, 0);
    const member = gaugeOf(w, 1);
    expect(member.top).toBe(START);
    expect(head.contactY).toBe(member.contactY);
    expect(head.top).toBeGreaterThan(START);
    expect(w.messages[0]!.y).toBe(w.messages[1]!.y);
  });

  it("aligns a self member on its loop's middle (ComponentRoseSelfArrow.java:309-313)", () => {
    const w = walk(['A -> B : 1', '& C -> C']);
    const self = gaugeOf(w, 1);
    expect(self.contactY).toBe(gaugeOf(w, 0).contactY);
    expect(self.top).toBe(self.contactY - selfArrowYPoint(0));
    // The loop's first stroke is still `getTextHeight + getPaddingY` below the top.
    expect(w.messages[1]!.y).toBe(self.top + BARE_ARROW_Y);
  });

  it('centres a `& note` on the line (NoteTile.java:72-74)', () => {
    const w = walk(['A -> B : 1', '& note over C : n\\nn\\nn']);
    const line = gaugeOf(w, 0).contactY;
    const height = noteTileHeight('n\\nn\\nn');
    expect(w.notes[0]!.y).toBe(line - height / 2 + NOTE_PADDING_Y);
    expect(w.end).toBe(line + height / 2);
  });

  it('carries the line through a life event and a note wrapper (YGauge.java:147-157)', () => {
    const w = walk(['A -> B : 1', 'activate B', 'note right : n', '& B -> C : 2']);
    expect(w.messages[1]!.y).toBe(w.messages[0]!.y);
  });

  it('falls back to top alignment after a tile without a line (YGauge.java:127-129)', () => {
    const w = walk(['participant A', 'participant B', '== d ==', '& A -> B : 1']);
    const divider = w.ctx.eventGeos.find((g): g is DividerGeo => g.kind === 'divider')!;
    expect(gaugeOf(w, 0).top).toBe(divider.y);
  });
});
