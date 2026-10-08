import { describe, expect, it } from 'vitest';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

/**
 * `if (c1) then (1) :a; elseif (c2) then (2) :b; else (3) :d; endif` --
 * the T5 spec's own first acceptance fixture.
 * @see plans/activity-if-tile-port/batch-4/T5-if-long-horizontal.md
 */
const chainAst: ActivityDiagramAST = {
  nodes: [
    {
      kind: 'if',
      condition: 'c1',
      thenLabel: '1',
      thenBranch: [{ kind: 'action', label: 'a' }],
      elseBranch: [{ kind: 'action', label: 'd' }],
      elseLabel: '3',
      elseIfBranches: [{ condition: 'c2', label: '2', body: [{ kind: 'action', label: 'b' }] }],
    },
  ],
  swimlanes: [],
};

describe('layoutActivity — long-horizontal: then/elseif/else chain', () => {
  const geo = layoutActivity(chainAst, theme, measurer);

  it('nodes read hexagon c1 (+ north 1, own c1), a, hexagon c2 (+ north 2, own c2, east 3), b, d, in drawU order (T3k)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'if-split',
      'if-label',
      'if-own-label',
      'action',
      'if-split',
      'if-label',
      'if-own-label',
      'if-label',
      'action',
      'action',
    ]);
    expect(geo.nodes[1]!.label).toBe('1');
    expect(geo.nodes[2]!.label).toBe('c1');
    expect(geo.nodes[5]!.label).toBe('2');
    expect(geo.nodes[6]!.label).toBe('c2');
    expect(geo.nodes[7]!.label).toBe('3');
    expect(geo.nodes[3]!.label).toBe('a');
    expect(geo.nodes[8]!.label).toBe('b');
    expect(geo.nodes[9]!.label).toBe('d');
  });

  it('emits 9 edges: VerticalIn a, VerticalOut a, VerticalIn b, VerticalOut b, Horizontal, In, LastElseIn, LastElseOut, Hline', () => {
    expect(geo.edges.length).toBe(9);
  });

  it('the Hline (last edge) has no arrowhead and is a plain 2-point line', () => {
    const hline = geo.edges[geo.edges.length - 1]!;
    expect(hline.arrowhead).toBe(false);
    expect(hline.points.length).toBe(2);
    expect(hline.points[0]!.y).toBe(hline.points[1]!.y);
  });

  it('ConnectionIn is a 3-point elbow (down, across, down)', () => {
    expect(geo.edges[5]!.points.length).toBe(3);
  });
});

describe('layoutActivity — long-horizontal: real swimlanes split the Hline per-lane (T1p-g)', () => {
  // Same then/elseif/else chain as `chainAst`, but `a`/`b` stay in lane
  // "A" (unchanged) while `d` switches to lane "B" -- `pezubu-98-niba240`'s
  // own shape, mirrored for `FtileIfLongHorizontal`.
  const lanedAst: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c1',
        thenLabel: '1',
        thenBranch: [{ kind: 'action', label: 'a', swimlane: 'A' }],
        elseBranch: [{ kind: 'action', label: 'd', swimlane: 'B' }],
        elseLabel: '3',
        elseIfBranches: [{ condition: 'c2', label: '2', body: [{ kind: 'action', label: 'b', swimlane: 'A' }] }],
        swimlane: 'A',
      },
    ],
    swimlanes: ['A', 'B'],
  };
  const geo = layoutActivity(lanedAst, theme, measurer);

  // `edge-draw-order.ts` re-groups the final edge run by lane pass, so the
  // two Hline-derived edges are no longer the trailing two entries --
  // identify them by their own shape instead: a flat (y1 === y2), 2-point,
  // arrowless line (`ConnectionHline`'s own signature; no other connector
  // in this chain is both flat and arrowless).
  function isHlineEdge(e: (typeof geo.edges)[number]): boolean {
    return e.points.length === 2 && e.arrowhead === false && e.points[0]!.y === e.points[1]!.y;
  }

  // 10 with the Hline fanned out per lane, minus `ConnectionLastElseIn`:
  // `d` sits in lane B, the diamonds in A, and that connection is not
  // `ConnectionTranslatable` (`FtileIfLongHorizontal.java:323`), so no
  // swimlane pass draws it (`UGraphicInterceptorOneSwimlane.java:93-104`,
  // `ConnectionCross.java:49-64`).
  it('the Hline fans out to one edge per in-range lane; no cross-lane else-in -- 9 edges', () => {
    expect(geo.edges.length).toBe(9);
  });

  it('exactly two Hline-derived edges exist, both at the SAME y', () => {
    const hlines = geo.edges.filter(isHlineEdge);
    expect(hlines).toHaveLength(2);
    expect(hlines[0]!.points[0]!.y).toBe(hlines[1]!.points[0]!.y);
  });

  it('the two Hline segments cover DIFFERENT x-ranges (one per lane)', () => {
    const [hlineA, hlineB] = geo.edges.filter(isHlineEdge);
    const rangeA = [hlineA!.points[0]!.x, hlineA!.points[1]!.x].sort((p, q) => p - q);
    const rangeB = [hlineB!.points[0]!.x, hlineB!.points[1]!.x].sort((p, q) => p - q);
    expect(rangeA).not.toEqual(rangeB);
  });
});

describe('layoutActivity — long-horizontal: every branch ends in stop', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c1',
        thenLabel: '1',
        thenBranch: [{ kind: 'stop' }],
        elseBranch: [],
        elseIfBranches: [{ condition: 'c2', label: '2', body: [{ kind: 'stop' }] }],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  // T1b: `ConnectionLastElseIn`'s own exit point is exactly
  // `ConnectionLastElseOut`'s own entry (both default FULL,
  // `Snake.create`'s static overloads never call `.withMerge`) -- they
  // fuse (`Snake#merge`, `Snake.java:303-327`): no VerticalOut, no
  // Hline, VerticalIn x2, Horizontal, In, merged LastElseIn+LastElseOut.
  it('no VerticalOut, no Hline: only VerticalIn x2, Horizontal, In, merged LastElseIn+LastElseOut', () => {
    expect(geo.edges.length).toBe(5);
  });

  it('the merged LastElseIn+LastElseOut (last edge) carries 4 points (nbOut === 0)', () => {
    const lastElseOut = geo.edges[geo.edges.length - 1]!;
    expect(lastElseOut.points.length).toBe(4);
  });

  it('the empty else emits no node of its own (GtileTopDown with zero children) (T3k)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'if-split',
      'if-label',
      'if-own-label',
      'stop',
      'if-split',
      'if-label',
      'if-own-label',
      'stop',
    ]);
  });
});
