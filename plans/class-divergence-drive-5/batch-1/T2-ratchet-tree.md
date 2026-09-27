# T2: class ratchet `tree` field and `pin-goldens --tree` (D4)

**Prior observations.** `pin-goldens.mts` copies from
`test-results/dot-cache/class/<slug>/`, appends `{slug, addedAt, source}` to
`oracle/goldens/svg-class/ratchet.json` without re-sorting (the tamper test mutates
`fixtures[0]`), and clones routing/refusal twin rows. Its test pins `gatula`,
which is already pinned, so the test is stale (cdd4 journal 23).

**Task (TDD).**
1. `ratchet.json` entries gain an optional `tree: 'class' | 'unknown'`, where absent
   means `class`. Do not rewrite existing entries.
2. `class.golden.ratchet.test.ts`:
   - resolve each entry's golden at `svg-class/<slug>/` (class) or
     `svg-class/unknown/<slug>/` (unknown);
   - render with T1's `renderClassFixture(markup, new DeterministicMeasurer(), opts)`,
     with the asset store and include store the survey uses;
   - the test name includes the tree.
   Write the failing test first: a synthetic ratchet entry with `tree: 'unknown'`
   resolves to the unknown path.
3. `pin-goldens.mts --tree <class|unknown> <source-tag> <close-label> <slug...>`:
   - copy from `dot-cache/<tree>/<slug>/`;
   - write goldens under the tree path;
   - append `tree` when it is `unknown`;
   - clone the twin rows from the `dot-cache`/`<tree>` row.
   For `unknown`, refuse a slug whose routing row is not `ourType: CLASS`.
   Validate everything before writing (existing contract).
4. Update `pin-goldens.test.mts` with fresh examples: pick a still-unpinned
   survey-conformant slug at run time, or a synthetic fixture tree, so the test
   cannot go stale again.
5. Add the tree layout to `oracle/goldens/svg-class/README.md`.

**Write-set:** `tests/oracle/svg-conformance/class.golden.ratchet.test.ts`,
`oracle/goldens/svg-class/ratchet.json` (schema only, no new pins),
`oracle/goldens/svg-class/README.md`, `$T/pin-goldens.mts`, `$T/pin-goldens.test.mts`.
**Read-set:** `$T/pin-goldens.mts`, `class.golden.ratchet.test.ts`, `decisions.md#D4`,
`batch-1/overview.md#interface-contracts`.

**Boundaries.** Never pin a fixture in this task; T5 does that. Never re-sort
`ratchet.json`. If T1 has not merged, code against the contract and run once T1 lands.

**Acceptance.**
- Given an entry without `tree`, then it reads as `class` and the existing 706+
  pins stay green.
- Given `pin-goldens --tree unknown <slug>` on a CLASS-routed conformant slug, then
  the golden lands at `svg-class/unknown/<slug>/` and the ratchet test holds it.
- Given `--tree unknown` on a non-CLASS slug, then the run aborts with no file written.

**Quality bar:** four gates, plus `npx vitest --config $T/vitest.config.mts`. Check the
collected file count (memory: vitest-filter-can-collect-nothing).
**Commit:** `test(cdd5-T2): key the class ratchet by tree`.
**Observability:** N/A. **Rollback:** Reversible.
