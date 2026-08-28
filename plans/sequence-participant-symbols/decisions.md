# Architecture decisions — locked

Confirmed by the user 2026-08-28 during planning. Treat every one as locked.
If the Java contradicts one, **stop and amend it here in the journal first**
(stop condition 3); never silently override.

## D1 — Draw through the faithful `asSmall` path, not the simplified emitters

**Context.** Two seams exist. `src/core/usymbol-shapes.ts#renderDatabaseIcon
:91` is a *simplified* SVG-string emitter. `src/core/decoration/symbol/
USymbolDatabase.ts` is a full port with `drawDatabase`/`getClosingPath`/
`asSmall` (`:98,:108,:174`), driven through a `UGraphic`.

**Decision.** Use the faithful `USymbol.asSmall(...).drawU(ug)` path with
`UGraphicSvg` (`src/core/klimt/drawing/svg/u-graphic-svg.ts:124`) as the
adapter, mirroring `ComponentRoseDatabase.java:70`.

**Consequences.** Precedent is direct: the class engine already migrated AWAY
from the simplified emitters to the faithful path for exactly this reason —
`src/diagrams/class/renderer-usymbol-entity.ts` (SI14 T4) replaced
`renderUseCaseIcon`/`renderActorIcon` because placement is content-dependent.
Rejected: calling `renderUSymbolIcon`, which would re-create in sequence the
divergence the class engine just removed.

## D2 — The composition stays sequence-local

**Context.** Upstream has a per-type `ComponentRose*` family
(`skin/rose/Rose.java:137-190` dispatches `PARTICIPANT_HEAD` / `ACTOR_HEAD` /
`DATABASE_HEAD` / … to `ComponentRoseDatabase`, `ComponentRoseActor`, …).

**Decision.** New `src/diagrams/sequence/renderer-participant-symbol.ts`
mirroring that family, sequence-local, driving the SHARED primitives.

**Consequences.** This is the split `renderer-usymbol-entity.ts` already
documents as ADR-1/ADR-2: "route through the faithful primitives, keep the
composition engine-local". It applies to SIZING and DRAWING alike, which is
why T1 exports both entry points.

## D3 — Sizing comes from upstream's cited rules; the fitted constant dies

**Context.** `sequence-layout-participants.ts:44` has
`const DB_MIN_WIDTH = 40; // cylinders are narrower than plain boxes`, used at
`:155` with a half-width padding. No `file:line`; the comment is a fitted
rationale.

**Decision.** Replace with `ComponentRoseDatabase.java:102-105`
`getPreferredWidth = max(stickman.getWidth(), getTextWidth())` and `:96-99`
`getPreferredHeight = stickman.getHeight() + getTextHeight()`. The symbol
dimension comes from `asSmall(null, empty(16,17), empty(0,0), ctx, CENTER)` —
the `16,17` is citable at `ComponentRoseDatabase.java:70`.

**Consequences.** Participant widths MOVE on all 34 database fixtures. That is
expected and is adjudicated at the batch gate, not suppressed. Shipping the
renderer half alone is forbidden — `planning/sizer-renderer-parity.md` names
that as a recurring defect class.

## D4 — Actor is an `ActorStyle` case, NOT a USymbol case

**Context.** During planning this was initially framed as "route actor through
`USymbolActor`". **That was wrong** and is corrected here.

**Decision.** Sequence actors go through `ActorStyle.getTextBlock(biColor)`
(`ComponentRoseActor.java:64`), which returns `ActorStickMan` /
`ActorAwesome` / `ActorHollow` per `ActorStyle.java:60-71` — a different
family from `USymbols.*`. All four are already ported in `src/core/skin/`.
Thread `theme.actorStyle` (already modelled at `src/core/theme.ts:69-72`) into
the sequence engine.

**Consequences.** `grep -rn "actorStyle" src/diagrams/sequence/` returns
NOTHING today — `skinparam actorStyle awesome|hollow` is silently ignored in
sequence diagrams, so this is a feature addition as well as a re-mirror. It
touches 179 fixtures whose stick man is already count-correct and NOT
currently failing, so it is isolated in Batch 4 and adjudicated on its own,
revertible without touching Batches 1-3.

## D5 — Batch 2's two halves land together, in one batch, before anything else

**Decision.** T2 (draw) and T3 (size) are separate tasks on disjoint files but
one batch gate. `junaxa` must close at that gate.

**Consequences.** If it does not close, stop condition 6 fires: the mechanism
was wrong and the plan is re-derived, not patched. Rejected: merging T2 and T3
into one task — they touch disjoint files and parallelise cleanly, and the
shared batch gate already prevents half a change from being adjudicated.
