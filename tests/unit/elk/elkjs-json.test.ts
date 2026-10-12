/**
 * The ELK JSON the elkjs backend sends: option ids and value encodings, and
 * where each edge is declared.
 */
import { describe, expect, it } from 'vitest';

import { createElkjsBackend } from '../../../src/core/elk/elkjs-backend.js';
import { applyElkJson, toElkJson } from '../../../src/core/elk/elkjs-json.js';
import { encodeOptionValue } from '../../../src/core/elk/elkjs-options.js';
import { ElkjsNode } from '../../../src/core/elk/elkjs-graph.js';
import { CoreOptions } from '../../../src/core/elk/proxy/core/options/CoreOptions.js';
import { Direction } from '../../../src/core/elk/proxy/core/options/Direction.js';
import { EdgeLabelPlacement } from '../../../src/core/elk/proxy/core/options/EdgeLabelPlacement.js';
import { HierarchyHandling } from '../../../src/core/elk/proxy/core/options/HierarchyHandling.js';
import { NodeLabelPlacement } from '../../../src/core/elk/proxy/core/options/NodeLabelPlacement.js';
import { ElkPadding } from '../../../src/core/elk/proxy/core/math/ElkPadding.js';
import type { ElkNode } from '../../../src/core/elk/proxy/graph/ElkNode.js';

/** No layout runs here, so the worker module is never touched. */
const elk = createElkjsBackend({ Worker: class {} });

function json(root: ElkNode): unknown {
  if (!(root instanceof ElkjsNode)) throw new Error('not an elkjs node');
  return toElkJson(root).graph;
}

describe('toElkJson', () => {
  it('encodes every option the maker sets by its ELK id', () => {
    const root = elk.createGraph();
    root.setProperty(CoreOptions.DIRECTION, Direction.DOWN);
    root.setProperty(CoreOptions.HIERARCHY_HANDLING, HierarchyHandling.INCLUDE_CHILDREN);
    const group = elk.createNode(root);
    group.setProperty(CoreOptions.PADDING, new ElkPadding(40.5, 15, 16, 17));
    const a = elk.createNode(group);
    a.setDimensions(100, 50);
    const label = elk.createLabel(a);
    label.setText('X');
    label.setDimensions(100, 40);
    label.setProperty(
      CoreOptions.NODE_LABELS_PLACEMENT,
      new Set([NodeLabelPlacement.INSIDE, NodeLabelPlacement.H_CENTER, NodeLabelPlacement.V_CENTER]),
    );
    const b = elk.createNode(root);
    const edge = elk.createSimpleEdge(a, b);
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);
    const tail = elk.createLabel(edge);
    tail.setText('1');
    tail.setProperty(CoreOptions.EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.TAIL);

    expect(json(root)).toEqual({
      id: 'n0',
      x: 0,
      y: 0,
      width: 0,
      height: 0,
      layoutOptions: { 'org.eclipse.elk.direction': 'DOWN', 'org.eclipse.elk.hierarchyHandling': 'INCLUDE_CHILDREN' },
      labels: [],
      children: [
        {
          id: 'n1',
          x: 0,
          y: 0,
          width: 0,
          height: 0,
          layoutOptions: { 'org.eclipse.elk.padding': '[top=40.5,left=17,bottom=16,right=15]' },
          labels: [],
          children: [
            {
              id: 'n2',
              x: 0,
              y: 0,
              width: 100,
              height: 50,
              layoutOptions: {},
              labels: [
                {
                  text: 'X',
                  x: 0,
                  y: 0,
                  width: 100,
                  height: 40,
                  layoutOptions: { 'org.eclipse.elk.nodeLabels.placement': '[OUTSIDE]' },
                },
              ],
              children: [],
              edges: [],
            },
          ],
          edges: [],
        },
        { id: 'n3', x: 0, y: 0, width: 0, height: 0, layoutOptions: {}, labels: [], children: [], edges: [] },
      ],
      edges: [
        {
          id: 'e0',
          sources: ['n2'],
          targets: ['n3'],
          layoutOptions: { 'org.eclipse.elk.edgeLabels.inline': 'true' },
          labels: [
            {
              text: '1',
              x: 0,
              y: 0,
              width: 0,
              height: 0,
              layoutOptions: { 'org.eclipse.elk.edgeLabels.placement': 'TAIL' },
            },
          ],
        },
      ],
    });
  });

  it('declares an edge in its containing node and keeps creation order there', () => {
    const root = elk.createGraph();
    const group = elk.createNode(root);
    const [p, q, r] = [elk.createNode(group), elk.createNode(group), elk.createNode(root)];
    elk.createSimpleEdge(q, p);
    elk.createSimpleEdge(p, r);
    elk.createSimpleEdge(p, q);
    const graph = json(root) as { edges: { id: string }[]; children: { edges: { id: string; sources: string[] }[] }[] };
    // Ids are pre-order: nodes first, then each container's edges in turn.
    expect(graph.edges.map((e) => e.id)).toEqual(['e0']);
    expect(graph.children[0]!.edges.map((e) => [e.id, e.sources[0]])).toEqual([
      ['e1', 'n3'],
      ['e2', 'n2'],
    ]);
  });

  it('omits a property set to an empty EnumSet, as ELK removes a null value', () => {
    const root = elk.createGraph();
    root.setProperty(CoreOptions.DIRECTION, Direction.DOWN);
    root.setProperty(CoreOptions.DIRECTION, new Set());
    expect((json(root) as { layoutOptions: object }).layoutOptions).toEqual({});
  });
});

describe('applyElkJson', () => {
  function sentGraph(): { root: ElkjsNode; sent: ReturnType<typeof toElkJson> } {
    const root = elk.createGraph();
    const a = elk.createNode(root);
    elk.createSimpleEdge(a, elk.createNode(root));
    if (!(root instanceof ElkjsNode)) throw new Error('not an elkjs node');
    return { root, sent: toElkJson(root) };
  }

  it('refuses a reply that is not the graph it sent', () => {
    const { root, sent } = sentGraph();
    expect(() => applyElkJson(root, sent, structuredClone(sent.graph))).toThrow(
      'elkjs replied with a graph other than the one sent',
    );
  });

  it('refuses a layout with a missing coordinate', () => {
    const { root, sent } = sentGraph();
    sent.graph.edges[0]!.container = 'n0';
    sent.graph.children[0]!.x = Number.NaN;
    expect(() => applyElkJson(root, sent, sent.graph)).toThrow('elkjs layout result has no numeric x');
  });

  it('refuses an edge elkjs placed in another container', () => {
    const { root, sent } = sentGraph();
    sent.graph.edges[0]!.container = 'n1';
    expect(() => applyElkJson(root, sent, sent.graph)).toThrow('elkjs placed edge e0 in n1, not n0');
  });

  it('reads sections, with and without bend points', () => {
    const { root, sent } = sentGraph();
    const edge = sent.graph.edges[0]!;
    edge.container = 'n0';
    edge.sections = [
      { startPoint: { x: 1, y: 2 }, endPoint: { x: 3, y: 4 } },
      { startPoint: { x: 5, y: 6 }, endPoint: { x: 7, y: 8 }, bendPoints: [{ x: 9, y: 10 }] },
    ];
    applyElkJson(root, sent, sent.graph);
    const sections = root.containedEdges[0]!.getSections();
    expect(sections.map((s) => [s.getStartX(), s.getStartY(), s.getEndX(), s.getEndY()])).toEqual([
      [1, 2, 3, 4],
      [5, 6, 7, 8],
    ]);
    expect(sections[1]!.getBendPoints().map((b) => [b.getX(), b.getY()])).toEqual([[9, 10]]);
    expect(sections[0]!.getBendPoints()).toEqual([]);
  });
});

describe('encodeOptionValue', () => {
  it.each([
    [CoreOptions.EDGE_LABELS_INLINE, Direction.DOWN, 'org.eclipse.elk.edgeLabels.inline expects an BOOLEAN value'],
    [CoreOptions.PADDING, true, 'org.eclipse.elk.padding expects an OBJECT value, got true'],
    [CoreOptions.PADDING, Direction.DOWN, 'org.eclipse.elk.padding expects an OBJECT value'],
    [
      CoreOptions.NODE_LABELS_PLACEMENT,
      Direction.DOWN,
      'org.eclipse.elk.nodeLabels.placement expects an ENUMSET value',
    ],
  ] as const)('refuses %o given the wrong kind of value', (property, value, message) => {
    expect(() => encodeOptionValue(property, value)).toThrow(message);
  });

  it('writes a boolean as ELK parses it', () => {
    expect(encodeOptionValue(CoreOptions.EDGE_LABELS_INLINE, false)).toBe('false');
  });
});
