/**
 * Class diagram layout engine.
 *
 * Synchronous: ClassDiagramAST + Theme + StringMeasurer → ClassGeometry
 * via the dot layout engine.
 *
 * Architecture decisions:
 *   D3 — Calls layout() from the shared dot engine.
 *   D4 — Nodes are pre-measured; dot only routes and positions.
 *   D5 — Namespaces are flattened into the root graph (D5 refers to
 *         ranking only now — see buildDotClusters); namespace bounds are
 *         derived from classifier positions after layout.
 *
 * No DOM, no SVG. All I/O is plain data.
 *
 * Classifier sizing/measurement is implemented in ./class-layout-helpers.ts
 * (split out to keep every function under the project's per-function
 * complexity/size caps; this file re-exports `formatMemberText` from there).
 * G2/N11: the pure ClassifierGeo/NamespaceGeo/EdgeGeo builders + the
 * degenerate single-classifier skip are implemented in
 * ./class-geo-builders.ts (same split rationale, no behavior change --
 * moved verbatim to keep THIS file under the 500-line file-size cap after
 * adding the ink-shift mechanism below).
 * mission skin-file-loading: the public geometry types themselves
 * (ClassifierGeo/EdgeGeo/NamespaceGeo/ClassGeometry) moved to
 * ./class-geo-types.ts (re-exported below, same split rationale) to keep
 * this file under the 500-line cap after adding shadow support.
 */

import type { ClassDiagramAST, Classifier } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { layoutGraph as layout } from '../../core/graph-layout.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import { filterRemovedEntities, computeHiddenIds, computeRemovedRanks } from './class-directives.js';
import { foldEffectiveActions } from './class-directives-removal.js';
import { collapseEmptyNamespacesFinal } from './class-namespace.js';
import { mapNoteGeos, type NoteGeo } from './note-layout.js';
import { findFreestandingNoteConnectors } from './note-freestanding.js';
import { measureClassifier, isMethodMember, type MeasuredClassifier } from './class-layout-helpers.js';
import { measureCircleInterface } from './class-layout-leaf-shapes.js';
import { buildDotGraph } from './class-dot-graph.js';
import { computeLeafDrawOrder } from './class-leaf-order.js';
import { computeClassDocumentDims, computeClassInkShift, computeClassRawInkDims } from './layout-ink-extent.js';
import { iconSizeOf } from './class-visibility-icon.js';
import { resolveScaleFactor } from '../../core/scale-command.js';
import { scaleClassGeometry } from './class-scale-geo.js';
import {
  buildClassifierGeos,
  buildNamespaceGeos,
  buildEdgeGeos,
  degenerateSingleClassifier,
} from './class-geo-builders.js';
import type { ClassifierGeo, EdgeGeo, NamespaceGeo, ClassGeometry, ClassLeafGeo } from './class-geo-types.js';

export { formatMemberText, ROW_TEXT_LEFT_MARGIN } from './class-layout-helpers.js';
export {
  isNoteGeo,
  isClassifierGeo,
  classifierLeaves,
  noteLeaves,
  type ClassifierGeo,
  type EdgeGeo,
  type NamespaceGeo,
  type ClassGeometry,
  type JsonBodyItem,
  type ClassLeafGeo,
} from './class-geo-types.js';

// ---------------------------------------------------------------------------
// Directive resolution helpers
// ---------------------------------------------------------------------------

/** cdd-T22 (E8): `circle` sizes via `class-layout-leaf-shapes.ts
 *  #measureCircleInterface`, not the generic box. */
function measureLeaf(
  classifier: Classifier,
  theme: Theme,
  measurer: StringMeasurer,
  suppress: { fields: boolean; methods: boolean },
  sprites: ClassDiagramAST['sprites'],
): MeasuredClassifier {
  if (classifier.kind === 'circle') return measureCircleInterface(classifier, theme, measurer, sprites);
  return measureClassifier(classifier, theme, measurer, suppress, sprites);
}

/**
 * Pre-measure every classifier, honoring "hide members" / "hide empty
 * members" / "hide empty fields" / "hide empty methods".
 *
 * G2 N10: `hide empty members` is NOT "hide the whole section when BOTH
 * compartments are empty" (the port's original reading) — upstream expands
 * it into TWO independent per-portion directives, one per compartment
 * (`CommandHideShowByGender.java:267-279`'s `emptyMembers` special case:
 * `hideOrShow(FIELD, emptyByGender(FIELD))` + `hideOrShow(METHOD,
 * emptyByGender(METHOD))`), so a classifier with fields but no methods gets
 * ONLY its (empty) methods compartment suppressed, fields stay fully drawn.
 * `hide empty fields`/`hide empty methods` map directly to one portion each
 * and were previously parsed into the AST but never consulted here at all
 * (dead directives) — jar-verified `mezucu-18-lozi106` (`hide empty
 * members` + a field-only class: jar draws ONE divider, not two).
 */
function preMeasureClassifiers(
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): Map<string, MeasuredClassifier> {
  const measuredMap = new Map<string, MeasuredClassifier>();
  for (const classifier of ast.classifiers) {
    // A2s R2g: the directive fold is PER CLASSIFIER — a directive parsed
    // inside a `package { }` reaches only that package's direct children
    // (CommandHideShowByGender.java:272-273's byPackage AND; see
    // class-directives-removal.ts#directiveAppliesTo).
    const effectiveActions = foldEffectiveActions(ast.directives, classifier);
    const hideMembers = effectiveActions.get('members') === 'hide';
    const hideEmptyMembers = effectiveActions.get('empty members') === 'hide';
    const hideEmptyFields = effectiveActions.get('empty fields') === 'hide';
    const hideEmptyMethods = effectiveActions.get('empty methods') === 'hide';
    // A2s F-A / A5: global `hide fields`/`hide methods` (G2 N27) suppress the
    // WHOLE compartment, not just its rows -- upstream's `getBody` returns the
    // fields-only / methods-only / empty block with NO `MethodsOrFieldsArea`
    // at all for the hidden portion (jar-verified `vegubu-29-bomu147`: `hide
    // methods` box is 40px, not 40px + the empty-compartment chrome).
    // @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java:240-244
    const hideFields = effectiveActions.get('fields') === 'hide';
    const hideMethods = effectiveActions.get('methods') === 'hide';
    const visibleMembers = classifier.members.filter((m) => m.hidden !== true);
    // Object leaves route EVERY member into "fields" regardless of
    // method-like syntax (`BodierLikeClassOrObject#getFieldsToDisplay`'s
    // `type != LeafType.OBJECT` guard) — no separate methods compartment.
    const isObjectLike = classifier.kind === 'object';
    const fieldsEmpty = isObjectLike
      ? visibleMembers.length === 0
      : visibleMembers.filter((m) => !isMethodMember(m)).length === 0;
    const methodsEmpty = isObjectLike ? true : visibleMembers.filter(isMethodMember).length === 0;
    // G2 N26: entity-qualified `hide <entity> members|fields|attributes|
    // methods` (`class-directives.ts#applyHideShowEntityDirectives`) already
    // stamped these two flags directly onto the classifier post-parse --
    // OR'd in alongside the diagram-global targets above.
    const suppressFields =
      hideMembers ||
      hideFields ||
      ((hideEmptyMembers || hideEmptyFields) && fieldsEmpty) ||
      classifier.suppressFields === true;
    const suppressMethods =
      hideMembers ||
      hideMethods ||
      ((hideEmptyMembers || hideEmptyMethods) && methodsEmpty) ||
      classifier.suppressMethods === true;
    measuredMap.set(
      classifier.id,
      measureLeaf(classifier, theme, measurer, { fields: suppressFields, methods: suppressMethods }, ast.sprites),
    );
  }
  // #lizard forgives -- pre-existing hide/show directive resolution (4
  // independent boolean flags feeding 2 OR-chains); porting discipline
  // forbids restructuring faithfully-ported logic during an unrelated
  // change (CLAUDE.md "do not refactor while porting").
  return measuredMap;
}

// cdd-T6: the five ink-shift helpers moved to `class-layout-shift.ts` when
// `shiftEdgeExtras` (the four new `EdgeGeo` coordinate fields) pushed this
// file past the 500-line hook cap -- a pure move, pre-authorised split.
import { shiftClassifierGeo, shiftEdgeGeo, shiftNamespaceGeo, shiftNoteGeo } from './class-layout-shift.js';

/**
 * T4 (mission leaf-draw-order, D3): reorders `leaves` (built by
 * `assembleShiftedGeometry` in the old classifiers-then-notes concatenation
 * order) into jar's real leaf draw order -- `computeLeafDrawOrder`'s id
 * list, T2's pure fold of the AST. A geo id with no matching order entry is
 * a T2 bug (the id list must cover every classifier/note id that reached
 * geometry) -- thrown rather than silently appended, per this task's own
 * contract.
 */
function orderLeaves(leaves: readonly ClassLeafGeo[], order: readonly string[]): ClassLeafGeo[] {
  const rank = new Map(order.map((id, i) => [id, i]));
  for (const leaf of leaves) {
    if (!rank.has(leaf.id)) {
      throw new Error(`computeLeafDrawOrder: leaf "${leaf.id}" is missing from the draw order (T2 bug)`);
    }
  }
  return [...leaves].sort((a, b) => rank.get(a.id)! - rank.get(b.id)!);
}

// ---------------------------------------------------------------------------
// Single-page layout (internal)
// ---------------------------------------------------------------------------

/**
 * Lay out a single class diagram page using the dot layout engine
 * (synchronous). Called once per page by `layoutClass` when `ast.pages` is
 * present (T7); called directly for the common single-page case.
 *
 * Nodes are pre-measured (D4); the dot engine handles routing and positioning.
 * Namespaces are flattened into the root graph (D5); their bounding boxes are
 * computed from classifier positions after layout.
 *
 * @param ast      - Parsed class diagram AST (one page's worth of content).
 * @param theme    - Visual theme for font metrics and sizing.
 * @param measurer - Text measurement implementation.
 * @returns        Pixel geometry for all classifiers, edges, and namespaces.
 */
// cdd-T29: exported so `class-layout-multipage.ts` (split out of this file)
// can call it -- see that module's own doc comment.
export function layoutSinglePage(ast: ClassDiagramAST, theme: Theme, measurer: StringMeasurer): ClassGeometry {
  // Empty diagram (isDegeneratedWithFewEntities(0): 0 groups, 0 links, 0
  // leafs — leafs includes notes, so a lone freestanding note must NOT hit
  // this shortcut or it would be silently dropped) — zero-size result.
  if (
    ast.namespaces.length === 0 &&
    ast.relationships.length === 0 &&
    ast.classifiers.length === 0 &&
    ast.notes.length === 0
  ) {
    return { totalWidth: 0, totalHeight: 0, leaves: [], edges: [], namespaces: [] };
  }

  // Collapse any namespace left empty by parsing into a flat leaf classifier
  // (reopen-safe counterpart of the parse-time collapse — see
  // class-namespace.ts#collapseEmptyNamespacesFinal). Before measuring.
  const collapsedAst = collapseEmptyNamespacesFinal(ast);

  // Pre-measure all classifiers (the hide/show directive fold is per
  // classifier inside — last applicable writer wins per target, A2s R2g)
  const measuredMap = preMeasureClassifiers(collapsedAst, theme, measurer);

  // Degenerate diagram (0-1 entities, no relationships) — skip graphviz
  // entirely, mirroring GraphvizImageBuilder.buildImage:211-223. Checked on
  // the RAW ast: upstream's isDegeneratedWithFewEntities counts getLeafs()/
  // getLinks() UNFILTERED, so removed entities still count here (a graph
  // reduced to one node by `remove` still runs graphviz — pijode-83).
  const degenerate = degenerateSingleClassifier(collapsedAst, measuredMap);
  if (degenerate !== undefined) return degenerate;

  // remove/restore exclusion at the layout-input boundary — the port's
  // equivalent of upstream's export-time isRemoved() skips in
  // GraphvizImageBuilder (printEntities:350, printGroups:413, link:230).
  // Same object back when no remove directives exist (the common path).
  // Everything below — dot graph, note synthesis, geo building — sees only
  // the surviving entities, keeping edge-index alignment consistent.
  const effAst = filterRemovedEntities(collapsedAst);
  // cdd-T3 (A1 SB5): the ranks that filtering just dropped -- jar burned them
  // at parse time and only skips the entities at EXPORT time, so they stay as
  // holes in its numbering (`computeRemovedRanks`'s own doc comment).
  const removedRanks = computeRemovedRanks(collapsedAst);

  // Build dot graph (classifiers + notes flattened into root graph, D5)
  const { dotGraph, swappedEdges, noteParts, anchors, clusterIdByNs, kals, sametailByRelIndex, protectedIds } =
    buildDotGraph(effAst, measuredMap, theme, measurer);

  const result = layout(dotGraph);

  // Build position map from dot layout result
  const posMap = new Map(result.nodes.map((n) => [n.id, n]));
  const hiddenIds = computeHiddenIds(effAst);
  const classifiers = buildClassifierGeos(effAst, measuredMap, posMap, hiddenIds, theme);
  // T5 (namespace-cluster-box): read the namespace box from the real
  // graphviz cluster polygon (`result.clusters`), not a member-bbox walk --
  // see `class-geo-builders.ts#buildNamespaceGeos`'s own doc comment.
  const namespaces = buildNamespaceGeos(effAst, { theme, measurer, clusters: result.clusters, clusterIdByNs, hiddenIds });
  // cdd-T13 (M1): the real graphviz cluster box for every cluster-anchored
  // edge endpoint -- `NamespaceGeo.x/y/width/height` is `box` VERBATIM
  // (`Cluster#setPosition`, `class-geo-builders.ts#namespaceGeoFromBox`'s
  // own doc comment), the SAME pre-shift frame `result.edges[].points` and
  // the note connector's raw points are in (`core/graph-layout.ts
  // #shiftToOrigin` shifts nodes/edges/clusters together, BEFORE this
  // file's own `assembleShiftedGeometry` runs). Keyed by namespace id, the
  // SAME key `anchors` uses -- see `class-shield-helpers.ts
  // #clipClusterEdgeEnds`'s own doc comment.
  const clusterRects = new Map(
    namespaces.map((ns) => [ns.id, { x: ns.x, y: ns.y, width: ns.width, height: ns.height }]),
  );
  // SI25 D2: the MAIN label's ink follows `resolveArrowLabelFont(theme)` --
  // the SAME font `class-layout-edge-labels.ts` measured the DOT box with;
  // tail/head cardinality labels stay at `theme.fontFamily` (see
  // `class-edge-geo.ts#EdgeGeoTextContext`).
  const edges = buildEdgeGeos(
    effAst,
    result,
    swappedEdges,
    {
      measurer,
      labelFont: resolveArrowLabelFont(theme),
      fontFamily: theme.fontFamily,
      // cdd-T6 (A2a/M2): the SAME `skinparam classAttributeIconSize`
      // `class-layout-edge-labels.ts` reserved the label box with.
      classAttributeIconSize: theme.classAttributeIconSize,
      // cdd-T6 (A2a/M10): the SAME resolved `arrow.cardinality` font
      // `class-dot-graph.ts` sizes the tail/head DOT boxes with.
      cardinalityFont: { family: theme.cardinalityFontFamily!, size: theme.cardinalityFontSize! },
      // cdd-T6 (A2a/M5, M9): the SAME theme+sprite pair `class-dot-graph.ts`
      // sized a `note on link`-merged label box with.
      noteCtx: { theme, ...(effAst.sprites !== undefined ? { sprites: effAst.sprites } : {}) },
      // cdd-T15 (A2a/M1, D6): the SAME `Kal` list `class-dot-graph.ts`
      // sized the node shield margins with -- see `EdgeGeoTextContext.kals`.
      kals,
      // cdd-T16 (M7): the SAME grouped-tail map `class-dot-graph.ts`
      // emitted the `sametail` DOT attribute from -- see
      // `EdgeGeoTextContext.sametailByRelIndex`.
      sametailByRelIndex,
      // cdd-T16b (E11): every protected leaf's classifier id -- see
      // `EdgeGeoTextContext.protectedIds`.
      protectedIds,
    },
    posMap,
    anchors,
    clusterRects,
    theme.colors.graph.arrowThickness,
  );
  // Mission note-leaf-model D3: `mapNoteGeos` reads NO classifier -- a
  // member-tip (`::member`) note's notch is resolved inside the draw passes
  // (`note-tips-resolve.ts`, as `EntityImageTips#drawU` does), so notes no
  // longer have to be built after classifiers; the order below is kept
  // only until Batch 3 folds the two arrays into one collection. G2/N16
  // Kind B: a freestanding note's ONE real relationship connector (if any)
  // feeds the SAME Opale mechanism `mapGroupNoteGeos` already tries for an
  // attached single-link note (Kind C) -- `findFreestandingNoteConnectors`'s
  // own doc comment. `visibleEdges` drops whichever candidate edge actually
  // resolved via Opale (`n.opale !== undefined`) -- jar draws NO separate
  // `<g class="link">` for an opalisable note's connector at all
  // (`SvekEdge#drawU`'s `if (opale) return;`); a candidate that FAILED to
  // resolve (degenerate spline) keeps its ordinary edge draw, the same
  // safe fallback `buildOpaleNoteGeo ?? plainNoteGeo` already applies.
  const freestandingConnectors = findFreestandingNoteConnectors(effAst.notes, edges, effAst.classifiers);
  // cdd-T13 (M1): a `note <pos> of <package>` connector is upstream's OWN
  // ordinary `Link` (`CommandFactoryNoteOnEntity.java:342`), so its
  // `SvekEdge` gets the SAME `:671-672` clip -- threaded into `mapNoteGeos`
  // (write-set extension, flagged, precedent rows 18/29/36/39: T9b's own
  // row 39 names this exact residual as T13's). Freestanding notes need no
  // extra wiring here: their connector is `edges[]` itself
  // (`findFreestandingNoteConnectors`, above), already clipped by
  // `buildEdgeGeos`.
  const notes: NoteGeo[] = mapNoteGeos(
    effAst.notes,
    result,
    noteParts,
    { theme, measurer },
    {
      freestandingConnectors,
      clusterRects,
    },
  );
  const opaleNoteIds = new Set(notes.filter((n) => n.opale !== undefined).map((n) => n.id));
  const consumedEdgeIds = new Set(
    [...freestandingConnectors.entries()].filter(([noteId]) => opaleNoteIds.has(noteId)).map(([, edge]) => edge.id),
  );
  // NOT filtered out of `edges` -- `EdgeGeo.consumedByOpaleNote`'s own doc
  // comment: `renderer-uid.ts` still needs every edge's `creationIndex`
  // slot counted in the dense-renumbering merge, even one that never draws.
  const markedEdges = edges.map((e) => (consumedEdgeIds.has(e.id) ? { ...e, consumedByOpaleNote: true as const } : e));

  const assembled = assembleShiftedGeometry(classifiers, namespaces, markedEdges, notes, iconSizeOf(theme));
  // T4 (D3): `leaves` built by `assembleShiftedGeometry` in concatenation
  // order -- reorder into jar's real draw order here, over the SAME
  // `effAst` the dot graph/geo builders above already read.
  return {
    ...assembled,
    ...(removedRanks.length > 0 ? { removedRanks } : {}),
    leaves: orderLeaves(assembled.leaves, computeLeafDrawOrder(effAst)),
  };
  // #lizard forgives -- linear orchestration (empty-diagram guard,
  // namespace-collapse, hide/show resolution, pre-measure, degenerate skip,
  // dot-graph build+layout, geo builders, final assembly), each step ALREADY
  // its own named helper (`class-geo-builders.ts`/`class-layout-helpers.ts`/
  // `class-directives.ts`) -- one extra assembly-call line over the NLOC cap
  // after G2/N11's `assembleShiftedGeometry` split; not reducible further
  // without a step count no upstream boundary justifies.
}

/**
 * G2/N11: dimensions first (translation-invariant, mirrors Java's own
 * evaluation order — `SvekResult#calculateDimension` reads the PRE-shift
 * `minMax`'s dimension before `moveDelta` ever runs), THEN apply the
 * uniform ink shift (`moveDelta`) EVERY already-laid-out position needs —
 * this port's raw graphviz-normalized positions were previously returned
 * unshifted, off by a constant `(dx, dy)` per fixture (the "~7-8px
 * multi-component/box position/margin residual" named since N7/N10 — see
 * `layout-ink-extent.ts`'s own doc comment for the jar citation and
 * derivation). Split out of `layoutSinglePage` to keep that function under
 * the project's per-function size cap.
 */
function assembleShiftedGeometry(
  classifiers: ClassifierGeo[],
  namespaces: NamespaceGeo[],
  edges: EdgeGeo[],
  notes: NoteGeo[],
  // G9/T12: the resolved `classAttributeIconSize` — a `#`/`~` visibility
  // icon is a `UPolygon`, whose ink `LimitFinder` pads by 10px on each side
  // (see `class-ink-box.ts#addVisibilityIconInk`).
  iconSize: number,
): ClassGeometry {
  // cdd-T31 round 2 (E5 defect b): a hidden NAMESPACE's own cluster
  // decoration draws NOTHING -- `Cluster#drawU` (svek/Cluster.java:298-300)
  // `return`s BEFORE any `draw()`/`apply()` call, so its border/title never
  // reaches `LimitFinder` and contributes zero ink there. A hidden
  // CLASSIFIER is different: `SvekResult.java:85` wraps its draw calls in
  // `ug.apply(UHidden.HIDDEN)`, but `LimitFinder#apply` (klimt/drawing/
  // LimitFinder.java:78-83) does not special-case `UHidden` at all -- the
  // wrapped `draw()` calls still run and still accumulate ink; only the
  // real SVG-emitting `UGraphic` (a different implementation) skips markup.
  // So ONLY namespaces are filtered out of the ink walk here; classifiers
  // keep contributing ink exactly as if visible, matching the jar. The
  // FULL (unfiltered) `classifiers`/`namespaces` still get shifted and
  // returned below -- layout/uid numbering is unaffected either way
  // (`ClassifierGeo.hidden`'s own doc comment). Confirmed via senece-96-
  // fomu913 (`hide Foo1`/`Foo3`/`util`): filtering classifiers too
  // shrank the canvas width from 293 (jar 277, before this fix) to 85 (jar
  // 277) -- classifier ink is NOT excluded upstream, only the cluster's.
  const inkNamespaces = namespaces.filter((n) => n.hidden !== true);
  const documentDims = computeClassDocumentDims(classifiers, inkNamespaces, edges, notes, iconSize);
  // G2 N46: raw (pre-margin, pre-quirk) ink dims -- see `ClassGeometry
  // .rawWidth`'s own doc comment for why chrome centering needs this
  // instead of `documentDims`.
  const rawDims = computeClassRawInkDims(classifiers, inkNamespaces, edges, notes, iconSize);
  const shift = computeClassInkShift(classifiers, inkNamespaces, edges, notes, iconSize);

  // T3/T4 (mission leaf-draw-order): `leaves` here is still the plain
  // classifiers-then-notes concatenation -- `layoutSinglePage`'s caller
  // reorders it into jar's real draw order via `orderLeaves` right after
  // this function returns (kept out of here so this stays a pure
  // shift/assemble step, unaware of AST-derived order).
  return {
    totalWidth: documentDims.width,
    totalHeight: documentDims.height,
    rawWidth: rawDims.width,
    rawHeight: rawDims.height,
    leaves: [
      ...classifiers.map((c) => shiftClassifierGeo(c, shift.dx, shift.dy)),
      ...notes.map((n) => shiftNoteGeo(n, shift.dx, shift.dy)),
    ],
    edges: edges.map((e) => shiftEdgeGeo(e, shift.dx, shift.dy)),
    namespaces: namespaces.map((n) => shiftNamespaceGeo(n, shift.dx, shift.dy)),
  };
}

// cdd-T29: `layoutMultiPage`/`NEWPAGE_GAP` moved to `class-layout-
// multipage.ts` when this task's scale-wiring lines pushed the file back
// over the 500-line hook cap (pre-authorised split, same precedent as
// `class-layout-shift.ts`'s earlier move from this same file) --
// `layoutSinglePage` below is exported so that file can call it; a pure
// move otherwise, re-exported so no consumer's import path changed.
import { layoutMultiPage } from './class-layout-multipage.js';
export { layoutMultiPage };
// cdd-T34: same re-export precedent, one line each, for the `newpage`
// pagination trio `class/index.ts#classPlugin` wires onto `PaginatedPlugin`.
export { classPageAst, classPageCount, sliceClassGeometryPage } from './class-layout-multipage.js';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Lay out a class diagram using the dot layout engine (synchronous).
 *
 * When the source contained `newpage` (`ast.pages` is set — see ast.ts), each
 * page is laid out independently via `layoutSinglePage` and the resulting
 * geometries are stacked vertically (`layoutMultiPage`); otherwise the single
 * top-level AST is laid out directly, unchanged from pre-T7 behavior.
 *
 * cdd-T29 (D4): `scale ...` is resolved AFTER layout, from the diagram's
 * OWN final unscaled dimension (`resolveScaleFactor`'s own doc comment --
 * never a partial/intermediate one) — matches upstream's `UgDiagram.java:
 * 138`, which passes `scale` only to the exporter, never to svek/DOT
 * layout itself (`core/scale-command.ts`'s module doc, D4).
 *
 * @param ast      - Parsed class diagram AST.
 * @param theme    - Visual theme for font metrics and sizing.
 * @param measurer - Text measurement implementation.
 * @returns        Pixel geometry for all classifiers, edges, and namespaces.
 */
export function layoutClass(ast: ClassDiagramAST, theme: Theme, measurer: StringMeasurer): ClassGeometry {
  const geo =
    ast.pages !== undefined ? layoutMultiPage(ast.pages, theme, measurer) : layoutSinglePage(ast, theme, measurer);
  // cdd-T30: `theme.dpi` -- `skinParam.getDpi()`
  // (`core/TextBlockExporter.java:206`), default 96 when `skinparam dpi` was
  // never declared (`Theme.dpi`'s own doc comment). SAME `resolveScaleFactor`
  // call as before T30 -- no second scale-resolution path.
  const k = resolveScaleFactor(ast.scale, geo.totalWidth, geo.totalHeight, theme.dpi);
  return scaleClassGeometry(geo, k, theme.fontSize);
}
