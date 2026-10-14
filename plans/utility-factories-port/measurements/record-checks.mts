// ufp T0a step 5: re-measure the "Record checks" rows (fixtures.md) with the
// refusal gate's own measure() logic (refusal-coverage.test.ts:292-305).
import { readFileSync } from 'node:fs';
import { loadElk, renderSync } from '../../../src/index.js';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { fullDescription } from '../../../src/core/version.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';

const BANNER = `>${fullDescription()}</text>`;
const ASSUMED = /\(Assumed diagram type: ([^)<]+)\)/;
const DTYPE = /data-diagram-type="([A-Z]+)"/;
const JAR_ERR = />(?:PlantUML version [^<]*\[[^<]*\]|An error has occurred[^<]*)<\/text>/;
const elk = await loadElk();
const store = fixtureIncludeStore();
for (const slug of process.argv.slice(2)) {
  const dir = `test-results/dot-cache/unknown/${slug}`;
  const markup = readFileSync(`${dir}/in.puml`, 'utf8');
  const ours = renderSync(markup, { includeStore: store, measurer: new DeterministicMeasurer(), elk });
  const weErrored = ours.includes(BANNER);
  const engine = weErrored ? (ASSUMED.exec(ours)?.[1] ?? 'unknown') : (DTYPE.exec(ours.slice(0, 4096))?.[1]?.toLowerCase() ?? 'none');
  const jar = readFileSync(`${dir}/in.svg`, 'utf8').slice(0, 4096);
  const head = ours.slice(0, 160).replace(/\s+/g, ' ');
  const texts = [...ours.matchAll(/<text[^>]*>([^<]*)<\/text>/g)].slice(0, 3).map((m) => m[1]);
  console.log(JSON.stringify({ slug, weErrored, engine, jarRendered: !JAR_ERR.test(jar), len: ours.length, head, texts }));
}
