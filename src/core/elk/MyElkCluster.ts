/**
 * `MyElkCluster` port (cdd8 T2c): draws one package/cluster at the position
 * ELK gave its node, and answers the `MagneticBorder` a link attached to the
 * cluster reads.
 *
 * Upstream reads the abel model (`CucaDiagram`, `Entity`, the skin parameters
 * and the merged cluster `Style`) directly; here every such read goes through
 * the {@link ElkDiagramAdapter} member that cites the same Java line.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkCluster.java
 */
import type { USymbol } from '../decoration/symbol/USymbol.js';
import { FOLDER } from '../decoration/symbol/USymbols.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { MagneticBorder } from '../klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../klimt/geom/MagneticBorderNone.js';
import { XPoint2D } from '../klimt/geom/XPoint2D.js';
import { textBlockMagneticBorder } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import { UTranslate } from '../klimt/UTranslate.js';
import type { Paint } from '../paint.js';
import { ClusterDecoration } from '../svek/ClusterDecoration.js';
import { getStrokeInternal } from '../svek/Cluster.js';
import { PackageStyle, type PackageStyleName } from '../svek/PackageStyle.js';
import { ColorType } from '../abel/ColorType.js';
import { getPosition } from './CucaDiagramFileMakerElk.js';
import type { ElkDiagramAdapter } from './ElkDiagramAdapter.js';
import type { ElkNode } from './proxy/graph/ElkNode.js';

/** `HColors.BLACK` (`HColors.java:84`): the placeholder colour of `getMagneticBorder`'s probe block (`MyElkCluster.java:158`). */
const BLACK: Paint = '#000000';

/** `decoration.drawU(..., 0)` / `getTextBlock(..., 0, 0, ...)`: the diagonal corner (`MyElkCluster.java:120`, `:158`). */
const DIAGONAL_CORNER = 0;

/**
 * The adapter members `MyElkCluster` reads (a subset of {@link ElkDiagramAdapter}).
 */
export type ElkClusterDiagram = Pick<
  ElkDiagramAdapter,
  | 'getUSymbol'
  | 'getPackageStyle'
  | 'getEntityColors'
  | 'getClusterHeader'
  | 'getClusterStyle'
  | 'getClusterStyleForMagneticBorder'
  | 'getClusterBackColor'
  | 'packageStyle'
  | 'getPackageTitleAlignment'
  | 'getStereotypeAlignment'
>;

/**
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkCluster.java:76-171
 */
export class MyElkCluster {
  /** `:78` (`group`, named by its id). */
  private readonly group: string;
  /** `:79` */
  private readonly elkNode: ElkNode;
  /** `:80`, `:81`: the diagram and its skin parameters, behind the adapter. */
  private readonly diagram: ElkClusterDiagram;

  /**
   * @see MyElkCluster.java:83-89
   */
  constructor(diagram: ElkClusterDiagram, group: string, elkNode: ElkNode) {
    this.group = group;
    this.elkNode = elkNode;
    this.diagram = diagram;
  }

  /**
   * @see MyElkCluster.java:91-126
   */
  drawSingleCluster(ug: UGraphic): void {
    const diagram = this.diagram;
    const group = this.group;
    const corner = getPosition(this.elkNode);

    // :96-98
    const packageStyle: PackageStyleName | null = diagram.getPackageStyle(group) ?? diagram.packageStyle();

    // :102-109
    const style = diagram.getClusterStyle(group);
    const stroke = getStrokeInternal(diagram.getEntityColors(group).getSpecificLineStroke(), style.stroke);
    const backColor = diagram.getClusterBackColor(group);

    // :111-115
    const width = this.elkNode.getWidth();
    const height = this.elkNode.getHeight();
    const rectangleArea = { position: UTranslate.none(), width, height };
    const clusterHeader = diagram.getClusterHeader(group, ug.getStringBounder());

    const decoration = new ClusterDecoration(
      packageStyle,
      diagram.getUSymbol(group),
      clusterHeader.getTitle(),
      clusterHeader.getStereo(),
      rectangleArea,
      stroke,
    );

    // :116-118
    const borderColor = diagram.getEntityColors(group).getColor(ColorType.LINE) ?? style.lineColor;
    decoration.drawU(
      ug.apply(UTranslate.point(corner)),
      backColor,
      borderColor,
      style.shadowing,
      style.roundCorner,
      diagram.getPackageTitleAlignment(),
      diagram.getStereotypeAlignment(),
      DIAGONAL_CORNER,
    );
  }

  /**
   * @see MyElkCluster.java:132-171 (`@DuplicateCode(reference = "Cluster")`)
   */
  getMagneticBorder(stringBounder: StringBounder): MagneticBorder {
    const diagram = this.diagram;
    const group = this.group;

    // :134-140
    let uSymbol: USymbol | null = diagram.getUSymbol(group);
    const packageStyle: PackageStyleName = diagram.getPackageStyle(group) ?? diagram.packageStyle();
    if (uSymbol === null && packageStyle === PackageStyle.FOLDER) uSymbol = FOLDER;
    if (uSymbol === null) return new MagneticBorderNone();

    // :142
    const corner = getPosition(this.elkNode);

    // :144-151
    const style = diagram.getClusterStyleForMagneticBorder(group, uSymbol);
    const stroke = getStrokeInternal(diagram.getEntityColors(group).getSpecificLineStroke(), style.stroke);

    // :153-157
    const rectangleArea = {
      position: UTranslate.none(),
      width: this.elkNode.getWidth(),
      height: this.elkNode.getHeight(),
    };
    const clusterHeader = diagram.getClusterHeader(group, stringBounder);
    const decoration = new ClusterDecoration(
      packageStyle,
      diagram.getUSymbol(group),
      clusterHeader.getTitle(),
      clusterHeader.getStereo(),
      rectangleArea,
      stroke,
    );

    // :159-161
    const textBlock = decoration.getTextBlock(
      BLACK,
      BLACK,
      0,
      0,
      diagram.getPackageTitleAlignment(),
      diagram.getStereotypeAlignment(),
      DIAGONAL_CORNER,
    );
    const orig = textBlockMagneticBorder(textBlock);

    // :163-169
    return {
      getForceAt(position, bounder) {
        return orig.getForceAt(new XPoint2D(position.x - corner.x, position.y - corner.y), bounder);
      },
    };
  }
}
