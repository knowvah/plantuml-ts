# Architecture Decisions — si9-authored-fixture-registration

All five approved by the maintainer 2026-07-31. **Treat every decision here
as locked.** If you discover a conflicting constraint, STOP and log it to
`decision-journal.md` — do not silently override.

## ADR-1 — Enumerate authored fixtures in `loadFixtures`

**Context.** `scripts/dot-sync-report.ts#loadFixtures(type)` reads only
`tests/visual/data/<type>.json`. Fixtures authored under
`oracle/goldens/svg-description/<type>/<slug>/in.puml` never enter the
pipeline, so they can never obtain a `parity.json` row and can never be
ratcheted.

**Decision.** Teach `loadFixtures` to also enumerate authored fixtures from
`oracle/goldens/svg-description/<type>/*/in.puml`, merged with the JSON
manifest and deduplicated by slug. The golden directory remains the **single
source of truth** for an authored fixture's markup.

**Rejected — and a task proposing it is a STOP.** Pasting each authored
fixture's markup into `tests/visual/data/<type>.json`. It duplicates markup
that already lives in the golden's `in.puml`, the two drift silently, and
every future authored fixture needs the same manual step — leaving the
doctrine gap open.

**The containment argument, found at trace level two.**
`tests/visual/data/*.json` is read by **six** other consumers:
`scripts/capture-corpus.ts`, `scripts/build-pages.ts`,
`scripts/classify-corpus.ts`, and four integration tests
(`json-corpus`, `json-e2e`, `json-style`, `yaml-*`). The rejected option
would push three new fixtures into all of them, including the demo page
builder. The chosen option touches only `dot-sync-report.ts`'s private
reader, so none of the six sees anything. This was not part of the original
argument for the decision; it is now the strongest one.

## ADR-2 — Fix the canonical-cache staleness check

**Context — this is why the mission is not a one-line change.**
`buildAgg` skips any fixture absent from `taggedSlugs(type, tag)`, which
reads canonical SVGs from `test-results/visual-qa-svg/canonical/<type>/`.
And `ensureCanonical` early-returns when that directory merely exists with
any `.svg` in it:

```js
if (existsSync(dir) && readdirSync(dir).some((f) => f.endsWith('.svg'))) return;
```

The canonical cache already exists locally. So ADR-1 alone would give
authored fixtures no canonical, no tag, and `buildAgg` would **silently skip
them** — the mission would appear to work while changing nothing.

**This assumption was explicitly checked rather than trusted**, per method
rule 2, precisely because "the canonicals will follow automatically" is the
shape of claim that has cost this mission line real time.

**Decision.** Make the staleness check per-slug: regenerate when any fixture
in the list lacks a canonical SVG. Self-healing for every future authored
fixture, and it removes a silent-skip failure mode that exists **today**,
independent of this mission.

**Rejected.** (B) A `--force-canonical` flag — explicit, but the default
stays silently wrong. (C) Incremental generation into the existing directory
— avoids a full rebuild, but `generateCanonical` uses `freshDir` on both
directories, so it needs restructuring for no benefit at this corpus size.

## ADR-3 — Regenerate `usecase` parity only

**Context.** `parity.json` is committed with 355 rows. Regenerating is a
fresh measurement of **every** row, not an append.

**Decision.** Regenerate the `usecase` type only. Smallest honest diff; no
other type is touched by this change.

**Rejected.** Regenerating every type — more uniform, far slower, and it
mixes unrelated drift into this mission's diff, defeating the review that
stop condition 5 exists to enable.

## ADR-4 — Where the published numbers move

**Context.** usecase DOT parity goes 90/90 → 93/93 once three `dotEqual`
fixtures join the corpus.

**Decision.** Update `planning/mission-index.md` in the **SI9 row only**. Do
**not** retro-edit the A1 / S1L rows that recorded 90/90 — those are
historical measurements with dates attached, and rewriting them would make
the record lie about what was true when it was taken.

## ADR-5 — Retire the "INTENTIONALLY NOT RATCHETED" documentation

**Context.** Two documents currently assert these fixtures are deliberately
un-ratcheted, and both become false the moment they ratchet in:
`oracle/goldens/svg-description/README.md`'s "Authored sprite fixtures —
INTENTIONALLY NOT RATCHETED" section, and
`plans/svg-sprite-nanoparser/decisions.md` § ADR-5.

**Decision.** Rewrite the README section to describe the registered state.
Append a **dated amendment** to the predecessor's ADR-5 rather than editing
it — its history stays intact and readable, consistent with how that mission
recorded its own three amendments.

## Rollback classification

**Reversible**, with one asymmetry worth stating plainly.

Code and doc changes revert with the commits. `parity.json` is generated, so
a revert restores the committed file exactly.

The asymmetry: **a ratcheted fixture is held forever by design.** Adding the
three to `ratchet.json` commits to keeping them stable under the normalized
comparator. That is the intended outcome, but it means a wrong pin is
expensive — which is why `ratchet.json` may only ever be edited *after* a
measured pass, never in anticipation of one (stop condition 3).

## No public API change

Nothing under `src/` changes. This is entirely test and script
infrastructure; `src/index.ts` is untouched. `parity.json` and `ratchet.json`
are internal test fixtures with no consumers outside the repository.
