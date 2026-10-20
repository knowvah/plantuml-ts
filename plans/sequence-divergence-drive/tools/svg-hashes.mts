/**
 * sdd1 stop-7 instrument: sha256 of every sequence fixture's SVG on BOTH
 * paths — the ratchet (`renderFixtureSequence`) and production
 * (`renderSync`) — so a no-op seam can be checked byte-for-byte against a
 * snapshot taken before it landed. An error is recorded by its first line.
 *
 *   npx tsx plans/sequence-divergence-drive/tools/svg-hashes.mts <out.json>
 *   npx tsx plans/sequence-divergence-drive/tools/svg-hashes.mts <out.json> <before.json>
 *
 * With `<before.json>` it also prints every slug whose hash differs and
 * exits 1 when any does. Run from the repo root.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { renderSync } from '../../../src/index.js';
import { renderFixtureSequence } from '../../../tests/oracle/svg-conformance/render-fixture-sequence.js';
import { fixtureIncludeStore } from '../../../tests/helpers/fixture-include-store.js';

const CACHE = 'test-results/dot-cache/sequence';

type Hashes = Record<string, { ratchet: string; sync: string }>;

function hashOf(render: () => string): string {
  try {
    return createHash('sha256').update(render()).digest('hex');
  } catch (e) {
    return `error: ${String((e as Error).message).split('\n')[0]}`;
  }
}

function main(): void {
  const out: Hashes = {};
  for (const slug of readdirSync(CACHE).sort()) {
    let puml: string;
    try {
      puml = readFileSync(`${CACHE}/${slug}/in.puml`, 'utf8');
    } catch {
      continue;
    }
    out[slug] = {
      ratchet: hashOf(() =>
        renderFixtureSequence(puml, new DeterministicMeasurer(), { includeStore: fixtureIncludeStore() }),
      ),
      sync: hashOf(() =>
        renderSync(puml, { measurer: new DeterministicMeasurer(), includeStore: fixtureIncludeStore() }),
      ),
    };
  }
  writeFileSync(process.argv[2] ?? 'svg-hashes.json', JSON.stringify(out, null, 1));
  const beforePath = process.argv[3];
  if (beforePath === undefined) {
    console.log(`${Object.keys(out).length} fixtures hashed`);
    return;
  }
  const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Hashes;
  const slugs = new Set([...Object.keys(before), ...Object.keys(out)]);
  let moved = 0;
  for (const slug of [...slugs].sort()) {
    const a = before[slug];
    const b = out[slug];
    if (a?.ratchet !== b?.ratchet || a?.sync !== b?.sync) {
      moved++;
      console.log(`MOVED ${slug} ratchet:${a?.ratchet === b?.ratchet} sync:${a?.sync === b?.sync}`);
    }
  }
  console.log(`${slugs.size} fixtures, ${moved} moved`);
  if (moved > 0) process.exitCode = 1;
}

main();
