# T0b tooling — render-diff, render-all, pin-diff

Mission-scratch dev tools for the `class-divergence-drive` mission. They are
NOT part of the main build/test surface: `tsconfig.json`'s `include` is
`["src", "tests", "demo"]`, `tsconfig.node.json`'s adds only
`scripts/**/*.ts`, the root `vitest.config.ts`'s `include` is
`tests/**/*.test.ts`, and `npm run lint` runs eslint on `src tests demo
scripts` only — `plans/` reaches none of these. Invoke every tool as
`npx jiti plans/class-divergence-drive/tools/<tool>.mts ...` from the repo
root (`tsx` is not installed in this repo; `jiti` is, at `node_modules/
.bin/jiti`).

## render-diff.mts

```
npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug...>
```

For each class-corpus slug (a directory name under
`test-results/dot-cache/class/<slug>/`): reads `in.puml`, renders it through
the exact production call `scripts/svg-parity-survey.ts:268-271` uses
(`renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore:
buildSpriteAssetsStore() })`, with the asset store built ONCE per process),
writes the result to `measurements/out/<slug>.ours.svg`, copies the cached
`in.svg` to `measurements/out/<slug>.jar.svg`, then compares the two with
`tests/oracle/svg-conformance/compare.ts#compareSvg` (tolerance class
`'deterministic'`) and prints the structural diff count, the numeric diff
count, and every individual diff line (`S`/`N` prefixed). Ported from the
diagnosis seed `diagnosis/scratch-render-one.ts`, with the seed's hardcoded
`REPO` constant replaced by a location-relative resolution
(`resolveRepoRoot`, exported and tested).

## render-all.mts

```
npx jiti plans/class-divergence-drive/tools/render-all.mts <out.json>
```

Renders every cached class fixture the same way `render-diff.mts` does and
classifies each one with `scripts/svg-parity-survey.ts#diffVerdict` (imported
directly — its CLI dispatch is guarded by an `import.meta.url ===
pathToFileURL(process.argv[1]).href` check, so importing it runs no
top-level side effect). Writes a `RenderAllRow[]` array, sorted by slug, to
`<out.json>`:

```ts
interface RenderAllRow {
  slug: string;
  verdict: 'conformant' | 'structural-match' | 'diverged' | 'errored' | 'timeout';
  structural: number;
  numeric: number;
  firstDiff?: string;
}
```

Fixture discovery mirrors `listFixtureDirs`
(`scripts/svg-parity-survey.ts:211-224`): a directory counts only if `.done`,
`in.puml` and `in.svg` all exist, sorted by `slug.localeCompare`. Unlike the
production survey (which farms fixtures out to persistent `jiti` worker
subprocesses under a per-fixture timeout, `svg-parity-workers.ts`), this tool
renders every fixture IN-PROCESS with no timeout or isolation — a hang
upstream hangs this tool, and a crash produces an `errored` row via a
try/catch rather than corrupting the run (measured: 723 fixtures in ~8.6s on
the reference machine).

## pin-diff.mts

```
npx jiti plans/class-divergence-drive/tools/pin-diff.mts <a.json> <b.json>
```

Prints, per slug present in either file: verdict transitions (`a.verdict ->
b.verdict`), `dotEqual` flips (only when BOTH files carry the field —
`parity-class.json`'s `FixtureRow` does, `render-all.mts`'s `RenderAllRow`
does not), and diff-count rises where `b.structural + b.numeric >
a.structural + a.numeric` (only when both files carry those two fields, i.e.
both are `render-all.mts` output). A slug present in only one file is always
printed (`+`/`-` prefixed), never silently dropped (D11). Accepts either a
`ParityReport` object (`{ generatedAt, fixtures: FixtureRow[] }`,
`parity-class.json`'s shape) or a bare `RenderAllRow[]` array on EITHER side,
independently. This is a report, not a gate: it always exits 0, even when it
finds transitions — adopting a rise is a human/close-task decision (D11).

## Running the tests

These `*.test.mts` files are not collected by `npm test` (see above), so run
them with the mission-local vitest config committed alongside the tools:

```
npx vitest run --config plans/class-divergence-drive/tools/vitest.config.mts
```

`vitest.config.mts` pins `root` to its own directory (computed from
`import.meta.url`, never a hardcoded path) so exactly the three
`*.test.mts` files here are collected — a bare `include: ['**/*.test.ts']`
without a scoped `root` matches from the invocation's cwd and pulled in the
entire `tests/` tree (750+ files) the first time this was tried.

The test files use `.test.mts`, not the more usual `.test.ts`: the repo's
`lint-staged` config (`package.json#lint-staged`) runs a typed `eslint --fix`
over every staged `*.{ts,tsx,mjs,js}` file on commit, and no tsconfig's
`include` reaches `plans/`, which makes a typed ESLint rule throw rather than
fail cleanly (the same failure mode `eslint.config.ts` already documents for
`docs-site/**/*.ts`). `mts`/`cts` are not in that glob, so `.mts` avoids it —
consistent with every prior mission's `plans/**/tools/*.mts` CLI files, which
never carried a `.test.ts` sibling to trip this. See
`.agent-notes/cdd-T0b.md`.

## Type-checking

Also outside `npm run typecheck`'s two programs. Check with the ad-hoc
program committed alongside the tools:

```
npx tsc --noEmit -p plans/class-divergence-drive/tools
```

`tools/tsconfig.json` extends the repo's `tsconfig.node.json` (DOM lib +
Node16 module resolution, matching how `scripts/` type-checks against
`src/`) and adds `allowImportingTsExtensions: true`, since the tools import
their `.mts` siblings by literal extension and this program only ever runs
`--noEmit`.
