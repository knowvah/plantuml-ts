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

  it('nodes read hexagon c1 (+ north label 1), a, hexagon c2 (+ north 2, east 3), b, d, in drawU order', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'if-split',
      'if-label',
      'action',
      'if-split',
      'if-label',
      'if-label',
      'action',
      'action',
    ]);
    expect(geo.nodes[1]!.label).toBe('1');
    expect(geo.nodes[4]!.label).toBe('2');
    expect(geo.nodes[5]!.label).toBe('3');
    expect(geo.nodes[2]!.label).toBe('a');
    expect(geo.nodes[6]!.label).toBe('b');
    expect(geo.nodes[7]!.label).toBe('d');
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

  it('no VerticalOut, no Hline: only VerticalIn x2, Horizontal, In, LastElseIn, LastElseOut', () => {
    expect(geo.edges.length).toBe(6);
  });

  it('LastElseOut (the last edge) carries the third point (W/2, H) since nbOut === 0', () => {
    const lastElseOut = geo.edges[geo.edges.length - 1]!;
    expect(lastElseOut.points.length).toBe(3);
  });

  it('the empty else emits no node of its own (GtileTopDown with zero children)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['if-split', 'if-label', 'stop', 'if-split', 'if-label', 'stop']);
  });
});
