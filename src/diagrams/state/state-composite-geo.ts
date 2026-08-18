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
import type { StateNodeGeo, TransitionGeo, StateGeometry, StateRegionGeo } from './state-geo-types.js';
import type { StateDiagramAST } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { StringMeasurer } from '../../core/measurer.js';
import { frontierCalculator, ensureMinWidth, type Box } from './state-composite-frontier.js';

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

function clusterPosMapOf(result: DotLayoutResult): ClusterPosMap {
  return result.clusters !== undefined ? new Map(result.clusters.map((c) => [c.id, c])) : EMPTY_CLUSTER_POS_MAP;
}

const BOX_PAD = 12;

function shiftGeo(g: StateNodeGeo, dx: number, dy: number): StateNodeGeo {
  const children = g.children.map((c) => shiftGeo(c, dx, dy));
  const transitions = g.transitions.map((t) => shiftTransition(t, dx, dy));
  return {
    ...g,
    x: g.x + dx,
    y: g.y + dy,
    children,
    transitions,
    // mission G4 S6, mechanism 13: an ANCESTOR's own shift (e.g. this node
    // is a nested composite reached via a grandparent's `spec.localStates`)
    // must ALSO shift `concurrentRegions`/`separators` if this node itself
    // owns concurrent regions -- otherwise a nested concurrent composite's
    // separator lines would retain their PRE-ancestor-shift coordinates.
    // `concurrentRegions` is rebuilt from the ALREADY-shifted `children`/
    // `transitions` above (by slicing on original per-region lengths) so
    // object identity with the flat arrays is preserved, matching
    // `materializeAutonom`'s own identity-sharing contract.
    ...(g.concurrentRegions !== undefined
      ? { concurrentRegions: resliceRegions(g.concurrentRegions, children, transitions) }
      : {}),
    ...(g.separators !== undefined
      ? { separators: g.separators.map((sep) => ({ x1: sep.x1 + dx, y1: sep.y1 + dy, x2: sep.x2 + dx, y2: sep.y2 + dy })) }
      : {}),
  };
}

/** Re-groups already-shifted flat `children`/`transitions` back into their
 *  original per-region boundaries (lengths preserved 1:1 by `shiftGeo`'s own
 *  `.map` above, which never adds/removes entries) -- see `shiftGeo`'s own
 *  doc comment for why this must reuse the SAME shifted objects rather than
 *  re-deriving them. */
function resliceRegions(
  original: readonly StateRegionGeo[],
  shiftedChildren: readonly StateNodeGeo[],
  shiftedTransitions: readonly TransitionGeo[],
): StateRegionGeo[] {
  const out: StateRegionGeo[] = [];
  let childCursor = 0;
  let transitionCursor = 0;
  for (const region of original) {
    out.push({
      children: shiftedChildren.slice(childCursor, childCursor + region.children.length),
      transitions: shiftedTransitions.slice(transitionCursor, transitionCursor + region.transitions.length),
    });
    childCursor += region.children.length;
    transitionCursor += region.transitions.length;
  }
  return out;
}

function shiftTransition(t: TransitionGeo, dx: number, dy: number): TransitionGeo {
  return {
    ...t,
    points: t.points.map((p) => ({ x: p.x + dx, y: p.y + dy })),
    ...(t.label !== undefined ? { label: { ...t.label, x: t.label.x + dx, y: t.label.y + dy } } : {}),
  };
}

function boundingBox(children: readonly StateNodeGeo[]): { x: number; y: number; width: number; height: number } {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const c of children) {
    minX = Math.min(minX, c.x);
    minY = Math.min(minY, c.y);
    maxX = Math.max(maxX, c.x + c.width);
    maxY = Math.max(maxY, c.y + c.height);
  }
  if (!isFinite(minX)) return { x: 0, y: 0, width: 0, height: 0 };
  return {
    x: minX - BOX_PAD,
    y: minY - BOX_PAD,
    width: maxX - minX + BOX_PAD * 2,
    height: maxY - minY + BOX_PAD * 2,
  };
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
    id: spec.id, kind: 'normal', display: spec.display, x: pos.x, y: pos.y, width: pos.width, height: pos.height, children, transitions,
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
 * G7 T14b (`Cluster#manageEntryExitPoint`, `Cluster.java:410-436`): a
 * border-point (`hasBorderPointChildren`) composite's final box is NOT
 * graphviz's raw cluster polygon directly -- it is that polygon corrected
 * by `frontierCalculator`/`ensureMinWidth` (`core/svek/FrontierCalculator
 * .ts` via this engine's own `state-composite-frontier.ts` Box adapter).
 * `children` are already materialized
 * (absolute-frame `StateNodeGeo`s) by the time this runs, so this partitions
 * them by `borderPointMemberIds` into the SAME two terms jar's own
 * `Cluster.entityPositions(NORMAL)`/`entityPositionsExceptNormal()` split
 * computes: `insides` (every OTHER child -- normal members, nested
 * clusters, already bottom-up-corrected if they are themselves
 * border-point) and `points` (these ids' own centers). This naturally
 * satisfies "bottom-up correction order" (T8 edit-list item 8): a nested
 * child cluster's own box is already final by the time its PARENT's
 * `materializeCluster` call reads it here, since `materializeSpecs(spec
 * .children, ...)` above runs before this function computes its own box.
 */
function borderPointBox(
  initial: Box,
  children: readonly StateNodeGeo[],
  borderPointMemberIds: readonly string[],
  minWidth: number,
  rankdir: 'TB' | 'LR',
): Box {
  const borderSet = new Set(borderPointMemberIds);
  const insides: Box[] = [];
  const points: { x: number; y: number }[] = [];
  for (const c of children) {
    if (borderSet.has(c.id)) {
      points.push({ x: c.x + c.width / 2, y: c.y + c.height / 2 });
    } else {
      insides.push({ x: c.x, y: c.y, width: c.width, height: c.height });
    }
  }
  const core = frontierCalculator(initial, insides, points, rankdir);
  const box = ensureMinWidth(core, minWidth, initial);
  // G9/T7: `EntityImageStateBorder#upPosition` (`:70-77`) — a border point
  // draws its name label ABOVE its symbol when the symbol's TOP edge is above
  // the vertical centre of the parent cluster's FINAL rectangle, below
  // otherwise. Upstream reads `parent.getRectangleArea()` at draw time; that
  // rectangle is exactly `box`, which only exists here, so the answer is
  // recorded on each border-point child now (see `StateNodeGeo
  // .borderPointLabelAbove`). Mutating the child is how every other
  // post-correction field in this pass is threaded.
  const centerY = box.y + box.height / 2;
  for (const c of children) if (borderSet.has(c.id)) c.borderPointLabelAbove = c.y < centerY;
  return box;
}

/**
 * G9/T8: the box jar's INK pass sees for a border-point composite, which is
 * NOT the one it draws.
 *
 * `Cluster#drawU` calls `manageEntryExitPoint` (`Cluster.java:344-345,410-436`)
 * on every invocation, and that method REASSIGNS `this.rectangleArea` from a
 * `FrontierCalculator` seeded with `in.getRectangleArea()` of each child
 * cluster (`:419-423`). `drawU` runs at least twice — once through
 * `TextBlockUtils.getMinMax` inside `SvekResult#calculateDimension`
 * (`SvekResult.java:130-136`), then again for the real render — and
 * `SvekResult#drawU` walks `allCluster()` in CREATION order, parents first.
 * So on the first pass a parent's frontier reads its children's RAW graphviz
 * boxes, and only on the second does it read their corrected ones.
 *
 * The consequence is a canvas taller than anything drawn on it: with raw
 * children the union of `insides` reaches above every border point, no point
 * sits on that edge, and the frontier's touch rule resets the boundary to the
 * cluster's own RAW box (`state-composite-frontier.ts` step 3). Jar-verified
 * on `temuxi-28-cega322`: its module frame draws at y=88 with the raw box 81px
 * higher, and jar's own ink minimum lands at 6 — `rawTop - 1`, the standard
 * rect inset — putting 50px of reserved-but-empty space above the topmost
 * label. A composite whose children are all LEAVES is unaffected (the leaf
 * rects sit inside, the pins extend the core, the touch rule keeps them), so
 * `lulozu-10-bopu547` and `cinoni-00-sere847` see no such band — which is
 * exactly what their oracles show.
 *
 * Returned as an OVERFLOW rather than a box so it survives the shift passes
 * (`shiftGeo`, `layout.ts#shiftStateNode`) untouched — see
 * `StateNodeGeo.inkOverflow`.
 */
function borderPointInkOverflow(
  spec: Extract<GeoSpec, { kind: 'cluster' }>,
  children: readonly StateNodeGeo[],
  clusterPosMap: ClusterPosMap,
  drawn: Box,
): StateNodeGeo['inkOverflow'] {
  const rawById = new Map<string, Box>();
  for (const child of spec.children) {
    const id = child.kind === 'cluster' ? child.clusterId : undefined;
    const raw = id !== undefined ? clusterPosMap.get(id) : undefined;
    if (raw !== undefined) rawById.set(child.id, raw);
  }
  if (rawById.size === 0) return undefined;
  const rawChildren = children.map((c) => {
    const raw = rawById.get(c.id);
    return raw === undefined ? c : { ...c, x: raw.x, y: raw.y, width: raw.width, height: raw.height };
  });
  const ink = borderPointBox(
    clusterPosMap.get(spec.clusterId!)!,
    rawChildren,
    spec.borderPointMemberIds ?? [],
    spec.frontierMinWidth ?? 0,
    spec.rankdir ?? 'TB',
  );
  const overflow = {
    top: Math.max(0, drawn.y - ink.y),
    left: Math.max(0, drawn.x - ink.x),
    bottom: Math.max(0, ink.y + ink.height - (drawn.y + drawn.height)),
    right: Math.max(0, ink.x + ink.width - (drawn.x + drawn.width)),
  };
  const empty = overflow.top === 0 && overflow.left === 0 && overflow.bottom === 0 && overflow.right === 0;
  return empty ? undefined : overflow;
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
    const hasBorderPoints =
      spec.borderPointMemberIds !== undefined && spec.borderPointMemberIds.length > 0;
    const box = hasBorderPoints
      ? borderPointBox(real, children, spec.borderPointMemberIds!, spec.frontierMinWidth ?? 0, spec.rankdir ?? 'TB')
      : real;
    // G9/T8 -- see `borderPointInkOverflow`'s own doc comment.
    const inkOverflow = hasBorderPoints
      ? borderPointInkOverflow(spec, children, clusterPosMap, box)
      : undefined;
    return {
      id: spec.id, kind: 'normal', display: spec.display,
      x: box.x, y: box.y, width: box.width, height: box.height,
      ...(inkOverflow !== undefined ? { inkOverflow } : {}),
      children, transitions: [],
      headerLines: [{ text: spec.display, width: spec.titleWidth }],
      clusterHeaderHeight: spec.clusterHeaderHeight,
      ...(spec.titleBaselineMargin !== undefined ? { clusterTitleBaselineMargin: spec.titleBaselineMargin } : {}),
      ...(spec.creationIndex !== undefined ? { creationIndex: spec.creationIndex } : {}),
    };
  }
  const box = boundingBox(children);
  return {
    id: spec.id, kind: 'normal', display: spec.display, x: box.x, y: box.y, width: box.width, height: box.height, children, transitions: [],
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
 *  G5 C3: `clusterPosMap` defaults to empty (mission G4 S4/S6's two
 *  external callers -- `state-composite-autonom.ts`'s own ink-extent
 *  computation, `state-composite-concurrent.ts`'s region materialization --
 *  don't pass one, so a nested cluster inside those SPECIFIC contexts keeps
 *  the pre-C3 `boundingBox` shape; this iteration's real-bbox/real-shape
 *  adoption is scoped to the render path only, `layoutComposite`/
 *  `materializeAutonom` below). */
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
        id: spec.id, kind: spec.stateKind, display: spec.display, x: pos.x, y: pos.y, width: pos.width, height: pos.height,
        children: [],
        transitions: [],
        ...(spec.headerLines !== undefined ? { headerLines: spec.headerLines } : {}),
        ...(spec.bodyLines !== undefined ? { bodyLines: spec.bodyLines } : {}),
        ...(spec.color !== undefined ? { color: spec.color } : {}),
        ...(spec.stereotype !== undefined ? { stereotype: spec.stereotype } : {}),
        // G9/T7: a border point's label height, for the ink band its label
        // occupies outside the symbol (`StateNodeGeo.borderPointLabelHeight`).
        ...(spec.borderPointLabelHeight !== undefined
          ? { borderPointLabelHeight: spec.borderPointLabelHeight }
          : {}),
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
        ...(shadowing > 0
          && (spec.stateKind === 'normal' || spec.stateKind === 'json')
          && spec.stereotype?.toLowerCase() !== 'sdlreceive'
          ? { shadowing }
          : {}),
      });
    } else if (spec.kind === 'autonom') {
      const g = materializeAutonom(spec, posMap, shadowing);
      if (g !== undefined) out.push(g);
    } else {
      const g = materializeCluster(spec, posMap, clusterPosMap, shadowing);
      if (g !== undefined) out.push(g);
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
  return { totalWidth: result.width, totalHeight: result.height, states, transitions };
}
