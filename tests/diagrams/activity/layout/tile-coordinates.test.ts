import { describe, expect, it } from 'vitest';
import { assignCoordinates, LAYOUT_MARGIN } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { GtileDiamond } from '../../../../src/diagrams/activity/tiles/gtile-diamond.js';
import { GtileWhile } from '../../../../src/diagrams/activity/tiles/gtile-while.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { DeterministicMeasurer } from '../../../../src/core/measurer-deterministic.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

const bounder: StringBounder = {
  getDimension: (_text: string, _size: number) => ({ width: 60, height: 16 }),
};

// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

const emptyAst: ActivityDiagramAST = { nodes: [], swimlanes: [] };

const actionNode = { kind: 'action' as const, label: 'Hello', swimlane: 'default' };
const NODE_MARGIN_Y = 20;

describe('assignCoordinates — single GtileAction', () => {
  const tile = new GtileAction(actionNode, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces exactly 1 node geo', () => {
    expect(geo.nodes).toHaveLength(1);
  });

  it('produces no edge geos', () => {
    expect(geo.edges).toHaveLength(0);
  });

  it('node geo kind === action', () => {
    expect(geo.nodes[0]!.kind).toBe('action');
  });

  it('node geo x === LAYOUT_MARGIN', () => {
    expect(geo.nodes[0]!.x).toBe(LAYOUT_MARGIN);
  });

  it('node geo y === LAYOUT_MARGIN', () => {
    expect(geo.nodes[0]!.y).toBe(LAYOUT_MARGIN);
  });

  it('totalWidth >= tile.width + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalWidth).toBeGreaterThanOrEqual(tile.width + 2 * LAYOUT_MARGIN);
  });

  it('totalHeight >= tile.height + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalHeight).toBeGreaterThanOrEqual(tile.height + 2 * LAYOUT_MARGIN);
  });

  it('no swimlanes for empty ast', () => {
    expect(geo.swimlanes).toHaveLength(0);
  });
});

describe('assignCoordinates — GtileTopDown with 2 GtileAction children', () => {
  const action0 = new GtileAction(actionNode, bounder, theme);
  const action1 = new GtileAction({ kind: 'action' as const, label: 'World', swimlane: 'default' }, bounder, theme);
  const tile = new GtileTopDown([action0, action1], bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces exactly 2 node geos', () => {
    expect(geo.nodes).toHaveLength(2);
  });

  it('produces exactly 1 edge geo', () => {
    expect(geo.edges).toHaveLength(1);
  });

  it('node[0].y === LAYOUT_MARGIN (first child at top)', () => {
    expect(geo.nodes[0]!.y).toBe(LAYOUT_MARGIN);
  });

  it('node[1].y === LAYOUT_MARGIN + action0.height + NODE_MARGIN_Y', () => {
    expect(geo.nodes[1]!.y).toBe(LAYOUT_MARGIN + action0.height + NODE_MARGIN_Y);
  });

  it('totalWidth >= tile.width + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalWidth).toBeGreaterThanOrEqual(tile.width + 2 * LAYOUT_MARGIN);
  });

  it('totalHeight >= tile.height + 2 * LAYOUT_MARGIN', () => {
    expect(geo.totalHeight).toBeGreaterThanOrEqual(tile.height + 2 * LAYOUT_MARGIN);
  });
});

describe('assignCoordinates — GtileWhile produces back-edge', () => {
  const header = new GtileDiamond('loop?', bounder, theme);
  const body = new GtileAction(actionNode, bounder, theme);
  const tile = new GtileWhile(header, body, undefined, undefined, bounder, theme);
  const geo = assignCoordinates(tile, emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('produces at least 2 nodes (diamond + action)', () => {
    expect(geo.nodes.length).toBeGreaterThanOrEqual(2);
  });

  it('produces exactly 2 edges (forward + back)', () => {
    expect(geo.edges).toHaveLength(2);
  });

  it('back-edge has >= 4 waypoints', () => {
    // forward edge has 2 points; back-edge has 4
    const backEdge = geo.edges.find((e) => e.points.length >= 4);
    expect(backEdge).toBeDefined();
    expect(backEdge!.points.length).toBeGreaterThanOrEqual(4);
  });
});

describe('assignCoordinates — swimlane geometry', () => {
  const tile = new GtileAction(actionNode, bounder, theme);
  const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['Lane A', 'Lane B'] };
  const geo = assignCoordinates(tile, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

  it('emits 2 swimlane geos', () => {
    expect(geo.swimlanes).toHaveLength(2);
  });

  it('first swimlane name is Lane A', () => {
    expect(geo.swimlanes[0]!.name).toBe('Lane A');
  });

  it('second swimlane name is Lane B', () => {
    expect(geo.swimlanes[1]!.name).toBe('Lane B');
  });
});

describe('assignCoordinates — nodes are placed inside their own lane', () => {
  function place(labelA: string, labelB: string) {
    const a = new GtileAction({ kind: 'action' as const, label: labelA }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: labelB }, bounder, theme);
    b.swimlane = 'BBBBBBBBBBBBBBBBBBBBBBBBB';
    const root = new GtileTopDown([a, b], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'BBBBBBBBBBBBBBBBBBBBBBBBB'] };
    return assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
  }

  it("node 'a' sits inside lane A's bounds", () => {
    const geo = place('a', 'b');
    const laneA = geo.swimlanes[0]!;
    const nodeA = geo.nodes.find((n) => n.label === 'a')!;
    expect(nodeA.x).toBeGreaterThanOrEqual(laneA.x);
    expect(nodeA.x + nodeA.width).toBeLessThanOrEqual(laneA.x + laneA.width);
  });

  it("node 'b' sits STRICTLY inside lane B's bounds, not on its boundary", () => {
    const geo = place('a', 'b');
    const laneB = geo.swimlanes[1]!;
    const nodeB = geo.nodes.find((n) => n.label === 'b')!;
    expect(nodeB.x).toBeGreaterThan(laneB.x);
    expect(nodeB.x + nodeB.width).toBeLessThan(laneB.x + laneB.width);
  });

  it('lane B starts exactly where lane A ends (adjacent, no gap or overlap)', () => {
    const geo = place('a', 'b');
    expect(geo.swimlanes[1]!.x).toBe(geo.swimlanes[0]!.x + geo.swimlanes[0]!.width);
  });
});

describe('assignCoordinates — cross-lane vs same-lane edge shape', () => {
  it('an edge between two nodes in DIFFERENT lanes gets a 4-point horizontal jog', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
    b.swimlane = 'B';
    const root = new GtileTopDown([a, b], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    const points = geo.edges[0]!.points;
    expect(points.length).toBeGreaterThanOrEqual(3);
    expect(points).toHaveLength(4);
    expect(points[1]!.y).toBe(points[2]!.y);
  });

  it('an edge between two nodes in the SAME lane keeps its pass-1 shape (shifted only)', () => {
    const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
    a.swimlane = 'A';
    const a2 = new GtileAction({ kind: 'action' as const, label: 'a2' }, bounder, theme);
    a2.swimlane = 'A';
    const root = new GtileTopDown([a, a2], bounder, theme);
    const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
    const geo = assignCoordinates(root, ast, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);

    expect(geo.edges).toHaveLength(1);
    expect(geo.edges[0]!.points).toHaveLength(2);
  });
});

describe('assignCoordinates — no swimlanes leaves geometry byte-identical', () => {
  it('the same tile tree produces the same node positions with and without lanes declared', () => {
    const build = () => {
      const a = new GtileAction({ kind: 'action' as const, label: 'a' }, bounder, theme);
      const b = new GtileAction({ kind: 'action' as const, label: 'b' }, bounder, theme);
      return new GtileTopDown([a, b], bounder, theme);
    };
    const withoutLanes = assignCoordinates(
      build(),
      { nodes: [], swimlanes: [] },
      LAYOUT_MARGIN,
      LAYOUT_MARGIN,
      bounder,
      theme,
    );
    const withEmptyAst = assignCoordinates(build(), emptyAst, LAYOUT_MARGIN, LAYOUT_MARGIN, bounder, theme);
    expect(withoutLanes.nodes).toEqual(withEmptyAst.nodes);
    expect(withoutLanes.edges).toEqual(withEmptyAst.edges);
    expect(withoutLanes.swimlanes).toEqual([]);
  });
});

describe('layoutActivity — pakema-21-xema183-shaped diagram through the real pipeline', () => {
  function layout(markup: string) {
    const first = buildBlockUmls(markup)[0];
    if (first === undefined) throw new Error('no diagram block');
    if (!first.ok) throw first.failure.cause;
    const ast = astOrThrow(parseActivity(first.source), 'activity');
    return layoutActivity(ast, resolveTheme('default'), new DeterministicMeasurer());
  }

  it("'b' lands strictly inside lane B, not on its boundary", () => {
    const geo = layout('@startuml\n|A|\nstart\n:a;\n|BBBBBBBBBBBBBBBBBBBBBBBBB|\n:b;\n@enduml');
    const laneB = geo.swimlanes[1]!;
    const nodeB = geo.nodes.find((n) => n.label === 'b')!;
    expect(nodeB.x).toBeGreaterThan(laneB.x);
    expect(nodeB.x + nodeB.width).toBeLessThan(laneB.x + laneB.width);
  });
});
