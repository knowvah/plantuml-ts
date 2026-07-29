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

## ADR-5 AMENDMENT — the gate is a diff-count baseline, not a byte-freeze

**Maintainer decision, 2026-07-29, after T1 measured the population.**

**Context.** ADR-5 assumed a conformant population existed inside the blast
radius to freeze. T1 measured it: **0 of 22** candidates reach zero-diff
under `DeterministicMeasurer`. Verified independently — the census reports
57 zero-diff component+usecase fixtures and none is a candidate, while the
48 already-pinned goldens still pass, ruling out harness breakage. Group 1
fails on the package/cluster `[childCount]` gap open since T19; groups 2-3
fail because `src/diagrams/description/` has no creole block-separator
support at all.

There was also a flaw in the original shape: it would have byte-frozen the
very fixtures ADR-1 is *supposed to change*, so T4 would have had to
re-baseline them. The freeze value was always in the UNAFFECTED fixtures —
and those are the 48 goldens already pinned, which do watch general
description rendering.

**Decision.** Replace the freeze with a **monotone-improvement ratchet**:
pin each of the 22 fixtures' CURRENT diff count; a rise is a failure; a
fixture reaching 0 is promoted into `ratchet.json` as a real byte-exact
golden.

**Consequences.** ADR-5's intent — watch the renderer through ADR-1 — is
served by the population that actually exists, and T4's riskiest change
becomes measurable instead of invisible. Costs one new ratchet shape.
Rejected: proceeding on the 48 goldens alone (leaves the blast radius
unwatched); and blocking on the package/cluster gap first (converts an
open follow-on of unknown size into a prerequisite).

## ADR-7 — `TextBlockLineBefore` gets ONE owner in `src/core/`, now

**Maintainer decision, 2026-07-29, correcting T2a's premise.**

**Context.** T2a states `TextBlockLineBefore` "does NOT exist in this port."
False in substance. `src/diagrams/class/class-body-enhanced-layout.ts` (347
lines) cites `BodyEnhancedAbstract#decorate`, `TextBlockLineBefore.java`,
and `UHorizontalLine.java`, and records its offsets as jar-verified
byte-exact against `fecolo-08-gepu579`, `jajebo-21-dada557`, and
`pacagu-24-nune023` (G2 N42; derivation in `plans/g2-class-svg/ledger.md`).
`renderer-body-enhanced.ts` reproduces `drawU`'s title!=null draw order.
The arithmetic is ported — in class-body-geometry shape, with no `src/core/`
owner the description engine can share.

**Decision.** Port `TextBlockLineBefore` into `src/core/klimt/shape/` from
the Java as the single canonical owner, **and rewire `src/diagrams/class/`
to consume it in this mission.** One owner immediately.

**Consequences.** Closest to "upstream architecture is authoritative — and
rewrites are allowed": a structural divergence is itself the bug, and two
independent encodings of the same jar-verified arithmetic is that
divergence. Accepts real risk — this puts the class ratchets (219/708
sizing, 708 DOT-EQUAL) and the class SVG goldens in the blast radius of a
mission scoped to description, so **the class ratchets become STOP
conditions for T2a exactly as the description ones are.** Rejected:
time-boxed duplication with a tracked follow-on (defers the divergence and
history says the follow-on is what slips); and extracting the class-side
code instead of re-porting (it carries class-body assumptions — rows,
trees, dividers — that a general `TextBlock` must not inherit).

## ADR-8 — Port the creole `Display`/`Sheet` layer as a prerequisite

**Maintainer decision, 2026-07-29, after T2b stopped at the wall.**

**Context.** T2b found that both concrete bodies bottom out in unported
code, and stopped rather than guess. Verified against the Java:
`BodyEnhanced1.buildTextBlock` constructs `MethodsOrFieldsArea`
(`BodyEnhanced1.java`, private `buildTextBlock`); `BodyEnhanced2.getTextBlock`
calls `display.create9(...)` → `create0` → `getCreole` → `SheetBlock1`.
Sizes: `Display` 796, `SheetBlock1` 241, `SheetBlock2` 132, `Sheet` 82,
`MethodsOrFieldsArea` 442.

T2b's *reading* was right; its *conclusion* was not. It proposed either a
foundational port or "an ADR-level decision to build a scoped substitute"
— but that substitute already exists and is documented as such at its own
definition: `EntityImageDescriptionSupport.ts#buildTextBlock`, "scoped
substitute for `BodyFactory.create2`/`create3`" (mission E2r), already
covering `\n`-split assembly, the creole stripe/atom pipeline, inline
style runs, the `==` heading cascade, `<img>`/`<$sprite>` atoms, and
word-wrap via `Fission`.

**Decision.** Do NOT compose on the scoped substitute. **Port the real
layer** — `Display`, `Sheet`, `SheetBlock1`, `SheetBlock2` — as a
prerequisite, then resume T2b on it. Maintainer guidance, standing for the
rest of this mission: **a faithful port overrides a short-term patch.**

**Consequences.** This mission stalls at batch 3 while a new gating batch
(3a) lands a cross-cutting layer that sequence, class, and note paths will
also eventually use — so the cost is front-loaded, not wasted. Rejected:
composing on the substitute (cheaper and bounded, but permanently encodes
a divergence at the exact seam this mission line exists to make faithful);
and porting a narrow description-only text path (a THIRD encoding of the
text-block layer, the second-builder shape ADR-1, ADR-2 and ADR-7 all
reject).

**Smaller than its raw line count.** The lower creole layer is already
ported — `Fission` (275), `Stripe`, `Stencil`, `StripeStyleType`,
`atom/Atom`, the full `command/` chain, `StripeSimple` (289),
`CreoleStripeSimpleParser`. Verified present for the dependency set:
`TextBlockMemoized`, `MinMax`, `ClockwiseTopRightBottomLeft`,
`UGraphicStencil`, `TextBlock`. Verified MISSING and in scope:
`LineBreakStrategy`, `CreoleMode`, `CreoleContext`, `XRectangle2D`,
`Ports`/`WithPorts`.

**Note on `Ports`/`WithPorts`.** `SheetBlock2` implements them. T2a
deliberately dropped them from `TextBlockLineBefore` as unreachable. Batch
3a must decide once, explicitly, and record it — not drop them a second
time by reflex.

## Accepted loosening (maintainer-approved)

**SVG drift in T4 is acceptable IF jar-verified.** Drift that matches the
jar is the port working; unverified drift is a regression. Freezing today's
SVG entirely would block the port from ever becoming faithful.
