/**
 * `DotLayoutResult` — the layout engine's OUTPUT shape.
 *
 * Split out of `graph-layout.types.ts` (2026-08-13) purely for the repo's
 * 500-line file cap: that file had been sitting at 512 lines, so any addition
 * to the INPUT types was blocked by a limit it already exceeded. The seam is
 * the natural one — input types describe what we hand graphviz, this describes
 * what comes back — and it is a pure move, no shape change.
 *
 * Re-exported from `graph-layout.types.ts`, so no consumer import changed.
 */

export interface DotLayoutResult {
  nodes: Array<{ id: string; x: number; y: number; width: number; height: number; xlabelX?: number; xlabelY?: number }>;
  edges: Array<{
    id: string;
    points: Array<{ x: number; y: number }>;
    labelX?: number;
    labelY?: number;
    labelWidth?: number;
    labelHeight?: number;
    /** G2/N25: computed position for `attributes.tailLabel`/`.headLabel`
     *  (see that field's own doc comment) — the CENTER point of the label
     *  box @knowvah/dot-engine's own `xladjust` placed, in the same origin-shifted
     *  frame as `points`/`labelX`/`labelY`. Absent when the input edge did
     *  not carry `tailLabel`/`headLabel`. */
    tailLabelX?: number;
    tailLabelY?: number;
    headLabelX?: number;
    headLabelY?: number;
    /**
     * The head-end arrow ATTACHMENT point — graphviz's `bezier.ep`, reported
     * by `EdgeGeometry.ep` and republished here in the same origin-shifted
     * frame as `points` (it rides `shiftToOrigin`'s translation, exactly as
     * `labelX`/`labelY` and `clusters[].label` do).
     *
     * Distinct from the last control point: when an end carries an arrow the
     * spline is SHORTENED to leave room, and the arrow spans from the terminal
     * control point out to this point. A consumer drawing its own arrowhead
     * reads the tip here instead of extrapolating one.
     *
     * Present only when that end actually has an arrow (C `eflag`) — which
     * requires the input edge to have declared `attributes.arrowhead`. Absent
     * otherwise, and upstream treats absence the same way: `JsonCurve.java:72
     * -82` nulls `ep` on the calloc-zero point and `#drawCurve` draws no arrow
     * at all when it is null.
     *
     * `sp` (the tail-end counterpart) is deliberately NOT republished: the
     * engine exposes it, but upstream's only consumer stores it and never
     * reads it (`JsonCurve.java:55,73-76` assign `sp`; nothing uses it), so
     * plumbing it here would add a field no faithful consumer can justify.
     */
    epX?: number;
    epY?: number;
    spline?: boolean;
    reversed?: boolean;
  }>;
  width: number;
  height: number;
  /** G5 C2: real per-cluster bbox from graphviz's own subgraph-cluster
   *  layout (@knowvah/dot-engine's `getLayout().clusters`, see
   *  docs/graphviz-issues/06-cluster-bbox-not-in-getlayout.md's RESOLVED
   *  note) — keyed by `DotInputCluster.id` (re-mapped from @knowvah/dot-engine's own
   *  `cluster<N>` naming by `graph-layout-build.ts#addClusters`'s
   *  `ClusterIndex`, NOT @knowvah/dot-engine's internal name). `x`/`y` are the
   *  top-left corner in the SAME origin-shifted frame as `nodes`/`edges`
   *  (`shiftToOrigin` applies the identical node/edge-derived translation to
   *  these boxes too — clusters never participate in DERIVING that
   *  translation, only in receiving it, so pre-existing node/edge output is
   *  byte-identical for every caller that ignores this field). Absent when
   *  the input graph carried no `clusters` (mirrors `DotInputGraph.clusters`
   *  itself being optional) — additive, no existing consumer reads this yet.
   *  Replaces the entity-vs-cluster wrap APPROXIMATION named in G4 §S1/S3/S6
   *  ("mechanism 16") and `state-composite-geo.ts#materializeCluster`'s own
   *  fixed-`BOX_PAD` bounding box.
   *
   *  T7 (`plans/namespace-cluster-box/`, docs/graphviz-issues/14's RESOLVED
   *  note): `label` is the cluster title's placed position + measured size,
   *  from `@knowvah/dot-engine@1.5.0`'s own `ClusterGeometry.label`
   *  (`getLayout().clusters[].label`) -- present only when the input cluster
   *  declared a title (`DotInputCluster.titleTableWidth`/`.titleTableHeight`
   *  or plain `.label`, `graph-layout-build.ts#addClusters`). Absent exactly
   *  when the box carries no title -- there is no upstream `set`-flag gate
   *  to mirror (dot-engine's own doc comment on `ClusterGeometry.label`:
   *  presence is gated on existence alone, matching `emit.c:3920`'s lack of
   *  a `->set` test). **`x`/`y` are the label space's CENTRE, in the SAME
   *  origin-shifted frame as the box `x`/`y` above -- NOT a corner.** A
   *  consumer that treats `label.y` as a top-left corner draws the title off
   *  by roughly half its own height. */
  clusters?: Array<{
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    label?: { x: number; y: number; width: number; height: number };
  }>;
}
