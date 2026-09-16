import { describe, expect, it } from 'vitest';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { walkIfWithLinks } from '../../../../src/diagrams/activity/layout/walk-if-with-links.js';
import type { Out } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { GtileIfWithLinks } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
import type { IfWithLinksBranch } from '../../../../src/diagrams/activity/tiles/gtile-if-with-links.js';
import { GtileDiamondInside } from '../../../../src/diagrams/activity/tiles/gtile-diamond-inside.js';
import { NORTH_HOOK, SOUTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('layoutActivity — with-links: both branches non-empty, both continue', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c',
        thenLabel: 'yes',
        elseLabel: 'no',
        thenBranch: [{ kind: 'action', label: 'a' }],
        elseBranch: [{ kind: 'action', label: 'b' }],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('nodes are if-split, if-label(yes), if-label(no), a, b, if-merge, in drawU order', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['if-split', 'if-label', 'if-label', 'action', 'action', 'if-merge']);
    expect(geo.nodes[1]!.label).toBe('yes');
    expect(geo.nodes[2]!.label).toBe('no');
  });

  it('the merge rhombus is a 24x24 box', () => {
    const merge = geo.nodes.find((n) => n.kind === 'if-merge')!;
    expect(merge.width).toBe(24);
    expect(merge.height).toBe(24);
  });

  it('emits exactly 4 connectors (in1, in2, out1, out2), none decorated', () => {
    expect(geo.edges.length).toBe(4);
    for (const edge of geo.edges) {
      expect(edge.arrowhead).toBeUndefined();
      expect(edge.emphasize).toBeUndefined();
    }
  });
});

describe('layoutActivity — with-links: then ends in stop (no merge, Direct out connector)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c',
        thenBranch: [{ kind: 'action', label: 'a' }, { kind: 'stop' }],
        elseBranch: [{ kind: 'action', label: 'b' }],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('no if-merge node (hasTwoBranches is false)', () => {
    expect(geo.nodes.some((n) => n.kind === 'if-merge')).toBe(false);
  });

  it("emits 4 edges: the then-branch's own internal action->stop edge, then in1, in2, out2(Direct)", () => {
    // `then`'s own GtileTopDown([action, stop]) pushes its internal edge
    // WHILE `walkTile(tile1, ...)` runs, before the if's own connectors --
    // D7's draw order is nodes-then-conns for THIS composite, not a
    // guarantee that a nested composite's own internal edges are absent.
    expect(geo.edges.length).toBe(4);
  });

  it('the Direct connector (last edge) has no arrowhead', () => {
    const direct = geo.edges[geo.edges.length - 1]!;
    expect(direct.arrowhead).toBe(false);
  });

  it("the Direct connector ends at the if tile's own left, i.e. the hexagon's centre x (FtileIfWithLinks.java:309)", () => {
    // `p2 = new XPoint2D(dimTotal.getLeft(), dimTotal.getHeight())` --
    // `dimTotal.getLeft()` is `diamond1`'s centre (`getTranslateDiamond1`:
    // `x1 = dimTotal.getLeft() - dimDiamond1.getLeft()`,
    // `FtileIfWithDiamonds.java:234-240`), NOT the tile's origin x. Found
    // at T7 on `gevaxi-80-tone223`, whose Direct ended at the canvas margin.
    const hexagon = geo.nodes.find((n) => n.kind === 'if-split')!;
    const direct = geo.edges[geo.edges.length - 1]!;
    const last = direct.points[direct.points.length - 1]!;
    expect(last.x).toBeCloseTo(hexagon.x + hexagon.width / 2, 6);
  });
});

describe('walkIfWithLinks — an isEmpty() branch suppresses its in-arrow and emphasizes its out-arrow (D6)', () => {
  const bounder: StringBounder = { getDimension: (t: string) => ({ width: t.length * 7, height: 14 }) };
  const diamond = new GtileDiamondInside('c', {}, bounder, theme);

  function stubTile(width: number, height: number): Tile {
    return {
      kind: 'stub',
      width,
      height,
      getCoord: (hook) =>
        hook === NORTH_HOOK
          ? { x: width / 2, y: 0 }
          : hook === SOUTH_HOOK
            ? { x: width / 2, y: height }
            : { x: 0, y: 0 },
      hasPointOut: () => true,
    };
  }

  const branch1: IfWithLinksBranch = { tile: stubTile(0, 0), isEmpty: true };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 40), isEmpty: false };
  const tile = new GtileIfWithLinks(diamond, branch1, branch2, 0);

  function makeOut(): Out {
    let n = 0;
    return { nodes: [], edges: [], edgeMeta: [], reservations: [], nextId: (p: string) => `${p}${n++}` };
  }

  it('in1 (to the empty branch) has no arrowhead', () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, undefined, out);
    const in1 = out.edges[0]!;
    expect(in1.arrowhead).toBe(false);
  });

  it('in2 (to the non-empty branch) has an arrowhead', () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, undefined, out);
    const in2 = out.edges[1]!;
    expect(in2.arrowhead).toBeUndefined();
  });

  it('out1 (from the empty branch) is emphasized down', () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, undefined, out);
    const out1 = out.edges[2]!;
    expect(out1.emphasize).toBe('down');
  });

  it('out2 (from the non-empty branch) is not emphasized', () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, undefined, out);
    const out2 = out.edges[3]!;
    expect(out2.emphasize).toBeUndefined();
  });
});
