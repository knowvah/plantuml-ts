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
- **Impact**: harmless today but it is noise that will hide a real dts
  error. Fix candidate for its own PR: give the dts plugin `types: ['node']`
  (or a dedicated tsconfig) and confirm the lines disappear.
- **Confidence**: High (reproduced on main).

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
