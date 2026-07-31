# Decision Journal — si11b-bootstrap-sprite-splitting

Append one row per non-trivial judgment call. "Non-trivial" means: a
reasonable developer might have chosen differently.

Also log here: quality-gate results per batch, any brief line-number
correction, every measurement the brief asks you to record, and every STOP
with its full output.

**T1 must record the measured gzip size of the emitted name list.**
**T6 must record the measured payload — T7 quotes it rather than the brief's
~98.7% projection.**

| Date | Task | Decision | Rationale |
|---|---|---|---|
| 2026-07-31 | planning | Mission brief created | SI11b registered as a tracked row when SI11a closed; planned the same day |
| 2026-07-31 | planning | **ADR-1 overturned the mission's founding premise** | SI11a's notes and the SI11b index row both stated this mission "requires transforming a vendored file" and a carve-out from SI5b's checksummed-copy rule. Checking the code showed fragments can be DERIVED into the package tree exactly as SI11a derives `.remote.js` and its asset copy. The vendored file is never written and **`vendor-stdlib --verify` needs no change** — which removes the reason SI11b was called the dangerous half. Method rule 2 applied to the mission's own premise |
| 2026-07-31 | planning | **ADR-2 is an allowlist, not a denylist — and the reason is measured** | Only **8 of 34** bundles carry a `license` field in `assets/stdlib.manifest.json`. `bootstrap1.13.1` is `"MIT License"`; **`awslib14` carries NO license field**, its CC BY-**ND** status living only as prose in `packages/stdlib-aws/LICENSES.md`. A denylist would therefore fail **OPEN** on precisely the bundle where deriving a modified work voids the grant |
| 2026-07-31 | planning | **ADR-3 INVERTS SI11a's ADR-3, on measurement** | All 2,078 bootstrap sprite names are unique, lowercase and filesystem-safe — **zero uppercase**, versus 890 of 891 `awslib14` paths carrying uppercase. So path-by-convention works here where it could not there. Measured: name list **7,289 B gzip** vs key→path map **12,201 B**. That 40% saving matters disproportionately because the manifest floor DOMINATES the payload at small N (a 3-sprite diagram: ~8.8 KB vs ~13.7 KB) |
| 2026-07-31 | planning | Constraint 2 (sync sprite lookup) **verified, not assumed** | `addSprite` is `byName.set` (`sprite-commands.ts:71`), `getSprite` is `Map.get` (`:78`), and `matchSpriteCommand` is called from each diagram plugin's PARSER over preprocessed lines. No await exists at lookup and `renderSync` must stay sync — so loading must be prefetch-driven. Recorded so SI11b's executor does not re-derive it |
| 2026-07-31 | planning | ADR-5 = (a)+(b) on maintainer direction; whole-file fallback REJECTED | Prefetch sees raw source plus fetched include text, **not** macro-expanded text, so a `<$name>` built by a `!define` is invisible to the scan. A whole-file fallback would silently restore the 1.06 MB the mission exists to remove — and would do so for exactly the diagrams most likely to be large |
| 2026-07-31 | planning | **ADR-7 added mid-planning on maintainer request**, and its shape was set by a measurement | Asked for a dev-mode collision warning. Found `SpriteRegistry.skippedColorSprites` already collects diagnostics **and is surfaced nowhere** — asserted in exactly one unit test. Copying that pattern alone would have built a warning no consumer ever sees. Hence two halves: collect on the registry, surface via an injected `onWarning` callback. `process.env` is forbidden in `src/`, and a gated `console.warn` is an uninterceptable, untestable global side effect |
| 2026-07-31 | planning | T1 bundles the splitter AND its generator wiring into ONE task | SI11a split the equivalent work and the emitters shipped **unreferenced** — `npm run build:stdlib` produced nothing, the tests passed anyway because they called the emitter directly, and repairing it cost a stop-condition-12 escalation. T1's acceptance criterion 4 asserts the BUILD emits, not that the function works |
