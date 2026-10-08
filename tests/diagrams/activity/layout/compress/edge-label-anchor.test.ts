import { describe, expect, it } from 'vitest';

import {
  edgeLabelLayout,
  labelAnchors,
  transformAnchors,
  withLabelDeltas,
} from '../../../../../src/diagrams/activity/layout/compress/edge-label-anchor.js';
import type { ActivityEdgeGeo } from '../../../../../src/diagrams/activity/activity-geometry.types.js';
import type { PiecewiseAffineTransform } from '../../../../../src/diagrams/activity/layout/compress/compression-transform.js';
import { resolveTheme } from '../../../../../src/core/theme.js';

const theme = resolveTheme('default');
/** The activity arrow font is 11 (`plantuml.skin:373`); its first baseline
 *  sits `11 * (1 - 1/4.5)` below the block top. */
const ASCENT = 11 * (1 - 1 / 4.5);

/** `CompressionTransform` with one removed slot `[10, 30]` (20 px). */
const REMOVE_10_30: PiecewiseAffineTransform = {
  transform: (v) => (v <= 10 ? v : v <= 30 ? 10 : v - 20),
};

/** A `ConnectionLastElse`-shaped worm, CENTER-labelled
 *  (`FtileIfLongVertical.java:319-320`). */
function centerEdge(points: { x: number; y: number }[]): ActivityEdgeGeo {
  return { from: 'a', to: 'b', points, label: 'no3', labelAlign: { vertical: 'CENTER' } } as ActivityEdgeGeo;
}

const RAW = [
  { x: 0, y: 0 },
  { x: 0, y: 40 },
  { x: 20, y: 40 },
  { x: 20, y: 100 },
];
/** RAW after {@link REMOVE_10_30} on Y. */
const COMPRESSED = RAW.map((p) => ({ x: p.x, y: REMOVE_10_30.transform(p.y) }));

describe('edgeLabelLayout', () => {
  it('is undefined for an unlabelled edge', () => {
    expect(edgeLabelLayout({ from: 'a', to: 'b', points: RAW } as ActivityEdgeGeo, theme)).toBeUndefined();
  });

  it('places on the points alone without a delta (Snake.java:254-256)', () => {
    const layout = edgeLabelLayout(centerEdge(RAW), theme)!;
    // y = (0 + 100 - 10) / 2 - 11 / 2 = 39.5; x = worm minX.
    expect(layout.x).toBe(0);
    expect(layout.baselineY).toBeCloseTo(39.5 + ASCENT, 9);
    expect(layout.lines).toEqual(['no3']);
    expect(layout.size).toBe(11);
  });

  it('adds labelDelta to the placement', () => {
    const edge = { ...centerEdge(RAW), labelDelta: { x: 2, y: -3 } };
    const layout = edgeLabelLayout(edge, theme)!;
    expect(layout.x).toBe(2);
    expect(layout.baselineY).toBeCloseTo(36.5 + ASCENT, 9);
  });
});

describe('raw anchor through compression', () => {
  it('maps the raw anchor through ct, not a recompute on compressed points', () => {
    const anchors = transformAnchors(labelAnchors([centerEdge(RAW)], theme), REMOVE_10_30, 'y');
    const [edge] = withLabelDeltas([centerEdge(COMPRESSED)], anchors, theme);
    // Raw baseline 48.056 -> ct 28.056. A recompute on COMPRESSED gives
    // (0 + 80 - 10) / 2 - 5.5 = 29.5 -> 38.056: half the slot (10) too low.
    expect(edge!.labelDelta).toEqual({ x: 0, y: -10 });
    expect(edgeLabelLayout(edge!, theme)!.baselineY).toBeCloseTo(39.5 + ASCENT - 20, 9);
  });

  it('an ON_X pass maps only x', () => {
    const shiftX: PiecewiseAffineTransform = { transform: (v) => v - 5 };
    expect(transformAnchors([{ x: 10, y: 7 }, undefined], shiftX, 'x')).toEqual([{ x: 5, y: 7 }, undefined]);
  });

  it('a zero delta leaves no field and drops a stale one', () => {
    const stale = { ...centerEdge(RAW), labelDelta: { x: 1, y: 1 } };
    const anchors = labelAnchors([centerEdge(RAW)], theme);
    const [edge] = withLabelDeltas([stale], anchors, theme);
    expect(edge).not.toHaveProperty('labelDelta');
    expect(edgeLabelLayout(edge!, theme)!.baselineY).toBeCloseTo(39.5 + ASCENT, 9);
  });

  it('leaves an unlabelled edge untouched', () => {
    const plain = { from: 'a', to: 'b', points: RAW } as ActivityEdgeGeo;
    expect(withLabelDeltas([plain], [undefined], theme)[0]).toBe(plain);
  });

  it('a rigid translate of the points carries the label with it', () => {
    const anchors = transformAnchors(labelAnchors([centerEdge(RAW)], theme), REMOVE_10_30, 'y');
    const [edge] = withLabelDeltas([centerEdge(COMPRESSED)], anchors, theme);
    const moved = { ...edge!, points: edge!.points.map((p) => ({ x: p.x + 7, y: p.y + 16 })) };
    const a = edgeLabelLayout(edge!, theme)!;
    const b = edgeLabelLayout(moved, theme)!;
    expect(b.x - a.x).toBe(7);
    expect(b.baselineY - a.baselineY).toBeCloseTo(16, 9);
  });
});
