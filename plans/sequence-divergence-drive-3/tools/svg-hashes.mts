/**
 * sdd3 stop-7 instrument (from sdd1/sdd2): sha256 of every sequence
 * fixture's SVG on BOTH paths — the ratchet (`renderFixtureSequence` with
 * `sequenceFixtureOptions()`) and production (`renderSync` with the survey's
 * own stores) — so a pure move can be checked byte-for-byte against a
 * snapshot taken before it landed. An error is recorded by its first line.
 *
 *   npx tsx plans/sequence-divergence-drive-3/tools/svg-hashes.mts <out.json>
 *   npx tsx plans/sequence-divergence-drive-3/tools/svg-hashes.mts <out.json> <before.json>
 *   npx tsx plans/sequence-divergence-drive-3/tools/svg-hashes.mts --all <out.json> [<before.json>]
 *
 * `--all` hashes `renderSync` for every fixture under
 * `test-results/dot-cache/*\/` (every engine), keyed `<type>/<slug>`, with
 * the ELK backend loaded as the survey does (`scripts/svg-parity-survey.ts`).
 * With `<before.json>` it also prints every key whose hash differs and
 * exits 1 when any does. Run from the repo root.
 */
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { DeterministicMeasurer } from '../../../src/core/measurer-deterministic.js';
import { loadElk, renderSync, type ElkBackend } from '../../../src/index.js';
import {
  renderFixtureSequence,
  sequenceFixtureOptions,
} from '../../../tests/oracle/svg-conformance/render-fixture-sequence.js';

const CACHE = 'test-results/dot-cache';
const SEQUENCE_CACHE = `${CACHE}/sequence`;

type Hashes = Record<string, { ratchet?: string; sync: string }>;

function hashOf(render: () => string): string {
  try {
    return createHash('sha256').update(render()).digest('hex');
  } catch (e) {
    return `error: ${String((e as Error).message).split('\n')[0]}`;
  }
}

function readPuml(dir: string): string | undefined {
  try {
    return readFileSync(`${dir}/in.puml`, 'utf8');
  } catch {
    return undefined;
  }
}

function syncRender(puml: string, elk: ElkBackend | undefined): string {
  const { assetStore, includeStore } = sequenceFixtureOptions();
  return renderSync(puml, { measurer: new DeterministicMeasurer(), assetStore, includeStore, elk });
}

function hashSequence(): Hashes {
  const out: Hashes = {};
  for (const slug of readdirSync(SEQUENCE_CACHE).sort()) {
    const puml = readPuml(`${SEQUENCE_CACHE}/${slug}`);
    if (puml === undefined) continue;
    out[slug] = {
      ratchet: hashOf(() => renderFixtureSequence(puml, new DeterministicMeasurer(), sequenceFixtureOptions())),
      sync: hashOf(() => syncRender(puml, undefined)),
    };
  }
  return out;
}

function hashAll(elk: ElkBackend): Hashes {
  const out: Hashes = {};
  for (const type of readdirSync(CACHE).sort()) {
    let slugs: string[];
    try {
      slugs = readdirSync(`${CACHE}/${type}`).sort();
    } catch {
      continue;
    }
    for (const slug of slugs) {
      const puml = readPuml(`${CACHE}/${type}/${slug}`);
      if (puml === undefined) continue;
      out[`${type}/${slug}`] = { sync: hashOf(() => syncRender(puml, elk)) };
    }
  }
  return out;
}

function compare(out: Hashes, beforePath: string): void {
  const before = JSON.parse(readFileSync(beforePath, 'utf8')) as Hashes;
  const keys = new Set([...Object.keys(before), ...Object.keys(out)]);
  let moved = 0;
  for (const key of [...keys].sort()) {
    const a = before[key];
    const b = out[key];
    if (a?.ratchet !== b?.ratchet || a?.sync !== b?.sync) {
      moved++;
      console.log(`MOVED ${key} ratchet:${a?.ratchet === b?.ratchet} sync:${a?.sync === b?.sync}`);
    }
  }
  console.log(`${keys.size} fixtures, ${moved} moved`);
  if (moved > 0) process.exitCode = 1;
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const all = args[0] === '--all';
  if (all) args.shift();
  const out = all ? hashAll(await loadElk()) : hashSequence();
  writeFileSync(args[0] ?? 'svg-hashes.json', JSON.stringify(out, null, 1));
  const beforePath = args[1];
  if (beforePath === undefined) {
    console.log(`${Object.keys(out).length} fixtures hashed`);
    return;
  }
  compare(out, beforePath);
}

await main();
