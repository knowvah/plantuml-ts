# SI13 Architecture Decisions (locked)

## ADR-1: Per-type golden layout in `dot-sync-fixtures.ts`, reader-side only

**Context.** `authoredFixtures(goldenDir, type)` assumes
`<goldenDir>/<type>/<slug>/in.puml` with `GOLDEN_DIR` hardcoded to
`oracle/goldens/svg-description`. Class goldens are
`oracle/goldens/svg-class/<slug>/` — different root AND no `<type>` level
(`oracle/goldens/svg-class/README.md` documents the flat shape).

**Decision.** Teach the enumeration a per-type golden layout: type `class`
resolves to root `oracle/goldens/svg-class` with slug dirs directly under
it; every other type keeps the existing description root/shape untouched.
The existing `in.puml`-presence filter already skips the flat root's
`README.md`/`ratchet.json` entries. `mergeFixtures`' manifest-wins +
reported-collision semantics are reused as-is (for class there is no
`tests/visual/data/class.json` manifest, so `enumerateFixtures` takes its
existing authored-only branch). SI9 ADR-1's containment argument carries
over verbatim: never push markup into `tests/visual/data/*` (six other
consumers); the golden directory is the single source of truth.

**Consequences.** `dot-sync-report.ts class` and everything downstream
(cache → survey → parity → ratchet eligibility) sees authored class
fixtures with zero changes to the six manifest consumers.

## ADR-2: Parity regeneration drift protocol — regressions stop, improvements proceed with a full breakdown

**Context.** `parity-class.json` (718 rows) was generated 2026-07-18 —
before SI10/SI14/SI15, which deliberately improved class rendering.
Regeneration is a fresh measurement of every row (SI9's finding), and
SI9's precedent handled moved rows by reporting the breakdown and
proceeding on a maintainer ruling.

**Decision.** Regenerate class only, via
`SVG_PARITY_CONCURRENCY=2 npx jiti scripts/svg-parity-survey.ts --out
tests/oracle/svg-conformance/parity-class.json class` (the `--out` flag
exists exactly for this; a single-type run written anywhere shared
TRUNCATES other types — `parity-survey-truncates-unsurveyed-types`).
Before committing, produce the SI9-style breakdown vs the old file: rows
moved, deltas shrank/grew, `dotEqual` flips, verdict transitions. **Any
`dotEqual` true→false flip or any verdict downgrade on a pre-existing row
is stop condition 4.** Upgrades and delta shrinks are the expected fruit
of SI14/SI15 — journal and proceed under the SI9 precedent.

**Consequences.** The committed parity baseline becomes current; the
eligibility check runs against fresh data, not a 17-day-old snapshot.

## ADR-3: Ratchet additions are measured, authored-only, this mission

**Context.** The class ratchet (310 fixtures) requires zero diffs (AC1)
and a `dotEqual: true` parity entry (AC3). The five authored fixtures
measure 2/6/2/2/unknown diffs today. Regeneration may also reveal CORPUS
fixtures newly conformant since 2026-07-18.

**Decision.** Only AUTHORED fixtures that measure zero diffs
(`renderFixtureClass` + `DeterministicMeasurer`) AND `dotEqual: true` in
the fresh parity enter `ratchet.json`, with `source: "authored"`. Corpus
fixtures newly conformant are counted and journaled but NOT ratcheted here
— that is A2s's scope, and mixing it in defeats the smallest-honest-diff
review (SI9 ADR-3's reasoning). Expected outcome is zero additions; the
mission's deliverable is the path, and an honest "eligible-when-zero-diff"
close is success.

**Consequences.** The ratchet stays a deliberate, per-mission decision;
SI13's diff stays reviewable.

## ADR-4: Where the published numbers move

**Context.** SI9's ADR-4 pattern: only the current row updates; dated
historical numbers in other rows stay.

**Decision.** The SI13 mission-index row carries the new class parity
summary (row count 718 → 723, fresh verdict/dotEqual counts, drift
breakdown). Historical rows (A2s's dated 219/708, SI10's dated counts) are
NOT edited. `tests/oracle/svg-conformance/PARITY-SVG.md` (already stale,
asserted by no test — SI9's own finding) is out of scope; note it, don't
touch it.

**Consequences.** One honest current number, no rewritten history.
