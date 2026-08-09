# Observations: SI12 (eager-module removal) and its follow-ups

## Observation: gitignored generated state makes a warm `npm test` prove nothing
- **Context**: SI12 batch 2 — four parallel tasks moved tests off the removed
  eager modules and onto the shipped `packages/*/assets/` copy.
- **Finding**: `packages/*/assets/` is gitignored and populated only by each
  package's `scripts/copy-assets.mjs` (`prepack`); `packages/*/generated/`
  only by vitest `globalSetup`. Batch 2 left three test files touching
  `assets/` concurrently in parallel workers — two writers
  (`stdlib-packages.test.ts`'s `beforeAll`, and `stdlib-package-files.test.ts`
  via `npm pack` → `prepack`) and one reader
  (`stdlib-remote-e2e.test.ts`, summing it for its baseline).
  `copy-assets.mjs#copyBundleAssets` opens with `rmSync(destDir)` and its
  `isUpToDate()` guard is file-COUNT based, so it short-circuits ONLY when
  the copy is already complete; during any partial state it returns false and
  deletes a tree another worker is mid-copy or mid-read of. The full suite
  passed green on a warm tree. Cold (`rm -rf packages/*/assets`) it failed
  3/3, and the e2e baseline read 8,195,997 / 7,399,179 / 8,315,921 B instead
  of 19,850,300 B — a *silently wrong measurement*, not just a failure.
- **Impact**: **CI is cold; your tree is not.** Any change touching
  `packages/*/assets/` or `packages/*/generated/` must be verified with
  `rm -rf packages/stdlib-aws/assets packages/stdlib-tupadr3/assets &&
  npm test`, at least twice (one cold pass can get lucky). The structural fix
  is always to populate in `globalSetup` before any worker spawns — not to
  lock or retry inside the script. Same class as the si11a `generated/` race
  that `tests/helpers/build-stdlib-globalsetup.ts`'s header documents.
- **Confidence**: High (reproduced 3/3 cold; fixed and re-verified 3× cold
  plus an independent 4th run, all landing on 19,850,300 B / 99.693%).

## Observation: the packages' type-check gate was vacuous, and hid a broken public type surface
- **Context**: Following up SI12's recorded README-import-convention item.
- **Finding**: `scripts/build-stdlib-packages/emit-module.ts` and
  `emit-remote-manifest.ts` hardcoded `DTS_IMPORT` as
  `from 'plantuml-ts'`, so EVERY generated `.d.ts` in all four packages
  carried the pre-scope specifier — while every package declares
  `peerDependencies: {"@knowvah/plantuml-ts": "^0.1.0"}` and
  `node_modules/plantuml-ts` does not exist. A consumer could not resolve
  `BundleData` or `StdlibRemoteManifest` from any package. Introduced by
  `9f189912` ("chore: move all packages to the @knowvah scope"), which
  renamed the packages but missed these two constants.
  **Why nothing caught it:** each package's `tsconfig.json` sets
  `include: ["generated/**/*.d.ts"]`, so every file it checks IS a
  declaration file, and `packages/tsconfig.base.json` set
  `skipLibCheck: true` — which skips declaration files. The project's own
  `npm run typecheck --workspaces` therefore checked nothing, contradicting
  `build-stdlib-packages.ts`'s header claim that each package's tsconfig
  "type-check[s] the resulting `.d.ts` files against `plantuml-ts`'s
  `BundleData` export". Proved by re-running with `--skipLibCheck false`:
  immediate `TS2307: Cannot find module 'plantuml-ts'`.
- **Impact**: `skipLibCheck` is now `false` in `packages/tsconfig.base.json`
  (~0.26s per package, measured) so the gate is real, and
  `tests/unit/stdlib-dts-import-specifier.test.ts` asserts every bare
  specifier in a generated `.d.ts` is a package that manifest actually
  declares — that guard runs in `npm test`, which `npm run build:stdlib` is
  not part of. **Do not restore `skipLibCheck: true` in that file**; it makes
  the whole packages project a no-op. When adding a generated-output emitter,
  check whether any gate actually reads its output.
- **Confidence**: High (verified both directions — reverted the emitter,
  regenerated, watched the new guard go red naming all five files, then
  restored).

## Observation: `packages/*/generated/*.d.ts` byte-pins are legitimate to move; the `.js` pins are not
- **Context**: The specifier fix tripped `stdlib-eager-omission.test.ts`'s
  sha256 pins.
- **Finding**: Exactly five bundle `.d.ts` digests changed. All five `.js`
  digests and both `index.*` digests were untouched — `index.d.ts` has no
  bare import, and `.js` files carry no type import at all.
- **Impact**: That split is a useful narrowness check. A change that claims
  to touch only the `.d.ts` import line and moves ANY `.js` digest has
  re-encoded bundle content, which is the CC BY-ND hazard for `awslib14`.
  Re-pin `.d.ts` deliberately and say why; treat a moved `.js` digest as a
  stop.
- **Confidence**: High (compared full sha256 sets before and after).
