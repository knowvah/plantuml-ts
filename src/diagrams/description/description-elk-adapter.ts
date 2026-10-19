/**
 * `ElkDiagramAdapter` over the description engine (cdd8 T3b, D13).
 *
 * Upstream's ELK maker is cuca-level (`CucaDiagram.java:478-479`), so a
 * component / deployment / use-case / C4 diagram with `!pragma layout elk`
 * takes `CucaDiagramFileMakerElk` exactly like a class diagram does. The maker
 * and `MyElkDrawing` read the abel model (`Entity`, `Link`, `Bibliotekon`,
 * `printEntityInternal`); this engine has no such model, so this adapter
 * answers each read from the pieces the dot path already builds:
 *
 *  - the `ClassifyCtx` (`layout-classify.ts`): which AST nodes are leaves and
 *    which are groups, and each group's direct leaves;
 *  - the leaf sizer (`buildDotNodes` -> `measureLeafNode`): the SAME number
 *    that becomes the dot node width/height is the ELK node size, as upstream
 *    feeds both makers the same `printEntityInternal(ent)` image;
 *  - the leaf drawer (`renderer-entity.ts#drawEntity`) and the cluster chrome
 *    (`renderer-cluster.ts`), behind `drawLeaf` / `getClusterHeader`.
 *
 * Identity: a leaf or group is named by its canonical key (`dotKeyFor`, the
 * `ClassifyCtx` key); a link by `link<index>` into `ast.links`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/net/atmp/CucaDiagram.java
 */
import type { ElkBackend } from '../../core/elk/elk-backend.js';
import type {
  ElkArrowStyle,
  ElkClusterHeader,
  ElkClusterStyle,
  ElkColors,
  ElkDiagramAdapter,
} from '../../core/elk/ElkDiagramAdapter.js';
import { makeElkLayout } from '../../core/elk/CucaDiagramFileMakerElk.js';
import { MyElkDrawing, newMyElkDrawing } from '../../core/elk/MyElkDrawing.js';
import type { ColorType } from '../../core/abel/ColorType.js';
import { GroupType } from '../../core/abel/GroupType.js';
import type { LeafType } from '../../core/abel/LeafType.js';
import { lookupDecors1, lookupDecors2 } from '../../core/decoration/LinkDecor.js';
import { LinkStyle } from '../../core/decoration/LinkStyle.js';
import { LinkType } from '../../core/decoration/LinkType.js';
import type { USymbol as UpstreamUSymbol } from '../../core/decoration/symbol/USymbol.js';
import { resolveSymbol } from '../../core/decoration/symbol/usymbol-resolve.js';
import type { StringBounder } from '../../core/klimt/font/StringBounder.js';
import { HorizontalAlignment } from '../../core/klimt/geom/HorizontalAlignment.js';
import type { MagneticBorder } from '../../core/klimt/geom/MagneticBorder.js';
import { MagneticBorderNone } from '../../core/klimt/geom/MagneticBorderNone.js';
import { XDimension2D } from '../../core/klimt/geom/XDimension2D.js';
import type { XPoint2D } from '../../core/klimt/geom/XPoint2D.js';
import type { TextBlock } from '../../core/klimt/shape/TextBlock.js';
import { TextBlockUtils } from '../../core/klimt/shape/TextBlockUtils.js';
import type { UGraphic } from '../../core/klimt/UGraphic.js';
import { UStroke } from '../../core/klimt/UStroke.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { Paint } from '../../core/paint.js';
import { CreoleMode } from '../../core/klimt/creole/CreoleMode.js';
import { LineBreakStrategy } from '../../core/klimt/LineBreakStrategy.js';
import { splitDisplayLines } from '../../core/klimt/creole/DisplayNewlines.js';
import { EntityImageDescription } from '../../core/svek/image/EntityImageDescription.js';
import { PackageStyle, type PackageStyleName } from '../../core/svek/PackageStyle.js';
import type { Theme } from '../../core/theme.js';
import type { DescriptionDiagramAST, DescriptiveLink } from './ast.js';
import { effectiveHiddenIds, effectiveRemovedIds } from './element-grammar.js';
import { classifyAst } from './layout-classify.js';
import { buildDotNodes, buildGeoTree } from './layout-dot-tree.js';
import { buildNodeGeoIndex, resolveEndpoint } from './layout-helpers.js';
import type { DescriptionElkDrawing, DescriptionNodeGeo } from './layout-helpers-types.js';
import { createClassifyCtx } from './layout.js';
import type { ClassifyCtx } from './layout-types.js';
import { buildMagmaEdges, magmaGroups } from './magma.js';
import { buildNamespaceGroups } from './namespace-groups.js';
import { elkDisplayBlock } from './description-elk-label.js';
import { buildHeader, buildStyleDefaults } from './renderer-cluster.js';
import { arrowLabelFontConfig } from './renderer-edge.js';
import { buildEntityParams, drawEntity } from './renderer-entity.js';
import { driverBounderFor, klimtStringBounderFor } from './renderer-ink-extent.js';
import { buildUidPlan, type UidPlan } from './renderer-uid.js';

/** Link ids: `link<index into ast.links>`, and `magma<k>` for `applySingleStrategy`'s chaining links. */
const LINK_ID_PREFIX = 'link';
const MAGMA_ID_PREFIX = 'magma';

/** `GroupType.ROOT`'s group: `CucaDiagram#getRootGroup()` (`CucaDiagramFileMakerElk.java:301`, `:488`). */
export const ROOT_GROUP = '';

/** `Cluster.java`'s default arrow `LineThickness`: `plantuml.skin:316-319` (`arrow { LineThickness 1.0 }`). */
const ARROW_LINE_THICKNESS = 1;

/** `Link#getLabel` margin: `CucaDiagramFileMakerElk.java:158`, `:192`. */
const LABEL_MARGIN = 1;

/** `Colors.empty()`: no per-entity colours (`Entity#getColors()` of an uncoloured group). */
const NO_COLORS: ElkColors = {
  getColor(_key1: ColorType, _key2?: ColorType): Paint | null {
    return null;
  },
  getSpecificLineStroke(): UStroke | null {
    return null;
  },
};

/** A leaf's `printEntityInternal(ent).calculateDimension` (`measureLeafNode`). */
interface LeafSize {
  readonly width: number;
  readonly height: number;
}

/**
 * `style.getHorizontalAlignment()` of the cluster title (`ClusterHeader.java:121`): the root tier, `left` unless
 * `skinparam defaultTextAlignment` set it (`FromSkinparamToStyle.java:155`, `plantuml.skin:11`).
 */
function rootTextAlignment(theme: Theme): HorizontalAlignment {
  return theme.colors.elements?.['root']?.horizontalAlignment ?? HorizontalAlignment.LEFT;
}

/** What `buildDescriptionElkContext` hands the adapter. */
export interface DescriptionElkContext {
  readonly ast: DescriptionDiagramAST;
  readonly theme: Theme;
  readonly stringBounder: StringBounder;
  readonly ctx: ClassifyCtx;
  readonly removed: ReadonlySet<string>;
  readonly hidden: ReadonlySet<string>;
  /** Leaf key -> the sizer's width/height (`measureLeafNode`). */
  readonly dims: ReadonlyMap<string, LeafSize>;
  /** Structural geo tree (positions are placeholders): display, symbol, stereotype per node. */
  readonly geo: ReadonlyMap<string, DescriptionNodeGeo>;
  readonly uids: UidPlan;
}

/** One resolved `ast.links` entry. */
interface ResolvedLink {
  readonly link: DescriptiveLink;
  readonly entity1: string;
  readonly entity2: string;
}

/** `Link#getType()` of a description link: `CommandLinkElement.java:140` (`new LinkType(d2, d1)`), then its style. */
function linkTypeOf(link: DescriptiveLink): LinkType {
  const decor1 = lookupDecors2(link.headDecor ?? null);
  const decor2 = lookupDecors1(link.tailDecor ?? null);
  let style = link.hidden === true ? LinkStyle.INVISIBLE() : styleOf(link.style);
  if (link.thicknessOverride !== undefined) style = style.goThickness(link.thicknessOverride);
  return new LinkType(decor1, decor2, undefined, style);
}

function styleOf(style: DescriptiveLink['style']): LinkStyle {
  switch (style) {
    case 'dashed':
      return LinkStyle.DASHED();
    case 'dotted':
      return LinkStyle.DOTTED();
    case 'bold':
      return LinkStyle.BOLD();
    case 'solid':
      return LinkStyle.NORMAL();
  }
}

/**
 * `ElkDiagramAdapter` for a description diagram.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/elk/CucaDiagramFileMakerElk.java
 */
export class DescriptionElkAdapter implements ElkDiagramAdapter {
  /** Group key -> parent group key (`ROOT_GROUP` at top level), from `ContainerDesc.parentAstId`. */
  private readonly groupParent = new Map<string, string>();
  /** Leaf key -> its group (`Entity#getParentContainer`). */
  private readonly leafParent = new Map<string, string>();
  private readonly resolvedLinks = new Map<string, ResolvedLink>();
  private readonly leafOrder: string[];

  constructor(private readonly input: DescriptionElkContext) {
    for (const c of input.ctx.containers) {
      this.groupParent.set(c.astId, c.parentAstId ?? ROOT_GROUP);
      for (const leaf of c.directLeafAstIds) this.leafParent.set(leaf, c.astId);
    }
    this.leafOrder = [...input.ctx.leafIdSet].sort((a, b) => this.creationIndexOf(a) - this.creationIndexOf(b));
    this.resolveLinks();
  }

  /** `EntityFactory` creation order: the parse-time `creationIndex` (`renderer-uid.ts`). */
  private creationIndexOf(key: string): number {
    return this.input.ctx.astNodeById.get(key)?.creationIndex ?? Number.MAX_SAFE_INTEGER;
  }

  /**
   * `Link#isRemoved` (`abel/Link.java:492-498`) and an endpoint that names no entity drop a link; the rest keep
   * their `ast.links` index as id. `applySingleStrategy`'s invisible chaining links come last, as upstream
   * appends them at parse end (`CucaDiagram.java:679-702`), so `getLinks()` carries them like any other link.
   */
  private resolveLinks(): void {
    const { ast, ctx } = this.input;
    const clusterIdByContainerAstId = new Map(ctx.containers.map((c) => [c.astId, c.clusterId]));
    const touched = new Set<string>();
    const endpoint = (id: string): { entity: string; node: string } | undefined => {
      const res = resolveEndpoint(
        id,
        ctx.leafIdSet,
        ctx.astNodeById,
        clusterIdByContainerAstId,
        ctx.qualifiedPathToDotKey,
      );
      return res === undefined ? undefined : { entity: res.containerAstId ?? res.dotNodeId, node: res.dotNodeId };
    };
    ast.links.forEach((link, index) => {
      if (link.removed === true) return;
      const from = endpoint(link.from);
      const to = endpoint(link.to);
      if (from === undefined || to === undefined) return;
      touched.add(from.node).add(to.node);
      if (this.isRemoved(from.entity) || this.isRemoved(to.entity)) return;
      this.resolvedLinks.set(`${LINK_ID_PREFIX}${index}`, { link, entity1: from.entity, entity2: to.entity });
    });
    this.addMagmaLinks(touched);
  }

  /** `DescriptionDiagram#checkFinalError` -> `CucaDiagram#applySingleStrategy`: invisible links chaining standalone leaves. */
  private addMagmaLinks(touched: ReadonlySet<string>): void {
    const edges = buildMagmaEdges(magmaGroups(this.input.ctx), touched);
    edges.forEach((edge, k) => {
      const link: DescriptiveLink = { from: edge.from, to: edge.to, style: 'solid', length: 1, hidden: true };
      this.resolvedLinks.set(`${MAGMA_ID_PREFIX}${k}`, { link, entity1: edge.from, entity2: edge.to });
    });
  }

  private resolved(linkId: string): ResolvedLink {
    const found = this.resolvedLinks.get(linkId);
    if (found === undefined) throw new Error(`DescriptionElkAdapter: unknown link ${linkId}`);
    return found;
  }

  private nodeGeo(entityId: string): DescriptionNodeGeo {
    const geo = this.input.geo.get(entityId);
    if (geo === undefined) throw new Error(`DescriptionElkAdapter: unknown entity ${entityId}`);
    return geo;
  }

  // --- CucaDiagram -----------------------------------------------------------

  getDefaultStringBounder(): StringBounder {
    return this.input.stringBounder;
  }

  getRootGroup(): string {
    return ROOT_GROUP;
  }

  leafs(): readonly string[] {
    return this.leafOrder;
  }

  getChildrenGroups(groupId: string): readonly string[] {
    return this.input.ctx.containers.filter((c) => (c.parentAstId ?? ROOT_GROUP) === groupId).map((c) => c.astId);
  }

  /**
   * `CucaDiagram#isEmpty(group)`: a container is a `ClassifyCtx` group only when it has a visible child
   * (`isEffectiveCluster`), so none is empty; an empty one was classified as a leaf (the same demotion as
   * `GraphvizImageBuilder.java:416-418`).
   */
  isEmpty(_groupId: string): boolean {
    return false;
  }

  getLinks(): readonly string[] {
    return [...this.resolvedLinks.keys()];
  }

  // --- Entity ----------------------------------------------------------------

  isRemoved(entityId: string): boolean {
    const node = this.input.ctx.astNodeById.get(entityId);
    return node !== undefined && this.input.removed.has(node.id);
  }

  getGroupType(_groupId: string): GroupType {
    return GroupType.PACKAGE;
  }

  /** Empty groups are already leaves here (see {@link isEmpty}), so there is nothing to mute. */
  muteToType(_groupId: string, _newType: LeafType): void {}

  groupLeafs(groupId: string): readonly string[] {
    return this.input.ctx.containerById.get(groupId)?.directLeafAstIds ?? [];
  }

  getParentContainer(entityId: string): string {
    return this.leafParent.get(entityId) ?? this.groupParent.get(entityId) ?? ROOT_GROUP;
  }

  getUSymbol(groupId: string): UpstreamUSymbol | null {
    return resolveSymbol(this.nodeGeo(groupId).symbol, this.input.theme);
  }

  getPackageStyle(_groupId: string): PackageStyleName | null {
    return null;
  }

  /** `renderer-cluster.ts#buildCluster` passes no colour overrides either. */
  getEntityColors(_entityId: string): ElkColors {
    return NO_COLORS;
  }

  // --- printEntityInternal(ent) + Bibliotekon -----------------------------------

  calculateDimension(entityId: string, _stringBounder: StringBounder): XDimension2D {
    const dim = this.input.dims.get(entityId);
    if (dim === undefined) throw new Error(`DescriptionElkAdapter: no size for ${entityId}`);
    return new XDimension2D(dim.width, dim.height);
  }

  drawLeaf(entityId: string, ug: UGraphic, corner: XPoint2D): void {
    const geo = this.nodeGeo(entityId);
    const uid = this.input.uids.nodeUid.get(entityId)!; // every geo node has a uid (same tree)
    drawEntity(ug, { ...geo, x: corner.x, y: corner.y }, this.input.theme, uid, this.input.ast.sprites);
  }

  getMagneticBorder(entityId: string): MagneticBorder {
    const geo = this.nodeGeo(entityId);
    if (geo.symbol === 'note' || geo.symbol === 'port') return new MagneticBorderNone();
    const params = buildEntityParams(geo, this.input.theme, this.input.ast.sprites);
    return new EntityImageDescription(params).getMagneticBorder();
  }

  // --- ClusterHeader + cluster style ---------------------------------------------

  getClusterHeader(groupId: string, stringBounder: StringBounder): ElkClusterHeader {
    const geo = this.nodeGeo(groupId);
    const header = buildHeader(geo, this.input.theme, {
      sprites: this.input.ast.sprites,
      alignment: rootTextAlignment(this.input.theme),
    });
    const stereoAndTitle = TextBlockUtils.mergeTB(header.stereo, header.title, header.titleHorizontalAlignment);
    const dimLabel = stereoAndTitle.calculateDimension(stringBounder);
    const uSymbol = this.getUSymbol(groupId);
    // ClusterHeader.java:81-95: the (int) cast, and no height at all for an empty label.
    const height =
      dimLabel.getWidth() > 0
        ? Math.trunc(dimLabel.getHeight() + (uSymbol === null ? 0 : uSymbol.suppHeightBecauseOfShape()))
        : 0;
    return { getTitleAndAttributeHeight: () => height, getTitle: () => header.title, getStereo: () => header.stereo };
  }

  /** `MyElkCluster#drawU` (MyElkCluster.java:92-96,99-101): the style is merged WITHOUT `withTOBECHANGED(stereotype)`,
   *  so the drawn ELK cluster never reads a stereotype-scoped colour (unlike `Cluster#getStyle`, Cluster.java:364). */
  getClusterStyle(groupId: string): ElkClusterStyle {
    return this.clusterStyle(groupId, []);
  }

  /** `MyElkCluster#getMagneticBorder` (MyElkCluster.java:147-149) DOES sign the group stereotype. */
  getClusterStyleForMagneticBorder(groupId: string, _uSymbol: UpstreamUSymbol): ElkClusterStyle {
    const geo = this.nodeGeo(groupId);
    return this.clusterStyle(groupId, geo.styleStereotype ?? geo.stereotype ?? []);
  }

  private clusterStyle(groupId: string, stereotypes: readonly string[]): ElkClusterStyle {
    const defaults = buildStyleDefaults(this.input.theme, this.nodeGeo(groupId).symbol, stereotypes);
    return {
      shadowing: defaults.shadowing,
      stroke: defaults.strokeDefault,
      roundCorner: defaults.roundCorner,
      lineColor: defaults.lineColorDefault,
    };
  }

  getClusterBackColor(groupId: string): Paint {
    return buildStyleDefaults(this.input.theme, this.nodeGeo(groupId).symbol).backGroundColorDefault!; // always set there
  }

  // --- Skin parameters ---------------------------------------------------------

  packageStyle(): PackageStyleName {
    return PackageStyle.FOLDER;
  }

  /** `AlignmentParam.packageTitleAlignment` default (`AlignmentParam.java:44`). */
  getPackageTitleAlignment(): HorizontalAlignment {
    return HorizontalAlignment.CENTER;
  }

  /** `SkinParam#getStereotypeAlignment` default (`SkinParam.java:741-748`). */
  getStereotypeAlignment(): HorizontalAlignment {
    return HorizontalAlignment.CENTER;
  }

  getArrowThickness(): UStroke | null {
    return null;
  }

  // --- Link ----------------------------------------------------------------------

  getEntity1(linkId: string): string {
    return this.resolved(linkId).entity1;
  }

  getEntity2(linkId: string): string {
    return this.resolved(linkId).entity2;
  }

  getQuantifier1(linkId: string): string | null {
    return this.resolved(linkId).link.firstLabel ?? null;
  }

  getQuantifier2(linkId: string): string | null {
    return this.resolved(linkId).link.secondLabel ?? null;
  }

  /** The description grammar has no role text (`CommandLinkElement` sets quantifiers only). */
  getRole1(_linkId: string): string | null {
    return null;
  }

  getRole2(_linkId: string): string | null {
    return null;
  }

  getLabel(linkId: string, _stringBounder: StringBounder): TextBlock {
    const { link } = this.resolved(linkId);
    if (link.label === undefined) return TextBlockUtils.empty(0, 0);
    const block = this.displayBlock(link.label, CreoleMode.SIMPLE_LINE, this.maxMessageSize());
    // CucaDiagramFileMakerElk.java:158 (addVisibilityModifier's margin) then :228-229.
    const marged = TextBlockUtils.withMargin(block, LABEL_MARGIN, LABEL_MARGIN);
    // The `isEmpty` test of :228 is never true here: the margin above already makes the block non-empty.
    return TextBlockUtils.withMargin(marged, LABEL_MARGIN, LABEL_MARGIN);
  }

  getQuantifier(linkId: string, n: 1 | 2, stringBounder: StringBounder): TextBlock | null {
    return this.arrowText(n === 1 ? this.getQuantifier1(linkId) : this.getQuantifier2(linkId), stringBounder);
  }

  getRoleLabel(linkId: string, n: 1 | 2, stringBounder: StringBounder): TextBlock | null {
    return this.arrowText(n === 1 ? this.getRole1(linkId) : this.getRole2(linkId), stringBounder);
  }

  /**
   * `Display.getWithNewlines(pragma, text).create0(font, CENTER, skinParam, wrapWidth, mode, null, null)`
   * (`CommandLinkElement.java:320`, `CucaDiagramFileMakerElk.java:213-215`, `:256-259`): the literal `\\n` escapes
   * split first, then creole.
   */
  private displayBlock(text: string, creoleMode: CreoleMode, maxMessageSize: LineBreakStrategy): TextBlock {
    return elkDisplayBlock(splitDisplayLines(text).lines, {
      font: arrowLabelFontConfig(this.input.theme),
      alignment: HorizontalAlignment.CENTER,
      creoleMode,
      maxMessageSize,
      sprites: this.input.ast.sprites,
    });
  }

  /** `skinParam.maxMessageSize()` (`SkinParam.java:971-978`): `skinparam maxMessageSize` / `wrapMessageWidth`. */
  private maxMessageSize(): LineBreakStrategy {
    const width = this.input.theme.maxMessageSize;
    return width !== undefined && width > 0 ? new LineBreakStrategy(String(width)) : LineBreakStrategy.NONE;
  }

  /** `getQuantifier` / `getRoleLabel` (`CucaDiagramFileMakerElk.java:250-278`): `FontParam.ARROW` text, null if empty. */
  private arrowText(text: string | null, stringBounder: StringBounder): TextBlock | null {
    if (text === null) return null;
    const block = this.displayBlock(text, CreoleMode.FULL, LineBreakStrategy.NONE);
    return TextBlockUtils.isEmpty(block, stringBounder) ? null : block;
  }

  isInvis(linkId: string): boolean {
    return this.getType(linkId).isInvisible();
  }

  /** `Link#isHidden()`: an endpoint hidden by a `hide`/`show` rule (`abel/Link.java:458-459`). */
  isHidden(linkId: string): boolean {
    const { entity1, entity2 } = this.resolved(linkId);
    return this.input.hidden.has(entity1) || this.input.hidden.has(entity2);
  }

  getType(linkId: string): LinkType {
    return linkTypeOf(this.resolved(linkId).link);
  }

  /** `plantuml.skin:316-319`: arrow `LineThickness 1.0`; line colour from the theme's arrow colour. */
  getArrowStyle(_linkId: string): ElkArrowStyle {
    return { lineColor: this.input.theme.colors.arrow, stroke: UStroke.withThickness(ARROW_LINE_THICKNESS) };
  }

  /** The description grammar carries no per-link `Colors` (a bracket `#color` is {@link getSpecificColor}). */
  getLinkColors(_linkId: string): ElkColors | null {
    return null;
  }

  getSpecificColor(linkId: string): Paint | null {
    return this.resolved(linkId).link.colorOverride ?? null;
  }
}

/**
 * Classifies, sizes and lays out a description diagram with ELK
 * (`CucaDiagramFileMakerElk#getTextBlock`, `:477-499`).
 */
export function layoutDescriptionElk(
  ast: DescriptionDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  backend: ElkBackend,
): { readonly drawing: DescriptionElkDrawing; readonly block: XDimension2D } {
  const adapter = new DescriptionElkAdapter(buildDescriptionElkContext(ast, theme, measurer));
  const result = makeElkLayout(adapter, backend, newMyElkDrawing);
  const drawing = new MyElkDrawing(adapter, result.minMax, result);
  return { drawing, block: drawing.calculateDimension(adapter.getDefaultStringBounder()) };
}

/** The classification + sizing the dot path does, minus dot (`layoutDescription`'s first half). */
export function buildDescriptionElkContext(
  ast: DescriptionDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): DescriptionElkContext {
  const ctx = createClassifyCtx(ast, theme);
  const removed = effectiveRemovedIds(ast.nodes, ast.links, ast.removeUnlinked === true);
  classifyAst(buildNamespaceGroups(ast.nodes, ast.namespaceSeparator), ctx, removed);
  const dims = sizeLeaves(ast, theme, measurer, ctx);
  const hidden = effectiveHiddenIds(ast.nodes, ast.hideShowRules ?? []);
  const tree = structuralGeoTree(ast, ctx, dims, removed, hidden);
  return {
    ast,
    theme,
    stringBounder: klimtStringBounderFor(driverBounderFor(measurer), measurer),
    ctx,
    removed,
    hidden,
    dims,
    geo: buildNodeGeoIndex(tree),
    uids: buildUidPlan({ nodes: tree, edges: [] }),
  };
}

/** `printEntityInternal(ent).calculateDimension` of every leaf: the dot path's node size (`buildDotNodes`). */
function sizeLeaves(
  ast: DescriptionDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
  ctx: ClassifyCtx,
): Map<string, LeafSize> {
  const sized = buildDotNodes(
    ctx,
    { family: theme.fontFamily, size: theme.fontSize },
    measurer,
    new Set(),
    new Set(),
    new Set(),
    ast.links,
    theme.fixCircleLabelOverlapping === true,
    ast.stereotypeVisibilityRules ?? [],
  );
  return new Map(sized.map((n) => [n.id, { width: n.width, height: n.height }]));
}

/** The geo tree the dot path assembles, with placeholder positions: display, symbol and stereotype per node. */
function structuralGeoTree(
  ast: DescriptionDiagramAST,
  ctx: ClassifyCtx,
  dims: ReadonlyMap<string, LeafSize>,
  removed: ReadonlySet<string>,
  hidden: ReadonlySet<string>,
): DescriptionNodeGeo[] {
  const leafPos = new Map([...dims].map(([id, d]) => [id, { x: 0, y: 0, ...d }]));
  return buildGeoTree(ast.nodes, leafPos, ctx.collidingIds, removed, hidden, ast.stereotypeVisibilityRules ?? [], {
    infoByAstId: new Map(),
    spacing: { rankdir: 'TB' },
  });
}
