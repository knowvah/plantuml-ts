/**
 * Class diagram DOT-graph construction.
 *
 * Builds the `DotInputGraph` (nodes, edges, clusters) consumed by the shared
 * dot layout engine from a `ClassDiagramAST` + pre-measured classifier sizes.
 * Split out of ./layout.ts to keep both files under the project's per-file
 * size cap; behavior is unchanged (pure move).
 */

import type {
  Classifier,
  ClassDiagramAST,
  Namespace,
  Relationship,
  RelationshipType,
} from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import type {
  DotInputCluster,
  DotInputGraph,
  DotInputNode,
  DotInputEdge,
} from '../../core/graph-layout.js';
import { buildNoteGraphParts } from './note-layout.js';
import { findFreestandingNoteRelationshipIndices } from './note-freestanding.js';
import { buildClassMagmaEdges } from './class-magma.js';
import {
  edgeLabelAttrs,
  LIKE_CLASS_KINDS,
  type MeasuredClassifier,
} from './class-layout-helpers.js';
import { packageEndpointAnchors, shieldedClassifierIds } from './class-shield-helpers.js';
import { LOLLIPOP_SIZE, ASSOC_POINT_SIZE } from './class-lollipop.js';
import { applyShapeAndPorts, edgePortAttrs, classPortShortNamesById } from './class-port-rows.js';
import type { EdgeGeo } from './layout.js';
import { dotEdgeRunsReversed } from './class-dot-edge-order.js';

// ---------------------------------------------------------------------------
// Edge decoration map
// ---------------------------------------------------------------------------

interface EdgeDecoration {
  targetDecor: EdgeGeo['targetDecor'];
  sourceDecor: EdgeGeo['sourceDecor'];
  dashed: boolean;
}

export const EDGE_DECORATION_MAP: Record<RelationshipType, EdgeDecoration> = {
  extension:      { targetDecor: 'triangle',     sourceDecor: 'none',         dashed: false },
  implementation: { targetDecor: 'triangle',     sourceDecor: 'none',         dashed: true  },
  composition:    { targetDecor: 'none',          sourceDecor: 'filledDiamond', dashed: false },
  aggregation:    { targetDecor: 'none',          sourceDecor: 'diamond',      dashed: false },
  dependency:     { targetDecor: 'open',          sourceDecor: 'none',         dashed: true  },
  association:    { targetDecor: 'open',          sourceDecor: 'none',         dashed: false },
  usage:          { targetDecor: 'none',          sourceDecor: 'none',         dashed: true  },
};


/** `FontParam.ARROW(13, normal)` (klimt/font/FontParam.java:54) --
 *  relationship-label default, distinct from `CLASS(12)`/`theme.fontSize`
 *  (14, this port's own default). G5/C0 jar-verified gap: `bejusa-95-
 *  gafo325`'s `"contains"` relationship label renders at jar size 13
 *  (48.425px), not our prior size-14 measurement (52.15px). Already
 *  flagged as a KNOWN, deliberately-unfixed gap in `class-layout-
 *  helpers.ts#CARDINALITY_FONT_SIZE`'s own doc comment ("NOT the same
 *  font `edgeLabelAttrs` ... measures with for DOT-gate sizing"). No
 *  `skinparam ArrowFontSize` override path exists yet (`core/
 *  skinparam.ts#ELEMENT_BUCKET_SNAMES` omits `'arrow'`) -- bare DEFAULT
 *  only. */
const ARROW_LABEL_FONT_SIZE = 13;

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
): DotInputCluster[] | undefined {
  const keep = nonEmptyNamespaceIds(ast);
  if (keep.size === 0) return undefined;
  const kept = ast.namespaces.filter((ns) => keep.has(ns.id));
  const clusterIdByNs = new Map(kept.map((ns, i) => [ns.id, `cluster${i}`] as const));
  return kept.map((ns, i) => {
    // A package used as a relationship endpoint carries its point anchor as an
    // extra direct member of its own cluster (svek ClusterDotString).
    const anchorId = anchors.get(ns.id);
    const nodeIds = anchorId !== undefined ? [...ns.classifiers, anchorId] : ns.classifiers;
    const cluster: DotInputCluster = { id: `cluster${i}`, nodeIds };
    if (ns.display.length > 0) cluster.label = ns.display;
    const parentClusterId =
      ns.parentId !== undefined ? clusterIdByNs.get(ns.parentId) : undefined;
    if (parentClusterId !== undefined) cluster.parentId = parentClusterId;
    return cluster;
  });
}

/** Under `skinparam linetype ortho`, svek routes the main edge label through
 *  `xlabel` instead of `label` (SvekEdge.java:434-441: dotSplines == ORTHO
 *  branch) — taillabel/headlabel are unaffected (upstream only tests
 *  `dotMode`/`dotSplines` in the `hasNoteLabelText()` branch). Mutates in
 *  place; called only when linetype is ortho. */
function moveLabelToXlabel(attrs: NonNullable<DotInputEdge['attributes']>): void {
  if (attrs.label === undefined) return;
  attrs.xlabel = attrs.label;
  attrs.xlabelWidth = attrs.labelWidth!;
  attrs.xlabelHeight = attrs.labelHeight!;
  delete attrs.label;
  delete attrs.labelWidth;
  delete attrs.labelHeight;
}

/** Build one dot edge per relationship, with minlen + label attributes. An
 *  endpoint that is a package cluster is routed to that cluster's point anchor. */
interface DotEdgeAttrContext {
  font: { family: string; size: number };
  measurer: StringMeasurer;
  linetype: Theme['linetype'];
  kindBIndices: ReadonlySet<number>;
  /** B1/M1: ids of the leaves emitted as RECTANGLE_HTML_FOR_PORTS row tables,
   *  the only endpoints a `::member` port may legally attach to. */
  portRowIds: ReadonlySet<string>;
}

/** One relationship's DOT edge attributes -- split out of `buildDotEdges`
 *  (G2/N16) to keep that function's own CCN under the project's complexity
 *  cap after adding the Kind-B `noArrow` gate. */
function buildDotEdgeAttrs(rel: Relationship, i: number, ctx: DotEdgeAttrContext): NonNullable<DotInputEdge['attributes']> {
  const attrs = { minLen: (rel.length ?? 2) - 1, ...edgeLabelAttrs(rel, ctx.font, ctx.measurer) };
  if (ctx.linetype === 'ortho') moveLabelToXlabel(attrs);
  if (rel.invis === true) attrs.invis = true;
  if (rel.weight !== undefined) attrs.weight = rel.weight;
  // G2/N16 Kind B: a freestanding note's ONE real relationship connector
  // must route with NO arrow-clip reservation (the SAME `noArrow` fix N14
  // already applied to the synthetic note-attachment edge) -- computed
  // PRE-layout since it affects the spline's own routed endpoint, not just
  // its rendered decoration (`note-freestanding.ts`'s own doc comment).
  if (ctx.kindBIndices.has(i)) attrs.noArrow = true;
  return attrs;
}

/** Rendering inputs {@link buildDotEdges} needs beyond `ast`/`anchors` --
 *  bundled purely to stay under the project's per-function param cap (T2
 *  added `classPortShortNames` to what was already `font`/`measurer`/
 *  `linetype`). */
interface DotEdgesRenderCtx {
  font: { family: string; size: number };
  measurer: StringMeasurer;
  linetype: Theme['linetype'];
  /** T2: `classPortShortNamesById`'s output -- ADR-4's declared port-name
   *  sets, row-port leaves only (`isRowPortKind`: class family + object). */
  classPortShortNames: ReadonlyMap<string, Set<string>>;
}

function buildDotEdges(
  ast: ClassDiagramAST,
  anchors: Map<string, string>,
  render: DotEdgesRenderCtx,
): DotInputEdge[] {
  const { font, measurer, linetype, classPortShortNames } = render;
  const kindBIndices = findFreestandingNoteRelationshipIndices(ast.notes, ast.relationships, ast.classifiers);
  // ADR-3: unconditional whenever the TARGET carries row bands at all -- a
  // `map` (its own flat-sizer bands) or a `LIKE_CLASS_KINDS` leaf with a
  // declared port-name set (T2's `classPortShortNamesById`, ADR-4). Neither
  // set membership depends on whether any row actually WON an election
  // (`bicabi-42-coto932`'s dangling-port control) -- `edgePortAttrs` must
  // not re-derive that from `portRows.length`.
  const portRowIds = new Set([
    ...ast.classifiers.filter((c) => c.kind === 'map').map((c) => c.id),
    ...classPortShortNames.keys(),
  ]);
  const ctx: DotEdgeAttrContext = { font, measurer, linetype, kindBIndices, portRowIds };
  return ast.relationships.map((rel: Relationship, i: number) => {
    const swap = dotEdgeRunsReversed(rel);
    const from = swap ? rel.to : rel.from;
    const to = swap ? rel.from : rel.to;
    const dotFrom = anchors.get(from) ?? from;
    const dotTo = anchors.get(to) ?? to;
    const attrs = buildDotEdgeAttrs(rel, i, ctx);
    Object.assign(attrs, edgePortAttrs(rel, swap, dotFrom, dotTo, ctx.portRowIds));
    return { id: `edge-${i}`, from: dotFrom, to: dotTo, attributes: attrs };
  });
}

/** `EntityImageProtected`'s border -- GeneralImageBuilder.java:113 wraps a
 *  neighborhood-bearing `EntityImageClass` in `new EntityImageProtected(
 *  entityImageClass, 20, ...)`; `calculateDimension` returns
 *  `orig.calculateDimension(...).delta(2 * border)` (EntityImageProtected
 *  .java:77-79) -- +40px on BOTH axes. */
const PROTECTED_BORDER = 20;

/** A2s F-D pending theme-plumbing seam (see the F-D report): `skinparam
 *  groupInheritance N` is not yet parsed into `Theme`, so this field is
 *  read structurally and the mechanism is inert in production until the
 *  skinparam pipeline populates it. */
export interface ThemeGroupInheritance { groupInheritance?: number }

/** Same pending-plumbing seam as {@link ThemeGroupInheritance}, for
 *  `skinparam sameClassWidth true|false` (SkinParam.java:994). */
export interface ThemeSameClassWidth { sameClassWidth?: boolean }

/**
 * A2s F-D mechanism B7: `skinparam sameClassWidth true` floors EVERY
 * like-class box width to the widest like-class box --
 * `GraphvizImageBuilder#printEntityInternal` computes `getMaxWidth()` over
 * all `isLikeClass` leaves and stashes it on the skinparam
 * (GraphvizImageBuilder.java:366-375); `EntityImageClass
 * #calculateDimensionSlow` then floors each box to it (EntityImageClass
 * .java:108-110). Jar evidence: dorafa-63-soba922 emits BOTH nodes at
 * 1.623264in. Mutates the shared `MeasuredClassifier.width` in place so the
 * DOT node builder AND the renderer geos (built after `buildDotGraph`) agree
 * on the floored width. Header-row indents are NOT re-centered against the
 * widened box (bounded SVG-cosmetic gap, F-D report). Inert in production
 * until the {@link ThemeSameClassWidth} plumbing lands.
 */
export function applySameClassWidthFloor(
  classifiers: readonly Classifier[],
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
  theme: Theme,
): void {
  if ((theme as Theme & ThemeSameClassWidth).sameClassWidth !== true) return;
  const max = maxLikeClassWidth(classifiers, measuredMap);
  for (const c of classifiers) {
    if (!LIKE_CLASS_KINDS.has(c.kind)) continue;
    const m = measuredMap.get(c.id);
    if (m !== undefined && m.width < max) m.width = max;
  }
}

/** `GraphvizImageBuilder#getMaxWidth` (GraphvizImageBuilder.java:385-395):
 *  the widest `isLikeClass` box, measured WITHOUT the sameClassWidth floor
 *  itself (upstream stashes the max before any floor applies). */
function maxLikeClassWidth(
  classifiers: readonly Classifier[],
  measuredMap: ReadonlyMap<string, MeasuredClassifier>,
): number {
  let max = 0;
  for (const c of classifiers) {
    if (LIKE_CLASS_KINDS.has(c.kind)) max = Math.max(max, measuredMap.get(c.id)?.width ?? 0);
  }
  return max;
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
function computeGroupInheritanceProtectedIds(ast: ClassDiagramAST, theme: Theme): ReadonlySet<string> {
  const raw = (theme as Theme & ThemeGroupInheritance).groupInheritance;
  if (raw === undefined || raw <= 1) return new Set();
  const counts = new Map<string, number>();
  for (const rel of ast.relationships) {
    if (rel.idEntity1Decor !== 'triangle' || rel.idEntity1FullId === undefined) continue;
    counts.set(rel.idEntity1FullId, (counts.get(rel.idEntity1FullId) ?? 0) + 1);
  }
  const ids = new Set<string>();
  for (const [id, n] of counts) if (n >= raw) ids.add(id);
  return ids;
}

/** A2s F-D mechanism A10/B3: the `EntityImageProtected` +2*20px inflation on
 *  BOTH axes -- sizing only; upstream ALSO draws the neighborhood brackets
 *  (`EntityImageProtected#drawUntranslated` -> `Neighborhood#drawU`), a
 *  renderer-side gap filed in the F-D report. `EntityImageProtected` only
 *  ever wraps `EntityImageClass`, hence the isLikeClass gate. */
function protectedPad(classifier: Classifier, protectedIds: ReadonlySet<string>): number {
  return protectedIds.has(classifier.id) && LIKE_CLASS_KINDS.has(classifier.kind)
    ? 2 * PROTECTED_BORDER : 0;
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
  classPortShortNames: ReadonlyMap<string, Set<string>>,
): DotInputNode[] {
  const shielded = shieldedClassifierIds(ast);
  const nodes = ast.classifiers
    .filter((classifier) => !anchors.has(classifier.id))
    .map((classifier) => buildOneDotNode(
      classifier, measuredMap, shielded, protectedIds, classPortShortNames.get(classifier.id),
    ));
  for (const anchorId of anchors.values()) {
    // Width/height are ignored by the point emitter (hardcoded .01in).
    nodes.push({ id: anchorId, width: 1, height: 1, shape: 'point' });
  }
  return nodes;
}

/** DOT nodesep/ranksep attrs. Oracle emits nodesep=0.486111in (35px),
 *  ranksep=0.833333in (60px) by default; `skinparam nodesep`/`ranksep`
 *  (theme.nodeSep/rankSep, nonzero) unconditionally replace that default
 *  (SkinParam.java:847-856, DotStringFactory.java:117-133 — no max-clamp)
 *  and skip the emitter's minimum floor (svek-dot-emit resolveSep). */
function sepAttrs(theme: Theme): Partial<DotInputGraph> {
  return {
    nodeSep: theme.nodeSep ?? 35,
    rankSep: theme.rankSep ?? 60,
    ...(theme.nodeSep !== undefined ? { nodeSepExplicit: true } : {}),
    ...(theme.rankSep !== undefined ? { rankSepExplicit: true } : {}),
  };
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
  measurer: StringMeasurer,
): { dotNodes: DotInputNode[]; dotEdges: DotInputEdge[] } {
  const classPortShortNames = classPortShortNamesById(ast);
  const dotNodes = buildDotNodes(
    ast, measuredMap, anchors, computeGroupInheritanceProtectedIds(ast, theme), classPortShortNames,
  );
  const labelFont = { family: theme.fontFamily, size: ARROW_LABEL_FONT_SIZE };
  // Magma standalone-chaining edges appended after the real relationship edges.
  const dotEdges = [
    ...buildDotEdges(ast, anchors, { font: labelFont, measurer, linetype: theme.linetype, classPortShortNames }),
    ...buildClassMagmaEdges(ast, anchors),
  ];
  return { dotNodes, dotEdges };
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
  // A2s F-D mechanism B7: cross-class width floor, applied at the
  // pre-DOT aggregation point (mirrors `GraphvizImageBuilder
  // #printEntityInternal`'s "set paramSameClassWidth before building
  // entity images" sequencing) -- mutates the shared MeasuredClassifier
  // objects so the renderer geos built after this call agree.
  applySameClassWidthFloor(ast.classifiers, measuredMap, theme);
  const anchors = packageEndpointAnchors(ast, nonEmptyNamespaceIds(ast));
  const { dotNodes, dotEdges } = buildDotNodesAndEdges(ast, measuredMap, anchors, theme, measurer);

  // B6/M7: the indices whose dot edge `buildDotEdges` actually emitted as
  // `rel.to -> rel.from`. `class-edge-geo.ts#normalizeEdgePoints` reads this
  // as "the raw point list runs to -> from" and derives `matchesFromTo`
  // (which pairs `sourceDecor`/`targetDecor` with the point array) from it,
  // so it MUST use the same predicate the emission did.
  //
  // It did not, before B6: this was every HIERARCHICAL index, while emission
  // used `ranksParentFirst` (hierarchical AND `parentIsLinkEntity1`). A
  // `D --|> I` was emitted unswapped and recorded here as swapped, inverting
  // `matchesFromTo` for it. Now both sides call `dotEdgeRunsReversed`.
  const swappedEdges = new Set(
    ast.relationships
      .map((rel, i) => (dotEdgeRunsReversed(rel) ? i : -1))
      .filter((i) => i >= 0),
  );

  // Notes lay out as their own nodes + connector edges (Svek note-on-entity).
  // `anchors` also routes a `note <pos> of <package>` target to that
  // package's `zaent-*` point anchor (packageEndpointAnchors scans notes too).
  const noteParts = buildNoteGraphParts(ast.notes, theme, measurer, anchors, ast.sprites);
  dotNodes.push(...noteParts.nodes);
  dotEdges.push(...noteParts.edges);

  const clusters = buildDotClusters(ast, anchors);

  const dotGraph: DotInputGraph = {
    nodes: dotNodes,
    edges: dotEdges,
    rankDir: ast.rankdir === 'LR' ? 'LR' : 'TB',
    ...sepAttrs(theme),
    ...(clusters !== undefined ? { clusters } : {}),
    // G2/N29: class's renderer draws EVERY edge decoration as an inline
    // extremity polygon (`renderer-arrowhead.ts`, landed N1 mechanism 2 --
    // the old SVG `<marker>`-reference `targetMarker`/`sourceMarker`
    // functions were fully removed then; `renderer.ts`'s own header doc:
    // "zero `<marker>`/`markerEnd` anywhere", grep-verified). This flag's
    // own doc comment (`graph-layout.types.ts#manualArrowheads`) still
    // lists "class" among the marker-end callers that rely on graphviz's
    // default ~10-11px arrow-clip spline reservation -- stale since N1's
    // rewrite, never updated when class stopped using markers. Every jar
    // svek DOT edge line already carries `arrowtail=none,arrowhead=none`
    // unconditionally (`svek-dot-emit.ts`, confirmed corpus-wide), so
    // withholding this flag left @knowvah/dot-engine reserving a real-graphviz-
    // divergent gap at every edge endpoint -- root cause of the ~400-fixture
    // "@knowvah/dot-engine routing divergence" attribution the orchestrator's
    // 2026-07-17 falsification entry re-opened (bosiki-11-xaza958/
    // farina-07-foti023 byte-diff evidence, `plans/g2-class-svg/ledger.md`
    // N29): the shortfall was a seam invocation gap, not an engine bug.
    manualArrowheads: true,
  };

  return { dotGraph, swappedEdges, noteParts, anchors };
}
