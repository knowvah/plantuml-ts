/**
 * The ELK maker: builds the ELK graph of a cuca diagram, lays it out through
 * an {@link ElkBackend}, and returns what upstream hands to
 * `new MyElkDrawing(...)` (cdd8 D3, D13).
 *
 * Ported 1:1 from `CucaDiagramFileMakerElk.java`, method by method, in its
 * order. Upstream reads `CucaDiagram`, `Entity`, `Link`, `Bibliotekon` and
 * `printEntityInternal` directly; here every such read goes through the
 * engine's {@link ElkDiagramAdapter} member named after it. The maker's
 * private text-block builders (`getLabel`, `getQuantifier`, `getRoleLabel`,
 * `:149-278`) read only the diagram's skin and link text, so the adapter
 * supplies them whole. `ElkGraphUtil`'s static factories are the backend's
 * (`ElkBackend extends ElkGraphUtil`).
 *
 * Not ported, with reason: `getLinkArrow` (`:185-187`) feeds only
 * commented-out code (`:205-207`, `:224-226`); `clusterManager.addNode`
 * (`:380-381`) registers the svek node `MyElkDrawing` later moves, which
 * {@link ElkDiagramAdapter.drawLeaf} does at draw time; `skinParam.sameClassWidth()`
 * (`:468-469`) only prints "NOT YET IMPLEMENTED" to stderr.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java
 */
import { GroupType } from '../abel/GroupType.js';
import { LeafType } from '../abel/LeafType.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { MinMax } from '../klimt/geom/MinMax.js';
import { XPoint2D } from '../klimt/geom/XPoint2D.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../klimt/shape/TextBlockUtils.js';
import type { UDrawable } from '../klimt/shape/UDrawable.js';
import type { ElkBackend } from './elk-backend.js';
import type { ElkDiagramAdapter } from './ElkDiagramAdapter.js';
import { ElkPadding } from './proxy/core/math/ElkPadding.js';
import { CoreOptions } from './proxy/core/options/CoreOptions.js';
import { Direction } from './proxy/core/options/Direction.js';
import { EdgeLabelPlacement } from './proxy/core/options/EdgeLabelPlacement.js';
import { HierarchyHandling } from './proxy/core/options/HierarchyHandling.js';
import { NodeLabelPlacement } from './proxy/core/options/NodeLabelPlacement.js';
import { RecursiveGraphLayoutEngine } from './proxy/core/RecursiveGraphLayoutEngine.js';
import { NullElkProgressMonitor } from './proxy/core/util/NullElkProgressMonitor.js';
import type { ElkEdge } from './proxy/graph/ElkEdge.js';
import type { ElkNode } from './proxy/graph/ElkNode.js';

/** `Math.max(25, titleAndAttributeHeight)`: the cluster title floor, `CucaDiagramFileMakerElk.java:333`. */
const CLUSTER_TITLE_MIN_HEIGHT = 25;
/** The `+ 15` of the top padding and the other three sides: `CucaDiagramFileMakerElk.java:333-334`. */
const CLUSTER_PADDING = 15;
/** "I don't know why we have to do this hack": `CucaDiagramFileMakerElk.java:393`. */
const VERY_STRANGE_OFFSET = 10;
/** Kinds stored in an `ElkLabel`'s text, read back by `MyElkEdge#drawLabels` (`MyElkEdge.java:249-258`). */
const CLUSTER_LABEL_TEXT = 'C';
const CENTER_LABEL_TEXT = 'X';
const TAIL_LABEL_TEXT = '1';
const HEAD_LABEL_TEXT = '2';

/**
 * The three ordered maps `CucaDiagramFileMakerElk.java:140-142` fills, keyed
 * by entity / link id. Insertion order is Java's `LinkedHashMap` order, which
 * is `MyElkDrawing`'s draw order. An empty package muted to a leaf
 * (`:320-322`) is keyed in `nodes`.
 */
export interface ElkMakerMaps {
  readonly clusters: Map<string, ElkNode>;
  readonly edges: Map<string, ElkEdge>;
  readonly nodes: Map<string, ElkNode>;
}

/** What `CucaDiagramFileMakerElk.java:496-498` passes to `new MyElkDrawing(...)`. */
export interface ElkMakerResult extends ElkMakerMaps {
  readonly minMax: MinMax;
}

/**
 * `new MyElkDrawing(clusterManager, diagram, minMax, clusters, edges, nodes)`
 * (`MyElkDrawing.java:100-108`), with the adapter standing for
 * `clusterManager` and `diagram`. The maker measures the drawing built with a
 * null `minMax` (`CucaDiagramFileMakerElk.java:495-496`), so it needs the
 * drawing's constructor; T2b supplies it.
 */
export type MyElkDrawingFactory = (adapter: ElkDiagramAdapter, minMax: MinMax | null, maps: ElkMakerMaps) => UDrawable;

/**
 * "Retrieve the real position of a node, depending on its parents": ELK
 * coordinates are parent-relative; a parent with labels (every cluster
 * carries its "C" label, `:337-338`) adds its own position, and a parent
 * without labels is taken for the root.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:280-296
 */
export function getPosition(elkNode: ElkNode): XPoint2D {
  const parent = elkNode.getParent();

  const x = elkNode.getX();
  const y = elkNode.getY();

  // This nasty test checks that parent is "root"
  if (parent === null || parent.getLabels().length === 0) return new XPoint2D(x, y);

  // Right now, this is recursive
  const parentPosition = getPosition(parent);
  return new XPoint2D(parentPosition.getX() + x, parentPosition.getY() + y);
}

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:137-501
 */
export class CucaDiagramFileMakerElk {
  /** `:140` */
  private readonly nodes = new Map<string, ElkNode>();
  /** `:141` */
  private readonly clusters = new Map<string, ElkNode>();
  /** `:142` */
  private readonly edges = new Map<string, ElkEdge>();

  /**
   * `:144-146`. `elk` is upstream's static `ElkGraphUtil` plus the engine
   * `RecursiveGraphLayoutEngine` reflects (`proxy/core/RecursiveGraphLayoutEngine.java`).
   */
  constructor(
    private readonly diagram: ElkDiagramAdapter,
    private readonly elk: ElkBackend,
  ) {}

  /** `:298-305` */
  private getUnpackagedEntities(): string[] {
    const result: string[] = [];
    for (const ent of this.diagram.leafs())
      if (this.diagram.getRootGroup() === this.diagram.getParentContainer(ent)) result.push(ent);

    return result;
  }

  /** `:307-313` */
  private getElkNode(entity: string): ElkNode | undefined {
    let node = this.nodes.get(entity);
    if (node === undefined) node = this.clusters.get(entity);

    return node;
  }

  /** `:315-346` */
  private printAllSubgroups(stringBounder: StringBounder, cluster: ElkNode, group: string): void {
    for (const g of this.diagram.getChildrenGroups(group)) {
      if (this.diagram.isRemoved(g)) continue;

      if (this.diagram.isEmpty(g) && this.diagram.getGroupType(g) === GroupType.PACKAGE) {
        this.diagram.muteToType(g, LeafType.EMPTY_PACKAGE);
        this.prinEntity(stringBounder, g, cluster);
      } else {
        this.printCluster(stringBounder, cluster, g);
      }
    }
  }

  /** The `else` branch of `printAllSubgroups`, `:324-342`. */
  private printCluster(stringBounder: StringBounder, cluster: ElkNode, g: string): void {
    // We create the "cluster" in ELK for this group
    const elkCluster = this.elk.createNode(cluster);
    elkCluster.setProperty(CoreOptions.DIRECTION, Direction.DOWN);

    const clusterHeader = this.diagram.getClusterHeader(g, stringBounder);

    const titleAndAttributeHeight = clusterHeader.getTitleAndAttributeHeight();

    const topPadding = Math.max(CLUSTER_TITLE_MIN_HEIGHT, titleAndAttributeHeight) + CLUSTER_PADDING;
    elkCluster.setProperty(
      CoreOptions.PADDING,
      new ElkPadding(topPadding, CLUSTER_PADDING, CLUSTER_PADDING, CLUSTER_PADDING),
    );

    // Not sure this is usefull to put a label on a "cluster"
    const label = this.elk.createLabel(elkCluster);
    label.setText(CLUSTER_LABEL_TEXT);
    // We need it anyway to recurse up to the real "root"

    this.clusters.set(g, elkCluster);
    this.printSingleGroup(stringBounder, g);
  }

  /** `:348-354` */
  private printSingleGroup(stringBounder: StringBounder, g: string): void {
    if (this.diagram.getGroupType(g) === GroupType.CONCURRENT_STATE) return;

    this.printEntities(stringBounder, this.clusters.get(g)!, this.diagram.groupLeafs(g));
    this.printAllSubgroups(stringBounder, this.clusters.get(g)!, g);
  }

  /** `:356-364` */
  private printEntities(stringBounder: StringBounder, parent: ElkNode, entities: readonly string[]): void {
    // Convert all "leaf" to ELK node
    for (const ent of entities) {
      if (this.diagram.isRemoved(ent)) continue;

      this.prinEntity(stringBounder, ent, parent);
    }
  }

  /** `:366-371` */
  private manageAllEdges(stringBounder: StringBounder): void {
    // Convert all "link" to ELK edge
    for (const link of this.diagram.getLinks()) this.manageSingleEdge(stringBounder, link);
  }

  /** `:373-412` */
  private prinEntity(stringBounder: StringBounder, ent: string, parent: ElkNode): void {
    // Expected dimension of the node
    const dimension = this.diagram.calculateDimension(ent, stringBounder);

    // Here, we try to tell ELK to use this dimension as node dimension
    const elkNode = this.elk.createNode(parent);
    elkNode.setDimensions(dimension.getWidth(), dimension.getHeight());

    // There is no real "label" here
    // We just would like to force node dimension
    const label = this.elk.createLabel(elkNode);
    label.setText(CENTER_LABEL_TEXT);

    // I don't know why we have to do this hack, but somebody has to fix it
    label.setDimensions(dimension.getWidth(), dimension.getHeight() - VERY_STRANGE_OFFSET);

    // No idea of what we are doing here :-)
    label.setProperty(
      CoreOptions.NODE_LABELS_PLACEMENT,
      new Set([NodeLabelPlacement.INSIDE, NodeLabelPlacement.H_CENTER, NodeLabelPlacement.V_CENTER]),
    );

    // Let's store this
    this.nodes.set(ent, elkNode);
  }

  /**
   * `getElkNode(entity)` as `ElkGraphUtil.createSimpleEdge` receives it: upstream
   * dereferences `node.obj` (`proxy/graph/util/ElkGraphUtil.java:23-26`), so an
   * end without an ELK node (removed, or inside a concurrent state) is a
   * `NullPointerException` there.
   */
  private requireElkNode(link: string, entity: string): ElkNode {
    const node = this.getElkNode(entity);
    if (node === undefined) throw new Error(`CucaDiagramFileMakerElk: link ${link} has no ELK node for ${entity}`);
    return node;
  }

  /** `:414-460` */
  private manageSingleEdge(stringBounder: StringBounder, link: string): void {
    const node1 = this.requireElkNode(link, this.diagram.getEntity1(link));
    const node2 = this.requireElkNode(link, this.diagram.getEntity2(link));

    const edge = this.elk.createSimpleEdge(node1, node2);

    // getLabel never returns null (:189-248), so every edge carries a centre label
    const labelLink = this.diagram.getLabel(link, stringBounder);
    const edgeLabel = this.elk.createLabel(edge);
    const dim = labelLink.calculateDimension(stringBounder);
    edgeLabel.setText(CENTER_LABEL_TEXT);
    edgeLabel.setDimensions(dim.getWidth(), dim.getHeight());
    // Duplicated, with qualifier, but who cares?
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);

    if (this.diagram.getQuantifier1(link) !== null || this.diagram.getRole1(link) !== null)
      this.manageTailLabel(stringBounder, link, edge);
    if (this.diagram.getQuantifier2(link) !== null || this.diagram.getRole2(link) !== null)
      this.manageHeadLabel(stringBounder, link, edge);

    this.edges.set(link, edge);
  }

  /** The quantifier-1 / role-1 block of `manageSingleEdge`, `:430-443`. */
  private manageTailLabel(stringBounder: StringBounder, link: string, edge: ElkEdge): void {
    const q1 = this.diagram.getQuantifier(link, 1, stringBounder);
    const r1 = this.diagram.getRoleLabel(link, 1, stringBounder);
    const forLayout = requireForLayout(link, 1, q1 ?? r1);
    const edgeLabel = this.elk.createLabel(edge);
    const dim = forLayout.calculateDimension(stringBounder);
    // Nasty trick, we store the kind of label in the text
    edgeLabel.setText(TAIL_LABEL_TEXT);
    edgeLabel.setDimensions(dim.getWidth(), dim.getHeight());
    edgeLabel.setProperty(CoreOptions.EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.TAIL);
    // Duplicated, with main label, but who cares?
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);
  }

  /** The quantifier-2 / role-2 block of `manageSingleEdge`, `:444-457`. */
  private manageHeadLabel(stringBounder: StringBounder, link: string, edge: ElkEdge): void {
    const q2 = this.diagram.getQuantifier(link, 2, stringBounder);
    const r2 = this.diagram.getRoleLabel(link, 2, stringBounder);
    const forLayout = requireForLayout(link, 2, q2 ?? r2);
    const edgeLabel = this.elk.createLabel(edge);
    const dim = forLayout.calculateDimension(stringBounder);
    // Nasty trick, we store the kind of label in the text
    edgeLabel.setText(HEAD_LABEL_TEXT);
    edgeLabel.setDimensions(dim.getWidth(), dim.getHeight());
    edgeLabel.setProperty(CoreOptions.EDGE_LABELS_PLACEMENT, EdgeLabelPlacement.HEAD);
    // Duplicated, with main label, but who cares?
    edge.setProperty(CoreOptions.EDGE_LABELS_INLINE, true);
  }

  /**
   * `:477-499`, up to `new MyElkDrawing(...)`: builds and lays out the graph,
   * then measures the drawing (`TextBlockUtils.getMinMax(drawing, stringBounder, false)`).
   */
  getTextBlock(newMyElkDrawing: MyElkDrawingFactory): ElkMakerResult {
    const root = this.elk.createGraph();
    root.setProperty(CoreOptions.DIRECTION, Direction.DOWN);
    root.setProperty(CoreOptions.HIERARCHY_HANDLING, HierarchyHandling.INCLUDE_CHILDREN);

    const stringBounder = this.diagram.getDefaultStringBounder();

    this.printAllSubgroups(stringBounder, root, this.diagram.getRootGroup());
    this.printEntities(stringBounder, root, this.getUnpackagedEntities());

    this.manageAllEdges(stringBounder);

    new RecursiveGraphLayoutEngine(this.elk).layout(root, new NullElkProgressMonitor());

    const maps: ElkMakerMaps = { clusters: this.clusters, edges: this.edges, nodes: this.nodes };
    const minMax = TextBlockUtils.getMinMax(newMyElkDrawing(this.diagram, null, maps), stringBounder, false);

    return { minMax, ...maps };
  }
}

/**
 * `forLayout.calculateDimension(...)` at `:435` / `:449`: upstream enters the
 * block when the quantifier or role STRING is non-null, but `forLayout` is
 * null when both blocks are (`getQuantifier`/`getRoleLabel` return null for
 * an empty block), which is a `NullPointerException` there.
 */
function requireForLayout(link: string, n: 1 | 2, forLayout: TextBlock | null): TextBlock {
  if (forLayout === null)
    throw new Error(`CucaDiagramFileMakerElk: link ${link} end ${n} has no label block to lay out`);
  return forLayout;
}

/**
 * Builds the ELK graph of `adapter`'s diagram, lays it out with `backend`, and
 * returns `MyElkDrawing`'s constructor arguments.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:477-499
 */
export function makeElkLayout(
  adapter: ElkDiagramAdapter,
  backend: ElkBackend,
  newMyElkDrawing: MyElkDrawingFactory,
): ElkMakerResult {
  return new CucaDiagramFileMakerElk(adapter, backend).getTextBlock(newMyElkDrawing);
}
