/**
 * `npx jiti plans/class-divergence-drive/tools/render-diff.mts <slug...>`
 *
 * For each class-corpus slug under `test-results/dot-cache/class/<slug>/`:
 * renders through production `renderSync` exactly as
 * `scripts/svg-parity-survey.ts:268-271` does (`WidthTableMeasurer` +
 * `buildSpriteAssetsStore()`, store built ONCE per process — not per
 * fixture), writes `measurements/out/<slug>.ours.svg` and copies the cached
 * `in.svg` to `measurements/out/<slug>.jar.svg`, then prints the structural
 * and numeric diff counts from `tests/oracle/svg-conformance/
 * compare.ts#compareSvg` (tolerance class `'deterministic'`, per D3 /
 * docs/parity-report.md).
 *
 * Ported from the diagnosis seed `diagnosis/scratch-render-one.ts` (T0b),
 * fixing its hardcoded `REPO` constant to a location-relative resolution
 * (T0b correction 3) — see `tools/README.md` for the mirrored upstream call
 * sites and `.agent-notes/cdd-T0b.md` for why.
 */
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { compareSvg, type Diff } from '../../../tests/oracle/svg-conformance/compare.js';

/** Repo root from this file's own location: `tools/` sits three directories
 *  below the repo root (`plans/class-divergence-drive/tools/`). A pure
 *  function of the URL so it is testable without touching the real
 *  filesystem, and so this tool never hardcodes an absolute path the way
 *  the diagnosis seed did. */
export function resolveRepoRoot(fileUrl: string): string {
  return join(dirname(fileURLToPath(fileUrl)), '..', '..', '..');
}

/** Splits `compareSvg`'s diff list the way `diffVerdict`
 *  (`scripts/svg-parity-survey.ts:166-186`) does: a structural diff has
 *  `delta === undefined`, a numeric diff carries one. */
export function splitDiffs(diffs: readonly Diff[]): { structural: Diff[]; numeric: Diff[] } {
  return {
    structural: diffs.filter((d) => d.delta === undefined),
    numeric: diffs.filter((d) => d.delta !== undefined),
  };
}

/** One printable line for a single diff, structural (`S`) or numeric (`N`). */
export function formatDiffLine(d: Diff): string {
  const kind = d.delta === undefined ? 'S' : 'N';
  const delta = d.delta === undefined ? '' : ` (Δ${d.delta})`;
  return `  ${kind} ${d.path}  exp=${d.expected} | act=${d.actual}${delta}`;
}

/** The exact upstream render call (`scripts/svg-parity-survey.ts:268-271`):
 *  `WidthTableMeasurer` + a shared, process-wide sprite asset store. */
export function renderFixture(markup: string, store: AssetStore): string {
  return renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: store, includeStore: fixtureIncludeStore() });
}

interface FixtureFiles {
  markup: string;
  oracle: string;
}

function readFixtureFiles(repo: string, slug: string): FixtureFiles {
  const dir = join(repo, 'test-results', 'dot-cache', 'class', slug);
  return {
    markup: readFileSync(join(dir, 'in.puml'), 'utf-8'),
    oracle: readFileSync(join(dir, 'in.svg'), 'utf-8'),
  };
}

function printDiffs(slug: string, pass: boolean, diffs: readonly Diff[]): void {
  const { structural, numeric } = splitDiffs(diffs);
  console.log(`\n### ${slug}  pass=${pass} structural=${structural.length} numeric=${numeric.length}`);
  for (const d of structural) console.log(formatDiffLine(d));
  for (const d of numeric) console.log(formatDiffLine(d));
}

function runOne(repo: string, outDir: string, slug: string, store: AssetStore): void {
  const { markup, oracle } = readFixtureFiles(repo, slug);
  const svg = renderFixture(markup, store);
  writeFileSync(join(outDir, `${slug}.ours.svg`), svg);
  copyFileSync(join(repo, 'test-results', 'dot-cache', 'class', slug, 'in.svg'), join(outDir, `${slug}.jar.svg`));
  const { pass, diffs } = compareSvg(svg, oracle, 'deterministic');
  printDiffs(slug, pass, diffs);
}

function main(): void {
  const slugs = process.argv.slice(2);
  if (slugs.length === 0) {
    console.error('usage: render-diff.mts <slug...>');
    process.exitCode = 2;
    return;
  }
  const repo = resolveRepoRoot(import.meta.url);
  const outDir = join(repo, 'plans', 'class-divergence-drive', 'measurements', 'out');
  mkdirSync(outDir, { recursive: true });
  const store = buildSpriteAssetsStore();
  for (const slug of slugs) runOne(repo, outDir, slug, store);
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run in
 * the commit body, not the unit-test suite (matches this project's other
 * script CLI blocks, e.g. scripts/svg-parity-survey.ts). */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
