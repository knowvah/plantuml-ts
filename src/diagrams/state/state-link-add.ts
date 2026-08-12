/**
 * The state engine's link-add chokepoint (SI1/T11) — `emitTransition`,
 * split out of `state-parse-state.ts` under the 500-line file cap. This is
 * the state-side `CucaDiagram.addLink` seam: every parsed transition passes
 * through here exactly once, so the shared `-[single]->` add-time dedup
 * (`net.atmp.CucaDiagram.java:896-901` via `core/cucadiagram/linkDedup.ts`,
 * ADR-3) lives here.
 */
import {
  arrowStyleHasSingle,
  dropsAsSingleDuplicate,
} from '../../core/cucadiagram/linkDedup.js';
import {
  currentScope,
  nextCreationIndex,
  noteScopeId,
  pseudoTickKey,
  type ParseState,
} from './state-parse-state.js';
import type { Transition } from './ast.js';

/** A transition endpoint's connection identity for the `-[single]->` dedup
 *  (`ParseState.linkConnections`'s doc comment): the resolved canonical
 *  state id, except the `[*]` sentinel, which maps to the per-scope-and-
 *  region start/final pseudo key — upstream `getStart()`/`getEnd()` are
 *  distinct per-group `*start*`/`*end*` entities
 *  (`statediagram/command/CommandLinkStateCommon.java#getStateOrGroup`). */
function transitionEndpointKey(ps: ParseState, id: string, which: 'start' | 'end'): string {
  return id === '[*]' ? pseudoTickKey(noteScopeId(ps), which) : id;
}

/** Emit a transition into the current scope -- stamps `t.creationIndex`
 *  (mission G4 S7) at the SINGLE true creation chokepoint, mirroring
 *  upstream `Link`'s own ctor tick (`Link.java:135`), which always fires
 *  AFTER both endpoints are already resolved/auto-created (callers
 *  `ensureState` both endpoints before calling this — see `Transition
 *  .creationIndex`'s own doc comment, ast.ts).
 *
 *  SI1/T11: also the state engine's `CucaDiagram.addLink` seam — the
 *  `-[single]->` add-time dedup (net.atmp.CucaDiagram.java:896-901, via
 *  the shared hook `core/cucadiagram/linkDedup.ts`, ADR-3) runs HERE,
 *  AFTER the creationIndex stamp: upstream's `Link` ctor burns its `lnk`
 *  uid tick (abel/Link.java:135) before `addLink`'s dedup ever runs, so a
 *  dropped-as-duplicate transition still burns its tick and both endpoints
 *  stay auto-created — only the transition record itself is skipped. The
 *  gate is upstream's exactly: the link is `single` (the `single`
 *  ARROW_STYLE token, `WithLinkType.goSingle`/`isSingle`) AND any
 *  already-kept link connects the same two endpoints in either direction
 *  (`Link.sameConnections`). */
export function emitTransition(ps: ParseState, t: Transition): void {
  // T2/B33: a `left`/`up` transition costs TWO ticks upstream, not one.
  // `CommandLinkStateCommon.java:205-206` calls `link.getInv()`, which
  // CONSTRUCTS a second `Link` (`abel/Link.java:145-146`), and every `Link`
  // ctor burns a `cpt1` slot (`:135`). The first is discarded; the second is
  // what renders. Jar-verified against `susena-02-gusa448`, whose link uids
  // are `lnk3, lnk5, lnk8, lnk11, lnk13` -- the gaps at its `-left-` and
  // `-up-` transitions are exactly the discarded ctors (we emitted
  // `lnk3, 5, 7, 9, 11` before this). Unlike class, state keeps RAW
  // creationIndex values with no dense re-packing, so burning the tick here
  // is the whole fix -- no phantom rank is needed.
  if (t.direction === 'left' || t.direction === 'up') nextCreationIndex(ps);
  t.creationIndex = nextCreationIndex(ps);
  const connection: readonly [string, string] = [
    transitionEndpointKey(ps, t.from, 'start'),
    transitionEndpointKey(ps, t.to, 'end'),
  ];
  if (
    dropsAsSingleDuplicate(
      arrowStyleHasSingle(t.arrowStyle),
      ps.linkConnections,
      connection,
      (pair) => pair,
    )
  ) {
    return;
  }
  ps.linkConnections.push(connection);
  currentScope(ps).transitions.push(t);
}
