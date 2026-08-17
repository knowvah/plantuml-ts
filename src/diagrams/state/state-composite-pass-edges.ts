/**
 * Edge/note accumulation for the composite (non-flat) svek-pass pipeline --
 * split out of ./state-composite-pass.ts (500-line file-cap compliance;
 * pure move, no behavior change) mirroring that file's OWN established
 * split precedent (state-composite-cluster.ts/state-composite-concurrent
 * .ts/state-composite-autonom.ts/state-composite-pseudo.ts were all split
 * out earlier for the identical reason). `PassAccumulator`/`DiagramCtx` are
 * imported from ./state-composite-pass-types.ts (the shared types leaf),
 * NOT from state-composite-pass.ts itself -- that file imports functions
 * FROM this one (`buildTopLevelPass` calls `collectRegularTransitions`/
 * `addLevelEdges`/`sweepOrphanEdges`), so sourcing the types from the same
 * leaf both files already depend on keeps the import graph a one-way DAG
 * (pass-types.ts <- pass-edges.ts <- pass.ts) instead of a cycle.
 * Re-exported from state-composite-pass.ts so every pre-existing importer
 * of `addScopeNotes`/`addLevelEdges`/`sweepOrphanEdges`/`nextClusterId`/
 * `resetEdgeCounter` keeps working unchanged.
 */

import type { State, StateDiagramAST, Transition, TransitionDirection } from './ast.js';
import type { FontSpec } from '../../core/measurer.js';
import type { DotInputCluster } from '../../core/graph-layout.js';
import type { DiagramCtx, PassAccumulator } from './state-composite-pass-types.js';
import { resolveEndpoint } from './state-composite-classify.js';
import { buildEdgeAttrs } from './state-composite-edge-label.js';
import { levelEndpointId } from './state-composite-pseudo.js';

/** T7/D3/D4: the transition/edge-label font, distinct from
 *  `theme.fontSize`/`STATE(14, normal)` (state body/title text), resolved
 *  through the shared resolver -- same call as
 *  `description/renderer-edge.ts#arrowLabelFontConfig`'s own DOT-
 *  measurement site. */
import { resolveArrowLabelFont } from '../../core/arrow-label-font.js';

let edgeCounter = 0;
function nextEdgeId(): string {
  edgeCounter += 1;
  return `edge-${edgeCounter}`;
}

/** `cluster0`, `cluster1`, … — matches the DOT-parity comparator's
 *  `^cluster\d+$` regex (tests/oracle/svek-dot.ts's `parseClusters`), same
 *  numeric-suffix convention as class-dot-graph.ts/description/layout.ts's
 *  cluster id generators (not `s.id`-derived — several composites can share
 *  a display name across nesting scopes). */
let clusterCounter = 0;
/** Exported for `state-composite-cluster.ts`'s `resolveClusterComposite`
 *  (via the state-composite-pass.ts re-export). */
export function nextClusterId(): string {
  const id = `cluster${clusterCounter}`;
  clusterCounter += 1;
  return id;
}

/** Reset the global edge-id/cluster-id counters — call once per top-level
 *  `layoutState` invocation so ids stay deterministic/reproducible across
 *  renders (no Date.now()/Math.random() in this pipeline, per repo
 *  convention). */
export function resetEdgeCounter(): void {
  edgeCounter = 0;
  clusterCounter = 0;
}

/** Push scope `scopeId`'s note DOT nodes into `acc` -- and, for a cluster's
 *  own scope, into `cluster.nodeIds` too (mirrors `addLocalPseudoNodes`'s
 *  pattern for the same reason: a note declared inside a non-autonom
 *  composite's scope is a member of that cluster's subgraph). No-op for a
 *  scope with no notes. */
export function addScopeNotes(
  scopeId: string,
  ctx: DiagramCtx,
  acc: PassAccumulator,
  cluster?: DotInputCluster,
): void {
  const parts = ctx.noteParts.get(scopeId);
  if (parts === undefined) return;
  acc.nodes.push(...parts.nodes);
  if (cluster !== undefined) for (const n of parts.nodes) cluster.nodeIds.push(n.id);
}

/**
 * `CommandLinkStateCommon#executeArg`: `if (dir == Direction.LEFT || dir ==
 * Direction.UP) link = link.getInv();` — a `-left-`/`-up-` transition (or a
 * bare reverse arrow, `A <-- B`, which `getDefaultDirection()` defaults to
 * LEFT) has its `Link`'s cl1/cl2 (DOT tail/head) swapped so graphviz ranks
 * the semantic TARGET above the semantic SOURCE. `-right-`/`-down-` (and
 * every un-hinted `-->`) fall through unchanged — jar-verified on
 * `kotagu-43-miza629`'s `[*] -up-> SubComposite`: cached `svek-1.dot:24`
 * emits `zaent0003->sh0011` (SubComposite's own group anchor -> `[*]`'s
 * anchor), the reverse of the un-hinted `from->to` order `addLevelEdges`/
 * `sweepOrphanEdges` would otherwise emit. `LinkArg#getInv` only swaps
 * `quantifier1/2`/`role1/2` (association-end fields state transitions never
 * carry) — `length`/`minLen` are UNCHANGED by the swap, so `buildEdgeAttrs`
 * (already reading `t.length` directly) needs no change.
 * @see ~/git/plantuml/.../statediagram/command/CommandLinkStateCommon.java#executeArg
 * @see ~/git/plantuml/.../abel/Link.java#getInv
 * @see ~/git/plantuml/.../abel/LinkArg.java#getInv
 */
function isReversedDirection(direction: TransitionDirection | undefined): boolean {
  return direction === 'left' || direction === 'up';
}

export function addLevelEdges(scopeId: string, transitions: readonly Transition[], acc: PassAccumulator, ctx: DiagramCtx): void {
  // T7/D3/D4: shared resolver, not `theme.fontSize` (14, the STATE
  // body/title-text default) -- WIDTH-ONLY in the sense that this swaps
  // ONLY the edge-label measurement call site, not state's body/title text
  // elsewhere (state-sizing.ts etc., unaffected).
  const font: FontSpec = resolveArrowLabelFont(ctx.theme);
  for (const t of transitions) {
    const edgeId = nextEdgeId();
    const from = levelEndpointId(t.from, true, scopeId, ctx);
    const to = levelEndpointId(t.to, false, scopeId, ctx);
    const reversed = isReversedDirection(t.direction);
    acc.edges.push({
      id: edgeId,
      from: reversed ? to : from,
      to: reversed ? from : to,
      attributes: buildEdgeAttrs(t, font, ctx),
    });
    acc.edgeSources.push({ t, edgeId, ...(reversed ? { reversed: true } : {}) });
    ctx.consumed.add(t);
  }
}

/**
 * Every REGULAR (non-`'[*]'`) transition in the diagram, flattened regardless
 * of the scope that syntactically declared it -- upstream link ownership is
 * by ENDPOINT ENTITY CONTAINER, not by declaration site (mission A4 Phase L
 * iter 6, link-hoisting doc: `state A { A --> B }` where `B` lives elsewhere,
 * figiza-55-migo973/zageca-24-zino008; `yesno --> yesyes` written at the
 * diagram's TOP scope while both entities are nested inside a DEEPER autonom
 * composite `yes`, nimana-36-veco708). A concurrent-region-owning composite's
 * OWN `.transitions` are excluded (not its DESCENDANTS' -- mission A4 Phase L
 * iter 18, giniti-22-fexo000) -- those are already fully handled by
 * `buildConcurrentAutonomSpec`'s local `ids.has(...)`-based partitioning
 * (mechanisms.md's ConcurrentStates doc); folding them into this pool would
 * double-handle an already-working, orthogonal mechanism. The walk still
 * DESCENDS into both `s.children` and every concurrent region's own members
 * regardless of this exclusion -- a region-owning composite is opaque only
 * for ITS OWN transition set, not for its subtree: a deeply-nested regular
 * (non-region) descendant several levels under a `CONC`-owning ancestor can
 * still have a self-originating cross-composite transition (`Radio_Configuring
 * --> Vendor_Radio_Enabled`, written inside `state Radio_Configuring { ... }`,
 * itself nested under `state Radio_Root { ... -- state Radio_Commit_Root {} }`)
 * that only resolves once ITS OWN autonom/cluster ancestor chain has a node in
 * some pass -- exactly the same cross-pass retry `addLevelEdges`'s dangling
 * gate (above) depends on this pool for. Stopping the descent entirely at any
 * region-owning ancestor silently drops every such descendant transition with
 * no fallback. `'[*]'` transitions are excluded -- upstream materializes each
 * `[*]` usage as a genuine scope-local pseudostate CHILD of the scope that
 * wrote it, so those stay on the existing per-scope path (`addLocalPseudoNodes`
 * + `addLevelEdges`), which is unaffected by this pool.
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java#buildImage (attempts
 *      EVERY diagram link, `for (Link link : dotData.getLinks())`)
 * @see ~/git/plantuml/.../svek/GroupMakerState.java#getPureInnerLinks (a
 *      group's own pass attempts only its subtree-contained subset)
 */
export function collectRegularTransitions(ast: StateDiagramAST): Transition[] {
  const out: Transition[] = [];
  const isPseudo = (t: Transition): boolean => t.from === '[*]' || t.to === '[*]';
  const walk = (s: State): void => {
    if (s.concurrentRegions.length === 0) {
      for (const t of s.transitions) if (!isPseudo(t)) out.push(t);
    }
    for (const c of s.children) walk(c);
    for (const region of s.concurrentRegions) for (const c of region) walk(c);
  };
  for (const t of ast.transitions) if (!isPseudo(t)) out.push(t);
  for (const s of ast.states) walk(s);
  return out;
}

/**
 * Supplemental attempt, run AFTER a pass's own scope-declared transitions are
 * added via `addLevelEdges` (unchanged, so every fixture with zero orphans
 * gets byte-identical edge insertion order/output) -- tries every remaining
 * diagram-wide REGULAR transition against THIS pass's own node set. Mirrors
 * upstream's "attempt every link at every pass, keep only the one where both
 * SvekNodes exist" model: `GraphvizImageBuilder#buildImage` wraps `new
 * SvekEdge(...)` in a try/catch that silently drops the link on
 * `IllegalStateException` when an endpoint has no `SvekNode` at THIS pass;
 * our equivalent is `graph-layout.ts#addEdges`'s existing dangling-node
 * filter (`if (!nodeIds.has(e.from) || !nodeIds.has(e.to)) continue;` --
 * "the old engine dropped dangling edges in buildWorkingGraph"), reused here
 * rather than re-implemented. A transition's resolved endpoints are only
 * ever valid NODE ids in exactly one pass's accumulator (entity ids are
 * globally unique), so attempting the pool at every pass boundary can never
 * produce a duplicate edge. Direction-hinted (`-left-`/`-up-`) orphans get
 * the SAME tail/head swap as `addLevelEdges` (`isReversedDirection` above) --
 * jar's `link.getInv()` fires at LINK-CREATION time, before the link is ever
 * added to the diagram, so an orphan resolved here is no different from one
 * resolved at its own declaring scope.
 * Exported: `state-composite-autonom.ts#buildPlainAutonomSpec` (mission G4
 * S3, moved out for the file-cap split) reuses this SAME function rather
 * than a re-derived copy.
 * @see ~/git/plantuml/.../svek/GraphvizImageBuilder.java#buildImage
 */
export function sweepOrphanEdges(acc: PassAccumulator, ctx: DiagramCtx): void {
  const nodeIds = new Set(acc.nodes.map((n) => n.id));
  // T7/D3/D4: same shared-resolver width-only fix as `addLevelEdges` above.
  const font: FontSpec = resolveArrowLabelFont(ctx.theme);
  for (const t of ctx.pool) {
    if (ctx.consumed.has(t)) continue;
    const from = resolveEndpoint(t.from, ctx.classify);
    const to = resolveEndpoint(t.to, ctx.classify);
    if (!nodeIds.has(from) || !nodeIds.has(to)) continue;
    const edgeId = nextEdgeId();
    const reversed = isReversedDirection(t.direction);
    acc.edges.push({
      id: edgeId,
      from: reversed ? to : from,
      to: reversed ? from : to,
      attributes: buildEdgeAttrs(t, font, ctx),
    });
    acc.edgeSources.push({ t, edgeId, ...(reversed ? { reversed: true } : {}) });
    ctx.consumed.add(t);
  }
}
