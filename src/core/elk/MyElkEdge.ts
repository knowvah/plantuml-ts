/**
 * One ELK edge, drawn: straight `ULine` legs from the section start through
 * each bend point to the section end, the two extremity decorations, then the
 * centre, tail and head labels and the roles beside them (cdd8 D13). No
 * splines: the jar draws `<line>` elements on the ELK path.
 *
 * Ported 1:1 from `MyElkEdge.java`. Upstream reads `CucaDiagram`, `Link` and
 * the link's merged arrow `Style` directly; here every such read is the
 * {@link ElkDiagramAdapter} member named after it, the link being its id.
 *
 * Shape changes, each forced and nothing else:
 * - Constructor: Java's 13 positional arguments (`:119-122`) exceed this
 *   project's 5-parameter complexity ceiling, so the first four keep their
 *   positions and the remaining nine travel, in Java's order, in
 *   {@link MyElkEdgeArgs}.
 * - `drawU` (`:148-227`) exceeds the CCN ceiling, so its colour (`:159-167`),
 *   stroke (`:169-180`), magnetic-border (`:182-196`) and extremity
 *   (`:209-224`) blocks are private methods called in Java's order.
 * - `drawRoleLabel` (`:279-317`) has six parameters: its position arithmetic
 *   is the pure {@link getRoleLabelPosition}, and its two endpoints a pair.
 * - The two `System.err.println` lines of the no-section branch (`:202-203`)
 *   are not mirrored (no console in `src/`, eslint `no-console`); the second
 *   one's argument calls `edge.isHierarchical()`, which throws in upstream's
 *   proxy (`proxy/graph/ElkEdge.java:38-40`), and that call is kept.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java
 */
import { ColorType } from '../abel/ColorType.js';
import { getExtremityFactoryLegacy, LinkDecor } from '../decoration/LinkDecor.js';
import { Fore } from '../klimt/Fore.js';
import { HColors } from '../klimt/color/HColors.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { MagneticBorder } from '../klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../klimt/geom/MagneticBorderNone.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import { XPoint2D } from '../klimt/geom/XPoint2D.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { UDrawable } from '../klimt/shape/UDrawable.js';
import { ULine } from '../klimt/shape/ULine.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { UStroke } from '../klimt/UStroke.js';
import { UTranslate, type Point2D } from '../klimt/UTranslate.js';
import type { Paint } from '../paint.js';
import { ExtremityFactoryExtends } from '../svek/extremity/ExtremityFactoryExtends.js';
import type { SName } from '../style/SName.js';
// "Nasty trick: we store the type of label (center/head/tail) in the text"
// (`MyElkEdge.java:248-258`); the maker writes them (`CucaDiagramFileMakerElk.java:424`, `:437`, `:451`).
import { CENTER_LABEL_TEXT, HEAD_LABEL_TEXT, TAIL_LABEL_TEXT } from './CucaDiagramFileMakerElk.js';
import type { ElkArrowStyle, ElkDiagramAdapter } from './ElkDiagramAdapter.js';
import type { ElkEdge } from './proxy/graph/ElkEdge.js';
import type { ElkEdgeSection } from './proxy/graph/ElkEdgeSection.js';

/** `final double gap = 2;`: `MyElkEdge.java:294`. */
const ROLE_GAP = 2;
/** `Math.abs(dirX) + Math.abs(dirY) < 0.001`: `MyElkEdge.java:288`. */
const DEGENERATE_DIRECTION = 0.001;

/**
 * The `IEntityImage` member `MyElkEdge` reads off `nodeImages`
 * (`MyElkEdge.java:184-194`). Upstream's map holds each leaf image wrapped by
 * `IEntityImageUtils.translate(image, UTranslate.point(corner))`
 * (`MyElkDrawing.java:136-137`), whose border answers
 * `orig.getForceAt(sb, translate.reverse().getTranslated(position))`
 * (`IEntityImageUtils.java:103-111`): the drawing builds that from
 * {@link ElkDiagramAdapter.getMagneticBorder}.
 */
export interface MyElkNodeImage {
  getMagneticBorder(): MagneticBorder;
}

/** The `MyElkCluster` member `MyElkEdge` reads: `getMagneticBorder(StringBounder)` (`MyElkCluster.java:130-170`; `MyElkEdge.java:191`, `:196`). */
export interface MyElkEdgeCluster {
  getMagneticBorder(stringBounder: StringBounder): MagneticBorder;
}

/**
 * `MyElkEdge`'s constructor arguments 5-13 (`MyElkEdge.java:119-122`), in
 * Java's order, as `MyElkDrawing.java:202-203` passes them.
 */
export interface MyElkEdgeArgs {
  /** Never null: `getLabel` returns `EMPTY_TEXT_BLOCK` (`MyElkDrawing.java:244-306`); see {@link ElkDiagramAdapter.getLabel}. */
  readonly centerLabel: TextBlock;
  /** `quantifier1 != null ? quantifier1 : role1` (`MyElkDrawing.java:197`). */
  readonly tailLabel: TextBlock | null;
  /** `quantifier2 != null ? quantifier2 : role2` (`MyElkDrawing.java:198`). */
  readonly headLabel: TextBlock | null;
  /** `quantifier1 != null ? role1 : null` (`MyElkDrawing.java:199`). */
  readonly tailRole: TextBlock | null;
  /** `quantifier2 != null ? role2 : null` (`MyElkDrawing.java:200`). */
  readonly headRole: TextBlock | null;
  /** Always `0` upstream (`MyElkDrawing.java:191`). */
  readonly magicY2: number;
  readonly elkClusters: ReadonlyMap<string, MyElkEdgeCluster>;
  /** `UTranslate.point(getPosition(edge.getContainingNode()))` (`MyElkDrawing.java:189`, `:203`). */
  readonly translate: UTranslate;
  readonly nodeImages: ReadonlyMap<string, MyElkNodeImage>;
}

/** `drawRoleLabel`'s `thisEndpoint`, `otherEndpoint` (`MyElkEdge.java:280`). */
type Endpoints = readonly [thisEndpoint: XPoint2D, otherEndpoint: XPoint2D];

/** `UTranslate#getTranslated(XPoint2D)` on a non-null point (`UTranslate.java:84-90`); the port's member is typed for Java's null case. */
function getTranslated(translate: UTranslate, p: Point2D): XPoint2D {
  return new XPoint2D(p.x + translate.getDx(), p.y + translate.getDy());
}

/**
 * Java dereferences the tail/head blocks unguarded; the maker creates a "1"
 * ("2") label only when one of them exists (`CucaDiagramFileMakerElk.java:430-435`),
 * so a null here is upstream's NullPointerException.
 */
function requireBlock(block: TextBlock | null, what: string): TextBlock {
  if (block === null) throw new Error(`NullPointerException: MyElkEdge ${what} is null`);
  return block;
}

/**
 * Where `drawRoleLabel` draws the role (`MyElkEdge.java:281-316`): beside the
 * quantifier, across the line from it, `gap` away; under the quantifier when
 * the two ends coincide.
 */
export function getRoleLabelPosition(
  qDim: XDimension2D,
  rDim: XDimension2D,
  quantifierPos: XPoint2D,
  thisEndpoint: XPoint2D,
  otherEndpoint: XPoint2D,
): XPoint2D {
  const dirX = otherEndpoint.getX() - thisEndpoint.getX();
  const dirY = otherEndpoint.getY() - thisEndpoint.getY();

  if (Math.abs(dirX) + Math.abs(dirY) < DEGENERATE_DIRECTION)
    return new XPoint2D(quantifierPos.getX(), quantifierPos.getY() + qDim.getHeight());

  if (Math.abs(dirY) >= Math.abs(dirX)) {
    const qCenterX = quantifierPos.getX() + qDim.getWidth() / 2;
    const lineX = thisEndpoint.getX();
    const roleX = qCenterX < lineX ? lineX + ROLE_GAP : lineX - rDim.getWidth() - ROLE_GAP;
    return new XPoint2D(roleX, quantifierPos.getY());
  }
  const qCenterY = quantifierPos.getY() + qDim.getHeight() / 2;
  const lineY = thisEndpoint.getY();
  const roleY = qCenterY < lineY ? lineY + ROLE_GAP : lineY - rDim.getHeight() - ROLE_GAP;
  return new XPoint2D(quantifierPos.getX(), roleY);
}

/** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:96-354 */
export class MyElkEdge implements UDrawable {
  private readonly link: string;
  private readonly edge: ElkEdge;

  private readonly diagram: ElkDiagramAdapter;
  private readonly centerLabel: TextBlock;
  private readonly headLabel: TextBlock | null;
  private readonly tailLabel: TextBlock | null;
  private readonly tailRole: TextBlock | null;
  private readonly headRole: TextBlock | null;

  /** Stored, never read (`MyElkEdge.java:109`, `:134`): `getStyle` reads the diagram's style name. */
  private readonly styleName: SName;

  private readonly elkClusters: ReadonlyMap<string, MyElkEdgeCluster>;

  private readonly nodeImages: ReadonlyMap<string, MyElkNodeImage>;

  private readonly magicY2: number;

  private readonly translate: UTranslate;

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:119-138 */
  constructor(diagram: ElkDiagramAdapter, styleName: SName, link: string, edge: ElkEdge, args: MyElkEdgeArgs) {
    this.link = link;
    this.edge = edge;
    this.translate = args.translate;
    this.nodeImages = args.nodeImages;

    this.diagram = diagram;
    this.centerLabel = args.centerLabel;
    this.tailLabel = args.tailLabel;
    this.headLabel = args.headLabel;
    this.tailRole = args.tailRole;
    this.headRole = args.headRole;
    this.styleName = styleName;
    this.magicY2 = args.magicY2;
    this.elkClusters = args.elkClusters;
  }

  /** `StyleSignatureBasic.of(root, element, <style name>, arrow).withTOBECHANGED(stereotype)`, merged: `MyElkEdge.java:140-145`. */
  private getStyle(): ElkArrowStyle {
    return this.diagram.getArrowStyle(this.link);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:147-227 */
  drawU(ugIn: UGraphic): void {
    if (this.diagram.isHidden(this.link)) return;

    let ug = ugIn.apply(this.translate);
    const ugOrig = ug;

    const styleLine = this.getStyle();
    const color = this.getColor(styleLine);
    const stroke = this.getStroke(styleLine);
    const [magneticBorder1, magneticBorder2] = this.getMagneticBorders(ug.getStringBounder());

    ug = ug.apply(stroke).apply(new Fore(color));

    const sections = this.edge.getSections();
    const section0 = sections[0];
    if (section0 === undefined) {
      // System.err.println("Maybe a 'Long hierarchical edge' " + edge.isHierarchical()): throws upstream
      this.edge.isHierarchical();
      return;
    }
    this.drawSections(ug, sections, magneticBorder1, magneticBorder2);
    this.drawExtremities(ug, stroke, section0, magneticBorder1, magneticBorder2);

    this.drawLabels(ugOrig);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:159-167 */
  private getColor(styleLine: ElkArrowStyle): Paint {
    let color = styleLine.lineColor;

    const colors = this.diagram.getLinkColors(this.link);
    if (colors !== null) {
      const newColor = colors.getColor(ColorType.ARROW, ColorType.LINE);
      if (newColor !== null) color = newColor;
    } else {
      const specificColor = this.diagram.getSpecificColor(this.link);
      if (specificColor !== null) color = specificColor;
    }
    return color;
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:169-180 */
  private getStroke(styleLine: ElkArrowStyle): UStroke {
    const linkType = this.diagram.getType(this.link);
    const suggestedStroke = styleLine.stroke;
    const defaultThickness = this.diagram.getArrowThickness();

    let stroke: UStroke;
    if (suggestedStroke === null || linkType.getStyle().isNormal() === false)
      stroke = linkType.getStroke3(defaultThickness);
    else stroke = linkType.getStroke3(suggestedStroke);

    const colors = this.diagram.getLinkColors(this.link);
    const specificLineStroke = colors === null ? null : colors.getSpecificLineStroke();
    if (specificLineStroke !== null) stroke = specificLineStroke;

    return stroke;
  }

  /**
   * The node image wins for entity 1; for entity 2 the cluster test is NOT an
   * `else`, so a cluster overrides a node image there (`:193-196`, kept).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:182-196
   */
  private getMagneticBorders(stringBounder: StringBounder): readonly [MagneticBorder, MagneticBorder] {
    const entity1 = this.diagram.getEntity1(this.link);
    const entity2 = this.diagram.getEntity2(this.link);
    const elkCluster1 = this.elkClusters.get(entity1);
    const elkCluster2 = this.elkClusters.get(entity2);
    const elkNode1 = this.nodeImages.get(entity1);
    const elkNode2 = this.nodeImages.get(entity2);
    let magneticBorder1: MagneticBorder = new MagneticBorderNone();
    let magneticBorder2: MagneticBorder = new MagneticBorderNone();
    if (elkNode1 !== undefined) magneticBorder1 = elkNode1.getMagneticBorder();
    else if (elkCluster1 !== undefined) magneticBorder1 = elkCluster1.getMagneticBorder(stringBounder);

    if (elkNode2 !== undefined) magneticBorder2 = elkNode2.getMagneticBorder();
    if (elkCluster2 !== undefined) magneticBorder2 = elkCluster2.getMagneticBorder(stringBounder);

    return [magneticBorder1, magneticBorder2];
  }

  /**
   * Decor 1 at the first section's END, pushed by border 2; decor 2 at its
   * START, pushed by border 1. Both borders are asked at the untranslated
   * point here, unlike `drawSections` (`:215`, `:222`, kept).
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:209-224
   */
  private drawExtremities(
    ug: UGraphic,
    stroke: UStroke,
    section: ElkEdgeSection,
    magneticBorder1: MagneticBorder,
    magneticBorder2: MagneticBorder,
  ): void {
    const linkType = this.diagram.getType(this.link);
    const extremityFactory1 = this.getDecors(linkType.getDecor1(), Math.PI / 2, HColors.WHITE.asPaint());
    const extremityFactory2 = this.getDecors(linkType.getDecor2(), -Math.PI / 2, HColors.WHITE.asPaint());

    if (extremityFactory1 !== null) {
      const x = section.getEndX();
      const y = section.getEndY();
      const force = magneticBorder2.getForceAt(new XPoint2D(x, y), ug.getStringBounder());
      extremityFactory1.drawU(ug.apply(stroke.onlyThickness()).apply(new UTranslate(x, y).compose(force)));
    }

    if (extremityFactory2 !== null) {
      const x = section.getStartX();
      const y = section.getStartY();
      const force = magneticBorder1.getForceAt(new XPoint2D(x, y), ug.getStringBounder());
      extremityFactory2.drawU(ug.apply(stroke.onlyThickness()).apply(new UTranslate(x, y).compose(force)));
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:229-239 */
  private getDecors(decors: LinkDecor, angle: number, backColor: Paint): UDrawable | null {
    // For legacy reason, extends are treated differently
    if (decors === LinkDecor.EXTENDS)
      return new ExtremityFactoryExtends(backColor).createUDrawable(new XPoint2D(0, 0), angle, null);

    const extremityFactory = getExtremityFactoryLegacy(decors, backColor);
    if (extremityFactory === null) return null;

    return extremityFactory.createUDrawable(new XPoint2D(0, 0), angle, null);
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:241-277 */
  private drawLabels(ug: UGraphic): void {
    const [tailLabelPos, headLabelPos] = this.drawEdgeLabels(ug);

    // Draw role labels at reflected positions
    const section = this.edge.getSections()[0];
    if (section !== undefined) {
      const startPt = new XPoint2D(section.getStartX(), section.getStartY());
      const endPt = new XPoint2D(section.getEndX(), section.getEndY());

      if (this.tailRole !== null && tailLabelPos !== null)
        this.drawRoleLabel(ug, this.tailRole, requireBlock(this.tailLabel, 'tailLabel'), tailLabelPos, [
          startPt,
          endPt,
        ]);

      if (this.headRole !== null && headLabelPos !== null)
        this.drawRoleLabel(ug, this.headRole, requireBlock(this.headLabel, 'headLabel'), headLabelPos, [
          endPt,
          startPt,
        ]);
    }
  }

  /**
   * The label loop of `drawLabels`; returns `tailLabelPos`, `headLabelPos`.
   *
   * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:242-262
   */
  private drawEdgeLabels(ug: UGraphic): readonly [XPoint2D | null, XPoint2D | null] {
    let tailLabelPos: XPoint2D | null = null;
    let headLabelPos: XPoint2D | null = null;
    for (const label of this.edge.getLabels()) {
      const x = label.getX();
      const y = label.getY();
      let labelLink: TextBlock;
      // Nasty trick: we store the type of label (center/head/tail) in the text
      const type = label.getText();
      if (CENTER_LABEL_TEXT === type) labelLink = this.centerLabel;
      else if (TAIL_LABEL_TEXT === type) {
        labelLink = requireBlock(this.tailLabel, 'tailLabel');
        tailLabelPos = new XPoint2D(x, y);
      } else if (HEAD_LABEL_TEXT === type) {
        labelLink = requireBlock(this.headLabel, 'headLabel');
        headLabelPos = new XPoint2D(x, y);
      } else continue;

      labelLink.drawU(ug.apply(new UTranslate(x, y)));
    }
    return [tailLabelPos, headLabelPos];
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:279-317 */
  private drawRoleLabel(
    ug: UGraphic,
    role: TextBlock,
    quantifier: TextBlock,
    quantifierPos: XPoint2D,
    endpoints: Endpoints,
  ): void {
    const [thisEndpoint, otherEndpoint] = endpoints;
    const stringBounder = ug.getStringBounder();
    const qDim = quantifier.calculateDimension(stringBounder);
    const rDim = role.calculateDimension(stringBounder);

    const rolePos = getRoleLabelPosition(qDim, rDim, quantifierPos, thisEndpoint, otherEndpoint);
    role.drawU(ug.apply(UTranslate.point(rolePos)));
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:319-347 */
  private drawSections(
    ug: UGraphic,
    sections: readonly ElkEdgeSection[],
    magneticBorder1: MagneticBorder,
    magneticBorder2: MagneticBorder,
  ): void {
    for (const section of sections) {
      const points = section.getBendPoints();

      let x1 = section.getStartX();
      let y1 = section.getStartY();

      const tmpStart = new XPoint2D(x1, y1);
      const force1 = magneticBorder1.getForceAt(getTranslated(this.translate, tmpStart), ug.getStringBounder());
      const start = getTranslated(force1, tmpStart);
      x1 = start.x;
      y1 = start.y;

      for (const pt of points) {
        this.drawLine(ug, x1, y1, pt.getX(), pt.getY());
        x1 = pt.getX();
        y1 = pt.getY();
      }

      const tmpEnd = new XPoint2D(section.getEndX(), section.getEndY() + this.magicY2);
      const force2 = magneticBorder2.getForceAt(getTranslated(this.translate, tmpEnd), ug.getStringBounder());
      const end = getTranslated(force2, tmpEnd);

      this.drawLine(ug, x1, y1, end.x, end.y);
    }
  }

  /** @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:349-352 */
  private drawLine(ug: UGraphic, x1: number, y1: number, x2: number, y2: number): void {
    const line = new ULine(x2 - x1, y2 - y1);
    ug.apply(new UTranslate(x1, y1)).draw(line);
  }
}
