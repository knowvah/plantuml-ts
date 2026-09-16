import { describe, expect, it } from 'vitest';
import { layoutActivity } from '../../../../src/diagrams/activity/layout/tile-layout.js';
import { buildIf } from '../../../../src/diagrams/activity/layout/conditional-builder.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { LAYOUT_MARGIN } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import type { StringBounder } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityDiagramAST, ActivityIf } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';
import { FormulaMeasurer } from '../../../../src/core/measurer.js';

const measurer = new FormulaMeasurer();
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };
const emptyAst: ActivityDiagramAST = { nodes: [], swimlanes: [] };
const bounder: StringBounder = { getDimension: (t: string) => ({ width: t.length * 7, height: 14 }) };

describe('layoutActivity — down: plain/swap merge case, no optionalStop', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c',
        thenLabel: 'yes',
        thenBranch: [{ kind: 'action', label: 'a' }],
        elseBranch: [],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('nodes are a, if-split, if-label(yes, south only), if-merge, in drawU order', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['action', 'if-split', 'if-label', 'if-merge']);
    expect(geo.nodes[2]!.label).toBe('yes');
  });

  it('emits exactly 3 edges: In, Else2 (4 points), Out', () => {
    expect(geo.edges.length).toBe(3);
    expect(geo.edges[1]!.points.length).toBe(4);
  });

  it('Else2 is emphasized down; In and Out are not', () => {
    expect(geo.edges[0]!.emphasize).toBeUndefined();
    expect(geo.edges[1]!.emphasize).toBe('down');
    expect(geo.edges[2]!.emphasize).toBeUndefined();
  });
});

describe('layoutActivity — down: optionalStop (stop east of the hexagon)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'dummy',
        thenLabel: 'foo',
        thenBranch: [{ kind: 'stop' }],
        elseBranch: [],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('nodes are if-split, if-label(foo, east), stop -- no if-merge', () => {
    expect(geo.nodes.map((n) => n.kind)).toEqual(['if-split', 'if-label', 'stop']);
    expect(geo.nodes[1]!.label).toBe('foo');
  });

  it('the stop sits east of the hexagon', () => {
    const split = geo.nodes.find((n) => n.kind === 'if-split')!;
    const stop = geo.nodes.find((n) => n.kind === 'stop')!;
    expect(stop.x).toBeGreaterThan(split.x + split.width);
  });

  it('emits exactly 3 edges: In, Horizontal, Out', () => {
    expect(geo.edges.length).toBe(3);
  });
});

describe('layoutActivity — down: then-branch ends in stop (ElseNoDiamond, no Out edge)', () => {
  const ast: ActivityDiagramAST = {
    nodes: [
      {
        kind: 'if',
        condition: 'c',
        thenBranch: [{ kind: 'action', label: 'a' }, { kind: 'stop' }],
        elseBranch: [],
        elseIfBranches: [],
      },
    ],
    swimlanes: [],
  };
  const geo = layoutActivity(ast, theme, measurer);

  it('no if-merge node', () => {
    expect(geo.nodes.some((n) => n.kind === 'if-merge')).toBe(false);
  });

  it('emits exactly 3 edges: the internal action->stop edge, In, ElseNoDiamond -- no Out', () => {
    expect(geo.edges.length).toBe(3);
  });

  it('the last edge (ElseNoDiamond) ends at the tile"s own bottom, emphasized down', () => {
    const last = geo.edges[geo.edges.length - 1]!;
    expect(last.emphasize).toBe('down');
    expect(last.points.length).toBe(4);
  });
});

describe('layoutActivity — down: laned, main flow switches lanes (ConnectionElse1)', () => {
  const laned: ActivityIf = {
    kind: 'if',
    condition: 'c',
    thenBranch: [{ kind: 'action', label: 'x', swimlane: 'B' }],
    elseBranch: [],
    elseIfBranches: [],
    swimlane: 'A',
  };
  const sameLane: ActivityIf = {
    kind: 'if',
    condition: 'c',
    thenBranch: [{ kind: 'action', label: 'x', swimlane: 'B' }],
    elseBranch: [],
    elseIfBranches: [],
    swimlane: 'B',
  };

  it('Else1 fires when the main flow switches to a lane declared after the if"s own', () => {
    const tile = buildIf(laned, bounder, theme, ['A', 'B']);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    // Else1 routes LEFT of the hexagon: the second point's x is less than
    // the first (diamond1's own WEST hook).
    const elseEdge = full.geometry.edges[1]!;
    expect(elseEdge.points[1]!.x).toBeLessThan(elseEdge.points[0]!.x);
  });

  it('Else2 fires when the main flow stays in the if"s own lane (cemipu-87-dinu624 shape)', () => {
    const tile = buildIf(sameLane, bounder, theme, ['A', 'B']);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    const elseEdge = full.geometry.edges[1]!;
    expect(elseEdge.points[1]!.x).toBeGreaterThan(elseEdge.points[0]!.x);
  });
});

describe('layoutActivity — down: Else1/Else2 by true declaration order, not lane membership', () => {
  // `Swimlane#isSmallerThanAllOthers` (`Swimlane.java:130-137`, `order` =
  // declaration index, `Swimlanes.java:173`): Else1 fires only when the
  // if's own lane is declared AT OR BEFORE every lane the main flow
  // touches; Else2 fires the moment some touched lane was declared
  // EARLIER. Membership alone cannot tell these two scenarios apart --
  // both touch a lane different from the if's own -- only `laneOrder`
  // (`ast.swimlanes`) can.

  it('Given the main flow RE-ENTERS a lane declared earlier than the if"s own, when routed, then Else2 fires (not smaller)', () => {
    // laneOrder ['B', 'A']: B declared first, A second. The if opens in A
    // (the later lane); its main flow re-enters B (the earlier lane).
    const node: ActivityIf = {
      kind: 'if',
      condition: 'c',
      thenBranch: [{ kind: 'action', label: 'x', swimlane: 'B' }],
      elseBranch: [],
      elseIfBranches: [],
      swimlane: 'A',
    };
    const tile = buildIf(node, bounder, theme, ['B', 'A']);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    const elseEdge = full.geometry.edges[1]!;
    // Else2 routes RIGHT: the second point's x is greater than the first.
    expect(elseEdge.points[1]!.x).toBeGreaterThan(elseEdge.points[0]!.x);
  });

  it('Given the main flow switches to a lane declared AFTER the if"s own (never touched before), when routed, then Else1 fires', () => {
    // Mirror of the above: laneOrder ['A', 'B'], if opens in A (the
    // earlier lane), main flow switches to B (a genuinely new, later lane).
    const node: ActivityIf = {
      kind: 'if',
      condition: 'c',
      thenBranch: [{ kind: 'action', label: 'x', swimlane: 'B' }],
      elseBranch: [],
      elseIfBranches: [],
      swimlane: 'A',
    };
    const tile = buildIf(node, bounder, theme, ['A', 'B']);
    const full = assignCoordinatesFull({
      root: tile,
      ast: emptyAst,
      baseX: LAYOUT_MARGIN,
      baseY: LAYOUT_MARGIN,
      bounder,
      theme,
    });
    const elseEdge = full.geometry.edges[1]!;
    // Else1 routes LEFT: the second point's x is less than the first.
    expect(elseEdge.points[1]!.x).toBeLessThan(elseEdge.points[0]!.x);
  });
});

describe('assignCoordinatesFull — down: Else2 emits the hexagon elbow reservation', () => {
  const node: ActivityIf = {
    kind: 'if',
    condition: 'c',
    thenLabel: 'yes',
    thenBranch: [{ kind: 'action', label: 'a' }],
    elseBranch: [],
    elseIfBranches: [],
  };
  const tile = buildIf(node, bounder, theme);
  const full = assignCoordinatesFull({
    root: tile,
    ast: emptyAst,
    baseX: LAYOUT_MARGIN,
    baseY: LAYOUT_MARGIN,
    bounder,
    theme,
  });

  it('emits exactly one reservation, 5 wide x 12 tall', () => {
    expect(full.reservations).toHaveLength(1);
    expect(full.reservations[0]).toMatchObject({ width: 5, height: 12 });
  });

  it('sits at (elseEdge end x, elseEdge end y - 12)', () => {
    const elseEdge = full.geometry.edges[1]!;
    const end = elseEdge.points[elseEdge.points.length - 1]!;
    expect(full.reservations[0]!.x).toBeCloseTo(end.x, 5);
    expect(full.reservations[0]!.y).toBeCloseTo(end.y - 12, 5);
  });
});
