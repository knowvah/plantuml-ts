/**
 * Unit tests for the SVG conformance census's pure dispatch/serialisation
 * logic (pdr-T2). Only the pure/impure-but-cheap seams are exercised here —
 * `main()`'s real fixture walk and its two measurer passes are exercised by
 * the real census run (mirrors `svg-parity.test.ts`'s own doc comment for
 * `svg-parity-survey.ts`/`svg-parity-dashboard.ts`), never by a unit test.
 *
 * `svg-conformance-census.ts` guards its CLI entry point
 * (`if (import.meta.url === pathToFileURL(...))`) precisely so importing
 * `helperFor`/`CensusResult` here does not trigger a real run.
 */
import { describe, it, expect } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { helperFor } from '../../../scripts/svg-conformance-census.js';
import type { CensusResult } from '../../../scripts/svg-conformance-census.js';
import { toCensusJson, jsonPathArg, runJsonMode, bucketOf } from '../../../scripts/svg-conformance-census-json.js';

// ---------------------------------------------------------------------------
// helperFor (AC1: activity dispatches to the activity helper)
// ---------------------------------------------------------------------------

describe('helperFor', () => {
  it('dispatches activity to the activity helper (AC1)', () => {
    expect(helperFor('activity')).toBe('activity');
  });

  it('preserves every pre-existing mapping', () => {
    expect(helperFor('class')).toBe('class');
    expect(helperFor('object')).toBe('class');
    expect(helperFor('state')).toBe('state');
    expect(helperFor('sequence')).toBe('sequence');
    expect(helperFor('json')).toBe('json');
    expect(helperFor('yaml')).toBe('json');
    expect(helperFor('hcl')).toBe('json');
    expect(helperFor('dot')).toBe('dot');
    expect(helperFor('component')).toBe('description');
    expect(helperFor('usecase')).toBe('description');
  });
});

// ---------------------------------------------------------------------------
// bucketOf
// ---------------------------------------------------------------------------

describe('bucketOf', () => {
  it('buckets diff counts into the five ranges', () => {
    expect(bucketOf(0)).toBe('0');
    expect(bucketOf(3)).toBe('1-3');
    expect(bucketOf(10)).toBe('4-10');
    expect(bucketOf(30)).toBe('11-30');
    expect(bucketOf(31)).toBe('31+');
  });
});

// ---------------------------------------------------------------------------
// toCensusJson (AC2 shape, AC3 error rows, AC4 idempotency)
// ---------------------------------------------------------------------------

const rows: CensusResult[] = [
  { slug: 'zzz', type: 'activity', diffCount: 0, paths: [] },
  { slug: 'aaa', type: 'activity', diffCount: 5, paths: ['svg/g[2]/text/@x'] },
  { slug: 'mmm', type: 'activity', diffCount: 'error', reason: 'boom' },
];

describe('toCensusJson', () => {
  it('matches the census-<type>.json contract, sorted by slug (AC2)', () => {
    const json = toCensusJson('activity', rows, { generatedAt: 't1', measuredAgainstCommit: 'abc123' });
    expect(json).toEqual({
      generatedAt: 't1',
      measuredAgainstCommit: 'abc123',
      type: 'activity',
      measurer: 'deterministic',
      fixtures: [
        { slug: 'aaa', status: 'ok', diffCount: 5, bucket: '4-10' },
        { slug: 'mmm', status: 'error', diffCount: null, bucket: null, reason: 'boom' },
        { slug: 'zzz', status: 'ok', diffCount: 0, bucket: '0' },
      ],
    });
  });

  it('nulls diffCount/bucket and sets reason for an erroring fixture (AC3)', () => {
    const json = toCensusJson('activity', rows, { generatedAt: 't1', measuredAgainstCommit: 'abc123' });
    const errored = json.fixtures.find((f) => f.slug === 'mmm');
    expect(errored).toEqual({ slug: 'mmm', status: 'error', diffCount: null, bucket: null, reason: 'boom' });
  });

  it('falls back to a generic reason when none was captured', () => {
    const errored: CensusResult = { slug: 'nnn', type: 'activity', diffCount: 'error' };
    const json = toCensusJson('activity', [errored], { generatedAt: 't1', measuredAgainstCommit: 'abc123' });
    expect(json.fixtures[0]?.reason).toBe('unknown error');
  });

  it('is identical across two calls except meta.generatedAt (AC4)', () => {
    const a = toCensusJson('activity', rows, { generatedAt: 't1', measuredAgainstCommit: 'abc123' });
    const b = toCensusJson('activity', rows, { generatedAt: 't2', measuredAgainstCommit: 'abc123' });
    expect(a.generatedAt).not.toBe(b.generatedAt);
    expect({ ...a, generatedAt: 'same' }).toEqual({ ...b, generatedAt: 'same' });
  });
});

// ---------------------------------------------------------------------------
// jsonPathArg
// ---------------------------------------------------------------------------

describe('jsonPathArg', () => {
  it('returns undefined when --json is absent', () => {
    expect(jsonPathArg(['activity', '--per-fixture'])).toBeUndefined();
  });

  it('returns the path following --json', () => {
    expect(jsonPathArg(['activity', '--json', 'out.json'])).toBe('out.json');
  });

  it('throws when --json has no following path', () => {
    expect(() => jsonPathArg(['activity', '--json'])).toThrow('--json requires a <path> argument');
  });
});

// ---------------------------------------------------------------------------
// runJsonMode (AC2: the written file matches the contract; no jar-pass
// output is a `main()`-level early return, out of scope for a unit test per
// this task's boundaries — never render a full type here)
// ---------------------------------------------------------------------------

describe('runJsonMode', () => {
  it('writes a file matching the census-<type>.json contract', () => {
    const dir = mkdtempSync(join(tmpdir(), 'census-json-'));
    const outPath = join(dir, 'census-activity.json');
    try {
      runJsonMode(outPath, 'activity', rows, process.cwd());
      const written = JSON.parse(readFileSync(outPath, 'utf-8')) as Record<string, unknown>;
      expect(Object.keys(written).sort()).toEqual(
        ['fixtures', 'generatedAt', 'measuredAgainstCommit', 'measurer', 'type'].sort(),
      );
      expect(written.type).toBe('activity');
      expect(written.measurer).toBe('deterministic');
      expect(Array.isArray(written.fixtures) && written.fixtures.length).toBe(3);
      expect(typeof written.measuredAgainstCommit).toBe('string');
      expect((written.measuredAgainstCommit as string).length).toBeGreaterThan(0);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
