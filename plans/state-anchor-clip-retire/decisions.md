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
