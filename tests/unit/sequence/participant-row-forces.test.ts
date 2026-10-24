/**
 * sdd3 T5c: the participant row is solved by `real/RealLine` -- forces in
 * `createMainTile`'s order, `RealMax` frozen at its first read -- not by a
 * sweep (`SequenceDiagramFileMakerTeoz.java:88-123`, `real/RealMax.java:89-94`).
 * Expected values are the jar's: the `jexavi-40-degi377` force trace
 * (`diagnosis/leftovers.md` M2) and hand-derived passes of the Java loop.
 */
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { layoutSequence } from '../../../src/diagrams/sequence/layout.js';
import { parseSequence } from '../../../src/diagrams/sequence/parser.js';
import type { Dolls } from '../../../src/diagrams/sequence/sequence-dolls.js';
import {
  scanMessageLabels,
  type DisjointConstraint,
  type RowConstraint,
  type SpanConstraint,
} from '../../../src/diagrams/sequence/sequence-layout-participant-constraints.js';
import {
  DollFloor,
  solveParticipantRow,
  type RowForcesEnv,
} from '../../../src/diagrams/sequence/sequence-real-force.js';
import { createOrigin, RealMax } from '../../../src/diagrams/sequence/sequence-real-line.js';
import { astOrThrow } from '../../helpers/parse-ast.js';
import { sequenceSource } from '../../helpers/sequence-source.js';

const measurer = new DeterministicMeasurer();

/** `jexavi-40-degi377`'s source (`test-results/dot-cache/sequence/jexavi-40-degi377/in.puml`). */
const JEXAVI = [
  'actor "person" as p',
  'participant "microwave" as m',
  'p->m: cook food',
  'par2',
  '   m->m: twiddle',
  'also',
  '   p2->p2: twiddle',
  'also',
  '   p3->p3: twiddle',
  'also',
  '   p->p: twiddle',
  'end',
  'p<-m: cooked food',
];

/** The jar's lifeline x for it (`in.svg`), and `p.posB`'s push (`leftovers.md` M2 step 4). */
const JAR_LIFELINES = [148.163, 242.931, 308.188, 362.731];
const PUSHED_POS_B = 113.76875;
/** `RealMax FIRST-READ -> 119.1625`: `m.posC` while `m.posB` is still 78.69375 (`leftovers.md` M2 step 3). */
const FIRST_READ = 119.1625;
/** `LEFT_MARGIN`, the origin the row is drawn from (`sequence-layout-participants.ts`). */
const ORIGIN_X = 10;

const NO_DOLLS = { minPosB: () => Number.NEGATIVE_INFINITY } as unknown as Dolls;

const env = (over: Partial<RowForcesEnv> & Pick<RowForcesEnv, 'widths' | 'constraints'>): RowForcesEnv => ({
  originX: 0,
  participantGap: 10,
  baked: { before: over.widths.map(() => 0), after: over.widths.map(() => 0) },
  dolls: NO_DOLLS,
  ...over,
});

afterEach(() => vi.restoreAllMocks());

describe('jexavi-40-degi377: the cyclic ensureDisjoint force (PlayingSpace.java:263-264)', () => {
  const ast = astOrThrow(parseSequence(sequenceSource(JEXAVI)), 'sequence');

  it('scans one disjoint pair of the group against `p->m`, the group`s max owned by the tile', () => {
    const sorted = [...ast.participants].sort((a, b) => a.order - b.order);
    const out: RowConstraint[] = [];
    scanMessageLabels(ast.events, sorted, { measurer, levels: undefined, sprites: ast.sprites }, out);
    const disjoint = out.filter((c): c is DisjointConstraint => 'disjoint' in c);
    // `ensureDisjoint(p->m, par2)`: the message is the left tile, so its `getMaxX` builds a
    // fresh RealMax; the group is the right tile, whose `getMinX` binds its four candidates.
    expect(disjoint).toHaveLength(1);
    expect(disjoint[0]!.highsOwner).toBeUndefined();
    expect(disjoint[0]!.lows.map((a) => a.index).sort()).toEqual([0, 1, 2, 3]);
    // The disjoint force is registered last (`PlayingSpace.java:163-167`).
    expect(out.at(-1)).toBe(disjoint[0]);
  });

  it('first-reads its RealMax at 119.1625, with `m` still unconverged (RealMax.java:89-94)', () => {
    const spy = vi.spyOn(RealMax.prototype, 'getCurrentValueInternal');
    layoutSequence(ast, defaultTheme, measurer);
    // The disjoint force's max is the FIRST RealMax read; converged it would be 232.93125.
    expect(spy.mock.results[0]!.value).toBeCloseTo(FIRST_READ, 4);
  });

  it('pushes p.posB by 119.1625 + 19 - 24.39375 = 113.76875 and lands every lifeline on the jar`s x', () => {
    const geo = layoutSequence(ast, defaultTheme, measurer);
    const [p, m, p2, p3] = geo.participants;
    expect(p!.x - ORIGIN_X).toBeCloseTo(PUSHED_POS_B, 4);
    expect([p, m, p2, p3].map((g) => g!.centerX)).toEqual(JAR_LIFELINES.map((x): unknown => expect.closeTo(x, 3)));
  });
});

describe('solveParticipantRow (SequenceDiagramFileMakerTeoz.java:88-116)', () => {
  const span = (c: Omit<SpanConstraint, 'span'> & { span: number }): SpanConstraint => c;

  it('keeps neighbours a gap apart, with the margins as baked (LivingSpaces.java:61-71)', () => {
    const xs = solveParticipantRow(
      env({
        widths: [20, 30],
        constraints: [],
        baked: { before: [0, 4], after: [6, 0] },
        originX: 10,
      }),
    );
    // posA(1) = posB(1) - 4 >= posE(0) + 10 = (x0 + 20 + 6) + 10.
    expect(xs).toEqual([10, 10 + 20 + 6 + 10 + 4]);
  });

  it('puts a message`s two centres `span` apart (CommunicationTile.java:427)', () => {
    const xs = solveParticipantRow(env({ widths: [20, 20], constraints: [span({ from: 0, to: 1, span: 100 })] }));
    expect(xs).toEqual([0, 100]);
  });

  it('measures a create message to the created head`s near edge (CommunicationTile.java:435-443)', () => {
    // Forward: posB(to) >= posC(from) + span.
    expect(
      solveParticipantRow(
        env({ widths: [20, 40], constraints: [span({ from: 0, to: 1, span: 100, createdIndex: 1 })] }),
      ),
    ).toEqual([0, 110]);
    // Reverse: posC(to) >= posD(from) + span, the created head the LOWER index.
    expect(
      solveParticipantRow(
        env({ widths: [40, 20], constraints: [span({ from: 0, to: 1, span: 100, createdIndex: 0 })] }),
      ),
    ).toEqual([0, 40 + 100 - 10]);
  });

  it('measures a ref between the two boxes` edges (ReferenceTile.java:113)', () => {
    const xs = solveParticipantRow(
      env({ widths: [20, 20], constraints: [span({ from: 0, to: 1, span: 100, edge: true })] }),
    );
    // posD(1) >= posB(0) + 100.
    expect(xs).toEqual([0, 80]);
  });

  it('keeps an exo message`s lifeline clear of the origin (CommunicationExoTile.java:180)', () => {
    const xs = solveParticipantRow(
      env({ widths: [20], constraints: [span({ from: 0, to: 0, span: 100, origin: true })], originX: 10 }),
    );
    // posC(0) >= xorigin + 100, drawn from originX.
    expect(xs).toEqual([10 + 90]);
  });

  it('registers a ref`s force before the neighbour rule, a tile`s after it (createMainTile:113-115)', () => {
    // Same solution either order here; it pins that an edge constraint is not dropped or doubled.
    const xs = solveParticipantRow(
      env({
        widths: [20, 20, 20],
        constraints: [span({ from: 0, to: 2, span: 200 }), span({ from: 0, to: 1, span: 60, edge: true })],
      }),
    );
    // posD(1) >= posB(0) + 60 puts x1 at 40; posC(2) >= posC(0) + 200 puts x2 at 200.
    expect(xs).toEqual([0, 40, 200]);
  });

  it('applies a doll`s live neighbour floor (Doll.java:250-269)', () => {
    const dolls = {
      minPosB: (i: number, previousPosD: number | undefined, origin: number) =>
        i === 1 ? (previousPosD ?? origin) + 50 : Number.NEGATIVE_INFINITY,
    } as unknown as Dolls;
    expect(solveParticipantRow(env({ widths: [20, 20], constraints: [], dolls }))).toEqual([0, 70]);
  });

  it('solves a cyclic ensureDisjoint through the RealMax`s first read (PlayingSpace.java:263-264)', () => {
    // a.posC >= RealMax(b.posC) while b.posC >= a.posC + 50: no fixed point with a
    // live max. Pass 1 moves b to posC 60 (neighbour rule, then the message), THEN the
    // disjoint force first-reads the max (60) and pushes a to posC 60; pass 2 re-propagates
    // b to posC 110 and nothing moves again.
    const disjoint: DisjointConstraint = {
      disjoint: true,
      lows: [{ index: 0, offset: 0, at: 'C' }],
      highs: [{ index: 1, offset: 0, at: 'C' }],
    };
    const xs = solveParticipantRow(
      env({ widths: [20, 20], constraints: [span({ from: 0, to: 1, span: 50 }), disjoint] }),
    );
    expect(xs).toEqual([50, 100]);
  });

  it('shares a group`s max, and so its cache, across every disjoint call it takes part in', () => {
    // Two tiles disjoint from the same group: its RealMax is built and first-read once.
    const owner = {};
    const highs = [{ index: 1, offset: 0, at: 'C' as const }];
    const pairs: DisjointConstraint[] = [
      { disjoint: true, lows: [{ index: 0, offset: 0, at: 'C' }], highs, highsOwner: owner },
      { disjoint: true, lows: [{ index: 2, offset: 0, at: 'C' }], highs, highsOwner: owner },
    ];
    const spy = vi.spyOn(RealMax.prototype, 'getCurrentValueInternal');
    solveParticipantRow(env({ widths: [20, 20, 20], constraints: pairs }));
    expect(new Set(spy.mock.contexts).size).toBe(1);
  });

  it('solves an empty row', () => {
    expect(solveParticipantRow(env({ widths: [], constraints: [] }))).toEqual([]);
  });
});

describe('DollFloor', () => {
  const floor = new DollFloor(NO_DOLLS, 3, undefined, createOrigin());

  it('is a bound read each pass, never a point to move or bind', () => {
    expect(floor.getName()).toBe('dollFloor 3');
    expect(floor.getCurrentValue()).toBe(Number.NEGATIVE_INFINITY);
    expect(() => floor.addFixed()).toThrow('unsupported');
    expect(() => floor.addAtLeast()).toThrow('unsupported');
    expect(() => floor.ensureBiggerThan()).toThrow('unsupported');
  });
});
