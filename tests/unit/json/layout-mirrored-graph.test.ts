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
/** Set by a test to model a seam that returned no raw engine frame (all of it,
 *  or only its edge half), or edges whose head end carries no arrow. */
let omitEngineFrame: false | 'all' | 'edges' = false;
let omitEp = false;

/**
 * T3a: the raw engine frame (`engineNodes`/`engineEdges`) a `read: 'exact'`
 * call returns. Node `i` sits at centre `(50 + 100i, 200 - 80i)` in the y-up
 * frame with the engine size equal to the declared one; every edge carries the
 * same two points and an `ep`, so the mirror arithmetic is checkable by hand.
 */
function engineCentreOf(i: number): { cx: number; cy: number } {
  return { cx: 50 + 100 * i, cy: 200 - 80 * i };
}
const EDGE_POINTS = [
  { x: 1, y: 2 },
  { x: 3, y: 400 },
] as const;
const EDGE_EP = { epX: 5, epY: 6 } as const;

vi.mock('../../../src/core/graph-layout.js', () => ({
  layoutGraph: (input: DotInputGraph): DotLayoutResult => {
    captured.push(input);
    // Minimal believable placement so layoutJson can finish. `nodes`/`edges`
    // are deliberately NOT what layoutJson reads (T3a): their values differ
    // from the engine frame below, so a test fails if they leak through.
    return {
      nodes: input.nodes.map((n, i) => ({
        id: n.id,
        x: 0,
        y: i * 100,
        width: n.width,
        height: n.height,
      })),
      edges: input.edges.map((e) => ({ id: e.id, points: [] })),
      width: 500,
      height: 500,
      ...(omitEngineFrame === 'all'
        ? {}
        : {
            engineNodes: input.nodes.map((n, i) => ({
              id: n.id,
              ...engineCentreOf(i),
              width: n.width,
              height: n.height,
            })),
          }),
      ...(omitEngineFrame === false
        ? { engineEdges: input.edges.map((e) => ({ id: e.id, points: EDGE_POINTS, ...(omitEp ? {} : EDGE_EP) })) }
        : {}),
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
  beforeEach(() => {
    captured.length = 0;
    omitEngineFrame = false;
    omitEp = false;
  });

  it('sets NO rankDir — upstream never calls it, so graphviz defaults to TB', () => {
    expect(layoutOf('{"a": {"b": 1}}').rankDir).toBeUndefined();
  });

  it('sets NO nodesep/ranksep — upstream sets neither, so graphviz defaults apply', () => {
    const g = layoutOf('{"a": {"b": 1}}');
    expect(g.nodeSep).toBeUndefined();
    expect(g.rankSep).toBeUndefined();
    expect(g.omitSepAttrs).toBe(true);
  });

  it("swaps every node's width and height on the way in", () => {
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

/**
 * T3a: nodes and edges are read off the raw engine frame through the jar's
 * mirror. `max` = max over nodes of `cy + h/2` (`SmetanaForJson.java:97-102,
 * 160-164`); node origin `(max - (cy + h/2), cx - w/2)` (`:203-209`, `.sym()`);
 * every edge point and `ep` through `Mirror#invAndXYSwitch` = `(max - y, x)`
 * (`JsonCurve.java:96-108`, `Mirror.java:55-59`). Margin = `same(10)`
 * (`TitledDiagram.java:275-277`), added after the mirror as before.
 */
describe('layoutJson — placement through the jar mirror (T3a)', () => {
  const MARGIN = 10;
  const BODY = '{"a": {"b": 1}, "c": [1]}';

  beforeEach(() => {
    captured.length = 0;
    omitEngineFrame = false;
    omitEp = false;
  });

  function maxOf(g: DotInputGraph): number {
    // engine height = declared height (mock); `double max = 0` start (:160)
    return Math.max(0, ...g.nodes.map((n, i) => engineCentreOf(i).cy + n.height / 2));
  }

  it('places every node at (max - (cy + h/2), cx - w/2) + margin, drawn at its measured size', () => {
    const ast = parseJson({ type: 'json', lines: BODY.split('\n') });
    const geo = layoutJson(ast, defaultTheme, new DeterministicMeasurer());
    const g = captured[0]!;
    const max = maxOf(g);
    expect(geo.nodes.map((n) => n.id)).toEqual(g.nodes.map((n) => n.id));
    g.nodes.forEach((dn, i) => {
      const { cx, cy } = engineCentreOf(i);
      const node = geo.nodes[i]!;
      expect(node.x).toBe(max - (cy + dn.height / 2) + MARGIN);
      expect(node.y).toBe(cx - dn.width / 2 + MARGIN);
      // drawn size = the measured block = the declared size transposed back
      expect(node.width).toBe(dn.height);
      expect(node.height).toBe(dn.width);
    });
  });

  it('mirrors every edge point and ep with the same Mirror, never clamping (Mirror.java:48-53)', () => {
    const ast = parseJson({ type: 'json', lines: BODY.split('\n') });
    const geo = layoutJson(ast, defaultTheme, new DeterministicMeasurer());
    const max = maxOf(captured[0]!);
    expect(geo.edges.length).toBe(captured[0]!.edges.length);
    for (const e of geo.edges) {
      // y = 400 lies beyond max: the jar keeps max - 400 (negative), so do we.
      expect(e.points).toEqual([
        { x: max - 2 + MARGIN, y: 1 + MARGIN },
        { x: max - 400 + MARGIN, y: 3 + MARGIN },
      ]);
      expect(e.ep).toEqual({ x: max - 6 + MARGIN, y: 5 + MARGIN });
      expect(e.spline).toBe(true);
    }
  });

  it('carries no ep when the engine placed no arrow (JsonCurve.java:78-82 nulls it)', () => {
    omitEp = true;
    const ast = parseJson({ type: 'json', lines: BODY.split('\n') });
    const geo = layoutJson(ast, defaultTheme, new DeterministicMeasurer());
    expect(geo.edges.length).toBe(captured[0]!.edges.length);
    for (const e of geo.edges) expect('ep' in e).toBe(false);
  });

  it.each(['all', 'edges'] as const)(
    'throws when the exact read returned no raw engine frame (%s missing; broken seam invariant)',
    (missing) => {
      omitEngineFrame = missing;
      const ast = parseJson({ type: 'json', lines: BODY.split('\n') });
      expect(() => layoutJson(ast, defaultTheme, new DeterministicMeasurer())).toThrow(
        "layoutJson: layoutGraph(read: 'exact') returned no engineNodes/engineEdges",
      );
    },
  );
});
