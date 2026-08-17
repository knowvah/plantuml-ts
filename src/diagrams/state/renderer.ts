/**
 * State diagram SVG renderer.
 *
 * Pure function: StateGeometry + Theme → SVG string.
 * No DOM, no async.
 *
 * mission G4 S1: routes through the CucaDiagram-family document shell
 * (T8: `core/assemble-svg.ts`'s state finalize function, mechanism 1) with one outer
 * content `<g>` and per-entity/per-link `<g>` wrapping (`renderer-
 * group.ts`, mechanism 2), inline-`<polygon>` transition arrowheads
 * (`renderer-arrowhead.ts`, mechanism 3), and the real `SvekResult`-style
 * document margin (`layout.ts#applyStateDocumentMargin` /
 * `layout-ink-extent.ts`, mechanism 4) — see `plans/g4-state-svg/
 * ledger.md` S1 for the full jar-verified mechanism writeups. mission G4
 * S2 adds the simple-state box + pseudostate content fidelity (mechanism
 * 5, `renderer-box.ts`/`renderer-pseudostate.ts`); mission G4 S3 adds the
 * composite box's own real 3-4-layer shape (mechanism 6,
 * `renderer-composite-box.ts`), replacing the pre-S3 dashed-rect
 * approximation for autonom composites.
 */

import type { StateGeometry, StateNodeGeo } from './layout.js';
import type { Theme } from '../../core/theme.js';
import type { RenderFragment } from '../../core/dispatcher.js';
import { line } from '../../core/svg.js';
import { resolveColorToSvgHex } from '../../core/klimt/color/HColorSet.js';
import {} from './state-dot-graph.js';

/** `net.sourceforge.plantuml.core.DiagramType#STATE` -- verified against
 *  every cached jar state-diagram fixture's `data-diagram-type` root
 *  attribute (e.g. `test-results/dot-cache/state/jocela-05-niba392/in.svg`).
 *  T8: was `state/renderer-shell.ts`'s own copy of this constant. */
const DIAGRAM_TYPE_STATE = 'STATE';

/** `plantuml.skin`'s `arrow { FontSize 13 }` block -- the transition/edge-
 *  label font this file's own transition-label draw site renders at (G8
 *  T2). Duplicated locally (D1, avoid-import-cycle convention) rather than
 *  imported from `state-dot-graph.ts` -- same value as `description/
 *  renderer-edge.ts`'s own `ARROW_LABEL_FONT_SIZE`. */
import { buildStateUidPlan } from './renderer-uid.js';
import type { StateUidPlan } from './renderer-uid.js';
import { wrapEntity, wrapCluster, wrapStartEntity, wrapEndEntity } from './renderer-group.js';
import {} from './renderer-arrowhead.js';
import { renderInitial, renderFinal, renderForkJoin, renderChoiceJunction, renderHistory } from './renderer-pseudostate.js';
import { renderNormal, renderSdlReceive } from './renderer-box.js';
import { renderBorderPoint } from './renderer-border-point.js';
import {} from './state-render-colors.js';
import { renderComposite } from './renderer-composite-box.js';
import { renderStateNote } from './renderer-note.js';
import { buildStateShadowFilterDef } from './state-shadow.js';
import { renderTransitionWrapped } from './state-renderer-transitions.js';


// ---------------------------------------------------------------------------
// Node shape renderers
// ---------------------------------------------------------------------------

/**
 * `kind:'json'` leaf (mission A4 Phase L iter 20) — a plain labeled box,
 * the closest visual analog available today (`renderer-box.ts#renderNormal`
 * -- reused verbatim; a `kind:'json'` node's `headerLines` is never
 * populated at layout time, so it always takes that function's own
 * unmeasured-fallback path, UNCHANGED behavior pre/post mission G4 S2).
 * Faithful `shape=plaintext` TABLE content (member rows, matching class
 * engine's own json rendering) is deferred to future visual-fidelity work
 * — this renderer has no row-drawing infrastructure at all yet. Mirrors
 * the syncBar case's own documented no-dedicated-renderer-yet gap below.
 */
function renderJson(node: StateNodeGeo, theme: Theme): string {
  return renderNormal(node, theme);
}

/** One node's own shape markup — children NOT recursed (see {@link
 *  renderComposite}'s doc comment, renderer-composite-box.ts). */
function renderShape(node: StateNodeGeo, theme: Theme): string {
  if (node.children.length > 0) {
    return renderComposite(node, theme);
  }
  // G9/T7: a border point is a DIFFERENT image class upstream
  // (`EntityImageStateBorder`, chosen in `GeneralImageBuilder
  // #createEntityImageBlock`), not a state box — its `<<stereotype>>` never
  // changes `StateKind`, so the switch below cannot see it. See
  // `StateNodeGeo.borderPointLabelAbove`, which is set only for these nodes.
  if (node.borderPointLabelAbove !== undefined) return renderBorderPoint(node, theme);

  switch (node.kind) {
    case 'initial':
      return renderInitial(node);
    case 'final':
      return renderFinal(node);
    case 'fork':
    case 'join':
    // syncBar (T2 addition, `=name=` transition endpoints -- see
    // ast.ts's StateKind) has no dedicated renderer yet: reuses the
    // fork/join bar shape, the closest visual analog -- upstream itself
    // renders synchronization bars and fork/join with the same bar shape.
    case 'syncBar':
      return renderForkJoin(node, theme);
    case 'choice':
      return renderChoiceJunction(node, theme);
    case 'history':
    case 'deepHistory':
      return renderHistory(node, theme);
    case 'normal':
      // mission G4 S14: `<<sdlreceive>>` (EntityImageState2) is a
      // DIFFERENT shape from the regular EntityImageState box -- see
      // `renderSdlReceive`'s own doc comment (renderer-box.ts).
      return node.stereotype?.toLowerCase() === 'sdlreceive'
        ? renderSdlReceive(node, theme)
        : renderNormal(node, theme);
    case 'json':
      return renderJson(node, theme);
    case 'note':
      return renderStateNote(node, theme);
    // #lizard forgives -- faithful one-branch-per-StateKind dispatch; each
    // case is a single delegating return, not real decision complexity.
  }
}

/**
 * mission G4 S1 mechanism 2: the `<g class="entity"|"start_entity"|
 * "end_entity">` wrap dispatch, jar-verified against `moleco-69-sida106`
 * (start_entity/entity), `cekolo-21-gini183` (every pseudostate stereotype
 * in one fixture -- choice wraps `entity`; fork/join bars and history/
 * deepHistory pseudostates draw UNWRAPPED, no `<g>` at all).
 *
 * Composite states (`children.length > 0`) always wrap `entity` here -- see
 * `renderer-group.ts`'s own "NOT MODELED" doc-comment note for the
 * jar-verified `entity`-vs-`cluster` (autonom vs non-autonom) split this
 * simplification does not yet capture.
 *
 * mission G4 S5: `node.emptyDescription === true` (the
 * `EntityImageStateEmptyDescription` shape, `renderer-box.ts
 * #renderEmptyDescription`'s own doc comment) draws UNWRAPPED too --
 * jar-verified `gopumi-11-pise779`'s own `S1` (bare `<rect>`+`<text>`
 * siblings, no `<g>` at all, matching fork/join/history/deepHistory's
 * existing unwrapped precedent above).
 */
function wrapClassFor(node: StateNodeGeo): 'entity' | 'start_entity' | 'end_entity' | undefined {
  if (node.children.length > 0) return 'entity';
  if (node.emptyDescription === true) return undefined;
  // mission G4 S14: `<<sdlreceive>>` (EntityImageState2) draws UNWRAPPED --
  // see `renderSdlReceive`'s own doc comment (renderer-box.ts).
  if (node.kind === 'normal' && node.stereotype?.toLowerCase() === 'sdlreceive') return undefined;
  switch (node.kind) {
    case 'initial':
      return 'start_entity';
    case 'final':
      return 'end_entity';
    case 'fork':
    case 'join':
    case 'syncBar':
    case 'history':
    case 'deepHistory':
      return undefined;
    case 'choice':
    case 'normal':
    case 'json':
    case 'note':
      return 'entity';
    // #lizard forgives -- faithful one-branch-per-StateKind dispatch.
  }
}

/** Renders one node (recursing into composite children) with its jar
 *  `<g>` wrap applied — the mechanism-2 replacement for the pre-S1
 *  `renderNode`'s flat, unwrapped recursion. mission G4 S5 (transition-
 *  nesting mechanism): this node's OWN pass edges (`node.transitions`)
 *  render as siblings of `childrenMarkup`, INSIDE this node's own wrap --
 *  matching jar's real document nesting (a pass's own edges are direct
 *  children of that pass's own image, `renderer-group.ts`'s doc comment,
 *  `bajelo-54-dixe684` jar-verified). */
/** `ConcurrentStates.java#Separator.drawSeparator`'s dashed rule between two
 *  stacked regions -- `THICKNESS_BORDER=1.5`, `DASH=8`/gap `10` (a FIXED
 *  jar constant, independent of theme border color/width elsewhere).
 *  jar-verified `nelupe-49-xova546`: `stroke:#181818;stroke-width:1.5;
 *  stroke-dasharray:8,10;`. */
function renderSeparator(sep: { x1: number; y1: number; x2: number; y2: number }, theme: Theme): string {
  return line(sep.x1, sep.y1, sep.x2, sep.y2, {
    stroke: theme.colors.border,
    strokeWidth: 1.5,
    strokeDasharray: '8,10',
  });
}

/** mission G4 S6, mechanism 13: a CONCURRENT-region-owning composite
 *  interleaves each stacked region's own states+transitions with a dashed
 *  `renderSeparator` line BETWEEN each pair -- jar's real document
 *  structure never wraps a region in its own `<g>`
 *  (`ConcurrentStates.java#drawU` draws each `inner`'s content directly,
 *  then the separator, in one flat sequence inside the OWNING composite's
 *  own image). Every other node (`node.concurrentRegions === undefined`)
 *  keeps the pre-S6 "all children, then this node's own transitions"
 *  layout unchanged. */
function renderNodeWrapped(
  node: StateNodeGeo,
  theme: Theme,
  uidPlan: StateUidPlan,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  const ownShape = renderShape(node, theme);
  let inner: string;
  if (node.concurrentRegions !== undefined) {
    const separators = node.separators ?? [];
    const blocks = node.concurrentRegions.map((region, i) => {
      const stateMarkup = region.children
        .map((c) => renderChildNode(c, theme, uidPlan, concurrentGlobalIds))
        .join('');
      const transitionMarkup = region.transitions
        .map((t) => renderTransitionWrapped(t, theme, uidPlan, concurrentGlobalIds))
        .join('');
      const sepMarkup = i < separators.length ? renderSeparator(separators[i]!, theme) : '';
      return stateMarkup + transitionMarkup + sepMarkup;
    });
    inner = ownShape + blocks.join('');
  } else {
    const childrenMarkup = node.children
      .map((c) => renderChildNode(c, theme, uidPlan, concurrentGlobalIds))
      .join('');
    const ownTransitionsMarkup = node.transitions
      .map((t) => renderTransitionWrapped(t, theme, uidPlan, concurrentGlobalIds))
      .join('');
    inner = ownShape + childrenMarkup + ownTransitionsMarkup;
  }
  const wrapClass = wrapClassFor(node);
  if (wrapClass === undefined) return inner;
  const uid = uidPlan.nodeUid.get(node.id) ?? '';
  if (wrapClass === 'start_entity') return wrapStartEntity(node.id, uid, inner);
  if (wrapClass === 'end_entity') return wrapEndEntity(node.id, uid, inner);
  return wrapEntity(node.id, uid, inner);
}

/**
 * G5 C3, mechanism 16 shape half: jar's real document structure for a
 * `'cluster'`-classified composite's children does NOT nest them inside the
 * composite's own `<g>` wrap (unlike every OTHER composite kind, which
 * nests via `renderNodeWrapped`'s own `childrenMarkup` above) -- they render
 * as FLAT SIBLINGS at the SAME level, immediately after it. jar-verified
 * `decede-10-buvu414`: `<g class="cluster" id="ent0005">`(E's own shape
 * only)`</g><g class="entity" data-qualified-name="E.F">`(F, a SIBLING, NOT
 * nested)`</g>` — the DOT-native cluster/subgraph model has no coordinate-
 * space CONTAINMENT the way `InnerStateAutonom`'s own wrapper does; the
 * cluster's rendered rect/paths (`renderClusterMeasured`, renderer-
 * composite-box.ts) are purely a background decoration UNDER already-
 * absolutely-positioned siblings.
 *
 * Dispatches a node's own child list uniformly (used by both `renderState`'s
 * top-level loop and `renderNodeWrapped`'s own recursion) — a cluster child
 * flattens via `renderClusterSiblingMarkup` (which recurses the SAME way for
 * a nested cluster reachable through its OWN children); every other kind
 * still nests via the normal `renderNodeWrapped`, unaffected.
 */
function renderChildNode(
  node: StateNodeGeo,
  theme: Theme,
  uidPlan: StateUidPlan,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  return node.clusterHeaderHeight !== undefined
    ? renderClusterSiblingMarkup(node, theme, uidPlan, concurrentGlobalIds)
    : renderNodeWrapped(node, theme, uidPlan, concurrentGlobalIds);
}

function renderClusterSiblingMarkup(
  node: StateNodeGeo,
  theme: Theme,
  uidPlan: StateUidPlan,
  concurrentGlobalIds: ReadonlyMap<string, number>,
): string {
  const ownShape = renderShape(node, theme);
  const uid = uidPlan.nodeUid.get(node.id) ?? '';
  const ownWrap = wrapCluster(node.id, uid, ownShape);
  const childrenMarkup = node.children
    .map((c) => renderChildNode(c, theme, uidPlan, concurrentGlobalIds))
    .join('');
  const ownTransitionsMarkup = node.transitions
    .map((t) => renderTransitionWrapped(t, theme, uidPlan, concurrentGlobalIds))
    .join('');
  return ownWrap + childrenMarkup + ownTransitionsMarkup;
}

// ---------------------------------------------------------------------------
// Transition renderer
// ---------------------------------------------------------------------------

/**
 * Render a state diagram geometry into an SVG string.
 */
export function renderState(geo: StateGeometry, theme: Theme): RenderFragment {
  const uidPlan = buildStateUidPlan(geo);
  const concurrentGlobalIds = geo.concurrentGlobalIds ?? new Map<string, number>();

  const children: string[] = [];
  for (const node of geo.states) {
    children.push(renderChildNode(node, theme, uidPlan, concurrentGlobalIds));
  }
  geo.transitions.forEach((transition) => {
    children.push(renderTransitionWrapped(transition, theme, uidPlan, concurrentGlobalIds));
  });

  // mission G4 S1 mechanism 1: background is communicated via the shell's
  // own root `style="...background:...;"` attribute (T8: `core/assemble-
  // svg.ts` / `core/klimt/document-shell.ts#assembleDocumentShell`) -- jar draws
  // NO explicit full-canvas `<rect>` for it (verified: every sampled state
  // fixture's `<defs/>` is immediately followed by the content `<g>`, no
  // background rect). The pre-S1 renderer's own manual background `<rect>`
  // is removed accordingly.
  //
  // mission skin-file-loading Batch 2: ONE shared shadow filter def per
  // diagram (`state-shadow.ts`'s own doc comment for why a single
  // diagram-wide gate on `theme.shadowing` is equivalent to jar's own
  // per-shape `manageShadow`/`withShadow` once-per-document dedup -- state
  // resolves ONE shadowing value for the whole diagram via the theme
  // cascade, mission skin-file-loading Batch 1). `undefined` (svgRoot's own
  // default empty extraDefs) for every pre-Batch-2/shadow-off fixture.
  const extraDefs = theme.shadowing !== undefined && theme.shadowing > 0 ? buildStateShadowFilterDef() : undefined;
  return {
    body: children.join(''),
    width: geo.totalWidth,
    height: geo.totalHeight,
    background: resolveColorToSvgHex(theme.colors.background),
    diagramType: DIAGRAM_TYPE_STATE,
    ...(extraDefs !== undefined ? { extraDefs } : {}),
  };
}
