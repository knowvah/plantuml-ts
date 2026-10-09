/**
 * cdd4-T10 — `SvekResult#drawU`'s two passes over the shared
 * `LinkConstraint` (`svek/SvekEdge.java:994-1012`,
 * `cucadiagram/LinkConstraint.java:70-104`).
 *
 * Pass 0 (svek frame, `dx = dy = 0`): link2 (the earlier link) sets its
 * point and `drawMe` returns on `x1 == 0 && y1 == 0`; link1 sets its point
 * and draws — pass-0 ink only. Pass 1 (`dx, dy = D`): the square is offset
 * by `D` against the un-shifted samples; link2 draws from link1's STALE
 * pass-0 point, which lands at `pass-0 point - D` in the layout frame.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { svekPass0, runSvekPass1, type ConstraintLink } from '../../../src/diagrams/class/class-svek-pass0.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { layoutFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new DeterministicMeasurer();
const LABEL = { measurer, font: { family: 'SansSerif', size: 13 } };
const M = { x: 10, y: 20 };
const D = { x: 4, y: 0 };
const S = { dx: M.x + D.x, dy: M.y + D.y };

/** A straight vertical cubic at `x`, y 0..100. */
function vertical(id: string, x: number): EdgeGeo {
  return {
    id,
    points: [
      { x, y: 0 },
      { x, y: 33 },
      { x, y: 66 },
      { x, y: 100 },
    ],
    sourceDecor: 'none',
    targetDecor: 'none',
    dashed: false,
    from: `${id}1`,
    to: `${id}2`,
  };
}

/**
 * Square at `(x0, 200)`, below the line's end: the `y` corner is always the
 * top row, and the `x` corner is the one nearest the line -- `x0 + 5` at
 * offset 0, `x0` once `D.x = 4` moves the square.
 */
function pair(): { a: ConstraintLink; b: ConstraintLink } {
  const constraint = { text: 'c' };
  return {
    a: { edgeGeo: vertical('a', 0), constraint, spot: { x: -6, y: 200 }, isLink1: false },
    b: { edgeGeo: vertical('b', 200), constraint, spot: { x: 194, y: 200 }, isLink1: true },
  };
}

describe('svekPass0 — LinkConstraint#drawMe early return (pass 0)', () => {
  it("inks only link1's line, from link1's point to link2's", () => {
    const { a, b } = pair();
    const state = svekPass0(M, [], [a, b], LABEL);
    expect(state.constraintInk.slice(0, 2)).toEqual([
      { x: 199, y: 200 },
      { x: -1, y: 200 },
    ]);
    expect(a.edgeGeo.constraint).toBeUndefined();
    expect(b.edgeGeo.constraint).toBeUndefined();
  });

  it('adds the centred label box around the midpoint', () => {
    const { a, b } = pair();
    const ink = svekPass0(M, [], [a, b], LABEL).constraintInk;
    expect(ink).toHaveLength(4);
    const w = measurer.measure('c', LABEL.font).width;
    expect(ink[2]!.x).toBeCloseTo(99 - w / 2, 9);
    expect(ink[3]!.x).toBeCloseTo(99 + w / 2, 9);
  });

  it('never draws a constraint whose partner never set its point', () => {
    const { b } = pair();
    const state = svekPass0(M, [], [b], LABEL);
    runSvekPass1(state, S);
    expect(state.constraintInk).toEqual([]);
    expect(b.edgeGeo.constraint).toBeUndefined();
  });
});

describe('runSvekPass1 — the stale link1 point and the D-biased pick', () => {
  it("stamps link2 from link1's pass-0 point - D to its own pass-1 point", () => {
    const { a, b } = pair();
    runSvekPass1(svekPass0(M, [], [a, b], LABEL), S);
    expect(a.edgeGeo.constraint).toEqual({ line: { x1: 199 - D.x, y1: 200, x2: -6, y2: 200 }, text: 'c' });
  });

  it("stamps link1 from its fresh pass-1 point to link2's pass-1 point", () => {
    const { a, b } = pair();
    runSvekPass1(svekPass0(M, [], [a, b], LABEL), S);
    expect(b.edgeGeo.constraint).toEqual({ line: { x1: 194, y1: 200, x2: -6, y2: 200 }, text: 'c' });
  });
});

/**
 * The jar's four dashed lines, read off `gujigi-63-roki030`'s golden
 * (`diagnosis/gujigi-63-roki030.md`, causal-chain table): `lnk10`/`lnk12`
 * are link2 (stale start), `lnk11`/`lnk13` link1.
 */
describe('constraint replay at fixture level — gujigi-63-roki030', () => {
  const geo = layoutFixtureClass(
    readFileSync('test-results/dot-cache/class/gujigi-63-roki030/in.puml', 'utf8'),
    measurer,
  ).geo;
  const lines = geo.edges.filter((e) => e.constraint !== undefined).map((e) => e.constraint!.line);
  const jar = [
    { x1: 96.57, y1: 265.5, x2: 130, y2: 331 },
    { x1: 103.57, y1: 264.5, x2: 130, y2: 331 },
    { x1: 266.12, y1: 91, x2: 226.62, y2: 208 },
    { x1: 273.12, y1: 95, x2: 226.62, y2: 208 },
  ];

  it('stamps all four links', () => {
    expect(lines).toHaveLength(4);
  });

  jar.forEach((want, i) => {
    it(`line ${i} is the jar's`, () => {
      const got = lines[i]!;
      expect(got.x1).toBeCloseTo(want.x1, 2);
      expect(got.y1).toBeCloseTo(want.y1, 2);
      expect(got.x2).toBeCloseTo(want.x2, 2);
      expect(got.y2).toBeCloseTo(want.y2, 2);
    });
  });
});
