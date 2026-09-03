/**
 * Svek-pass builder (mission A4/T4) — walks the composite tree, building one
 * `DotInputGraph` per "pass boundary" (the top-level diagram, or an autonom
 * composite). Pass FIRING order and tree-assembly RECURSION are decoupled
 * (mission A4 Phase L iteration 17 — `CucaDiagramSimplifierState.getOrdered`
 * port, state-composite-classify.ts's `firingOrder` doc has the full
 * mechanism): `resolveAllAutonomPasses` (./state-composite-autonom.ts,
 * mission G4 S3, moved out for the 500-line file cap) fires every autonom
 * composite's own `layoutGraph()` call ONCE, up front, strictly in
 * `ctx.classify.firingOrder` order (deepest nesting level first, source
 * order as tie-break within a level, WHOLE-TREE-WIDE) — NOT per-branch
 * depth-first. `resolveMember`'s tree-assembly recursion (still depth-first,
 * unchanged in shape) merely READS each autonom composite's already-computed
 * result from `ctx.resolvedAutonom` when it reaches one; it never fires a
 * pass itself. Firing-order correctness guarantees the lookup always hits:
 * any autonom composite `resolveMember` can reach during a shallower
 * composite's (or the top level's) own build is, by construction, one of
 * ITS descendants, hence strictly deeper, hence already resolved earlier in
 * the SAME firing-order loop.
 *
 * Non-autonom composites are NOT a pass boundary: their members recurse
 * straight into the CURRENT pass's node/edge/cluster accumulator, nested via
 * `DotInputCluster.parentId` — matching `GroupMakerState.getImage()`, which
 * is only ever invoked for autonom groups (mechanisms.md §3, bajelo-54-dixe684
 * confirms an autonom pass can itself contain nested clusters for its own
 * non-autonom children).
 *
 * Two independent outputs come out of the same walk: the flat
 * `PassAccumulator` (nodes/edges/clusters — what actually gets laid out and
 * DOT-emitted) and a `GeoSpec` TREE (what the renderer needs — real visual
 * nesting, not the emitter's flat `parentId` scheme).
 *
 * Edge/note accumulation (`addScopeNotes`/`addLevelEdges`/
 * `collectRegularTransitions`/`sweepOrphanEdges`/the edge-id and cluster-id
 * counters) lives in ./state-composite-pass-edges.ts (500-line file-cap
 * compliance, split the same way ./state-composite-cluster.ts et al. were
 * earlier) -- imported here for `buildTopLevelPass`'s own use, and
 * re-exported so every pre-existing EXTERNAL importer of THIS module keeps
 * working unchanged. `PassAccumulator` itself moved to
 * ./state-composite-pass-types.ts alongside `DiagramCtx`/`GeoSpec` (same
 * split, same rationale: both this file and state-composite-pass-edges.ts
 * need the type, so it has to live below both in the import DAG).
 *
 * @see ~/git/plantuml/.../svek/GroupMakerState.java
 * @see ~/git/plantuml/.../dot/CucaDiagramSimplifierState.java#simplify
 */

import type { State, StateDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import { layoutGraph } from '../../core/graph-layout.js';
import type { DotInputGraph, DotLayoutResult } from '../../core/graph-layout.js';
import { buildStateGeoTextFields } from './state-sizing.js';
import { classifyDiagram, resolveEndpoint } from './state-composite-classify.js';
import { hasLocalContent } from './state-composite-detect.js';
import { buildLeafNode } from './state-leaf-node.js';
import type { TransitionGeo } from './state-geo-types.js';
import { attachTransitionLabel } from './state-transition-label.js';
import { clusterAnchorRectsOf, clipTransitionSpline } from './state-transition-clip.js';
import { resolveAllAutonomPasses } from './state-composite-autonom.js';
import { resolveClusterComposite } from './state-composite-cluster.js';
import { isTransparentColor } from '../../core/paint.js';
import { resolveBareOrBackColor } from '../../core/color-override.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import { buildNoteGraphPartsByScope, sweepOrphanNoteEdges } from './state-note-layout.js';
// mission G4 S7: pseudo-anchor id resolution + creation-order sibling
// sorting moved to ./state-composite-pseudo.ts (500-line file-cap
// compliance) -- re-exported so every pre-existing EXTERNAL importer of
// THIS module keeps working unchanged.
import { scopedPseudoIds, sortSpecsByCreationIndex, sortSpecsByDocumentOrder, addLocalPseudoNodes, levelEndpointId } from './state-composite-pseudo.js';
export { scopedPseudoIds, sortSpecsByCreationIndex, sortSpecsByDocumentOrder, addLocalPseudoNodes, levelEndpointId };

// Edge/note accumulation -- imported for `buildTopLevelPass`'s own use below
// AND re-exported (`addScopeNotes`/`addLevelEdges`/`sweepOrphanEdges`/
// `nextClusterId`/`resetEdgeCounter`) so every pre-existing EXTERNAL
// importer of THIS module keeps working unchanged. `collectRegularTransitions`
// was never externally exported, so it's imported for internal use only.
import { addScopeNotes, addLevelEdges, collectRegularTransitions, sweepOrphanEdges, nextClusterId, resetEdgeCounter } from './state-composite-pass-edges.js';
export { addScopeNotes, addLevelEdges, sweepOrphanEdges, nextClusterId, resetEdgeCounter };

import type { DiagramCtx, GeoSpec, PassAccumulator } from './state-composite-pass-types.js';
// Re-exported so every pre-existing EXTERNAL importer of THIS module
// (`DiagramCtx`/`GeoSpec`/`PassAccumulator` from './state-composite-pass.js')
// keeps working unchanged after the types-leaf split (this file's own doc
// comment above).
export type { DiagramCtx, GeoSpec, PassAccumulator };


/** Zero-size placeholder — Svek's `.01in` synthetic anchor node
 *  (ClusterDotString.empty()), converted to our px convention (0.01in*72px).
 *  Exported: `state-composite-cluster.ts`'s zaent-anchor-node push reuses
 *  this same constant, not a re-derived copy. */
export const ANCHOR_SIZE = 0.72;

/** T7/D3/D4: the transition/edge-label font, distinct from
 *  `theme.fontSize`/`STATE(14, normal)` (state body/title text), resolved
 *  through the shared resolver -- same call as
 *  `description/renderer-edge.ts#arrowLabelFontConfig`'s own DOT-
 *  measurement site. */
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';

export function newAccumulator(labelFont?: FontSpec, measurer?: StringMeasurer): PassAccumulator {
  return { nodes: [], edges: [], clusters: [], edgeSources: [], ...(labelFont !== undefined ? { labelFont } : {}), ...(measurer !== undefined ? { measurer } : {}) };
}

/** One composite MEMBER at any nesting depth: dispatches leaf / autonom /
 *  non-autonom-cluster. Always pushes flat DOT data into `acc` (the pass's
 *  own shared accumulator, regardless of cluster nesting depth); always
 *  returns a proper GeoSpec TREE node for the renderer. The autonom branch
 *  is a pure LOOKUP (mission A4 Phase L iter 17) -- `resolveAllAutonomPasses`
 *  has already fired every autonom composite's own pass, in the correct
 *  GLOBAL order, before any `resolveMember` walk begins. */
/** `stateDiagram { state { RoundCorner 25 } }` -- the jar's own default
 *  corner radius for every state-diagram box shape
 *  (`~/git/plantuml/src/main/resources/skin/plantuml.skin:266-268`, and
 *  identically `rose.skin:265-268`). Read RAW here (not halved) because
 *  {@link resolvesSouthCapInk} mirrors `RoundedSouth.drawU`'s own
 *  `rounded == 0` test, which upstream applies to the unhalved
 *  `PName.RoundCorner` value (`svek/Cluster.java:321`). */
const STATE_DEFAULT_ROUND_CORNER = 25;

/**
 * SI31 T4 (G5, "mechanism 8"): does this composite's `RoundedSouth` south
 * cap actually get DRAWN, so that `LimitFinder#drawUPath`'s zero ink inset
 * applies at its max-Y? See `StateNodeGeo.southCapInk`'s own doc comment
 * (state-geo-types.ts) for the geometry; this is the GATE half.
 *
 * `RoundedSouth.drawU` (`~/git/plantuml/.../svek/RoundedSouth.java:65-83`)
 * draws nothing at all when `backColor.isTransparent()` (lines 66-67), and
 * falls back to a plain `URectangle` -- whose ink goes through
 * `LimitFinder#drawRectangle`'s `-1` inset, contributing NO extra px -- when
 * `rounded == 0` (lines 68-70). Both guards are mirrored here.
 *
 * `southBackcolor` is resolved at `~/git/plantuml/.../svek/Cluster.java:459
 * -471`: `group.getColors().getColor(ColorType.BACK)` if the group carries an
 * explicit inline override, else the `stateDiagram.state.body` style bucket,
 * which `src/main/resources/skin/plantuml.skin:266-271` defaults to
 * `transparent`. `StyleSignatureBasic#matchAll`
 * (`~/git/plantuml/.../style/StyleSignatureBasic.java:212-216`) admits any
 * declaration whose style names are a SUBSET of the `{root, element,
 * stateDiagram, state, body}` query and whose stereotypes the element
 * carries, and `StyleStorage#computeMergedStyle`
 * (`.../style/StyleStorage.java:102-116`) keeps the higher-PRIORITY value
 * (`.../style/DarkString.java:50-58`), priority being the monotonic load
 * counter -- so every user-authored `state`/`stateDiagram`/`root`/`element`
 * BackGroundColor declaration, loaded after the skin file, beats the skin's
 * `body { transparent }` default and reaches the south cap. That is exactly
 * the tier stack `state-render-colors.ts#resolveStateFillBucketed` already
 * models, read here for "did ANY tier resolve" rather than for a value:
 *   1. `#color`/`#back:color` inline (`Colors#getColor(ColorType.BACK)`),
 *   2. `skinparam stateBackgroundColor<<stereo>>` (jar signature `{state}` +
 *      stereotype -- `.../style/FromSkinparamToStyle.java:204,395-407`),
 *   3. the bare `state`-element bucket (`skinparam stateBackgroundColor`,
 *      `<style> state { BackGroundColor }`, and the `<style> stateDiagram {
 *      BackgroundColor }` cascade alias),
 *   4. the universal `skin <name>`/`<style> root {}`/`<style> element {}`
 *      cascade (`rose.skin:13`'s `root { BackGroundColor #FEFECE }` reaches
 *      the body query because rose.skin declares NO `state.body` bucket at
 *      all, and `TitledDiagram#loadSkin:167` REPLACES the style builder).
 * A tier that resolves to an explicitly transparent color still leaves the
 * cap undrawn, which `isTransparentColor` (`HColorSimple#isTransparent`)
 * decides.
 */
function resolvesSouthCapInk(s: State, theme: Theme): boolean {
  // `RoundedSouth.drawU:68-70` -- a ZERO corner radius draws a `URectangle`,
  // not a `UPath`, so `drawRectangle`'s `-1` inset applies and there is no
  // extra px. `Cluster.java:321` reads the radius off `PName.RoundCorner`
  // and `Cluster.java:323-324` forces it to 0 under `strictUmlStyle()`.
  const rounded = theme.strictUml === true ? 0 : (theme.colors.graph.stateCascadeRoundCorner ?? STATE_DEFAULT_ROUND_CORNER);
  if (rounded === 0) return false;
  const resolved = resolveSouthBackColor(s, theme);
  return resolved !== undefined && !isTransparentColor(resolved);
}

/** {@link resolvesSouthCapInk}'s colour half -- `Cluster.java:459-471`'s own
 *  resolution order, `undefined` when NO tier fires (the skin default, i.e.
 *  `body { BackGroundColor transparent }`). Split out to keep
 *  `resolvesSouthCapInk` under the project's per-function complexity cap. */
function resolveSouthBackColor(s: State, theme: Theme): string | undefined {
  const inline = resolveBareOrBackColor(s.color);
  if (inline !== undefined) return resolveColorToSvgHex(inline);
  const byStereo =
    s.stereotype !== undefined
      ? theme.colors.graph.stateBackgroundColorByStereo?.[s.stereotype.toLowerCase()]
      : undefined;
  const bucket = theme.colors.elements?.['state']?.background;
  const raw = byStereo ?? (typeof bucket === 'string' ? bucket : undefined) ?? theme.colors.graph.rootElementBackground;
  return raw !== undefined ? resolveColorToSvgHex(raw) : undefined;
}

/** Attaches {@link resolvesSouthCapInk}'s verdict to a COMPOSITE GeoSpec
 *  (`'autonom'`/`'cluster'`). A `'state'` spec is a leaf, which upstream
 *  never wraps in a `RoundedContainer` at all
 *  (`~/git/plantuml/.../svek/Cluster.java:354` reaches `drawUState` only for
 *  a group), so it is returned untouched. Only ever ADDS the field, never
 *  sets it `false`, keeping the transparent-south path byte-identical. */
function withSouthCapInk(spec: GeoSpec, southCap: boolean): GeoSpec {
  if (!southCap || spec.kind === 'state') return spec;
  return { ...spec, southCapInk: true };
}

export function resolveMember(s: State, acc: PassAccumulator, ctx: DiagramCtx, parentClusterId: string | undefined): GeoSpec {
  // `hasLocalContent`, not bare children.length -- mission A4 Phase L
  // iter 5, its doc (state-composite-detect.ts) has the full mechanism
  // (GroupMakerState.getImage()'s countChildren()==0 leaf fallback).
  const isComposite = hasLocalContent(s);
  if (!isComposite) {
    acc.nodes.push(buildLeafNode(s, ctx));
    return {
      kind: 'state', id: s.id, stateKind: s.kind, display: s.display,
      ...buildStateGeoTextFields(s, ctx.theme, ctx.measurer, ctx.hideEmptyDescription),
      ...(s.creationIndex !== undefined ? { creationIndex: s.creationIndex } : {}),
    };
  }
  const southCap = resolvesSouthCapInk(s, ctx.theme);
  if (ctx.classify.kindOf.get(s.id) === 'autonom') {
    const spec = ctx.resolvedAutonom.get(s.id);
    if (spec === undefined) {
      // Cannot occur given `firingOrder`'s depth-descending guarantee (see
      // its doc, state-composite-classify.ts) -- every autonom composite
      // `resolveMember` can reach is, by construction, strictly deeper than
      // whichever composite/top-level is CURRENTLY being assembled, hence
      // already resolved earlier in the same `resolveAllAutonomPasses` loop.
      // Thrown (not silently defaulted) so a future firing-order regression
      // fails loudly instead of emitting a bogus zero-size node.
      throw new Error(`autonom composite "${s.id}" resolved out of firing order`);
    }
    acc.nodes.push({ id: spec.id, width: spec.width, height: spec.height, shape: 'rounded' });
    // SI31 T4 (G5): the south-cap ink bit is the only thing this walk knows
    // that the autonom pass (fired earlier, from `resolveAllAutonomPasses`)
    // did not -- attached here, where BOTH the `State` AST node and
    // `ctx.theme` are in scope. See `StateNodeGeo.southCapInk`'s doc comment.
    return withSouthCapInk(spec, southCap);
  }
  return withSouthCapInk(resolveClusterComposite(s, acc, ctx, parentClusterId), southCap);
}

export function runPass(acc: PassAccumulator, ctx: DiagramCtx): DotLayoutResult {
  if (acc.nodes.length === 0) return { nodes: [], edges: [], width: 0, height: 0 };
  const graph: DotInputGraph = {
    nodes: acc.nodes,
    edges: acc.edges,
    rankDir: ctx.rankdir,
    omitSepAttrs: true,
    ...(acc.clusters.length > 0 ? { clusters: acc.clusters } : {}),
    // D3 (plans/linetype-ortho-routing/decisions.md): same expression as
    // the label half (state-composite-edge-label.ts:98) -- omitSepAttrs
    // above is irrelevant here, per D2 the splines/forcelabels pair is
    // emitted OUTSIDE that guard by the shared emitter.
    ...(ctx.theme.linetype !== undefined ? { linetype: ctx.theme.linetype } : {}),
    // mission G4 S8 mechanism 19 -- see state-dot-graph.ts#buildDotGraph's
    // doc comment for the full derivation (mirrors G2 N29).
    manualArrowheads: true,
  };
  return layoutGraph(graph);
}

/** Fully-labeled TransitionGeo for one pass's own edges — in that pass's OWN
 *  (possibly locally-rooted, pre-shift) coordinate space. Exported for reuse
 *  by ./state-composite-geo.ts's top-level assembly (same helper, no need
 *  for a second copy at the geometry layer).
 *
 *  G5 C5 (edge/link document order, a sub-finding of ledger §C3's item 1
 *  "document order" -- same Java read, same fixture): `acc.edgeSources`'
 *  own push order is NOT jar's real edge-draw order once a `'cluster'`-
 *  classified composite's OWN internal transitions get swept into THIS
 *  SAME pass (mechanism 16's own "a cluster shares its container pass's
 *  edges" rule, `state-composite-geo.ts#materializeCluster`'s doc comment)
 *  -- `resolveMember`'s recursive walk resolves a cluster's OWN scope
 *  (pushing ITS internal edges) BEFORE `buildTopLevelPass`'s own explicit
 *  `addLevelEdges('', ast.transitions, ...)` call for the CONTAINING
 *  scope's edges, so a cluster's internal edge lands in `acc.edges` BEFORE
 *  an OUTER edge that was declared (and jar-created) EARLIER. Jar's real
 *  rule (`~/git/plantuml/.../svek/GraphvizImageBuilder.java:229`, `for
 *  (Link link : dotData.getLinks()) { ...; addLine(line); }`, run AFTER
 *  `printGroups`/`printEntities` -- `Bibliotekon.java`'s own `allLines`
 *  `ArrayList` is a pure registration-order list, mirroring `allCluster`/
 *  `allNodes`) draws EVERY edge in ONE pass, in `dotData.getLinks()`'s own
 *  parse-time creation order -- jar-verified `gojuja-90-pune699`: `*start*-
 *  to-A` (`[*] --> A`, declared/created line 3) draws BEFORE `*start*A-to-
 *  Configuring` (`A`'s own internal `[*] --> Configuring`, declared line 6,
 *  inside `A`), even though `A`'s internal edge is resolved FIRST by this
 *  port's own `resolveMember` walk. `sortSpecsByCreationIndex` (this SAME
 *  file's own top-level sibling function) applies unchanged -- edges
 *  without a `creationIndex` sort to the end, preserving their pre-existing
 *  relative order (mirrors that function's own doc comment).
 *
 *  G7 T12: a `reversed` edgeSource (`isReversedDirection` above) had its DOT
 *  `from`/`to` swapped so graphviz ranks the semantic target above the
 *  semantic source; `edgeResult.points`/the resolved endpoint ids are
 *  un-swapped back to semantic source->target order HERE, before building
 *  the `TransitionGeo`, so every downstream consumer (`renderer-arrowhead
 *  .ts`'s `points[0]`=source/`points[length-1]`=target convention,
 *  `attachTransitionLabel`'s perpendicular-offset formula, the renderer's
 *  `<path id>` construction) keeps its existing contract unchanged -- none
 *  of those files are in this task's write-set. Reversing a well-formed
 *  `1+3n` flat cubic-bezier point list end-to-end (`[...points].reverse()`)
 *  yields the mathematically identical curve traversed backward (each
 *  segment's two control points are adjacent in the flat list, so a global
 *  reverse also correctly swaps each segment's own control-point order) --
 *  the rendered curve is visually IDENTICAL to jar's, but not byte-identical
 *  to jar's own literal `<path d>` text: jar keeps the DOT-native point
 *  order and instead swaps WHICH end draws the arrowhead decoration
 *  (`SvekEdge.java:702-709`: `getDecor2()` at the DOT tail,`getDecor1()` at
 *  the DOT head). Verified against `kotagu-43-miza629`'s real jar SVG
 *  (`test-results/dot-cache/state/kotagu-43-miza629/in.svg`): the
 *  `<!--reverse link SubComposite to *start*CompositeState-->` path's `d`
 *  starts near SubComposite (DOT tail) and ends near `[*]` (DOT head), with
 *  the arrowhead polygon at the SubComposite (start) end -- this port's own
 *  un-reversed-back point order instead starts at `[*]` (semantic source)
 *  and ends at SubComposite (semantic target), keeping the EXISTING
 *  points[length-1]-is-target arrowhead convention correct without touching
 *  the renderer. Flagged as a known, deliberate divergence from jar's exact
 *  SVG bytes for a follow-up SVG-focused task once these fixtures become
 *  pin candidates (none of the 57 currently-pinned svg-state goldens use a
 *  `-left-`/`-up-`/bare-reverse-arrow transition, so this divergence is
 *  invisible to every currently-pinned fixture). */
type EdgePoints = DotLayoutResult['edges'][number]['points'];

/** G7 T12 helper (extracted from `buildLevelTransitionGeos` to stay under the
 *  project's per-function CCN cap -- pure data reshaping, no new behavior):
 *  un-swaps a `reversed` edgeSource's routed points + resolved endpoint ids
 *  back to semantic source->target order -- see `buildLevelTransitionGeos`'s
 *  own doc comment for the full jar-verified derivation. */
function resolveTransitionGeometry(
  reversed: boolean | undefined,
  points: EdgePoints,
  resolved: { from: string; to: string } | undefined,
): { points: EdgePoints; from: string | undefined; to: string | undefined } {
  if (reversed !== true) return { points, from: resolved?.from, to: resolved?.to };
  return { points: [...points].reverse(), from: resolved?.to, to: resolved?.from };
}

export function buildLevelTransitionGeos(acc: PassAccumulator, result: DotLayoutResult): TransitionGeo[] {
  const edgePosMap = new Map(result.edges.map((e) => [e.id, e]));
  // mission G4 S7 (discovered while jar-verifying mechanism 10's own fix,
  // `nelupe-49-xova546`): a `'[*]'` transition's RESOLVED scope-local
  // pseudo-anchor id (`__init_<scopeId>`/`__final_<scopeId>`,
  // `levelEndpointId` above) already lives on `acc.edges` (`addLevelEdges`/
  // `sweepOrphanEdges` both resolve before pushing) -- reading `t.from`/
  // `t.to` directly off the ORIGINAL `Transition` instead re-introduces the
  // raw `'[*]'` AST token into `svgEndpointId`'s `<path id>` build
  // (renderer.ts), which only recognizes the FLAT pipeline's own
  // `INITIAL_ID`/`FINAL_ID` constants -- jar-verified
  // `id="*start*s7_2-to-chat1"` (expected) vs `id="[*]-to-chat1"` (this
  // port, pre-fix).
  const edgeEndpoints = new Map(acc.edges.map((e) => [e.id, { from: e.from, to: e.to }]));
  // SI32 T2 (D1'/D2'): this loop IS `DotStringFactory#solve`'s own edge loop
  // (`DotStringFactory.java:458-459`), scoped -- as upstream's is -- to ONE
  // graphviz layout result. The clip below is `SvekEdge#solveLine`'s
  // `dotPath = dotPath.simulateCompound(lhead..., ltail...)` reassignment
  // (`SvekEdge.java:671-672`); see `state-transition-clip.ts`'s own module
  // doc comment for the per-nesting-level derivation and for the two sibling
  // passes (`alignEdgesAtLabelNodes`, `manageCollision`) it brackets there.
  const anchorRects = clusterAnchorRectsOf(acc.clusters, result);
  const geos: TransitionGeo[] = [];
  for (const { t, edgeId, reversed } of acc.edgeSources) {
    const edgeResult = edgePosMap.get(edgeId);
    if (edgeResult === undefined) continue;
    const geo = resolveTransitionGeometry(reversed, edgeResult.points, edgeEndpoints.get(edgeId));
    const from = geo.from ?? t.from;
    const to = geo.to ?? t.to;
    // D1'a: the label is attached from the UNCLIPPED points, and only the
    // points STORED on the geo are clipped. Upstream's label position is
    // `getXY(fullSvg, noteLabelColor)` (`SvekEdge.java:742-746`) -- read out
    // of the graphviz SVG, never derived from `dotPath` -- so a
    // path-independent label is the faithful outcome. This port's
    // `attachInlineTransitionLabel` falls back to
    // `perpendicularOffsetLabel(points)` when no measurer is present
    // (`state-transition-label.ts:386-394`), and that arm is real (the
    // concurrent-region passes build their accumulator without one), so
    // feeding it the clipped path would invent a dependency upstream has not.
    const label = attachTransitionLabel(t, geo.points, edgeResult, acc.labelFont, acc.measurer);
    geos.push({
      from, to, points: clipTransitionSpline(geo.points, from, to, anchorRects),
      ...(label !== undefined ? { label } : {}),
      ...(t.creationIndex !== undefined ? { creationIndex: t.creationIndex } : {}),
      ...(t.crossStart !== undefined ? { crossStart: t.crossStart } : {}),
      ...(t.circleEnd !== undefined ? { circleEnd: t.circleEnd } : {}),
    });
  }
  return sortSpecsByCreationIndex(geos);
}

/** Top-level entry point: resolve the whole diagram's top scope into ONE
 *  final pass (dumped LAST, carrying nodesep/ranksep — mechanisms.md §3). */
export function buildTopLevelPass(
  ast: StateDiagramAST,
  theme: Theme,
  measurer: StringMeasurer,
): { acc: PassAccumulator; result: DotLayoutResult; ctx: DiagramCtx; specs: GeoSpec[] } {
  resetEdgeCounter();
  const rankdir: 'TB' | 'LR' = ast.rankdir === 'left-to-right' ? 'LR' : 'TB';
  const classify = classifyDiagram(ast.states, ast.transitions);
  const pool = collectRegularTransitions(ast);
  const noteParts = buildNoteGraphPartsByScope(ast.notes ?? [], theme, measurer, rankdir);
  const notePool = [...noteParts.values()].flatMap((p) => p.candidates);
  const ctx: DiagramCtx = {
    theme, measurer, rankdir, classify, pool, consumed: new Set(),
    noteParts, notePool, consumedNotes: new Set(), resolvedAutonom: new Map(),
    resolvedRegions: new Map(), hideEmptyDescription: ast.hideEmptyDescription ?? false,
    pseudoCreationIndex: ast.pseudoCreationIndex ?? new Map(),
  };
  resolveAllAutonomPasses(ctx);
  const acc = newAccumulator(resolveArrowLabelFont(theme), measurer);
  const specs = ast.states.map((s) => resolveMember(s, acc, ctx, undefined));
  const pseudoSpecs = addLocalPseudoNodes('', ast.transitions, acc, ctx.pseudoCreationIndex);
  addScopeNotes('', ctx, acc);
  addLevelEdges('', ast.transitions, acc, ctx);
  sweepOrphanEdges(acc, ctx);
  sweepOrphanNoteEdges(acc, ctx.notePool, ctx.consumedNotes, (id) => resolveEndpoint(id, ctx.classify));
  if (acc.nodes.length === 0) {
    return { acc, result: { nodes: [], edges: [], width: 0, height: 0 }, ctx, specs: [] };
  }
  const graph: DotInputGraph = {
    nodes: acc.nodes,
    edges: acc.edges,
    rankDir: rankdir,
    nodeSep: theme.nodeSep ?? 35,
    rankSep: theme.rankSep ?? 60,
    ...(theme.nodeSep !== undefined ? { nodeSepExplicit: true } : {}),
    ...(theme.rankSep !== undefined ? { rankSepExplicit: true } : {}),
    ...(acc.clusters.length > 0 ? { clusters: acc.clusters } : {}),
    // D3 (plans/linetype-ortho-routing/decisions.md): same expression as
    // the label half (state-composite-edge-label.ts:98).
    ...(theme.linetype !== undefined ? { linetype: theme.linetype } : {}),
    // mission G4 S8 mechanism 19 -- see state-dot-graph.ts#buildDotGraph's
    // doc comment for the full derivation (mirrors G2 N29).
    manualArrowheads: true,
  };
  const result = layoutGraph(graph);
  // mission G4 S5: real states/composites FIRST, pseudo start/end LAST --
  // matches jar's own document order (`bajelo-54-dixe684`: `Track_FSM`
  // entity first, `.start.`/`.end.` pseudo entities last) and the FLAT
  // pipeline's own existing convention (`layout.ts#buildFlatStateGeos`
  // pushes `buildPseudoNodeGeos` AFTER the real states). The pre-S5
  // `[...pseudoSpecs, ...specs]` order was backward -- previously masked
  // by the flat-transitions childCount short-circuit (S1), only visible
  // once that mismatch was fixed (S5's own transition-nesting mechanism).
  //
  // G5 C5 (ledger §C3's item 1, "document order"): `sortSpecsByCreationIndex`
  // alone is NOT jar's real top-level rule once a `'cluster'`-classified
  // composite is present -- see `sortSpecsByDocumentOrder`'s own doc comment
  // (state-composite-pseudo.ts) for the full jar-verified derivation
  // (`GraphvizImageBuilder.java#printGroups`/`printEntities`,
  // `SvekResult.java#drawU`'s cluster-loop-before-node-loop). Scoped to THIS
  // top-level `specs` array only -- see that function's own doc comment for
  // why the nested/nested-cluster case is left on the plain
  // `sortSpecsByCreationIndex`.
  //
  // #lizard forgives -- pre-existing (unchanged by G7 T12; this function's
  // own body is byte-identical before/after this task's edit -- confirmed
  // via `git stash`). Sequential top-level assembly steps, not branchy
  // logic; out of T12's write-set scope to restructure.
  return { acc, result, ctx, specs: sortSpecsByDocumentOrder([...specs, ...pseudoSpecs]) };
}
