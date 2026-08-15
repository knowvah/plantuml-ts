/**
 * Shared types for the composite (non-flat) svek-pass pipeline -- split out
 * of ./state-composite-pass.ts (G5 C3, 500-line file-cap compliance; pure
 * move, no behavior change) mirroring this file's OWN established split
 * precedent (state-composite-cluster.ts/state-composite-concurrent.ts/
 * state-composite-autonom.ts/state-composite-pseudo.ts were all split out of
 * state-composite-pass.ts earlier for the identical reason) and
 * state-geo-types.ts's identical "types-only sibling file" shape.
 * Re-exported verbatim from state-composite-pass.ts so every pre-existing
 * importer of `DiagramCtx`/`GeoSpec` FROM that module keeps working
 * unchanged.
 *
 * `PassAccumulator` joined this leaf in a later split (state-composite-pass
 * .ts's own 500-line cap was hit again once ./state-composite-pass-edges.ts
 * was carved out): both `state-composite-pass.ts` (orchestration) and
 * `state-composite-pass-edges.ts` (edge/note accumulation) need the type, so
 * it has to live below both in the import DAG, not in either -- same
 * "types-leaf-first" rationale as `DiagramCtx`/`GeoSpec` above.
 */

import type { StateKind, Transition } from './ast.js';
import type { Theme } from '../../core/theme.js';
import type { FontSpec, StringMeasurer } from '../../core/measurer.js';
import type { DotLayoutResult, DotInputNode, DotInputEdge, DotInputCluster } from '../../core/graph-layout.js';
import type { AutonomOffset } from './state-composite-sizing.js';
import type { ClassifyResult } from './state-composite-classify.js';
import type { ConcurrentRegionPassResult } from './state-composite-concurrent.js';
import type { TransitionGeo, StateTextLine } from './state-geo-types.js';
import type { NoteEdgeCandidate, ScopeNoteParts } from './state-note-layout.js';

export interface PassAccumulator {
  nodes: DotInputNode[];
  edges: DotInputEdge[];
  clusters: DotInputCluster[];
  /** (transition, edgeId) pairs for THIS pass — used post-layout to build
   *  TransitionGeo entries (label placement needs the routed points).
   *  `reversed` mirrors whether this edge's DOT `from`/`to` were swapped
   *  for ranking (`isReversedDirection`, state-composite-pass-edges.ts) --
   *  `undefined`/falsy for every un-hinted or `-right-`/`-down-` transition
   *  (the pre-existing, un-swapped shape). */
  edgeSources: { t: Transition; edgeId: string; reversed?: boolean }[];
  /** G8 T2: the transition/edge-label font (`ARROW_LABEL_FONT_SIZE`, 13pt)
   *  + measurer this pass's own `buildLevelTransitionGeos` call needs to
   *  convert a labeled edge's graphviz-returned centre into a draw anchor
   *  (`state-transition-label.ts#attachTransitionLabel`). Optional: passes
   *  built by a `newAccumulator()` call outside this task's write-set
   *  (state-composite-concurrent.ts's own concurrent-region passes) don't
   *  set these, and `attachTransitionLabel` degrades gracefully to its
   *  pre-existing perpendicular-only, no-box formula when they're absent. */
  labelFont?: FontSpec;
  measurer?: StringMeasurer;
}

export interface DiagramCtx {
  theme: Theme;
  measurer: StringMeasurer;
  rankdir: 'TB' | 'LR';
  classify: ClassifyResult;
  /** Every REGULAR (non-`'[*]'`) transition in the WHOLE diagram, flattened
   *  regardless of syntactic declaring scope -- see `collectRegularTransitions`
   *  and `sweepOrphanEdges` below (mission A4 Phase L iter 6, link-hoisting
   *  doc). */
  pool: readonly Transition[];
  /** Transition objects already added to SOME pass's `PassAccumulator` --
   *  tracked by object identity so `sweepOrphanEdges` only ever supplies the
   *  ones the existing per-scope `addLevelEdges` mechanism never reached. */
  consumed: Set<Transition>;
  /** Note DOT nodes + connector-edge candidates, keyed by declaring scope --
   *  see `state-note-layout.ts`'s doc (mission A4 Phase L iter 9). */
  noteParts: ReadonlyMap<string, ScopeNoteParts>;
  /** Every attached note's connector-edge candidate, diagram-wide -- the
   *  note-edge analogue of `pool`/`consumed` above (same opportunistic
   *  per-pass attach model, `sweepOrphanNoteEdges`). */
  notePool: readonly NoteEdgeCandidate[];
  consumedNotes: Set<NoteEdgeCandidate>;
  /** Every 'autonom' composite's fully-built `GeoSpec`, keyed by id --
   *  populated by `resolveAllAutonomPasses` (called once, before any
   *  `resolveMember` walk) in `ctx.classify.firingOrder` order. Progressively
   *  filled the same way `consumed`/`consumedNotes` are (mutated in place as
   *  a shared, single-owner accumulator), not a snapshot. */
  resolvedAutonom: Map<string, ExtractAutonomSpec>;
  /** Every `--`-delimited concurrent region's raw pass result, keyed by
   *  `concurrentRegionScopeId` -- populated the SAME way `resolvedAutonom`
   *  is, by the SAME `resolveAllAutonomPasses` firing-order loop (mission
   *  A4 Phase L iteration 19: a region is its own unconditionally-autarkic
   *  `Entity` upstream, `ClassifyResult.firingOrder`'s doc,
   *  state-composite-classify.ts, has the full mechanism).
   *  `buildConcurrentAutonomSpec` (./state-composite-concurrent.ts) reads
   *  from this map instead of building a region's pass inline. */
  resolvedRegions: Map<string, ConcurrentRegionPassResult>;
  /** mission G4 S5: `ast.hideEmptyDescription`, threaded onto `ctx` so
   *  `resolveMember`'s LEAF branch can pass it to `buildStateGeoTextFields`
   *  (`StateNodeGeo.emptyDescription`'s own doc comment) -- a composite's
   *  own title (`buildPlainAutonomSpec`/`combineConcurrentPasses`) never
   *  reads this field, since composites are never eligible for the
   *  EmptyDescription shape upstream (leaf-only branch). */
  hideEmptyDescription: boolean;
  /** mission G4 S7: `ast.pseudoCreationIndex`, threaded onto `ctx` so
   *  `addLocalPseudoNodes` can attach the lazily-assigned pseudostate
   *  creation tick to its `GeoSpec`s -- see `StateDiagramAST
   *  .pseudoCreationIndex`'s own doc comment (ast.ts). */
  pseudoCreationIndex: ReadonlyMap<string, number>;
  /**
   * G5 C3, mechanism 16 shape half: `true` while resolving a SEPARATELY-
   * FIRED pass boundary's own content -- an autonom composite's child pass
   * (`state-composite-autonom.ts#buildPlainAutonomSpec`) or a concurrent
   * region/branch's own pass (`state-composite-concurrent.ts
   * #buildConcurrentBranchAcc`, covers both region-0 and a real `--` region
   * via `buildConcurrentRegionPass`). `undefined`/falsy at the TOP-LEVEL
   * diagram pass (`buildTopLevelPass` below).
   *
   * `state-composite-cluster.ts#resolveClusterComposite` gates its
   * `titleTableWidth`/`titleTableHeight`/render-shape eligibility on THIS
   * being falsy -- jar-verified diagnosis (ledger.md §C3): a nested
   * cluster's real HTML title-table reservation changes that SPECIFIC
   * pass's own `layoutGraph()`-computed `result.width`/`height` (not just
   * its OWN bbox), which feeds `buildPlainAutonomSpec`'s `Math.max
   * (geometry.width, result.width)` floor (the ALREADY-PARKED "Queued for
   * S5" gap, `state-composite-autonom.ts`'s own doc comment) -- confirmed
   * on `fotuje-06-fifa085`/`rovese-43-tadu368` (both regress `state-dot-
   * parity.test.ts`'s size-backlog ratchet past their pinned tolerance when
   * a nested cluster inside an autonom composite's own child pass is made
   * title-table-eligible; `bajelo-54-dixe684`'s `Track_FSM.Run` -- ALSO
   * nested inside an autonom pass -- happens NOT to flip that Math.max on
   * ITS specific geometry, so exclusion is a real behavior change only for
   * a minority of nested-cluster fixtures, not a no-op, but the SAFE
   * default given the floor formula itself is PARKED and this iteration's
   * write-set forbids touching it). The TOP-LEVEL pass has no equivalent
   * `Math.max` floor (`buildTopLevelPass`'s own `layoutGraph()` result
   * becomes the diagram's own total canvas size directly), so top-level
   * clusters are unconditionally safe and stay eligible.
   */
  insideAutonomPass?: true;
}

/** Geometry-tree spec — mirrors visual nesting (unlike the flat
 *  `DotInputCluster.nodeIds`/`parentId` scheme the emitter/layout consume).
 *  ./state-composite-geo.ts materializes this into `StateNodeGeo[]` once a
 *  pass's `DotLayoutResult` (real positions) is available. */
export type GeoSpec =
  | {
      kind: 'state';
      id: string;
      stateKind: StateKind;
      display: string;
      /** mission G4 S2 -- see `StateNodeGeo.headerLines` doc (state-geo-types.ts). */
      headerLines?: readonly StateTextLine[];
      /** G9/T7 -- see `StateNodeGeo.borderPointLabelHeight`'s own doc comment. */
      borderPointLabelHeight?: number;
      bodyLines?: readonly StateTextLine[];
      color?: string;
      /** mission G4 S9 -- see `StateNodeGeo.stereotype`'s own doc comment. */
      stereotype?: string;
      /** mission G4 S7 -- see `StateNodeGeo.creationIndex`'s own doc comment. */
      creationIndex?: number;
    }
  | {
      kind: 'autonom';
      id: string;
      display: string;
      offset: AutonomOffset;
      width: number;
      height: number;
      localStates: readonly GeoSpec[];
      localPositions: DotLayoutResult;
      localTransitions: readonly TransitionGeo[];
      /** mission G4 S3 (mechanism 6) -- the composite box's OWN title
       *  (`headerLines`, from `state.display`) and optional entry/exit
       *  action-zone text (`bodyLines`, from `state.description`), measured
       *  the SAME way a leaf `'state'` spec is (`state-sizing.ts
       *  #buildStateGeoTextFields`) -- see `state-composite-autonom.ts
       *  #buildPlainAutonomSpec`'s own doc comment for the jar-verified
       *  fixtures. `undefined` for a concurrent-region LEAF (`state-
       *  composite-cluster.ts#buildConcurrentRegionLeaf`), which upstream
       *  never wraps in `InnerStateAutonom`'s own title/border box at all
       *  (`GroupMakerState.getImage()` returns a region's raw graph image
       *  DIRECTLY) -- `renderer-composite-box.ts` falls back to the
       *  pre-mechanism-6 dashed-rect shape whenever `headerLines` is
       *  `undefined`, which is also correct for THIS case by construction
       *  (a named, deliberately-unchanged pre-existing approximation, not a
       *  new gap -- see that module's own doc comment). */
      headerLines?: readonly StateTextLine[];
      bodyLines?: readonly StateTextLine[];
      color?: string;
      /** mission G4 S9 -- see `StateNodeGeo.stereotype`'s own doc comment. */
      stereotype?: string;
      /** mission G4 S6, mechanism 13: for a CONCURRENT-region-owning
       *  composite ONLY -- `localStates`/`localTransitions` above stay a
       *  flat, region-order concatenation (unchanged, still consumed
       *  whenever `regions` is `undefined`), but this field groups the SAME
       *  specs/transitions per stacked region so `state-composite-geo.ts
       *  #materializeAutonom` can build BOTH the flat arrays (by
       *  concatenating these, preserving object identity for
       *  `renderer-uid.ts`'s identity-keyed `edgeUid` Map) AND the
       *  interleaved `StateNodeGeo.concurrentRegions` the renderer needs.
       *  See `state-composite-concurrent.ts#combineConcurrentPasses`. */
      regions?: readonly { specs: readonly GeoSpec[]; transitions: readonly TransitionGeo[] }[];
      /** mission G4 S6, mechanism 13: LOCAL (pre dx/dy-shift) dashed
       *  separator-line coordinates between stacked regions -- see
       *  `StateNodeGeo.separators`'s own doc comment (state-geo-types.ts). */
      separators?: readonly { x1: number; y1: number; x2: number; y2: number }[];
      /** mission G4 S7 -- see `StateNodeGeo.creationIndex`'s own doc comment. */
      creationIndex?: number;
    }
  | {
      kind: 'cluster';
      id: string;
      display: string;
      children: readonly GeoSpec[];
      creationIndex?: number;
      /** G5 C3, mechanism 16 shape half: `DotInputCluster.id` this
       *  composite's own subgraph was assigned (`state-composite-cluster.ts
       *  #resolveClusterComposite`'s `clusterId`) -- lets `state-composite-
       *  geo.ts#materializeCluster` look up THIS pass's own real graphviz
       *  cluster bbox (`DotLayoutResult.clusters`) by the SAME id the
       *  emitter/layout seam used, rather than `id` above (which multiple
       *  nesting scopes can share -- `nextClusterId`'s own doc comment).
       *  Always set (every 'cluster' GeoSpec comes from
       *  `resolveClusterComposite`); optional only for a hand-built test
       *  geometry predating this mission. */
      clusterId?: string;
      /** G5 C3: this composite's own measured single-line title width
       *  (`measureClusterTitle`) -- present ONLY when `clusterHeaderHeight`
       *  is (see its own doc comment); `undefined` otherwise (pre-existing
       *  dashed-rect fallback, unchanged). */
      titleWidth?: number;
      /** G5 C3, mechanism 16 shape half: jar-verified single-line-title
       *  header-to-divider height (`CLUSTER_HEADER_HEIGHT`,
       *  state-composite-cluster.ts's own doc comment) -- present ONLY when
       *  this iteration's eligibility gate held (single-line title, default
       *  font-size, no border-point children). `state-composite-geo.ts
       *  #materializeCluster` reads the pass's real `DotLayoutResult
       *  .clusters` bbox and renders the jar-native cluster shape
       *  (`renderer-composite-box.ts#renderClusterMeasured`) when this is
       *  set, instead of the pre-C3 `boundingBox(children)` approximation +
       *  dashed-rect fallback. */
      clusterHeaderHeight?: number;
      /** G5 C3: title baseline vertical margin (`CLUSTER_TITLE_BASELINE
       *  _MARGIN`) -- see that constant's own doc comment
       *  (state-composite-cluster.ts) for why this differs from the autonom
       *  shape's own `MARGIN`. Always set together with
       *  `clusterHeaderHeight`. */
      titleBaselineMargin?: number;
      /** G7 T14b (`plans/g6-cluster-geometry/batch-4/withlabel-derivation.md`
       *  §2c/§5, `Cluster#manageEntryExitPoint`): direct border-point
       *  (entry/exit-point) member ids -- `state-composite-cluster.ts
       *  #resolveClusterComposite`'s own `borderPointMemberIds` local, the
       *  SAME set `applyBorderPointRanks` partitions into `cluster.portRanks`.
       *  `state-composite-geo.ts#materializeCluster` uses this to split its
       *  own already-materialized `children` into `frontierCalculator`'s
       *  `insides` (every OTHER child -- normal members, nested clusters) and
       *  `points` (these ids' own centers) terms. Set ONLY when non-empty
       *  (mirrors `hasBorderPointChildren`); absent means the plain
       *  `real`-bbox-direct shape applies unchanged. */
      borderPointMemberIds?: readonly string[];
      /** G7 T14b: `Cluster.java:427-428`'s `frontierCalculator.ensureMinWidth(
       *  getTitleAndAttributeWidth() + 10)` -- `Math.floor(headerWidth) + 10`
       *  (G8/T1c's own truncation rule, the SAME `titleTableWidth` above
       *  already uses at the `addClusters` seam). Always set together with
       *  `borderPointMemberIds`. */
      frontierMinWidth?: number;
      /** G7 T14b: `ctx.rankdir`, threaded through so `materializeCluster`'s
       *  `frontierCalculator` call uses the SAME axis convention this specific
       *  pass laid out under (`FrontierCalculator`'s own rankdir-dependent
       *  corner-exclusion step, §2c step 5) -- every fixture verified this
       *  mission is `'TB'`; `'LR'` is ported faithfully in
       *  `state-composite-frontier.ts` but has zero fixture coverage. Always
       *  set together with `borderPointMemberIds`. */
      rankdir?: 'TB' | 'LR';
    };

/** `DiagramCtx.resolvedAutonom`'s own value type -- exported so callers
 *  outside this module (state-composite-autonom.ts, state-composite-
 *  concurrent.ts) don't each redeclare an identical local alias. */
export type ExtractAutonomSpec = Extract<GeoSpec, { kind: 'autonom' }>;
