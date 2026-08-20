# Architecture decisions — sequence-oracle-harness (G-1 prerequisite)

Locked at planning, 2026-08-20, approved by the user the same day. A task that
finds a conflicting constraint **stops and journals it** (stop 9) rather than
silently overriding.

## D1 — Extend the `svg-conformance` family; build no new comparator

**Context.** Sequence emits no DOT, so it looked at first like it needed a
bespoke comparator. It does not. `json`/`yaml`/`hcl` are already DOT-less
members of the existing family, and `json.golden.ratchet.test.ts` says so
(ADR-3): *"the jar emits no DOT for this family, so the DOT-equal eligibility
gate the siblings use cannot be computed."*

**Decision.** Consume `tests/oracle/svg-conformance/compare.ts` and
`normalize.ts` **unchanged**. Verified engine-agnostic, not assumed:
`compareSvg(actual, reference, toleranceClass, toleranceOverride?)`
(`compare.ts:385`) and `normalizeSvg(svgString)` (`normalize.ts:231`) take
plain strings; normalize's three plantuml adaptations (style resolution,
`data-*` stripping, comment/PI skipping) are jar-wide, not per-engine.

**Consequences.** No sequence-specific normalization exists to get wrong. A
second comparator is **stop 4**. One thing to record rather than rediscover:
our `width="371.513"` vs the jar's `width="166px"` does **not** surface as a
unit mismatch — `width` is in `NUMERIC_ATTRS` and `parseFloat("166px")` is
`166`, so it normalizes to a single numeric diff.

## D2 — The gate is a diff-baseline; the golden ratchet ships empty

**Context.** Byte-identity gates nothing at zero conformant fixtures.
Measured on the simplest corpus fixture (`A0001_Test.puml`): jar 166×296 / 41
elements, ours 371.513×249 / 28 elements.

**Decision.** Mirror `description.diff-baseline.ratchet.test.ts` — a monotone-
improvement bar over recorded per-fixture diff counts. Rise → FAIL naming
fixture, baseline and new count. Fall → PASS `[IMPROVED]`. Zero → PASS
`[PROMOTION READY]`. Promotion is **never** automatic. A render error is
recorded as `status: "error"` with a reason and **never** as a numeric
baseline — a fixture that stops erroring must not read as "reached 0 diffs".
Ship `ratchet.json` with an empty `fixtures` array and `describe.skipIf`, so
the promotion path is built and tested from day one.

**Consequences.** The mission produces a gate that can fail on regression the
day it lands, without claiming any conformance it has not earned.

## D3 — Capture the full classified corpus, committed

**Decision.** Run `scripts/populate-corpus.py`'s sequence classifier
(`populate-corpus.py:20`) over pdiff's 473 `participant`/`actor` fixtures and
capture every one the jar renders into `test-results/dot-cache/sequence/`.
That path is **committed** — `.gitignore:24` excludes `test-results/*` but
`:25` re-includes `!test-results/dot-cache/`, which is why component (266) and
state (273) are tracked.

**Consequences.** ~2 MB of committed SVG, one jar run, full coverage for the
rebuild with no second capture mission. Honours CLAUDE.md's "the corpus is the
work queue **and not a ceiling**".

## D4 — The diff-baseline reads the committed cache; it does not duplicate SVGs

**Decision.** The diff-baseline ratchet reads
`test-results/dot-cache/sequence/<slug>/{in.puml,in.svg}` directly. Only
*promoted* fixtures ever get a `golden.svg` copy under
`oracle/goldens/svg-sequence/<slug>/`, exactly as in `svg-state`.

**Consequences.** Baselining 473 by copying would double ~2 MB for no gain.
Unlike description's equivalent (which reads a gitignored cache), sequence's
cache is committed, so this suite is fully offline anyway.

## D5 — The cause census is computed by committed, unit-tested code

**Context.** The user asked for a census of WHY fixtures diverge, not only
that they do — so the rebuild starts with a ranked work queue rather than 473
opaque numbers. The risk is a fast census that reads confidently and measures
wrong; that failure mode occurred **twice** in SI32 alone.

**Decision.** Buckets are derived **mechanically** from each `Diff` record's
`path` / `actual` / `expected` (`compare.ts:35`) by a committed module with
unit tests, never by agent interpretation. The bucket set is fixed here:
`missing-element`, `extra-element`, `geometry`, `text-metrics`,
`format-units`, `other`. Every bucket rule is pinned by a test over a
synthetic `Diff`.

**Consequences.** Any number in the census is reproducible by re-running, and
a reviewer can re-derive it. "Other" being large is a legitimate result to
report, not a reason to invent a bucket.

## D6 — Zero `src/` changes

**Decision.** Not one line under `src/`. The measured divergences — including
the unitless fractional `width` — are **recorded, not repaired**.

**Consequences.** The mission stays scoreable: nothing it measures can be
contaminated by something it changed. Touching `src/` is **stop 3**.

## D7 — The freshness sentinel lands in this mission

**Decision.** `tests/oracle/svg-conformance/oracle-freshness.test.ts` gains a
sequence sentinel here, not in a follow-on.

**Rationale, from that file's own doc comment.** A stale cache silently
reported false conformance (`object`, 0/80 reported vs 23/80 real), and then
**recurred** on `class`/`state`/`usecase` precisely because the guard had been
scoped to one type. A cache without a sentinel is a gate that cannot detect
its own stale input. Shipping one here is not gold-plating; shipping the cache
without it is a known, named defect.

## Routing

Autonomous execution. **T2** (the ratchet, where the gate's semantics are
decided) and **T4** (the classifier) get Opus. T0, T1, T3, T5, T6 get Sonnet.
Opus prompts carry the behavioural compensation from
`~/.claude/rules/parallelism.md`, **with its carve-out**: an enumerated
acceptance list is not ambiguous scope, so nothing in a task's criteria may be
trimmed as over-engineering.
