/**
 * cdd2-T12 (Q-7) — `SvekNode#fixOverlap`/`fixHoverlap`
 * (`svek/SvekNode.java:445-463`), `LineOfSegments`
 * (`svek/LineOfSegments.java`), `Kal#getX1/getX2/overlapx/moveX`
 * (`svek/Kal.java:151-157,188-216`).
 *
 * Expected values are the jar's, read off `rilali-81-gifu188`'s cached
 * `in.svg`: three DOWN boxes on `top`, width 63.938, drawn at x = 76.594,
 * 150.531, 224.469 (pitch 73.938 = width + 10, `getX2 - getX1`), and the
 * three links start at the box centre, `M108.562,54.81` / `M182.5,54.81` /
 * `M256.438,54.81` (no decor, so no Kal translate on the path).
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import {
  LineOfSegments,
  computeKal,
  kalOverlapX,
  kalX1,
  kalX2,
  type PlacedKal,
} from '../../../src/diagrams/class/class-kal-overlap.js';
import type { Kal } from '../../../src/diagrams/class/class-kal.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();
const W = 63.938;

function box(x: number) {
  return {
    x,
    y: 0,
    width: W,
    height: 16,
    text: 'Q',
    textX: x + 2,
    textY: 13,
    textWidth: W - 4,
    position: 'DOWN' as const,
  };
}

describe('LineOfSegments — svek/LineOfSegments.java', () => {
  it('leaves a single segment alone (solveOverlapsInternal: size < 2)', () => {
    const los = new LineOfSegments();
    los.addSegment(3, 9);
    expect(los.solveOverlaps()).toEqual([3]);
  });

  it('leaves disjoint segments alone', () => {
    const los = new LineOfSegments();
    los.addSegment(0, 10);
    los.addSegment(20, 30);
    expect(los.solveOverlaps()).toEqual([0, 20]);
  });

  it('spreads three overlapping segments to abutting, preserving the mean (rilali pitch)', () => {
    // Pre-move X1s at the jar's un-spread pitch (the three anchors sit 20.937
    // apart around the middle link's 150.531 box).
    const x1s = [150.531 - 20.937 - 5, 150.531 - 5, 150.531 + 20.938 - 5];
    const los = new LineOfSegments();
    for (const x of x1s) los.addSegment(x, x + W + 10);
    const res = los.solveOverlaps();
    expect(res[0]! + 5).toBeCloseTo(76.594, 2);
    expect(res[1]! + 5).toBeCloseTo(150.531, 2);
    expect(res[2]! + 5).toBeCloseTo(224.469, 2);
  });

  it('reports the index order it was given, not the sorted order', () => {
    const los = new LineOfSegments();
    los.addSegment(10, 20);
    los.addSegment(0, 10.5);
    const res = los.solveOverlaps();
    expect(res[1]!).toBeLessThan(res[0]!);
  });
});

describe('Kal#getX1/getX2/overlapx — Kal.java:151-157,188-201', () => {
  it('pads the drawn box by 5 on each side', () => {
    expect(kalX1(box(100))).toBe(95);
    expect(kalX2(box(100))).toBeCloseTo(100 + W + 5, 9);
  });

  it('returns the four overlap arms and 0 when disjoint', () => {
    const a = box(100);
    expect(kalOverlapX(a, box(120))).toBeCloseTo(kalX2(a) - kalX1(box(120)), 9);
    expect(kalOverlapX(a, box(80))).toBeCloseTo(kalX1(a) - kalX2(box(80)), 9);
    expect(kalOverlapX(a, box(500))).toBe(0);
  });

  it('throws on two different positions (IllegalArgumentException)', () => {
    expect(() => kalOverlapX(box(0), { ...box(0), position: 'UP' })).toThrow();
  });
});

describe('SvekNode#fixOverlap at fixture level — rilali-81-gifu188', () => {
  const geo = layoutFixtureClass(
    readFileSync('test-results/dot-cache/class/rilali-81-gifu188/in.puml', 'utf8'),
    measurer,
  ).geo;
  const starts = geo.edges.map((e) => e.kalBox!.start!).sort((a, b) => a.x - b.x);

  it('spreads the three DOWN boxes to the jar pitch of width + 10', () => {
    expect(starts[1]!.x - starts[0]!.x).toBeCloseTo(73.938, 2);
    expect(starts[2]!.x - starts[1]!.x).toBeCloseTo(73.938, 2);
  });

  it('moves each link start with its box (Kal.java:213-214, entity1 only)', () => {
    for (const e of geo.edges) {
      const b = e.kalBox!.start!;
      expect(e.points[0]!.x).toBeCloseTo(b.x + W / 2, 2);
    }
  });

  it('leaves the UP boxes on class2..class4 alone (one per entity, nothing to spread)', () => {
    for (const e of geo.edges) {
      const b = e.kalBox!.end!;
      expect(e.points[e.points.length - 1]!.x).toBeCloseTo(b.x + W / 2, 2);
    }
  });
});

/**
 * cdd4-T10 — `SvekResult#computeKal` (`svek/SvekResult.java:104-109`) runs
 * on BOTH `drawU` passes. `Kal#moveX` moves `dotPathInit`'s start too
 * (`svek/SvekEdge.java:1346-1349`) and `SvekEdge#computeKal` re-seeds every
 * box from it (`:1069-1077`), so pass 1 resumes from pass 0's result.
 *
 * Inputs are ririlu-13-zipi740's three DOWN boxes on `MoreComplex`
 * (`diagnosis/ririlu-13-zipi740.md`): starts 500.12 / 512 / 523.88 in the
 * layout frame, svek frame = +8, final frame = +7. Pass 0 stalls on
 * 2.84e-14 pushes; pass 1 lands the jar's boxX 440.54 / 501.965 / 541.602.
 */
describe('computeKal — two draw passes (cdd4-T10, ririlu-13-zipi740)', () => {
  const widths = [51.425, 29.6375, 64.725];
  const starts = [500.12, 512, 523.88];

  function placed(): PlacedKal[] {
    return widths.map((width, i) => {
      const pts = [
        { x: starts[i]!, y: 100 },
        { x: starts[i]!, y: 200 },
      ];
      const kal: Kal = {
        entityId: 'MoreComplex',
        relIndex: i,
        end: 1,
        text: 'q',
        width,
        height: 16,
        textWidth: width - 4,
        textDx: 0,
        baselineOffset: 11,
        position: 'DOWN',
      };
      return { kal, edge: { id: `e${i}`, points: pts } as EdgeGeo, onEntity1: true, init: { points: pts } };
    });
  }
  const finalBoxX = (ps: PlacedKal[]) => ps.map((p) => p.edge.kalBox!.start!.x + 7);

  it('pass 0 alone (svek frame) stalls: boxes 1 and 2 still overlap', () => {
    const ps = placed();
    computeKal(ps, { x: 8, y: 0 });
    const [b0, b1, b2] = finalBoxX(ps);
    expect(b0).toBeCloseTo(466.307, 3);
    expect(b1).toBeCloseTo(489.081, 3);
    expect(b2).toBeCloseTo(528.718, 3);
  });

  it('pass 1 (final frame) re-solves from the pass-0 dotPathInit to the jar boxX', () => {
    const ps = placed();
    computeKal(ps, { x: 8, y: 0 });
    computeKal(ps, { x: 7, y: 0 });
    const [b0, b1, b2] = finalBoxX(ps);
    expect(b0).toBeCloseTo(440.54, 3);
    expect(b1).toBeCloseTo(501.965, 3);
    expect(b2).toBeCloseTo(541.602, 3);
    // The edge start rides every move (Kal.java:213-214): box centre.
    for (const p of ps) expect(p.edge.points[0]!.x).toBeCloseTo(p.edge.kalBox!.start!.x + p.kal.width / 2, 9);
  });

  it('keeps the box in the layout frame whatever frame it solved in', () => {
    const ps = placed().slice(0, 1);
    computeKal(ps, { x: 8, y: 3 });
    const b = ps[0]!.edge.kalBox!.start!;
    expect(b.x).toBeCloseTo(500.12 - widths[0]! / 2, 9);
    expect(b.y).toBeCloseTo(100, 9);
  });
});

describe('computeKal at fixture level — ririlu-13-zipi740 (cdd4-T10)', () => {
  const geo = layoutFixtureClass(
    readFileSync('test-results/dot-cache/class/ririlu-13-zipi740/in.puml', 'utf8'),
    measurer,
  ).geo;
  const down = geo.edges
    .map((e) => e.kalBox?.start)
    .filter((b) => b !== undefined && b.position === 'DOWN' && b.text.includes(':'))
    .map((b) => b!.x)
    .sort((a, b) => a - b);

  // isw-T2-cls: jar x re-read from test-results/dot-cache/class/ririlu-13-zipi740/
  // in.svg (oracle seam #4 v2): <rect x="434.765"/"500.04"/"543.527" y="54.81">.
  it("lands MoreComplex's three DOWN boxes on the jar's x", () => {
    expect(down).toHaveLength(3);
    expect(down[0]!).toBeCloseTo(434.765, 2);
    expect(down[1]!).toBeCloseTo(500.04, 2);
    expect(down[2]!).toBeCloseTo(543.527, 2);
  });
});
