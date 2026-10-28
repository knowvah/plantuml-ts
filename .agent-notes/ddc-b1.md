## Observation: a byte harness must carry the same asset store as the survey
- **Context**: ddc batch-1 close; T1b's files port showed 1 `g[1][childCount]` diff per row through `diff-one.mts` while the agent measured 0.
- **Finding**: emoji artwork comes only from `RenderOptions.assetStore` (ADR-2); `scripts/svg-parity-survey.ts` renders with `SURVEY_ASSET_STORE` (sprites + emoji + utility), but T0b's `renderFixtureFiles` passed none, so the emoticon reserved its width (`FEntry.java:124-129`) and drew nothing. `render-fixture-gantt.ts` solves it with a module-level `buildEmojiAssetsStore()` default; `render-fixture-files.ts` now does the same.
- **Impact**: any new per-engine render helper for an engine that draws emoji or sprites must default `assetStore` to the survey's artwork, or its golden ratchet can never admit a row the survey calls conformant.
- **Confidence**: High

## Observation: the extension pins are our own extended-mode render, not jar oracles
- **Context**: `tests/oracle/svg-conformance/extensions.ratchet.test.ts` went red on 4 `files-*` rows after the files port.
- **Finding**: the `.svg` beside each `tests/fixtures/extensions/<slug>.puml` is `renderSync(source, { measurer: new DeterministicMeasurer() })` (extended mode, no asset store, `extensions.ratchet.test.ts:32,53`). A faithful port of the engine changes every pin; the three behavioural assertions (differs from the twin, differs from jar-compatible, twin equal in both modes) stay green. Re-pin with that exact call.
- **Impact**: an engine port's close must re-render that engine's extension pins; do not treat the red as a regression.
- **Confidence**: High

## Observation: routing/refusal gates demand a clone row per golden dir, for every family
- **Context**: pinning 3 json + 1 yaml goldens at the b1 close.
- **Finding**: both gates walk `oracle/goldens/svg-<family>/<slug>/` and require a `tree: goldens, type: svg-<family>` row; the mission's `repin-files-routing.mts --type <json|yaml|hcl|files>` writes them (and re-measures the family's dot-cache rows in place). `scripts/pin-corpus-tree.ts` cannot (it expects `in.svg`, is append-only, and cannot repair a stale row).
- **Impact**: every golden pin in a json-family engine needs the `--type` re-pin plus the two gates' running-count bumps (manifest, agree, rendering).
- **Confidence**: High
