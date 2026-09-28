/**
 * `npx jiti plans/class-divergence-drive/tools/render-all.mts <out.json> [--tree class|unknown|all]`
 *
 * Renders every cached fixture in the selected tree the same way
 * `render-diff.mts` does (`WidthTableMeasurer` + one process-wide
 * `buildSpriteAssetsStore()`) and classifies each with
 * `scripts/svg-parity-survey.ts#diffVerdict`, imported directly rather than
 * re-derived — its CLI dispatch is guarded by `import.meta.url ===
 * pathToFileURL(process.argv[1]).href`, so importing it as a module runs no
 * top-level side effect (verified; see `.agent-notes/cdd-T0b.md`). Writes
 * `RenderAllRow[]`, sorted by slug, to `<out.json>`.
 *
 * `--tree` selects the corpus:
 * - `class` (default, preserves the original behaviour): every cached fixture
 *   under `test-results/dot-cache/class/`.
 * - `unknown`: fixtures under `test-results/dot-cache/unknown/` whose
 *   `oracle/goldens/svg-conformance/routing-baseline.json` row has
 *   `type: 'unknown'` AND `ourType === 'CLASS'` — the class fixtures our
 *   router currently misclassifies (cdd5 T4).
 * - `all`: the union of both, each row tagged with its source `tree`.
 *
 * Fixture discovery mirrors `listFixtureDirs`
 * (`scripts/svg-parity-survey.ts:211-224`): a dir counts only if `.done`,
 * `in.puml` and `in.svg` all exist, sorted by `slug.localeCompare`.
 *
 * Unlike the production survey (`svg-parity-workers.ts`), this renders every
 * fixture IN-PROCESS with no per-fixture timeout or worker isolation: a
 * fixture that hangs upstream will hang this tool rather than being
 * recorded as `timeout`. That is an accepted trade for a scratch tool — see
 * `tools/README.md`.
 */
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
// cdd4-T9 / close-b2: the jar always has its Twemoji artwork too, so this
// harness supplies the same combined store as render-diff and the survey.
import { buildEmojiAssetsStore } from '../../../scripts/emoji-assets-store.js';
import { combineAssetStores } from '../../../src/core/asset-store.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { diffVerdict, type Verdict } from '../../../scripts/svg-parity-survey.js';

export function resolveRepoRoot(fileUrl: string): string {
  return join(dirname(fileURLToPath(fileUrl)), '..', '..', '..');
}

export type Tree = 'class' | 'unknown' | 'all';

export interface RenderAllRow {
  slug: string;
  tree: string;
  verdict: 'conformant' | 'structural-match' | 'diverged' | 'errored' | 'timeout';
  structural: number;
  numeric: number;
  firstDiff?: string;
}

interface FixtureDir {
  slug: string;
  dir: string;
}

interface TreeFixture extends FixtureDir {
  tree: 'class' | 'unknown';
}

/** Mirrors `listFixtureDirs` (`scripts/svg-parity-survey.ts:211-224`). */
export function listClassFixtureDirs(classDir: string): FixtureDir[] {
  if (!existsSync(classDir)) return [];
  const out: FixtureDir[] = [];
  for (const slug of readdirSync(classDir)) {
    const dir = join(classDir, slug);
    if (!statSync(dir).isDirectory()) continue;
    if (!existsSync(join(dir, '.done'))) continue;
    if (!existsSync(join(dir, 'in.puml')) || !existsSync(join(dir, 'in.svg'))) continue;
    out.push({ slug, dir });
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

interface RoutingRow {
  type: string;
  ourType: string;
  slug: string;
}

/** Slugs whose `routing-baseline.json` row is `type: 'unknown'` (our router
 *  failed to detect a diagram type) but the jar's own type was `CLASS`
 *  (`ourType` records the jar's classification in this ledger — cdd5 T4). */
export function loadUnknownClassSlugs(routingBaselinePath: string): Set<string> {
  const data = JSON.parse(readFileSync(routingBaselinePath, 'utf-8')) as { fixtures: RoutingRow[] };
  const slugs = new Set<string>();
  for (const row of data.fixtures) {
    if (row.type === 'unknown' && row.ourType === 'CLASS') slugs.add(row.slug);
  }
  return slugs;
}

/** `test-results/dot-cache/unknown/` fixtures filtered to the routing-baseline
 *  CLASS rows (see `loadUnknownClassSlugs`). */
export function listUnknownClassFixtureDirs(repo: string): FixtureDir[] {
  const unknownDir = join(repo, 'test-results', 'dot-cache', 'unknown');
  const routingPath = join(repo, 'oracle', 'goldens', 'svg-conformance', 'routing-baseline.json');
  const allowed = loadUnknownClassSlugs(routingPath);
  return listClassFixtureDirs(unknownDir).filter((f) => allowed.has(f.slug));
}

function taggedFixtures(fixtures: FixtureDir[], tree: 'class' | 'unknown'): TreeFixture[] {
  return fixtures.map((f) => ({ ...f, tree }));
}

/** Fixtures for the selected `--tree`, each tagged with its source tree.
 *  `all` is the union of both, re-sorted by slug (T4). */
export function collectFixtures(repo: string, tree: Tree): TreeFixture[] {
  const classFixtures = (): TreeFixture[] => taggedFixtures(listClassFixtureDirs(join(repo, 'test-results', 'dot-cache', 'class')), 'class');
  const unknownFixtures = (): TreeFixture[] => taggedFixtures(listUnknownClassFixtureDirs(repo), 'unknown');
  if (tree === 'class') return classFixtures();
  if (tree === 'unknown') return unknownFixtures();
  return [...classFixtures(), ...unknownFixtures()].sort((a, b) => a.slug.localeCompare(b.slug));
}

/** `diffVerdict`'s own return type is the full six-member `Verdict` union,
 *  but its implementation only ever returns these three (`oracle-error` is
 *  assigned upstream, outside `diffVerdict`, and `errored`/`timeout` come
 *  from the worker pool this tool doesn't use) — narrow defensively rather
 *  than widen `RenderAllRow` to match an unreachable case. */
export function toRowVerdict(v: Verdict): RenderAllRow['verdict'] {
  return v === 'oracle-error' ? 'diverged' : v;
}

export function countDiffs(ours: string, oracle: string): { structural: number; numeric: number } {
  const { diffs } = compareSvg(ours, oracle, 'deterministic');
  let structural = 0;
  let numeric = 0;
  for (const d of diffs) {
    if (d.delta === undefined) structural++;
    else numeric++;
  }
  return { structural, numeric };
}

function errorRow(slug: string, tree: string, e: unknown): RenderAllRow {
  const message = e instanceof Error ? e.message : String(e);
  return { slug, tree, verdict: 'errored', structural: 0, numeric: 0, firstDiff: message };
}

export function renderRow(f: FixtureDir, store: AssetStore, tree: string): RenderAllRow {
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const oracle = readFileSync(join(f.dir, 'in.svg'), 'utf-8');
    const svg = renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: store, includeStore: fixtureIncludeStore() });
    const { structural, numeric } = countDiffs(svg, oracle);
    const v = diffVerdict(svg, oracle);
    const firstDiff = v.firstDiff !== undefined ? { firstDiff: v.firstDiff } : {};
    return { slug: f.slug, tree, verdict: toRowVerdict(v.verdict), structural, numeric, ...firstDiff };
  } catch (e) {
    return errorRow(f.slug, tree, e);
  }
}

export type ParsedArgs = { out: string; tree: Tree } | { error: string };

const USAGE = 'usage: render-all.mts <out.json> [--tree class|unknown|all]';

function isTree(v: string | undefined): v is Tree {
  return v === 'class' || v === 'unknown' || v === 'all';
}

/** Parses `<out.json> [--tree class|unknown|all]`; returns `{ error }` for
 *  a missing `out` path or an unrecognized `--tree` value rather than
 *  throwing — an expected CLI-input failure, not a programmer error
 *  (error-handling.md: return, don't throw, for caller-recoverable cases). */
export function parseArgs(argv: readonly string[]): ParsedArgs {
  const out = argv[0];
  if (out === undefined) return { error: USAGE };
  const treeIdx = argv.indexOf('--tree');
  const treeArg = treeIdx === -1 ? 'class' : argv[treeIdx + 1];
  if (!isTree(treeArg)) return { error: `invalid --tree value: ${String(treeArg)}\n${USAGE}` };
  return { out, tree: treeArg };
}

function main(): void {
  const parsed = parseArgs(process.argv.slice(2));
  if ('error' in parsed) {
    console.error(parsed.error);
    process.exitCode = 2;
    return;
  }
  const { out, tree } = parsed;
  const repo = resolveRepoRoot(import.meta.url);
  const fixtures = collectFixtures(repo, tree);
  process.stderr.write(`rendering ${fixtures.length} ${tree} fixtures\n`);
  const store = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore());
  const rows: RenderAllRow[] = [];
  fixtures.forEach((f, i) => {
    rows.push(renderRow(f, store, f.tree));
    if ((i + 1) % 25 === 0) process.stderr.write(`  ${i + 1}/${fixtures.length}\n`);
  });
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, JSON.stringify(rows, null, 2) + '\n');
  process.stderr.write(`wrote ${out} — ${rows.length} rows\n`);
}

/* v8 ignore start -- CLI entry point; exercised via the acceptance run, not
 * the unit-test suite. */
if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  main();
}
/* v8 ignore stop */
