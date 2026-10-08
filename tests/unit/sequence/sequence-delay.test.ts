/**
 * The delay's two cuts and its page/scale transforms, case by case.
 *
 * `cutSegmentIfNeed` is `sequencediagram/graphic/Segment.java:99-127`,
 * `lifelineSegments` is `teoz/MutingLine.java:73-92`, the activation cut is
 * `teoz/LiveBoxesDrawer.java:105-121`, and the page clip of each piece is
 * `klimt/UClip.java:131-157`. Jar-level evidence is in
 * `unwind2-s4-delay-jar.test.ts`; these pin the branches the fixtures do not
 * all reach.
 */
import { describe, expect, it } from 'vitest';

import {
  cutActivationsAtDelays,
  cutSegmentIfNeed,
  delaySpansOf,
  lifelineSegments,
} from '../../../src/diagrams/sequence/sequence-delay.js';
import { paginateSequence } from '../../../src/diagrams/sequence/sequence-page.js';
import { scaleSequenceGeometry } from '../../../src/diagrams/sequence/scale-geo.js';
import { renderActivation, renderLifelineSegments } from '../../../src/diagrams/sequence/renderer-lifeline.js';
import { NEWPAGE_TILE_HEIGHT } from '../../../src/diagrams/sequence/newpage-style.js';
import { defaultTheme } from '../../../src/core/theme.js';
import type {
  ActivationGeo,
  DelayGeo,
  EventGeo,
  ParticipantGeo,
  SequenceGeometry,
} from '../../../src/diagrams/sequence/ast.js';
import type { ScaledTheme } from '../../../src/diagrams/sequence/scale-geo.js';

const theme: ScaledTheme = { ...defaultTheme, scaleK: 1 };

function delay(y: number, height = 28): DelayGeo {
  return { kind: 'delay', y, height, middleX: 100, textWidth: 0, labelRuns: [] };
}

function act(y: number, height: number): ActivationGeo {
  return { kind: 'activation', participantId: 'A', lifelineX: 40, y, height, level: 1 };
}

const PARTICIPANT: ParticipantGeo = {
  id: 'A',
  display: 'A',
  type: 'participant',
  x: 10,
  y: 0,
  width: 60,
  height: 30,
  centerX: 40,
  background: defaultTheme.colors.background,
  border: defaultTheme.colors.border,
  labelRuns: [],
};

describe('cutSegmentIfNeed (Segment.java:99-127)', () => {
  it('returns the whole segment when no delay touches it', () => {
    expect(cutSegmentIfNeed({ y1: 10, y2: 50 }, [{ y1: 60, y2: 80 }])).toEqual([{ y1: 10, y2: 50 }]);
  });

  it('cuts around a delay wholly inside', () => {
    expect(cutSegmentIfNeed({ y1: 10, y2: 100 }, [{ y1: 40, y2: 60 }])).toEqual([
      { y1: 10, y2: 40 },
      { y1: 60, y2: 100 },
    ]);
  });

  it('skips a delay that starts within 0.001 of the pending start', () => {
    expect(cutSegmentIfNeed({ y1: 10, y2: 100 }, [{ y1: 10.0005, y2: 30 }])).toEqual([{ y1: 30, y2: 100 }]);
  });

  it('ignores a delay that overhangs the end, and one that started before', () => {
    const delays = [
      { y1: 0, y2: 20 },
      { y1: 90, y2: 120 },
    ];
    expect(cutSegmentIfNeed({ y1: 10, y2: 100 }, delays)).toEqual([{ y1: 10, y2: 100 }]);
  });

  it('sorts the delays before walking them', () => {
    const delays = [
      { y1: 70, y2: 80 },
      { y1: 30, y2: 40 },
    ];
    expect(cutSegmentIfNeed({ y1: 10, y2: 100 }, delays)).toEqual([
      { y1: 10, y2: 30 },
      { y1: 40, y2: 70 },
      { y1: 80, y2: 100 },
    ]);
  });

  it('returns nothing when a delay covers the whole segment from its start', () => {
    expect(cutSegmentIfNeed({ y1: 10, y2: 30 }, [{ y1: 10, y2: 30 }])).toEqual([]);
  });
});

describe('lifelineSegments (MutingLine.java:73-92)', () => {
  it('leaves no solid piece between back-to-back delays', () => {
    expect(
      lifelineSegments(39, 200, [
        { y1: 60, y2: 88 },
        { y1: 88, y2: 127 },
      ]),
    ).toEqual([
      { y1: 39, y2: 60, delay: false },
      { y1: 60, y2: 88, delay: true },
      { y1: 88, y2: 127, delay: true },
      { y1: 127, y2: 200, delay: false },
    ]);
  });

  it('ignores a delay not wholly inside [start, end]', () => {
    expect(lifelineSegments(39, 100, [{ y1: 90, y2: 118 }])).toEqual([{ y1: 39, y2: 100, delay: false }]);
  });
});

describe('cutActivationsAtDelays (LiveBoxesDrawer.java:105-121)', () => {
  it('returns the events themselves when there is no delay', () => {
    const events: EventGeo[] = [act(10, 50)];
    expect(cutActivationsAtDelays(events)).toBe(events);
  });

  it('opens the pieces at each cut: CLOSE_OPEN, OPEN_OPEN, OPEN_CLOSE', () => {
    const events: EventGeo[] = [act(10, 100), delay(30, 10), delay(60, 10)];
    const bars = cutActivationsAtDelays(events).filter((e): e is ActivationGeo => e.kind === 'activation');
    expect(bars.map((b) => [b.y, b.height, b.open])).toEqual([
      [10, 20, { closeUp: true, closeDown: false }],
      [40, 20, { closeUp: false, closeDown: false }],
      [70, 40, { closeUp: false, closeDown: true }],
    ]);
  });

  it('keeps a single remaining piece closed (CLOSE_CLOSE)', () => {
    const bars = cutActivationsAtDelays([act(10, 40), delay(10, 10)]);
    expect(bars[0]).toEqual(act(20, 30));
  });

  it('drops a bar a delay swallows whole', () => {
    expect(cutActivationsAtDelays([act(10, 10), delay(10, 10)]).map((e) => e.kind)).toEqual(['delay']);
  });

  it('lists the spans in tile order', () => {
    expect(delaySpansOf([delay(10, 5), act(0, 1), delay(40)])).toEqual([
      { y1: 10, y2: 15 },
      { y1: 40, y2: 68 },
    ]);
  });
});

describe('rendering the pieces', () => {
  it('draws a DELAY_LINE bare, dashed 1,4, and an empty group for a clipped-out piece', () => {
    const svg = renderLifelineSegments(
      PARTICIPANT,
      [
        { y1: 39, y2: 60, delay: true },
        { y1: 60, y2: 60, delay: false, clippedOut: true },
      ],
      theme,
    );
    expect(svg).toBe(
      '<line x1="40" y1="39" x2="40" y2="60" stroke="#181818" stroke-dasharray="1,4"/><g><title>A</title></g>',
    );
  });

  it('draws an open bar as a back-coloured rect, two sides and its closed end', () => {
    const svg = renderActivation({ ...act(10, 20), open: { closeUp: true, closeDown: false } }, theme);
    expect((svg.match(/<line /g) ?? []).length).toBe(3);
    expect(svg).toContain('<line x1="35" y1="10" x2="45" y2="10"');
  });
});

/** Two pages: tile at 200, so page 0's band is [30, 222]. */
function paged(events: EventGeo[]): SequenceGeometry {
  return {
    totalWidth: 400,
    totalHeight: 560,
    participants: [PARTICIPANT],
    events: [...events, { kind: 'newpage', y: 200, height: NEWPAGE_TILE_HEIGHT, bandX: 10, bandWidth: 360 }],
    headHeight: 30,
    lifelineEndY: 500,
    footerShapeY: 500,
    showFootbox: true,
    boxes: [],
    lifelineSegments: { A: lifelineSegments(30, 500, delaySpansOf(events)) },
  };
}

describe('a page clips the pieces (UClip#getClippedLine)', () => {
  it('clamps a delay crossing the band bottom, drops one below, empties the solid pieces', () => {
    const page = paginateSequence(paged([delay(221), delay(300)]), 0);
    // Each PARTICIPANT_LINE below the band still opens its group (giloko's
    // trailing `<g><title>A</title></g>`); the DELAY_LINE leaves nothing.
    const emptied = { y1: 222, y2: 222, delay: false, clippedOut: true };
    expect(page.lifelineSegments?.['A']).toEqual([
      { y1: 30, y2: 221, delay: false },
      { y1: 221, y2: 222, delay: true },
      emptied,
      emptied,
    ]);
  });

  it('drops the delay text whose anchor left the band, keeping the rest', () => {
    const run = { text: 't', x: 0, y: 230, textWidth: 1, textAscent: 1, textLineHeight: 1 };
    const kept = { ...run, y: 100 };
    const page = paginateSequence(paged([{ ...delay(90), labelRuns: [kept, run] }]), 0);
    const d = page.events.find((e): e is DelayGeo => e.kind === 'delay');
    expect(d?.labelRuns.map((r) => r.y)).toEqual([100]);
  });

  it('drops the closed end of an open bar that the band cut off', () => {
    const bar: ActivationGeo = { ...act(150, 100), open: { closeUp: false, closeDown: true } };
    const page = paginateSequence(paged([bar]), 0);
    const clipped = page.events.find((e): e is ActivationGeo => e.kind === 'activation');
    expect([clipped?.y, clipped?.height, clipped?.open]).toEqual([150, 72, { closeUp: false, closeDown: false }]);
  });
});

describe('scale', () => {
  it('scales a delay and the lifeline pieces', () => {
    const scaled = scaleSequenceGeometry(paged([{ ...delay(100), textWidth: 10, middleX: 50 }]), 2);
    const d = scaled.events.find((e): e is DelayGeo => e.kind === 'delay');
    expect([d?.y, d?.height, d?.middleX, d?.textWidth]).toEqual([200, 56, 100, 20]);
    expect(scaled.lifelineSegments?.['A']?.[1]).toEqual({ y1: 200, y2: 256, delay: true });
  });
});
