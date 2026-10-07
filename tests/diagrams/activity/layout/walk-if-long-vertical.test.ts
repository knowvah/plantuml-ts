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

  it('nodes read a, b, hexagon c1 (+ own c1, east 1), hexagon c2 (+ own c2, east 2), d, merge, in drawU order (FtileIfLongVertical.java:492-502)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'action',
      'action',
      'if-split',
      'if-own-label',
      'if-label',
      'if-split',
      'if-own-label',
      'if-label',
      'action',
      'if-merge',
    ]);
    expect(geo.nodes[0]!.label).toBe('a');
    expect(geo.nodes[1]!.label).toBe('b');
    expect(geo.nodes[2]!.label).toBe('c1');
    expect(geo.nodes[4]!.label).toBe('1');
    expect(geo.nodes[5]!.label).toBe('c2');
    expect(geo.nodes[7]!.label).toBe('2');
    expect(geo.nodes[8]!.label).toBe('d');
  });

  it('emits 8 edges: VerticalIn x2, Vertical, ThenOut, ThenOutConnect, In, LastElse, LastElseOut', () => {
    expect(geo.edges.length).toBe(8);
  });

  // `create`'s `conns` order (FtileIfLongVertical.java:173-201):
  // 0-1 VerticalIn, 2 Vertical, 3 ThenOut, 4 ThenOutConnect, 5 In,
  // 6 LastElse, 7 LastElseOut.
  it('ConnectionLastElse carries the elseLabel "3"', () => {
    expect(geo.edges[6]!.label).toBe('3');
  });

  it('ConnectionLastElse draws its label CENTER-aligned (FtileIfLongVertical.java:319-320)', () => {
    expect(geo.edges[6]!.labelAlign).toEqual({ vertical: 'CENTER' });
  });

  it('ConnectionIn is a 4-point elbow (down, across, down)', () => {
    expect(geo.edges[5]!.points.length).toBe(4);
  });

  it('ConnectionVertical (diamond0 -> diamond1) is a straight 2-point line', () => {
    expect(geo.edges[2]!.points.length).toBe(2);
  });

  it('ConnectionThenOut (branch 0, 5-point route via the right edge) then ConnectionThenOutConnect (branch 1, 3-point stub)', () => {
    expect(geo.edges[3]!.points.length).toBe(5);
    expect(geo.edges[4]!.points.length).toBe(3);
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

describe('layoutActivity — long-vertical: an elseif inlabel labels ConnectionVertical', () => {
  const ast = chainAst(verticalPragma());
  const ifNode = ast.nodes[0] as Extract<ActivityDiagramAST['nodes'][number], { kind: 'if' }>;
  const withInlabel: ActivityDiagramAST = {
    ...ast,
    nodes: [{ ...ifNode, elseIfBranches: [{ ...ifNode.elseIfBranches[0]!, incomingLabel: 'No' }] }],
  };
  const geo = layoutActivity(withInlabel, baseTheme, measurer);
  const plain = layoutActivity(ast, baseTheme, measurer);

  it('ConnectionVertical carries the inlabel, CENTER-aligned (FtileIfLongVertical.java:183-190,281-282)', () => {
    expect(geo.edges[2]!.label).toBe('No');
    expect(geo.edges[2]!.labelAlign).toEqual({ vertical: 'CENTER' });
    expect(plain.edges[2]!.label).toBeUndefined();
  });

  it('the inlabel widens EVERY branch west margin by the same amount (FtileMargedWest, :141,157,165)', () => {
    const gap = (g: typeof geo, body: string): number =>
      g.nodes.find((n) => n.label === body)!.x - g.nodes.find((n) => n.label === 'c1')!.x;
    const grewA = gap(geo, 'a') - gap(plain, 'a');
    const grewB = gap(geo, 'b') - gap(plain, 'b');
    expect(grewA).toBeGreaterThan(0);
    expect(grewB).toBeCloseTo(grewA, 9);
  });
});
