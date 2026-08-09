/**
 * A5 / T6 AC2 — the graph `layoutJson` hands the engine is upstream's, not
 * this port's old one.
 *
 * Asserted on the GRAPH rather than inferred from rendered output, because
 * the two are separable: a wrong graph can still produce a plausible-looking
 * diagram, which is exactly how the `rankDir: 'LR'` divergence survived
 * unnoticed until this mission measured it.
 *
 * @see ~/git/plantuml/.../jsondiagram/SmetanaForJson.java:236-244
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { DotInputGraph, DotLayoutResult } from '../../../src/core/graph-layout.types.js';

const captured: DotInputGraph[] = [];

vi.mock('../../../src/core/graph-layout.js', () => ({
  layoutGraph: (input: DotInputGraph): DotLayoutResult => {
    captured.push(input);
    // Minimal believable placement so layoutJson can finish.
    return {
      nodes: input.nodes.map((n, i) => ({
        id: n.id, x: 0, y: i * 100, width: n.width, height: n.height,
      })),
      edges: input.edges.map((e) => ({ id: e.id, points: [] })),
      width: 500,
      height: 500,
    };
  },
}));

const { layoutJson } = await import('../../../src/diagrams/json/layout.js');
const { parseJson } = await import('../../../src/diagrams/json/parser.js');
const { defaultTheme } = await import('../../../src/core/theme.js');
const { DeterministicMeasurer } = await import('../../../src/core/measurer-deterministic.js');

function layoutOf(body: string): DotInputGraph {
  captured.length = 0;
  const ast = parseJson({ type: 'json', lines: body.split('\n') });
  layoutJson(ast, defaultTheme, new DeterministicMeasurer());
  const graph = captured[0];
  expect(graph, 'layoutJson should have called the layout seam').toBeDefined();
  return graph!;
}

describe('layoutJson — the graph handed to the engine (AC2)', () => {
  beforeEach(() => { captured.length = 0; });

  it('sets NO rankDir — upstream never calls it, so graphviz defaults to TB', () => {
    expect(layoutOf('{"a": {"b": 1}}').rankDir).toBeUndefined();
  });

  it('sets NO nodesep/ranksep — upstream sets neither, so graphviz defaults apply', () => {
    const g = layoutOf('{"a": {"b": 1}}');
    expect(g.nodeSep).toBeUndefined();
    expect(g.rankSep).toBeUndefined();
    expect(g.omitSepAttrs).toBe(true);
  });

  it('swaps every node\'s width and height on the way in', () => {
    // A node wider than it is tall must arrive at the engine taller than wide.
    const g = layoutOf('{"a_long_key_name_here": "and a long value too"}');
    expect(g.nodes.length).toBeGreaterThan(0);
    for (const n of g.nodes) {
      expect(n.width).toBeGreaterThan(0);
      expect(n.height).toBeGreaterThan(0);
    }
    // The single root node's rendered box is wider than tall; transposed, the
    // engine must see the opposite.
    const root = g.nodes[0]!;
    expect(root.height).toBeGreaterThan(root.width);
  });
});
