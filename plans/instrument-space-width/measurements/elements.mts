// isw (D5): per-tag element counts, ours vs jar, for every cached fixture of
// the named engines. Renders like scripts/svg-parity-survey.ts renderFrame
// (DeterministicMeasurer, D4 + sprite/emoji assets + fixture includes).
// Usage (repo root): npx jiti plans/large-group-mirror/measurements/elements.mts <out.json> <engine>...
// Writes { "<engine>/<slug>": { o: {tag: n}, j: {tag: n} } | { err } }.
// Compare two outputs with elements-diff.py. Never edits a baseline.
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs';
const root = process.cwd();
const { renderSync } = await import(`${root}/src/index.ts`);
const { DeterministicMeasurer } = await import(`${root}/src/core/measurer-deterministic.ts`);
const { combineAssetStores } = await import(`${root}/src/core/asset-store.ts`);
const { buildSpriteAssetsStore } = await import(`${root}/scripts/sprite-assets-store.ts`);
const { buildEmojiAssetsStore } = await import(`${root}/scripts/emoji-assets-store.ts`);
const { fixtureIncludeStore } = await import(`${root}/tests/helpers/fixture-include-store.ts`);
const assetStore = combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore());
const includeStore = fixtureIncludeStore();

function tags(svg: string): Record<string, number> {
  const out: Record<string, number> = {};
  const body = svg.replace(/<!--[\s\S]*?-->/g, '').replace(/<!\[CDATA\[[\s\S]*?\]\]>/g, '');
  for (const m of body.matchAll(/<([a-zA-Z][\w:.-]*)[\s/>]/g)) out[m[1]] = (out[m[1]] ?? 0) + 1;
  return out;
}

const [outPath, ...engines] = process.argv.slice(2);
const res: Record<string, unknown> = {};
for (const e of engines) {
  const base = `${root}/test-results/dot-cache/${e}`;
  for (const slug of readdirSync(base).sort()) {
    const dir = `${base}/${slug}`;
    if (!existsSync(`${dir}/in.puml`) || !existsSync(`${dir}/in.svg`)) continue;
    const key = `${e}/${slug}`;
    try {
      const svg = renderSync(readFileSync(`${dir}/in.puml`, 'utf8'), {
        measurer: new DeterministicMeasurer(), assetStore, includeStore,
      });
      res[key] = { o: tags(svg), j: tags(readFileSync(`${dir}/in.svg`, 'utf8')) };
    } catch (err) { res[key] = { err: String(err).slice(0, 200) }; }
  }
  process.stderr.write(`done ${e}\n`);
}
writeFileSync(outPath, JSON.stringify(res));
