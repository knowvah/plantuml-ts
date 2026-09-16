import { describe, expect, it } from 'vitest';
import { layoutActivity, tileNodes } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { GtileAction } from '../../../../src/diagrams/activity/tiles/gtile-action.js';
import type { GtileDiamond } from '../../../../src/diagrams/activity/tiles/gtile-diamond.js';
import type { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import type { GtileIfDown } from '../../../../src/diagrams/activity/tiles/gtile-if-down.js';
import type { GtileRepeat } from '../../../../src/diagrams/activity/tiles/gtile-repeat.js';
import type { GtileSplit } from '../../../../src/diagrams/activity/tiles/gtile-split.js';
import { GtileTopDown } from '../../../../src/diagrams/activity/tiles/gtile-top-down.js';
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

  // apc-T3 (D4): split draws a thin LINE, not a rect bar, and its own
  // node kinds (`split-bar`/`split-join-bar`), distinct from fork's.
  it('split with every branch continuing produces split-bar and split-join-bar nodes', () => {
    const ast: ActivityDiagramAST = {
      nodes: [
        {
          kind: 'split',
          branches: [[{ kind: 'action', label: 'branch A' }], [{ kind: 'action', label: 'branch B' }]],
        },
      ],
      swimlanes: [],
    };
    const geo = layoutActivity(ast, theme, measurer);
    const kinds = geo.nodes.map((n) => n.kind);
    expect(kinds).toContain('split-bar');
    expect(kinds).toContain('split-join-bar');
    expect(kinds).not.toContain('fork-bar');
    expect(kinds).not.toContain('join-bar');
  });

  it('split with every branch detached (stop) produces split-bar but NO split-join-bar', () => {
    const ast: ActivityDiagramAST = {
      nodes: [
        {
          kind: 'split',
          branches: [
            [{ kind: 'action', label: 'branch A' }, { kind: 'stop' }],
            [{ kind: 'action', label: 'branch B' }, { kind: 'stop' }],
          ],
        },
      ],
      swimlanes: [],
    };
    const geo = layoutActivity(ast, theme, measurer);
    const kinds = geo.nodes.map((n) => n.kind);
    expect(kinds).toContain('split-bar');
    expect(kinds).not.toContain('split-join-bar');
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
    // Mission `activity-if-tile-port` T4: an empty else routes to `down`
    // (`GtileIfDown`, D1), not the legacy single-diamond tile -- children
    // are `[mainTile, diamond1]` (D1's `drawU` order), not `[diamond,
    // branch]`.
    const ast = parseAst('@startuml\n|A|\nif (x) then (y)\n|B|\n:in-b;\n|A|\nendif\n@enduml');
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0]!.kind).toBe('if');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    expect(tiles).toHaveLength(1);

    const ifTile = tiles[0] as unknown as GtileIfDown;
    expect(ifTile.kind).toBe('gtile-if-down');
    expect(ifTile.swimlane).toBe('A');

    // The main-flow branch wrapper carries NO lane of its own -- it is a
    // layout container over possibly-mixed-lane content, not a modeled AST
    // node.
    const thenWrapper = ifTile.mainTile as unknown as GtileTopDown;
    expect(thenWrapper.kind).toBe('gtile-top-down');
    expect(thenWrapper.swimlane).toBeUndefined();

    const bodyTile = thenWrapper.children[0] as unknown as GtileAction;
    expect(bodyTile.kind).toBe('gtile-action');
    expect(bodyTile.label).toBe('in-b');
    expect(bodyTile.swimlane).toBe('B');
  });

  // Mission `activity-lane-capture` T5: the repeat tile carries its opener
  // AND out lane; the condition diamond's own lane is the OUT lane
  // (`FtileRepeat.java:149,152` -- INSIDE_HEXAGON, the only condition style
  // this port models: `ConditionStyle.java:43,56` defaults to
  // INSIDE_HEXAGON when no style is configured).
  it('repeat: the tile carries swimlane and swimlaneOut; the condition diamond carries swimlaneOut', () => {
    const ast = parseAst('@startuml\n|A|\nrepeat\n|B|\n:b;\nrepeat while (x)\n@enduml');
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0]!.kind).toBe('repeat');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    expect(tiles).toHaveLength(1);

    const repeatTile = tiles[0] as unknown as GtileRepeat;
    expect(repeatTile.kind).toBe('gtile-repeat');
    expect(repeatTile.swimlane).toBe('A');
    expect(repeatTile.swimlaneOut).toBe('B');

    const condition = repeatTile.children[1] as unknown as GtileDiamond;
    expect(condition.kind).toBe('gtile-diamond');
    expect(condition.swimlane).toBe('B');

    const bodyWrapper = repeatTile.children[0] as unknown as GtileTopDown;
    expect(bodyWrapper.kind).toBe('gtile-top-down');
    expect(bodyWrapper.swimlane).toBeUndefined();
    const bodyAction = bodyWrapper.children[0] as unknown as GtileAction;
    expect(bodyAction.swimlane).toBe('B');
  });

  it('repeat: the condition diamond falls back to swimlane when the loop closes in the same lane', () => {
    const ast = parseAst('@startuml\n|A|\nrepeat\n:b;\nrepeat while (x)\n@enduml');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    const repeatTile = tiles[0] as unknown as GtileRepeat;
    expect(repeatTile.swimlane).toBe('A');
    expect(repeatTile.swimlaneOut).toBe('A');
    const condition = repeatTile.children[1] as unknown as GtileDiamond;
    expect(condition.swimlane).toBe('A');
  });

  // Mission `activity-lane-capture` T6: the fork tile carries its opener
  // AND out lane; the top (fork) bar draws in the opener lane, the join
  // bar in the out lane -- `ParallelBuilderFork.java:85` (`in`) and `:77,
  // 110` (`out`), not the last branch's own lane.
  it('fork: the tile carries swimlane and swimlaneOut', () => {
    const ast = parseAst('@startuml\n|A|\nfork\n:a;\nfork again\n|B|\n:b;\nend fork\n@enduml');
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0]!.kind).toBe('fork');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    const forkTile = tiles[0] as unknown as GtileFork;
    expect(forkTile.kind).toBe('gtile-fork');
    expect(forkTile.swimlane).toBe('A');
    expect(forkTile.swimlaneOut).toBe('B');
  });

  it('fork-bar sits in the opener lane, join-bar in the out lane', () => {
    const ast = parseAst('@startuml\n|swim1|\nfork\n:a;\nfork again\n|swim3|\n:b;\nend fork\n@enduml');
    const geo = layoutActivity(ast, theme, measurer);
    const forkBar = geo.nodes.find((n) => n.kind === 'fork-bar');
    const joinBar = geo.nodes.find((n) => n.kind === 'join-bar');
    expect(forkBar?.swimlane).toBe('swim1');
    expect(joinBar?.swimlane).toBe('swim3');
  });

  // Mission `activity-lane-capture` T7: the split tile carries its opener
  // AND out lane too, mirroring T6's fork. The split-bar/split-join-bar
  // node lanes are UNCHANGED from before T7 (T1's Q2 confirmed both
  // already matched upstream: the top line reads the FIRST branch's own
  // entry lane, the join line the LAST branch's own exit lane -- neither
  // is the split's own opener/out field).
  it('split: the tile carries swimlane and swimlaneOut', () => {
    const ast = parseAst('@startuml\n|A|\nsplit\n:a;\nsplit again\n|B|\n:b;\nend split\n@enduml');
    expect(ast.nodes).toHaveLength(1);
    expect(ast.nodes[0]!.kind).toBe('split');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    const splitTile = tiles[0] as unknown as GtileSplit;
    expect(splitTile.kind).toBe('gtile-split');
    expect(splitTile.swimlane).toBe('A');
    expect(splitTile.swimlaneOut).toBe('B');
  });

  it('split-bar sits in the first branch’s own entry lane, split-join-bar in the last branch’s own exit lane', () => {
    const ast = parseAst('@startuml\n|A|\nsplit\n|X|\n:a;\nsplit again\n|Y|\n:b;\nend split\n@enduml');
    const geo = layoutActivity(ast, theme, measurer);
    const splitBar = geo.nodes.find((n) => n.kind === 'split-bar');
    const splitJoinBar = geo.nodes.find((n) => n.kind === 'split-join-bar');
    expect(splitBar?.swimlane).toBe('X');
    expect(splitJoinBar?.swimlane).toBe('Y');
  });

  // T1's Q1 mechanism (the `jevoce` rise): before this task, `trySplit`
  // captured `swimlane` at the CLOSER, so the in-drop's bar-side lane
  // (`ctx.myLane`) was the split's LAST lane, not its opener -- wrong for
  // every branch whose own entry lane the opener should feed. Red before
  // this fix (`git stash` on the four `src/` files: bar lane read 'Y', the
  // closer, not 'A').
  it("each branch's in-drop bar-side lane is the split's OPENER, not its closer", () => {
    const ast = parseAst('@startuml\n|A|\nsplit\n|X|\n:a;\nsplit again\n|Y|\n:b;\nend split\n@enduml');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    const root = new GtileTopDown(tiles, bounder, theme);
    const result = assignCoordinatesFull({ root, ast, baseX: 0, baseY: 0, bounder, theme });
    const inDrops = result.edgeMeta.filter((m) => m.shape === 'parallel-in');
    expect(inDrops).toHaveLength(2);
    expect(inDrops.map((m) => m.lane1)).toEqual(['A', 'A']);
  });

  // Every branch's out-drop lands in the split's own OUT lane
  // (`swimlaneOut`, captured at `end split`), matching the join line's own
  // lane -- the acceptance criterion T1's Q1 names. This value already
  // agreed with the pre-T7 `myLane`-based landing lane for a NON-NESTED
  // fixture like this one (both derive from "the lane at `end split`");
  // Q1's actual disagreement needs a branch whose own exit lane the split's
  // single pre-D1 field could never separately track (an `if`/`else` lane
  // swap inside a branch, `jevoce-05-mumi686`'s shape) -- verified by the
  // probe (`measurements/t7.json`), not reproduced here.
  it("every branch's out-drop lands in the split's own out lane", () => {
    const ast = parseAst('@startuml\n|A|\nsplit\n|X|\n:a;\nsplit again\n|Y|\n:b;\nend split\n@enduml');
    const tiles = tileNodes(ast.nodes, bounder, theme);
    const root = new GtileTopDown(tiles, bounder, theme);
    const result = assignCoordinatesFull({ root, ast, baseX: 0, baseY: 0, bounder, theme });
    const outDrops = result.edgeMeta.filter((m) => m.shape === 'parallel-out');
    expect(outDrops).toHaveLength(2);
    expect(outDrops.map((m) => m.lane2)).toEqual(['Y', 'Y']);
    // The sources are each branch's own exit lane, unaffected by this fix.
    //
    // Mission `activity-edge-draw-order` T2 (2026-09-15), rule (b): the edge
    // run is now emitted in swimlane pass order (`edge-draw-order.ts`,
    // `Swimlanes.java:328-352`), so these two out-drops arrive REORDERED --
    // same two values, position only. Lanes are declared `A, X, Y`, so
    // branch Y's out-drop (`Y -> Y`, drawn in lane Y's own pass,
    // `UGraphicInterceptorOneSwimlane.java:96-101`) precedes branch X's
    // (`X -> Y`, whose ends differ and which therefore falls to the final
    // `Cross` pass, `Swimlanes.java:178-216` at `:350-352`). Was
    // `['X', 'Y']` in walk order.
    expect(outDrops.map((m) => m.lane1)).toEqual(['Y', 'X']);
  });
});
