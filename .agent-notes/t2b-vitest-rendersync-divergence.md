## Observation: renderSync(markup) differs between vitest and jiti-run scripts for the same cached fixture

- **Context**: T2b (cdd6, ink-walk-reuses-draw), writing a vitest regression
  test for `unknown/gubeca-19-lemu434` (`file n [ ... {{yaml ... }} ... ]`).
  `npx jiti plans/class-divergence-drive/tools/render-diff.mts
  unknown/gubeca-19-lemu434` measures `svg/@width` = 211 (matches jar) after
  the T2b titleAlignment fix. A vitest test calling `renderSync` with the
  IDENTICAL markup (read from the same cached `in.puml` file), the same
  `WidthTableMeasurer`, and the same `assetStore`/`includeStore` construction
  (`combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore())`,
  `fixtureIncludeStore()`) measured `svg/@width` = 194 instead.
- **Finding**: The divergence is reproducible and stable (194 every run,
  under `npx vitest run <file>`), not a flaky/random value. Not yet root-
  caused — did not instrument further given the task's time budget. Ruled
  out: markup content (byte-identical file read in both harnesses); measurer
  class; assetStore/includeStore construction (matched render-diff.mts's own
  `renderFixture` exactly). Suspect: a module-load-order or registration
  side effect specific to `src/index.ts`'s nested-diagram-renderer wiring
  (`registerNestedDiagramRenderer`/module-level singleton) that behaves
  differently under vitest's transform pipeline vs `jiti` — NOT instrumented
  or confirmed, a suspicion only.
- **Impact**: Any FUTURE unit test for a `{{ }}`-embedded-diagram fixture's
  exact SVG dimensions must be verified against the `render-diff.mts`
  CLI first; do not assume a vitest-based `renderSync` regression test will
  reproduce the same number. This task's own regression test for the
  titleAlignment fix (gubeca/jixibu) was DROPPED for this reason — verified
  only via the CLI tool, not a committed vitest test.
- **Confidence**: High that the divergence exists and is reproducible;
  Low on the root cause (not instrumented).
