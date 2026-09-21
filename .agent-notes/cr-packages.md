# code-review Batch E — packages, deps, release, license (2026-09-21)

## Observation: overrides.vitepress.vite was NOT stale
- **Context**: item 3 asked to drop `overrides.vitepress.vite: "^7.3.6"`,
  calling it stale, after verifying `@vitejs/plugin-vue`'s installed peer
  range accepts vite 8.
- **Finding**: `@vitejs/plugin-vue@6.0.8`'s peer range (`^5.0.0 || ^6.0.0 ||
  ^7.0.0 || ^8.0.0`) does accept vite 8, but that is the wrong dependency to
  check. `vitepress@1.6.4`'s own `package.json` declares
  `"dependencies": { "vite": "^5.4.14" }` for its bundled dev server,
  independent of the plugin-vue peer range. Removing the override lets
  npm resolve that nested `vite` to a version satisfying `^5.4.14`, which
  drags in `esbuild <=0.24.2` (GHSA-67mh-4wv8-2f99). Verified with
  `npm audit --package-lock-only` both ways: 0 vulnerabilities with the
  override retained, 3 (2 moderate, 1 high) with it dropped.
- **Impact**: any future dependency-cleanup pass should check what a
  nested/transitive package's OWN declared range resolves to, not just
  whether a downstream peer accepts the override's target version — the
  two can disagree even when both use the same package name.
- **Confidence**: High (both audit runs reproduced consistently).

## Observation: worktree symlinked generated/assets breaks Vitest imports
- **Context**: running the four gates after all Batch E commits.
  `npm test` failed 18 tests across 5 files, all under
  `tests/unit/stdlib-packages.test.ts`, `stdlib-all-exports.test.ts`,
  `stdlib-package-files.test.ts`, `sprite-package-files.test.ts`, and
  `tests/integration/stdlib-remote-e2e.test.ts` — none touched by this
  batch's diff (package.json/README/docs-site/RELEASING.md only).
- **Finding**: `packages/*/{generated,assets}` are symlinks whose realpath
  targets the MAIN checkout (`/Users/scottseely/git/knowvah/plantuml-ts/
  packages/...`), not this worktree. `tests/unit/stdlib-packages.test.ts:188-191`
  already documents that "Vite's dev server denies module loads outside its
  `fs.allow` root, which defaults to the workspace root" — and that root,
  for a worktree, is the worktree path, not the symlink target. Confirmed
  the file itself is intact and current: a plain Node
  `import('file://.../awslib.remote.js')` outside Vitest succeeds every
  time, and `[build-stdlib-packages]` logs show "skip -- content hash
  already matches" (no concurrent rebuild in flight) during every one of
  five reproductions. Every failure is exclusively an import reached
  through one of these two symlink trees; zero failures anywhere else in
  the 21,420-test suite.
- **Impact**: any batch running `npm test` from a worktree will see this
  same 18-test/5-file failure signature whenever its branch touches
  nothing that would explain it — it is a property of running tests from a
  worktree at all, not of any particular change. Not fixable within this
  batch's write-set (would mean editing `vitest.config.ts`'s `server.fs`,
  explicitly out of scope). Orchestrator should decide whether to special-
  case worktree test runs (e.g. real copies instead of symlinks for these
  two trees, or a `server.fs.allow` addition) rather than have every batch
  independently rediscover it.
- **Confidence**: High (five reproductions, direct Node import as a
  control, log evidence ruling out the documented cross-process race).

## Observation: README.md's own License section still claims GPL-3.0
- **Context**: found while placing item 8's KaTeX dependency note, reading
  the surrounding README sections for placement.
- **Finding**: `README.md`'s `## License` section (around line 79 at the
  batch's starting HEAD) is still GPL-3.0 boilerplate ("Copyright (C) 2024
  ... GNU General Public License..."), contradicting root `package.json`'s
  `"license": "MIT"` and the already-RESOLVED `planning/adr/ADR-002-mit-
  with-epl-dependency.md` (stay MIT, decided 2026-08-12).
- **Impact**: this is a real, user-facing licensing-statement defect, out
  of Batch E's write-set (`README.md (dependency note only)`). Not
  touched. Needs a dedicated fix.
- **Confidence**: High (direct read of both files).
