/**
 * The ELK drawing: "The Drawing class does the real drawing" — every cluster,
 * then every node image at its ELK corner, then every edge (cdd8 D13).
 *
 * Ported 1:1 from `MyElkDrawing.java`. Upstream reads `ClusterManager`,
 * `Bibliotekon`, `CucaDiagram`, `Entity` and `Link` directly; here every such
 * read is the {@link ElkDiagramAdapter} member named after it, entities and
 * links being their ids.
 *
 * Shape changes, each forced and nothing else:
 * - Constructor: `clusterManager` and `diagram` (`:100-101`) are one adapter,
 *   and the three ordered maps travel as the maker's {@link ElkMakerMaps}, so
 *   the constructor is the maker's {@link MyElkDrawingFactory}
 *   (`CucaDiagramFileMakerElk.java:495-498` builds the drawing twice).
 * - `drawAllNodes` (`:128-148`): the `svekNode.resetMove()/moveDelta(corner)`
 *   and `IEntityImageUtils.translate(printEntityInternal(entity), ...).drawU(ug)`
 *   pair is {@link ElkDiagramAdapter.drawLeaf}; the translated image kept for
 *   the edges is {@link translatedNodeImage}.
 * - The private text-block builders `getLabel`, `getQuantifier`, `getRoleLabel`
 *   (`:244-337`) and their helpers `getFontForLink`, `getDefaultStyleDefinitionArrow`,
 *   `getMessageTextAlignment`, `addVisibilityModifier` (`:207-242`) read only
 *   the diagram's skin and the link's text: the adapter supplies the blocks
 *   whole ({@link ElkDiagramAdapter.getLabel}, `getQuantifier`, `getRoleLabel`),
 *   as it does for the maker's duplicates (`CucaDiagramFileMakerElk.java:149-278`).
 * - `printEntityInternal`, `getBibliotekon` (`:161-178`): behind `drawLeaf`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java
 */
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { MagneticBorder } from '../klimt/geom/MagneticBorder.js';
import type { MinMax } from '../klimt/geom/MinMax.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import type { XPoint2D } from '../klimt/geom/XPoint2D.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UTranslate } from '../klimt/UTranslate.js';
import type { SName } from '../style/SName.js';
import { getPosition, type ElkMakerMaps, type MyElkDrawingFactory } from './CucaDiagramFileMakerElk.js';
import type { ElkDiagramAdapter } from './ElkDiagramAdapter.js';
import { MyElkCluster } from './MyElkCluster.js';
import { MyElkEdge, type MyElkNodeImage } from './MyElkEdge.js';
import type { ElkEdge } from './proxy/graph/ElkEdge.js';
import type { ElkNode } from './proxy/graph/ElkNode.js';

/** `minMax.getDimension().delta(20, 20)`: `MyElkDrawing.java:345`. */
const DIMENSION_DELTA = 20;
/** `final double magicY2 = 0;`: `MyElkDrawing.java:185`. */
const MAGIC_Y2 = 0;
/** `new MyElkEdge(diagram, SName.classDiagram, ...)`: `MyElkDrawing.java:202`. */
const EDGE_STYLE_NAME: SName = 'classDiagram';

/**
 * `IEntityImageUtils.translate(image, UTranslate.point(corner))` as `MyElkEdge`
 * reads it: its magnetic border answers
 * `orig.getForceAt(stringBounder, translate.reverse().getTranslated(position))`,
 * asking `orig.getMagneticBorder()` when the wrapper's is asked.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/IEntityImageUtils.java:50-111
 */
export function translatedNodeImage(diagram: ElkDiagramAdapter, entity: string, corner: XPoint2D): MyElkNodeImage {
  const translate = UTranslate.point(corner);
  return {
    getMagneticBorder(): MagneticBorder {
      const magneticBorder = diagram.getMagneticBorder(entity);
      const reverse = translate.reverse();
      return {
        getForceAt: (position, stringBounder) =>
          magneticBorder.getForceAt(
            { x: position.x + reverse.getDx(), y: position.y + reverse.getDy() },
            stringBounder,
          ),
      };
    },
  };
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:86-352 */
export class MyElkDrawing implements TextBlock {
  /** min and max of all coord (`:89-90`) */
  private readonly minMax: MinMax | null;

  /** `:92`, and `clusterManager` (`:98`), behind the adapter. */
  private readonly diagram: ElkDiagramAdapter;

  /** `:94` */
  private readonly clusters: ReadonlyMap<string, ElkNode>;
  /** `:95` */
  private readonly edges: ReadonlyMap<string, ElkEdge>;
  /** `:96` */
  private readonly nodes: ReadonlyMap<string, ElkNode>;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:100-108 */
  constructor(diagram: ElkDiagramAdapter, minMax: MinMax | null, maps: ElkMakerMaps) {
    this.minMax = minMax;
    this.diagram = diagram;
    this.clusters = maps.clusters;
    this.edges = maps.edges;
    this.nodes = maps.nodes;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:110-114 */
  drawU(ug: UGraphic): void {
    const clusters = this.drawAllClusters(ug);
    const nodes = this.drawAllNodes(ug);
    this.drawAllEdges(ug, clusters, nodes);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:116-126 */
  private drawAllClusters(ug: UGraphic): Map<string, MyElkCluster> {
    const elkClusters = new Map<string, MyElkCluster>();
    for (const [entity, elkNode] of this.clusters) {
      const elkCluster = new MyElkCluster(this.diagram, entity, elkNode);
      elkCluster.drawSingleCluster(ug);
      elkClusters.set(entity, elkCluster);
    }
    return elkClusters;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:128-148 */
  private drawAllNodes(ug: UGraphic): Map<string, MyElkNodeImage> {
    const elkNodes = new Map<string, MyElkNodeImage>();
    for (const [entity, elkNode] of this.nodes) {
      // Retrieve coord from ELK
      const corner = getPosition(elkNode);

      // svekNode.resetMove(); svekNode.moveDelta(corner); then print the node image at right coord
      this.diagram.drawLeaf(entity, ug, corner);

      elkNodes.set(entity, translatedNodeImage(this.diagram, entity, corner));
    }
    return elkNodes;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:150-159 */
  private drawAllEdges(
    ug: UGraphic,
    elkClusters: ReadonlyMap<string, MyElkCluster>,
    nodeImages: ReadonlyMap<string, MyElkNodeImage>,
  ): void {
    for (const [link, edge] of this.edges) {
      if (this.diagram.isInvis(link)) continue;

      this.drawSingleEdge(ug, link, edge, elkClusters, nodeImages);
    }
  }

  /**
   * The `dest.getUSymbol() instanceof USymbolFolder` test (`:186-192`) has an
   * empty body upstream and is not mirrored.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:180-205
   */
  private drawSingleEdge(
    ug: UGraphic,
    link: string,
    edge: ElkEdge,
    elkClusters: ReadonlyMap<string, MyElkCluster>,
    nodeImages: ReadonlyMap<string, MyElkNodeImage>,
  ): void {
    // Unfortunately, we have to translate "edge" in its own "cluster" coordinate
    const translate = getPosition(edge.getContainingNode());

    const stringBounder = ug.getStringBounder();
    const label = this.diagram.getLabel(link, stringBounder);
    const quantifier1 = this.diagram.getQuantifier(link, 1, stringBounder);
    const quantifier2 = this.diagram.getQuantifier(link, 2, stringBounder);
    const role1 = this.diagram.getRoleLabel(link, 1, stringBounder);
    const role2 = this.diagram.getRoleLabel(link, 2, stringBounder);
    const elkPath = new MyElkEdge(this.diagram, EDGE_STYLE_NAME, link, edge, {
      centerLabel: label,
      tailLabel: quantifier1 ?? role1,
      headLabel: quantifier2 ?? role2,
      tailRole: quantifier1 !== null ? role1 : null,
      headRole: quantifier2 !== null ? role2 : null,
      magicY2: MAGIC_Y2,
      elkClusters,
      translate: UTranslate.point(translate),
      nodeImages,
    });
    elkPath.drawU(ug);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:339-346 */
  calculateDimension(_stringBounder: StringBounder): XDimension2D {
    if (this.minMax === null) throw new Error('UnsupportedOperationException: MyElkDrawing has no minMax');

    return this.minMax.getDimension().delta(DIMENSION_DELTA, DIMENSION_DELTA);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java:348-350 */
  getBackcolor(): null {
    return null;
  }
}

/**
 * `new MyElkDrawing(clusterManager, diagram, minMax, clusters, edges, nodes)`
 * as the maker's {@link MyElkDrawingFactory}: `CucaDiagramFileMakerElk.java:495-498`.
 */
export const newMyElkDrawing: MyElkDrawingFactory = (diagram, minMax, maps) => new MyElkDrawing(diagram, minMax, maps);
