# Architecture Decisions (pre-made — treat as LOCKED)

Approved by the maintainer at planning time. If you discover a conflicting
constraint, STOP and log it in `decision-journal.md`. Do not silently
override.

## ADR-1 — Wire `BodyFactory` at `EntityImageDescription`

**Context.** Since T6 the SIZER already routes through
`EntityImageDescription.calculateDimensionSlow`, and the RENDERER has
always used it.
**Decision.** Wire `BodyFactory` there, serving both paths from one place.
**Consequences.** One text-block builder, not two. Rejected: a sizer-only
shim — it would mean two builders and recreate exactly the divergence this
line of work exists to close. Cost: this change is renderer-wide, which is
what ADR-5 exists to gate.

## ADR-2 — Ink reaches the footprint via optional fields on `AtomImageResolver`

**Context.** `AtomImageResolver` (`creole-atoms.ts:120`) returns
`{href, width, height}`; the use-case footprint must fit to INK, not the
declared box (T6 narrowing #2).
**Decision.** Add optional `inkX/inkY/inkWidth/inkHeight` to its return.
**Consequences.** Additive and non-breaking — absent fields mean today's
behaviour — and it mirrors `SpriteSvg`, which already carries exactly these.
Rejected: a parallel resolver, i.e. a second channel for one fact, which is
the `inkSprites` mistake the last mission just deleted.

## ADR-3 — Do NOT add a `defaultFont` seam; thread the EXISTING one

**Context.** T6 recorded "the shared `buildLine` has no `defaultFont`
seam." **That is wrong and was verified wrong at planning time.**
`buildLineAtoms(line, font, imgFallbackFont?)` already exists
(`StripeSimple.ts:279`, added by S1L-h) and threads end-to-end inside that
file — but **no caller outside it ever passes the argument**, so it always
defaults to the line font.
**Decision.** Thread the diagram-default font from `buildTextBlock` down.
Add no new API.
**Consequences.** Deliverable (c) shrinks from "add a seam" to "wire the
seam that exists." Note the shape: a seam built and never wired is the same
lock-step defect this whole mission line is about — it recurred inside the
fix for its own bug class.

## ADR-4 — Port `decorate`'s separator path faithfully; S1L-i closes with it

**Context.** `BodyEnhancedAbstract.decorate` (lines 106-118) builds titled
separators via `TextBlockLineBefore`, and BOTH `BodyEnhanced1.getArea` and
`BodyEnhanced2.getArea` carry the separator loop. S1L-i (3 fixtures) was a
separate tracked sub-mission.
**Decision.** Port it faithfully. S1L-i closes as a consequence. Requires
porting `TextBlockLineBefore`, which does not exist here.
**Consequences.** Mission scope grows by one class and three fixtures.
Rejected: stubbing the separator branch to keep mission boundaries tidy —
that is the refactor-while-porting antipattern `CLAUDE.md` forbids, and the
stub would be an invisible divergence.

## ADR-5 — SVG goldens are a GATING batch, authored before any port

**Context.** 4 `svg-description` goldens exist against 352 size goldens.
ADR-1 changes text-block construction for every description diagram's
RENDERED output, and the size/DOT ratchets only watch the sizer.
**Decision.** Author SVG goldens first, from the pinned oracle jar, for the
11 known-affected fixtures, S1L-i's 3 separator fixtures, AND existing
separator-bearing fixtures (enumeration is part of T1).
**Consequences.** Converts an invisible risk into a gate. `CLAUDE.md`: the
corpus is a starting point, not a ceiling — author fixtures to cover gaps.

## ADR-6 — Widen the routing as its own final batch

**Context.** T6 landed one large routing change plus four narrowings in a
single commit, which made "did the port break it, or did the widening?"
unanswerable without re-running.
**Decision.** Port with routing UNTOUCHED (batches 2-4; the ratchets must
not move at all), then widen separately (batch 5).
**Consequences.** A ratchet movement always has exactly one candidate
cause. Costs one extra batch boundary; buys a clean bisect on the riskiest
change in the mission.

## Accepted loosening (maintainer-approved)

**SVG drift in T4 is acceptable IF jar-verified.** Drift that matches the
jar is the port working; unverified drift is a regression. Freezing today's
SVG entirely would block the port from ever becoming faithful.
