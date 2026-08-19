/**
 * Scope-local `[*]`-pseudostate anchor id resolution + creation-order
 * sibling sorting — split out of `state-composite-pass.ts` (mission G4 S7,
 * 500-line file-cap compliance; pure move, no behavior change). Re-exported
 * from `state-composite-pass.ts` so every pre-existing importer keeps
 * working unchanged (mirrors `state-parse-state.ts`'s own S7 split of
 * `state-pseudokind.ts`, same rationale).
 *
 * Type-only imports back from `state-composite-pass.ts` (`GeoSpec`/
 * `PassAccumulator`/`DiagramCtx`) are erased at compile time — no runtime
 * circular-import risk, the SAME accepted pattern
 * `state-composite-autonom.ts`/`state-composite-concurrent.ts` already
 * establish for this file pair (S3/S6 decision journal entries).
 */

import type { State, Transition } from './ast.js';
import type { GeoSpec, PassAccumulator, DiagramCtx } from './state-composite-pass.js';
import { CIRCLE_START_SIZE, CIRCLE_END_SIZE } from './state-sizing.js';
import { resolveEndpoint } from './state-composite-classify.js';
import { pseudoTickKey } from './state-parse-state.js';

/** One `[*]`-referencing scope's local start/end anchor ids — scoped per
 *  composite (own id) or '' for the top level (pre-existing per-scope
 *  convention, StateDiagram#getStart/getEnd). */
export function scopedPseudoIds(scopeId: string): { initialId: string; finalId: string } {
  return scopeId === ''
    ? { initialId: '__initial__', finalId: '__final__' }
    : { initialId: `__init_${scopeId}`, finalId: `__final_${scopeId}` };
}

function usesPseudo(transitions: readonly Transition[]): { start: boolean; end: boolean } {
  return {
    start: transitions.some((t) => t.from === '[*]'),
    end: transitions.some((t) => t.to === '[*]'),
  };
}

/**
 * mission G4 S7 (mechanism 10, id-numbering creation-index gap): sorts a
 * `GeoSpec` sibling list into jar's real DOCUMENT order -- true parse-time
 * creation order, NOT the S5-era "real states first, pseudo last" heuristic
 * (`nelupe-49-xova546` jar-verified counter-example: `toutou9`, declared
 * EARLY at tick 3, sorts BEFORE its own owning region's `[*]`-pseudo anchor,
 * tick 11, even though the pseudo anchor's OWN transition textually
 * references `toutou9` -- upstream draws each pass's children in the SAME
 * order its `Entity`/`Quark` tree was built, not grouped by kind). Stable
 * (`Array#sort` is stable since ES2019) -- specs WITHOUT a `creationIndex`
 * (the one still-unthreaded edge case named in the S7 ledger,
 * `state-composite-cluster.ts#buildConcurrentRegionLeaf`'s synthetic
 * region-as-node id) sort to the END, keeping their PRE-EXISTING relative
 * order among themselves. Callers apply this to EACH region's own spec list
 * BEFORE concatenating into a composite's flat `children`/`localStates`
 * (never to the already-concatenated flat array itself) -- reordering
 * within a region cannot cross a region boundary, which would corrupt
 * `state-composite-geo.ts#materializeAutonom`'s own "flat arrays are a
 * concatenation of the per-region ones" identity-sharing contract (mission
 * G4 S6).
 */
export function sortSpecsByCreationIndex<T extends { creationIndex?: number }>(specs: readonly T[]): T[] {
  return [...specs].sort((a, b) => (a.creationIndex ?? Infinity) - (b.creationIndex ?? Infinity));
}

/**
 * G5 C5 (ledger §C3's item 1, "document order"): jar's real TOP-LEVEL
 * document order hoists EVERY `'cluster'`-classified composite AHEAD of
 * every other sibling (autonom composites, leaf states, top-level pseudo
 * start/end) -- regardless of the cluster's own `creationIndex` relative to
 * those siblings. Derived from source, not guessed:
 * `~/git/plantuml/.../svek/GraphvizImageBuilder.java:226-227` --
 * `printGroups(dotData.getRootGroup())` (draws every GROUP, i.e. every
 * composite state, cluster-classified or not) runs UNCONDITIONALLY BEFORE
 * `printEntities(getUnpackagedEntities())` (the top container's own direct
 * LEAF children -- plain states, `.start.`/`.end.` pseudo) -- and
 * `~/git/plantuml/.../svek/SvekResult.java#drawU` walks
 * `clusterManager.getBibliotekon().allCluster()` (every registered
 * `Cluster`, in `Bibliotekon`'s own `ArrayList` REGISTRATION order) in full
 * BEFORE `allNodes()` (a `LinkedHashMap`, same registration-order
 * guarantee) -- an autonom composite is "packed" at draw time (`cluster
 * .getGroup().isPacked()`) and therefore represented as ONE opaque
 * `SvekNode` in `allNodes()`, not a drawn `Cluster`, so it sorts with the
 * OTHER nodes, never hoisted.
 *
 * Corpus-wide re-confirmed (35+ samples, exhaustive over every cached
 * `test-results/dot-cache/state/<fixture>/in.svg` carrying exactly one
 * `class="cluster"` element -- no corpus fixture has more than one, so
 * cluster-vs-cluster relative order is UNVERIFIED): the cluster is FIRST in
 * the top-level document EVERY time, including `decede-10-buvu414` (`E`,
 * `creationIndex` 5, hoists strictly ahead of `A`, `creationIndex` 1 -- the
 * counter-example this mission's own C3-C5 iterations needed to derive this
 * rule from) and `gojuja-90-pune699` (`A`, cluster, ahead of `Configuring`,
 * autonom, ahead of `.start.`, pseudo).
 *
 * Within EACH of the two partitions (cluster-classified vs. everything
 * else), {@link sortSpecsByCreationIndex}'s own stable creation-order rule
 * is UNCHANGED -- this function only moves the BOUNDARY between the two
 * groups, never reorders within either one.
 *
 * Scoped to `state-composite-pass.ts#buildTopLevelPass`'s own top-level
 * `specs` array ONLY -- mirrors this mission's own C3 eligibility gate for
 * the cluster render SHAPE itself (`!ctx.insideAutonomPass`, top-level pass
 * only): no corpus fixture carries a cluster nested inside another
 * cluster's own children (or inside an autonom pass, which C3 already
 * excludes from the real cluster shape entirely), so applying this rule
 * RECURSIVELY to `state-composite-cluster.ts#resolveClusterComposite`'s own
 * `children` list, `state-composite-autonom.ts`'s `localStates`, or
 * `state-composite-concurrent.ts`'s per-region specs remains UNVERIFIED --
 * left on the plain {@link sortSpecsByCreationIndex}, unchanged, until a
 * fixture surfaces jar evidence either way.
 */
export function sortSpecsByDocumentOrder<T extends { creationIndex?: number; kind?: string }>(
  specs: readonly T[],
): T[] {
  const clusters = specs.filter((s) => s.kind === 'cluster');
  const rest = specs.filter((s) => s.kind !== 'cluster');
  return [...sortSpecsByCreationIndex(clusters), ...sortSpecsByCreationIndex(rest)];
}

export function addLocalPseudoNodes(
  scopeId: string,
  transitions: readonly Transition[],
  acc: PassAccumulator,
  pseudoCreationIndex: ReadonlyMap<string, number> = new Map(),
): GeoSpec[] {
  const { start, end } = usesPseudo(transitions);
  if (!start && !end) return [];
  const { initialId, finalId } = scopedPseudoIds(scopeId);
  const specs: GeoSpec[] = [];
  if (start) {
    acc.nodes.push({ id: initialId, width: CIRCLE_START_SIZE, height: CIRCLE_START_SIZE, shape: 'circle' });
    const ci = pseudoCreationIndex.get(pseudoTickKey(scopeId, 'start'));
    specs.push({ kind: 'state', id: initialId, stateKind: 'initial', display: '', ...(ci !== undefined ? { creationIndex: ci } : {}) });
  }
  if (end) {
    acc.nodes.push({ id: finalId, width: CIRCLE_END_SIZE, height: CIRCLE_END_SIZE, shape: 'circle' });
    const ci = pseudoCreationIndex.get(pseudoTickKey(scopeId, 'end'));
    specs.push({ kind: 'state', id: finalId, stateKind: 'final', display: '', ...(ci !== undefined ? { creationIndex: ci } : {}) });
  }
  return specs;
}

export function levelEndpointId(raw: string, isFrom: boolean, scopeId: string, ctx: DiagramCtx): string {
  if (raw === '[*]') {
    const { initialId, finalId } = scopedPseudoIds(scopeId);
    return isFrom ? initialId : finalId;
  }
  return resolveEndpoint(raw, ctx.classify);
}

/** One contiguous run of `PassAccumulator.nodes` contributed by a single
 *  sibling of one composite scope — a member's own `resolveMember` call
 *  (which pushes ONE node for a leaf or a packed autonom composite, but a
 *  whole nested subtree for a `'cluster'`-classified one) or one `[*]`
 *  circle. `creationIndex` is that sibling's parse-time tick, i.e. the key
 *  {@link sortSpecsByCreationIndex} already orders `GeoSpec` siblings by. */
interface NodeRun {
  readonly from: number;
  readonly to: number;
  readonly creationIndex?: number;
}

/** Rewrites the `[min(from), max(to))` window of `acc.nodes` into
 *  creation-index order, moving each run's nodes together. Nodes outside the
 *  window (a caller that had already pushed before these siblings) are left
 *  exactly where they were. */
function reorderAccNodes(acc: PassAccumulator, runs: readonly NodeRun[]): void {
  if (runs.length < 2) return;
  const head = runs.reduce((m, r) => Math.min(m, r.from), Infinity);
  const tail = runs.reduce((m, r) => Math.max(m, r.to), 0);
  const reordered = sortSpecsByCreationIndex(runs).flatMap((r) => acc.nodes.slice(r.from, r.to));
  acc.nodes.splice(head, tail - head, ...reordered);
}

/**
 * SI31 T6 (G20a): pushes one composite scope's member nodes AND its own
 * `[*]` circles onto `acc.nodes` in the jar's real Entity creation order,
 * then returns both spec lists unchanged for the caller's own
 * {@link sortSpecsByCreationIndex} materialization step.
 *
 * **Why the raw push order matters at all.** `state-composite-pass.ts
 * #runPass` feeds `acc.nodes` to `layoutGraph` verbatim, and real graphviz's
 * edge-label force-search reads node/edge declaration order — so a pass that
 * declares `[Idle, Configuring, __init_NotShooting]` where jar declared
 * `[circle, Idle, Configuring]` gets a different label box out of the SAME
 * `dot -Txdot` binary on otherwise byte-identical input (0.750 px on
 * `kejabo-83-vinu490`'s scope-2 width, G20's `causalChain`). The caller's
 * later `sortSpecsByCreationIndex([...pseudoSpecs, ...memberSpecs])` cannot
 * fix that: it reorders the `GeoSpec` list for materialization only, and it
 * runs AFTER `runPass` has already laid out.
 *
 * **Why creation index, not a swap.** Upstream creates a scope's `[*]`
 * entity lazily on FIRST REFERENCE (`~/git/plantuml/src/main/java/net/
 * sourceforge/plantuml/statediagram/StateDiagram.java:92-107` — `getStart`
 * calls `reallyCreateLeaf` only `if (quark.getData() == null)`), and
 * `svek/SvekResult.java#drawU` then walks `Bibliotekon`'s registration-
 * ordered `LinkedHashMap` (this file's own {@link sortSpecsByDocumentOrder}
 * doc comment has that Java read in full). So the circle leads only when the
 * scope's first transition line references `[*]`; a scope opening with
 * `Idle --> Configuring` declares `Idle` first and its `[*]` wherever the
 * later line put it. Hoisting the pseudo unconditionally would be right for
 * `kejabo-83` and wrong for that scope — the tick is the thing that encodes
 * jar order, which is why this reuses {@link sortSpecsByCreationIndex}
 * (same stable rule, same "no tick sorts last" fallback) rather than
 * reordering the two calls.
 *
 * `acc.nodes` therefore comes out in the same order as the caller's own
 * sorted `localSpecs`, pseudo-before-member on a tie, matching that call's
 * `[...pseudoSpecs, ...memberSpecs]` pre-sort input.
 */
export function pushLocalNodesInCreationOrder(
  acc: PassAccumulator,
  states: readonly State[],
  resolveOne: (s: State) => GeoSpec,
  scope: { id: string; transitions: readonly Transition[]; pseudoCreationIndex: ReadonlyMap<string, number> },
): { memberSpecs: GeoSpec[]; pseudoSpecs: GeoSpec[] } {
  const memberRuns: NodeRun[] = [];
  const memberSpecs = states.map((s) => {
    const from = acc.nodes.length;
    const spec = resolveOne(s);
    memberRuns.push({ from, to: acc.nodes.length, ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}) });
    return spec;
  });
  const pseudoAt = acc.nodes.length;
  const pseudoSpecs = addLocalPseudoNodes(scope.id, scope.transitions, acc, scope.pseudoCreationIndex);
  // `addLocalPseudoNodes` pushes exactly ONE node per returned spec, in the
  // same order (see its body directly above) -- so spec `i` owns node
  // `pseudoAt + i`.
  const pseudoRuns = pseudoSpecs.map((p, i) => ({
    from: pseudoAt + i,
    to: pseudoAt + i + 1,
    ...(p.creationIndex !== undefined ? { creationIndex: p.creationIndex } : {}),
  }));
  reorderAccNodes(acc, [...pseudoRuns, ...memberRuns]);
  return { memberSpecs, pseudoSpecs };
}
