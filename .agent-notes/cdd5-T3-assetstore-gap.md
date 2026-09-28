## Observation: state/sequence/activity/json have NO assetStore seam in src/, not just in the test harness

- **Context**: cdd5 T3 ("forward assetStore in four fixture renderers") asked
  me to mirror `render-fixture-class.ts`'s cdd4-T4 pattern (add `assetStore?`
  to `render-fixture-{state,sequence,activity,json}.ts`, forward it to the
  production parse call each engine's `renderSync` path uses).
- **Finding**: for all four engines, the production parse call the fixture
  helper is supposed to mirror does not exist — `options.assetStore` is
  dropped before it ever reaches the parser, not merely unforwarded in the
  test harness:
  - `src/diagrams/state/index.ts:20-22` — `parse(block) { return
    parseState(block); }`, and `parseState(block: UmlSource)`
    (`src/diagrams/state/parser.ts:345`) has no options parameter at all;
    `createSpriteRegistry()` is called with zero args
    (`src/diagrams/state/parser.ts:315`).
  - `src/diagrams/sequence/index.ts:25-27` — `parse(source: UmlSource) {
    return parseSequence(source.lines); }`; `parseSequence(lines)`
    (`src/diagrams/sequence/parser.ts:378`) takes only `readonly string[]`;
    `createSpriteRegistry()` zero-arg at
    `src/diagrams/sequence/sequence-parse-helpers.ts:129`
    (`makeDefaultAST()`, itself parameterless).
  - `src/diagrams/activity/index.ts:19-21` — `parse(block) { return
    parseActivity(block); }`; `parseActivity(block: UmlSource)`
    (`src/diagrams/activity/parser.ts:83`) has no options parameter;
    `createSpriteRegistry()` zero-arg at
    `src/diagrams/activity/parser.ts:91`.
  - `src/diagrams/json/index.ts:28-30` — `parse(source) { return
    parseJson(source); }`; `parseJson(source: UmlSource)`
    (`src/diagrams/json/parser.ts:78`) has no options parameter;
    `createSpriteRegistry()` zero-arg at `src/diagrams/json/parser.ts:84`
    (same shape at `src/diagrams/yaml/parser.ts:43,49` and
    `src/diagrams/hcl/parser.ts:309,314`).
  - Corroborated in-repo: `src/diagrams/description/index.ts:59-61`'s own
    doc comment says outright "ADR-2's asset channel reaches the parser
    here and nowhere else" — description and class
    (`src/diagrams/class/parser.ts:316-318`) are the ONLY two consumers of
    `internalSpriteStoreFrom`/`internalEmojiStoreFrom` anywhere in `src/`
    (grep confirmed, zero other call sites).
  - Empirically verified (not just static reading): `renderSync(markup, {
    measurer, assetStore })` vs `renderSync(markup, { measurer })` produce
    **byte-identical** output for a `sprite $N jar:archimate/network` +
    `<$N>` fixture in state, sequence, activity, and json diagrams (probed
    directly, diff = empty in every case). `registry.resolve()`
    (`src/core/dispatcher.ts:317-327`) DOES pass `options` generically to
    every `plugin.parse(source, options)` call — the drop happens inside
    each of the four plugins' own `.parse()` wrapper, which simply never
    declares/reads the second parameter.
- **Impact**: this is a `src/` production gap (four plugins + their
  parsers need `ParseOptions.assetStore` wired through, mirroring
  `class/parser.ts:316-318`), not a test-harness lag. T3 as scoped
  (test-harness-only, never touch `src/`) cannot forward something that
  does not exist downstream — doing so in the fixture renderer would
  silently diverge the harness from `renderSync`, which is the exact
  failure mode `render-fixture-class.ts`'s own "cdd-close-b7" doc comment
  warns against. No fixture-renderer or test changes were made; the
  actual fix belongs in a new `src/`-scoped task (wire `options?.assetStore`
  through `statePlugin.parse`/`sequencePlugin.parse`/`activityPlugin.parse`/
  `jsonPlugin.parse`/`yamlPlugin.parse`/`hclPlugin.parse` and their
  parsers' `createSpriteRegistry()` calls), after which T3's original
  fixture-forwarding work becomes a direct mirror of
  `render-fixture-class.ts:106` and `render-fixture-class.test.ts:47-63`.
- **Confidence**: High (static read of every call site + `grep` for all
  `internalSpriteStoreFrom`/`internalEmojiStoreFrom` callers + a live
  `renderSync` before/after diff for all four engines).
