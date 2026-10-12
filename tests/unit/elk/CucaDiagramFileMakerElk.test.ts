/**
 * `CucaDiagramFileMakerElk` port (cdd8 T2a): the ELK graph the maker builds,
 * call by call, against `CucaDiagramFileMakerElk.java`, and cadutu's node
 * positions through elkjs against the T0c spike's PASS table.
 */
import { describe, expect, it } from 'vitest';

import { GroupType } from '../../../src/core/abel/GroupType.js';
import { LeafType } from '../../../src/core/abel/LeafType.js';
import {
  CucaDiagramFileMakerElk,
  getPosition,
  makeElkLayout,
  type ElkMakerMaps,
  type MyElkDrawingFactory,
} from '../../../src/core/elk/CucaDiagramFileMakerElk.js';
import type { ElkBackend } from '../../../src/core/elk/elk-backend.js';
import type { ElkClusterHeader, ElkDiagramAdapter } from '../../../src/core/elk/ElkDiagramAdapter.js';
import type { ElkPropertyValue, IProperty } from '../../../src/core/elk/elk-object.js';
import { loadElk } from '../../../src/core/elk/load-elk.js';
import type { ElkEdge } from '../../../src/core/elk/proxy/graph/ElkEdge.js';
import type { ElkLabel } from '../../../src/core/elk/proxy/graph/ElkLabel.js';
import type { ElkNode } from '../../../src/core/elk/proxy/graph/ElkNode.js';
import { trueValueOf, type ElkPropertyArgument } from '../../../src/core/elk/proxy/graph/ElkWithProperty.js';
import type { StringBounder } from '../../../src/core/klimt/font/StringBounder.js';
import type { MinMax } from '../../../src/core/klimt/geom/MinMax.js';
import { XDimension2D } from '../../../src/core/klimt/geom/XDimension2D.js';
import { URectangle } from '../../../src/core/klimt/shape/URectangle.js';
import type { TextBlock } from '../../../src/core/klimt/shape/TextBlock.js';
import type { UDrawable } from '../../../src/core/klimt/shape/UDrawable.js';
import { UTranslate } from '../../../src/core/klimt/UTranslate.js';

// ---------------------------------------------------------------------------
// A synthetic diagram behind the adapter
// ---------------------------------------------------------------------------

const ROOT = 'root';

type Dim = readonly [width: number, height: number];

interface FakeGroup {
  readonly id: string;
  readonly parent: string;
  readonly type: GroupType;
  readonly titleAndAttributeHeight: number;
  readonly empty?: true;
  readonly removed?: true;
  readonly dim?: Dim;
}

interface FakeLeaf {
  readonly id: string;
  readonly parent: string;
  readonly dim: Dim;
  readonly removed?: true;
}

interface FakeLink {
  readonly id: string;
  readonly from: string;
  readonly to: string;
  readonly label: Dim;
  readonly quantifier1?: { readonly text: string; readonly block: Dim | null };
  readonly role1?: { readonly text: string; readonly block: Dim | null };
  readonly quantifier2?: { readonly text: string; readonly block: Dim | null };
  readonly role2?: { readonly text: string; readonly block: Dim | null };
}

interface FakeDiagram {
  readonly groups: readonly FakeGroup[];
  readonly leaves: readonly FakeLeaf[];
  readonly links: readonly FakeLink[];
}

const STRING_BOUNDER: StringBounder = {
  calculateDimension: () => {
    throw new Error('the maker measures only through the adapter');
  },
};

function block([width, height]: Dim): TextBlock {
  return { calculateDimension: () => new XDimension2D(width, height), drawU: () => undefined };
}

function notRead(member: string): () => never {
  return () => {
    throw new Error(`${member} is not read by CucaDiagramFileMakerElk`);
  };
}

function byId<T extends { readonly id: string }>(items: readonly T[], id: string): T {
  const found = items.find((i) => i.id === id);
  if (found === undefined) throw new Error(`no ${id}`);
  return found;
}

function endBlock(end: { readonly block: Dim | null } | undefined): TextBlock | null {
  return end?.block == null ? null : block(end.block);
}

function header(height: number): ElkClusterHeader {
  return { getTitleAndAttributeHeight: () => height, getTitle: notRead('getTitle'), getStereo: notRead('getStereo') };
}

/** The adapter members the maker reads, over `diagram`; every other member throws. */
function fakeAdapter(diagram: FakeDiagram, muted: string[] = []): ElkDiagramAdapter {
  const link = (id: string): FakeLink => byId(diagram.links, id);
  const entityDim = (id: string): Dim => diagram.leaves.find((l) => l.id === id)?.dim ?? byId(diagram.groups, id).dim!;
  const entity = (id: string): FakeGroup | FakeLeaf =>
    diagram.leaves.find((l) => l.id === id) ?? byId(diagram.groups, id);
  return {
    ...drawingMembersNotRead(),
    getDefaultStringBounder: () => STRING_BOUNDER,
    getRootGroup: () => ROOT,
    leafs: () => diagram.leaves.map((l) => l.id),
    getChildrenGroups: (g) => diagram.groups.filter((c) => c.parent === g).map((c) => c.id),
    isEmpty: (g) => byId(diagram.groups, g).empty === true,
    getLinks: () => diagram.links.map((l) => l.id),
    isRemoved: (id) => entity(id).removed === true,
    getGroupType: (g) => byId(diagram.groups, g).type,
    muteToType: (g, type) => muted.push(`${g}:${type}`),
    groupLeafs: (g) => diagram.leaves.filter((l) => l.parent === g).map((l) => l.id),
    getParentContainer: (id) => entity(id).parent,
    calculateDimension: (id) => new XDimension2D(...entityDim(id)),
    getClusterHeader: (g) => header(byId(diagram.groups, g).titleAndAttributeHeight),
    getEntity1: (id) => link(id).from,
    getEntity2: (id) => link(id).to,
    getQuantifier1: (id) => link(id).quantifier1?.text ?? null,
    getQuantifier2: (id) => link(id).quantifier2?.text ?? null,
    getRole1: (id) => link(id).role1?.text ?? null,
    getRole2: (id) => link(id).role2?.text ?? null,
    getLabel: (id) => block(link(id).label),
    getQuantifier: (id, n) => endBlock(n === 1 ? link(id).quantifier1 : link(id).quantifier2),
    getRoleLabel: (id, n) => endBlock(n === 1 ? link(id).role1 : link(id).role2),
  };
}

function drawingMembersNotRead(): Omit<
  ElkDiagramAdapter,
  | 'getDefaultStringBounder'
  | 'getRootGroup'
  | 'leafs'
  | 'getChildrenGroups'
  | 'isEmpty'
  | 'getLinks'
  | 'isRemoved'
  | 'getGroupType'
  | 'muteToType'
  | 'groupLeafs'
  | 'getParentContainer'
  | 'calculateDimension'
  | 'getClusterHeader'
  | 'getEntity1'
  | 'getEntity2'
  | 'getQuantifier1'
  | 'getQuantifier2'
  | 'getRole1'
  | 'getRole2'
  | 'getLabel'
  | 'getQuantifier'
  | 'getRoleLabel'
> {
  return {
    getUSymbol: notRead('getUSymbol'),
    getPackageStyle: notRead('getPackageStyle'),
    getEntityColors: notRead('getEntityColors'),
    drawLeaf: notRead('drawLeaf'),
    getMagneticBorder: notRead('getMagneticBorder'),
    getClusterStyle: notRead('getClusterStyle'),
    getClusterStyleForMagneticBorder: notRead('getClusterStyleForMagneticBorder'),
    getClusterBackColor: notRead('getClusterBackColor'),
    packageStyle: notRead('packageStyle'),
    getPackageTitleAlignment: notRead('getPackageTitleAlignment'),
    getStereotypeAlignment: notRead('getStereotypeAlignment'),
    getArrowThickness: notRead('getArrowThickness'),
    isInvis: notRead('isInvis'),
    isHidden: notRead('isHidden'),
    getType: notRead('getType'),
    getArrowStyle: notRead('getArrowStyle'),
    getLinkColors: notRead('getLinkColors'),
    getSpecificColor: notRead('getSpecificColor'),
  };
}

// ---------------------------------------------------------------------------
// A backend that records every call the maker makes
// ---------------------------------------------------------------------------

function formatValue(value: ElkPropertyValue | null): string {
  if (value === null) return 'null';
  if (typeof value !== 'object') return String(value);
  if (value.kind === 'enum') return `${value.className.split('.').pop()}.${value.name}`;
  if (value.kind === 'ElkPadding') return `ElkPadding(${value.top},${value.right},${value.bottom},${value.left})`;
  return `EnumSet<proxy ${value.proxyClassName.split('.').pop()}>[${value.names.join(',')}]`;
}

class RecordingElement {
  readonly labels: ElkLabel[] = [];
  x = 0;
  y = 0;
  constructor(
    readonly name: string,
    readonly parent: RecordingNode | null,
    protected readonly calls: string[],
  ) {}
  setProperty(key: IProperty, value: ElkPropertyArgument): void {
    this.calls.push(`${this.name}.setProperty(${key.id}, ${formatValue(trueValueOf(value))})`);
  }
  setDimensions(width: number, height: number): void {
    this.calls.push(`${this.name}.setDimensions(${width},${height})`);
  }
  getX(): number {
    return this.x;
  }
  getY(): number {
    return this.y;
  }
  getLabels(): readonly ElkLabel[] {
    return this.labels;
  }
}

class RecordingNode extends RecordingElement implements ElkNode {
  getParent(): ElkNode | null {
    return this.parent;
  }
  getWidth(): number {
    return 0;
  }
  getHeight(): number {
    return 0;
  }
}

class RecordingLabel extends RecordingElement implements ElkLabel {
  private text = '';
  setText(text: string): void {
    this.text = text;
    this.calls.push(`${this.name}.setText(${text})`);
  }
  getText(): string {
    return this.text;
  }
}

class RecordingEdge extends RecordingElement implements ElkEdge {
  getContainingNode(): ElkNode {
    return this.parent!;
  }
  getSections(): never[] {
    return [];
  }
  isHierarchical(): boolean {
    throw new Error('UnsupportedOperationException');
  }
}

/** `element` as the recording type that built it; the maker only passes back what the backend made. */
function recorded<T extends RecordingElement>(element: object, type: new (...args: never[]) => T): T {
  if (!(element instanceof type)) throw new Error('the maker passed an element this backend did not create');
  return element;
}

class RecordingBackend implements ElkBackend {
  readonly calls: string[] = [];
  private count = 0;
  private nextName(): string {
    this.count += 1;
    return `n${this.count}`;
  }
  createGraph(): ElkNode {
    const node = new RecordingNode(this.nextName(), null, this.calls);
    this.calls.push(`createGraph() -> ${node.name}`);
    return node;
  }
  createNode(root: ElkNode): ElkNode {
    const parent = recorded(root, RecordingNode);
    const node = new RecordingNode(this.nextName(), parent, this.calls);
    this.calls.push(`createNode(${parent.name}) -> ${node.name}`);
    return node;
  }
  createLabel(owner: ElkEdge | ElkNode): ElkLabel {
    const parent = recorded(owner, RecordingElement);
    const label = new RecordingLabel(this.nextName(), null, this.calls);
    parent.labels.push(label);
    this.calls.push(`createLabel(${parent.name}) -> ${label.name}`);
    return label;
  }
  createSimpleEdge(node1: ElkNode, node2: ElkNode): ElkEdge {
    const [a, b] = [recorded(node1, RecordingNode), recorded(node2, RecordingNode)];
    const edge = new RecordingEdge(this.nextName(), a.parent, this.calls);
    this.calls.push(`createSimpleEdge(${a.name},${b.name}) -> ${edge.name}`);
    return edge;
  }
  layout(root: ElkNode): void {
    this.calls.push(`layout(${recorded(root, RecordingNode).name})`);
  }
}

const NOTHING_DRAWN: MyElkDrawingFactory = () => ({ drawU: () => undefined });

const DIRECTION = 'org.eclipse.elk.direction';
const PADDING = 'org.eclipse.elk.padding';
const NODE_LABELS_PLACEMENT = 'org.eclipse.elk.nodeLabels.placement';
const EDGE_LABELS_INLINE = 'org.eclipse.elk.edgeLabels.inline';
const EDGE_LABELS_PLACEMENT = 'org.eclipse.elk.edgeLabels.placement';
/** `CucaDiagramFileMakerElk.java:397-398` through the proxy's EnumSet (`ElkWithProperty.java:30-39`). */
const PROXY_NODE_LABEL_SET = 'EnumSet<proxy NodeLabelPlacement>[INSIDE,V_CENTER,H_CENTER]';

/** 2 leaves, 1 group, 1 labelled link with a tail quantifier and a head role. */
const SYNTHETIC: FakeDiagram = {
  groups: [{ id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 30 }],
  leaves: [
    { id: 'A', parent: 'P', dim: [50, 40] },
    { id: 'B', parent: ROOT, dim: [60, 30] },
  ],
  links: [
    {
      id: 'L',
      from: 'A',
      to: 'B',
      label: [30, 17],
      quantifier1: { text: '1', block: [7, 13] },
      role2: { text: 'role', block: [20, 13] },
    },
  ],
};

function record(diagram: FakeDiagram): { calls: string[]; maps: ElkMakerMaps; muted: string[] } {
  const backend = new RecordingBackend();
  const muted: string[] = [];
  const maps = makeElkLayout(fakeAdapter(diagram, muted), backend, NOTHING_DRAWN);
  return { calls: backend.calls, maps, muted };
}

describe('CucaDiagramFileMakerElk: the graph, call by call', () => {
  it('makes the property calls of CucaDiagramFileMakerElk.java, in its order', () => {
    expect(record(SYNTHETIC).calls).toEqual([
      // :481-483 the root
      'createGraph() -> n1',
      `n1.setProperty(${DIRECTION}, Direction.DOWN)`,
      'n1.setProperty(org.eclipse.elk.hierarchyHandling, HierarchyHandling.INCLUDE_CHILDREN)',
      // :488 printAllSubgroups -> :326-338 cluster P; max(25, 30) + 15 = 45
      'createNode(n1) -> n2',
      `n2.setProperty(${DIRECTION}, Direction.DOWN)`,
      `n2.setProperty(${PADDING}, ElkPadding(45,15,15,15))`,
      'createLabel(n2) -> n3',
      'n3.setText(C)',
      // :352 -> :384-398 leaf A inside P; label height 40 - VERY_STRANGE_OFFSET
      'createNode(n2) -> n4',
      'n4.setDimensions(50,40)',
      'createLabel(n4) -> n5',
      'n5.setText(X)',
      'n5.setDimensions(50,30)',
      `n5.setProperty(${NODE_LABELS_PLACEMENT}, ${PROXY_NODE_LABEL_SET})`,
      // :489 unpackaged leaf B
      'createNode(n1) -> n6',
      'n6.setDimensions(60,30)',
      'createLabel(n6) -> n7',
      'n7.setText(X)',
      'n7.setDimensions(60,20)',
      `n7.setProperty(${NODE_LABELS_PLACEMENT}, ${PROXY_NODE_LABEL_SET})`,
      // :418-427 the edge and its centre label
      'createSimpleEdge(n4,n6) -> n8',
      'createLabel(n8) -> n9',
      'n9.setText(X)',
      'n9.setDimensions(30,17)',
      `n8.setProperty(${EDGE_LABELS_INLINE}, true)`,
      // :430-441 tail: quantifier "1"
      'createLabel(n8) -> n10',
      'n10.setText(1)',
      'n10.setDimensions(7,13)',
      `n10.setProperty(${EDGE_LABELS_PLACEMENT}, EdgeLabelPlacement.TAIL)`,
      `n8.setProperty(${EDGE_LABELS_INLINE}, true)`,
      // :444-455 head: no quantifier, so the role sizes the label
      'createLabel(n8) -> n11',
      'n11.setText(2)',
      'n11.setDimensions(20,13)',
      `n11.setProperty(${EDGE_LABELS_PLACEMENT}, EdgeLabelPlacement.HEAD)`,
      `n8.setProperty(${EDGE_LABELS_INLINE}, true)`,
      // :493
      'layout(n1)',
    ]);
  });

  it('keys the three maps by entity and link id, in insertion order', () => {
    const { maps } = record(SYNTHETIC);
    expect([...maps.clusters.keys()]).toEqual(['P']);
    expect([...maps.nodes.keys()]).toEqual(['A', 'B']);
    expect([...maps.edges.keys()]).toEqual(['L']);
    expect(recorded(maps.clusters.get('P')!, RecordingNode).name).toBe('n2');
    expect(recorded(maps.nodes.get('A')!, RecordingNode).name).toBe('n4');
    expect(recorded(maps.edges.get('L')!, RecordingEdge).name).toBe('n8');
  });

  it('uses a 25 title floor for the cluster padding (:333)', () => {
    const diagram: FakeDiagram = {
      groups: [{ id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 16 }],
      leaves: [{ id: 'A', parent: 'P', dim: [10, 20] }],
      links: [],
    };
    expect(record(diagram).calls).toContain(`n2.setProperty(${PADDING}, ElkPadding(40,15,15,15))`);
  });

  it('turns an empty package into a node of its parent (:320-322)', () => {
    const diagram: FakeDiagram = {
      groups: [
        { id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 16 },
        { id: 'E', parent: 'P', type: GroupType.PACKAGE, titleAndAttributeHeight: 16, empty: true, dim: [70, 30] },
      ],
      leaves: [{ id: 'A', parent: 'P', dim: [10, 20] }],
      links: [],
    };
    const { calls, maps, muted } = record(diagram);
    expect(muted).toEqual([`E:${LeafType.EMPTY_PACKAGE}`]);
    expect([...maps.clusters.keys()]).toEqual(['P']);
    expect([...maps.nodes.keys()]).toEqual(['A', 'E']);
    expect(calls.slice(8, 14)).toEqual([
      'createNode(n2) -> n4',
      'n4.setDimensions(10,20)',
      'createLabel(n4) -> n5',
      'n5.setText(X)',
      'n5.setDimensions(10,10)',
      `n5.setProperty(${NODE_LABELS_PLACEMENT}, ${PROXY_NODE_LABEL_SET})`,
    ]);
    expect(calls).toContain('createNode(n2) -> n6');
    expect(calls).toContain('n6.setDimensions(70,30)');
  });

  it('keeps an empty non-package group as a cluster', () => {
    const diagram: FakeDiagram = {
      groups: [{ id: 'S', parent: ROOT, type: GroupType.STATE, titleAndAttributeHeight: 16, empty: true }],
      leaves: [],
      links: [],
    };
    expect([...record(diagram).maps.clusters.keys()]).toEqual(['S']);
  });

  it('skips removed groups and leaves (:317-318, :359-360)', () => {
    const diagram: FakeDiagram = {
      groups: [{ id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 16, removed: true }],
      leaves: [
        { id: 'A', parent: ROOT, dim: [10, 20] },
        { id: 'R', parent: ROOT, dim: [10, 20], removed: true },
      ],
      links: [],
    };
    const { maps } = record(diagram);
    expect([...maps.clusters.keys()]).toEqual([]);
    expect([...maps.nodes.keys()]).toEqual(['A']);
  });

  it('creates a concurrent-state cluster but prints nothing inside it (:349-350)', () => {
    const diagram: FakeDiagram = {
      groups: [
        { id: 'C', parent: ROOT, type: GroupType.CONCURRENT_STATE, titleAndAttributeHeight: 16 },
        { id: 'Inner', parent: 'C', type: GroupType.STATE, titleAndAttributeHeight: 16 },
      ],
      leaves: [{ id: 'A', parent: 'C', dim: [10, 20] }],
      links: [],
    };
    const { maps } = record(diagram);
    expect([...maps.clusters.keys()]).toEqual(['C']);
    expect([...maps.nodes.keys()]).toEqual([]);
  });

  it('prints a group before its sub-groups, and root groups before root leaves (:352-353, :488-489)', () => {
    const diagram: FakeDiagram = {
      groups: [
        { id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 16 },
        { id: 'Q', parent: 'P', type: GroupType.PACKAGE, titleAndAttributeHeight: 16 },
      ],
      leaves: [
        { id: 'top', parent: ROOT, dim: [10, 20] },
        { id: 'inQ', parent: 'Q', dim: [10, 20] },
        { id: 'inP', parent: 'P', dim: [10, 20] },
      ],
      links: [],
    };
    const { maps } = record(diagram);
    expect([...maps.clusters.keys()]).toEqual(['P', 'Q']);
    expect([...maps.nodes.keys()]).toEqual(['inP', 'inQ', 'top']);
  });

  it('links to a cluster through getElkNode (:307-313)', () => {
    const diagram: FakeDiagram = {
      groups: [{ id: 'P', parent: ROOT, type: GroupType.PACKAGE, titleAndAttributeHeight: 16 }],
      leaves: [
        { id: 'A', parent: 'P', dim: [10, 20] },
        { id: 'B', parent: ROOT, dim: [10, 20] },
      ],
      links: [{ id: 'L', from: 'B', to: 'P', label: [0, 0] }],
    };
    const { calls } = record(diagram);
    expect(calls).toContain('createSimpleEdge(n6,n2) -> n8');
    expect(calls).toContain('n9.setDimensions(0,0)');
  });

  it('sizes the tail label by the role when the quantifier block is absent (:433)', () => {
    const diagram: FakeDiagram = {
      groups: [],
      leaves: [
        { id: 'A', parent: ROOT, dim: [10, 20] },
        { id: 'B', parent: ROOT, dim: [10, 20] },
      ],
      links: [
        {
          id: 'L',
          from: 'A',
          to: 'B',
          label: [0, 0],
          quantifier1: { text: '', block: null },
          role1: { text: 'r', block: [6, 13] },
          quantifier2: { text: 'q', block: [8, 13] },
          role2: { text: 's', block: [9, 13] },
        },
      ],
    };
    const { calls } = record(diagram);
    expect(calls).toContain('n8.setDimensions(6,13)');
    expect(calls).toContain('n9.setDimensions(8,13)');
  });

  it('fails like the jar when a link end has no ELK node (NPE in ElkGraphUtil.createSimpleEdge)', () => {
    const diagram: FakeDiagram = {
      groups: [],
      leaves: [
        { id: 'A', parent: ROOT, dim: [10, 20] },
        { id: 'R', parent: ROOT, dim: [10, 20], removed: true },
      ],
      links: [{ id: 'L', from: 'A', to: 'R', label: [0, 0] }],
    };
    expect(() => record(diagram)).toThrow('CucaDiagramFileMakerElk: link L has no ELK node for R');
  });

  it('fails like the jar when an end label has neither block (NPE at :435 / :449)', () => {
    const diagram: FakeDiagram = {
      groups: [],
      leaves: [
        { id: 'A', parent: ROOT, dim: [10, 20] },
        { id: 'B', parent: ROOT, dim: [10, 20] },
      ],
      links: [{ id: 'L', from: 'A', to: 'B', label: [0, 0], quantifier2: { text: '', block: null } }],
    };
    expect(() => record(diagram)).toThrow('CucaDiagramFileMakerElk: link L end 2 has no label block to lay out');
  });
});

describe('CucaDiagramFileMakerElk: MinMax and getPosition', () => {
  it('measures a MyElkDrawing built with a null MinMax (:495-496)', () => {
    const seen: { minMax: MinMax | null; maps: ElkMakerMaps }[] = [];
    const drawing: MyElkDrawingFactory = (_adapter, minMax, maps): UDrawable => {
      seen.push({ minMax, maps });
      return { drawU: (ug) => ug.apply(new UTranslate(3, 4)).draw(URectangle.build(10, 5)) };
    };
    const result = makeElkLayout(fakeAdapter(SYNTHETIC), new RecordingBackend(), drawing);
    expect(seen).toHaveLength(1);
    expect(seen[0]!.minMax).toBeNull();
    expect(seen[0]!.maps.nodes).toBe(result.nodes);
    expect(seen[0]!.maps.clusters).toBe(result.clusters);
    expect(seen[0]!.maps.edges).toBe(result.edges);
    // LimitFinder rectangle: (x - 1, y - 1) .. (x + w - 1, y + h - 1); initToZero false
    expect(result.minMax.getMinX()).toBe(2);
    expect(result.minMax.getMinY()).toBe(3);
    expect(result.minMax.getMaxX()).toBe(12);
    expect(result.minMax.getMaxY()).toBe(8);
  });

  it('exposes the maker class as upstream names it', () => {
    const maker = new CucaDiagramFileMakerElk(fakeAdapter(SYNTHETIC), new RecordingBackend());
    expect([...maker.getTextBlock(NOTHING_DRAWN).nodes.keys()]).toEqual(['A', 'B']);
  });

  it('returns raw coordinates under the root, and adds labelled parents (:281-296)', () => {
    const calls: string[] = [];
    const root = new RecordingNode('root', null, calls);
    const cluster = new RecordingNode('cluster', root, calls);
    cluster.labels.push(new RecordingLabel('C', null, calls));
    Object.assign(cluster, { x: 10, y: 20 });
    const inner = new RecordingNode('inner', cluster, calls);
    Object.assign(inner, { x: 3, y: 4 });
    const top = new RecordingNode('top', root, calls);
    Object.assign(top, { x: 7, y: 8 });
    const unlabelled = new RecordingNode('unlabelled', root, calls);
    Object.assign(unlabelled, { x: 100, y: 100 });
    const underUnlabelled = new RecordingNode('under', unlabelled, calls);
    Object.assign(underUnlabelled, { x: 1, y: 2 });

    expect(getPosition(inner)).toEqual({ x: 13, y: 24 });
    expect(getPosition(top)).toEqual({ x: 7, y: 8 });
    expect(getPosition(cluster)).toEqual({ x: 10, y: 20 });
    expect(getPosition(root)).toEqual({ x: 0, y: 0 });
    // the "nasty test" (:288): a parent without labels counts as the root
    expect(getPosition(underUnlabelled)).toEqual({ x: 1, y: 2 });
  });
});

// ---------------------------------------------------------------------------
// cadutu-02-lazu601 through elkjs
// ---------------------------------------------------------------------------

/** Entity rect sizes from the jar's `in.svg` (test-results/dot-cache/class/cadutu-02-lazu601). */
const CADUTU_LEAVES: readonly FakeLeaf[] = [
  { id: 'foo1', parent: ROOT, dim: [59.212, 48] },
  { id: 'foo2', parent: ROOT, dim: [59.212, 48] },
  { id: 'foo', parent: ROOT, dim: [51.425, 48] },
  { id: 'bar', parent: ROOT, dim: [52.212, 48] },
  { id: 'bar2', parent: ROOT, dim: [60, 48] },
];

/** `StringBounderFromWidthTable.java:71`: a 13 pt line is 13 high. */
const LINE_HEIGHT_13 = 13;

/** Centre label: creole block + `withMargin(1, 1)` twice (`:182`, `:233`), as the T0c spike sizes it. */
function centreLabel(lineWidths: readonly number[]): Dim {
  return [Math.max(...lineWidths) + 4, lineWidths.length * LINE_HEIGHT_13 + 4];
}

function endLabel(text: string, width: number): { text: string; block: Dim } {
  return { text, block: [width, LINE_HEIGHT_13] };
}

/**
 * Text widths: the jar's `textLength`s, and for "1" and "*" (no textLength in
 * the SVG) the full-precision table widths of `spike/text-widths.json`.
 */
const CADUTU: FakeDiagram = {
  groups: [],
  leaves: CADUTU_LEAVES,
  links: [
    { id: 'lnk3', from: 'foo1', to: 'foo2', label: centreLabel([59.963]) },
    {
      id: 'lnk6',
      from: 'foo',
      to: 'bar',
      label: centreLabel([92.463, 134.306, 74.344]),
      quantifier1: endLabel('1', 7.231249809265137),
      quantifier2: endLabel('*', 5.037499904632568),
    },
    {
      id: 'lnk8',
      from: 'foo',
      to: 'bar2',
      label: centreLabel([27.544]),
      quantifier1: endLabel('foo', 18.038),
      quantifier2: endLabel('bar', 18.769),
    },
  ],
};

/** T0c's PASS table (cdd8 orchestrator; `.agent-notes/cdd8-T0c.md`). */
const CADUTU_PASS: Readonly<Record<string, readonly [number, number]>> = {
  foo1: [48.357, 12],
  foo2: [48.357, 173],
  foo: [212.127, 12],
  bar: [203.163, 173],
  bar2: [275.375, 173],
};

const round3 = (v: number): number => Math.round(v * 1000) / 1000;

describe('CucaDiagramFileMakerElk: cadutu-02-lazu601 through elkjs', () => {
  it("places every node where the T0c spike's PASS table does", async () => {
    const result = makeElkLayout(fakeAdapter(CADUTU), await loadElk(), NOTHING_DRAWN);
    const positions = Object.fromEntries(
      [...result.nodes].map(([id, node]) => {
        const p = getPosition(node);
        return [id, [round3(p.x), round3(p.y)]];
      }),
    );
    expect(positions).toEqual(CADUTU_PASS);
  });
});
