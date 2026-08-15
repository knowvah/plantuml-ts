# Architecture decisions

All five confirmed before decomposition. Treat as locked: if a task
discovers a conflicting constraint, STOP and log it — do not silently
override.

## 1. The wrapper level is derived from upstream's predicate, not guessed

**Context.** `innerMarginLevels` drives which protection subgraphs wrap a
cluster, and each level adds graphviz's 8pt `CL_OFFSET` inside the box. The
level is NOT uniform across class packages: most are `p0`/base/`p1`
(level 1), but `bajotu-30-soku184` and `bejusa-95-gafo325` are
`a`/`p0`/base/`i`/`p1` (level 2), and `cocube-46-tusu692` is MIXED — three
clusters at level 1 and one at level 2.

**Decision.** Port `isThereALinkFromOrToGroup` (`ClusterDotString.java:91-98`):
`a`/`i` fire when an edge in the cluster's scope has the GROUP itself as an
endpoint. Validate the derived level against all 126 cached `svek-N.dot`
files, which spell the answer out per cluster.

**Rejected.** Reusing `buildDotClusters`'s existing `anchors` map as the
signal. It is a plausible implementation and `bajotu` (`p1 --> cl2`)
supports it, but `cocube` has two endpoint packages and only one level-2
cluster, so a naive "the package is a link endpoint" reading is already
contradicted. Use the map only if it is shown to agree with all 126.

**Rejected.** Hard-coding 1. Disproven by the three fixtures above.

**Consequences.** The riskiest part of the mission becomes a mechanical
check with an exhaustive oracle. If the predicate is wrong, T2 fails loudly
rather than shipping boxes that are 8px off.

## 2. `computeTitleTableHeight` moves to a shared module

**Context.** It lives in `src/diagrams/state/state-composite-header.ts:111`.
The class engine needs the same formula for its cluster title table.

**Decision.** Move it under `src/core/`, imported by both engines.

**Rejected.** Class importing from `src/diagrams/state/` — no other seam
makes one diagram engine depend on another. Duplicating the formula — this
repo has been burned by duplicated constants (see `CONTAINER_KINDS` in
CLAUDE.md).

**Consequences.** Adds a state file to the write-set. The move must be pure:
every state test byte-identical.

## 3. The padding constants are deleted — with a proof obligation

**Context.** `NAMESPACE_SIDE_PADDING` (16) and `NAMESPACE_TOP_EXTRA` (13)
exist only to approximate what the cluster box already knows. Neither has an
upstream citation, and the "never fit a value" rule says an uncited constant
is unfinished work.

**Decision.** Delete both, CONTINGENT on proving no package draws a box while
having no cluster. `buildDotClusters` filters empty namespaces and
`buildNamespaceGeos` skips when there are no members; empty packages appear
to take `renderEmptyPackageLeaf` instead. That is unproven.

**Consequences.** If the proof fails, keep the minimum needed as a fallback
WITH an upstream citation, and say so in the commit message. This is the one
failure mode that could lose output rather than misplace it.

## 4. The title position comes from the cluster too — SUPERSEDED (2026-08-14, T7)

**SUPERSEDED, with the owner's approval.** This decision describes STATE's
mechanism, not a package's. `Cluster#setTitlePosition`/`xyTitle` — the
`DotStringFactory.java:436-439` read cited below — is consumed only by
`Cluster#drawUState` and `#drawSwinLinesState` (`Cluster.java:439,497`),
both state/swimlane paths. A class or object package leaves `Cluster#drawU`
into `ClusterDecoration.drawU` (`Cluster.java:357-373`), which never reads
`xyTitle`; `USymbolFolder#asBig` draws the title at a FIXED symbol-local
`UTranslate(4, 2)` from the box corner (`USymbolFolder.java:228`),
independent of wherever graphviz placed the title-table reservation.

Measurement agrees with the reading: wiring `cluster.label` into the class
title position moved every titled namespace's `<text>` down 2px and cost
333 matched shapes (25403 → 25070, document sizes unchanged at 769).

What survives: the `1.5.0` bump, `ClusterGeometry.label` surfaced through
`mapClusters` onto `DotLayoutResult.clusters[]`, and the centre→top
conversion asserted at the seam — ready for the state-side consumer that
genuinely needs graphviz's placed position. The class path keeps
`getTitleBaselineOffset`, which mirrors `USymbolFolder`'s fixed offset.

The original decision follows, unedited, for the record.



**Context.** `DotStringFactory.java:436-439` reads the title polygon and
hands it to `Cluster#setTitlePosition`. We instead re-measure the title with
a `StringMeasurer`.

**Decision.** Adopt upstream's mechanism. This overrides the planner's
recommendation to defer.

**Dependency, at decision time.** `ClusterGeometry`
(`@knowvah/dot-engine/src/api/geometry.ts`) exposed only
`name`/`x`/`y`/`width`/`height`. The engine DOES compute the
position — `placeGraphLabel` (`position-bbox.ts:208-217`, a port of
`postproc.c:place_graph_label`) walks every non-root cluster and sets
`g.info.label.pos`, and `position.ts:190` calls it during dot positioning —
it simply is not published. Filed as
`docs/graphviz-issues/14-cluster-label-position-not-in-getlayout.md`.

**Resolved.** `@knowvah/dot-engine@1.5.0` shipped the field on 2026-08-15,
verified against its published `.d.ts`. Two deltas from the request, both
upstream's call and both correct: `label.x`/`label.y` are the label CENTRE
(the box's own `x`/`y` is a corner, and `render()`'s `<text>` is a baseline —
three conventions in one object), and presence is gated on existence rather
than on the label's `set` flag, because C draws cluster labels on existence
alone (`emit.c:3920` has no `->set` test, unlike `emit_edge_label:2891`).

**Consequences.** Nothing blocks. T7 bumps the dependency from `^1.4.0`.

## 5. The DOT change and the geo change are separate commits

**Context.** They are independently reviewable and independently revertable,
and the repo's convention is one commit per task.

**Decision.** T4 (DOT) and T5 (geo) land separately, with the measurement
gate applied to the PAIR rather than to each.

**Consequences, stated so they are not discovered.** After T4 alone the
measurement numbers DIP: layouts shift by the new wrapper margins while
`buildNamespaceGeos` still applies the old member-bbox padding. T4's spec
records the dip; it is not a stop condition. Every other fall is.
