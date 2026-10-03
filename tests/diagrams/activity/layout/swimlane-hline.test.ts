import { describe, expect, it } from 'vitest';
import { routeHline } from '../../../../src/diagrams/activity/layout/swimlane-hline.js';
import type { HlinePayload } from '../../../../src/diagrams/activity/layout/swimlane-hline.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';

function makeEdge(minX: number, maxX: number, y = 50): ActivityEdgeGeo {
  return { points: [{ x: minX, y }, { x: maxX, y }], arrowhead: false };
}

describe('swimlane-hline#routeHline', () => {
  // pezubu-98-niba240's own numbers (FtileIfWithLinks, 3 lanes, branch
  // outcomes split across lanes "2"/"3" -- lane "1" has none).
  it('clips to the [first, last] lane range and skips lanes outside it', () => {
    const payload: HlinePayload = {
      low: 0,
      high: 118,
      candidates: [
        { x: 25, lane: '2' },
        { x: 93, lane: '3' },
      ],
      unfiltered: [],
    };
    const laneNames = ['1', '2', '3'];
    const deltas = new Map([
      ['1', -33.9875],
      ['2', 39.025],
      ['3', 64.375],
    ]);
    const routed = routeHline(payload, makeEdge(0, 118), laneNames, deltas);

    // lane "1" is outside [first=1, last=2] -- no edge at all.
    expect(routed.edges).toHaveLength(2);
    expect(routed.edgeMeta).toEqual([
      { lane1: '2', lane2: '2', shape: 'default' },
      { lane1: '3', lane2: '3', shape: 'default' },
    ]);
  });

  it("the first in-range lane's minX seeds from `high`, folded down to its own candidate", () => {
    const payload: HlinePayload = {
      low: 0,
      high: 118,
      candidates: [
        { x: 25, lane: '2' },
        { x: 93, lane: '3' },
      ],
      unfiltered: [],
    };
    const deltas = new Map([['2', 10]]);
    const routed = routeHline(payload, makeEdge(0, 118), ['2', '3'], deltas);
    // current=0===first -> minX seeds at high(118), folded to 25 by the
    // lane-"2" candidate; maxX stays at high(118) (current !== last).
    expect(routed.edges[0]!.points).toEqual([
      { x: 25 + 10, y: 50 },
      { x: 118 + 10, y: 50 },
    ]);
  });

  it("the last in-range lane's maxX seeds from `low`, folded up to its own candidate", () => {
    const payload: HlinePayload = {
      low: 0,
      high: 118,
      candidates: [
        { x: 25, lane: '2' },
        { x: 93, lane: '3' },
      ],
      unfiltered: [],
    };
    const deltas = new Map([['3', 20]]);
    const routed = routeHline(payload, makeEdge(0, 118), ['2', '3'], deltas);
    // current=1===last -> maxX seeds at low(0), folded to 93 by the
    // lane-"3" candidate; minX stays at low(0) (current !== first).
    expect(routed.edges[1]!.points).toEqual([
      { x: 0 + 20, y: 50 },
      { x: 93 + 20, y: 50 },
    ]);
  });

  // FtileIfLongHorizontal's own extra `getLeftOut` term -- folded into
  // EVERY in-range lane unconditionally, never swimlane-filtered.
  it('folds `unfiltered` candidates into every in-range lane', () => {
    const payload: HlinePayload = {
      low: 0,
      high: 200,
      candidates: [{ x: 50, lane: 'low' }],
      unfiltered: [120],
    };
    const deltas = new Map([['low', 0]]);
    const routed = routeHline(payload, makeEdge(0, 200), ['low'], deltas);
    // single-lane range: minX = high(200) folded by unfiltered(120) and
    // candidate(50) -> 50; maxX = low(0) folded by unfiltered(120) and
    // candidate(50) -> 120.
    expect(routed.edges[0]!.points).toEqual([
      { x: 50, y: 50 },
      { x: 120, y: 50 },
    ]);
  });

  it('a lane with no matching candidate (outside [first, last]) draws nothing', () => {
    const payload: HlinePayload = {
      low: 0,
      high: 100,
      candidates: [{ x: 40, lane: 'B' }],
      unfiltered: [],
    };
    const routed = routeHline(payload, makeEdge(0, 100), ['A', 'B', 'C'], new Map());
    expect(routed.edges).toHaveLength(1);
    expect(routed.edgeMeta[0]).toEqual({ lane1: 'B', lane2: 'B', shape: 'default' });
  });

  it('every output edge preserves the original edge\'s own fields (e.g. arrowhead: false)', () => {
    const payload: HlinePayload = { low: 0, high: 10, candidates: [{ x: 5, lane: 'A' }], unfiltered: [] };
    const routed = routeHline(payload, makeEdge(0, 10), ['A'], new Map());
    expect(routed.edges[0]!.arrowhead).toBe(false);
  });

  it('throws if no lane contains any candidate outcome (mirrors the Java IllegalStateException)', () => {
    const payload: HlinePayload = { low: 0, high: 10, candidates: [], unfiltered: [] };
    expect(() => routeHline(payload, makeEdge(0, 10), ['A', 'B'], new Map())).toThrow(
      /no swimlane contains a branch outcome/,
    );
  });

  it('an undefined delta for an in-range lane is treated as zero', () => {
    const payload: HlinePayload = {
      low: 0,
      high: 10,
      candidates: [
        { x: 2, lane: 'A' },
        { x: 8, lane: 'A' },
      ],
      unfiltered: [],
    };
    const routed = routeHline(payload, makeEdge(0, 10), ['A'], new Map());
    expect(routed.edges[0]!.points).toEqual([
      { x: 2, y: 50 },
      { x: 8, y: 50 },
    ]);
  });
});
