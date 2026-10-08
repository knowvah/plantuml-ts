/**
 * add4-T1b: which edges each lane's width measurement sees.
 * @see net/sourceforge/plantuml/activitydiagram3/ftile/vcompact/UGraphicInterceptorAllSwimlanes.java:88-101
 */
import { describe, it, expect } from 'vitest';
import { sameLaneEdges } from '../../../../src/diagrams/activity/layout/swimlane-measure-edges.js';
import type { EdgeMeta } from '../../../../src/diagrams/activity/layout/swimlane-placement.js';
import type { ActivityEdgeGeo } from '../../../../src/diagrams/activity/activity-geometry.types.js';

const EDGE = { points: [{ x: 0, y: 0 }, { x: 10, y: 0 }] } as unknown as ActivityEdgeGeo;
const HLINE = { low: 0, high: 10, candidates: [], unfiltered: [0] };

function meta(lane1: string | undefined, lane2: string | undefined, extra: Partial<EdgeMeta> = {}): EdgeMeta {
  return { lane1, lane2, shape: 'default', ...extra };
}

describe('sameLaneEdges', () => {
  it('keeps same-lane edges and drops cross-lane / unlaned ones', () => {
    const got = sameLaneEdges([EDGE, EDGE, EDGE], [meta('A', 'A'), meta('A', 'B'), meta(undefined, undefined)]);
    expect(got.map((e) => e.swimlane)).toEqual(['A']);
  });

  it('a ConnectionHline with measureLanes enters every listed lane', () => {
    const got = sameLaneEdges([EDGE], [meta('B', 'B', { hline: { ...HLINE, measureLanes: ['B', 'A'] } })]);
    expect(got.map((e) => e.swimlane)).toEqual(['B', 'A']);
  });

  it('a ConnectionHline without measureLanes stays in its own lane', () => {
    const got = sameLaneEdges([EDGE], [meta('B', 'B', { hline: HLINE })]);
    expect(got.map((e) => e.swimlane)).toEqual(['B']);
  });
});
