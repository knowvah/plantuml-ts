# T1i: utility image assets — serve dedication + egg images through the ADR-2 channel

Added by the orchestrator at the b1 wave (journal row 25): push-forward "a write-set the spec
under-estimated for a piece the approved task covers" (T0e vendored the dedication PNGs but
nothing serves them; T1h inlined the AppleTwo/RIP images, +242 KB, which alone nearly spends
stop 12's +250 KB mission budget). Prepend [../task-preamble.md](../task-preamble.md).
Agent: typescript-pro (sonnet).

## Task (TDD)
1. **Asset store builder.** `scripts/utility-assets-store.ts` exporting `buildUtilityAssetsStore():
   AssetStore` (+ `DEFAULT_ASSETS_*_DIR`), the `scripts/emoji-assets-store.ts` /
   `scripts/sprite-assets-store.ts` shape (Node fs, memoized): serves every `DEDICATION_IMAGES`
   entry's `assetKey` from `assets/dedication/<resource>.png`, and the egg images (item 2).
   `tests/helpers/utility-assets-store.ts` re-exports it (the `tests/helpers/sprite-assets-store.ts`
   pattern). Lift T1h's `tests/unit/dedication/dedication-store.ts#dedicationAssetStore` logic and
   make that test helper delegate to (or be replaced by) the new builder — one source of truth.
2. **Move the AppleTwo and RIP images out of the bundle.** Write the PNG bytes currently inlined in
   `src/diagrams/eggs/apple2-image.ts` and `rip-image.ts` to `assets/eggs/apple2.png` and
   `assets/eggs/rip.png` (byte-identical to what the modules decode to today); turn both modules into
   the `dedication-images.ts` shape (`{ assetKey, width, height, sha256 }`, keys `eggs:apple2.png`,
   `eggs:rip.png`); `PSystemAppleTwo`/`PSystemRIP` (+ factories) read the bytes through
   `executeLine`'s `options?.assetStore` and build the same data URI as today. Read
   `PSystemAppleTwo.java` / `PSystemRIP.java` for what happens when the image is unavailable and
   mirror the nearest upstream branch; record the choice. CHARLIE_PNG stays inline (~17 KB).
   Keep the jar-oracle tests (`tests/fixtures/utility/{apple,apple-steve-wozniak,rip}`) at 0 diffs
   with the store wired; add a sha256 check of each asset file against its module.
3. **Harness = survey.** `tests/oracle/svg-conformance/render-fixture-utility.ts#measureUtilityMarkup`
   passes the same `assetStore` the survey uses; `scripts/svg-parity-survey.ts:71` `SURVEY_ASSET_STORE`
   adds `buildUtilityAssetsStore()` to `combineAssetStores(...)`. Today the harness passes only
   `includeStore`, so its emoji/sprite/dedication rows would measure differently from the survey.
4. **Measure** `npm run build` before/after (`du -sk dist`, `dist/plantuml-ts.js` bytes) and report.

## Write-set
`scripts/utility-assets-store.ts`, `tests/helpers/utility-assets-store.ts`,
`assets/eggs/{apple2,rip}.png`, `src/diagrams/eggs/{apple2-image,rip-image,PSystemAppleTwo,PSystemAppleTwoFactory,PSystemRIP,PSystemRIPFactory}.ts`,
`tests/unit/eggs/**`, `tests/unit/dedication/dedication-store.ts`, `tests/unit/scripts/utility-assets-store.test.ts`,
`tests/oracle/svg-conformance/render-fixture-utility.ts`, `scripts/svg-parity-survey.ts` (the store line only),
`docs/catalog.md`, `.agent-notes/ufp-T1i.md`. Any OTHER file is a stop. NOT `src/index.ts`, not
`src/diagrams/eggs/PSystemColors*` (T1b, running in parallel), not `oracle/goldens/**`, not
`packages/**` (library packaging of these assets is a follow-on).

## Acceptance
- Given the authored apple/rip fixtures and `kavama-92`/`kicizi-84`, rendered with the utility
  store, then 0 compareSvg diffs.
- Given `buildUtilityAssetsStore()`, then every DEDICATION_IMAGES key and both egg keys resolve
  and their sha256 equal the modules'.
- Given the build, then `dist/plantuml-ts.js` no longer contains the AppleTwo/RIP base64 (grep a
  64-char run of each) and the size delta is reported.

**Observability:** N/A. **Rollback:** Reversible.
