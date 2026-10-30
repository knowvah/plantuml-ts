// T2a (json-family-parity, D1): `layoutGraph(..., { read: 'exact' })` also
// returns the engine's raw node/edge frame (`engineNodes` / `engineEdges`).
// Expected values are the numbers `render(g, 'dot')` prints for a FRESH graph
// built by the same builder entry points: re-rendering one dot-engine graph is
// not idempotent, so the reference never shares a graph with `layoutGraph`.
import { describe, it, expect } from 'vitest';
import { createGraph, render } from '@knowvah/dot-engine';
import { layoutGraph } from '../../../src/core/graph-layout.js';
import { applyGraphAttrs, addNodes, addClusters, addEdges } from '../../../src/core/graph-layout-build.js';
import type { DotInputGraph } from '../../../src/core/graph-layout.js';

const POINTS_PER_INCH = 72;
// `render(g, 'dot')` prints pos at 2 dp (half-ulp 0.005) and width/height as
// inches at 4 dp (half-ulp 0.00005 in = 0.0036 pt), so those are the tightest
// bounds a text comparison can honour.
const POS_TOLERANCE = 0.005;
const SIZE_TOLERANCE = 0.0036;
const near = (actual: number, expected: number, tolerance: number): void => {
  expect(Math.abs(actual - expected)).toBeLessThanOrEqual(tolerance);
};

// SmetanaForJson#createEdge (:221-224): arrowsize/arrowtail/arrowhead on every edge.
const ARROW_ATTRS = { arrowsize: '.75', arrowtail: 'none', arrowhead: 'normal' } as const;

/** Two record nodes joined by a ported edge, as json builds them. The child's
 *  label (`_dim_` cells 40x30 and 56x22) is larger than its declared 10x10, so
 *  the engine decides its size. */
const recordGraph: DotInputGraph = {
  nodes: [
    { id: 'root', width: 40, height: 30, shape: 'record', recordLabel: '<P0>_dim_14_40_|<P1>_dim_14_40_' },
    { id: 'child', width: 10, height: 10, shape: 'record', recordLabel: '{_dim_40_56_|{<P0>_dim_22_56_}}' },
  ],
  edges: [{ id: 'root->child', from: 'root', to: 'child', attributes: { ...ARROW_ATTRS, tailport: 'P1' } }],
};

interface DotNode {
  readonly cx: number;
  readonly cy: number;
  readonly width: number;
  readonly height: number;
}

/** `render(g, 'dot')` of a fresh graph: node pos/width/height and edge pos. */
function referenceDot(input: DotInputGraph): { nodes: Map<string, DotNode>; edgePos: string[] } {
  const b = createGraph({ directed: true });
  applyGraphAttrs(b, input);
  addNodes(b, input);
  addClusters(b, input);
  addEdges(b, input);
  const text = render(b.graph, 'dot', { engine: 'dot' }).replace(/\\\r?\n/g, '');
  const nodes = new Map<string, DotNode>();
  for (const m of text.matchAll(
    /^\s*(\w+)\s*\[[^\]]*?\bheight=([\d.]+)[^\]]*?\bpos="([\d.-]+),([\d.-]+)"[^\]]*?\bwidth=([\d.]+)/gm,
  )) {
    nodes.set(m[1]!, {
      cx: Number(m[3]),
      cy: Number(m[4]),
      width: Number(m[5]) * POINTS_PER_INCH,
      height: Number(m[2]) * POINTS_PER_INCH,
    });
  }
  const edgePos = [...text.matchAll(/->\s*\w+\s*\[[^\]]*?\bpos="([^"]*)"/g)].map((m) => m[1]!);
  return { nodes, edgePos };
}

describe('layoutGraph read:exact — engineNodes / engineEdges', () => {
  it('reports each node centre and engine size as render(dot) prints them', () => {
    const ref = referenceDot(recordGraph);
    const r = layoutGraph(recordGraph, { read: 'exact' });
    expect(r.engineNodes).toBeDefined();
    expect(r.engineNodes!.map((n) => n.id).sort()).toEqual(['child', 'root']);
    for (const n of r.engineNodes!) {
      const want = ref.nodes.get(n.id)!;
      expect(want).toBeDefined();
      near(n.cx, want.cx, POS_TOLERANCE);
      near(n.cy, want.cy, POS_TOLERANCE);
      near(n.width, want.width, SIZE_TOLERANCE);
      near(n.height, want.height, SIZE_TOLERANCE);
    }
  });

  it('reports the edge control points and arrow end as render(dot) prints them', () => {
    const ref = referenceDot(recordGraph);
    const r = layoutGraph(recordGraph, { read: 'exact' });
    expect(r.engineEdges).toHaveLength(1);
    const e = r.engineEdges![0]!;
    expect(e.id).toBe('root->child');
    expect(e.id).toBe(r.edges[0]!.id);
    // dot -Tdot pos="e,EX,EY x,y x,y ..." — arrow end first, then the control points.
    expect(ref.edgePos).toHaveLength(1);
    const m = /^e,([\d.-]+),([\d.-]+) (.*)$/.exec(ref.edgePos[0]!)!;
    near(e.epX!, Number(m[1]), POS_TOLERANCE);
    near(e.epY!, Number(m[2]), POS_TOLERANCE);
    const want = m[3]!.split(' ').map((p) => p.split(',').map(Number) as [number, number]);
    expect(e.points).toHaveLength(want.length);
    e.points.forEach((p, i) => {
      near(p.x, want[i]![0], POS_TOLERANCE);
      near(p.y, want[i]![1], POS_TOLERANCE);
    });
  });

  it('carries the engine size while nodes[] keeps its echoed/shifted values', () => {
    const r = layoutGraph(recordGraph, { read: 'exact' });
    const child = r.engineNodes!.find((n) => n.id === 'child')!;
    const outNode = r.nodes.find((n) => n.id === 'child')!;
    // The engine grew the child past its declared 10x10 (record fields decide it).
    expect(child.width).toBeGreaterThan(10);
    expect(child.height).toBeGreaterThan(10);
    // Existing field: same read as before the change (engine size, no echo needed here).
    near(outNode.width, child.width, 1e-3);
    near(outNode.height, child.height, 1e-3);
    // engineNodes is the native y-up frame: unshifted, so root (rank 0, rank axis
    // = y) sits ABOVE the child, i.e. a LARGER cy; nodes[] is y-down and shifted.
    const root = r.engineNodes!.find((n) => n.id === 'root')!;
    expect(root.cy).toBeGreaterThan(child.cy);
    expect(r.nodes.find((n) => n.id === 'root')!.y).toBeLessThan(outNode.y);
  });

  it('omits an arrow end the edge does not carry', () => {
    const noArrow: DotInputGraph = {
      nodes: recordGraph.nodes,
      edges: [{ id: 'e', from: 'root', to: 'child', attributes: { arrowhead: 'none', tailport: 'P1' } }],
    };
    const e = layoutGraph(noArrow, { read: 'exact' }).engineEdges![0]!;
    expect(e.id).toBe('e');
    expect(e.epX).toBeUndefined();
    expect(e.epY).toBeUndefined();
    expect(e.points.length).toBeGreaterThanOrEqual(4);
  });

  it('adds nothing and changes nothing under the default read:svek', () => {
    const svek = layoutGraph(recordGraph);
    expect(svek).not.toHaveProperty('engineNodes');
    expect(svek).not.toHaveProperty('engineEdges');
    expect(layoutGraph(recordGraph, { read: 'svek' })).toEqual(svek);
  });

  it('leaves every existing exact-read field as it was (additive only)', () => {
    const exact = layoutGraph(recordGraph, { read: 'exact' });
    const { engineNodes, engineEdges, ...rest } = exact;
    expect(engineNodes).toBeDefined();
    expect(engineEdges).toBeDefined();
    expect(Object.keys(rest).sort()).toEqual(['edges', 'height', 'nodes', 'originShift', 'width']);
  });

  it('returns no engine data for an empty graph', () => {
    expect(layoutGraph({ nodes: [], edges: [] }, { read: 'exact' })).toEqual({
      nodes: [],
      edges: [],
      width: 0,
      height: 0,
    });
  });
});
