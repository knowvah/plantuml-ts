# Architecture decisions — state-anchor-clip-retire (SI32)

Locked at planning, 2026-08-19. A task that finds a conflicting constraint
**stops and journals it** (stop 8) rather than silently overriding.

## D1 — The clip is a whole-collection pass mirroring `DotStringFactory.solve`

**Context.** Three placements were considered: (A) clip at each construction
site with node geos in hand, mirroring `description/layout-geo-post.ts
#clipEdgePoints`; (B) clip inside `buildLevelTransitionGeos` from
`result.clusters`; (C) a generic post-pass over the assembled `StateGeometry`.

A looked most like our own faithful precedent and is the one to argue for on
instinct. It is wrong here, for a reason that is in the Java rather than in
taste. `DotStringFactory.solve` (`svek/DotStringFactory.java:441-467`) sets
node and cluster positions from the graphviz SVG, and only THEN loops:

```java
for (SvekEdge line : getBibliotekon().allLines())
    line.solveLine(svgResult);
```

The clip lives inside `solveLine` (`SvekEdge.java:671-672`). It is a separate
pass over ALL edges, run after cluster geometry is final — it must be, because
the loop immediately above it is what calls `cluster.setTitlePosition(...)` and
finalises the very rectangles `lhead.getRectangleArea()` / `ltail
.getRectangleArea()` return. `SvekResult` — whose `calculateDimension` is the
ink walk and whose `drawU` draws — is constructed afterwards
(`GraphvizImageBuilder.java:287-289`).

**Decision.** Port that loop: a named pass over all transitions, run once after
node geometry is final and before any consumer. Not per-construction-site, and
not a generic "post-pass" — it is `solve`'s edge loop and should be named and
documented as such, so the two sibling passes it brackets have an obvious home
if they are ever ported.

**Why this is also the safe option, not a trade against safety.**
`buildLevelTransitionGeos` has SIX call sites across four files
(`state-composite-concurrent.ts:189,:438`, `state-composite-cluster.ts:271`,
`state-composite-geo.ts:498`, `state-composite-autonom.ts:267,:285`), takes
`(acc, result)` with no node geos, and **two of them pass a shifted result**.
Option A would mean getting the coordinate frame right in six places. A single
pass over final geometry has one frame by construction.

**Consequences.** Clip rectangles keep today's provenance (see D2), so the only
behavioural variable is "the drawn path is now clipped too" — which is what
makes the manifest diff interpretable. One new named function; the ink walk
loses `clipTransitionPoints`.

## D2 — Clip rectangles stay derived from materialized `StateNodeGeo`

**Decision.** Keep `collectAnchorRects`'s existing provenance (materialized
`StateNodeGeo` x/y/width/height, keyed by `zaentId`). Do **not** re-derive them
from raw `result.clusters`.

**Consequences.** Changing provenance and timing in one mission would make any
movement ambiguous — a fixture that moved could not be attributed to the clip
rather than to a differently-computed rectangle. Isolation is the point.

## D3 — Arrowheads consume the clipped path (settled upstream, not chosen)

`SvekEdge.java:671-672` **reassigns** `dotPath = dotPath.simulateCompound(...)`,
and `:679-684` builds both extremities from `dotPath.getStartPoint()`,
`dotPath.getEndPoint()` and their angles — i.e. from the clipped path.

**Decision.** `transitionArrowheadInk` and `buildTransitionArrowhead` read the
clipped points. Their present raw-points behaviour is not a design choice to
preserve; it exists only because T5's clip was ink-only, and it dissolves once
`TransitionGeo.points` is clipped.

**Consequences.** Arrowhead placement moves wherever the head end clips. That
is jar-ward and expected; it is also why this mission's manifest movement will
exceed SI31's.

## D4 — Nothing in the state engine retains the unclipped path

Upstream keeps exactly one pre-clip copy — `dotPathInit = dotPath.copy()`
(`SvekEdge.java:658`, commented "Used for Kal") — consumed only for Kal
positioning at `:1071-1075`. `Kal` (`svek/Kal.java`) is not ported for state;
`kal1`/`kal2` appear in this port only in `core/abel/LinkArg.ts`, for class
diagrams' `[Qualifier]` association ends.

**Decision.** No unclipped copy is kept. If a consumer that genuinely needs one
surfaces, that is **stop 9** — not a reason to keep a second point array.

## D5 — Labels are not re-derived from the clipped path

Transition label position comes from the engine's own `lp` via `edgeResult`,
not from our point list, so clipping should not move labels.

**Decision.** T1 **verifies** this rather than assuming it. If labels do move,
that is a finding to diagnose and rule on, not to absorb.

## D6 — A fixture moving away from the jar is a finding, not a tuning target

**Decision.** Diagnose it to a `file:line` mechanism, journal it, and continue.
Do not tune the clip to recover the fixture.

**Precedent.** SI31's `sumiri-68-suvo696` legitimately moved 1 px away because
it carries a separate, larger, opposite-signed defect; suppressing the
source-verified rule there would have been fitting the gate to a symptom of a
different bug. The same reasoning applies here.

## Routing

Autonomous execution. **T1** (the pre-condition investigation — Java reading
and per-site proof) and **T2** (the structural change) get Opus. T0, T3, T4 get
Sonnet. Opus prompts carry the behavioural compensation from
`~/.claude/rules/parallelism.md`, **with its carve-out**: an enumerated
requirement list is not ambiguous scope, so nothing in a task's acceptance
criteria may be trimmed as over-engineering.

---

# Amendments (2026-08-19, after T1)

T1 was Batch 1's gate on D1 and it fired stop 9. The originals above are
**left standing unedited** — the record of what was decided at planning and
why is worth more than a tidy document. D1' and D2' below **supersede** D1 and
D2; where they conflict, these win. Amended by the user's ruling of
2026-08-19 after T1's STOP was independently verified by the orchestrator.

## D1' — The clip is per LAYOUT RESULT, not per diagram (supersedes D1)

**What T1 disproved.** D1 placed the clip in "one pass, after node geometry is
final and before any consumer." No such point exists in this port. The state
ink walk is not a terminal consumer: `computeSvekResultGeometry` runs
mid-assembly at `state-composite-autonom.ts:268`, and its output becomes
`childImg` (`:269-272`) → `measureAutonomWrapper` (`:274`) → that composite's
own width and height in the containing pass; `state-composite-concurrent.ts
:190` is the same shape for region stacking. A consumer of the clip therefore
*produces* node geometry.

**What the Java actually says.** D1 read `DotStringFactory.solve` correctly and
then assumed it runs once per diagram. It does not.
`dot/CucaDiagramSimplifierState.java:57-71` loops every autarkic group,
innermost first, building each with its own `GroupMakerState.getImage()` and
replacing it via `overrideImage` — so the parent sees a sized leaf, not a
group. Each of those images comes from `GraphvizImageBuilder.java:287-289`:

```java
dotStringFactory.solve(svg);                          // <- the clip loop, :456-457
final SvekResult result = new SvekResult(dotData, dotStringFactory);
```

`solve`'s edge loop is scoped to **one graphviz layout result**. Upstream has
exactly the same "consumer produces the parent's geometry" structure this port
has; that is not a divergence to fix, it is the shape to mirror.

**Decision.** One layout result's edges are clipped exactly once, at
construction: inside `buildLevelTransitionGeos` (`state-composite-pass.ts:328`)
and its flat sibling, so that every `TransitionGeo` derived from a
`DotLayoutResult` is clipped by the time anything holds it. Both consumers of
that layout — the ink walk that sizes the composite, and the stored geometry
the renderer draws — then read the same clipped path, which is the mission's
exit condition unchanged.

**On the two "shifted" call sites.** `state-composite-autonom.ts:267` and
`:285` call `buildLevelTransitionGeos` twice for the same layout (`result`,
then `shiftedResult`). That is not a double clip: each call derives a fresh
point array from `result.edges`, so each array is clipped once, against that
call's own frame. T1 proved frames agree at all seven sites and a clip is
translation-commutative.

**Consequence.** D1's rejection of "option A/B" rested on six call sites and
two coordinate frames. T1 measured the frame objection false, and the
availability objection now cuts the other way: it is the SINGLE late pass that
cannot be placed. `buildLevelTransitionGeos` is the one seam every composite
call site already funnels through, so "six places" collapses to one.

## D1'a — Labels are attached from PRE-clip points (new, protects D5)

D5 said clipping cannot move labels. T1 confirmed the conclusion and corrected
the reason: this port's `attachInlineTransitionLabel` uses `edgeResult.labelX/
labelY` only when a measurer exists, and otherwise falls back to
`perpendicularOffsetLabel(points)` (`state-transition-label.ts:386-394`), which
IS point-derived — and the measurer-less path is real. Under D1 the guarantee
was temporal and free; under D1' the clip moves INTO the function that attaches
labels, so it stops being free.

**Decision.** Inside `buildLevelTransitionGeos`, `attachTransitionLabel` is
called on the UNCLIPPED points, exactly as today; only the points stored on the
returned `TransitionGeo` are clipped. This is upstream's behaviour, not a
concession: `SvekEdge.java:742-746` takes the label position from
`getXY(fullSvg, noteLabelColor)` — the SVG's own label placement — and never
from `dotPath`, clipped or otherwise. A path-independent label is the faithful
outcome; feeding our fallback heuristic the clipped path would invent a
dependency upstream does not have.

## D2' — Clip rects come from the layout's own cluster boxes (supersedes D2)

**Why D2 cannot stand with D1'.** D2 kept the rects' provenance as materialized
`StateNodeGeo` (x/y/width/height keyed by `zaentId`). T1 established that at
three of the seven entry points — `state-composite-concurrent.ts:438`,
`state-composite-cluster.ts:271`, `state-composite-autonom.ts:285` — there are
no `StateNodeGeo`s at all, only `GeoSpec` plus raw `DotLayoutResult` nodes.
Keeping D2 makes D1' unimplementable.

**Decision.** Derive the rects from the layout result's own cluster boxes:
`result.clusters` (`graph-layout-result.types.ts:90-97`), joined to the
endpoint's `__zaent_<id>` anchor through the pass's own cluster membership
(`acc.clusters[].nodeIds`, which contains the `__zaent_` anchor — verified by
probe on `fovafu-44-mifu394`: `cluster0` → `["X","Y","__zaent_A"]`). Both are
in the same origin-shifted frame as `result.edges` by construction, and
`clusterPosMapOf` (`state-composite-geo.ts:49-51`) already consumes
`result.clusters` today, so this is an existing seam, not a new one.

**This is upstream's provenance, which D2's was not.** `SvekEdge.java:671`
passes `lhead.getRectangleArea()` / `ltail.getRectangleArea()` — `Cluster`
rectangles from the layout, not measured image boxes. D2 chose the materialized
box for isolation, and that choice is what the amendment gives up.

**Consequence, stated plainly.** This mission now changes clip-rect provenance
AND clip timing together, which is precisely the ambiguity D2 existed to
prevent: a fixture that moves cannot be attributed to one or the other by the
manifest alone. The cost is accepted by the user's ruling; the mitigation is
that T2 must diagnose each mover to a mechanism rather than inferring one from
the fact that it moved. D6 (a mover away from the jar is a finding, not a
tuning target) is unchanged and now carries more weight, not less.

## D2'a — Correction to D2's provenance claim (2026-08-19, same day)

**What was wrong with how D2' was reached.** D2' asserted that
`lhead.getRectangleArea()` / `ltail.getRectangleArea()` are "`Cluster`
rectangles from the layout, not measured image boxes". That was inferred from
the CALL SITE (`SvekEdge.java:671`) without opening `getRectangleArea()` or the
code that populates it — on a decision whose entire subject is provenance.
CLAUDE.md's most-violated rule, violated. Corrected here from method bodies
rather than quietly patched.

**The general case: D2' holds, now for a read reason.**
`DotStringFactory.java:425-434`, immediately before the `solveLine` loop, walks
every non-packed cluster, extracts its polygon from the graphviz SVG by the
cluster's own color, takes `min`/`max`, and calls `cluster.setPosition(min,
max)`; `Cluster.java:511-512` assigns `rectangleArea = RectangleArea.build(min,
max)`. So when the clip runs, the rect IS the raw graphviz cluster bbox —
which is exactly what `result.clusters[]` carries. `result.clusters` is the
faithful source.

**The exception: border-point composites.** `solveLine` mutates the rect before
clipping, for one family only:

```java
if (projectionCluster != null)
    projectionCluster.manageEntryExitPoint(stringBounder);   // :660-663
dotPath = dotPath.simulateCompound(lhead..., ltail...);      // :671
```

`Cluster.java:410-430` — `manageEntryExitPoint` reassigns
`this.rectangleArea = frontierCalculator.getSuggestedPosition()`, applying
`ensureMinWidth(getTitleAndAttributeWidth() + 10)` when the cluster has a
title. `ClusterDotString.java:101-105` sets `projectionCluster` only when
`entityPositionsExceptNormal().size() > 0` — a composite with border-point
children — and sets it on every line `isLinkFromOrTo` that cluster, i.e. the
lines whose `lhead`/`ltail` it is.

So for border-point composites upstream clips against a FrontierCalculator-
adjusted rect. It is also an order-dependent mutation of shared cluster state
inside the per-line loop: a later line clipping against the same cluster sees
the already-adjusted rect.

**Decision.** `result.clusters` (the raw box) stays the source for this
mission, including for border-point composites. Porting `FrontierCalculator`
is a second port of upstream arithmetic and is out of T2's scope. T2 must
establish whether the family is reachable for a clipped endpoint and, if it
is, record the gap as a scoped finding with measured effect — a
`DIVERGENCES.md` candidate for T3, not a silent approximation.

**Consequence.** A moving fixture whose endpoint composite has border-point
children may be moving because of the rect family rather than the timing. That
is now a third confounder alongside the provenance/timing pair D2' already
spent, and it is the reason T2's mover accounting must be diagnosed rather
than inferred.
