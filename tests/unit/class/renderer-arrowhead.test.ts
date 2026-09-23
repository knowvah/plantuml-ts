/**
 * Direct unit tests for `renderer-arrowhead.ts` -- `buildEdgeArrowheads`'s
 * guard branches and `applyDecorTrim` (G2 N28's own `SvekEdge#drawU`
 * `dotPath.moveStartPoint`/`.moveEndPoint` render-side counterpart), tested
 * in isolation from the full `renderClass` pipeline (`renderer.test.ts`
 * covers the composed behavior). Per `~/.claude/rules/testability.md`:
 * both are pure functions, preferred over exercising them only indirectly.
 */
import { describe, it, expect } from 'vitest';
import {
  buildEdgeArrowheads,
  applyDecorTrim,
  decorName,
  buildMiddleDecorMarkup,
} from '../../../src/diagrams/class/renderer-arrowhead.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';

function makeEdgeGeo(overrides?: Partial<EdgeGeo>): EdgeGeo {
  return {
    id: 'edge-0',
    points: [
      { x: 70, y: 70 },
      { x: 70, y: 140 },
    ],
    targetDecor: 'none',
    sourceDecor: 'none',
    dashed: false,
    from: 'A',
    to: 'B',
    ...overrides,
  };
}

describe('decorName', () => {
  it('maps every non-none LinkDecor to a LinkDecorName', () => {
    expect(decorName('triangle')).toBe('EXTENDS');
    expect(decorName('square')).toBe('SQUARE');
    expect(decorName('plus')).toBe('PLUS');
    expect(decorName('parenthesis')).toBe('PARENTHESIS');
    expect(decorName('crowfoot')).toBe('CROWFOOT');
    expect(decorName('circleCrowfoot')).toBe('CIRCLE_CROWFOOT');
    expect(decorName('circleLine')).toBe('CIRCLE_LINE');
    expect(decorName('doubleLine')).toBe('DOUBLE_LINE');
    expect(decorName('lineCrowfoot')).toBe('LINE_CROWFOOT');
  });

  it('maps none to undefined', () => {
    expect(decorName('none')).toBeUndefined();
  });
});

describe('buildEdgeArrowheads — guard branches', () => {
  it('returns empty arrowheads when neither end carries a decor', () => {
    const result = buildEdgeArrowheads(makeEdgeGeo(), defaultTheme.colors.arrow, defaultTheme.colors.background);
    expect(result).toEqual({ tail: '', head: '', extraDefs: '' });
  });

  // A decor-bearing edge with fewer than 2 points cannot anchor a direction
  // -- structurally unreachable via a real dot-layout edge (every laid-out
  // edge has >= 2 points), but a defensive guard the class engine's own
  // layout invariants do not otherwise rule out for a hand-built EdgeGeo.
  it('returns empty arrowheads when a decorated edge has fewer than 2 points', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ sourceDecor: 'square', points: [{ x: 70, y: 70 }] }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result).toEqual({ tail: '', head: '', extraDefs: '' });
  });

  it('returns tailTrim only when just the source end is decorated', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ sourceDecor: 'square' }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result.tailTrim).toBeDefined();
    expect(result.headTrim).toBeUndefined();
    expect(result.tail).not.toBe('');
    expect(result.head).toBe('');
  });

  it('returns headTrim only when just the target end is decorated', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ targetDecor: 'plus' }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result.headTrim).toBeDefined();
    expect(result.tailTrim).toBeUndefined();
  });
});

// G2 N31: the extremity polygon/path never read `edge.strokeWidth` --
// `drawExtremityMarkup` hardcoded `strokeForStyle('solid').onlyThickness()`
// (thickness 1) regardless of a `-[thickness=N]->`/`bold` override that
// SvekEdge.ts's own `drawExtremity(lined, tailExtremity, stroke.
// onlyThickness())` already applies to description's identical shapes
// (jar-verified: bisome-32-bevo992 `c1 -[thickness=5]-> c4`'s triangle
// polygon stroke-width should be 5, this port drew 1).
describe('buildEdgeArrowheads — edge.strokeWidth inherited by the extremity stroke (G2 N31)', () => {
  // `triangle`/`plus` (ExtremityTriangle/ExtremityPlus) draw with the
  // AMBIENT stroke this module applies via `ug.apply(thicknessOnlyStroke)`
  // -- unlike `square`/`circle`/`parenthesis`, whose upstream `drawU`
  // overrides with a fixed jar-verified `UStroke.withThickness(1.5)`
  // regardless of edge thickness (`ExtremitySquare.ts` etc, unaffected by
  // this fix, correctly so).
  it('uses the default thickness-1 stroke when edge.strokeWidth is absent', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ sourceDecor: 'triangle' }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result.tail).toContain('stroke-width:1;');
  });

  it('uses edge.strokeWidth for the extremity stroke-width when set (bracket thickness=N)', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ sourceDecor: 'triangle', strokeWidth: 5 }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result.tail).toContain('stroke-width:5;');
  });

  it('applies edge.strokeWidth to both ends independently', () => {
    const result = buildEdgeArrowheads(
      makeEdgeGeo({ sourceDecor: 'triangle', targetDecor: 'plus', strokeWidth: 2 }),
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(result.tail).toContain('stroke-width:2;');
    expect(result.head).toContain('stroke-width:2;');
  });
});

describe('applyDecorTrim', () => {
  const points = [
    { x: 70, y: 70 },
    { x: 70, y: 90 },
    { x: 70, y: 120 },
    { x: 70, y: 140 },
  ];

  it('returns the input unchanged when neither trim is present', () => {
    const result = applyDecorTrim(points, undefined, undefined);
    expect(result).toEqual(points);
  });

  it('returns the input unchanged for a sub-2-point list even with a trim', () => {
    const single = [{ x: 5, y: 5 }];
    const result = applyDecorTrim(single, { x: 1, y: 1 }, undefined);
    expect(result).toEqual(single);
  });

  it('shifts the first two points by tailTrim on a 4-point (1+3n) spline', () => {
    const result = applyDecorTrim(points, { x: 0, y: 5 }, undefined);
    expect(result[0]).toEqual({ x: 70, y: 75 });
    expect(result[1]).toEqual({ x: 70, y: 95 });
    // Untouched: the far control point and the final endpoint.
    expect(result[2]).toEqual({ x: 70, y: 120 });
    expect(result[3]).toEqual({ x: 70, y: 140 });
  });

  it('shifts the last two points by headTrim on a 4-point (1+3n) spline', () => {
    const result = applyDecorTrim(points, undefined, { x: 0, y: -5 });
    expect(result[3]).toEqual({ x: 70, y: 135 });
    expect(result[2]).toEqual({ x: 70, y: 115 });
    // Untouched: the start point and its adjacent control point.
    expect(result[0]).toEqual({ x: 70, y: 70 });
    expect(result[1]).toEqual({ x: 70, y: 90 });
  });

  it('applies both trims simultaneously without mutating the input array', () => {
    const result = applyDecorTrim(points, { x: 0, y: 5 }, { x: 0, y: -5 });
    expect(result[0]).toEqual({ x: 70, y: 75 });
    expect(result[3]).toEqual({ x: 70, y: 135 });
    expect(points[0]).toEqual({ x: 70, y: 70 }); // original untouched
  });

  it('shifts only the single start/end point on a plain 2-point secant', () => {
    const secant = [
      { x: 70, y: 70 },
      { x: 70, y: 140 },
    ];
    const result = applyDecorTrim(secant, { x: 0, y: 5 }, { x: 0, y: -5 });
    expect(result).toEqual([
      { x: 70, y: 75 },
      { x: 70, y: 135 },
    ]);
  });
});

// cdd-T7 (A5/M4, A2a/M6): mid-link decoration.
describe('buildMiddleDecorMarkup', () => {
  // `foo1 -0)- foo2` (cenubi-27-xova754) -- points are the real dot-layout
  // spline (`layoutFixtureClass` on the fixture's own `in.puml`), golden
  // `<path d="M29.539,92.104 A10,10 0 0 0 43.681 92.104" stroke-width:1.5
  // fill=none/>` + `<ellipse cx="36.61" cy="85.033" rx="6" ry="6" fill="#FFF"
  // stroke-width:1.5/>`.
  const cenubiPoints = [
    { x: 36.60625, y: 55.262155107495204 },
    { x: 36.60625, y: 72.93564206156157 },
    { x: 36.60625, y: 97.13201753483915 },
    { x: 36.60625, y: 114.7921337783734 },
  ];

  it('returns undefined when middleDecor is absent', () => {
    expect(buildMiddleDecorMarkup(cenubiPoints, undefined, '#181818', '#FFFFFF')).toBeUndefined();
  });

  it('returns undefined for a point list too short/malformed to build a DotPath from', () => {
    expect(buildMiddleDecorMarkup([{ x: 0, y: 0 }], 'circleCircled1', '#181818', '#FFFFFF')).toBeUndefined();
    expect(
      buildMiddleDecorMarkup(
        [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
        ],
        'circleCircled1',
        '#181818',
        '#FFFFFF',
      ),
    ).toBeUndefined();
  });

  it('draws the MODE1 arc + filled ellipse at the path midpoint, jar-verified', () => {
    // Golden (jar): `M29.539,92.104 A10,10 0 0 0 43.681 92.104` +
    // `<ellipse cx="36.61" cy="85.033" rx="6" ry="6">`. This port's own
    // spline (verified byte-identical to the jar's `d` at 2dp) yields a
    // `getMiddle()` point/angle within ~0.005px of the golden's -- ordinary
    // floating-point residue from deriving a 3rd-decimal value off a
    // 2-decimal-verified input, not a mechanism defect (`toBeCloseTo(.., 1)`
    // below matches `compareSvg`'s own numeric tolerance class).
    const result = buildMiddleDecorMarkup(cenubiPoints, 'circleCircled1', '#181818', '#FFFFFF');
    expect(result).toBeDefined();
    const d = /M([\d.]+),([\d.]+) A10,10 0 0 0 ([\d.]+) ([\d.]+)/.exec(result!.body);
    expect(d).not.toBeNull();
    const [, x1, y1, x2, y2] = d!.map(Number) as unknown as [never, number, number, number, number];
    expect(x1).toBeCloseTo(29.539, 1);
    expect(y1).toBeCloseTo(92.104, 1);
    expect(x2).toBeCloseTo(43.681, 1);
    expect(y2).toBeCloseTo(92.104, 1);
    expect(result!.body).toContain('stroke-width:1.5');
    expect(result!.body).toContain('fill="none"');
    const ellipse = /cx="([\d.]+)" cy="([\d.]+)" rx="([\d.]+)"/.exec(result!.body);
    expect(ellipse).not.toBeNull();
    expect(Number(ellipse![1])).toBeCloseTo(36.61, 1);
    expect(Number(ellipse![2])).toBeCloseTo(85.033, 1);
    expect(ellipse![3]).toBe('6');
    expect(result!.body).toContain('fill="#FFF"');
  });

  it('draws only the filled circle for plain `circle`, no arc', () => {
    const result = buildMiddleDecorMarkup(cenubiPoints, 'circle', '#181818', '#FFFFFF');
    expect(result!.body).not.toContain('<path');
    expect(result!.body).toContain('<ellipse');
    expect(result!.body).toContain('rx="6"');
  });

  it('draws both arcs for circleCircled (MODE BOTH)', () => {
    const result = buildMiddleDecorMarkup(cenubiPoints, 'circleCircled', '#181818', '#FFFFFF');
    const arcCount = (result!.body.match(/<path/g) ?? []).length;
    expect(arcCount).toBe(2);
  });

  it('draws the mirrored arc for circleCircled2', () => {
    const result = buildMiddleDecorMarkup(cenubiPoints, 'circleCircled2', '#181818', '#FFFFFF');
    const arcCount = (result!.body.match(/<path/g) ?? []).length;
    expect(arcCount).toBe(1);
    expect(result!.body).not.toContain('A10,10 0 0 0 43.681,92.104');
  });
});
