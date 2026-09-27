# T1: class census renders via renderSync (D3)

**Prior observations.** Census and `renderSync` disagree on luzive, sadamo and
sokevu because the census forces `parseClass` and skips the dispatcher's
entity-collision guard (cdd4 journal 22–23, T4, T13). The survey renders with
`renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore, includeStore })`
(`scripts/svg-parity-survey.ts:263-290`). The census's class pass renders with
`renderFixtureClass` and `DeterministicMeasurer`.

**Task (TDD).**
1. Write a failing test in `render-fixture-class.test.ts`. For luzive-62, sadamo-18
   and sokevu, `renderClassFixture(markup, new DeterministicMeasurer(), opts)` must
   equal `renderSync(markup, { measurer: new DeterministicMeasurer(), ...opts })`
   byte-for-byte. Read each fixture from `test-results/dot-cache/class/<slug>/in.puml`.
   Assert a specific property as well: the census verdict for each equals its
   `parity-class.json` verdict.
2. Implement `renderClassFixture` (contract in `overview.md`). It is a thin wrapper;
   do not re-derive theme or annotations. `renderSync` already does that.
3. In `scripts/svg-conformance-census.ts`:
   - the `class` pass uses `renderClassFixture`, with the same asset store and
     include store the survey builds (import or share them; do not copy);
   - it also walks `test-results/dot-cache/unknown/<slug>` for slugs whose
     `oracle/goldens/svg-conformance/routing-baseline.json` row (`type: unknown`) has
     `ourType === 'CLASS'`;
   - output rows gain `tree: 'class' | 'unknown'`;
   - object/state/other passes are unchanged.
4. Run the class census before and after on the T0f tree. Journal the counts:
   - previously census-0 class fixtures that now differ: each needs a mechanism
     (stop 5);
   - luzive, sadamo and sokevu must now agree with the survey.

**Write-set:** `tests/oracle/svg-conformance/render-fixture-class.ts`,
`tests/oracle/svg-conformance/render-fixture-class.test.ts`,
`scripts/svg-conformance-census.ts`.
**Read-set:** `scripts/svg-parity-survey.ts:40-80,263-320`;
`scripts/svg-conformance-census.ts:100-260`; `render-fixture-class.ts:1-130`;
`decisions.md#D3`; `src/index.ts` (the `RenderOptions` type).

**Boundaries.** Never change `renderFixtureClass`'s behaviour; the object census uses
it. Never touch `src/`. Ask first (halt) if `renderSync` cannot take a measurer for
some fixture.

**Acceptance.**
- Given luzive, sadamo and sokevu, when censused, then each verdict equals the
  survey's.
- Given the class bucket, when censused before and after, then no census-0 fixture
  rises without a journaled mechanism.
- Given an unknown-bucket CLASS slug, when censused, then its row has
  `tree: 'unknown'`.

**Quality bar:** four gates; 90/90/90 coverage on the changed test helper.
**Commit:** `test(cdd5-T1): census class fixtures through renderSync`. The body gives
the why (D3) and the before/after census counts.
**Observability:** N/A. **Rollback:** Reversible.
