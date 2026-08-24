/**
 * Port of `StateDiagram#checkFinalError` (T8, mission dispatch-by-parse-
 * attempt) — upstream's fourth `PSystemCommandFactory` refusal point.
 * `PSystemCommandFactory#finalizeDiagram` calls it once, AFTER both parser
 * passes complete, over the finished entity/link tree
 * (`PSystemCommandFactory.java:150-153`); a non-null result is wrapped into
 * an `EXECUTION_ERROR` with a literal 0 score
 * (`PSystemAbstractFactory.java:67-72`'s `buildExecutionError`).
 *
 * Upstream rejects a `Link` whose two endpoints' nearest enclosing
 * `GroupType.CONCURRENT_STATE` ancestor differ (`isCompatible`,
 * `getGroupParentIfItIsConcurrentState`, StateDiagram.java:232-266): a
 * transition crossing from inside one `--`/`||` region into a DIFFERENT
 * region (of the same or a different composite) cannot be laid out and is
 * refused with "State within concurrent state cannot be linked out of this
 * concurrent state (between X and Y)".
 *
 * This is a DIFFERENT mechanism from the already-ported
 * `checkConcurrentStateOk` guard (`state-parse-helpers.ts`,
 * mission state-declared-size-fix/T5): that one fires DURING parsing, when a
 * transition endpoint or declaration REUSES an entity whose real parent
 * conflicts with the CURRENTLY OPEN scope. This one fires ONCE, at the end,
 * over EVERY link in the finished tree — it also catches a link written
 * OUTSIDE any concurrent scope entirely (e.g. at the diagram's top level)
 * whose two endpoints each individually satisfied `checkConcurrentStateOk`
 * at their own creation/reference time but, combined, still cross two
 * different regions.
 *
 * LIMITATION (conservative, per the mission's stop condition 3 — never
 * refuse a source upstream accepts): a `[*]` pseudostate endpoint is
 * excluded from this check entirely, and so is any endpoint whose id is not
 * diagram-wide unique. Upstream gives every `[*]` reference a REAL,
 * per-scope `Entity` (`StateDiagram#getStart`/`getEnd`), scoped to wherever
 * the transition text itself is parsed, so its nearest-CONCURRENT_STATE
 * ancestor is knowable there. This port's `Transition` (unlike `State`) does
 * not record which region a `[*]` reference belonged to — `Scope.transitions`
 * is one flat array per scope, not partitioned per-region the way
 * `Scope.regions` is for states (`state-parse-state.ts`) — so recovering
 * that scope from the FINISHED tree alone (this check necessarily runs
 * post-parse, mirroring upstream's own finalize-time placement) is not
 * reliable. Skipping these can only under-refuse relative to the jar (a
 * coverage gap for a later batch), never over-refuse.
 */
import type { State, StateDiagramAST, Transition } from './ast.js';
import { concurrentRegionScopeId, rootScope, type ParseState, type Scope } from './state-parse-state.js';

/** Upstream's initial/final pseudostate token; excluded from this check —
 *  see the file header's LIMITATION note. */
const PSEUDO_ENDPOINT = '[*]';

/** Find the `{scope, region}` a REGISTERED state currently lives in — a
 *  local, single-use twin of `state-parse-helpers.ts#findParentGroup` (kept
 *  separate rather than exported/shared, so this whole-diagram check stays a
 *  self-contained, easily-reverted addition rather than reaching into an
 *  established file). */
function findParentGroup(ps: ParseState, state: State): { scope: Scope; region: number } | undefined {
  const scopes: Scope[] = [rootScope(ps), ...ps.scopeByOwner.values()];
  for (const scope of scopes) {
    for (let region = 0; region < scope.regions.length; region++) {
      if (scope.regions[region]!.includes(state)) return { scope, region };
    }
  }
  return undefined;
}

/**
 * Nearest enclosing concurrent-region ancestor's scope id, or `undefined`
 * when `state`'s chain of composite owners never crosses into one — mirrors
 * `getGroupParentIfItIsConcurrentState`'s upward walk
 * (StateDiagram.java:256-266): region 0 (a composite's own, non-concurrent
 * content) is transparent, so the walk continues to THAT composite's own
 * parent group; region N>=1 IS itself the synthetic CONC<N> group and ends
 * the walk immediately.
 */
function nearestConcurrentAncestor(ps: ParseState, state: State): string | undefined {
  let current: State | undefined = state;
  while (current !== undefined) {
    const group = findParentGroup(ps, current);
    if (group === undefined) return undefined;
    if (group.region >= 1) return concurrentRegionScopeId(group.scope.owner?.id ?? '', group.region);
    current = group.scope.owner ?? undefined;
  }
  return undefined;
}

/** Resolve `id` to a State ONLY when it is diagram-wide unique — a
 *  same-named pair in two different scopes cannot be told apart from the id
 *  string alone, and guessing would risk exactly the over-refusal this file
 *  header's LIMITATION note forbids. */
function resolveUniqueState(ps: ParseState, id: string): State | undefined {
  const matches = ps.globalByName.get(id);
  return matches?.length === 1 ? matches[0] : undefined;
}

/** Every transition in the finished tree — top-level plus every composite's
 *  own inner `transitions` (mirrors `getLinks()`, which returns all links
 *  flat regardless of nesting). */
function collectAllTransitions(states: readonly State[]): Transition[] {
  const all: Transition[] = [];
  for (const s of states) {
    all.push(...s.transitions);
    all.push(...collectAllTransitions(s.children));
    for (const region of s.concurrentRegions) all.push(...collectAllTransitions(region));
  }
  return all;
}

/** `isCompatible`, StateDiagram.java:244-254: both absent (neither endpoint
 *  is inside any concurrent region), or the same enclosing region. */
function isCompatible(k1: string | undefined, k2: string | undefined): boolean {
  return k1 === k2;
}

/**
 * Port of `StateDiagram#checkFinalError`. Returns the upstream message
 * verbatim (StateDiagram.java:237-238) for the first incompatible link
 * found, or `undefined` when every checkable link is compatible (see file
 * header for what "checkable" excludes). Must run AFTER both parser passes
 * and `syncAutoScopes` — it needs the finished tree — but reuses the live
 * `ParseState` (`ps.scopeByOwner`/`ps.globalByName`) for ancestor lookups,
 * the same data the already-ported `checkConcurrentStateOk` guard
 * (`state-parse-helpers.ts`) consults.
 */
export function checkFinalError(ps: ParseState, ast: StateDiagramAST): string | undefined {
  const all = [...ast.transitions, ...collectAllTransitions(ast.states)];
  for (const t of all) {
    if (t.from === PSEUDO_ENDPOINT || t.to === PSEUDO_ENDPOINT) continue;
    const fromState = resolveUniqueState(ps, t.from);
    const toState = resolveUniqueState(ps, t.to);
    if (fromState === undefined || toState === undefined) continue;
    const k1 = nearestConcurrentAncestor(ps, fromState);
    const k2 = nearestConcurrentAncestor(ps, toState);
    if (!isCompatible(k1, k2)) {
      return `State within concurrent state cannot be linked out of this concurrent state (between ${t.from} and ${t.to})`;
    }
  }
  return undefined;
}
