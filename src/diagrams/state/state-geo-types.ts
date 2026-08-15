/**
 * Public geometry types for the state-diagram layout engine. Split out of
 * ./layout.ts (which re-exports them, preserving the public import path used
 * by ./renderer.ts and ./index.ts) so the composite-pass modules can share
 * them without an import cycle through layout.ts.
 */

import type { StateKind } from './ast.js';

/** One measured text line (`state-sizing.ts#measureTextLines`/
 *  `measureBodyTextLines`) — `width` is the line's own measured advance
 *  width at the diagram's theme font, feeding `<text textLength="...">`. */
export interface StateTextLine {
  readonly text: string;
  readonly width: number;
}

export interface StateNodeGeo {
  id: string;
  kind: StateKind | 'note';
  display: string;
  x: number;
  y: number;
  width: number;
  height: number;
  children: StateNodeGeo[];
  /**
   * mission G4 S5 (transition-nesting mechanism): the transitions belonging
   * to THIS node's own svek pass (only ever non-empty for an 'autonom'
   * composite pass boundary -- a plain leaf or non-autonom `cluster` node
   * never owns any transitions of its own, since clusters share their
   * container pass's edges). Rendered as siblings of `children` INSIDE this
   * node's own `<g>` wrap (`renderer.ts#renderNodeWrapped`), matching jar's
   * real nesting (`GroupMakerState#getImage` draws a pass's own edges as
   * direct children of that pass's own image, never at the outer document
   * level) -- replaces the pre-S5 flat-sibling simplification named in
   * `renderer-group.ts`'s own "Transitions render as FLAT siblings" doc
   * comment. jar-verified `bajelo-54-dixe684` (`lnk10`/`lnk11` both nest
   * inside `Track_FSM`'s own `<g>`, siblings of its entity/cluster children,
   * not inside the specific entity/cluster their endpoints happen to sit in).
   */
  transitions: TransitionGeo[];
  /**
   * mission G4 S2 (mechanism 5): pre-measured header (display/name) line(s)
   * for `kind:'normal'`/`'json'` leaf boxes, or the single short pseudostate
   * glyph label ("H"/"H*") for `kind:'history'`/`'deepHistory'` — the
   * renderer itself has no `StringMeasurer` (a pure-function, DOM-free
   * design constraint), so per-line text width for jar's exact
   * `lengthAdjust="spacing" textLength="..."` centering must be measured
   * once at layout time and threaded through, mirroring `ClassifierGeo
   * .rows[].width`'s identical precedent in the class engine. `undefined`
   * for every OTHER kind (initial/final/fork/join/syncBar/choice draw no
   * measured inline text) and for `kind:'json'` (whose box content is a
   * genuinely different, unmeasured approximation — `renderJson`'s own doc
   * comment in renderer.ts).
   */
  headerLines?: readonly StateTextLine[];
  /** mission G4 S2: pre-measured body/description line(s) (`State X : text`)
   *  for a `kind:'normal'` leaf box — same rationale as {@link headerLines}.
   *  `undefined`/empty when the state has no description lines. */
  bodyLines?: readonly StateTextLine[];
  /**
   * mission G4 S5: `true` iff this leaf `kind:'normal'` state takes jar's
   * `EntityImageStateEmptyDescription` shape (`hide empty description` +
   * zero body lines, `GeneralImageBuilder#createEntityImageBlockInternal`'s
   * `isHideEmptyDescriptionForState && leaf.getBodier().getRawBody().size()
   * == 0` gate) rather than the regular `EntityImageState` box: NO divider
   * `<line>`, the label CENTERED both horizontally AND vertically (not the
   * regular header-line offset), and NOT wrapped in a `<g>` at all
   * (`renderer.ts#wrapClassFor`'s existing "unwrapped" precedent for fork/
   * join/history/deepHistory). `undefined` (the pre-S5, still-correct
   * default) for every other case, including a composite's own title
   * (composites never take this branch upstream — `LeafType.STATE`'s own
   * dispatch is LEAF-only). jar-verified `gopumi-11-pise779`'s `S1`.
   */
  emptyDescription?: true;
  /** mission G4 S2: `State.color`'s raw `#color`/`#back:color;...` inline
   *  override, threaded through unresolved (same raw-string convention as
   *  `ClassifierGeo.color`) — resolved to a hex fill at RENDER time via
   *  `state-render-colors.ts#resolveStateFill`, not here, so every leaf
   *  kind (including pseudostates, which support the same override
   *  mechanism upstream, `Colors#getColor(BackGroundColor)`) can share one
   *  resolution function. */
  color?: string;
  /**
   * mission G4 S6, mechanism 13: for a CONCURRENT-region-owning composite
   * ONLY (`state X { region1 -- region2 -- ... }`) -- the SAME content as
   * `children`/`transitions` (which stay a flat, region-order concatenation,
   * unchanged in shape, for `layout-ink-extent.ts#addNodeInk`'s and
   * `renderer-uid.ts#buildStateUidPlan`'s existing flat walks) but GROUPED
   * per stacked region, so `renderer.ts#renderNodeWrapped` can interleave
   * each region's own states+transitions and draw a dashed `separators`
   * line BETWEEN each pair -- jar's real document structure never wraps a
   * region in its own `<g>` (`ConcurrentStates.java#drawU` draws each
   * `inner`'s content directly, then the separator, in a single flat
   * sequence inside the OWNING composite's own image) -- `undefined` for
   * every non-concurrent node. The SAME `StateNodeGeo`/`TransitionGeo`
   * object instances appear in both `concurrentRegions[i].children`/
   * `.transitions` and the flat `children`/`transitions` arrays
   * (`state-composite-geo.ts#materializeAutonom` builds the flat arrays BY
   * CONCATENATING the per-region ones, not the reverse) -- `renderer-uid.ts`'s
   * `edgeUid` Map is keyed by `TransitionGeo` object IDENTITY, so this
   * sharing is load-bearing, not an optimization.
   */
  concurrentRegions?: readonly StateRegionGeo[];
  /** mission G4 S6, mechanism 13: dashed separator lines between stacked
   *  concurrent regions (`ConcurrentStates.java#Separator.drawSeparator`,
   *  `stroke-width:1.5;stroke-dasharray:8,10;`) -- length `concurrentRegions!.
   *  length - 1`, absolute (already dx/dy-shifted into this node's own
   *  coordinate frame, same convention as `children`/`transitions`).
   *  `undefined` for every non-concurrent node. */
  separators?: readonly StateSeparatorGeo[];
  /**
   * mission G4 S7 (mechanism 10, id-numbering creation-index gap): the
   * parse-time tick (`State.creationIndex`, or the lazily-assigned
   * pseudostate tick for an `'initial'`/`'final'` node -- ast.ts's
   * `StateDiagramAST.pseudoCreationIndex` doc) this node's own uid slot was
   * assigned. `renderer-uid.ts#buildStateUidPlan` uses this RAW value
   * directly (`ent%04d(creationIndex)`, no dense re-packing) when present --
   * see `State.creationIndex`'s own doc comment for why raw values already
   * reproduce jar's real id gaps. `undefined` for a hand-built test
   * geometry (falls back to the pre-mission-S7 dense-numbering scheme).
   * @see plans/g4-state-svg/ledger.md (S7)
   */
  creationIndex?: number;
  /**
   * mission G4 S9 (`StateBorderColor<<X>>` cascade): this node's OWN
   * `<<stereotype>>` label (`State.stereotype`, raw case as written in the
   * source -- lowercased only at LOOKUP time,
   * `state-render-colors.ts#resolveStateBorder`, matching `core/skinparam
   * .ts`'s own lowercased-key storage for `stateBorderColorByStereo`).
   * Threaded onto BOTH a plain leaf (`buildStateGeoTextFields`) and a
   * composite's own title node (`kind:'state'`/`'autonom'` GeoSpec
   * variants, state-composite-pass.ts) -- NOT onto a non-autonom `'cluster'`
   * node, which stays on its pre-existing dashed-rect fallback shape
   * (mechanism 16, unrelated/unbounded, `plans/g4-state-svg/ledger.md` S3).
   * `undefined` for a state with no `<<tag>>`.
   */
  stereotype?: string;
  /**
   * G9/T7: which side of its own 12x12 symbol a BORDER POINT
   * (`<<entrypoint>>`/`<<exitpoint>>`/`<<inputPin>>`/`<<outputPin>>`) draws
   * its name label on — `EntityImageStateBorder#upPosition`
   * (`svek/image/EntityImageStateBorder.java:70-77`): `true` when the
   * symbol's TOP edge is above the vertical centre of the parent cluster's
   * final drawn rectangle, `false` otherwise. Upstream evaluates this at DRAW
   * time from `parent.getRectangleArea()`; that rectangle is the same
   * frontier-corrected box `state-composite-geo.ts#materializeCluster`
   * computes, so this port decides it there and carries the answer.
   *
   * Present ONLY on a border point, so it doubles as the marker that selects
   * `renderer-border-point.ts` over the ordinary state-box renderer — the
   * dispatch upstream makes by instantiating a different image class
   * entirely (`GeneralImageBuilder#createEntityImageBlock`).
   */
  borderPointLabelAbove?: boolean;
  /**
   * G9/T7: the height of that same border point's name label — `desc
   * .calculateDimension().height` in `EntityImageStateBorder#drawU`, which is
   * `lines * fontSize` under this port's own `measureTextLines` convention.
   * Recorded at measurement time (`state-sizing.ts#buildStateGeoTextFields`,
   * the only place the resolved font size is known) because
   * `layout-ink-extent.ts` needs it to reserve the band the label occupies
   * OUTSIDE the symbol, and that module is deliberately theme-free.
   */
  borderPointLabelHeight?: number;
  /**
   * G9/T8: how far this composite's INK extends beyond its DRAWN box, per
   * side — see `state-composite-geo.ts#borderPointInkOverflow` for the
   * upstream mechanism (jar's ink pass and its draw pass compute a
   * border-point cluster's frontier from different child rectangles, so its
   * canvas reserves space the frame never covers).
   *
   * A shift-invariant OVERFLOW rather than a second box, so `shiftGeo` and
   * `layout.ts#shiftStateNode` carry it through unchanged. Every side is >= 0:
   * the frontier only ever resets a boundary OUTWARD, to the raw box.
   * `undefined` whenever the two passes agree, which is every composite
   * without a border point and every one whose children are all leaves.
   */
  inkOverflow?: { readonly top: number; readonly right: number; readonly bottom: number; readonly left: number };
  /**
   * mission G4 S10 (notes never render): present ONLY for `kind: 'note'` --
   * per-line note-body text + measured width (mirrors `headerLines`'s
   * identical per-line-width rationale, `state-note-layout.ts#measureNote`).
   * A note has no `display`/`headerLines`/`bodyLines` shape of its own.
   */
  noteLines?: readonly StateTextLine[];
  /**
   * mission G4 S10: present ONLY for `kind: 'note'` WITH a resolved host
   * (`note <pos> of X` / implicit-position-attached -- `StateNote.target !==
   * undefined`) whose connector spline resolved to a real notch (`../class/
   * note-opale.ts#resolveOpaleConnector`) -- the Opale zigzag-notch merge
   * REPLACES the plain folded-corner box + separate line every OTHER note
   * takes (`renderer-note.ts#renderStateNoteFreestanding`). `pp1`/`pp2` are
   * LOCAL to this node's own (0,0)-at-top-left frame (`note-opale.ts
   * #OpaleConnector`'s own doc) -- safe under the document-margin shift
   * (`layout.ts#shiftStateNode` only ever translates `x`/`y`, never touches
   * this field, mirroring how `separators`' own absolute coordinates are
   * the ones that DO need re-shifting while opale's LOCAL offsets don't).
   * `undefined` for a freestanding note or an attached note whose connector
   * spline didn't resolve (falls back to the plain-box shape).
   */
  noteOpale?: {
    readonly direction: 'left' | 'right' | 'up' | 'down';
    readonly pp1: { readonly x: number; readonly y: number };
    readonly pp2: { readonly x: number; readonly y: number };
  };
  /**
   * G5 C3, mechanism 16 shape half: present ONLY on a genuine
   * `'cluster'`-classified composite this iteration's eligibility gate
   * covered (single-line title, default font-size, no border-point
   * children -- `state-composite-cluster.ts#resolveClusterComposite`'s own
   * doc comment) -- the jar-verified header-to-divider height
   * (`CLUSTER_HEADER_HEIGHT`, that same module). `renderer-composite-
   * box.ts#renderComposite` dispatches to `renderClusterMeasured` (the
   * REAL `ClusterDotString`/`ClusterHeader` shape -- filled top+bottom
   * half-rounded body, ONE divider, no action zone) whenever this is set,
   * instead of `renderCompositeMeasured` (the `InnerStateAutonom` shape,
   * transparent body below the header) or the pre-mechanism-16 dashed-rect
   * fallback. `undefined` for every other node kind, and for a 'cluster'
   * composite this iteration's gate excluded (falls back to the
   * pre-existing dashed-rect shape unchanged).
   */
  clusterHeaderHeight?: number;
  /** G5 C3: title baseline vertical margin for the cluster shape above --
   *  see `CLUSTER_TITLE_BASELINE_MARGIN`'s own doc comment
   *  (state-composite-cluster.ts) for why this differs from the autonom
   *  shape's own `MARGIN`. Always set together with `clusterHeaderHeight`. */
  clusterTitleBaselineMargin?: number;
  /**
   * mission skin-file-loading Batch 2 (D3's rendering half, STATE-scoped):
   * the resolved `theme.shadowing` value (`skin <name>`/`<style> element {
   * Shadowing N } }`, `Theme.shadowing`'s own doc comment) this node's own
   * box draws WITH -- upstream `EntityImageState`/`InnerStateAutonom`'s
   * shared `getStyleState().getShadowing()` read. Populated ONLY for the
   * node kinds jar actually draws a shadow for (`kind:'normal'`/`'json'`
   * leaf boxes via `EntityImageStateCommon#getShape`, and a composite whose
   * `headerLines` is set AND `clusterHeaderHeight` is NOT set -- the
   * `InnerStateAutonom`/`RoundedContainer` shape `renderer-composite-
   * box.ts#renderCompositeMeasured` draws, NOT the `ClusterDotString`/
   * `ClusterHeader` shape `renderClusterMeasured` draws, which jar-verified
   * carries no shadow at all, `~/git/plantuml/.../svek/ClusterDotString
   * .java`/`ClusterHeader.java` grepped clean of `Shadow`) -- every OTHER
   * kind (pseudostates: initial/final/history/deepHistory/fork/join/
   * syncBar/choice) is left `undefined` even when `theme.shadowing > 0`,
   * a deliberate, named scope limit (no corpus fixture combines a bundled
   * skin with a pseudostate this iteration -- the mission's own Jar refs
   * cite only `EntityImageState.java`/`InnerStateAutonom.java`). `undefined`
   * or `0` behave identically (no shadow) -- absent for every pre-Batch-2
   * fixture (`theme.shadowing` is always `undefined` before `skin <name>`
   * loading, Batch 1) and for a hand-built test geometry.
   * @see layout-ink-extent.ts#addStateBoxInk (ink reservation)
   * @see renderer-box.ts#renderNormal / renderer-composite-box.ts#renderCompositeMeasured (draw)
   */
  shadowing?: number;
}

/** One stacked concurrent region's own materialized content -- see
 *  `StateNodeGeo.concurrentRegions`'s own doc comment. */
export interface StateRegionGeo {
  readonly children: readonly StateNodeGeo[];
  readonly transitions: readonly TransitionGeo[];
}

/** One dashed separator line between two stacked concurrent regions -- see
 *  `StateNodeGeo.separators`'s own doc comment. Absolute coordinates. */
export interface StateSeparatorGeo {
  readonly x1: number;
  readonly y1: number;
  readonly x2: number;
  readonly y2: number;
}

export interface TransitionGeo {
  from: string;
  to: string;
  points: Array<{ x: number; y: number }>;
  /** `width`/`height` (G8 T2, additive): the jar-verified reserved label
   *  box (`state-transition-label.ts#computeReservedLabelBox`, spec.md §1a
   *  -- margin+floor around the measured text) that both the renderer and
   *  the ink walk (`layout-ink-extent.ts`'s `labelInk` param) need. Absent
   *  for a label built without a font/measurer available (concurrent-region
   *  passes, `state-composite-concurrent.ts`, out of this task's write-set)
   *  -- both consumers already treat absence as "fold the point only",
   *  the pre-existing behavior. */
  label?: { text: string; x: number; y: number; width?: number; height?: number };
  /** mission G4 S7 -- see `StateNodeGeo.creationIndex`'s own doc comment;
   *  same raw-value contract, sourced from `Transition.creationIndex`. */
  creationIndex?: number;
  /**
   * mission G4 S15: `Transition.crossStart`/`.circleEnd` (`x-->`/`-->o`
   * arrow decorations, `LinkDecor.CIRCLE_CROSS`/`ARROW_AND_CIRCLE`),
   * threaded through unchanged from the AST -- both pipelines
   * (`layout.ts#buildFlatTransitionGeos`, `state-composite-pass.ts
   * #buildLevelTransitionGeos`) already have the source `Transition` in
   * scope where `TransitionGeo` is built, so this is a pure pass-through,
   * consumed only by `renderer-arrowhead.ts#buildCircleEndMarkup`/
   * `#buildCrossStartMarkup`. `undefined` for every ordinary transition
   * (the overwhelming majority) and for a hand-built test geometry.
   * @see plans/g4-state-svg/ledger.md (S15)
   */
  crossStart?: boolean;
  circleEnd?: boolean;
}

export interface StateGeometry {
  totalWidth: number;
  totalHeight: number;
  states: StateNodeGeo[];
  transitions: TransitionGeo[];
  /**
   * mission G4 S14: `StateDiagramAST.concurrentGlobalIds`, carried through
   * layout unchanged so the renderer can translate a CONC-region pseudo-
   * anchor path id from this port's own owner-local numbering to jar's
   * diagram-global one -- see that field's own doc comment (ast.ts) for
   * the full mechanism. Optional/absent is equivalent to an empty map
   * (no concurrent regions in this diagram, or a hand-built geometry
   * literal predating this mission).
   */
  concurrentGlobalIds?: ReadonlyMap<string, number>;
}
