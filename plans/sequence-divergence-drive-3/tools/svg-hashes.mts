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
 *   npx tsx plans/sequence-divergence-drive-3/tools/svg-hashes.mts --canon <out.json> [<before.json>]
 *   npx tsx plans/sequence-divergence-drive-3/tools/svg-hashes.mts --canon-all <out.json> [<before.json>]
 *
 * `--canon` hashes the sequence rows (both paths) in the canonical form of
 * `canonicalize` below — the batch-8 move gate (D5 Amendment 1);
 * `--canon-all` applies the same form to every engine's `renderSync` (a
 * sequence render reached through the unknown bucket or a nested `{{ }}`
 * payload moves raw by design and must hash equal here).
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

/** `--canon` (D5 Amendment 1, journal row 94): the form-insensitive gate for
 *  the batch-8 UGraphic moves. Drops the `<?plantuml-src?>` PI, expands each
 *  tag's `style="k:v;…"` into attributes and sorts every tag's attributes.
 *  Element order, tag names, every value, text and ids are untouched, so a
 *  move that changes only the emitter's FORM (core drivers write the jar's
 *  `style=` form, the old string emitters wrote attributes) hashes equal,
 *  while any numeric, structural or textual change still moves the hash. */
function canonicalize(svg: string): string {
  const withoutPi = svg.replace(/<\?plantuml-src[\s\S]*?\?>/g, '');
  // A nested `{{ }}` diagram rides as a base64 `data:image/svg+xml` payload
  // (T8b, journal row 97): decode it and canonicalise it recursively, so a
  // form change inside the nested render hashes equal too. The payload is
  // replaced by its canonical text (hash-only use, never re-encoded).
  const nested = withoutPi.replace(/data:image\/svg\+xml;base64,([A-Za-z0-9+/=]+)/g, (_m, b64: string) => {
    const inner = Buffer.from(b64, 'base64').toString('utf8');
    return `data:image/svg+xml;canon,${canonicalize(inner)}`;
  });
  return nested.replace(/<([a-zA-Z][\w:-]*)((?:\s+[\w:-]+="[^"]*")*)\s*(\/?)>/g, (_m, tag: string, attrs: string, close: string) => {
    const pairs: [string, string][] = [];
    for (const [, name, value] of attrs.matchAll(/([\w:-]+)="([^"]*)"/g)) {
      if (name === 'style') {
        for (const decl of value.split(';')) {
          const i = decl.indexOf(':');
          if (i > 0) pairs.push([decl.slice(0, i).trim(), decl.slice(i + 1).trim()]);
        }
      } else pairs.push([name, value]);
    }
    pairs.sort((a, b) => (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0));
    return `<${tag}${pairs.map(([k, v]) => ` ${k}="${v}"`).join('')}${close}>`;
  });
}

function hashOf(render: () => string, canon = false): string {
  try {
    const svg = render();
    return createHash('sha256')
      .update(canon ? canonicalize(svg) : svg)
      .digest('hex');
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

function hashSequence(canon = false): Hashes {
  const out: Hashes = {};
  for (const slug of readdirSync(SEQUENCE_CACHE).sort()) {
    const puml = readPuml(`${SEQUENCE_CACHE}/${slug}`);
    if (puml === undefined) continue;
    out[slug] = {
      ratchet: hashOf(() => renderFixtureSequence(puml, new DeterministicMeasurer(), sequenceFixtureOptions()), canon),
      sync: hashOf(() => syncRender(puml, undefined), canon),
    };
  }
  return out;
}

function hashAll(elk: ElkBackend, canon = false): Hashes {
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
      out[`${type}/${slug}`] = { sync: hashOf(() => syncRender(puml, elk), canon) };
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
  const all = args[0] === '--all' || args[0] === '--canon-all';
  const canon = args[0] === '--canon' || args[0] === '--canon-all';
  if (all || canon) args.shift();
  const out = all ? hashAll(await loadElk(), canon) : hashSequence(canon);
  writeFileSync(args[0] ?? 'svg-hashes.json', JSON.stringify(out, null, 1));
  const beforePath = args[1];
  if (beforePath === undefined) {
    console.log(`${Object.keys(out).length} fixtures hashed`);
    return;
  }
  compare(out, beforePath);
}

await main();
