/**
 * GeoSpec → StateGeometry materialization (mission A4/T4). Walks the
 * `GeoSpec` tree built by ./state-composite-pass.ts and, using the real
 * positions from each pass's own `DotLayoutResult`, produces the renderer's
 * `StateNodeGeo`/`TransitionGeo` tree:
 *   - `'state'` leaves read their position directly off the (shared) pass's
 *     posMap.
 *   - `'cluster'` composites share the SAME pass's posMap as their members
 *     (non-autonom composites are not a pass boundary) — the composite's own
 *     box is the bounding box of its (already-absolute) children.
 *   - `'autonom'` composites read their OWN flattened-node position off the
 *     CONTAINING pass's posMap, then shift their wrapped child pass's own
 *     (locally-rooted) geometry into that absolute frame by
 *     `InnerStateAutonom`'s title/body offset (state-composite-sizing.ts).
 */

import type { DotLayoutResult } from '../../core/graph-layout.js';
import type { GeoSpec } from './state-composite-pass.js';
import { buildTopLevelPass, buildLevelTransitionGeos } from './state-composite-pass.js';
import type { StateNodeGeo, StateGeometry, StateRegionGeo } from './state-geo-types.js';
import type { StateDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { fromRect, type Box } from './state-composite-frontier.js';
import { drawnClusterRects } from './state-composite-drawn-rects.js';
import { shiftGeo, shiftTransition, boundingBox } from './state-composite-geo-shift.js';

/** Exported (mission G4 S4): `state-composite-autonom.ts#buildPlainAutonomSpec`
 *  reuses this SAME node-position lookup shape to build a LOCAL (pre-outer-
 *  shift) posMap for its own child pass's ink-extent computation — see that
 *  module's own doc comment. */
export type PosMap = Map<string, DotLayoutResult['nodes'][number]>;

/** G5 C3, mechanism 16 shape half: a pass's own `DotLayoutResult.clusters`
 *  entries, keyed by `DotInputCluster.id` (`GeoSpec`'s `clusterId`, NOT `id`
 *  -- see that field's own doc comment, state-composite-pass.ts). Empty map
 *  when the pass's `DotLayoutResult` carried no `clusters` field (mirrors
 *  `PosMap`'s own optionality story) -- `materializeCluster` below falls
 *  back to the pre-C3 `boundingBox(children)` approximation whenever a
 *  lookup misses, so an empty map is a safe, correct default. */
export type ClusterPosMap = ReadonlyMap<string, NonNullable<DotLayoutResult['clusters']>[number]>;

const EMPTY_CLUSTER_POS_MAP: ClusterPosMap = new Map();

/** Exported (SI29 F7): the ink-extent seams in
 *  `state-composite-autonom.ts#buildPlainAutonomSpec` and
 *  `state-composite-concurrent.ts#regionInkGeometry` build their own
 *  `ClusterPosMap` from their own pass's `DotLayoutResult` the SAME way
 *  `layoutComposite` below does for the top-level pass — see
 *  {@link materializeSpecs}'s own doc comment for why they must. */
export function clusterPosMapOf(result: DotLayoutResult): ClusterPosMap {
  return result.clusters !== undefined ? new Map(result.clusters.map((c) => [c.id, c])) : EMPTY_CLUSTER_POS_MAP;
}

/** mission G4 S3 (mechanism 6): threads `spec.headerLines`/`bodyLines`/
 *  `color` onto the materialized `StateNodeGeo` — `undefined` for a
 *  concurrent-region LEAF spec (`state-composite-cluster.ts
 *  #buildConcurrentRegionLeaf`, which never sets these fields, see
 *  `GeoSpec`'s own `'autonom'` variant doc comment in state-composite-
 *  pass.ts) so `renderer-composite-box.ts#renderComposite` falls back to
 *  the pre-mechanism-6 shape for that case, unchanged.
 *
 *  mission G4 S5 (transition-nesting mechanism): `spec.localTransitions`
 *  (THIS pass's own edges, pre-shift) attach directly onto the returned
 *  node's own `StateNodeGeo.transitions` field, shifted into the SAME
 *  absolute frame as `children` — no longer bubbled up through an
 *  `outTransitions` accumulator param (the pre-S5 flat-sibling
 *  simplification). A NESTED autonom composite reachable via
 *  `spec.localStates` attaches ITS OWN `localTransitions` onto ITS OWN
 *  node during the SAME recursive `materializeSpecs` call below — nothing
 *  bubbles past its own pass boundary, matching jar's real per-pass
 *  nesting (`renderer-group.ts`'s own doc comment, `bajelo-54-dixe684`
 *  jar-verified). */
function materializeAutonom(
  spec: Extract<GeoSpec, { kind: 'autonom' }>,
  posMap: PosMap,
  shadowing = 0,
): StateNodeGeo | undefined {
  const pos = posMap.get(spec.id);
  if (pos === undefined) return undefined;
  const dx = pos.x + spec.offset.x;
  const dy = pos.y + spec.offset.y;
  const localPosMap: PosMap = new Map(spec.localPositions.nodes.map((n) => [n.id, n]));
  // G5 C3, mechanism 16 shape half: a NESTED 'cluster' composite reachable
  // via `spec.localStates`/`spec.regions` lives in THIS autonom pass's OWN
  // `DotLayoutResult` (`spec.localPositions`, not the containing pass's) --
  // `bajelo-54-dixe684`'s own jar-verified precedent (per-pass nesting,
  // `renderer-group.ts`'s doc comment) applies to cluster geometry the SAME
  // way it already applies to node positions above.
  const localClusterPosMap = clusterPosMapOf(spec.localPositions);
  // mission G4 S6, mechanism 13: `spec.regions` (concurrent-region-owning
  // composites ONLY) drives `children`/`transitions` too -- built by
  // CONCATENATING the per-region materialized results, never the reverse,
  // so `concurrentRegions[i].children`/`.transitions` and the flat
  // `children`/`transitions` share the SAME object instances
  // (`renderer-uid.ts`'s `edgeUid` Map is keyed by `TransitionGeo` object
  // identity -- see `StateNodeGeo.concurrentRegions`'s own doc comment,
  // state-geo-types.ts). `undefined` for every plain (non-concurrent)
  // autonom composite, which keeps the pre-S6 flat-materialization path
  // unchanged.
  const regionsOut: StateRegionGeo[] | undefined = spec.regions?.map((r) => ({
    children: materializeSpecs(r.specs, localPosMap, localClusterPosMap, shadowing).map((g) => shiftGeo(g, dx, dy)),
    transitions: r.transitions.map((t) => shiftTransition(t, dx, dy)),
  }));
  const children =
    regionsOut !== undefined
      ? regionsOut.flatMap((r) => r.children)
      : materializeSpecs(spec.localStates, localPosMap, localClusterPosMap, shadowing).map((g) => shiftGeo(g, dx, dy));
  const transitions =
    regionsOut !== undefined
      ? regionsOut.flatMap((r) => r.transitions)
      : spec.localTransitions.map((t) => shiftTransition(t, dx, dy));
  const separators = spec.separators?.map((sep) => ({
    x1: sep.x1 + dx,
    y1: sep.y1 + dy,
    x2: sep.x2 + dx,
    y2: sep.y2 + dy,
  }));
  return {
    id: spec.id,
    kind: 'normal',
    display: spec.display,
    x: pos.x,
    y: pos.y,
    width: pos.width,
    height: pos.height,
    children,
    transitions,
    ...(regionsOut !== undefined ? { concurrentRegions: regionsOut } : {}),
    ...(separators !== undefined ? { separators } : {}),
    ...(spec.headerLines !== undefined ? { headerLines: spec.headerLines } : {}),
    ...(spec.bodyLines !== undefined ? { bodyLines: spec.bodyLines } : {}),
    ...(spec.color !== undefined ? { color: spec.color } : {}),
    ...(spec.stereotype !== undefined ? { stereotype: spec.stereotype } : {}),
    ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}),
    // mission skin-file-loading Batch 2: only the InnerStateAutonom/
    // RoundedContainer shape (spec.headerLines set -- renderCompositeMeasured,
    // NOT the pre-mechanism-6 dashed-rect fallback) draws jar's shadow --
    // see StateNodeGeo.shadowing's own doc comment.
    ...(shadowing > 0 && spec.headerLines !== undefined ? { shadowing } : {}),
  };
}

/** mission G4 S5: a non-autonom `cluster` never owns any transitions of its
 *  own — it shares its container pass's edges (`state-composite-geo.ts`'s
 *  own module doc comment, `'cluster'` branch), so `transitions` is always
 *  `[]` here (any NESTED autonom within `spec.children` still attaches its
 *  own edges to ITS OWN node via the SAME recursive `materializeSpecs`
 *  call, unaffected by this node owning none).
 *
 *  G5 C3, mechanism 16 shape half: when `spec.clusterId` resolves to a real
 *  bbox in `clusterPosMap` (this iteration's eligibility gate held --
 *  `resolveClusterComposite`'s own doc comment, state-composite-cluster.ts)
 *  the composite's box is graphviz's OWN real cluster geometry (replacing
 *  the pre-C3 `boundingBox(children)` flat-12px-pad approximation) and
 *  `headerLines`/`clusterHeaderHeight` are threaded onto the node so
 *  `renderer-composite-box.ts#renderComposite` draws the real jar-native
 *  cluster shape instead of the dashed-rect fallback. Falls back to the
 *  pre-C3 shape, unchanged, whenever the lookup misses (ineligible this
 *  iteration, or a hand-built test geometry). */
/**
 * G7 T14b / lgm-T1d (`Cluster#manageEntryExitPoint`, `Cluster.java:410-436`):
 * a border-point (`hasBorderPointChildren`) composite is NOT drawn at
 * graphviz's raw cluster polygon. `manageEntryExitPoint` reassigns the one
 * shared `rectangleArea` on every call (`:430`) -- once per projecting line in
 * the solve loop, then once per `drawU` -- so the DRAWN box is the rectangle
 * after L + 2 calls and the INK pass sees the one after L + 1
 * (`state-composite-drawn-rects.ts`, which replays that sequence).
 *
 * The ink pass's box is returned as an OVERFLOW over the drawn one so it
 * survives the shift passes (`shiftGeo`, `layout.ts#shiftStateNode`)
 * untouched -- see `StateNodeGeo.inkOverflow`. Jar-verified on
 * `temuxi-28-cega322`: a parent's first draw pass reads its children's
 * not-yet-corrected rectangles, so its ink box can reach above anything drawn
 * (jar's ink minimum lands at `rawTop - 1`).
 *
 * G9/T7: `EntityImageStateBorder#upPosition` (`:70-77`) -- a border point draws
 * its name label ABOVE its symbol when the symbol's TOP edge is above the
 * vertical centre of the parent cluster's FINAL rectangle. Upstream reads
 * `parent.getRectangleArea()` at draw time; that rectangle is the drawn box,
 * which only exists here, so the answer is recorded on each border-point
 * child now (see `StateNodeGeo.borderPointLabelAbove`).
 */
function borderPointBox(
  spec: Extract<GeoSpec, { kind: 'cluster' }>,
  children: readonly StateNodeGeo[],
  posMap: PosMap,
  clusterPosMap: ClusterPosMap,
): { box: Box; inkOverflow: StateNodeGeo['inkOverflow'] } | undefined {
  const rects = drawnClusterRects(spec.solveAcc!, posMap, clusterPosMap).get(spec.clusterId!);
  if (rects === undefined) return undefined;
  const box = fromRect(rects.drawn);
  const ink = fromRect(rects.ink);
  const centerY = box.y + box.height / 2;
  const borderSet = new Set(spec.borderPointMemberIds);
  for (const c of children) if (borderSet.has(c.id)) c.borderPointLabelAbove = c.y < centerY;
  const overflow = {
    top: Math.max(0, box.y - ink.y),
    left: Math.max(0, box.x - ink.x),
    bottom: Math.max(0, ink.y + ink.height - (box.y + box.height)),
    right: Math.max(0, ink.x + ink.width - (box.x + box.width)),
  };
  const empty = overflow.top === 0 && overflow.left === 0 && overflow.bottom === 0 && overflow.right === 0;
  return { box, inkOverflow: empty ? undefined : overflow };
}

function materializeCluster(
  spec: Extract<GeoSpec, { kind: 'cluster' }>,
  posMap: PosMap,
  clusterPosMap: ClusterPosMap,
  shadowing = 0,
): StateNodeGeo | undefined {
  // mission skin-file-loading Batch 2: `shadowing` threads DOWN into this
  // cluster's own children (a leaf/autonom nested inside a 'cluster'
  // composite still draws its OWN shadow) but is never set on THIS node's
  // own return below -- jar-verified `ClusterDotString.java`/`ClusterHeader
  // .java` (the shape this composite kind draws) carry no shadow at all,
  // see StateNodeGeo.shadowing's own doc comment.
  const children = materializeSpecs(spec.children, posMap, clusterPosMap, shadowing);
  if (children.length === 0) return undefined;
  const real = spec.clusterId !== undefined ? clusterPosMap.get(spec.clusterId) : undefined;
  if (real !== undefined && spec.clusterHeaderHeight !== undefined && spec.titleWidth !== undefined) {
    // G7 T14b: `borderPointMemberIds` is set ONLY for `hasBorderPointChildren`
    // composites (`state-composite-cluster.ts#resolveClusterComposite`) --
    // every other cluster (the pre-T14b path) keeps using `real` directly,
    // byte-identical to before this task.
    const hasBorderPoints = spec.borderPointMemberIds !== undefined && spec.borderPointMemberIds.length > 0;
    const corrected = hasBorderPoints ? borderPointBox(spec, children, posMap, clusterPosMap) : undefined;
    const box = corrected?.box ?? real;
    const inkOverflow = corrected?.inkOverflow;
    return {
      id: spec.id,
      kind: 'normal',
      display: spec.display,
      x: box.x,
      y: box.y,
      width: box.width,
      height: box.height,
      ...(inkOverflow !== undefined ? { inkOverflow } : {}),
      children,
      transitions: [],
      headerLines: [{ text: spec.display, width: spec.titleWidth }],
      clusterHeaderHeight: spec.clusterHeaderHeight,
      ...(spec.titleBaselineMargin !== undefined ? { clusterTitleBaselineMargin: spec.titleBaselineMargin } : {}),
      ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}),
    };
  }
  const box = boundingBox(children);
  return {
    id: spec.id,
    kind: 'normal',
    display: spec.display,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    children,
    transitions: [],
    ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}),
  };
}

/** Exported (mission G4 S4): `state-composite-autonom.ts#buildPlainAutonomSpec`
 *  reuses this SAME dispatch to materialize its own child pass's content
 *  into `StateNodeGeo`/`TransitionGeo` — needed so the mechanism-7 ink-
 *  extent computation (`layout-ink-extent.ts#computeSvekResultGeometry`)
 *  sees the EXACT same shapes (including nested autonom/cluster composites)
 *  the top-level assembly below would eventually produce, rather than a
 *  parallel, possibly-drifting re-derivation. mission G4 S5: no longer
 *  takes an `outTransitions` accumulator — every pass's own edges now
 *  attach directly to that pass's own returned `StateNodeGeo.transitions`
 *  (see `materializeAutonom`'s own doc comment); `computeSvekResultGeometry`'s
 *  ink walk (`layout-ink-extent.ts#addNodeInk`) recurses into this SAME
 *  `.transitions` field, so ink coverage is unchanged.
 *
 *  `clusterPosMap` defaults to empty only for a caller whose pass genuinely
 *  laid out no clusters; every real call site now passes its OWN pass's
 *  {@link clusterPosMapOf}. SI29 F7 (SI28 G4, 9 fixtures, up to 300 px)
 *  closed the two that used to pass `undefined` -- `state-composite-
 *  autonom.ts#buildPlainAutonomSpec` and `state-composite-concurrent.ts
 *  #regionInkGeometry`, both ink-extent seams. Upstream draws a nested
 *  cluster's `rectangleArea` -- graphviz's box widened by
 *  `FrontierCalculator` + `ensureMinWidth(getTitleAndAttributeWidth() + 10)`
 *  (`Cluster.java:408-436`, `ClusterHeader.java:81-95`) -- for EVERY
 *  cluster in `SvekResult#drawU` (`SvekResult.java:71-74`), with no
 *  "nested inside an autonom pass" special case, so `SvekResult
 *  #calculateDimension`'s `getMinMax` walk (`SvekResult.java:129-135`)
 *  folds that title/frontier ink at every seam that reads it
 *  (`InnerStateAutonom.java:186-197`, `ConcurrentStates.java:133-141`).
 *  With `undefined` the lookup missed, `materializeCluster` fell back to
 *  `boundingBox(children)`, and precisely that ink was dropped. */
export function materializeSpecs(
  specs: readonly GeoSpec[],
  posMap: PosMap,
  clusterPosMap: ClusterPosMap = EMPTY_CLUSTER_POS_MAP,
  // mission skin-file-loading Batch 2: the diagram's own resolved
  // `theme.shadowing` (`0` for every pre-Batch-2 caller/fixture) -- threaded
  // through every recursive call below so a nested leaf/autonom sees the
  // SAME value its ancestor did, matching jar's single diagram-wide style
  // cascade (StateNodeGeo.shadowing's own doc comment has the full
  // per-node-kind eligibility rule).
  shadowing = 0,
): StateNodeGeo[] {
  const out: StateNodeGeo[] = [];
  for (const spec of specs) {
    if (spec.kind === 'state') {
      const pos = posMap.get(spec.id);
      if (pos === undefined) continue;
      out.push({
        id: spec.id,
        kind: spec.stateKind,
        display: spec.display,
        x: pos.x,
        y: pos.y,
        width: pos.width,
        height: pos.height,
        children: [],
        transitions: [],
        ...(spec.headerLines !== undefined ? { headerLines: spec.headerLines } : {}),
        ...(spec.bodyLines !== undefined ? { bodyLines: spec.bodyLines } : {}),
        ...(spec.color !== undefined ? { color: spec.color } : {}),
        ...(spec.stereotype !== undefined ? { stereotype: spec.stereotype } : {}),
        // G9/T7: a border point's label height, for the ink band its label
        // occupies outside the symbol (`StateNodeGeo.borderPointLabelHeight`).
        ...(spec.borderPointLabelHeight !== undefined ? { borderPointLabelHeight: spec.borderPointLabelHeight } : {}),
        ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}),
        // mission skin-file-loading Batch 2: only `EntityImageState`'s own
        // `'normal'`/`'json'` leaf shape draws jar's shadow -- see
        // StateNodeGeo.shadowing's own doc comment (pseudostates excluded,
        // named scope limit). `<<sdlreceive>>` is ALSO excluded despite
        // `stateKind==='normal'`: `renderer-box.ts#renderSdlReceive`
        // dispatches to a genuinely different upstream shape
        // (`EntityImageState2`/`USymbolFrame`, not `EntityImageState`) that
        // this mission's own Jar refs do not cover -- gating here keeps the
        // ink reservation (this value) consistent with what the render path
        // actually draws.
        ...(shadowing > 0 &&
        (spec.stateKind === 'normal' || spec.stateKind === 'json') &&
        spec.stereotype?.toLowerCase() !== 'sdlreceive'
          ? { shadowing }
          : {}),
      });
    } else {
      const g =
        spec.kind === 'autonom'
          ? materializeAutonom(spec, posMap, shadowing)
          : materializeCluster(spec, posMap, clusterPosMap, shadowing);
      // SI31 T4 (G5): the south-cap ink bit rides the spec through BOTH
      // composite shapes, so it is folded once here rather than in each
      // shape's own return -- see `StateNodeGeo.southCapInk` (state-geo-types).
      if (g !== undefined) out.push(spec.southCapInk === true ? { ...g, southCapInk: true } : g);
    }
  }
  return out;
}

/** Composite (non-flat) pipeline entry point — mission A4/T4 replacement for
 *  ./layout.ts's legacy `legacyLayoutLevel` recursion. mission G4 S5:
 *  `transitions` is now ONLY the top-level pass's own edges (every nested
 *  pass's own edges live on its own `StateNodeGeo.transitions` instead,
 *  attached during `materializeSpecs` above). */
export function layoutComposite(ast: StateDiagramAST, theme: Theme, measurer: StringMeasurer): StateGeometry {
  const { acc, result, specs } = buildTopLevelPass(ast, theme, measurer);
  if (acc.nodes.length === 0) {
    return { totalWidth: 0, totalHeight: 0, states: [], transitions: [] };
  }
  const posMap: PosMap = new Map(result.nodes.map((n) => [n.id, n]));
  // mission skin-file-loading Batch 2: `theme.shadowing` (Batch 1's resolved
  // `skin <name>`/`<style>` value) threads through the WHOLE materialized
  // tree from this single top-level entry point -- see `materializeSpecs`'s
  // own doc comment.
  const states = materializeSpecs(specs, posMap, clusterPosMapOf(result), theme.shadowing ?? 0);
  const transitions = buildLevelTransitionGeos(acc, result);
  // lgm-T1c: a framed diagram draws the raw svek frame (DiagramChromeFactory.java:278-337
  // never runs SvekResult.java:130-135's moveDelta), so layout.ts needs the top pass's shift.
  return {
    totalWidth: result.width,
    totalHeight: result.height,
    states,
    transitions,
    ...(result.originShift !== undefined ? { originShift: result.originShift } : {}),
  };
}
