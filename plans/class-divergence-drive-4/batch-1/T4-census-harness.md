# T4 — census harness (D7)

**Context.** `plans/class-divergence-drive-3/decision-journal.md` rows 54–55:
- bidusa and ruliki are survey-conformant but not census 0-diff, because
  the census renders without the sprite asset store.
- popesa's census diffCount is 7, because the census's low-level class
  pipeline differs from `renderSync` (likely the C-9 gradient def-id seed).
- The ratchet already renders with `fixtureIncludeStore()`
  (`tests/helpers/fixture-include-store.ts`; see
  `class.golden.ratchet.test.ts`).

**Task.** TDD.
1. Give `scripts/svg-conformance-census.ts` the same include store as the
   ratchet.
2. Diagnose popesa: diff the census-rendered SVG against `renderSync`
   output, and name the pipeline step that differs (quote it).
3. Align the census to `renderSync`'s pipeline. Never special-case a slug.

**Acceptance.**
- Given bidusa, ruliki and popesa, when censused, then diffCount is 0.
- Given all 723 class fixtures, then no census diffCount rises against the
  pre-change census; any fall is journaled.
- Given the unit test, then it covers the store being passed through.

**Observability** N/A. **Rollback** Reversible.
