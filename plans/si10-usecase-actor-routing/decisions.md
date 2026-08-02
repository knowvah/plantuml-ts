# Architecture Decisions — si10-usecase-actor-routing

Four decisions, made 2026-08-01 from measured evidence. **Treat every
decision here as locked.** If you discover a conflicting constraint, STOP and
log it to `decision-journal.md` — do not silently override.

ADR-2 and ADR-4 constrain more than deletion. Read those two even if you skip
the rest.

## ADR-1 — `measureUsecase` survives; only its class-engine caller goes

**Context.** The SI10 row promises "the analytic substitute retired."
`measureUsecase` has TWO live callers: the class engine (unconditional) and
the description engine (guarded by `hasUnroutedUsecaseMarkup`). Probe B
(both guard branches disabled) measured **widened 2** — the `<latex>` branch
is genuinely load-bearing, not merely permanent-by-policy.

**Decision.** Close the class-engine caller and remove the inert sprite
branch. `measureUsecase`, `measureActor`, `usecase-footprint.ts` and
`footprintBoxes` all REMAIN, reachable via `<latex>`.

**Consequences.** The mission-index row's "retired" clause is re-scoped by T5
rather than restated. Deleting any of those symbols is stop condition 9.

**Rejected.** Full retirement (offered to the maintainer as option C and
declined) — it needs a home for latex-bearing usecases and is entangled with
a permanent, maintainer-approved divergence.

## ADR-2 — The description engine owns USymbol sizing; the class engine calls in

**Context.** Upstream sizes usecase/actor via `EntityImageDescription`
regardless of which diagram type hosts them. This port has the
`EntityImageDescription` port in the DESCRIPTION engine, and the class engine
reimplements the routing decision instead of sharing it. `CLAUDE.md` holds
that upstream's engine boundaries are authoritative and that a structural
divergence IS the bug.

**Decision.** `leaf-sizing.ts` exports ONE purpose-built entry point for
usecase/actor leaf sizing. The class engine calls it and keeps building its
own `MeasuredClassifier` shape (`rows`, `dividerYs`) around the returned
`Dim`. The class engine does not synthesise a `DescriptiveNode` at its own
call site, and `measureEntityLeaf` is not exported raw.

**Consequences.** One owner for the formula, two consumers. The class engine
keeps its own row/divider composition, which is genuinely class-specific.
Future USymbol work lands in one place.

**Rejected.** Exporting `measureEntityLeaf` directly (leaks a
`DescriptiveNode`-shaped contract and an `applyMinWidthFloor` flag the class
engine has no basis to set); duplicating the faithful call into the class
engine (the divergence this mission exists to remove).

## ADR-3 — The tautological routing test is rewritten, never deleted

**Context.** `tests/unit/description/leaf-sizing-widen-routing.test.ts`
asserts `expect(routed).toEqual(viaOldPath)` for a multi-line sprite display.
While the guard exists, `measureLeafNode` LITERALLY CALLS `measureUsecase`,
so that assertion is true by construction. It pins routing, not a
jar-verified number — which is why it was the only test that failed when the
guard was probed off, and why its failure said nothing about correctness.

**Decision.** Rewrite it to assert the NEW routing's actual dimensions as
literal numbers, so it can fail if the geometry moves. Deleting it, or
relaxing it to a tautology against the new path, is stop condition 11.

**Consequences.** The suite gains a test that can actually fail. The
rewritten numbers must be captured from a real run and stated as literals,
not derived at test time from the code under test.

## ADR-4 — Authored fixtures measure the gap; they do not claim conformance

**Context.** ZERO of 310 class goldens contain `usecase`, `actor`, or
`allowmixing`, so this path has no regression guard at all — the same hole
that let `svg-sprite-nanoparser` ship sprites rendering as nothing through a
fully green suite. `CLAUDE.md` mandates authoring fixtures. But class
conformance is low (the census went `0/718 → 29/718`), so a NEW usecase
fixture arriving zero-diff is optimistic, not assumable.

Separately: SI9's authored-fixture registration does NOT reach this corpus.
`dot-sync-fixtures.ts`'s `GOLDEN_DIR` is hardcoded to
`oracle/goldens/svg-description`, and `authoredFixtures` expects a
`<type>/<slug>/` shape; class goldens are `oracle/goldens/svg-class/<slug>/`.
So an authored class fixture cannot obtain the `parity-class.json` entry the
ratchet's DOT-EQUAL eligibility rule requires.

**Decision.** T3 authors fixtures, captures jar oracles, and **MEASURES the
delta**, recording it in the journal. The guard is a dedicated test that
fails if our output changes. If a fixture measures zero-diff, say so and note
it is ratchet-INELIGIBLE for the registration reason above. If it does not,
record the delta honestly and pin a clearly-labelled characterisation guard —
**never present our own output as a jar oracle** (stop condition 12).

**Consequences.** The mission delivers a real regression guard without
claiming a conformance win it did not measure. Extending SI9's registration
to the class corpus becomes a named follow-up (T4), not silent scope.

**Rejected.** Skipping fixtures because the path is uncovered (the exact
reasoning `CLAUDE.md` forbids); extending `dot-sync-fixtures.ts` inside this
mission (SI9-shaped work in another subsystem, and it would make T3 depend on
a second engine's registration path).

## Rollback classification

**Reversible** — revert the commits. No data model, no migration, no
published API surface, no persisted state. `measureUsecase` remains present
throughout, so reverting restores the old routing exactly.

## Public API impact

**None.** `measureUsecase`, `measureActor` and `measureEntityLeaf` are
internal; `src/index.ts` exports none of them. No versioning, dual-write or
deprecation window is warranted.
