/**
 * cdd2-T12 — `DotPath#moveStartPoint`/`#moveEndPoint` on the flat
 * `EdgeGeo.points` list (`renderer-arrowhead-move.ts`), and the two
 * consumers whose jar output depends on it:
 *
 *  - Q-2: `SvekEdge.java:539-562 getExtremitySimplier` returns early when the
 *    end has no decor, and otherwise moves the start/end point AND its
 *    control point by `translateForKal.compose(decorTrim)` in one move.
 *  - CLIP-1b: `DotPath.java:206-216`'s first-bezier removal branch.
 *
 * Fixture expectations are read off each fixture's cached jar `in.svg`.
 */
import { readFileSync } from 'node:fs';
import { describe, it, expect } from 'vitest';
import { movePointsStart, movePointsEnd } from '../../../src/diagrams/class/renderer-arrowhead-move.js';
import { applyDecorTrim, buildEdgeArrowheads } from '../../../src/diagrams/class/renderer-arrowhead.js';
import type { EdgeGeo } from '../../../src/diagrams/class/layout.js';
import { defaultTheme } from '../../../src/core/theme.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import { renderFixtureClass } from '../../oracle/svg-conformance/render-fixture-class.js';

const measurer = new WidthTableMeasurer();

/** Every `<g class="link">`'s first `<path d>`, as number arrays. */
function linkPaths(slug: string): number[][] {
  const markup = readFileSync(`test-results/dot-cache/class/${slug}/in.puml`, 'utf8');
  const svg = renderFixtureClass(markup, measurer);
  const groups = svg.match(/<g class="link"[\s\S]*?<\/g>/g) ?? [];
  return groups.map((g) => {
    const d = /<path[^>]* d="([^"]+)"/.exec(g)?.[1] ?? '';
    return (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  });
}

// Two beziers: (0,0)-(0,3) then (0,3)-(0,10).
const TWO = [
  { x: 0, y: 0 },
  { x: 0, y: 1 },
  { x: 0, y: 2 },
  { x: 0, y: 3 },
  { x: 0, y: 4 },
  { x: 0, y: 5 },
  { x: 0, y: 10 },
];

describe('movePointsStart — DotPath.java:206-216', () => {
  it('moves the start point and the first control point together', () => {
    expect(movePointsStart(TWO, 0, 2).slice(0, 3)).toEqual([
      { x: 0, y: 2 },
      { x: 0, y: 3 },
      { x: 0, y: 2 },
    ]);
  });

  it('drops the first bezier when the move is at least its chord (XCubicCurve2D.java:52-56)', () => {
    // |(0,5)| = 5 >= chord 3: dy -= 3, bezier 0 removed, bezier 1 moved by (0,2).
    expect(movePointsStart(TWO, 0, 5)).toEqual([
      { x: 0, y: 5 },
      { x: 0, y: 6 },
      { x: 0, y: 5 },
      { x: 0, y: 10 },
    ]);
  });

  it('never drops the only bezier (beziers.size() > 1 guard)', () => {
    expect(movePointsStart(TWO.slice(0, 4), 0, 5)[0]).toEqual({ x: 0, y: 5 });
  });

  it('never mutates its input', () => {
    movePointsStart(TWO, 0, 5);
    expect(TWO[0]).toEqual({ x: 0, y: 0 });
  });
});

describe('movePointsEnd — DotPath.java:229-234 (no removal branch)', () => {
  it('moves the end point and the last control point even past the chord', () => {
    const out = movePointsEnd(TWO, 0, -20);
    expect(out.length).toBe(7);
    expect(out[5]).toEqual({ x: 0, y: -15 });
    expect(out[6]).toEqual({ x: 0, y: -10 });
  });
});

describe('applyDecorTrim — the drop branch is reached (CLIP-1b)', () => {
  it('drops the first bezier when the tail trim covers it', () => {
    expect(applyDecorTrim(TWO, { x: 0, y: 5 }, undefined)).toEqual(movePointsStart(TWO, 0, 5));
  });

  it('rezoba-58-xaze387 g[7]: jar starts at the second bezier, M165.198,135.068 C165.358,136.469', () => {
    const d = linkPaths('rezoba-58-xaze387')[0]!;
    expect(d[0]).toBeCloseTo(165.198, 2);
    expect(d[1]).toBeCloseTo(135.068, 2);
    expect(d[2]).toBeCloseTo(165.358, 2);
    expect(d[3]).toBeCloseTo(136.469, 2);
    expect(d[6]).toBeCloseTo(163.99, 2);
  });
});

describe('buildEdgeArrowheads — Kal translate composed into the trim (SvekEdge.java:548-561)', () => {
  const box = {
    x: 0,
    y: 0,
    width: 56.15,
    height: 16,
    text: 'Q',
    textX: 2,
    textY: 13,
    textWidth: 52.15,
    position: 'DOWN' as const,
  };
  const edge: EdgeGeo = {
    id: 'edge-0',
    points: [
      { x: 43, y: 54.82 },
      { x: 43, y: 77.51 },
      { x: 43, y: 112.14 },
      { x: 43, y: 134.93 },
    ],
    targetDecor: 'none',
    sourceDecor: 'open',
    dashed: false,
    from: 'A',
    to: 'B',
    kalBox: { start: box },
  };

  it('draws the extremity at the Kal-translated point and trims point + control point by kal+decor', () => {
    const heads = buildEdgeArrowheads(edge, defaultTheme.colors.arrow, defaultTheme.colors.background);
    // baneru-00-kuro607 jar: polygon tip 43,70.82 (= 54.82 + 16).
    expect(heads.tail).toContain('43,70.82');
    const trimmed = applyDecorTrim(edge.points, heads.tailTrim, heads.headTrim);
    // jar: `M43,75.82 C43,98.51` = raw (54.82, 77.51) + 16 (Kal) + 5 (decor).
    expect(trimmed[0]!.y).toBeCloseTo(75.82, 6);
    expect(trimmed[1]!.y).toBeCloseTo(98.51, 6);
  });

  it('does not move an end that has a Kal but no decor (SvekEdge.java:541-542)', () => {
    const heads = buildEdgeArrowheads(
      { ...edge, sourceDecor: 'none', targetDecor: 'open' },
      defaultTheme.colors.arrow,
      defaultTheme.colors.background,
    );
    expect(heads.tailTrim).toBeUndefined();
  });
});

describe('Q-2 at fixture level', () => {
  it('baneru-00-kuro607: control point moves with the start (jar M…,75.82 C…,98.51)', () => {
    const d = linkPaths('baneru-00-kuro607')[0]!;
    expect(d[1]).toBeCloseTo(75.82, 2);
    expect(d[3]).toBeCloseTo(98.51, 2);
  });

  it('tikovu-50-gale862: no decor, no move (jar M137.71,54.82)', () => {
    const d = linkPaths('tikovu-50-gale862')[0]!;
    expect(d[1]).toBeCloseTo(54.82, 2);
    expect(d[7]).toBeCloseTo(134.93, 2);
  });
});
