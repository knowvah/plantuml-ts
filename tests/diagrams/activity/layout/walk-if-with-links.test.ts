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

  it('nodes are if-split, if-own-label(c), if-label(yes), if-label(no), a, b, if-merge, in drawU order (T3k)', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual([
      'if-split',
      'if-own-label',
      'if-label',
      'if-label',
      'action',
      'action',
      'if-merge',
    ]);
    expect(geo.nodes[1]!.label).toBe('c');
    expect(geo.nodes[2]!.label).toBe('yes');
    expect(geo.nodes[3]!.label).toBe('no');
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

// add3-T3c (CONDSTYLE-EMPTY): `skinparam ConditionStyle diamond` now
// reaches the with-links builder too (`ConditionalBuilder#getShape1`'s
// `EMPTY_DIAMOND` arm, `:259-266`), via `createConditionDiamond`.
describe('layoutActivity — with-links: conditionStyle emptyDiamond (add3-T3c)', () => {
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
  const emptyTheme: Theme = { ...theme, conditionStyle: 'emptyDiamond' };
  const geo = layoutActivity(ast, emptyTheme, measurer);

  it("if-split carries diamondShape 'empty', not the pre-T3c undefined", () => {
    const diamond1 = geo.nodes.find((n) => n.kind === 'if-split')!;
    expect(diamond1.diamondShape).toBe('empty');
    expect(diamond1.label).toBe('');
  });

  it('the condition text draws as its own if-label(north), not if-own-label (the empty-diamond tile never has an own label)', () => {
    expect(geo.nodes.some((n) => n.kind === 'if-own-label')).toBe(false);
    const northLabel = geo.nodes.find((n) => n.kind === 'if-label' && n.label === 'c');
    expect(northLabel).toBeDefined();
  });

  it('branch labels still draw (yes/no), unaffected by the shape change', () => {
    expect(geo.nodes.some((n) => n.kind === 'if-label' && n.label === 'yes')).toBe(true);
    expect(geo.nodes.some((n) => n.kind === 'if-label' && n.label === 'no')).toBe(true);
  });
});

describe('layoutActivity — with-links: conditionStyle omitted keeps diamondShape "inside" (no regression, add3-T3c)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c',
        thenBranch: [{ kind: 'action', label: 'a' }],
        elseBranch: [{ kind: 'action', label: 'b' }],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it("if-split carries diamondShape 'inside'", () => {
    const diamond1 = geo.nodes.find((n) => n.kind === 'if-split')!;
    expect(diamond1.diamondShape).toBe('inside');
  });
});

describe('layoutActivity — with-links: own LEFT note (add3-T2a-2 IFNOTE)', () => {
  // Mirrors javedu-70-vaxo310 (`if (test?) then :a; else :c; endif` + a note
  // after `endif`) -- T2a's `ActivityIf.notes` capture (`InstructionIf.java:
  // 222-227`) feeds this builder's own IFNOTE mechanism (add3-T2a-2,
  // `FtileIfWithDiamonds.java:79-111,200-213`).
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'test?',
        thenBranch: [{ kind: 'action', label: 'a' }],
        elseBranch: [{ kind: 'action', label: 'c' }],
        elseIfBranches: [],
        notes: [{ kind: 'note', text: 'This note is on the if', position: 'left' }],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('draws a note node, FIRST in drawU order (FtileIfWithDiamonds.java:203-213)', () => {
    expect(geo.nodes[0]!.kind).toBe('note');
    expect(geo.nodes[0]!.label).toBe('This note is on the if');
    expect(geo.nodes[0]!.notePosition).toBe('left');
  });

  it('the note sits immediately LEFT of diamond1, flush (xOpale = diamond1X - noteWidth)', () => {
    const note = geo.nodes[0]!;
    const diamond1 = geo.nodes.find((n) => n.kind === 'if-split')!;
    expect(note.x + note.width).toBe(diamond1.x);
  });

  it("the note sits at this composite's own top (noteY), diamond1 drops below it by yDeltaNote", () => {
    const note = geo.nodes[0]!;
    const diamond1 = geo.nodes.find((n) => n.kind === 'if-split')!;
    expect(diamond1.y).toBe(note.y + note.height);
  });
});

describe('layoutActivity — with-links: conditionEndStyle hline, both branches continue (T1p-a)', () => {
  // Same shape as the first describe block above (saxeku-17-gume203's own
  // unlaned shape), but `hline`: no `if-merge` node, and the "both have a
  // point out" case takes `ConnectionVerticalOut` x2 + `ConnectionHline`
  // (`FtileIfWithLinks.java:546-550`) instead of `ConnectionVerticalThen
  // Horizontal` x2 into the merge rhombus.
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
  const hlineTheme: Theme = { ...theme, conditionEndStyle: 'hline' };
  const geo = layoutActivity(ast, hlineTheme, measurer);

  it('no if-merge node under hline', () => {
    expect(geo.nodes.some((n) => n.kind === 'if-merge')).toBe(false);
  });

  it('emits exactly 5 connectors: in1, in2, ConnectionVerticalOut x2, ConnectionHline', () => {
    expect(geo.edges.length).toBe(5);
  });

  it('ConnectionVerticalOut (edges 2,3) keep their default arrowhead; ConnectionHline (edge 4) has none', () => {
    expect(geo.edges[2]!.arrowhead).toBeUndefined();
    expect(geo.edges[3]!.arrowhead).toBeUndefined();
    expect(geo.edges[4]!.arrowhead).toBe(false);
  });

  it('ConnectionHline is a flat horizontal bar at the tile"s own bottom', () => {
    const hline = geo.edges[4]!;
    expect(hline.points).toHaveLength(2);
    expect(hline.points[0]!.y).toBe(hline.points[1]!.y);
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
  const tile = GtileIfWithLinks.create(diamond, branch1, branch2, 0);

  function makeOut(): Out {
    let n = 0;
    return {
      nodes: [],
      edges: [],
      edgeMeta: [],
      reservations: [],
      theme: resolveTheme('default'),
      nextId: (p: string) => `${p}${n++}`,
    };
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

describe('walkIfWithLinks — ConnectionHline carries a swimlane-aware routing template (T1p-g)', () => {
  const bounder: StringBounder = { getDimension: (t: string) => ({ width: t.length * 7, height: 14 }) };
  const diamond = new GtileDiamondInside('c', {}, bounder, theme);

  function stubTile(width: number, height: number, lane: string): Tile {
    return {
      kind: 'stub',
      width,
      height,
      swimlaneOut: lane,
      getCoord: (hook) =>
        hook === NORTH_HOOK
          ? { x: width / 2, y: 0 }
          : hook === SOUTH_HOOK
            ? { x: width / 2, y: height }
            : { x: 0, y: 0 },
      hasPointOut: () => true,
    };
  }

  const branch1: IfWithLinksBranch = { tile: stubTile(40, 30, '2'), isEmpty: false };
  const branch2: IfWithLinksBranch = { tile: stubTile(60, 30, '3'), isEmpty: false };
  const tile = GtileIfWithLinks.create(diamond, branch1, branch2, 0, { conditionEndStyle: 'hline' });

  function makeOut(): Out {
    let n = 0;
    return {
      nodes: [],
      edges: [],
      edgeMeta: [],
      reservations: [],
      theme: resolveTheme('default'),
      nextId: (p: string) => `${p}${n++}`,
    };
  }

  it("the Hline edge's own meta carries both branches' out-x tagged with their own outcome lane", () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, '2', out);
    const hlineMeta = out.edgeMeta[out.edgeMeta.length - 1]!;
    expect(hlineMeta.hline).toBeDefined();
    const candidates = hlineMeta.hline!.candidates;
    expect(candidates.map((c) => c.lane)).toEqual(['2', '3']);
    expect(candidates.every((c) => Number.isFinite(c.x))).toBe(true);
    expect(hlineMeta.hline!.unfiltered).toEqual([]);
  });

  it("`low`/`high` are the tile's own absolute left/right edge (x, x + width)", () => {
    const out = makeOut();
    walkIfWithLinks(tile, 5, 0, '2', out);
    const hlineMeta = out.edgeMeta[out.edgeMeta.length - 1]!;
    expect(hlineMeta.hline!.low).toBe(5);
    expect(hlineMeta.hline!.high).toBe(5 + tile.width);
  });

  it('the pushed edge itself stays the UNLANED getMinmaxSimple extent (unchanged by the template)', () => {
    const out = makeOut();
    walkIfWithLinks(tile, 0, 0, '2', out);
    const hline = out.edges[out.edges.length - 1]!;
    expect(hline.points).toHaveLength(2);
    expect(hline.arrowhead).toBe(false);
  });
});
