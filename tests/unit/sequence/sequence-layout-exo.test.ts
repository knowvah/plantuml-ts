import { describe, it, expect } from 'vitest';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { FixedMeasurer } from '../../../src/core/measurer.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { arrowConfigurationOf } from '../../../src/diagrams/sequence/sequence-parse-helpers.js';
import type {
  MessageExoEvent,
  MessageExoType,
  MessageGeo,
  SequenceDiagramAST,
  SequenceEvent,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';

// ---------------------------------------------------------------------------
// Fixtures
//
// Every number below is derived from the two upstream terms this module
// ports, never fitted: `preferredWidth = textBlock + 2 * 7 + 10`
// (`ComponentRoseArrow.java:347-349` over `AbstractComponentRoseArrow
// .java:62`) and the circle inset `diamCircle / 2 + 2`
// (`teoz/CommunicationExoTile.java:138-147`).
// ---------------------------------------------------------------------------

const CHAR_W = 8;
const LINE_H = 16;
const measurer = new FixedMeasurer(CHAR_W, LINE_H);

/** `2 * getOldPaddingX1() + getArrowDeltaX()`, the fixed part of an arrow
 *  component's preferred width. */
const WIDTH_OVERHEAD = 2 * 7 + 10;
/** `ComponentRoseArrow.diamCircle / 2 + 2`. */
const CIRCLE_INSET = 6;
/** `layout.ts`'s gap between the rightmost content and the document edge. */
const RIGHT_MARGIN = 30;
/** One activation-bar half-width (`teoz/CommunicationTile.java:172`). */
const LIVE_DELTA_SIZE = 5;

const PLAIN_ARROW = arrowConfigurationOf({});
const CIRCLE_1 = arrowConfigurationOf({ circle1: true });
const CIRCLE_2 = arrowConfigurationOf({ circle2: true });

function makeAst(participants: string[], events: SequenceEvent[]): SequenceDiagramAST {
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

function exo(
  exoType: MessageExoType,
  overrides: Partial<MessageExoEvent> = {},
): MessageExoEvent {
  return {
    kind: 'messageExo',
    participant: 'Bob',
    exoType,
    shortArrow: false,
    label: 'hi',
    arrow: PLAIN_ARROW,
    ...overrides,
  };
}

/** Lay a one-participant diagram out around the given events. */
function layoutWith(events: SequenceEvent[]): SequenceGeometry {
  return layoutSequence(makeAst(['Bob'], events), defaultTheme, measurer);
}

function onlyMessage(geo: SequenceGeometry): MessageGeo {
  const messages = geo.events.filter((e): e is MessageGeo => e.kind === 'message');
  expect(messages).toHaveLength(1);
  return messages[0]!;
}

/** The message's left and right x, whichever way its arrow points. */
function span(msg: MessageGeo): { left: number; right: number } {
  return { left: Math.min(msg.fromX, msg.toX), right: Math.max(msg.fromX, msg.toX) };
}

/** `preferredWidth` for a single-line label under the fixed measurer. */
function preferredWidthOf(label: string): number {
  return label.length * CHAR_W + WIDTH_OVERHEAD;
}

// ---------------------------------------------------------------------------
// Left-border geometry — `getPoint1Value` (CommunicationExoTile.java:214-219)
// ---------------------------------------------------------------------------

describe('exo layout: left-border messages', () => {
  it('starts a FROM_LEFT arrow on the diagram border, at x = 0', () => {
    const geo = layoutWith([exo('FROM_LEFT')]);
    expect(span(onlyMessage(geo)).left).toBe(0);
  });

  it('ends a FROM_LEFT arrow on its participant lifeline', () => {
    const geo = layoutWith([exo('FROM_LEFT')]);
    expect(span(onlyMessage(geo)).right).toBe(geo.participants[0]!.centerX);
  });

  // `decoration1` is the FROM_LEFT side and `decoration2` the TO_LEFT one --
  // upstream's asymmetry, identical in both engines
  // (`teoz/CommunicationExoTile.java:138-141`,
  // `graphic/MessageExoArrow.java:90-94`).
  it('insets a FROM_LEFT arrow by the circle when DECORATION1 is CIRCLE', () => {
    const geo = layoutWith([exo('FROM_LEFT', { arrow: CIRCLE_1 })]);
    expect(span(onlyMessage(geo)).left).toBe(CIRCLE_INSET);
  });

  it('leaves a FROM_LEFT arrow alone when only DECORATION2 is CIRCLE', () => {
    const geo = layoutWith([exo('FROM_LEFT', { arrow: CIRCLE_2 })]);
    expect(span(onlyMessage(geo)).left).toBe(0);
  });

  it('insets a TO_LEFT arrow by the circle when DECORATION2 is CIRCLE', () => {
    const geo = layoutWith([exo('TO_LEFT', { arrow: CIRCLE_2 })]);
    expect(span(onlyMessage(geo)).left).toBe(CIRCLE_INSET);
  });

  it('leaves a TO_LEFT arrow alone when only DECORATION1 is CIRCLE', () => {
    const geo = layoutWith([exo('TO_LEFT', { arrow: CIRCLE_1 })]);
    expect(span(onlyMessage(geo)).left).toBe(0);
  });

  it('points a TO_LEFT arrow at the border, not at the lifeline', () => {
    const msg = onlyMessage(layoutWith([exo('TO_LEFT')]));
    expect(msg.arrowDirection).toBe('left');
    expect(msg.fromX).toBeGreaterThan(msg.toX);
    expect(msg.toX).toBe(0);
  });

  it('never routes an exo message through the self-message path', () => {
    for (const type of ['FROM_LEFT', 'TO_LEFT', 'FROM_RIGHT', 'TO_RIGHT'] as const) {
      expect(onlyMessage(layoutWith([exo(type)])).arrowDirection).not.toBe('self');
    }
  });
});

// ---------------------------------------------------------------------------
// Right-border geometry and diagram width
// ---------------------------------------------------------------------------

describe('exo layout: right-border messages and document width', () => {
  const LONG = 'a rather long exo label';

  it('widens the document to fit a TO_RIGHT arrow', () => {
    const withExo = layoutWith([exo('TO_RIGHT', { label: LONG })]);
    const without = layoutWith([]);
    expect(withExo.totalWidth).toBeGreaterThan(without.totalWidth);
  });

  it('widens it by exactly posC + preferredWidth + the right margin', () => {
    const geo = layoutWith([exo('TO_RIGHT', { label: LONG })]);
    const expected = geo.participants[0]!.centerX + preferredWidthOf(LONG) + RIGHT_MARGIN;
    expect(geo.totalWidth).toBe(expected);
  });

  it('anchors the TO_RIGHT arrow on the right border, inside the margin', () => {
    const geo = layoutWith([exo('TO_RIGHT', { label: LONG })]);
    expect(span(onlyMessage(geo)).right).toBe(geo.totalWidth - RIGHT_MARGIN);
  });

  it('starts the TO_RIGHT arrow on its participant lifeline', () => {
    const geo = layoutWith([exo('TO_RIGHT', { label: LONG })]);
    expect(span(onlyMessage(geo)).left).toBe(geo.participants[0]!.centerX);
  });

  it('stretches a TO_RIGHT arrow out to a border widened by something else', () => {
    // A wide participant to the right of the exo's own reach: the border
    // moves, and `getPoint2Value` reads the border rather than `point2`.
    const ast = makeAst(['Bob', 'a very wide participant indeed'], [exo('TO_RIGHT')]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const reach = geo.participants[0]!.centerX + preferredWidthOf('hi');
    expect(geo.totalWidth - RIGHT_MARGIN).toBeGreaterThan(reach);
    expect(span(onlyMessage(geo)).right).toBe(geo.totalWidth - RIGHT_MARGIN);
  });

  it('insets a TO_RIGHT border end by the circle when DECORATION2 is CIRCLE', () => {
    const geo = layoutWith([exo('TO_RIGHT', { label: LONG, arrow: CIRCLE_2 })]);
    expect(span(onlyMessage(geo)).right).toBe(geo.totalWidth - RIGHT_MARGIN - CIRCLE_INSET);
  });

  it('insets a FROM_RIGHT border end by the circle when DECORATION1 is CIRCLE', () => {
    const geo = layoutWith([exo('FROM_RIGHT', { label: LONG, arrow: CIRCLE_1 })]);
    const msg = onlyMessage(geo);
    expect(msg.arrowDirection).toBe('left');
    expect(msg.fromX).toBe(geo.totalWidth - RIGHT_MARGIN - CIRCLE_INSET);
  });

  // The inset moves the DRAWN end only: `getMaxX` is `getPoint2()`, which
  // never sees it (`teoz/CommunicationExoTile.java:230-232`).
  it('does not let the circle inset shrink the document', () => {
    const plain = layoutWith([exo('TO_RIGHT', { label: LONG })]);
    const circled = layoutWith([exo('TO_RIGHT', { label: LONG, arrow: CIRCLE_2 })]);
    expect(circled.totalWidth).toBe(plain.totalWidth);
  });
});

// ---------------------------------------------------------------------------
// Short arrows — `isFromLeftBorderMessage` is "this border AND not short"
// ---------------------------------------------------------------------------

describe('exo layout: short arrows', () => {
  const LONG = 'a rather long exo label';

  it('sizes a short TO_RIGHT arrow at preferredWidth, not at the border', () => {
    const ast = makeAst(['Bob', 'a very wide participant indeed'], [
      exo('TO_RIGHT', { shortArrow: true }),
    ]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const msg = onlyMessage(geo);
    expect(msg.toX - msg.fromX).toBe(preferredWidthOf('hi'));
    expect(msg.toX).toBeLessThan(geo.totalWidth - RIGHT_MARGIN);
  });

  it('sizes a short FROM_LEFT arrow at preferredWidth, back from the lifeline', () => {
    const geo = layoutWith([exo('FROM_LEFT', { shortArrow: true, label: 'hi' })]);
    const { left, right } = span(onlyMessage(geo));
    expect(right).toBe(geo.participants[0]!.centerX);
    expect(right - left).toBe(preferredWidthOf('hi'));
  });

  // `getMaxX` never consults `isShortArrow`, so a short right-border arrow
  // still asks the document for its width.
  it('still widens the document for a short right-border arrow', () => {
    const geo = layoutWith([exo('TO_RIGHT', { shortArrow: true, label: LONG })]);
    const expected = geo.participants[0]!.centerX + preferredWidthOf(LONG) + RIGHT_MARGIN;
    expect(geo.totalWidth).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// Liveboxes — CommunicationExoTile.java:120-126
// ---------------------------------------------------------------------------

describe('exo layout: activation bars', () => {
  const activate: SequenceEvent = { kind: 'activate', participantId: 'Bob' };

  it('ends a left-border arrow at the left edge of an open activation bar', () => {
    const geo = layoutWith([activate, exo('FROM_LEFT')]);
    expect(span(onlyMessage(geo)).right).toBe(
      geo.participants[0]!.centerX - LIVE_DELTA_SIZE,
    );
  });

  it('starts a right-border arrow at the right edge of an open bar', () => {
    const geo = layoutWith([activate, exo('TO_RIGHT')]);
    expect(span(onlyMessage(geo)).left).toBe(
      geo.participants[0]!.centerX + LIVE_DELTA_SIZE,
    );
  });

  // The T13 contract: an exo message's `+`/`-` becomes a separate
  // `ActivationEvent` AFTER it, and `handleActivateEvent` reads
  // `cursor.lastMessageY`. Without it the bar would start one message spacing
  // below its own arrow.
  it('starts an exo-triggered activation bar at the exo arrow y', () => {
    const geo = layoutWith([
      exo('FROM_LEFT'),
      { kind: 'activate', participantId: 'Bob' },
      { kind: 'deactivate', participantId: 'Bob' },
    ]);
    const bar = geo.events.find((e) => e.kind === 'activation');
    expect(bar).toBeDefined();
    expect(bar && bar.kind === 'activation' ? bar.y : undefined).toBe(
      onlyMessage(geo).y,
    );
  });
});

// ---------------------------------------------------------------------------
// Label, pass-through data, and degenerate input
// ---------------------------------------------------------------------------

describe('exo layout: label and carried data', () => {
  it('places the label beside the participant, not in the middle of the stretch', () => {
    // `Area#textDeltaX` keeps the label where a preferredWidth-sized arrow
    // would have put it (`ComponentRoseArrow.java:173-179`).
    const ast = makeAst(['Bob', 'a very wide participant indeed'], [exo('TO_RIGHT')]);
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const msg = onlyMessage(geo);
    const labelLeft = msg.labelLines[0]!.x;
    expect(labelLeft).toBe(geo.participants[0]!.centerX + 7);
    expect(labelLeft).toBeLessThan((msg.fromX + msg.toX) / 2);
  });

  it('reserves a row above the arrow for each extra label line', () => {
    const one = onlyMessage(layoutWith([exo('FROM_LEFT', { label: 'hi' })]));
    const three = onlyMessage(layoutWith([exo('FROM_LEFT', { label: 'a\nb\nc' })]));
    expect(three.y - one.y).toBe(2 * LINE_H);
  });

  it('sizes the arrow from the autonumber run as well as the label', () => {
    const numbered = layoutWith([
      exo('TO_RIGHT', { sequenceNumber: 7, sequenceLabel: '[007]' }),
    ]);
    const bare = layoutWith([exo('TO_RIGHT')]);
    // 5 characters plus the 4px number margin (`Display.java:706`).
    expect(numbered.totalWidth - bare.totalWidth).toBe(5 * CHAR_W + 4);
  });

  it('numbers a bare autonumber run with no format', () => {
    const numbered = layoutWith([exo('TO_RIGHT', { sequenceNumber: 12 })]);
    const msg = onlyMessage(numbered);
    expect(msg.labelNumber?.text).toBe('12');
    // Two digits plus the number margin, over the undecorated width.
    expect(numbered.totalWidth - layoutWith([exo('TO_RIGHT')]).totalWidth).toBe(
      2 * CHAR_W + 4,
    );
  });

  it('carries the stereotype and lifecolor through untouched', () => {
    const msg = onlyMessage(
      layoutWith([exo('TO_LEFT', { stereotype: '<<x>>', lifeColor: '#red' })]),
    );
    expect(msg.stereotype).toBe('<<x>>');
    expect(msg.lifeColor).toBe('#red');
  });

  it('carries the exo type, short flag and url through to the geometry', () => {
    const msg = onlyMessage(
      layoutWith([exo('FROM_RIGHT', { shortArrow: true, url: 'http://x' })]),
    );
    expect(msg.exoType).toBe('FROM_RIGHT');
    expect(msg.shortArrow).toBe(true);
    expect(msg.url).toBe('http://x');
  });

  it('emits no geometry for an unknown participant', () => {
    const geo = layoutWith([exo('FROM_LEFT', { participant: 'Nobody' })]);
    expect(geo.events.filter((e) => e.kind === 'message')).toHaveLength(0);
  });

  it('emits no label runs for an unlabelled exo message', () => {
    expect(onlyMessage(layoutWith([exo('FROM_LEFT', { label: '' })])).labelLines).toEqual([]);
  });
});
