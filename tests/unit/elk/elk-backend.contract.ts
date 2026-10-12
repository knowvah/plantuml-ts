/**
 * The shared `ElkBackend` contract (cdd8 D2, testability rule 6): every
 * backend — elkjs today, the maintainer's TypeScript ELK port next — must pass
 * this suite unchanged.
 *
 * Every graph is built through the proxy API exactly as
 * `CucaDiagramFileMakerElk.java` builds its own, and every pinned number is
 * the jar's: the same graphs were built through the oracle jar's OWN proxy
 * layer (`net.sourceforge.plantuml.elk.proxy.*` over ELK 0.12.0) and laid out
 * with `RecursiveGraphLayoutEngine` (cdd8 T1a probe, recorded in
 * `.agent-notes/cdd8-T1a.md`). elkjs 0.12.0 reproduces each value bit for bit,
 * which is why the assertions use `toBe`, not a tolerance.
 */
import { beforeAll, describe, expect, it } from 'vitest';

import type { ElkBackend } from '../../../src/core/elk/elk-backend.js';
import { CoreOptions } from '../../../src/core/elk/proxy/core/options/CoreOptions.js';
import { Direction } from '../../../src/core/elk/proxy/core/options/Direction.js';
import { EdgeLabelPlacement } from '../../../src/core/elk/proxy/core/options/EdgeLabelPlacement.js';
import { HierarchyHandling } from '../../../src/core/elk/proxy/core/options/HierarchyHandling.js';
import { NodeLabelPlacement } from '../../../src/core/elk/proxy/core/options/NodeLabelPlacement.js';
import { ElkPadding } from '../../../src/core/elk/proxy/core/math/ElkPadding.js';
import { NullElkProgressMonitor } from '../../../src/core/elk/proxy/core/util/NullElkProgressMonitor.js';
import { RecursiveGraphLayoutEngine } from '../../../src/core/elk/proxy/core/RecursiveGraphLayoutEngine.js';
import type { ElkEdge } from '../../../src/core/elk/proxy/graph/ElkEdge.js';
import type { ElkEdgeSection } from '../../../src/core/elk/proxy/graph/ElkEdgeSection.js';
import type { ElkNode } from '../../../src/core/elk/proxy/graph/ElkNode.js';

/** `ElkPadding(topPadding, 15, 15, 15)`: `CucaDiagramFileMakerElk.java:333-334`
 *  with `Math.max(25, titleAndAttributeHeight) + 15` = 40 for a bare title. */
const CLUSTER_TOP_PADDING = 40;
const CLUSTER_SIDE_PADDING = 15;

type BackendFactory = () => ElkBackend | Promise<ElkBackend>;

interface Point {
  readonly x: number;
  readonly y: number;
}

function sectionPoints(section: ElkEdgeSection): Point[] {
  return [
    { x: section.getStartX(), y: section.getStartY() },
    ...section.getBendPoints().map((b) => ({ x: b.getX(), y: b.getY() })),
    { x: section.getEndX(), y: section.getEndY() },
  ];
}

function onlySection(edge: ElkEdge): ElkEdgeSection {
  const sections = edge.getSections();
  expect(sections).toHaveLength(1);
  return sections[0]!;
}

function position(node: ElkNode): Point {
  return { x: node.getX(), y: node.getY() };
}

/** `CucaDiagramFileMakerElk.java:481-482`: the root every maker graph starts from. */
function downRoot(elk: ElkBackend): ElkNode {
  const root = elk.createGraph();
  root.setProperty(CoreOptions.DIRECTION, Direction.DOWN);
  return root;
}

function sizedNode(elk: ElkBackend, parent: ElkNode, width: number, height: number): ElkNode {
  const node = elk.createNode(parent);
  node.setDimensions(width, height);
  return node;
}

/** `CucaDiagramFileMakerElk.java:326-338`: one cluster, as `printAllSubgroups` makes it. */
function cluster(elk: ElkBackend, parent: ElkNode): ElkNode {
  const node = elk.createNode(parent);
  node.setProperty(CoreOptions.DIRECTION, Direction.DOWN);
  node.setProperty(
    CoreOptions.PADDING,
    new ElkPadding(CLUSTER_TOP_PADDING, CLUSTER_SIDE_PADDING, CLUSTER_SIDE_PADDING, CLUSTER_SIDE_PADDING),
  );
  elk.createLabel(node).setText('C');
  return node;
}

function layout(elk: ElkBackend, root: ElkNode): void {
  new RecursiveGraphLayoutEngine(elk).layout(root, new NullElkProgressMonitor());
}

function twoNodeCases(backend: () => ElkBackend): void {
  it('lays out a 2-node DOWN graph at the jar coordinates', () => {
    const elk = backend();
    const root = downRoot(elk);
    const a = sizedNode(elk, root, 100, 50);
    const b = sizedNode(elk, root, 80, 40);
    const edge = elk.createSimpleEdge(a, b);
    layout(elk, root);

    expect(position(a)).toEqual({ x: 12, y: 12 });
    expect(position(b)).toEqual({ x: 22, y: 82 });
    expect([root.getWidth(), root.getHeight()]).toEqual([124, 134]);
    expect([a.getWidth(), a.getHeight()]).toEqual([100, 50]);
    expect(edge.getContainingNode()).toBe(root);
    expect(sectionPoints(onlySection(edge))).toEqual([
      { x: 62, y: 62 },
      { x: 62, y: 82 },
    ]);
  });

  it('places an inline centre label and a TAIL label where the jar does', () => {
    const elk = backend();
    const root = downRoot(elk);
    const a = sizedNode(elk, root, 100, 50);
    const b = sizedNode(elk, root, 80, 40);
    const edge = elk.createSimpleEdge(a, b);
    // CucaDiagramFileMakerElk.java:422-427, then :434-441.
    const centre = elk.createLabel(edge);
    centre.setText('X');
    centre.setDimensions(40, 15);
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);
    const tail = elk.createLabel(edge);
    tail.setText('1');
    tail.setDimensions(8, 13);
    tail.setProperty(CoreOptions.EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.TAIL);
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);
    layout(elk, root);

    expect(edge.getLabels().map((l) => [l.getText(), l.getX(), l.getY()])).toEqual([
      ['X', 20, 97],
      ['1', 65, 64],
    ]);
    expect(position(b)).toEqual({ x: 22, y: 132 });
    expect(sectionPoints(onlySection(edge))).toEqual([
      { x: 62, y: 62 },
      { x: 62, y: 132 },
    ]);
  });
}

function sectionCases(backend: () => ElkBackend): void {
  it('returns section start, bend and end points for a layer-skipping edge', () => {
    const elk = backend();
    const root = downRoot(elk);
    const a = sizedNode(elk, root, 100, 50);
    const b = sizedNode(elk, root, 80, 40);
    const c = sizedNode(elk, root, 60, 30);
    elk.createSimpleEdge(a, b);
    elk.createSimpleEdge(b, c);
    const skip = elk.createSimpleEdge(a, c);
    layout(elk, root);

    expect(position(b)).toEqual({ x: 38.66666666666666, y: 82 });
    expect(position(c)).toEqual({ x: 38.66666666666666, y: 142 });
    expect([root.getWidth(), root.getHeight()]).toEqual([130.66666666666666, 184]);
    expect(sectionPoints(onlySection(skip))).toEqual([
      { x: 45.33333333333333, y: 62 },
      { x: 45.33333333333333, y: 72 },
      { x: 27.666666666666657, y: 72 },
      { x: 27.666666666666657, y: 132 },
      { x: 58.66666666666666, y: 132 },
      { x: 58.66666666666666, y: 142 },
    ]);
  });
}

function clusterCases(backend: () => ElkBackend): void {
  it('offsets a cluster child by ElkPadding(top, 15, 15, 15)', () => {
    const elk = backend();
    const root = downRoot(elk);
    root.setProperty(CoreOptions.HIERARCHY_HANDLING, HierarchyHandling.INCLUDE_CHILDREN);
    const group = cluster(elk, root);
    const child = sizedNode(elk, group, 60, 30);
    layout(elk, root);

    expect(position(group)).toEqual({ x: 12, y: 12 });
    expect([group.getWidth(), group.getHeight()]).toEqual([90, 85]);
    expect(position(child)).toEqual({ x: CLUSTER_SIDE_PADDING, y: CLUSTER_TOP_PADDING });
    expect(child.getParent()).toBe(group);
    expect(group.getParent()).toBe(root);
    expect(root.getParent()).toBeNull();
    expect(group.getLabels().map((l) => l.getText())).toEqual(['C']);
    expect(root.getLabels()).toHaveLength(0);
  });

  it('routes a cross-cluster edge under HierarchyHandling.INCLUDE_CHILDREN in root coordinates', () => {
    const elk = backend();
    const root = downRoot(elk);
    root.setProperty(CoreOptions.HIERARCHY_HANDLING, HierarchyHandling.INCLUDE_CHILDREN);
    const group = cluster(elk, root);
    const inner = sizedNode(elk, group, 60, 30);
    const outer = sizedNode(elk, root, 50, 20);
    const edge = elk.createSimpleEdge(inner, outer);
    layout(elk, root);

    expect(edge.getContainingNode()).toBe(root);
    expect(position(inner)).toEqual({ x: 15, y: 40 });
    expect(position(outer)).toEqual({ x: 32, y: 122 });
    expect(sectionPoints(onlySection(edge))).toEqual([
      { x: 57, y: 82 },
      { x: 57, y: 122 },
    ]);
  });

  it('contains an edge between two children of one cluster in that cluster', () => {
    const elk = backend();
    const root = downRoot(elk);
    const group = cluster(elk, root);
    const edge = elk.createSimpleEdge(sizedNode(elk, group, 10, 10), sizedNode(elk, group, 10, 10));
    expect(edge.getContainingNode()).toBe(group);
  });
}

function proxyEnumSetCases(backend: () => ElkBackend): void {
  // ElkWithProperty.java:30-39 adds the PROXY enums to an EnumSet of the proxy
  // class, so ELK holds `[INSIDE, V_CENTER, H_CENTER]` of
  // `net.sourceforge.plantuml.elk.proxy.core.options.NodeLabelPlacement` and
  // `contains(NodeLabelPlacement.INSIDE)` is false: the placement is not
  // honoured. The jar puts this label at (0, 0); the INTENDED set, passed to
  // ELK directly, centres it at (0, 5).
  it('does not honour a NODE_LABELS_PLACEMENT EnumSet, as the jar does not', () => {
    const elk = backend();
    const root = downRoot(elk);
    const node = sizedNode(elk, root, 100, 50);
    const label = elk.createLabel(node);
    label.setText('X');
    label.setDimensions(100, 40);
    label.setProperty(
      CoreOptions.NODE_LABELS_PLACEMENT,
      new Set([NodeLabelPlacement.INSIDE, NodeLabelPlacement.H_CENTER, NodeLabelPlacement.V_CENTER]),
    );
    layout(elk, root);

    expect([label.getX(), label.getY()]).toEqual([0, 0]);
    expect([root.getWidth(), root.getHeight()]).toEqual([124, 74]);
  });
}

function repeatCases(backend: () => ElkBackend): void {
  it('lays out a second graph on the same backend identically', () => {
    const elk = backend();
    const results = [0, 1].map(() => {
      const root = downRoot(elk);
      const a = sizedNode(elk, root, 100, 50);
      const b = sizedNode(elk, root, 80, 40);
      elk.createSimpleEdge(a, b);
      layout(elk, root);
      return [position(a), position(b)];
    });
    expect(results[1]).toEqual(results[0]);
    expect(results[0]).toEqual([
      { x: 12, y: 12 },
      { x: 22, y: 82 },
    ]);
  });
}

/** Run the `ElkBackend` contract against one backend. */
export function runElkBackendContract(name: string, makeBackend: BackendFactory): void {
  describe(`ElkBackend contract: ${name}`, () => {
    let elk: ElkBackend | undefined;
    beforeAll(async () => {
      elk = await makeBackend();
    });
    const backend = (): ElkBackend => {
      if (elk === undefined) throw new Error('backend not created');
      return elk;
    };
    twoNodeCases(backend);
    sectionCases(backend);
    clusterCases(backend);
    proxyEnumSetCases(backend);
    repeatCases(backend);
  });
}
