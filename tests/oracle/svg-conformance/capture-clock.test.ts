/**
 * D3c (gantt-engine-port T0c): every clock-dependent oracle source has a row
 * in `oracle/capture-clock.json`. Scans the corpus cache
 * (`test-results/dot-cache/<engine>/<slug>/in.puml`, key `<engine>/<slug>`) and
 * the authored trees (`tests/fixtures/**\/*.puml`, key
 * `fixtures/<path without .puml>`). A missing row fails naming the key; a row
 * with no matching source is stale and fails too.
 */
import { describe, it, expect } from 'vitest';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { corpusClockKey, fixtureClockKey, isClockDependentSource, type CaptureClockRecord } from './capture-clock.js';

const HERE = dirname(fileURLToPath(import.meta.url));
const SIDECAR = join(HERE, '../../../oracle/capture-clock.json');
const CORPUS_ROOT = join(HERE, '../../../test-results/dot-cache');
const FIXTURES_ROOT = join(HERE, '../../fixtures');
const PUML_SUFFIX = '.puml';
const CORPUS_SOURCE = 'in.puml';

const record = JSON.parse(readFileSync(SIDECAR, 'utf8')) as CaptureClockRecord;

/** Every source key (corpus + fixtures) mapped to whether it reads the clock. */
function scanSources(): Map<string, boolean> {
  const out = new Map<string, boolean>();
  if (existsSync(CORPUS_ROOT)) {
    for (const engine of readdirSync(CORPUS_ROOT, { withFileTypes: true })) {
      if (!engine.isDirectory()) continue;
      for (const slug of readdirSync(join(CORPUS_ROOT, engine.name))) {
        const file = join(CORPUS_ROOT, engine.name, slug, CORPUS_SOURCE);
        if (existsSync(file))
          out.set(corpusClockKey(engine.name, slug), isClockDependentSource(readFileSync(file, 'utf8')));
      }
    }
  }
  if (existsSync(FIXTURES_ROOT)) {
    for (const rel of readdirSync(FIXTURES_ROOT, { recursive: true }).map(String)) {
      if (!rel.endsWith(PUML_SUFFIX)) continue;
      out.set(fixtureClockKey(rel), isClockDependentSource(readFileSync(join(FIXTURES_ROOT, rel), 'utf8')));
    }
  }
  return out;
}

const sources = scanSources();
const dependent = [...sources].filter(([, d]) => d).map(([k]) => k);

describe('capture clock sidecar (D3c)', () => {
  it('scanned a non-empty source population', () => {
    expect(sources.size).toBeGreaterThan(0);
  });

  it('every clock-dependent source has a sidecar row', () => {
    const missing = dependent.filter((k) => record[k] === undefined);
    expect(missing, `oracle/capture-clock.json lacks rows for: ${missing.join(', ')}`).toEqual([]);
  });

  it('every sidecar row names a clock-dependent source', () => {
    const stale = Object.keys(record).filter((k) => sources.get(k) !== true);
    expect(stale, `stale or non-dependent rows: ${stale.join(', ')}`).toEqual([]);
  });

  it('every row is { epochMillis: positive integer, zone: non-empty }', () => {
    for (const [key, e] of Object.entries(record)) {
      expect(Object.keys(e).sort(), key).toEqual(['epochMillis', 'zone']);
      expect(Number.isInteger(e.epochMillis) && e.epochMillis > 0, key).toBe(true);
      expect(e.zone.length, key).toBeGreaterThan(0);
    }
  });

  it('the two backfilled rows are present with the Chicago zone', () => {
    expect(record['gantt/lituri-55-caju105']).toEqual({ epochMillis: 1791605404000, zone: 'America/Chicago' });
    expect(record['unknown/firiru-71-viki803']).toEqual({ epochMillis: 1791605405000, zone: 'America/Chicago' });
  });
});
