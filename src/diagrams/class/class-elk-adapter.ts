/**
 * The class engine's {@link ElkDiagramAdapter} (cdd8 T3a, D13): upstream's
 * `CucaDiagram` + `Entity` + `Link` + `printEntityInternal`, as
 * `CucaDiagramFileMakerElk`/`MyElkDrawing`/`MyElkCluster`/`MyElkEdge` read
 * them, over the class engine's own parsed model.
 *
 * - Leaves are the classifiers the svek path sizes (`layout.ts#preMeasureClassifiers`),
 *   each drawn by the svek leaf draw (`renderer-leaf.ts`): upstream feeds both
 *   makers the same entity image (`CucaDiagramFileMakerElk.java:462-474`,
 *   `GeneralImageBuilder.createEntityImageBlock`).
 * - Groups are the namespaces; an empty package is a group until the maker
 *   mutes it (`CucaDiagramFileMakerElk.java:320-322`).
 * - Links are the relationships, in `CucaDiagram#getLinks()` (parse) order.
 *
 * `drawLeaf` is supplied by the caller: the layout's `LimitFinder` pass
 * (`class-elk-layout.ts`) and the SVG pass (`renderer-elk.ts`) draw the same
 * leaf differently, as upstream's one `IEntityImage#drawU` does under
 * `LimitFinder` and `UGraphicSvg`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java
 */
import type { ClassDiagramAST, Classifier, Namespace, Relationship } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { ClassifierGeo } from './class-geo-types.js';
import type { ElkDiagramAdapter, ElkClusterHeader, ElkColors } from '../../core/elk/ElkDiagramAdapter.js';
import { GroupType } from '../../core/abel/GroupType.js';
import { LinkDecor } from '../../core/decoration/LinkDecor.js';
import { LinkType } from '../../core/decoration/LinkType.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { MagneticBorder } from '../../core/klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../../core/klimt/geom/MagneticBorderNone.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { MeasurerStringBounder } from '../../core/measurer-bounder.js';
import { PackageStyle } from '../../core/svek/PackageStyle.js';
import { EntityImageDescription } from '../../core/svek/image/EntityImageDescription.js';
import { decorName } from './renderer-arrowhead.js';
import { EDGE_DECORATION_MAP, type EdgeDecoration } from './class-dot-edges.js';
import { buildUSymbolEntityParams, usesClassUSymbolEntity } from './renderer-usymbol-entity.js';
import { scaleClassTheme } from './class-scale-geo.js';
import { splitStereotypeStyleTags } from './class-stereotype.js';
import { packageBorderColor, packageBorderThickness, PACKAGE_ROUND_CORNER } from './class-package-style.js';
import { namespaceColorFill } from './class-namespace-shape.js';
import { classElkClusterTitle, classElkEndLabel, classElkLinkLabel } from './class-elk-text.js';

/** `CucaDiagram#getRootGroup()`'s id: no namespace id is empty. */
export const CLASS_ELK_ROOT_GROUP = '';
/** `plantuml.skin:102-114`: `group { package { LineThickness 1.5; LineColor black } }`. */
const PACKAGE_LINE_THICKNESS = 1.5;
const PACKAGE_LINE_COLOR = '#000000';

/** What the adapter reads: the class model after the svek path's own pre-steps. */
export interface ClassElkModel {
  /** The page AST after `collapseEmptyNamespacesFinal` and `filterRemovedEntities` (`layout.ts`). */
  readonly ast: ClassDiagramAST;
  readonly theme: Theme;
  readonly measurer: StringMeasurer;
  /** Every leaf's geometry with its corner at (0, 0), keyed by id. */
  readonly leafGeos: ReadonlyMap<string, ClassifierGeo>;
  /** `Entity#isHidden()` (`abel/Link.java:459` ORs it into `Link#isHidden`). */
  readonly hiddenIds: ReadonlySet<string>;
  /**
   * `CucaDiagram#getLinks()`: the relationships, then the invisible links
   * `applySingleStrategy` adds at `ClassDiagram#checkFinalError`
   * (`ClassDiagram.java:87`, `CucaDiagram.java:701-726`, `Magma.java:51`).
   */
  readonly links: readonly Relationship[];
}

/** {@link ElkDiagramAdapter.drawLeaf}. */
export type ClassElkLeafDrawer = (entityId: string, ug: UGraphic, corner: XPoint2D) => void;

const NO_COLORS: ElkColors = { getColor: () => null, getSpecificLineStroke: () => null };

/** An empty package the class parser already muted to a leaf (`class-namespace.ts#collapseEmptyNamespace`). */
function isCollapsedGroup(c: Classifier): boolean {
  return c.collapsedGroup === true;
}

/** Creation order (the entity factory's), falling back to array order when any index is missing. */
function inCreationOrder<T extends { readonly creationIndex?: number }>(items: readonly T[]): T[] {
  if (items.some((i) => i.creationIndex === undefined)) return [...items];
  return [...items].sort((a, b) => a.creationIndex! - b.creationIndex!);
}

function requireValue<V>(map: ReadonlyMap<string, V>, id: string, what: string): V {
  const value = map.get(id);
  if (value === undefined) throw new Error(`class ELK: unknown ${what} ${id}`);
  return value;
}

/** Indexes over the model the members below share. */
interface ClassElkIndex {
  readonly model: ClassElkModel;
  readonly namespaces: ReadonlyMap<string, Namespace>;
  readonly classifiers: ReadonlyMap<string, Classifier>;
  readonly parentOf: ReadonlyMap<string, string>;
  readonly links: ReadonlyMap<string, Relationship>;
  /** `Entity#muteToType(EMPTY_PACKAGE)` calls so far: a muted package is a leaf from then on. */
  readonly muted: Set<string>;
}

function buildIndex(model: ClassElkModel): ClassElkIndex {
  const parentOf = new Map<string, string>();
  for (const ns of model.ast.namespaces) {
    parentOf.set(ns.id, ns.parentId ?? CLASS_ELK_ROOT_GROUP);
    for (const id of ns.classifiers) parentOf.set(id, ns.id);
  }
  return {
    model,
    namespaces: new Map(model.ast.namespaces.map((ns) => [ns.id, ns])),
    classifiers: new Map(model.ast.classifiers.map((c) => [c.id, c])),
    parentOf,
    links: new Map(model.links.map((rel, i) => [linkId(i), rel])),
    muted: new Set(),
  };
}

/** A link's id: its position in `getLinks()`. */
function linkId(index: number): string {
  return `lnk${index}`;
}

function parentContainer(index: ClassElkIndex, entityId: string): string {
  return index.parentOf.get(entityId) ?? CLASS_ELK_ROOT_GROUP;
}

/** `Entity#isGroup() == false`: a classifier, or a package muted to a leaf. */
function isLeaf(index: ClassElkIndex, c: Classifier): boolean {
  return !isCollapsedGroup(c) || index.muted.has(c.id);
}

/** `CucaDiagram`'s members (`CucaDiagramFileMakerElk.java:298-371`). */
function diagramMembers(index: ClassElkIndex) {
  const ast = index.model.ast;
  return {
    getDefaultStringBounder: (): StringBounder => new MeasurerStringBounder(index.model.measurer),
    getRootGroup: (): string => CLASS_ELK_ROOT_GROUP,
    // `CucaDiagram#leafs()` (`CucaDiagram.java:858-868`): every non-group entity.
    leafs: (): string[] => inCreationOrder(ast.classifiers.filter((c) => isLeaf(index, c))).map((c) => c.id),
    // `Entity#groups()` of the group (`Entity.java:659-667`), read before any mute.
    getChildrenGroups: (groupId: string): string[] => {
      const groups: { id: string; creationIndex?: number }[] = [
        ...ast.namespaces.filter((ns) => parentContainer(index, ns.id) === groupId),
        ...ast.classifiers.filter((c) => isCollapsedGroup(c) && parentContainer(index, c.id) === groupId),
      ];
      return inCreationOrder(groups).map((g) => g.id);
    },
    isEmpty: (groupId: string): boolean => index.classifiers.has(groupId),
    getLinks: (): string[] => index.model.links.map((_, i) => linkId(i)),
  };
}

/** `Entity`'s members (`CucaDiagramFileMakerElk.java:301-364`, `MyElkCluster.java:86-151`). */
function entityMembers(index: ClassElkIndex) {
  return {
    isRemoved: (): boolean => false,
    getGroupType: (): GroupType => GroupType.PACKAGE,
    muteToType: (groupId: string): void => {
      index.muted.add(groupId);
    },
    // `Entity#leafs()` (`Entity.java:649-657`).
    groupLeafs: (groupId: string): string[] => {
      const ns = requireValue(index.namespaces, groupId, 'group');
      const leaves = ns.classifiers.map((id) => requireValue(index.classifiers, id, 'leaf'));
      return inCreationOrder(leaves.filter((c) => isLeaf(index, c))).map((c) => c.id);
    },
    getParentContainer: (entityId: string): string => parentContainer(index, entityId),
    getUSymbol: () => null,
    getPackageStyle: () => null,
    getEntityColors: (): ElkColors => NO_COLORS,
  };
}

/** `printEntityInternal(ent)`'s dimension and magnetic border. */
function imageMembers(index: ClassElkIndex) {
  const { model } = index;
  return {
    calculateDimension: (entityId: string): XDimension2D => {
      const geo = requireValue(model.leafGeos, entityId, 'leaf');
      return new XDimension2D(geo.width, geo.height);
    },
    // `EntityImageDescription.java:362-366` is the only class leaf image
    // answering a real border (`class-leaf-magnetic-border.ts`).
    getMagneticBorder: (entityId: string): MagneticBorder => {
      const geo = requireValue(model.leafGeos, entityId, 'leaf');
      if (!usesClassUSymbolEntity(geo)) return new MagneticBorderNone();
      const params = buildUSymbolEntityParams(geo, scaleClassTheme(model.theme, 1), model.theme.sprites);
      return new EntityImageDescription(params).getMagneticBorder();
    },
  };
}

/**
 * `new ClusterHeader(g, diagram, stringBounder)` (`ClusterHeader.java:73-96`):
 * a class package has no state description and no `USymbol`, so
 * `titleAndAttributeHeight` is `(int) mergeTB(stereo, title).height` when
 * the label has a width, else 0.
 */
function clusterHeader(index: ClassElkIndex, groupId: string, stringBounder: StringBounder): ElkClusterHeader {
  const ns = requireValue(index.namespaces, groupId, 'group');
  const title = classElkClusterTitle(ns, index.model.theme, namespaceTags(ns));
  const stereo = TextBlockUtils.empty(0, 0);
  const dimLabel = TextBlockUtils.mergeTB(stereo, title, HorizontalAlignment.CENTER).calculateDimension(stringBounder);
  const height = dimLabel.getWidth() > 0 ? Math.trunc(dimLabel.getHeight()) : 0;
  return { getTitleAndAttributeHeight: () => height, getTitle: () => title, getStereo: () => stereo };
}

function namespaceTags(ns: Namespace): readonly string[] {
  return ns.stereotype === undefined ? [] : splitStereotypeStyleTags(ns.stereotype);
}

/** `Cluster.getDefaultStyleDefinition(classDiagram, null, PACKAGE)`'s merged facts (`MyElkCluster.java:93-104`). */
function clusterStyle(index: ClassElkIndex, groupId: string) {
  const theme = index.model.theme;
  const tags = namespaceTags(requireValue(index.namespaces, groupId, 'group'));
  return {
    shadowing: theme.shadowing ?? 0,
    stroke: UStroke.withThickness(packageBorderThickness(theme, tags, PACKAGE_LINE_THICKNESS)),
    roundCorner: PACKAGE_ROUND_CORNER,
    lineColor: packageBorderColor(theme, tags, PACKAGE_LINE_COLOR),
  };
}

/** `MyElkCluster`'s reads (`MyElkCluster.java:86-161`). */
function clusterMembers(index: ClassElkIndex) {
  const theme = index.model.theme;
  return {
    getClusterHeader: (groupId: string, stringBounder: StringBounder) => clusterHeader(index, groupId, stringBounder),
    getClusterStyle: (groupId: string) => clusterStyle(index, groupId),
    getClusterStyleForMagneticBorder: (groupId: string) => clusterStyle(index, groupId),
    // `getBackColor(diagramType)` is null (`MyElkCluster.java:128-130`), so the
    // group's own colour is never read: the style's `BackGroundColor`.
    getClusterBackColor: () => namespaceColorFill(undefined, theme),
    packageStyle: () => (theme.packageStyle === 'rect' ? PackageStyle.RECTANGLE : PackageStyle.FOLDER),
    // `AlignmentParam.packageTitleAlignment(CENTER)` (`AlignmentParam.java:44`).
    getPackageTitleAlignment: () => HorizontalAlignment.CENTER,
    // `SkinParam#getStereotypeAlignment` defaults to CENTER (`SkinParam.java:741-748`).
    getStereotypeAlignment: () => HorizontalAlignment.CENTER,
    // `skinParam.getThickness(LineParam.arrow, null)`: null unless `skinparam arrowThickness`.
    getArrowThickness: () =>
      theme.colors.graph.arrowThickness === undefined ? null : UStroke.withThickness(theme.colors.graph.arrowThickness),
  };
}

/**
 * `from`/`to` are upstream's `cl1`/`cl2` unless the parser normalized them by
 * the arrowhead (`Relationship.dotEdgeReversed`'s doc comment).
 */
function reversed(rel: Relationship): boolean {
  return rel.dotEdgeReversed === true;
}

function decorOf(decor: Relationship['sourceDecor']): LinkDecor {
  return decor === undefined ? LinkDecor.NONE : (decorName(decor) ?? LinkDecor.NONE);
}

/**
 * `Link#getType()`: `decor1` is drawn at entity 2, `decor2` at entity 1
 * (`MyElkEdge.java:209-223`), with the link's line style. The decor and
 * dashing of each end resolve as the svek path's do
 * (`class-edge-group-inheritance.ts#resolveNormalEdgeDecor`: the arrow's own
 * head, else the relationship type's, `class-dot-edges.ts#EDGE_DECORATION_MAP`).
 */
function linkType(rel: Relationship): LinkType {
  const byType = EDGE_DECORATION_MAP[rel.type];
  const { atFrom, atTo } = endDecors(rel, byType);
  const type = reversed(rel) ? new LinkType(atFrom, atTo) : new LinkType(atTo, atFrom);
  const styled = withLineStyle(type, rel, rel.dashed ?? rel.dashedBody ?? byType.dashed);
  return rel.invis === true ? styled.getInvisible() : styled;
}

/** The decor at `from` and at `to`: the arrow's own head, else the type's. */
function endDecors(rel: Relationship, byType: EdgeDecoration): { atFrom: LinkDecor; atTo: LinkDecor } {
  return {
    atFrom: decorOf(rel.sourceDecor ?? byType.sourceDecor),
    atTo: decorOf(rel.targetDecor ?? byType.targetDecor),
  };
}

/** The arrow body's style: `.` dashing, `-[dashed|dotted|bold|thickness=N]-`. */
function withLineStyle(type: LinkType, rel: Relationship, dashed: boolean): LinkType {
  let result = type;
  if (dashed || rel.lineStyleOverride === 'dashed') result = result.goDashed();
  if (rel.lineStyleOverride === 'dotted') result = result.goDotted();
  if (rel.lineStyleOverride === 'bold') result = result.goBold();
  if (rel.thicknessOverride !== undefined) result = result.goThickness(rel.thicknessOverride);
  return result;
}

/** `Link#getEntity1/2`, `getQuantifier1/2`, `getRole1/2`. */
function linkEndMembers(index: ClassElkIndex) {
  const link = (id: string): Relationship => requireValue(index.links, id, 'link');
  return {
    getEntity1: (id: string) => (reversed(link(id)) ? link(id).to : link(id).from),
    getEntity2: (id: string) => (reversed(link(id)) ? link(id).from : link(id).to),
    getQuantifier1: (id: string) => (reversed(link(id)) ? link(id).toMultiplicity : link(id).fromMultiplicity) ?? null,
    getQuantifier2: (id: string) => (reversed(link(id)) ? link(id).fromMultiplicity : link(id).toMultiplicity) ?? null,
    getRole1: (id: string) => (reversed(link(id)) ? link(id).toRole : link(id).fromRole) ?? null,
    getRole2: (id: string) => (reversed(link(id)) ? link(id).fromRole : link(id).toRole) ?? null,
  };
}

/** The maker's private text builders and `MyElkEdge`'s link reads. */
function linkMembers(index: ClassElkIndex, ends: ReturnType<typeof linkEndMembers>) {
  const theme = index.model.theme;
  const link = (id: string): Relationship => requireValue(index.links, id, 'link');
  const hidden = (entity: string): boolean => index.model.hiddenIds.has(entity);
  return {
    getLabel: (id: string) => classElkLinkLabel(link(id), theme),
    getQuantifier: (id: string, n: 1 | 2, sb: StringBounder) =>
      classElkEndLabel((n === 1 ? ends.getQuantifier1(id) : ends.getQuantifier2(id)) ?? undefined, theme, sb),
    getRoleLabel: (id: string, n: 1 | 2, sb: StringBounder) =>
      classElkEndLabel((n === 1 ? ends.getRole1(id) : ends.getRole2(id)) ?? undefined, theme, sb),
    isInvis: (id: string) => link(id).invis === true,
    // `Link#isHidden` (`abel/Link.java:459`): its own flag, or either end's.
    isHidden: (id: string) => link(id).hidden === true || hidden(link(id).from) || hidden(link(id).to),
    getType: (id: string) => linkType(link(id)),
    // `{root, element, classDiagram, arrow}` (`MyElkEdge.java:140-145`).
    getArrowStyle: () => ({
      lineColor: theme.colors.graph.classCascadeArrowColor ?? theme.colors.arrow,
      stroke: UStroke.simple(),
    }),
    getLinkColors: () => null,
    getSpecificColor: (id: string) => link(id).colorOverride ?? null,
  };
}

/** Upstream features the class ELK path does not reach yet: refused rather than drawn wrong. */
function assertSupported(ast: ClassDiagramAST): void {
  const unsupported = [
    ast.notes.length > 0 ? 'notes' : undefined,
    ast.namespaces.some((ns) => ns.stereotype !== undefined || ns.legend !== undefined)
      ? 'stereotyped packages'
      : undefined,
    ast.namespaces.some((ns) => ns.usymbol !== undefined) ? 'USymbol packages' : undefined,
    ast.relationships.some((rel) => rel.linkNote !== undefined) ? 'notes on links' : undefined,
    (ast.togethers ?? []).length > 0 ? 'together groups' : undefined,
  ].filter((s) => s !== undefined);
  if (unsupported.length > 0)
    throw new Error(`!pragma layout elk: ${unsupported.join(', ')} not yet supported in class diagrams`);
}

/**
 * The adapter over `model`, drawing each leaf with `drawLeaf`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java:137-501
 */
export function createClassElkAdapter(model: ClassElkModel, drawLeaf: ClassElkLeafDrawer): ElkDiagramAdapter {
  assertSupported(model.ast);
  const index = buildIndex(model);
  const ends = linkEndMembers(index);
  return {
    ...diagramMembers(index),
    ...entityMembers(index),
    ...imageMembers(index),
    ...clusterMembers(index),
    ...ends,
    ...linkMembers(index, ends),
    drawLeaf,
  };
}

/** The same adapter with another leaf draw: the SVG pass's (`renderer-elk.ts`). */
export function withClassElkLeafDrawer(adapter: ElkDiagramAdapter, drawLeaf: ClassElkLeafDrawer): ElkDiagramAdapter {
  return { ...adapter, drawLeaf };
}
