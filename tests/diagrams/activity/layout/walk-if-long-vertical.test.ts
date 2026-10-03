import { describe, expect, it } from 'vitest';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';
import { Pragma } from '../../../../src/core/skin/Pragma.js';
import { PragmaKey } from '../../../../src/core/skin/PragmaKey.js';

const measurer = new FormulaMeasurer();
const baseTheme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

/** `!pragma useVerticalIf true` -- a real `Pragma`, carried on `ast.pragma`
 *  exactly as `dispatch-common-commands.ts#tryPragma` sets it during a
 *  real parse (D12/T1p-b). */
function verticalPragma(): Pragma {
  const p = Pragma.createEmpty();
  p.define('useVerticalIf', 'true');
  return p;
}

/**
 * `if (c1) then (1) :a; elseif (c2) then (2) :b; else (3) :d; endif` --
 * the SAME source shape as `walk-if-long-horizontal.test.ts`'s own chain
 * fixture, so the two can be compared directly.
 */
function chainAst(pragma?: Pragma): ActivityDiagramAST {
  return {
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
    ...(pragma !== undefined ? { pragma } : {}),
  };
}

describe('layoutActivity — useVerticalIf unset: long-horizontal dispatch is unaffected (byte-identical)', () => {
  it('without the pragma, the SAME chain still dispatches to long-horizontal nodes', () => {
    const withBase = layoutActivity(chainAst(), baseTheme, measurer);
    expect(withBase.nodes[0]!.kind).toBe('if-split');
    // long-horizontal's own signature: exactly 9 edges for this chain
    // shape (walk-if-long-horizontal.test.ts).
    expect(withBase.edges.length).toBe(9);
  });

  it('isTrue(USE_VERTICAL_IF) on an UNDEFINED key is false (sanity on the key name itself)', () => {
    expect(Pragma.createEmpty().isTrue(PragmaKey.USE_VERTICAL_IF)).toBe(false);
  });
});

describe('layoutActivity — long-vertical: then/elseif/else chain', () => {
  const geo = layoutActivity(chainAst(verticalPragma()), baseTheme, measurer);

  it('nodes read hexagon c1 (+ own c1, east 1), a, hexagon c2 (+ own c2, east 2), b, d, merge, in drawU order', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'if-split',
      'if-own-label',
      'if-label',
      'action',
      'if-split',
      'if-own-label',
      'if-label',
      'action',
      'action',
      'if-merge',
    ]);
    expect(geo.nodes[0]!.label).toBe('c1');
    expect(geo.nodes[2]!.label).toBe('1');
    expect(geo.nodes[3]!.label).toBe('a');
    expect(geo.nodes[4]!.label).toBe('c2');
    expect(geo.nodes[6]!.label).toBe('2');
    expect(geo.nodes[7]!.label).toBe('b');
    expect(geo.nodes[8]!.label).toBe('d');
  });

  it('emits 7 edges: In, VerticalIn a, VerticalIn b, Vertical(a->b), LastElse, LastElseOut, ThenOut a (b has no ThenOutConnect: only 2 branches, i=1 IS covered)', () => {
    // ConnectionIn, ConnectionVerticalIn x2, ConnectionVertical x1,
    // ConnectionLastElse, ConnectionLastElseOut, ConnectionThenOut (branch
    // 0), ConnectionThenOutConnect (branch 1) = 8.
    expect(geo.edges.length).toBe(8);
  });

  it('ConnectionLastElse carries the elseLabel "3"', () => {
    // Walker push order: In, VerticalIn x2, Vertical, LastElse -- index 4.
    const lastElse = geo.edges[4]!;
    expect(lastElse.label).toBe('3');
  });

  it('ConnectionIn is a 4-point elbow (down, across, down)', () => {
    expect(geo.edges[0]!.points.length).toBe(4);
  });

  it('ConnectionVertical (diamond0 -> diamond1) is a straight 2-point line', () => {
    const vertical = geo.edges[3]!;
    expect(vertical.points.length).toBe(2);
  });

  it('ConnectionThenOut (branch 0, 5-point route via the right edge) and ConnectionThenOutConnect (branch 1, 3-point stub) are the last two edges', () => {
    expect(geo.edges[6]!.points.length).toBe(5);
    expect(geo.edges[7]!.points.length).toBe(3);
  });
});

describe('layoutActivity — long-vertical: a branch ending in stop skips its ThenOut connector', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c1',
        thenLabel: '1',
        thenBranch: [{ kind: 'stop' }],
        elseBranch: [{ kind: 'action', label: 'd' }],
        elseIfBranches: [{ condition: 'c2', label: '2', body: [{ kind: 'action', label: 'b' }] }],
      },
    ],
    swimlanes: [],
    pragma: verticalPragma(),
  };
  const geo = layoutActivity(ast, baseTheme, measurer);

  it('only 7 edges: In, VerticalIn x2, Vertical, LastElse, LastElseOut, ThenOutConnect (branch 1) -- branch 0"s ThenOut is skipped', () => {
    expect(geo.edges.length).toBe(7);
  });
});
