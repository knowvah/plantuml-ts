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

import type { ClassDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { layoutGraph as layout } from '../../core/graph-layout.js';
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';
import { filterRemovedEntities, computeHiddenIds } from './class-directives.js';
import { foldEffectiveActions } from './class-directives-removal.js';
import { collapseEmptyNamespacesFinal } from './class-namespace.js';
import { mapNoteGeos, type NoteGeo } from './note-layout.js';
import { findFreestandingNoteConnectors } from './note-freestanding.js';
import {
  measureClassifier,
  isMethodMember,
  type MeasuredClassifier,
} from './class-layout-helpers.js';
import { buildDotGraph } from './class-dot-graph.js';
import { computeLeafDrawOrder } from './class-leaf-order.js';
import { computeClassDocumentDims, computeClassInkShift, computeClassRawInkDims } from './layout-ink-extent.js';
import { iconSizeOf } from './class-visibility-icon.js';
import {
  buildClassifierGeos,
  buildNamespaceGeos,
  buildEdgeGeos,
  degenerateSingleClassifier,
} from './class-geo-builders.js';
import {
  isNoteGeo, type ClassifierGeo, type EdgeGeo, type NamespaceGeo, type ClassGeometry, type ClassLeafGeo,
} from './class-geo-types.js';

export { formatMemberText, ROW_TEXT_LEFT_MARGIN } from './class-layout-helpers.js';
export {
  isNoteGeo, isClassifierGeo, classifierLeaves, noteLeaves,
  type ClassifierGeo, type EdgeGeo, type NamespaceGeo, type ClassGeometry, type JsonBodyItem, type ClassLeafGeo,
} from './class-geo-types.js';

// ---------------------------------------------------------------------------
// Directive resolution helpers
// ---------------------------------------------------------------------------

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
    const hideMembers      = effectiveActions.get('members')       === 'hide';
    const hideEmptyMembers = effectiveActions.get('empty members') === 'hide';
    const hideEmptyFields  = effectiveActions.get('empty fields')  === 'hide';
    const hideEmptyMethods = effectiveActions.get('empty methods') === 'hide';
    // A2s F-A / A5: global `hide fields`/`hide methods` (G2 N27) suppress the
    // WHOLE compartment, not just its rows -- upstream's `getBody` returns the
    // fields-only / methods-only / empty block with NO `MethodsOrFieldsArea`
    // at all for the hidden portion (jar-verified `vegubu-29-bomu147`: `hide
    // methods` box is 40px, not 40px + the empty-compartment chrome).
    // @see ~/git/plantuml/.../cucadiagram/BodierLikeClassOrObject.java:240-244
    const hideFields       = effectiveActions.get('fields')        === 'hide';
    const hideMethods      = effectiveActions.get('methods')       === 'hide';
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
    const suppressFields  =
      hideMembers || hideFields  || ((hideEmptyMembers || hideEmptyFields)  && fieldsEmpty) ||
      classifier.suppressFields === true;
    const suppressMethods =
      hideMembers || hideMethods || ((hideEmptyMembers || hideEmptyMethods) && methodsEmpty) ||
      classifier.suppressMethods === true;
    measuredMap.set(
      classifier.id,
      measureClassifier(
        classifier, theme, measurer, { fields: suppressFields, methods: suppressMethods }, ast.sprites,
      ),
    );
  }
  // #lizard forgives -- pre-existing hide/show directive resolution (4
  // independent boolean flags feeding 2 OR-chains); porting discipline
  // forbids restructuring faithfully-ported logic during an unrelated
  // change (CLAUDE.md "do not refactor while porting").
  return measuredMap;
}

// ---------------------------------------------------------------------------
// Ink-shift application (G2/N11) — post-dot-layout, pre-render uniform
// translate. `SvekResult#calculateDimension`'s own `moveDelta(6 - minMax
// .getMinX(), 6 - minMax.getMinY())` side effect (svek/SvekResult.java:133,
// see `layout-ink-extent.ts`'s own doc comment for the full jar citation).
// Shared by `layoutSinglePage` (the real ink shift, both axes) and
// `layoutMultiPage` (the y-only, OUR-OWN `NEWPAGE_GAP` page-stacking offset
// — same shape of translate, different origin, so the SAME helpers apply
// with `dx=0`).
// ---------------------------------------------------------------------------

/** Shift a ClassifierGeo's absolute position by `(dx, dy)`. */
function shiftClassifierGeo(c: ClassifierGeo, dx: number, dy: number): ClassifierGeo {
  return { ...c, x: c.x + dx, y: c.y + dy };
}

/** Shift a NamespaceGeo's absolute position by `(dx, dy)`. */
function shiftNamespaceGeo(n: NamespaceGeo, dx: number, dy: number): NamespaceGeo {
  return { ...n, x: n.x + dx, y: n.y + dy };
}

/** Shift every coordinate in an EdgeGeo by `(dx, dy)` (labels included). */
function shiftEdgeGeo(edge: EdgeGeo, dx: number, dy: number): EdgeGeo {
  return {
    ...edge,
    points: edge.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    ...(edge.label !== undefined
      ? { label: { ...edge.label, x: edge.label.x + dx, y: edge.label.y + dy } }
      : {}),
    ...(edge.labelLines !== undefined
      ? {
        labelLines: edge.labelLines.map((l) => ({
          ...l,
          x: l.x + dx,
          y: l.y + dy,
          ...(l.glyph !== undefined
            ? { glyph: { points: l.glyph.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } }
            : {}),
        })),
      }
      : {}),
    ...(edge.arrowGlyph !== undefined
      ? { arrowGlyph: { points: edge.arrowGlyph.points.map((p) => ({ x: p.x + dx, y: p.y + dy })) } }
      : {}),
    ...(edge.tailLabel !== undefined
      ? { tailLabel: { ...edge.tailLabel, x: edge.tailLabel.x + dx, y: edge.tailLabel.y + dy } }
      : {}),
    ...(edge.headLabel !== undefined
      ? { headLabel: { ...edge.headLabel, x: edge.headLabel.x + dx, y: edge.headLabel.y + dy } }
      : {}),
  };
}

/** Shift every coordinate in a NoteGeo by `(dx, dy)` (connector included). */
function shiftNoteGeo(note: NoteGeo, dx: number, dy: number): NoteGeo {
  return {
    ...note,
    x: note.x + dx,
    y: note.y + dy,
    connector: note.connector.map((p) => ({ x: p.x + dx, y: p.y + dy })),
  };
}

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
function layoutSinglePage(
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ClassGeometry {
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

  // Build dot graph (classifiers + notes flattened into root graph, D5)
  const { dotGraph, swappedEdges, noteParts, anchors, clusterIdByNs } =
    buildDotGraph(effAst, measuredMap, theme, measurer);

  const result = layout(dotGraph);

  // Build position map from dot layout result
  const posMap = new Map(result.nodes.map((n) => [n.id, n]));
  const hiddenIds = computeHiddenIds(effAst);
  const classifiers = buildClassifierGeos(effAst, measuredMap, posMap, hiddenIds, theme);
  // T5 (namespace-cluster-box): read the namespace box from the real
  // graphviz cluster polygon (`result.clusters`), not a member-bbox walk --
  // see `class-geo-builders.ts#buildNamespaceGeos`'s own doc comment.
  const namespaces = buildNamespaceGeos(effAst, theme, measurer, result.clusters, clusterIdByNs);
  // SI25 D2: the MAIN label's ink follows `resolveArrowLabelFont(theme)` --
  // the SAME font `class-layout-edge-labels.ts` measured the DOT box with;
  // tail/head cardinality labels stay at `theme.fontFamily` (see
  // `class-edge-geo.ts#EdgeGeoTextContext`).
  const edges = buildEdgeGeos(
    effAst, result, swappedEdges,
    { measurer, labelFont: resolveArrowLabelFont(theme), fontFamily: theme.fontFamily },
    posMap, anchors, theme.colors.graph.arrowThickness,
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
  const notes: NoteGeo[] = mapNoteGeos(
    effAst.notes, result, noteParts, { theme, measurer }, freestandingConnectors,
  );
  const opaleNoteIds = new Set(notes.filter((n) => n.opale !== undefined).map((n) => n.id));
  const consumedEdgeIds = new Set(
    [...freestandingConnectors.entries()]
      .filter(([noteId]) => opaleNoteIds.has(noteId))
      .map(([, edge]) => edge.id),
  );
  // NOT filtered out of `edges` -- `EdgeGeo.consumedByOpaleNote`'s own doc
  // comment: `renderer-uid.ts` still needs every edge's `creationIndex`
  // slot counted in the dense-renumbering merge, even one that never draws.
  const markedEdges = edges.map((e) =>
    consumedEdgeIds.has(e.id) ? { ...e, consumedByOpaleNote: true as const } : e,
  );

  const assembled = assembleShiftedGeometry(classifiers, namespaces, markedEdges, notes, iconSizeOf(theme));
  // T4 (D3): `leaves` built by `assembleShiftedGeometry` in concatenation
  // order -- reorder into jar's real draw order here, over the SAME
  // `effAst` the dot graph/geo builders above already read.
  return { ...assembled, leaves: orderLeaves(assembled.leaves, computeLeafDrawOrder(effAst)) };
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
  const documentDims = computeClassDocumentDims(classifiers, namespaces, edges, notes, iconSize);
  // G2 N46: raw (pre-margin, pre-quirk) ink dims -- see `ClassGeometry
  // .rawWidth`'s own doc comment for why chrome centering needs this
  // instead of `documentDims`.
  const rawDims = computeClassRawInkDims(classifiers, namespaces, edges, notes, iconSize);
  const shift = computeClassInkShift(classifiers, namespaces, edges, notes, iconSize);

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

// ---------------------------------------------------------------------------
// Multi-page (`newpage`) combination — T7
// ---------------------------------------------------------------------------

/**
 * Vertical gap (px) inserted between stacked pages. This offset is OURS, not
 * upstream's: upstream's `NewpagedDiagram` lays out each page as an
 * independent svek graph and (per `NewpagedDiagram.java`, which never
 * overrides `AbstractDiagram.getNbImages()`) the reference CLI only ever
 * exports page 1 as a separate file per source — there is no upstream
 * "stacked" rendering to match pixel-for-pixel. Since this library returns a
 * single SVG string rather than one file per page, we stack pages vertically
 * ourselves; see CHANGELOG.md.
 */
const NEWPAGE_GAP = 20;

/**
 * Lay out every page independently (each page is a complete, standalone
 * diagram per upstream `NewpagedDiagram` semantics — see T6/ast.ts), then
 * stack the resulting geometries vertically with `NEWPAGE_GAP` between them.
 * One dot-layout pass per non-degenerate page, in page order (a degenerate
 * page still contributes its own geometry via `layoutSinglePage`'s internal
 * skip — it just never reaches the graphviz call). Each page's own G2/N11
 * ink shift is already baked in by `layoutSinglePage` before this function
 * ever sees it; this is a SEPARATE, purely additive y-only offset (`dx=0`)
 * stacked on top.
 */
function layoutMultiPage(
  pages: ClassDiagramAST[],
  theme: Theme,
  measurer: StringMeasurer,
): ClassGeometry {
  const leaves: ClassLeafGeo[] = [];
  const edges: EdgeGeo[] = [];
  const namespaces: NamespaceGeo[] = [];
  let maxWidth = 0;
  let yOffset = 0;

  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const geo = layoutSinglePage(page, theme, measurer);
    const dy = yOffset;

    // T4: each page's own `leaves` is already jar's real draw order (D3,
    // `layoutSinglePage`'s own `orderLeaves` call); shifting per-kind and
    // re-pushing in the same relative order preserves that order, and pages
    // concatenate in page order (the outer `for` loop) -- no re-sort needed
    // here, each page IS its own upstream `NewpagedDiagram` page.
    for (const leaf of geo.leaves) {
      leaves.push(isNoteGeo(leaf) ? shiftNoteGeo(leaf, 0, dy) : shiftClassifierGeo(leaf, 0, dy));
    }
    for (const e of geo.edges) edges.push(shiftEdgeGeo(e, 0, dy));
    for (const n of geo.namespaces) namespaces.push(shiftNamespaceGeo(n, 0, dy));

    maxWidth = Math.max(maxWidth, geo.totalWidth);
    yOffset += geo.totalHeight;
    if (i < pages.length - 1) yOffset += NEWPAGE_GAP;
  }

  return { totalWidth: maxWidth, totalHeight: yOffset, leaves, edges, namespaces };
}

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
 * @param ast      - Parsed class diagram AST.
 * @param theme    - Visual theme for font metrics and sizing.
 * @param measurer - Text measurement implementation.
 * @returns        Pixel geometry for all classifiers, edges, and namespaces.
 */
export function layoutClass(
  ast: ClassDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): ClassGeometry {
  if (ast.pages !== undefined) return layoutMultiPage(ast.pages, theme, measurer);
  return layoutSinglePage(ast, theme, measurer);
}
