/**
 * Mission `activity-edge-draw-order`, T2 — rule (b), the swimlane pass
 * order. Written BEFORE `layout/edge-draw-order.ts` exists (TDD, the
 * task's own "tests first"); the acceptance criteria of
 * `plans/activity-edge-draw-order/batch-1/T2-lane-pass-order.md` are one
 * `it` each.
 */
import { describe, expect, it } from 'vitest';
import { applyEdgeDrawOrder, lanePassOrder, passOf } from '../../../../src/diagrams/activity/layout/edge-draw-order.js';
import type { EdgeMeta } from '../../../../src/diagrams/activity/layout/swimlane-placement.js';
import { assignCoordinatesFull } from '../../../../src/diagrams/activity/layout/assign-coordinates-full.js';
import { LAYOUT_MARGIN } from '../../../../src/diagrams/activity/layout/tile-coordinates.js';
import { GtileFork } from '../../../../src/diagrams/activity/tiles/gtile-fork.js';
import { NORTH_HOOK } from '../../../../src/diagrams/activity/tiles/points.js';
import type { StringBounder, Tile } from '../../../../src/diagrams/activity/tiles/tile.js';
import type { ActivityDiagramAST } from '../../../../src/diagrams/activity/ast.js';
import type { Theme } from '../../../../src/core/theme.js';
import { resolveTheme } from '../../../../src/core/theme.js';

const bounder: StringBounder = { getDimension: () => ({ width: 60, height: 16 }) };
const theme: Theme = { ...resolveTheme('default'), fontSize: 13, fontFamily: 'Arial' };

/** `EdgeMeta` carries a third field (`shape`) neither ordering function
 * reads; fixed at `'default'` so a test row shows only its two lanes. */
function meta(lane1: string | undefined, lane2: string | undefined): EdgeMeta {
  return { lane1, lane2, shape: 'default' };
}

describe('passOf — pass membership (aedo-T1 Q1, D2)', () => {
  it('sends a same-lane edge to that lane’s own pass', () => {
    expect(passOf(meta('A', 'A'), ['A', 'B'])).toBe('A');
    expect(passOf(meta('B', 'B'), ['A', 'B'])).toBe('B');
  });

  it('sends an edge whose ends differ to the final cross pass', () => {
    expect(passOf(meta('A', 'B'), ['A', 'B'])).toBeNull();
    expect(passOf(meta('B', 'A'), ['A', 'B'])).toBeNull();
  });

  it('sends a half-lane-less edge to the known end’s lane (T1 Q1 branch 4)', () => {
    expect(passOf(meta(undefined, 'B'), ['A', 'B'])).toBe('B');
    expect(passOf(meta('B', undefined), ['A', 'B'])).toBe('B');
  });

  it('sends a wholly lane-less edge to the FIRST pass, and never throws', () => {
    expect(passOf(meta(undefined, undefined), ['A', 'B'])).toBe('A');
    expect(() => passOf(meta(undefined, undefined), [])).not.toThrow();
  });
});

describe('lanePassOrder — each lane’s own edges, then the cross pass', () => {
  it('returns [0, 3, 2, 1] for [A→A, A→B, B→B, A→A] over lanes [A, B]', () => {
    const metas = [meta('A', 'A'), meta('A', 'B'), meta('B', 'B'), meta('A', 'A')];
    expect(lanePassOrder(metas, ['A', 'B'])).toEqual([0, 3, 2, 1]);
  });

  it('keeps declaration order WITHIN one lane’s pass', () => {
    const metas = [meta('B', 'B'), meta('A', 'A'), meta('B', 'B'), meta('A', 'A')];
    expect(lanePassOrder(metas, ['A', 'B'])).toEqual([1, 3, 0, 2]);
  });

  it('keeps walk order among the cross-pass edges', () => {
    const metas = [meta('A', 'B'), meta('A', 'A'), meta('B', 'A')];
    expect(lanePassOrder(metas, ['A', 'B'])).toEqual([1, 0, 2]);
  });

  it('orders passes by DECLARATION order, not by first use (D3)', () => {
    const metas = [meta('B', 'B'), meta('A', 'A')];
    expect(lanePassOrder(metas, ['A', 'B'])).toEqual([1, 0]);
    expect(lanePassOrder(metas, ['B', 'A'])).toEqual([0, 1]);
  });

  it('returns the identity order for no lanes and for one lane', () => {
    const metas = [meta(undefined, undefined), meta(undefined, undefined), meta(undefined, undefined)];
    expect(lanePassOrder(metas, [])).toEqual([0, 1, 2]);
    expect(lanePassOrder([meta('A', 'A'), meta('A', 'A')], ['A'])).toEqual([0, 1]);
  });

  it('returns a permutation of every index — no edge is ever dropped', () => {
    const metas = [meta('A', 'A'), meta('A', 'B'), meta('B', 'B'), meta('C', 'C'), meta(undefined, 'B')];
    const order = lanePassOrder(metas, ['A', 'B']);
    expect([...order].sort((x, y) => x - y)).toEqual([0, 1, 2, 3, 4]);
  });

  it('returns an empty order for an empty edge list', () => {
    expect(lanePassOrder([], ['A', 'B'])).toEqual([]);
  });
});

describe('applyEdgeDrawOrder — edges and edgeMeta move together (D1, stop 9)', () => {
  it('permutes both arrays by the one index order', () => {
    const metas = [meta('A', 'A'), meta('A', 'B'), meta('B', 'B')];
    const edges = ['e0', 'e1', 'e2'];
    const out = applyEdgeDrawOrder(edges, metas, [2, 0, 1]);
    expect(out.edges).toEqual(['e2', 'e0', 'e1']);
    expect(out.edgeMeta).toEqual([metas[2], metas[0], metas[1]]);
  });

  it('leaves edges[i] describing the edge whose lanes are edgeMeta[i]', () => {
    const metas = [meta('A', 'A'), meta('A', 'B'), meta('B', 'B'), meta('A', 'A')];
    const edges = metas.map((m, i) => ({ id: i, lanes: `${String(m.lane1)}->${String(m.lane2)}` }));
    const order = lanePassOrder(metas, ['A', 'B']);
    const out = applyEdgeDrawOrder(edges, metas, order);
    for (let i = 0; i < out.edges.length; i++) {
      const m = out.edgeMeta[i]!;
      expect(out.edges[i]!.lanes).toBe(`${String(m.lane1)}->${String(m.lane2)}`);
    }
  });

  it('does not mutate its inputs', () => {
    const metas = [meta('A', 'A'), meta('B', 'B')];
    const edges = ['e0', 'e1'];
    applyEdgeDrawOrder(edges, metas, [1, 0]);
    expect(edges).toEqual(['e0', 'e1']);
    expect(metas).toEqual([meta('A', 'A'), meta('B', 'B')]);
  });
});

/** A branch tile whose lane is `swimlane`, the same stub shape
 * `tile-coordinates.test.ts` uses for fork/split geometry. */
function branchStub(height: number, swimlane: string): Tile {
  return {
    kind: 'stub-branch',
    width: 80,
    height,
    swimlane,
    swimlaneOut: swimlane,
    getCoord: (hook) => (hook === NORTH_HOOK ? { x: 7, y: 0 } : { x: 11, y: height }),
    hasPointOut: () => true,
  };
}

describe('assignCoordinatesFull — the lane pass order applied last (D1)', () => {
  // A two-branch fork across two lanes: the fork bar sits in the first
  // branch's lane, so branch B's in/out connectors cross a lane boundary
  // and land in the cross pass while branch A's stay in lane A's pass.
  const tile = new GtileFork([branchStub(60, 'A'), branchStub(80, 'B')], bounder);
  // The fork's OWN lane, which `tile-layout.ts#withSwimlane`/`#withSwimlaneOut`
  // thread onto every tile it builds — a directly-constructed `GtileFork`
  // never passes through those, and without it the bar and join carry no
  // lane at all, so every connector becomes a half-lane-less edge (T1 Q1
  // branch 4) and the fixture has no cross-lane edge to order.
  tile.swimlane = 'A';
  tile.swimlaneOut = 'A';
  const ast: ActivityDiagramAST = { nodes: [], swimlanes: ['A', 'B'] };
  const result = assignCoordinatesFull({
    root: tile,
    ast,
    baseX: LAYOUT_MARGIN,
    baseY: LAYOUT_MARGIN,
    bounder,
    theme,
  });

  it('keeps edges and edgeMeta the same length', () => {
    expect(result.edgeMeta).toHaveLength(result.geometry.edges.length);
    expect(result.geometry.edges.length).toBeGreaterThan(0);
  });

  it('carries at least one cross-lane edge on this fixture', () => {
    const cross = result.edgeMeta.filter((m) => passOf(m, ast.swimlanes) === null);
    expect(cross.length).toBeGreaterThan(0);
  });

  it('emits every same-lane edge before every cross-lane edge', () => {
    const passes = result.edgeMeta.map((m) => passOf(m, ast.swimlanes));
    const firstCross = passes.indexOf(null);
    expect(firstCross).toBeGreaterThanOrEqual(0);
    expect(passes.slice(firstCross).every((p) => p === null)).toBe(true);
  });

  it('runs lane A’s two own connectors, then both crossings into lane B', () => {
    const passes = result.edgeMeta.map((m) => passOf(m, ast.swimlanes));
    expect(passes).toEqual(['A', 'A', null, null]);
  });

  it('is already in its own lane pass order — applying it again is the identity', () => {
    const order = lanePassOrder(result.edgeMeta, ast.swimlanes);
    expect(order).toEqual(order.map((_, i) => i));
  });
});
