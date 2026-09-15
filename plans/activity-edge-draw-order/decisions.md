# Architecture decisions — `activity-edge-draw-order`

Confirmed 2026-09-15 before decomposition. Treat every one as **locked**. If
a task discovers a conflicting constraint, amend the decision here and halt
for review (stop 3) — never silently override it.

Java paths are under `~/git/plantuml/src/main/java/net/sourceforge/plantuml/`.

## D1 — Apply the lane-pass order last, permuting `edges` AND `edgeMeta`

**Context.** The renderer has no lane information (`ActivityEdgeGeo` is
points/label/color/midArrow, `activity-layout-types.ts:37-42`); the lanes live
in `EdgeMeta` (`swimlane-placement.ts:63-70`). `compressGeometry` and
`shapesOf` read `edges[i]` with `edgeMeta[i]`
(`compress/shapes-of.ts:376-377`), and `assignCoordinatesFull` returns the
pass-1 `edgeMeta` alongside whichever geometry it assembled
(`assign-coordinates-full.ts:196-212`). Compression itself is order-insensitive
(`slot-finder.ts:132` adds every shape, then `SlotSet` sorts).

**Decision.** A new `layout/edge-draw-order.ts` exports the ordering; it is
applied as the LAST step of `assignCoordinatesFull`, after compression,
permuting `geometry.edges` and `edgeMeta` together by one index array.
Rejected: permuting inside `placeSwimlanes` (would have to widen
`PlacementResult` and would run before compression for no benefit);
permuting in the renderer (would need lanes added to `ActivityEdgeGeo`).

**Consequences.** No layout type changes and no geometry moves. The shape
indices in `ALLOWED_NEW_OVERLAPS` shift, so the list is re-listed with
per-entry re-attribution. Mirrors upstream, where the passes are a draw-time
concern (`activitydiagram3/ftile/Swimlanes.java:318-355`).

## D2 — Pass membership mirrors the interceptors

**Context.** `UGraphicInterceptorOneSwimlane#draw` admits a `Connection` when
`tile1.getSwimlaneOut()` is null or equals the pass's lane AND the same holds
for `tile2.getSwimlaneIn()` (`ftile/vcompact/
UGraphicInterceptorOneSwimlane.java:92-103`), so a null lane is contained in
EVERY pass. `Swimlanes.Cross#draw` admits only connections where
`tile1.getSwimlaneOut() != tile2.getSwimlaneIn()`
(`ftile/Swimlanes.java:178-216`).

**Decision.** Mirror both. An edge whose ends resolve to one lane belongs to
that lane's pass; an edge whose ends differ belongs to the final cross pass.
An edge eligible for several passes (a null lane on either end) is placed
where T1's dump shows the jar puts it, and the answer is journaled; until T1
answers, the default is the FIRST pass it qualifies for.

**Consequences.** T1 must dump a fixture carrying a lane-less edge before any
`src/` edit (stop 4).

## D3 — Pass order is declaration order

**Context.** `Swimlanes#swimlanesSpecial()` iterates `swimlanesRaw` and
appends one empty trailing lane (`ftile/Swimlanes.java:116-124`).

**Decision.** Passes run over `ast.swimlanes` in declaration order. The empty
trailing lane is not ported: it can hold no edge.

**Consequences.** `lanePassOrder` needs only `EdgeMeta[]` and the lane names.

## D4 — Parallel order: branches, then every in, then every out

**Context.** `build` is `doStep2(inner, doStep1(inner))`
(`ftile/vcompact/AbstractParallelFtilesBuilder.java:166-169`). `doStep1`
collects a `ConnectionIn` per branch and wraps
(`ParallelBuilderSplit.java:79-111`; `ParallelBuilderFork` the same shape);
`doStep2` collects a `ConnectionOut` per branch WITH an out point
(`ParallelBuilderSplit.java:136-179`). `FtileWithConnection.drawU` draws the
delegate first, then its connections (`ftile/FtileWithConnection.java:69-74`).

**Decision.** `walkForkBranches` walks every branch (emitting each branch's
own internal edges), then pushes every in-connector in branch order, then
every out-connector for branches with `hasPointOut()`. Same for fork and
split. Node order is unchanged — top bar, branches, join bar already match.

**Consequences.** `pushBranchConnectors` splits into two per-branch helpers;
no lane, coordinate or count change.

## D5 — FILE snake merging

**Context.** `UGraphicForSnake#addPendingSnake` merges a new Snake into an
earlier pending one when `PendingSnake.merge` returns non-null, keeping the
EARLIER position (`svek/UGraphicForSnake.java:137-157`). That changes both the
jar's edge count and its order in ways this mission does not model.

**Decision.** T1 measures whether it affects the `fixtures.md` slugs. T4 files
`activity-snake-merge`. Not ported here.

**Consequences.** Some residual positional mismatch is expected to survive
this mission; it is named, not fixed.

## D6 — Diagnose first, one rule per task, one re-pin

**Context.** Two rules share one measurement surface, and the four activity
oracle gates are equality pins that break on any change. The planning
throwaway permuted `edges` without `edgeMeta`, so its numbers are direction
only.

**Decision.** T1 diagnoses with no `src/` edits and re-measures both rules
with the D1-shaped permutation; T2 lands (b); T3 lands (a) measured against
T2; the orchestrator re-pins ONCE at T4. Between T2 and T3 only the four
activity oracle gates may be red, only on `fixtures.md` slugs the journal
explains.

**Consequences.** Sequential batches; every riser costs a journal row before
its commit.

## D7 — FILE the other compounds' connector order

**Context.** Every `FtileWithConnection` draws its delegate before its own
connections, so `if`/`while`/`repeat` may have the same
internals-then-connectors divergence ours has for parallels.

**Decision.** T1 checks and reports; T4 files what it finds. No fix here.

**Consequences.** Keeps this mission's movers attributable to (a) and (b).
