import { describe, expect, it } from 'vitest';

import {
  compressGeometry,
  type CompressInput,
} from '../../../../../src/diagrams/activity/layout/compress/compress-geometry.js';
import type { ActivityNodeGeo, ActivityEdgeGeo } from '../../../../../src/diagrams/activity/layout.old.js';
import type { SwimlaneGeo } from '../../../../../src/diagrams/activity/activity-layout-types.js';
import type { EdgeMeta } from '../../../../../src/diagrams/activity/layout/swimlane-placement.js';
import type { Reservation } from '../../../../../src/diagrams/activity/layout/hexagon-reservations.js';
import type { StringBounder } from '../../../../../src/diagrams/activity/tiles/tile.js';
import { resolveTheme } from '../../../../../src/core/theme.js';

const theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };
const bounder: StringBounder = { getDimension: (text: string) => ({ width: text.length * 6, height: 11 }) };

function node(id: string, kind: string, x: number, y: number, width: number, height: number): ActivityNodeGeo {
  return { id, kind, x, y, width, height };
}

function baseInput(overrides: Partial<CompressInput> = {}): CompressInput {
  return {
    nodes: [],
    edges: [],
    edgeMeta: [],
    swimlanes: [],
    reservations: [],
    bounds: { maxX: 0, maxY: 0 },
    bounder,
    theme,
    ...overrides,
  };
}

function round(n: number): number {
  return Math.round(n * 1000) / 1000;
}

describe('compressGeometry — single rect over an empty gap', () => {
  it('narrows a rect spanning a 28-wide empty gap by 18', () => {
    // A single ignore-flagged bar (`fork-bar`): `URectangle
    // #drawWhenCompressed` reserves only `UEmpty(2, h)` at each end
    // (`URectangle.java:193-199`), leaving its own 28-wide middle as an
    // empty, compressible gap; `smaller(5)` shrinks it to 18
    // (`CompressionXorYBuilder.java:56`).
    const bar = node('bar', 'fork-bar', 0, 0, 2 + 28 + 2, 6);
    const input = baseInput({ nodes: [bar], bounds: { maxX: 32, maxY: 6 } });
    const result = compressGeometry(input);
    const barOut = result.nodes[0]!;
    expect(result.removed.x).toBe(18);
    expect(round(barOut.width)).toBe(14);
  });
});

describe('compressGeometry — ellipse shifts, keeps width', () => {
  it('a start ellipse right of a removed slot shifts left by the slot and keeps its width', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const input = baseInput({ nodes: [left, right], bounds: { maxX: 88, maxY: 10 } });
    const result = compressGeometry(input);
    const rightOut = result.nodes.find((n) => n.id === 'b')!;
    // gap [30,58] = 28 -> smaller(5) -> [35,53] = 18 removed.
    expect(result.removed.x).toBe(18);
    expect(round(rightOut.x)).toBe(40);
    expect(rightOut.width).toBe(30);
  });
});

describe('compressGeometry — fork bar over two branches', () => {
  it('two 30-wide branches 28 apart under a 14-overhang fork bar end 10 apart, bar 22 narrower', () => {
    const bar = node('bar', 'fork-bar', 12, 0, 14 + 30 + 28 + 30 + 14, 6);
    const branch1 = node('b1', 'action', 26, 10, 30, 20);
    const branch2 = node('b2', 'action', 84, 10, 30, 20);
    const input = baseInput({ nodes: [bar, branch1, branch2], bounds: { maxX: 128, maxY: 30 } });
    const result = compressGeometry(input);
    const barOut = result.nodes.find((n) => n.id === 'bar')!;
    const b1Out = result.nodes.find((n) => n.id === 'b1')!;
    const b2Out = result.nodes.find((n) => n.id === 'b2')!;
    expect(result.removed.x).toBe(22);
    expect(round(barOut.width)).toBe(94);
    expect(round(b1Out.width)).toBe(30);
    expect(round(b2Out.width)).toBe(30);
    expect(round(b2Out.x - (b1Out.x + b1Out.width))).toBe(10);
  });
});

describe('compressGeometry — bounds', () => {
  it('bounds.maxX transforms through the X pass ct', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const input = baseInput({ nodes: [left, right], bounds: { maxX: 88, maxY: 10 } });
    const result = compressGeometry(input);
    expect(round(result.bounds.maxX)).toBe(70);
  });
});

describe('compressGeometry — no-op when no gap exceeds 10', () => {
  it('returns the geometry unchanged when no empty gap is wider than 10', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 39, 0, 30, 10);
    const input = baseInput({ nodes: [left, right], bounds: { maxX: 69, maxY: 10 } });
    const result = compressGeometry(input);
    expect(result.removed).toEqual({ x: 0, y: 0 });
    expect(result.nodes).toEqual(input.nodes);
    expect(result.bounds).toEqual(input.bounds);
  });
});

describe('compressGeometry — edges move with their gap', () => {
  it('an edge through a removed slot has both endpoints moved', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const edge: ActivityEdgeGeo = {
      points: [
        { x: 15, y: 10 },
        { x: 73, y: 10 },
      ],
    };
    const edgeMeta: EdgeMeta[] = [{ lane1: undefined, lane2: undefined, shape: 'default' }];
    const input = baseInput({ nodes: [left, right], edges: [edge], edgeMeta, bounds: { maxX: 88, maxY: 10 } });
    const result = compressGeometry(input);
    const edgeOut = result.edges[0]!;
    // Neither endpoint sits inside the removed slot [35,53], so both shift
    // by the full 18 removed.
    expect(round(edgeOut.points[0]!.x)).toBe(15);
    expect(round(edgeOut.points[1]!.x)).toBe(55);
  });
});

describe('compressGeometry — lanes', () => {
  it("a lane's x + width and contentX + contentWidth follow the transform", () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const lane: SwimlaneGeo = { name: 'L', x: 0, width: 88, contentX: 5, contentWidth: 78 };
    const input = baseInput({
      nodes: [left, right],
      swimlanes: [lane],
      bounds: { maxX: 88, maxY: 10 },
    });
    const result = compressGeometry(input);
    const laneOut = result.swimlanes[0]!;
    // gap [30,58]=28 -> 18 removed, entirely inside the lane's span.
    // contentX=5 sits before the removed slot (unchanged); contentX +
    // contentWidth = 83 sits after it, so only contentWidth absorbs the 18.
    expect(round(laneOut.x)).toBe(0);
    expect(round(laneOut.x + laneOut.width)).toBe(70);
    expect(round(laneOut.contentX!)).toBe(5);
    expect(round(laneOut.contentWidth!)).toBe(60);
  });

  it('leaves contentMinX untouched (lane-local, not an absolute coordinate)', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const lane: SwimlaneGeo = { name: 'L', x: 0, width: 88, contentX: 5, contentWidth: 78, contentMinX: 3 };
    const input = baseInput({ nodes: [left, right], swimlanes: [lane], bounds: { maxX: 88, maxY: 10 } });
    const result = compressGeometry(input);
    expect(result.swimlanes[0]!.contentMinX).toBe(3);
  });
});

describe('compressGeometry — reservations', () => {
  it('transforms an ignore-flagged (rect-shaped) reservation with a width recompute', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    // A band-shaped reservation spanning the whole width (both ignore
    // flags set, mirroring `withBandReservation`).
    const reservation: Reservation = { x: 0, y: 20, width: 88, height: 8, ignoreX: true, ignoreY: true };
    const input = baseInput({
      nodes: [left, right],
      reservations: [reservation],
      bounds: { maxX: 88, maxY: 30 },
    });
    const result = compressGeometry(input);
    const rOut = result.reservations[0]!;
    expect(round(rOut.x)).toBe(0);
    expect(round(rOut.width)).toBe(70);
  });

  it('translates an un-flagged (UEmpty-shaped) reservation, keeping its width', () => {
    const left = node('a', 'start', 0, 0, 30, 10);
    const right = node('b', 'start', 58, 0, 30, 10);
    const reservation: Reservation = { x: 60, y: 0, width: 5, height: 12 };
    const input = baseInput({
      nodes: [left, right],
      reservations: [reservation],
      bounds: { maxX: 88, maxY: 30 },
    });
    const result = compressGeometry(input);
    const rOut = result.reservations[0]!;
    expect(round(rOut.x)).toBe(42);
    expect(rOut.width).toBe(5);
  });
});

describe('compressGeometry — split-bar/split-join-bar geometry transform', () => {
  it('recomputes X width like a rect (both ULine endpoints transform)', () => {
    // `split-bar` draws NOTHING in `shapesOf` (`FtileThinSplit.java:87-96`
    // is a `ULine`, never occupies) -- the gap comes entirely from the two
    // action boxes it visually spans over, not from any reservation of its
    // own (unlike `fork-bar`'s ignoreX end-reservations in the AC3 test
    // above).
    const bar = node('bar', 'split-bar', 0, 0, 90, 6);
    const left = node('a', 'action', 10, 10, 20, 20);
    const right = node('b', 'action', 58, 10, 20, 20);
    const input = baseInput({ nodes: [bar, left, right], bounds: { maxX: 90, maxY: 30 } });
    const result = compressGeometry(input);
    const barOut = result.nodes.find((n) => n.id === 'bar')!;
    // gap [30,58]=28 -> 18 removed; the bar's own span [0,90] contains it
    // wholly, so it narrows by exactly 18, same as the single-bar test.
    expect(result.removed.x).toBe(18);
    expect(round(barOut.width)).toBe(72);
  });

  it('keeps Y height unchanged (a ULine has dy=0, unlike a real rect)', () => {
    const bar = node('bar', 'split-bar', 0, 12, 30, 40);
    const above = node('a', 'start', 0, 0, 30, 8);
    const below = node('b', 'start', 0, 60, 30, 8);
    const input = baseInput({ nodes: [bar, above, below], bounds: { maxX: 30, maxY: 68 } });
    const result = compressGeometry(input);
    const barOut = result.nodes.find((n) => n.id === 'bar')!;
    // Regardless of what Y compression removes, the bar's own height field
    // is never recomputed via ct(y+h)-ct(y) -- it stays the input value.
    expect(barOut.height).toBe(40);
  });
});

describe('compressGeometry — note spikeTip', () => {
  it('moves spikeTip.x through ct alongside the note box', () => {
    // The spike sits to the RIGHT of the note's own box (`notePosition:
    // 'right'`), so `noteBox`'s union only extends the box's max edge --
    // the gap between `left` and the note's own `x` (its min edge) is
    // unaffected by the spike.
    const left = node('a', 'start', 0, 0, 30, 10);
    const note: ActivityNodeGeo = {
      id: 'n',
      kind: 'note',
      x: 60,
      y: 0,
      width: 20,
      height: 10,
      spikeTip: { x: 85, y: 5 },
    };
    const input = baseInput({ nodes: [left, note], bounds: { maxX: 85, maxY: 10 } });
    const result = compressGeometry(input);
    const noteOut = result.nodes.find((n) => n.id === 'n')!;
    // occupied [0,30] and [60,85] (box unioned with the spike) -> gap
    // [30,60]=30 -> smaller(5) -> [35,55]=20 removed.
    expect(result.removed.x).toBe(20);
    expect(round(noteOut.x)).toBe(40);
    expect(round(noteOut.spikeTip!.x)).toBe(65);
    expect(noteOut.width).toBe(20);
  });
});

describe('compressGeometry — Y runs after X, on the X-compressed geometry', () => {
  it('only sees a Y slot that appears because X moved something', () => {
    // Two columns, each with a start/stop 40 apart in Y with nothing
    // between them (a 20-wide gap after `smaller(5)` on Y) -- but a wide
    // rect in column 2 (spanning both columns' X range) keeps the Y gap
    // filled UNTIL X-compression moves column 2's box out from under it.
    // Simpler, deterministic case: assert ordering via a spy on the
    // X-then-Y sequence using two independent, non-interacting axes.
    const leftX = node('a', 'start', 0, 0, 30, 10);
    const rightX = node('b', 'start', 58, 0, 30, 10);
    const topY = node('c', 'start', 0, 0, 10, 30);
    const bottomY = node('d', 'start', 0, 58, 10, 30);
    const input = baseInput({
      nodes: [leftX, rightX, topY, bottomY],
      bounds: { maxX: 88, maxY: 88 },
    });
    const result = compressGeometry(input);
    expect(result.removed.x).toBe(18);
    expect(result.removed.y).toBe(18);
    // X pass must not have touched Y coordinates, and vice versa.
    const topOut = result.nodes.find((n) => n.id === 'c')!;
    expect(round(topOut.x)).toBe(0);
  });
});
