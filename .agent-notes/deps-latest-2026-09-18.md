# Dependency sweep to latest (2026-09-18)

## Observation: vite-plugin-dts logs three TS errors on every build, pre-existing
- **Context**: `npm run build` on the sweep branch printed TS2591/TS2503 for
  `src/core/include-resolver-node.ts` (`node:fs/promises`, `node:path`,
  `NodeJS` namespace) from the `[unplugin:dts]` step, exit code still 0.
- **Finding**: a fresh worktree of main with `npm ci` prints the identical
  three lines, so this predates the sweep. `npm run typecheck` is clean
  because the root tsconfig loads @types/node by default; the dts plugin's
  compiler host evidently does not. The emitted `dist/plantuml-ts.d.ts` is
  still produced.
- **Mechanism (diagnosed 2026-09-18, fixed same day)**: not the plugin.
  TypeScript 6.0 changed `types` to default to `[]`, so node_modules/@types
  is no longer enumerated. `tsc --explainFiles` on the root program shows
  `@types/node` arriving only as "Type library referenced via 'node' from
  vite/dist/node/index.d.ts", i.e. transitively through tests/ and demo/.
  A src-only program (`extends` root, `include: ["src"]`) reproduces the
  three errors with plain tsc; adding `"types": ["node"]` clears them.
  Ruled out: the plugin's custom compiler host (DTS_DISABLE_SOURCE_FILE_CACHE=1
  swaps in ts.createCompilerHost and the three lines remain).
- **Fix**: `"types": ["node"]` in tsconfig.json, the release notes' own
  migration line. Build now logs zero TS diagnostics.
- **Confidence**: High (reproduced with tsc alone, fix verified).

## Observation: VitePress 1.6.x cannot run on Vite 8
- **Context**: root `vite` moved to 8.3.0 (rolldown). The `overrides.vitepress.vite`
  entry that forced Vite 7 into VitePress was raised to 8 in the same pass.
- **Finding**: `docs:build` fails: `Failed to load transformWithEsbuild ...
  migrate to transformWithOxc`, plus "assigns to bundle variable ... not
  supported by Rolldown" from the vitepress plugin. VitePress `latest` is
  1.6.4; 2.x is alpha only. Keeping the override at `^7.3.6` gives VitePress
  its own nested Vite 7 while the library build uses Vite 8; docs build clean.
- **Impact**: the override must stay on 7 until VitePress 2 is `latest`.
  Dependabot's minor-and-patch group does not touch `overrides`.
- **Confidence**: High.

## Observation: vitest 5 changed the custom-matcher augmentation surface
- **Finding**: `Assertion` gained a second type parameter, so the one-param
  augmentation in `tests/helpers/svg-assertions.ts` failed to merge.
  Augmenting `Matchers<R, T>` with vitest's exact parameter list fixes it.
- **Confidence**: High.
