/**
 * `npx jiti plans/class-divergence-drive/tools/render-all.mts <out.json>`
 *
 * Renders every cached class-corpus fixture the same way `render-diff.mts`
 * does (`WidthTableMeasurer` + one process-wide `buildSpriteAssetsStore()`)
 * and classifies each with `scripts/svg-parity-survey.ts#diffVerdict`,
 * imported directly rather than re-derived — its CLI dispatch is guarded by
 * `import.meta.url === pathToFileURL(process.argv[1]).href`, so importing
 * it as a module runs no top-level side effect (verified; see
 * `.agent-notes/cdd-T0b.md`). Writes `RenderAllRow[]`, sorted by slug, to
 * `<out.json>`.
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
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { renderSync } from '../../../src/index.js';
import { WidthTableMeasurer } from '../../../src/core/measurer.js';
import type { AssetStore } from '../../../src/core/asset-store.js';
import { buildSpriteAssetsStore } from '../../../scripts/sprite-assets-store.js';
import { compareSvg } from '../../../tests/oracle/svg-conformance/compare.js';
import { diffVerdict, type Verdict } from '../../../scripts/svg-parity-survey.js';

export function resolveRepoRoot(fileUrl: string): string {
  return join(dirname(fileURLToPath(fileUrl)), '..', '..', '..');
}

export interface RenderAllRow {
  slug: string;
  verdict: 'conformant' | 'structural-match' | 'diverged' | 'errored' | 'timeout';
  structural: number;
  numeric: number;
  firstDiff?: string;
}

interface FixtureDir {
  slug: string;
  dir: string;
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

function errorRow(slug: string, e: unknown): RenderAllRow {
  const message = e instanceof Error ? e.message : String(e);
  return { slug, verdict: 'errored', structural: 0, numeric: 0, firstDiff: message };
}

export function renderRow(f: FixtureDir, store: AssetStore): RenderAllRow {
  try {
    const markup = readFileSync(join(f.dir, 'in.puml'), 'utf-8');
    const oracle = readFileSync(join(f.dir, 'in.svg'), 'utf-8');
    const svg = renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: store });
    const { structural, numeric } = countDiffs(svg, oracle);
    const v = diffVerdict(svg, oracle);
    const firstDiff = v.firstDiff !== undefined ? { firstDiff: v.firstDiff } : {};
    return { slug: f.slug, verdict: toRowVerdict(v.verdict), structural, numeric, ...firstDiff };
  } catch (e) {
    return errorRow(f.slug, e);
  }
}

function main(): void {
  const out = process.argv[2];
  if (out === undefined) {
    console.error('usage: render-all.mts <out.json>');
    process.exitCode = 2;
    return;
  }
  const repo = resolveRepoRoot(import.meta.url);
  const classDir = join(repo, 'test-results', 'dot-cache', 'class');
  const fixtures = listClassFixtureDirs(classDir);
  process.stderr.write(`rendering ${fixtures.length} class fixtures\n`);
  const store = buildSpriteAssetsStore();
  const rows: RenderAllRow[] = [];
  fixtures.forEach((f, i) => {
    rows.push(renderRow(f, store));
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
