/**
 * state-composite-transition-geo.ts — one pass's `TransitionGeo`s, built from
 * its `DotLayoutResult`: the un-swap of `reversed` edges, the unclipped label
 * placement, and `DotStringFactory#solve`'s edge loop (the compound clip, in
 * `allLines()` order — `state-transition-clip.ts#clipLinesInSolveOrder`).
 * Split out of `state-composite-pass.ts` (500-line file cap, lgm T1b); that
 * module re-exports {@link buildLevelTransitionGeos}, so no importer changed.
 */

import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { Transition } from './ast.js';
import type { PassAccumulator } from './state-composite-pass-types.js';
import type { TransitionGeo } from './state-geo-types.js';
import { sortSpecsByCreationIndex } from './state-composite-pseudo.js';
import { attachTransitionLabel } from './state-transition-label.js';
import { clipLinesInSolveOrder } from './state-transition-clip.js';

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

/** One routed transition of a pass, endpoints already un-swapped to
 *  semantic order — what `buildLevelTransitionGeos` clips and then turns into
 *  a `TransitionGeo`. */
interface PreparedTransition {
  t: Transition;
  edgeId: string;
  edgeResult: DotLayoutResult['edges'][number];
  points: EdgePoints;
  from: string;
  to: string;
}

const creationOf = (t: Transition): { creationIndex?: number } =>
  t.creationIndex !== undefined ? { creationIndex: t.creationIndex } : {};

function buildTransitionGeo(acc: PassAccumulator, p: PreparedTransition, clippedPoints: EdgePoints): TransitionGeo {
  const { t, edgeResult, from, to } = p;
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
  const label = attachTransitionLabel(t, p.points, edgeResult, acc.labelFont, acc.measurer);
  return {
    from,
    to,
    points: clippedPoints,
    ...(label !== undefined ? { label } : {}),
    ...(t.creationIndex !== undefined ? { creationIndex: t.creationIndex } : {}),
    ...(t.crossStart !== undefined ? { crossStart: t.crossStart } : {}),
    ...(t.circleEnd !== undefined ? { circleEnd: t.circleEnd } : {}),
  };
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
  // SI32 T2 (D1'/D2'): `clipLinesInSolveOrder` IS `DotStringFactory#solve`'s
  // own edge loop (`DotStringFactory.java:465-466`), scoped -- as upstream's
  // is -- to ONE graphviz layout result, and run in `allLines()` order (lgm
  // T1b: each line's `projectionCluster.manageEntryExitPoint` mutates the
  // cluster rectangle the next line clips against, `SvekEdge.java:660-672`).
  // The clip is `SvekEdge#solveLine`'s `simulateCompound` reassignment; see
  // `state-transition-clip.ts` for the per-nesting-level derivation and the
  // two sibling passes (`alignEdgesAtLabelNodes`, `manageCollision`).
  const prepared: PreparedTransition[] = [];
  for (const { t, edgeId, reversed } of acc.edgeSources) {
    const edgeResult = edgePosMap.get(edgeId);
    if (edgeResult === undefined) continue;
    const geo = resolveTransitionGeometry(reversed, edgeResult.points, edgeEndpoints.get(edgeId));
    prepared.push({ t, edgeId, edgeResult, points: geo.points, from: geo.from ?? t.from, to: geo.to ?? t.to });
  }
  const lines = prepared.map((p) => ({ key: p.edgeId, from: p.from, to: p.to, points: p.points, ...creationOf(p.t) }));
  const clipped = clipLinesInSolveOrder(acc, result, lines);
  const geos = prepared.map((p) => buildTransitionGeo(acc, p, clipped.get(p.edgeId)!));
  return sortSpecsByCreationIndex(geos);
}
