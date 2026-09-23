/**
 * Diagnosis helper: `npx jiti <this file> <slug> [<slug>...]`
 * For each class-corpus slug: renders through production renderSync exactly as
 * scripts/svg-parity-survey.ts does, writes <scratch>/out/<slug>.ours.svg and
 * copies the jar SVG to <scratch>/out/<slug>.jar.svg, and prints every diff
 * (structural first, then numeric) from tests/oracle/svg-conformance/compare.ts.
 */
import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { join } from 'node:path';
const REPO = '/Users/scottseely/git/knowvah/plantuml-ts';
const { renderSync } = await import(REPO + '/src/index.ts');
const { WidthTableMeasurer } = await import(REPO + '/src/core/measurer.ts');
const { buildSpriteAssetsStore } = await import(REPO + '/scripts/sprite-assets-store.ts');
const { compareSvg } = await import(REPO + '/tests/oracle/svg-conformance/compare.ts');
const OUT = join(import.meta.dirname ?? new URL('.', import.meta.url).pathname, 'out');
mkdirSync(OUT, { recursive: true });
const store = buildSpriteAssetsStore();
for (const slug of process.argv.slice(2)) {
  const dir = join(REPO, 'test-results/dot-cache/class', slug);
  const markup = readFileSync(join(dir, 'in.puml'), 'utf-8');
  const oracle = readFileSync(join(dir, 'in.svg'), 'utf-8');
  const svg = renderSync(markup, { measurer: new WidthTableMeasurer(), assetStore: store });
  writeFileSync(join(OUT, slug + '.ours.svg'), svg);
  copyFileSync(join(dir, 'in.svg'), join(OUT, slug + '.jar.svg'));
  const cmp = compareSvg(svg, oracle, 'deterministic');
  const st = cmp.diffs.filter((d: any) => d.delta === undefined);
  const nu = cmp.diffs.filter((d: any) => d.delta !== undefined);
  console.log(`\n### ${slug}  pass=${cmp.pass} structural=${st.length} numeric=${nu.length}`);
  for (const d of st) console.log(`  S ${d.path}  exp=${String(d.expected).slice(0, 80)} | act=${String(d.actual).slice(0, 80)}`);
  for (const d of nu.slice(0, 15)) console.log(`  N ${d.path}  exp=${d.expected} | act=${d.actual} (Δ${d.delta})`);
  if (nu.length > 15) console.log(`  ... ${nu.length - 15} more numeric`);
}
