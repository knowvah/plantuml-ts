# Decisions — sequence-text-and-y-convergence

Confirmed with the maintainer before execution. Treat every one as locked; a
conflicting constraint is a stop condition, not a licence to override.

## D1 — Text metrics are CARRIED from layout, never recomputed in a renderer

**Context.** Sequence renderers have no `StringMeasurer` — deliberately.
`textLength` needs a measured width, and the baseline needs an ascent.

**Decision.** Layout measures; the geometry carries `textWidth`,
`textAscent` and `textLineHeight`; the renderer does no metric arithmetic.

**Why not the alternatives.** Passing a measurer into `renderSequence`
contradicts its documented signature — `render-fixture-sequence.ts` states that
"every text metric it needs is already baked into the `SequenceGeometry`".
Recomputing arithmetically is **provably wrong**: the `size - size/4.5` helper
disagrees with `FixedMeasurer`, which returns `lineHeight/4.5`. Under
`FixedMeasurer(8, 16)` the true ascent is 12.444 and the helper says 10.889.
That is exactly the sizer/renderer split `planning/sizer-renderer-parity.md`
exists to prevent, and it is currently latent in
`renderer-frame-header.ts:71`.

**Consequences.** Every text-bearing geo grows three fields, `scale-geo.ts`
scales them, and the renderer becomes purely a formatter.

## D2 — `textAscent` is RETIRED on the sequence path, not consolidated

**Context.** `size - size/4.5` exists in three copies
(`state-render-colors.ts:294`, `renderer-frame-header.ts:71`,
`class-visibility-icon.ts`), jar-verified and exact for the three production
measurers.

**Decision.** D1 supersedes it here: sequence carries the ascent instead.
`renderer-frame-header.ts`'s local copy goes. The state and class copies are
**left alone**.

**Consequences.** Consolidating all three would touch state and class goldens
and is outside this write-set. Worth a separate chore; noted, not done.

## D3 — One emitter the whole engine routes through

**Context.** Eight text call sites across five files, five of them anchoring.

**Decision.** `src/diagrams/sequence/sequence-text.ts` exports `sequenceText`,
and every sequence `<text>` goes through it.

**Consequences.** The convention becomes testable in one place and a future
feature cannot silently reintroduce an anchor. A1 must add it without changing
any call site, so its correctness is provable before anything moves.

## D4 — The renderer derives the left edge from the centre

**Context.** Participant labels are centred today by `text-anchor: middle` at
`centerX`. The jar emits a left edge.

**Decision.** The renderer computes `leftX = centerX - textWidth / 2`.

**Why not carry a left edge from layout.** `centerX` is the model's
authoritative anchor; a stored left edge is a second source of truth that can
drift from it, and nothing would catch the drift.

## D5 — Re-pin ONCE, at C4

**Context.** Phases A, B and C each move goldens across most of the corpus.

**Decision.** No re-pinning until C4, after a full adjudication. The ratchet is
red from batch 2 onward and that is not a stop condition.

**Consequences.** Adjudicate at each phase close as an INSTRUMENT (A6, batch-4
close, C4) without re-pinning, so a regression is caught early without baking
anything in. `scripts/sequence-repin-snapshot.ts` supplies the fresh
`diffCount` the re-pin needs — the adjudicator's own snapshot carries none and
the re-pin silently keeps stale values.

## D6 — Phase C is gated on Phase A's recorded measurement

**Context.** `text@y` is 261 525, a quarter of all Y positional error, and is a
category error until Phase A lands.

**Decision.** C2's derivation reads the per-attribute numbers A6 records.
Phase C may not begin before then, and a **hard checkpoint** sits before batch
5: stop, report, wait.

## D7 — The instrument's axis split lands before any Y gate reads it

**Context.** `points` is the second-largest line item and mixes both axes;
split on index parity it is **76.1% Y / 23.9% X**. The previous mission's
per-attribute table therefore understated Y by roughly 287 000.

**Decision.** C1 splits `points` (exact — points are `x,y` pairs) and reports
`d` as explicitly mixed, before C3 gates on either.
