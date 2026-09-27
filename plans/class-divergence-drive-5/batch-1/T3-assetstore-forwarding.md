# T3: forward `assetStore` in the state/sequence/activity/json fixture renderers

**Prior observations.** cdd4 T4 fixed this for class only. See
`render-fixture-class.ts:40-110` and its test "assetStore forwarding (cdd4-T4)".
Without the store, a `jar:` sprite resolves to zero width, and the census
under-measures.

**Task (TDD).** For each of `render-fixture-{state,sequence,activity,json}.ts`:
1. Mirror the class pattern. Add `assetStore?` to the options each function takes,
   and forward it to the parse (or `registry.resolve`) call that the production path
   gives it to. Read the production plugin's `parse` signature to find where it goes.
2. Write a test per renderer (new `render-fixture-<e>.test.ts` or the existing one)
   with a minimal fixture using a `jar:` or stdlib sprite. Without the store the
   sprite is absent; with it, the sprite's `<g>`/`<image>`/path is present. Assert on
   the specific element.
3. Where the census calls these renderers, pass the store. **Stop:** that edit is in
   `scripts/svg-conformance-census.ts`, which T1 owns. Record the one-line change
   each call site needs in your report instead; the orchestrator applies it at T5.

**Write-set:** `tests/oracle/svg-conformance/render-fixture-{state,sequence,activity,json}.ts`
and their tests.
**Read-set:** `render-fixture-class.ts:40-110`, `render-fixture-class.test.ts:40-80`.

**Acceptance.**
- Given a `jar:` sprite fixture per engine, when rendered with the store, then the
  sprite element is present; without it, absent.
- Given the full suite, then green.

**Commit:** `test(cdd5-T3): forward assetStore in four fixture renderers`.
**Observability:** N/A. **Rollback:** Reversible.
