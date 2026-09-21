# Releasing

Manual procedure — there is no release workflow yet (tracked as a
follow-up). No version has been published to npm as of this writing.

## 1. Version bump

Bump root and every workspace package **together, in the same commit**:

- `package.json` `version`
- Every `packages/*/package.json` `version`
- Every `packages/*/package.json` `peerDependencies["@knowvah/plantuml-ts"]`
  — keep the caret range's floor equal to the new root version (e.g. root
  `0.3.0` → peer range `^0.3.0`). `tests/architecture/packages-peer-range.test.ts`
  fails the build if any workspace package's peer range does not cover the
  root version — run `npm test` after bumping to confirm.
- `packages/stdlib-all/package.json` `dependencies` on `@knowvah/plantuml-stdlib`,
  `@knowvah/plantuml-stdlib-aws`, `@knowvah/plantuml-stdlib-tupadr3`, and
  `packages/all/package.json` `dependencies` on `@knowvah/plantuml-stdlib-all`,
  `@knowvah/plantuml-sprites-archimate`, `@knowvah/plantuml-emoji` — bump these
  ranges too if those packages' own versions moved.

## 2. CHANGELOG

Add an entry to `CHANGELOG.md` under a new version heading, moving the
relevant `[Unreleased]` content there (Keep a Changelog format, already in
use).

## 3. Build

- `npm run build` — root library (`vite build` → `dist/`).
- `npm run build:stdlib` — regenerates every `packages/{stdlib,stdlib-aws,
  stdlib-tupadr3,stdlib-all}/generated/` tree from the current stdlib source
  (`scripts/build-stdlib-packages.ts`), then runs `npm run build` again and
  `npm run typecheck --workspaces --if-present`. **Required before publishing
  any `stdlib*` package** — those packages ship `generated/`, which is
  gitignored and has no per-package `prepack` step that regenerates it; only
  this root script does.
- `emoji`, `sprites-archimate`, `stdlib-aws`, and `stdlib-tupadr3` each have
  their own `prepack: npm run copy-assets`, which `npm publish`/`npm pack`
  runs automatically for that package's vendored `assets/` — no manual step
  needed for those.

## 4. Gates

Run all four from the repo root before publishing anything:

```
npm run typecheck
npm run lint
npm run build
npm test
```

`npm run test` includes the `docs/catalog.md` drift gate — if exports
changed, run `npm run catalog` first and commit the result.

## 5. Publish order

Publish the root package first — every workspace package's `peerDependencies`
requires it, and `devDependencies["@knowvah/plantuml-ts"]: "file:../.."`
locally satisfies the peer during development but not after publish. Then
publish workspace packages in dependency order:

1. `npm publish` (root, `@knowvah/plantuml-ts`) — `prepublishOnly` runs
   `npm run build` first.
2. `npm publish -w packages/stdlib -w packages/stdlib-aws -w packages/stdlib-tupadr3 -w packages/emoji -w packages/sprites-archimate`
   (leaf packages — no dependency on each other).
3. `npm publish -w packages/stdlib-all` (depends on the three `stdlib*`
   packages published in step 2).
4. `npm publish -w packages/all` (depends on `stdlib-all`,
   `sprites-archimate`, and `emoji`, all published by step 3).

Every workspace package's `publishConfig` is already `{ "access": "public",
"registry": "https://registry.npmjs.org/" }`, so no extra flags are needed.

## 6. Tag

```
git tag v<version>
git push origin v<version>
```

## 7. Deprecating a bad release

```
npm deprecate @knowvah/plantuml-ts@<version> "<reason; point at the fixed version>"
```

Repeat per affected workspace package if the defect also shipped there.
Deprecation does not unpublish — npm's unpublish window is 72 hours and
should only be used for genuinely broken/secret-leaking releases.
