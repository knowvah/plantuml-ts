// isw (stop 6): production render manifest. Renders every cached fixture
// (test-results/dot-cache/<engine>/<slug>/in.puml) through renderSync with the
// DEFAULT measurer (production jarMeasurer — no `measurer` option) plus the
// survey's asset/include stores, and records sha256(svg) per fixture.
// Usage (repo root):
//   npx jiti plans/instrument-space-width/measurements/production-manifest.mts <out.json>
//   npx jiti .../production-manifest.mts <out.json> --diff <prev.json>
// --diff prints every changed/added/removed key and exits 1 on any.
import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
const root = process.cwd();
const { renderSync } = await import(`${root}/src/index.ts`);
const { combineAssetStores } = await import(`${root}/src/core/asset-store.ts`);
const { buildSpriteAssetsStore } = await import(`${root}/scripts/sprite-assets-store.ts`);
const { buildEmojiAssetsStore } = await import(`${root}/scripts/emoji-assets-store.ts`);
const { fixtureIncludeStore } = await import(`${root}/tests/helpers/fixture-include-store.ts`);
const assetStore = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore());
const includeStore = fixtureIncludeStore();

type Row = string | { err: string };

function renderAll(): Record<string, Row> {
  const res: Record<string, Row> = {};
  const cache = `${root}/test-results/dot-cache`;
  for (const e of readdirSync(cache).sort()) {
    if (!existsSync(`${cache}/${e}`) || e.startsWith('.')) continue;
    let slugs: string[];
    try { slugs = readdirSync(`${cache}/${e}`).sort(); } catch { continue; }
    for (const slug of slugs) {
      const puml = `${cache}/${e}/${slug}/in.puml`;
      if (!existsSync(puml)) continue;
      try {
        const svg = renderSync(readFileSync(puml, 'utf8'), { assetStore, includeStore });
        res[`${e}/${slug}`] = createHash('sha256').update(svg).digest('hex');
      } catch (err) { res[`${e}/${slug}`] = { err: String(err).slice(0, 200) }; }
    }
    process.stderr.write(`done ${e}\n`);
  }
  return res;
}

function diff(prev: Record<string, Row>, next: Record<string, Row>): string[] {
  const keys = new Set([...Object.keys(prev), ...Object.keys(next)]);
  const out: string[] = [];
  for (const k of [...keys].sort()) {
    if (JSON.stringify(prev[k]) !== JSON.stringify(next[k])) out.push(k);
  }
  return out;
}

const args = process.argv.slice(2);
const outPath = args[0];
const di = args.indexOf('--diff');
const next = renderAll();
writeFileSync(outPath, JSON.stringify(next, null, 0));
process.stdout.write(`rows ${Object.keys(next).length}\n`);
if (di >= 0) {
  const changed = diff(JSON.parse(readFileSync(args[di + 1], 'utf8')), next);
  for (const k of changed) process.stdout.write(`CHANGED ${k}\n`);
  process.stdout.write(`changed ${changed.length}\n`);
  process.exit(changed.length ? 1 : 0);
}
