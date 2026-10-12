/**
 * The engine-supplied diagram the ELK maker reads (cdd8 D13).
 *
 * Upstream's ELK path (`net/sourceforge/plantuml/elk/`) reads the abel model
 * directly: `CucaDiagram` (`net/atmp/CucaDiagram.java`), its `Entity` and
 * `Link` objects, the svek `Bibliotekon`/`ClusterManager`, and
 * `printEntityInternal(ent)` for each leaf's `IEntityImage`. The class and
 * description engines here have no such object model, so each implements
 * this one adapter over its own sizing and drawing (class: T3a; description:
 * T3b). Every member is named after the Java call it replaces and cites it.
 *
 * Identity: an entity (leaf or group) and a link are named by a string id,
 * unique within one diagram, standing for the Java object itself (the key of
 * upstream's `LinkedHashMap<Entity, ElkNode>` / `<Link, ElkEdge>`). Where Java
 * calls a method ON an entity or link, the member takes that id first.
 *
 * Style: upstream resolves colours, strokes, shadowing and round corners
 * through `StyleSignatureBasic#getMergedStyle`, which this port does not
 * have as an object; those members return the already-merged value, and each
 * names the signature it stands for.
 *
 * Read by `CucaDiagramFileMakerElk.ts` (T2a) and the `MyElkDrawing`,
 * `MyElkCluster` and `MyElkEdge` ports (T2b-T2d).
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkDrawing.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkCluster.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java
 */
import type { ColorType } from '../abel/ColorType.js';
import type { GroupType } from '../abel/GroupType.js';
import type { LeafType } from '../abel/LeafType.js';
import type { LinkType } from '../decoration/LinkType.js';
import type { USymbol } from '../decoration/symbol/USymbol.js';
import type { StringBounder } from '../klimt/font/StringBounder.js';
import type { HorizontalAlignment } from '../klimt/geom/HorizontalAlignment.js';
import type { MagneticBorder } from '../klimt/geom/MagneticBorder.js';
import type { XDimension2D } from '../klimt/geom/XDimension2D.js';
import type { XPoint2D } from '../klimt/geom/XPoint2D.js';
import type { TextBlock } from '../klimt/shape/TextBlock.js';
import type { UGraphic } from '../klimt/UGraphic.js';
import type { UStroke } from '../klimt/UStroke.js';
import type { Paint } from '../paint.js';
import type { PackageStyleName } from '../svek/PackageStyle.js';

/**
 * `new ClusterHeader(group, diagram, stringBounder)`: the three members the
 * ELK path reads.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/svek/ClusterHeader.java
 */
export interface ElkClusterHeader {
  /** `ClusterHeader#getTitleAndAttributeHeight` (an `int` upstream): `CucaDiagramFileMakerElk.java:331`. */
  getTitleAndAttributeHeight(): number;
  /** `ClusterHeader#getTitle`: `MyElkCluster.java:112`, `:157`. */
  getTitle(): TextBlock;
  /** `ClusterHeader#getStereo`: `MyElkCluster.java:112`, `:157`. */
  getStereo(): TextBlock;
}

/**
 * The merged `Style` facts `MyElkCluster` reads off a cluster style.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkCluster.java:93-116
 */
export interface ElkClusterStyle {
  /** `Style#getShadowing()`: `MyElkCluster.java:96`. */
  readonly shadowing: number;
  /** `Style#getStroke()`, the fallback of `Cluster.getStrokeInternal` (`Cluster.java:402-407`). */
  readonly stroke: UStroke;
  /** `style.value(PName.RoundCorner).asDouble()`: `MyElkCluster.java:104`. */
  readonly roundCorner: number;
  /** `style.value(PName.LineColor).asColor(...)`: `MyElkCluster.java:116`. */
  readonly lineColor: Paint;
}

/**
 * The merged arrow `Style` facts `MyElkEdge#drawU` reads: the style of
 * `StyleSignatureBasic.of(root, element, <diagram style name>, arrow)
 * .withTOBECHANGED(link.getStereotype())`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/MyElkEdge.java:140-145
 */
export interface ElkArrowStyle {
  /** `styleLine.value(PName.LineColor).asColor(...)`: `MyElkEdge.java:159`. */
  readonly lineColor: Paint;
  /** `styleLine.getStroke()`, possibly null: `MyElkEdge.java:170`. */
  readonly stroke: UStroke | null;
}

/**
 * `net.sourceforge.plantuml.klimt.color.Colors`: the members the ELK path
 * reads off an entity's or a link's colours.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/klimt/color/Colors.java
 */
export interface ElkColors {
  /** `Colors#getColor(key1)` / `getColor(key1, key2)`: `MyElkCluster.java:114`, `MyElkEdge.java:162`. */
  getColor(key1: ColorType, key2?: ColorType): Paint | null;
  /** `Colors#getSpecificLineStroke()`: `Cluster.java:402-407`, `MyElkEdge.java:179-180`. */
  getSpecificLineStroke(): UStroke | null;
}

/**
 * Upstream's `CucaDiagram` + `Entity` + `Link` + `Bibliotekon` +
 * `printEntityInternal`, as the ELK maker and drawing read them.
 */
export interface ElkDiagramAdapter {
  // --- CucaDiagram -----------------------------------------------------------

  /** `fileFormatOption.getDefaultStringBounder(diagram.getSkinParam(), diagram.getPragma())`: `CucaDiagramFileMakerElk.java:485-486`. */
  getDefaultStringBounder(): StringBounder;
  /** `CucaDiagram#getRootGroup()`: `CucaDiagramFileMakerElk.java:301`, `:488`. */
  getRootGroup(): string;
  /** `CucaDiagram#leafs()`, in entity-factory (creation) order: `CucaDiagramFileMakerElk.java:300`. */
  leafs(): readonly string[];
  /** `CucaDiagram#getChildrenGroups(group)`, in creation order: `CucaDiagramFileMakerElk.java:316`. */
  getChildrenGroups(groupId: string): readonly string[];
  /** `CucaDiagram#isEmpty(group)`: `CucaDiagramFileMakerElk.java:320`. */
  isEmpty(groupId: string): boolean;
  /** `CucaDiagram#getLinks()`, in diagram order: `CucaDiagramFileMakerElk.java:368`, `MyElkDrawing.java:152`. */
  getLinks(): readonly string[];

  // --- Entity ----------------------------------------------------------------

  /** `Entity#isRemoved()`: `CucaDiagramFileMakerElk.java:317`, `:359`. */
  isRemoved(entityId: string): boolean;
  /** `Entity#getGroupType()` of a group: `CucaDiagramFileMakerElk.java:320`, `:349`. */
  getGroupType(groupId: string): GroupType;
  /**
   * `Entity#muteToType(LeafType.EMPTY_PACKAGE)` (`CucaDiagramFileMakerElk.java:321`):
   * after it, the group is a leaf, and {@link calculateDimension} / {@link drawLeaf}
   * answer with the empty-package image.
   */
  muteToType(groupId: string, newType: LeafType): void;
  /** `Entity#leafs()` of a group, in creation order: `CucaDiagramFileMakerElk.java:352`. */
  groupLeafs(groupId: string): readonly string[];
  /** `Entity#getParentContainer()`: `CucaDiagramFileMakerElk.java:301`. */
  getParentContainer(entityId: string): string;
  /** `Entity#getUSymbol()` of a group: `MyElkCluster.java:94`, `:132`, `:156`. */
  getUSymbol(groupId: string): USymbol | null;
  /** `Entity#getPackageStyle()` of a group: `MyElkCluster.java:86`, `:133`. */
  getPackageStyle(groupId: string): PackageStyleName | null;
  /** `Entity#getColors()`: `MyElkCluster.java:114`, and `Cluster.getStrokeInternal` (`MyElkCluster.java:97`, `:151`). */
  getEntityColors(entityId: string): ElkColors;

  // --- printEntityInternal(ent) + Bibliotekon ---------------------------------

  /** `printEntityInternal(ent).calculateDimension(stringBounder)`: `CucaDiagramFileMakerElk.java:375-378`. */
  calculateDimension(entityId: string, stringBounder: StringBounder): XDimension2D;
  /**
   * Draws a node's image with its top-left corner at `corner`:
   * `MyElkDrawing.java:133-142` — `svekNode.resetMove(); svekNode.moveDelta(corner)`
   * on the node `Bibliotekon#createNode` registered (`CucaDiagramFileMakerElk.java:380-381`),
   * then `IEntityImageUtils.translate(printEntityInternal(entity), UTranslate.point(corner)).drawU(ug)`.
   */
  drawLeaf(entityId: string, ug: UGraphic, corner: XPoint2D): void;
  /**
   * `printEntityInternal(entity).getMagneticBorder()`, untranslated
   * (`MyElkEdge.java:188-194`; `IEntityImageUtils.java` `translate(...)` wraps it
   * with `translate.reverse()`, which the drawing applies).
   */
  getMagneticBorder(entityId: string): MagneticBorder;

  // --- ClusterHeader + cluster style (MyElkCluster) ---------------------------

  /** `new ClusterHeader(g, diagram, stringBounder)`: `CucaDiagramFileMakerElk.java:329`, `MyElkCluster.java:109`, `:154`. */
  getClusterHeader(groupId: string, stringBounder: StringBounder): ElkClusterHeader;
  /**
   * `Cluster.getDefaultStyleDefinition(diagramType.getStyleName(), group.getUSymbol(),
   * group.getGroupType()).getMergedStyle(skinParam.getCurrentStyleBuilder())`:
   * `MyElkCluster.java:93-95`.
   */
  getClusterStyle(groupId: string): ElkClusterStyle;
  /**
   * `Cluster.getDefaultStyleDefinition(SName.classDiagram, uSymbol, group.getGroupType())
   * .withTOBECHANGED(group.getStereotype()).getMergedStyle(...)`, with the
   * FOLDER-guessed `uSymbol`: `MyElkCluster.java:145-149`.
   */
  getClusterStyleForMagneticBorder(groupId: string, uSymbol: USymbol): ElkClusterStyle;
  /**
   * `Cluster.getBackColor(null, group.getStereotype(), diagramType.getStyleName(),
   * group.getUSymbol(), ..., group.getGroupType())`: the style's
   * `BackGroundColor`, transparent when unset (`MyElkCluster.java:99-102`, `Cluster.java:701-712`).
   */
  getClusterBackColor(groupId: string): Paint;

  // --- Skin parameters ---------------------------------------------------------

  /** `skinParam.packageStyle()`: `MyElkCluster.java:89`, `:135`. */
  packageStyle(): PackageStyleName;
  /** `skinParam.getHorizontalAlignment(AlignmentParam.packageTitleAlignment, null, false, null)`: `MyElkCluster.java:118`, `:160`. */
  getPackageTitleAlignment(): HorizontalAlignment;
  /** `skinParam.getStereotypeAlignment()`: `MyElkCluster.java:119`, `:161`. */
  getStereotypeAlignment(): HorizontalAlignment;
  /** `skinParam.getThickness(LineParam.arrow, null)`: `MyElkEdge.java:171`. */
  getArrowThickness(): UStroke | null;

  // --- Link ----------------------------------------------------------------------

  /** `Link#getEntity1()`: `CucaDiagramFileMakerElk.java:415`, `MyElkEdge.java:182`. */
  getEntity1(linkId: string): string;
  /** `Link#getEntity2()`: `CucaDiagramFileMakerElk.java:416`, `MyElkEdge.java:183`. */
  getEntity2(linkId: string): string;
  /** `Link#getQuantifier1()`: `CucaDiagramFileMakerElk.java:430`. */
  getQuantifier1(linkId: string): string | null;
  /** `Link#getQuantifier2()`: `CucaDiagramFileMakerElk.java:444`. */
  getQuantifier2(linkId: string): string | null;
  /** `Link#getRole1()`: `CucaDiagramFileMakerElk.java:430`. */
  getRole1(linkId: string): string | null;
  /** `Link#getRole2()`: `CucaDiagramFileMakerElk.java:444`. */
  getRole2(linkId: string): string | null;
  /**
   * The maker's private `getLabel(stringBounder, link)` (`CucaDiagramFileMakerElk.java:189-248`,
   * duplicated at `MyElkDrawing.java:244-306`): the arrow-styled label, its
   * visibility modifier and margins, merged with the link's note. Never null:
   * upstream returns `TextBlockUtils.EMPTY_TEXT_BLOCK`, i.e. `empty(0, 0)`
   * (`TextBlockUtils.java:57`), when the link has no label and no note. Return
   * `TextBlockUtils.empty(0, 0)` for it: this port's `EMPTY_TEXT_BLOCK` constant
   * is `undefined` (`src/core/klimt/shape/TextBlockUtils.ts:60`), which the maker
   * cannot measure.
   */
  getLabel(linkId: string, stringBounder: StringBounder): TextBlock;
  /**
   * The maker's private `getQuantifier(stringBounder, link, n)`
   * (`CucaDiagramFileMakerElk.java:250-263`, `MyElkDrawing.java:309-322`): null
   * when the quantifier is null or its `FontParam.ARROW` block is empty.
   */
  getQuantifier(linkId: string, n: 1 | 2, stringBounder: StringBounder): TextBlock | null;
  /**
   * The maker's private `getRoleLabel(stringBounder, link, n)`
   * (`CucaDiagramFileMakerElk.java:265-278`, `MyElkDrawing.java:324-337`): null
   * when the role is null or its `FontParam.ARROW` block is empty.
   */
  getRoleLabel(linkId: string, n: 1 | 2, stringBounder: StringBounder): TextBlock | null;
  /** `Link#isInvis()`: `MyElkDrawing.java:154`. */
  isInvis(linkId: string): boolean;
  /** `Link#isHidden()`: `MyElkEdge.java:150`. */
  isHidden(linkId: string): boolean;
  /** `Link#getType()`: `MyElkEdge.java:169`, `:209-210`. */
  getType(linkId: string): LinkType;
  /** `MyElkEdge#getStyle()`, merged: `MyElkEdge.java:140-145`. */
  getArrowStyle(linkId: string): ElkArrowStyle;
  /** `Link#getColors()`, possibly null: `MyElkEdge.java:161-162`, `:179`. */
  getLinkColors(linkId: string): ElkColors | null;
  /** `Link#getSpecificColor()`: `MyElkEdge.java:165-166`. */
  getSpecificColor(linkId: string): Paint | null;
}
