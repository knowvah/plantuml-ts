import { describe, expect, it } from 'vitest';
import { layoutActivity, tileNodes } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import type { GtileIf } from '../../../../src/diagrams/activity/tiles/gtile-if.js';
import type { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
import { buildBlockUmls } from '../../../../src/core/BlockUmlBuilder.js';
import { parseActivity } from '../../../../src/diagrams/activity/parser.js';
import { astOrThrow } from '../../../helpers/parse-ast.js';

const measurer = new FormulaMeasurer();
// A REAL resolved theme, not a `{ fontSize, fontFamily } as unknown as
// Theme` stub. The tiles now resolve per-element style through
// `activityFontSize` (`activity-style-defaults.ts`), which reads
// `theme.colors.elements` -- a partial cast had no `colors` at all and
// threw. `fontSize` is kept at 13 so every assertion below that depends
// on the ROOT font is unchanged.
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

describe('layoutActivity — empty AST', () => {
  const ast: ActivityDiagramAST = { nodes: [], swimlanes: [] };
  const geo = layoutActivity(ast, theme, measurer);

  it('totalWidth === 0', () => {
    expect(geo.totalWidth).toBe(0);
  });

  it('totalHeight === 0', () => {
    expect(geo.totalHeight).toBe(0);
  });

  it('nodes is empty', () => {
    expect(geo.nodes).toHaveLength(0);
  });

  it('edges is empty', () => {
    expect(geo.edges).toHaveLength(0);
  });

  it('swimlanes is empty', () => {
    expect(geo.swimlanes).toHaveLength(0);
  });
});

describe('layoutActivity — single start node', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'start' }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('produces exactly 1 node', () => {
    expect(geo.nodes).toHaveLength(1);
  });

  it('node kind === start', () => {
    expect(geo.nodes[0]!.kind).toBe('start');
  });

  it('node has positive coordinates', () => {
    expect(geo.nodes[0]!.x).toBeGreaterThan(0);
    expect(geo.nodes[0]!.y).toBeGreaterThan(0);
  });

  it('totalWidth > 0', () => {
    expect(geo.totalWidth).toBeGreaterThan(0);
  });
});

describe('layoutActivity — start → action → stop', () => {
  const ast: ActivityDiagramAST = {
    nodes: [{ kind: 'start' }, { kind: 'action', label: 'Hello' }, { kind: 'stop' }],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('produces exactly 3 nodes', () => {
    expect(geo.nodes).toHaveLength(3);
  });

  it('produces exactly 2 edges', () => {
    expect(geo.edges).toHaveLength(2);
  });

  it('nodes have increasing y coordinates', () => {
    const ys = geo.nodes.map((n) => n.y);
    expect(ys[1]).toBeGreaterThan(ys[0]!);
    expect(ys[2]).toBeGreaterThan(ys[1]!);
  });

  it('node kinds are start, action, stop', () => {
    expect(geo.nodes[0]!.kind).toBe('start');
    expect(geo.nodes[1]!.kind).toBe('action');
    expect(geo.nodes[2]!.kind).toBe('stop');
  });
});

describe('layoutActivity — if with two branches', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'x > 0?',
        thenBranch: [{ kind: 'action', label: 'positive' }],
        elseBranch: [{ kind: 'action', label: 'negative' }],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('produces at least 3 nodes (diamond + 2 branch actions)', () => {
    expect(geo.nodes.length).toBeGreaterThanOrEqual(3);
  });

  it('produces at least 2 edges', () => {
    expect(geo.edges.length).toBeGreaterThanOrEqual(2);
  });
});

describe('layoutActivity — while loop produces back-edge', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'while',
        condition: 'has items?',
        body: [{ kind: 'action', label: 'process item' }],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('has at least one edge with >= 4 waypoints (back-edge)', () => {
    const backEdge = geo.edges.find((e) => e.points.length >= 4);
    expect(backEdge).toBeDefined();
  });
});

describe('layoutActivity — existing renderer tests still work', () => {
  it('fork produces fork-bar and join-bar nodes', () => {
    const ast: ActivityDiagramAST = {
      nodes: [
        {
          kind: 'fork',
          branches: [[{ kind: 'action', label: 'branch A' }], [{ kind: 'action', label: 'branch B' }]],
        },
      ],
      swimlanes: [],
    };
    const geo = layoutActivity(ast, theme, measurer);
    const kinds = geo.nodes.map((n) => n.kind);
    expect(kinds).toContain('fork-bar');
    expect(kinds).toContain('join-bar');
  });
});

// ---------------------------------------------------------------------------
// asr-T3: thread `ActivityNode.swimlane` onto the tiles built for it.
// `tileNodes` is exported test-only -- `layoutActivity`'s return value
// (`ActivityGeometry`) carries no tile objects, so this is the only seam
// that exposes the swimlane BEFORE T4/T5 consume it.
// ---------------------------------------------------------------------------

const bounder: StringBounder = {
  getDimension: (text: string, fontSizePt: number) =>
    measurer.measure(text, { family: theme.fontFamily, size: fontSizePt }),
};

function parseAst(markup: string): ActivityDiagramAST {
  const first = buildBlockUmls(markup)[0];
  if (first === undefined) throw new Error('no diagram block');
  if (!first.ok) throw first.failure.cause;
  return astOrThrow(parseActivity(first.source), 'activity');
}

describe('tileNodes — swimlane threading (asr-T3)', () => {
  it('assigns each leaf tile the swimlane its node was parsed in', () => {
    const ast = parseAst('@startuml\n|A|\n:a;\n|B|\n:b;\n@enduml');
    expect(ast.nodes.map((n) => n.kind)).toEqual(['action', 'action']);
    const tiles = tileNodes(ast.nodes, bounder, theme);
    expect(tiles).toHaveLength(2);
    expect(tiles[0]!.swimlane).toBe('A');
    expect(tiles[1]!.swimlane).toBe('B');
  });

  it('leaves every tile swimlane undefined when the diagram has no lanes', () => {
    const ast = parseAst('@startuml\nstart\n:a;\nstop\n@enduml');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    expect(tiles).toHaveLength(3);
    for (const t of tiles) {
      expect(t.swimlane).toBeUndefined();
    }
  });

  it('composite: the if tile carries its own node swimlane; the body tile carries its own', () => {
    // `|A|` returns to A only AFTER `:in-b;`, so the if node -- whose own
    // swimlane is read via `swimlaneSpread(ctx)` AFTER its branches are
    // fully parsed (`if-dispatch.ts` `tryIf`) -- lands on 'A', while the
    // body action, parsed while the lane was still 'B', lands on 'B'.
    const ast = parseAst('@startuml\n|A|\nif (x) then (y)\n|B|\n:in-b;\n|A|\nendif\n@enduml');
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0]!.kind).toBe('if');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    expect(tiles).toHaveLength(1);

    const ifTile = tiles[0] as unknown as GtileIf;
    expect(ifTile.kind).toBe('gtile-if');
    expect(ifTile.swimlane).toBe('A');

    // children = [diamond, thenBranch-wrapper]; the wrapper carries NO lane
    // of its own -- it is a layout container over possibly-mixed-lane
    // content, not a modeled AST node.
    const thenWrapper = ifTile.children[1] as unknown as GtileTopDown;
    expect(thenWrapper.kind).toBe('gtile-top-down');
    expect(thenWrapper.swimlane).toBeUndefined();

    const bodyTile = thenWrapper.children[0] as unknown as GtileAction;
    expect(bodyTile.kind).toBe('gtile-action');
    expect(bodyTile.label).toBe('in-b');
    expect(bodyTile.swimlane).toBe('B');
  });
});
