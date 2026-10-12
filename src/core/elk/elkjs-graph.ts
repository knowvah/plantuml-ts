/**
 * The elkjs backend's in-memory ELK graph: plain objects implementing the
 * proxy interfaces, holding exactly the state an `org.eclipse.elk.graph`
 * model would (dimensions, location, labels, children, contained edges,
 * properties). `elkjs-json.ts` serialises it for elkjs and writes the layout
 * back.
 *
 * Mutation contract: the maker mutates these objects while it builds the
 * graph, then `ElkjsBackend#layout` overwrites the layout fields in place —
 * the build-then-read sequence upstream's `getTextBlock` follows
 * (`CucaDiagramFileMakerElk.java:481-498`).
 */
import type { ElkPropertyValue, IProperty } from './elk-object.js';
import type { ElkBendPoint } from './proxy/graph/ElkBendPoint.js';
import type { ElkEdge } from './proxy/graph/ElkEdge.js';
import type { ElkEdgeSection } from './proxy/graph/ElkEdgeSection.js';
import type { ElkLabel } from './proxy/graph/ElkLabel.js';
import type { ElkNode } from './proxy/graph/ElkNode.js';
import { trueValueOf, type ElkPropertyArgument, type ElkWithProperty } from './proxy/graph/ElkWithProperty.js';

export interface ElkjsProperty {
  readonly property: IProperty;
  readonly value: ElkPropertyValue;
}

/** Thrown where ELK's Java would throw; named after the Java exception. */
const UNSUPPORTED_OPERATION = 'UnsupportedOperationException';

class ElkjsElement implements ElkWithProperty {
  /** Keyed by option id, insertion-ordered; a second set replaces the first. */
  readonly properties = new Map<string, ElkjsProperty>();

  /** A null true value removes the property, as ELK's `setProperty(p, null)` does
   *  (`org.eclipse.elk.graph.impl.EMapPropertyHolderImpl#setProperty`). */
  setProperty(key: IProperty, value: ElkPropertyArgument): void {
    const trueValue = trueValueOf(value);
    if (trueValue === null) this.properties.delete(key.id);
    else this.properties.set(key.id, { property: key, value: trueValue });
  }
}

export class ElkjsLabel extends ElkjsElement implements ElkLabel {
  text = '';
  x = 0;
  y = 0;
  width = 0;
  height = 0;

  setText(text: string): void {
    this.text = text;
  }
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
  getText(): string {
    return this.text;
  }
  getX(): number {
    return this.x;
  }
  getY(): number {
    return this.y;
  }
}

export class ElkjsBendPoint implements ElkBendPoint {
  constructor(
    private readonly x: number,
    private readonly y: number,
  ) {}

  getX(): number {
    return this.x;
  }
  getY(): number {
    return this.y;
  }
}

export interface ElkjsPoint {
  readonly x: number;
  readonly y: number;
}

export class ElkjsEdgeSection implements ElkEdgeSection {
  constructor(
    private readonly start: ElkjsPoint,
    private readonly end: ElkjsPoint,
    private readonly bendPoints: readonly ElkjsBendPoint[],
  ) {}

  getStartX(): number {
    return this.start.x;
  }
  getStartY(): number {
    return this.start.y;
  }
  getEndX(): number {
    return this.end.x;
  }
  getEndY(): number {
    return this.end.y;
  }
  getBendPoints(): readonly ElkBendPoint[] {
    return this.bendPoints;
  }
}

export class ElkjsNode extends ElkjsElement implements ElkNode {
  x = 0;
  y = 0;
  width = 0;
  height = 0;
  readonly children: ElkjsNode[] = [];
  readonly labels: ElkjsLabel[] = [];
  readonly containedEdges: ElkjsEdge[] = [];

  /** `owner` is the backend that created the node: it lays out only its own graphs. */
  constructor(
    readonly owner: object,
    readonly parent: ElkjsNode | null,
  ) {
    super();
    parent?.children.push(this);
  }

  getParent(): ElkjsNode | null {
    return this.parent;
  }
  getX(): number {
    return this.x;
  }
  getY(): number {
    return this.y;
  }
  getLabels(): readonly ElkjsLabel[] {
    return this.labels;
  }
  getWidth(): number {
    return this.width;
  }
  getHeight(): number {
    return this.height;
  }
  setDimensions(width: number, height: number): void {
    this.width = width;
    this.height = height;
  }
}

export class ElkjsEdge extends ElkjsElement implements ElkEdge {
  readonly labels: ElkjsLabel[] = [];
  sections: ElkjsEdgeSection[] = [];

  /** `containingNode` is null when the two nodes share no root (`findBestEdgeContainment`). */
  constructor(
    readonly source: ElkjsNode,
    readonly target: ElkjsNode,
    readonly containingNode: ElkjsNode | null,
  ) {
    super();
    containingNode?.containedEdges.push(this);
  }

  /** The proxy wraps the result in `new ElkNode(...)`, whose `Objects.requireNonNull` throws on null. */
  getContainingNode(): ElkjsNode {
    if (this.containingNode === null) throw new Error('NullPointerException: edge has no containing node');
    return this.containingNode;
  }
  getLabels(): readonly ElkjsLabel[] {
    return this.labels;
  }
  getSections(): readonly ElkjsEdgeSection[] {
    return this.sections;
  }
  isHierarchical(): boolean {
    throw new Error(UNSUPPORTED_OPERATION);
  }
}

/** `ElkGraphUtil#isDescendant`: not reflexive (elk-worker.js:78750-78760). */
function isDescendant(child: ElkjsNode, ancestor: ElkjsNode): boolean {
  for (let current = child.parent; current !== null; current = current.parent) if (current === ancestor) return true;
  return false;
}

/** `node` and its ancestors, nearest first (`ElkGraphUtil$AncestorIterator`, elk-worker.js:78766-78781). */
function ancestorsOf(node: ElkjsNode): ElkjsNode[] {
  const result: ElkjsNode[] = [];
  for (let current: ElkjsNode | null = node; current !== null; current = current.parent) result.push(current);
  return result;
}

/** `ElkGraphUtil#findLowestCommonAncestor`: walk both ancestor lines from the root down (elk-worker.js:78696-78712). */
function findLowestCommonAncestor(node1: ElkjsNode, node2: ElkjsNode): ElkjsNode | null {
  const ancestors1 = ancestorsOf(node1);
  const ancestors2 = ancestorsOf(node2);
  let commonAncestor: ElkjsNode | null = null;
  for (let i = ancestors1.length - 1, j = ancestors2.length - 1; i >= 0 && j >= 0; i--, j--) {
    if (ancestors1[i] !== ancestors2[j]) break;
    commonAncestor = ancestors1[i]!;
  }
  return commonAncestor;
}

/**
 * `ElkGraphUtil#findBestEdgeContainment` for a simple edge, the only kind
 * `createSimpleEdge` makes: one source, one target, so the 0/1-incident cases
 * cannot arise. ELK 0.12.0, elk-worker.js:78655-78694.
 */
export function findBestEdgeContainment(sourceNode: ElkjsNode, targetNode: ElkjsNode): ElkjsNode | null {
  // :78665-78675, the common non-hyperedge cases.
  if (sourceNode.parent === targetNode.parent) return sourceNode.parent;
  else if (sourceNode === targetNode.parent) return sourceNode;
  else if (targetNode === sourceNode.parent) return targetNode;
  // :78677-78693, the general walk over the incident shapes [source, target].
  let commonAncestor: ElkjsNode | null = sourceNode;
  const incidentNode = targetNode;
  if (incidentNode !== commonAncestor && !isDescendant(incidentNode, commonAncestor)) {
    if (incidentNode.parent === commonAncestor.parent) commonAncestor = incidentNode.parent;
    else commonAncestor = findLowestCommonAncestor(commonAncestor, incidentNode);
  }
  return commonAncestor;
}
