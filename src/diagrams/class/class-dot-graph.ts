/**
 * Class diagram DOT-graph construction.
 *
 * Builds the `DotInputGraph` (nodes, edges, clusters) consumed by the shared
 * dot layout engine from a `ClassDiagramAST` + pre-measured classifier sizes.
 * Split out of ./layout.ts to keep both files under the project's per-file
 * size cap; behavior is unchanged (pure move).
 */

import type { Classifier, ClassDiagramAST, Namespace } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type { DotInputCluster, DotInputGraph, DotInputNode, DotInputEdge } from '../../core/graph-layout.js';
import { buildNoteGraphParts } from './note-layout.js';
import { buildClassMagmaEdges } from './class-magma.js';
import { buildClassUidPlan, classUidPlanInputFromAst } from './renderer-uid.js';
import { LIKE_CLASS_KINDS, type MeasuredClassifier, type NoteBoxContext } from './class-layout-helpers.js';
import { packageEndpointAnchors, shieldedClassifierIds } from './class-shield-helpers.js';
import { computeKals, kalMarginsByEntity, type Kal } from './class-kal.js';
// cdd-T15: the two pre-DOT width floors live in a sibling module (500-line
// cap); re-exported here so every existing import path keeps working.
import { applyKalWidthFloor, applySameClassWidthFloor } from './class-dot-width-floors.js';
export { applyKalWidthFloor, applySameClassWidthFloor, type ThemeSameClassWidth } from './class-dot-width-floors.js';
import { LOLLIPOP_SIZE, ASSOC_POINT_SIZE } from './class-lollipop.js';
import { applyShapeAndPorts, classPortShortNamesById } from './class-port-rows.js';
import { dotEdgeRunsReversed, getOrderedLinks } from './class-dot-edge-order.js';
import { buildDotEdges } from './class-dot-edges.js';
import { clusterWrapperLevel } from './class-cluster-levels.js';
import { namespaceTitleTableDims } from './class-namespace-title-table.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import { assembleDotInputGraph } from './class-dot-graph-assembly.js';

export interface DotGraphParts {
  dotGraph: DotInputGraph;
  swappedEdges: Set<number>;
  noteParts: ReturnType<typeof buildNoteGraphParts>;
  /** G2 N18: namespace id -> its `zaent-*` point-anchor DOT node id (see
   *  `packageEndpointAnchors`'s own doc comment) -- threaded OUT so
   *  `buildNamespaceGeos` can fold the anchor's own dot-assigned position
   *  into a namespace's footprint walk (the anchor is a REAL member of the
   *  cluster and, per `plans/g2-class-svg/ledger.md` N17/N18, occupies a
   *  rank slot ABOVE the topmost classifier when the package is used as a
   *  relationship/note endpoint -- `ns.classifiers` alone misses it). Pure
   *  data export, no change to what is emitted to @knowvah/dot-engine. */
  anchors: Map<string, string>;
  /** T4 (namespace-cluster-box mission): namespace id -> this port's own
   *  synthetic `clusterN` DOT id (`buildDotClusters`'s own doc comment on
   *  why the id is synthetic, not `ns.id`, verbatim). Threaded OUT the same
   *  way `anchors` already is, so T5 can look a namespace up in
   *  `DotLayoutResult.clusters` (keyed by this same `clusterN` token)
   *  without re-deriving the numbering. Empty when the diagram has no
   *  cluster-bearing namespace. */
  clusterIdByNs: Map<string, string>;
  /** cdd-T15 (D6): the `Kal` list built for this page, in `SvekEdge.java
   *  :242-246` construction order over the ALREADY-reordered
   *  `ast.relationships` (`getOrderedLinks`), so every `Kal.relIndex`
   *  indexes the same array `layout.ts`'s later `buildEdgeGeos(effAst, …)`
   *  walks. Threaded OUT for the same reason `anchors` is: the box's own
   *  anchor is the post-layout spline endpoint. Empty when the diagram has
   *  no qualified association. */
  kals: Kal[];
  /** cdd-T16 (M7, `dot/DotData.java:122-161`): relationship index -> the
   *  protected parent leaf's DOT uid, for exactly the extends-like links
   *  that reached `skinparam groupInheritance`'s limit -- the SAME map
   *  `buildDotNodesAndEdges` already threads into `buildDotEdges` for the
   *  `sametail="..."` DOT attribute, threaded OUT here too so `layout.ts`
   *  can pass it to `buildEdgeGeos` (decor/dash suppression,
   *  `Link.java:238-239`) and the shared-triangle renderer (`renderer-
   *  group.ts`, `Neighborhood.java:69-96`) can find each grouped edge's
   *  parent by `Relationship.idEntity1FullId`. Empty unless
   *  `groupInheritance` is set AND a tail reaches the limit. */
  sametailByRelIndex: ReadonlyMap<number, string>;
}

/**
 * The set of namespace ids that must emit a cluster: any namespace whose
 * subtree contains at least one direct member classifier. A namespace with no
 * direct members is still kept when a descendant has members (it is a real
 * ancestor cluster and its members bubble up in the oracle); a namespace whose
 * entire subtree is empty is dropped — the oracle omits member-less subgraphs
 * (verified against mujopi-30-zadi566: two empty packages produce no cluster).
 */
function nonEmptyNamespaceIds(ast: ClassDiagramAST): Set<string> {
  const byId = new Map(ast.namespaces.map((n) => [n.id, n] as const));
  const keep = new Set<string>();
  for (const ns of ast.namespaces) {
    if (ns.classifiers.length === 0) continue;
    let cur: Namespace | undefined = ns;
    while (cur !== undefined && !keep.has(cur.id)) {
      keep.add(cur.id);
      cur = cur.parentId !== undefined ? byId.get(cur.parentId) : undefined;
    }
  }
  return keep;
}

/**
 * Build one `DotInputCluster` per non-empty package/namespace, nesting via
 * `parentId` for dotted/nested names (mirrors the description engine's
 * `buildDotClusters` in ../description/layout.ts). `id` is a synthetic
 * `clusterN` token — NOT `ns.id` — because the comparator's `parseClusters`
 * (tests/oracle/svek-dot.ts:109) only recognizes subgraphs named exactly
 * `^cluster\d+$`; the description engine's `clusterId` generator
 * (`cluster${counter.n++}`, description/layout.ts:108) uses the same scheme.
 * Only direct member classifiers go in `nodeIds`; descendants' members bubble
 * up through the nesting, matching the oracle's cluster-membership counting.
 */
function buildDotClusters(
  ast: ClassDiagramAST,
  anchors: Map<string, string>,
  theme: Theme,
  measurer: StringMeasurer,
): { clusters: DotInputCluster[]; clusterIdByNs: Map<string, string> } | undefined {
  const keep = nonEmptyNamespaceIds(ast);
  if (keep.size === 0) return undefined;
  const kept = ast.namespaces.filter((ns) => keep.has(ns.id));
  const clusterIdByNs = new Map(kept.map((ns, i) => [ns.id, `cluster${i}`] as const));
  const clusters = kept.map((ns, i) => {
    // A package used as a relationship endpoint carries its point anchor as an
    // extra direct member of its own cluster (svek ClusterDotString).
    const anchorId = anchors.get(ns.id);
    const nodeIds = anchorId !== undefined ? [...ns.classifiers, anchorId] : ns.classifiers;
    const cluster: DotInputCluster = { id: `cluster${i}`, nodeIds };
    // T4: `protection0`/`protection1` (ClusterDotString.java:107-115) are
    // unconditional for a non-swimlane, non-`USymbols.NODE` group -- NOT
    // gated on `cluster.isLabel()` (line 122's SEPARATE branch, below) -- so
    // `innerMarginLevels`/`unwrappedNodeId` are set for every kept cluster,
    // independent of whether it carries a title.
    cluster.innerMarginLevels = clusterWrapperLevel(ns.id, ast);
    if (anchorId !== undefined) cluster.unwrappedNodeId = anchorId;
    if (ns.display.length > 0) {
      cluster.label = ns.display;
      // cdd-T12 (A2b E3): `ns.usymbol` feeds `ClusterHeader`'s per-USymbol
      // `suppWidthBecauseOfShape`/`suppHeightBecauseOfShape` supplement
      // (`class-namespace-title-table.ts`) -- a `<<Node>>` package's label
      // table is 60px wider / 5px taller than its bare title text.
      const dims = namespaceTitleTableDims(ns.display, theme, measurer, ns.usymbol);
      // Same pair, two consumers (cluster-title-table.ts's own
      // `computeTitleTableHeight` doc comment): `labelWidth`/`labelHeight`
      // feed the DOT-TEXT emitter's `label=<TABLE...>` (svek-dot-emit-
      // clusters.ts#clusterBlock, unconditional whenever both are defined);
      // `titleTableWidth`/`titleTableHeight` feed the LAYOUT builder's real
      // @knowvah/dot-engine reservation (graph-layout-build.ts#addClusters).
      cluster.labelWidth = dims.width;
      cluster.labelHeight = dims.height;
      cluster.titleTableWidth = dims.width;
      cluster.titleTableHeight = dims.height;
    }
    const parentClusterId = ns.parentId !== undefined ? clusterIdByNs.get(ns.parentId) : undefined;
    if (parentClusterId !== undefined) cluster.parentId = parentClusterId;
    return cluster;
  });
  return { clusters, clusterIdByNs };
}

/** `EntityImageProtected`'s border -- GeneralImageBuilder.java:113 wraps a
 *  neighborhood-bearing `EntityImageClass` in `new EntityImageProtected(
 *  entityImageClass, 20, ...)`; `calculateDimension` returns
 *  `orig.calculateDimension(...).delta(2 * border)` (EntityImageProtected
 *  .java:77-79) -- +40px on BOTH axes. */
// cdd-T16: exported so `renderer-group.ts` can back out the protected
// classifier's TRUE (unpadded) box from its padded `ClassifierGeo`
// (`EntityImageProtected.java:56`'s `border` ctor param, always 20 --
// `GeneralImageBuilder.java:113`) rather than re-declaring the same
// jar-cited literal a second time.
export const PROTECTED_BORDER = 20;

/** A2s F-D pending theme-plumbing seam (see the F-D report): `skinparam
 *  groupInheritance N` is not yet parsed into `Theme`, so this field is
 *  read structurally and the mechanism is inert in production until the
 *  skinparam pipeline populates it. */
export interface ThemeGroupInheritance {
  groupInheritance?: number;
}

/**
 * A2s F-D mechanism A10/B3: `DotData#removeIrrelevantSametail`
 * (dot/DotData.java:122-151) -- every link whose ENTITY1-side decor is
 * extends-like (`link.getType().getDecor2().isExtendsLike()`, LinkDecor
 * .java:164-166: EXTENDS/REDEFINES/DEFINEDBY, all folded into this port's
 * `'triangle'` decor) sets `sametail = entity1.uid`; a tail counted >=
 * `skinParam.groupInheritance()` times gets a `Neighborhood`, which
 * `createEntityImageBlockInternal` wraps in `EntityImageProtected(_, 20, ..)`
 * (GeneralImageBuilder.java:110-116). `Relationship.idEntity1FullId`/
 * `.idEntity1Decor` ARE Java's `getEntity1()`/decor-at-entity1 (G2 N9) --
 * note `B --|> A` genuinely does NOT count upstream (decor2 at B is NONE),
 * and this port preserves that. Limit semantics: `getAsInt(
 * "groupinheritance", MAX)`, `value <= 1 -> MAX` (SkinParam.java:1041-1044).
 * Jar evidence: mefike-75-vova900 `A3` +0.555555in BOTH dims; jakapi-64
 * `Group` +40px each axis (hidden PLACEHOLDER's link still counts).
 */
/** Both products of upstream's single `DotData#removeIrrelevantSametail`
 *  pass (dot/DotData.java:122-161): the tails that earn a `Neighborhood`
 *  (this port's `EntityImageProtected` sizing inflation, `protectedIds`) and
 *  the `sametail` DOT attribute those same links carry
 *  (`svek/SvekEdge.java:478-479`). One function because upstream is one
 *  function: the qualifying set is computed once and consumed twice, and
 *  splitting it invites the two consumers to drift. */
interface GroupInheritanceResult {
  readonly protectedIds: ReadonlySet<string>;
  /** Index into `ast.relationships` → the tail entity's `ent%04d` uid.
   *  Empty unless `groupInheritance` is set AND a tail reaches the limit. */
  readonly sametailByRelIndex: ReadonlyMap<number, string>;
}

function computeGroupInheritance(
  ast: ClassDiagramAST,
  theme: Theme,
  uidOf?: (classifierId: string) => string | undefined,
): GroupInheritanceResult {
  const raw = (theme as Theme & ThemeGroupInheritance).groupInheritance;
  const empty = { protectedIds: new Set<string>(), sametailByRelIndex: new Map<number, string>() };
  // `SkinParam.java:1041-1044`: `getAsInt("groupinheritance", MAX)` with
  // `value <= 1 -> MAX`, i.e. no tail can ever reach the limit.
  if (raw === undefined || raw <= 1) return empty;

  // Upstream sets `sametail` on EVERY extends-like link first, counts, then
  // nulls out the ones below the limit -- the two-phase shape is preserved
  // here rather than collapsed, because the count is over the pre-filter
  // population.
  const counts = new Map<string, number>();
  for (const rel of ast.relationships) {
    if (rel.idEntity1Decor !== 'triangle' || rel.idEntity1FullId === undefined) continue;
    counts.set(rel.idEntity1FullId, (counts.get(rel.idEntity1FullId) ?? 0) + 1);
  }
  const protectedIds = new Set<string>();
  for (const [id, n] of counts) if (n >= raw) protectedIds.add(id);

  const sametailByRelIndex = new Map<number, string>();
  if (uidOf !== undefined) {
    ast.relationships.forEach((rel, i) => {
      if (rel.idEntity1Decor !== 'triangle' || rel.idEntity1FullId === undefined) return;
      if (!protectedIds.has(rel.idEntity1FullId)) return;
      const uid = uidOf(rel.idEntity1FullId);
      if (uid !== undefined) sametailByRelIndex.set(i, uid);
    });
  }
  return { protectedIds, sametailByRelIndex };
}

/** A2s F-D mechanism A10/B3: the `EntityImageProtected` +2*20px inflation on
 *  BOTH axes -- sizing only; upstream ALSO draws the neighborhood brackets
 *  (`EntityImageProtected#drawUntranslated` -> `Neighborhood#drawU`), a
 *  renderer-side gap filed in the F-D report. `EntityImageProtected` only
 *  ever wraps `EntityImageClass`, hence the isLikeClass gate. */
function protectedPad(classifier: Classifier, protectedIds: ReadonlySet<string>): number {
  return protectedIds.has(classifier.id) && LIKE_CLASS_KINDS.has(classifier.kind) ? 2 * PROTECTED_BORDER : 0;
}

/** Build one dot node for a single classifier — split out of buildDotNodes
 *  purely to keep that function's own NLOC/CCN under the project caps. */
function buildOneDotNode(
  classifier: Classifier,
  measuredMap: Map<string, MeasuredClassifier>,
  shielded: Map<string, { isPort: boolean; hasQualifier: boolean }>,
  protectedIds: ReadonlySet<string>,
  // T2: this leaf's declared `::member` port-name set (`classPortShortNamesById`),
  // `undefined` for every classifier not in that map (ADR-4's gate).
  portShortNames: ReadonlySet<string> | undefined,
): DotInputNode {
  const measured = measuredMap.get(classifier.id)!;
  // A lollipop circle is a fixed 10x10 (upstream `EntityImageLollipopInterface
  // .SIZE`), never text-measured — measureClassifier has no special case for
  // this kind, so its generic (min-100, text-based) width/height is discarded.
  const isLollipop = classifier.kind === 'lollipop';
  // G2 N8: an association-class-couple "point" entity is a fixed 4x4 circle
  // (upstream `EntityImageAssociationPoint.SIZE`), same "never text-measured,
  // generic width/height discarded" shape as the lollipop case above.
  const isAssocPoint = classifier.kind === 'assoc-circle';
  const pad = protectedPad(classifier, protectedIds);
  const node: DotInputNode = {
    id: classifier.id,
    width: isLollipop ? LOLLIPOP_SIZE : isAssocPoint ? ASSOC_POINT_SIZE : measured.width + pad,
    height: isLollipop ? LOLLIPOP_SIZE : isAssocPoint ? ASSOC_POINT_SIZE : measured.height + pad,
  };
  const shield = shielded.get(classifier.id);
  applyShapeAndPorts(node, classifier, measured, shield, portShortNames);
  return node;
}

/**
 * Build one dot node per classifier, marking qualifier/port targets plaintext.
 * A classifier that is also a package endpoint is dropped (its cluster gets a
 * point anchor instead — see packageEndpointAnchors); one point node per anchor
 * is appended.
 */
function buildDotNodes(
  ast: ClassDiagramAST,
  measuredMap: Map<string, MeasuredClassifier>,
  anchors: Map<string, string>,
  protectedIds: ReadonlySet<string>,
  // cdd-T15: `classPortShortNames` plus the page's `Kal` list, folded into
  // one options object -- a sixth positional parameter would cross this
  // repo's hook-enforced 5-param cap.
  opts: { classPortShortNames: ReadonlyMap<string, Set<string>>; kals: readonly Kal[] },
): DotInputNode[] {
  const { classPortShortNames, kals } = opts;
  const shielded = shieldedClassifierIds(ast);
  const nodes = ast.classifiers
    .filter((classifier) => !anchors.has(classifier.id))
    .map((classifier) =>
      buildOneDotNode(classifier, measuredMap, shielded, protectedIds, classPortShortNames.get(classifier.id)),
    );
  for (const anchorId of anchors.values()) {
    // Width/height are ignored by the point emitter (hardcoded .01in).
    nodes.push({ id: anchorId, width: 1, height: 1, shape: 'point' });
  }
  // cdd-T15 (D6): `Kal.java:106-121`'s `ensureMargins` -- stamped as a
  // post-pass rather than threaded into `buildOneDotNode`, whose parameter
  // list already sits at the project's cap. `resolveNodeShape` has already
  // made every qualified end `plaintext` off the same `shieldedClassifierIds`
  // scan, so this only fills in the shield's real sizes.
  const margins = kalMarginsByEntity(kals);
  for (const node of nodes) {
    const m = margins.get(node.id);
    if (m !== undefined) node.shieldMargins = m;
  }
  return nodes;
}

/**
 * `buildDotNodes` + `buildDotEdges` (+ magma edges), sharing ONE
 * `classPortShortNamesById` computation between them (T2, ADR-3/ADR-4) so
 * they agree on exactly which classifiers carry `::member` row bands. Split
 * out of `buildDotGraph` purely to keep that function's own NLOC under the
 * project's per-function cap.
 */
function buildDotNodesAndEdges(
  ast: ClassDiagramAST,
  measuredMap: Map<string, MeasuredClassifier>,
  anchors: Map<string, string>,
  theme: Theme,
  // cdd-T15: `measurer` plus the page's `Kal` list (built once in
  // `buildDotGraph`, shared with the node margins and with `layout.ts`) --
  // folded into one object for the same 5-param cap reason as above.
  ctx: { measurer: StringMeasurer; kals: readonly Kal[] },
): { dotNodes: DotInputNode[]; dotEdges: DotInputEdge[]; sametailByRelIndex: ReadonlyMap<number, string> } {
  const { measurer, kals } = ctx;
  const classPortShortNames = classPortShortNamesById(ast);
  // ONE `removeIrrelevantSametail` pass feeding both consumers, as upstream
  // does. The uid lookup is AST-derived because `sametail` is a DOT attribute
  // and the DOT is layout's INPUT -- there is no geometry yet. See
  // `renderer-uid.ts#ClassUidPlanInput` for why that projection is sound only
  // where it is (and the test that pins it).
  const uidPlan = buildClassUidPlan(classUidPlanInputFromAst(ast));
  const groupInheritance = computeGroupInheritance(ast, theme, (id) => uidPlan.classifierUid.get(id));
  const nodeOpts = { classPortShortNames, kals };
  const dotNodes = buildDotNodes(ast, measuredMap, anchors, groupInheritance.protectedIds, nodeOpts);
  // D3/D4: resolved arrow-label font (`GraphvizImageBuilder.java:234-235`'s
  // `labelFont`). No override -> byte-identical to the prior
  // `{family:theme.fontFamily,size:ARROW_LABEL_FONT_SIZE}` literal (see the
  // resolver's own doc comment). `weight`/`style` ride the `FontSpec` for
  // `renderer-edge.ts`'s SVG site (D4, same commit) but widen no type here:
  // `StringBounderFromWidthTable#calculateDimension` (klimt/drawing/font/
  // StringBounderFromWidthTable.java:67-79) has no bold/italic branch.
  const labelFont = resolveArrowLabelFont(theme);
  // T14/D3: `theme.cardinalityFontFamily`/`cardinalityFontSize` are optional
  // in the `Theme` TYPE (pre-existing hand-built Theme literals elsewhere
  // stay valid, `theme.ts:21-22`'s own doc comment), but `defaultTheme`/
  // `darkTheme` always set concrete values and `theme` here always descends
  // from one of them via `resolveTheme()`/`applyStyleMap` (`build-theme.ts`
  // Stage 1/3c) -- `deepMergeTheme`'s `partial[key] ?? base[key]` merge
  // (`theme.ts:491`) preserves that invariant through every stage. The `!`
  // below asserts that invariant rather than papering over it with a
  // fitted fallback literal.
  const cardinalityFont = { family: theme.cardinalityFontFamily!, size: theme.cardinalityFontSize! };
  // T10: same `theme`/`ast.sprites` pair `buildNoteGraphParts` below already
  // takes for attached/freestanding notes -- sizes a `note on link`-merged
  // label (`rel.linkNote`).
  const noteCtx: NoteBoxContext = { theme, ...(ast.sprites !== undefined ? { sprites: ast.sprites } : {}) };
  // Magma standalone-chaining edges appended after the real relationship edges.
  const dotEdges = [
    ...buildDotEdges(ast, anchors, {
      font: labelFont,
      cardinalityFont,
      measurer,
      linetype: theme.linetype,
      noteCtx,
      classPortShortNames,
      sametailByRelIndex: groupInheritance.sametailByRelIndex,
    }),
    ...buildClassMagmaEdges(ast, anchors),
  ];
  applyKalEdgePorts(dotNodes, dotEdges);
  return { dotNodes, dotEdges, sametailByRelIndex: groupInheritance.sametailByRelIndex };
}

/**
 * cdd-T15 (D6): `Bibliotekon#getNodeUid` (`svek/Bibliotekon.java:126-132`)
 * appends `:h` to EVERY DOT reference to a shielded node's uid -- the
 * compass port naming the shield table's centre cell, which is what makes
 * graphviz route the spline from the CLASS box's own edge rather than from
 * the margin-inflated table. `svek-dot-emit.ts#edgeRef` already writes that
 * suffix into the emitted DOT text; this stamps the same port onto the
 * LAYOUT edge, through the `tailport`/`headport` seam the member-row ports
 * already use (`graph-layout-build.ts#addEdges`).
 *
 * Without it, `baneru-00-kuro607`'s arrow tip lands at y=74.77 instead of
 * the jar's 70.82: the spline starts at the padded table's bottom (75)
 * rather than the centre cell's (55).
 */
function applyKalEdgePorts(dotNodes: readonly DotInputNode[], dotEdges: readonly DotInputEdge[]): void {
  const shielded = new Set(dotNodes.filter((n) => n.shieldMargins !== undefined).map((n) => n.id));
  if (shielded.size === 0) return;
  for (const edge of dotEdges) {
    if (edge.attributes === undefined) continue;
    if (shielded.has(edge.from)) edge.attributes.tailport = 'h';
    if (shielded.has(edge.to)) edge.attributes.headport = 'h';
  }
}

/**
 * B6/M7: the indices whose dot edge `buildDotEdges` actually emitted as
 * `rel.to -> rel.from`. `class-edge-geo.ts#normalizeEdgePoints` reads this
 * as "the raw point list runs to -> from" and derives `matchesFromTo`
 * (which pairs `sourceDecor`/`targetDecor` with the point array) from it,
 * so it MUST use the same predicate the emission did.
 *
 * It did not, before B6: this was every HIERARCHICAL index, while emission
 * used `ranksParentFirst` (hierarchical AND `parentIsLinkEntity1`). A
 * `D --|> I` was emitted unswapped and recorded here as swapped, inverting
 * `matchesFromTo` for it. Now both sides call `dotEdgeRunsReversed`. Split
 * out of `buildDotGraph` for the project's per-function NLOC cap.
 */
function computeSwappedEdges(ast: ClassDiagramAST): Set<number> {
  return new Set(ast.relationships.map((rel, i) => (dotEdgeRunsReversed(rel) ? i : -1)).filter((i) => i >= 0));
}

/**
 * Build the dot input graph — all classifiers + notes flattened into the
 * root graph (D5) — plus the set of edge indices emitted `to -> from`
 * (`./class-dot-edge-order.ts#dotEdgeRunsReversed`).
 */
export function buildDotGraph(
  ast: ClassDiagramAST,
  measuredMap: Map<string, MeasuredClassifier>,
  theme: Theme,
  measurer: StringMeasurer,
): DotGraphParts {
  // SB2: `CucaDiagramFileMakerSvek.java:90-96 getOrderedLinks`, applied
  // ONCE here, ahead of every `ast.relationships` reader below --
  // `buildDotNodesAndEdges`/`computeSwappedEdges`, and (same `ast` object
  // reference) `layout.ts`'s later `buildEdgeGeos(effAst, ...)` call.
  // `GraphvizImageBuilder.java:229` iterates ONE reordered list for both
  // DOT emission and the SVG `<g class="link">` draw loop; reassigning
  // here is the "mutate the shared input for downstream layout.ts" pattern
  // `applySameClassWidthFloor` already uses below. Dense uid re-numbering
  // is unaffected -- it sorts by `creationIndex` (parse-time, immutable),
  // never array position (D7, decisions.md).
  ast.relationships = getOrderedLinks(ast.relationships);
  // A2s F-D mechanism B7: cross-class width floor, applied at the
  // pre-DOT aggregation point (mirrors `GraphvizImageBuilder
  // #printEntityInternal`'s "set paramSameClassWidth before building
  // entity images" sequencing) -- mutates the shared MeasuredClassifier
  // objects so the renderer geos built after this call agree.
  applySameClassWidthFloor(ast.classifiers, measuredMap, theme);
  // cdd-T15 (D6): `SvekEdge.java:242-246` constructs every `Kal` while the
  // edges are built, i.e. BEFORE any node image is sized -- so the boxes
  // are measured here, once, and feed three consumers: the width floor
  // below, the node shield margins (`buildDotNodes`), and `layout.ts`'s
  // post-layout box placement. The font is the `class.qualified` style's
  // (`Kal.java:93-99`), which inherits the class font.
  const kals = computeKals(ast.relationships, { family: theme.fontFamily, size: theme.fontSize }, measurer);
  applyKalWidthFloor(kals, ast.classifiers, measuredMap);
  const anchors = packageEndpointAnchors(ast, nonEmptyNamespaceIds(ast));
  const { dotNodes, dotEdges, sametailByRelIndex } = buildDotNodesAndEdges(ast, measuredMap, anchors, theme, {
    measurer,
    kals,
  });
  const swappedEdges = computeSwappedEdges(ast);

  // Notes lay out as their own nodes + connector edges (Svek note-on-entity).
  // `anchors` also routes a `note <pos> of <package>` target to that
  // package's `zaent-*` point anchor (packageEndpointAnchors scans notes too).
  const noteParts = buildNoteGraphParts(ast.notes, theme, measurer, anchors, ast.sprites);
  dotNodes.push(...noteParts.nodes);
  dotEdges.push(...noteParts.edges);

  const clusterParts = buildDotClusters(ast, anchors, theme, measurer);
  const dotGraph = assembleDotInputGraph(ast, theme, dotNodes, dotEdges, clusterParts);

  return {
    dotGraph,
    swappedEdges,
    noteParts,
    anchors,
    clusterIdByNs: clusterParts?.clusterIdByNs ?? new Map<string, string>(),
    kals,
    sametailByRelIndex,
  };
}
