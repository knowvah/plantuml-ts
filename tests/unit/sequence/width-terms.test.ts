/**
 * sdd2 T3a: the document-width terms `PlayingSpace` maxes
 * (`teoz/PlayingSpace.java:93-101`) and the self message's reservation.
 *
 * Expected x values are the jar's own `in.svg` for `cexeju-49-dumu881`
 * (`Bob -> Bob : hello`: Bob's `posC` 19.469 + 10 left margin = 29.469, jar
 * width 90) and `fuliko-66-mulo559` (jar width 152), or Java arithmetic quoted
 * at the assertion.
 */
import { describe, expect, it } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type { NoteGeo, ParticipantGeo, SequenceDiagramAST } from '../../../src/diagrams/sequence/ast.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import {
  scanMessageLabels,
  type SpanConstraint,
} from '../../../src/diagrams/sequence/sequence-layout-participant-constraints.js';
import { computeParticipantLayout } from '../../../src/diagrams/sequence/sequence-layout-participants.js';
import { computeTotalWidth, RIGHT_MARGIN } from '../../../src/diagrams/sequence/sequence-layout-width.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();
const ACTIVATION_HALF_WIDTH = 5;
/** `ComponentRoseSelfArrow.java:326-328`: `arrowWidth + 5`. */
const SELF_FLOOR = 50;
/** cexeju's jar `line x1`. */
const BOB_CENTRE = 29.469;

function parse(lines: readonly string[]): SequenceDiagramAST {
  return astOrThrow(parseSequence(sequenceSource(lines)), 'sequence');
}

/** The participant row, then `computeTotalWidth` over `events` -- the width
 *  with the event list threaded, which `layout.ts` does at the call site. */
function totalWidthOf(lines: readonly string[]): { width: number; geos: ParticipantGeo[] } {
  const ast = parse(lines);
  const { participantGeos } = computeParticipantLayout(ast, defaultTheme, measurer);
  const width = computeTotalWidth(participantGeos, [], {
    theme: defaultTheme,
    measurer,
    sprites: ast.sprites,
    events: ast.events,
  });
  return { width, geos: participantGeos };
}

describe('document width (PlayingSpace.java:93-101)', () => {
  it('reserves a self message past the last participant: posC + max(text + 14, 50) + margin (cexeju-49)', () => {
    // CommunicationTileSelf.java:272-277 getMaxX = posC2 + getCompWidth();
    // ComponentRoseSelfArrow.java:326-328 compWidth = max(text, 50);
    // "hello" is narrower than 36, so the floor binds. Jar width 90 =
    // (int)(89.469 + 1).
    const { width } = totalWidthOf(['Bob -> Bob : hello']);
    expect(width).toBeCloseTo(BOB_CENTRE + SELF_FLOOR + RIGHT_MARGIN, 3);
    expect(Math.trunc(width + 1)).toBe(90);
  });

  it('adds the activation depth to the self reservation (posC2 = posC + maxPosition)', () => {
    // LivingSpace.java:235-238, LiveBoxes.java:367-372: one level = +5.
    const { width } = totalWidthOf(['Bob -> Bob : hello', 'activate Bob']);
    expect(width).toBeCloseTo(BOB_CENTRE + ACTIVATION_HALF_WIDTH + SELF_FLOOR + RIGHT_MARGIN, 3);
  });

  it('widens a long self label by its text plus both paddings (text + 14)', () => {
    const { width, geos } = totalWidthOf(['Bob -> Bob : a self message label that is long enough to pass fifty']);
    expect(width).toBeGreaterThan(geos[0]!.centerX + SELF_FLOOR + RIGHT_MARGIN + 30);
  });

  it('lets posC2 set the right edge once the stack outgrows half the head (rexine-04)', () => {
    // posC2 = posC + 5 * maxLevel; four levels (20) pass Bob's half head (19.469).
    const { width, geos } = totalWidthOf([
      'participant Bob',
      'activate Bob',
      'activate Bob',
      'activate Bob',
      'activate Bob',
    ]);
    expect(width).toBeCloseTo(geos[0]!.centerX + 4 * ACTIVATION_HALF_WIDTH + RIGHT_MARGIN, 3);
    expect(width).toBeGreaterThan(geos[0]!.x + geos[0]!.width + RIGHT_MARGIN);
  });

  it('has no label term: a wide label does not widen past posD (fuliko-66)', () => {
    // CommunicationTile.java:453-460 getMaxX; jar width 152 = (int)(151.425 + 1).
    const lines = [
      'hide footbox',
      'participant Alice as alice',
      'participant Bob as bob',
      'alice ->> bob : <b> SIGNAL_1\\n  next line',
    ];
    const geo = layoutSequence(parse(lines), defaultTheme, measurer);
    const last = geo.participants[geo.participants.length - 1]!;
    expect(Math.trunc(geo.totalWidth + 1)).toBe(152);
    expect(geo.totalWidth).toBe(last.x + last.width + RIGHT_MARGIN);
  });
});

describe('self message note start (CommunicationTileSelfNoteRight.java:108-110)', () => {
  const noteX = (lines: readonly string[]): number => {
    const geo = layoutSequence(parse(lines), defaultTheme, measurer);
    return geo.events.find((e): e is NoteGeo => e.kind === 'note')!.x;
  };

  it('starts a right note at posC2 + compWidth: 5 further right per activation level (masibi-28)', () => {
    const bare = noteX(['participant Bob', 'Bob -> Bob : co2', 'note right: toto2']);
    const live = noteX(['participant Bob', 'Bob -> Bob : co2', 'note right: toto2', 'activate Bob']);
    expect(live - bare).toBe(ACTIVATION_HALF_WIDTH);
  });
});

describe('self message spacing (CommunicationTileSelf.java:166-184)', () => {
  const scan = (lines: readonly string[], messageSpan?: boolean): SpanConstraint[] => {
    const ast = parse(lines);
    const out: SpanConstraint[] = [];
    const sorted = [...ast.participants].sort((a, b) => a.order - b.order);
    scanMessageLabels(ast.events, sorted, { measurer, levels: undefined, sprites: ast.sprites, messageSpan }, out);
    return out;
  };

  it('binds the next lifeline to maxPosition + compWidth: the 50 floor for a short label', () => {
    // :178-181 next.getPosC().ensureBiggerThan(getMaxX()); getMaxX = posC2 + comp (:272-277).
    expect(scan(['participant Bob', 'participant Max', 'Bob -> Bob : hello'])).toEqual([
      { from: 0, to: 1, span: SELF_FLOOR },
    ]);
  });

  it('adds the deepest activation of the diagram to the span (posC2 - posC)', () => {
    expect(scan(['participant Bob', 'participant Max', 'activate Bob', 'activate Bob', 'Bob -> Bob : hello'])).toEqual([
      { from: 0, to: 1, span: 2 * ACTIVATION_HALF_WIDTH + SELF_FLOOR },
    ]);
  });

  it('binds nothing on the last participant (getNext is null, :250-256)', () => {
    expect(scan(['participant Max', 'participant Bob', 'Bob -> Bob : hello'])).toEqual([]);
  });

  it('registers nothing under !pragma sequenceMessageSpan true (:167-168)', () => {
    expect(scan(['participant Bob', 'participant Max', 'Bob -> Bob : hello', 'Bob -> Max : hi'], true)).toEqual([]);
  });
});

describe('link anchor on a self message (CommunicationTileSelf.java:259-277)', () => {
  it('takes the middle of posC and posC2 + compWidth: (minX + maxX) / 2', () => {
    const lines = ['{a} Bob -> Bob : hello', 'activate Bob', '{b} Bob -> Bob : again', '{a} <-> {b}'];
    const link = layoutSequence(parse(lines), defaultTheme, measurer).linkAnchors?.[0];
    expect(link?.x).toBeCloseTo(BOB_CENTRE + (ACTIVATION_HALF_WIDTH + SELF_FLOOR) / 2, 3);
  });
});
