/**
 * The elkjs backend's graph <-> ELK JSON conversion.
 *
 * `toElkJson` writes the in-memory graph in the shape elkjs's `JsonImporter`
 * reads (`elkjs/lib/elk-api.d.ts`), and `applyElkJson` copies the layout back.
 * Every edge is declared in its containing node's `edges`, so with elkjs's
 * default `org.eclipse.elk.json.edgeCoords` (`CONTAINER`, elk-worker.js:
 * 77394-77399) and `shapeCoords` (`PARENT`, :77383-77388) every coordinate
 * comes back in the frame the Java `ElkGraph` holds it in: nodes and node
 * labels relative to the parent, edge sections and edge labels relative to
 * the edge's containing node.
 */
import { ElkBackendError } from './elk-backend.js';
import { encodeOptionValue } from './elkjs-options.js';
import {
  ElkjsBendPoint,
  ElkjsEdgeSection,
  type ElkjsEdge,
  type ElkjsLabel,
  type ElkjsNode,
  type ElkjsPoint,
  type ElkjsProperty,
} from './elkjs-graph.js';

type LayoutOptions = Record<string, string>;

export interface ElkJsonLabel {
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layoutOptions: LayoutOptions;
}

export interface ElkJsonEdge {
  id: string;
  sources: [string];
  targets: [string];
  layoutOptions: LayoutOptions;
  labels: ElkJsonLabel[];
  /** Written by elkjs. */
  sections?: unknown;
  /** Written by elkjs: the id of the node the coordinates are relative to. */
  container?: unknown;
}

export interface ElkJsonNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  layoutOptions: LayoutOptions;
  labels: ElkJsonLabel[];
  children: ElkJsonNode[];
  edges: ElkJsonEdge[];
}

export interface ElkJsonGraph {
  readonly graph: ElkJsonNode;
}

function layoutOptionsOf(properties: ReadonlyMap<string, ElkjsProperty>): LayoutOptions {
  const options: LayoutOptions = {};
  for (const [id, { property, value }] of properties) options[id] = encodeOptionValue(property, value);
  return options;
}

function labelJson(label: ElkjsLabel): ElkJsonLabel {
  const { text, x, y, width, height } = label;
  return { text, x, y, width, height, layoutOptions: layoutOptionsOf(label.properties) };
}

/** Pre-order ids, so a node's id never depends on where its edges are declared. */
function assignNodeIds(node: ElkjsNode, ids: Map<ElkjsNode, string>): void {
  ids.set(node, `n${ids.size}`);
  for (const child of node.children) assignNodeIds(child, ids);
}

function idOf(node: ElkjsNode, ids: ReadonlyMap<ElkjsNode, string>): string {
  const id = ids.get(node);
  if (id === undefined) throw new ElkBackendError('an edge connects a node outside the graph being laid out');
  return id;
}

interface Serialiser {
  readonly nodeIds: ReadonlyMap<ElkjsNode, string>;
  edgeCount: number;
}

function edgeJson(edge: ElkjsEdge, s: Serialiser): ElkJsonEdge {
  return {
    id: `e${s.edgeCount++}`,
    sources: [idOf(edge.source, s.nodeIds)],
    targets: [idOf(edge.target, s.nodeIds)],
    layoutOptions: layoutOptionsOf(edge.properties),
    labels: edge.labels.map(labelJson),
  };
}

/** A container's edges before its children's, matching the pre-order of `assignNodeIds`. */
function nodeJson(node: ElkjsNode, s: Serialiser): ElkJsonNode {
  const { x, y, width, height } = node;
  const edges = node.containedEdges.map((edge) => edgeJson(edge, s));
  return {
    id: idOf(node, s.nodeIds),
    x,
    y,
    width,
    height,
    layoutOptions: layoutOptionsOf(node.properties),
    labels: node.labels.map(labelJson),
    children: node.children.map((child) => nodeJson(child, s)),
    edges,
  };
}

export function toElkJson(root: ElkjsNode): ElkJsonGraph {
  const nodeIds = new Map<ElkjsNode, string>();
  assignNodeIds(root, nodeIds);
  return { graph: nodeJson(root, { nodeIds, edgeCount: 0 }) };
}

// ---------------------------------------------------------------------------
// Write-back. The reply is the graph object we sent, mutated by elkjs's
// JsonImporter#transferLayout; it is read structurally and every number
// checked, because it comes from outside this module's types.
// ---------------------------------------------------------------------------

function numberAt(record: unknown, key: string): number {
  const value = typeof record === 'object' && record !== null ? (record as Record<string, unknown>)[key] : undefined;
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    throw new ElkBackendError(`elkjs layout result has no numeric ${key}`);
  }
  return value;
}

function pointAt(record: unknown, key: string): ElkjsPoint {
  const value = typeof record === 'object' && record !== null ? (record as Record<string, unknown>)[key] : undefined;
  return { x: numberAt(value, 'x'), y: numberAt(value, 'y') };
}

function arrayAt(record: object, key: string): readonly unknown[] {
  const value = (record as Record<string, unknown>)[key];
  return Array.isArray(value) ? value : [];
}

function applyLabels(labels: readonly ElkjsLabel[], json: readonly ElkJsonLabel[]): void {
  labels.forEach((label, i) => {
    const out = json[i];
    label.x = numberAt(out, 'x');
    label.y = numberAt(out, 'y');
    label.width = numberAt(out, 'width');
    label.height = numberAt(out, 'height');
  });
}

function sectionOf(json: unknown): ElkjsEdgeSection {
  const bends = typeof json === 'object' && json !== null ? arrayAt(json, 'bendPoints') : [];
  const bendPoints = bends.map((b) => new ElkjsBendPoint(numberAt(b, 'x'), numberAt(b, 'y')));
  return new ElkjsEdgeSection(pointAt(json, 'startPoint'), pointAt(json, 'endPoint'), bendPoints);
}

/** `containerId` is the node whose `edges` declared this edge, and so its containing node. */
function applyEdge(edge: ElkjsEdge, json: ElkJsonEdge, containerId: string): void {
  if (json.container !== containerId) {
    throw new ElkBackendError(`elkjs placed edge ${json.id} in ${String(json.container)}, not ${containerId}`);
  }
  edge.sections = arrayAt(json, 'sections').map(sectionOf);
  applyLabels(edge.labels, json.labels);
}

function applyNode(node: ElkjsNode, json: ElkJsonNode): void {
  node.x = numberAt(json, 'x');
  node.y = numberAt(json, 'y');
  node.width = numberAt(json, 'width');
  node.height = numberAt(json, 'height');
  applyLabels(node.labels, json.labels);
  node.containedEdges.forEach((edge, i) => applyEdge(edge, json.edges[i]!, json.id));
  node.children.forEach((child, i) => applyNode(child, json.children[i]!));
}

/** Copy elkjs's layout of `sent` back onto the graph it was serialised from. */
export function applyElkJson(root: ElkjsNode, sent: ElkJsonGraph, reply: unknown): void {
  if (reply !== sent.graph) throw new ElkBackendError('elkjs replied with a graph other than the one sent');
  applyNode(root, sent.graph);
}
