/**
 * Unit tests for `pin-wbs.mts` (wbs-engine-port T0b, D7). Every test runs
 * against a temp fake repo (fake `test-results/dot-cache/wbs/` cache) and a
 * temp goldens dir — never the real `oracle/goldens/svg-wbs/`.
 *
 *   npx vitest run --config plans/wbs-engine-port/measurements/vitest.config.mts
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

import { pinWbs, parseArgs } from './pin-wbs.mts';

const DATE = '2026-10-12';
const SVG = '<svg>wbs-golden é</svg>\n';
const PUML = '@startwbs\n* root\n** child\n@endwbs\n';

let repo: string;
let goldens: string;

const put = (abs: string, body: string): void => {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
};
const cacheFile = (slug: string, f: string): string => join(repo, 'test-results/dot-cache/wbs', slug, f);
const seedCache = (slug: string): void => {
  put(cacheFile(slug, 'in.svg'), SVG);
  put(cacheFile(slug, 'in.puml'), PUML);
};
const ratchetText = (): string => readFileSync(join(goldens, 'ratchet.json'), 'utf8');
const ratchet = (): { fixtures: { slug: string; addedAt: string; source: string }[] } => JSON.parse(ratchetText());

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'pin-wbs-repo-'));
  goldens = mkdtempSync(join(tmpdir(), 'pin-wbs-goldens-'));
  // An EMPTY ratchet in the committed schema (`{ "fixtures": [] }`), seeded
  // here rather than copied from the real file: the real one gains pins at
  // every close, and these cases assert exact slug lists (salt's b4 fix).
  writeFileSync(join(goldens, 'ratchet.json'), '{\n  "fixtures": []\n}\n');
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(goldens, { recursive: true, force: true });
});

describe('pinWbs — fresh pin', () => {
  test('copies byte-identical in.puml + golden.svg and appends one ratchet entry per slug', () => {
    seedCache('aaa-11-wbs111');
    seedCache('bbb-22-wbs222');
    const before = ratchet().fixtures;
    const result = pinWbs({ repo, goldens, slugs: ['aaa-11-wbs111', 'bbb-22-wbs222'], date: DATE });
    expect(result).toEqual({ pinned: ['aaa-11-wbs111', 'bbb-22-wbs222'], alreadyPinned: [] });
    for (const slug of ['aaa-11-wbs111', 'bbb-22-wbs222']) {
      expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(cacheFile(slug, 'in.svg')))).toBe(true);
      expect(readFileSync(join(goldens, slug, 'in.puml'), 'utf8')).toBe(PUML);
    }
    expect(ratchet().fixtures).toEqual([
      ...before,
      { slug: 'aaa-11-wbs111', addedAt: DATE, source: 'dot-cache' },
      { slug: 'bbb-22-wbs222', addedAt: DATE, source: 'dot-cache' },
    ]);
    expect(ratchetText().endsWith('}\n')).toBe(true);
  });
});

describe('pinWbs — idempotent re-pin', () => {
  test('a repeated pin of the same slug is a no-op reported as already pinned', () => {
    seedCache('aaa-11-wbs111');
    pinWbs({ repo, goldens, slugs: ['aaa-11-wbs111'], date: DATE });
    const afterFirst = ratchetText();
    const again = pinWbs({ repo, goldens, slugs: ['aaa-11-wbs111'], date: '2026-10-13' });
    expect(again).toEqual({ pinned: [], alreadyPinned: ['aaa-11-wbs111'] });
    expect(ratchetText()).toBe(afterFirst);
    expect(ratchet().fixtures.filter((f) => f.slug === 'aaa-11-wbs111')).toHaveLength(1);
  });

  test('a mixed run pins the new slug and reports the pinned one', () => {
    seedCache('aaa-11-wbs111');
    seedCache('ccc-33-wbs333');
    pinWbs({ repo, goldens, slugs: ['aaa-11-wbs111'], date: DATE });
    const mixed = pinWbs({ repo, goldens, slugs: ['aaa-11-wbs111', 'ccc-33-wbs333'], date: DATE });
    expect(mixed).toEqual({ pinned: ['ccc-33-wbs333'], alreadyPinned: ['aaa-11-wbs111'] });
    expect(ratchet().fixtures.map((f) => f.slug)).toEqual(['aaa-11-wbs111', 'ccc-33-wbs333']);
  });
});

describe('pinWbs — refusals and mismatch', () => {
  test('a copy whose bytes differ from the cache fails loudly and leaves ratchet.json untouched', () => {
    seedCache('ddd-44-wbs444');
    const before = ratchetText();
    const corrupting = (src: string, dst: string): void => {
      writeFileSync(dst, Buffer.concat([readFileSync(src), Buffer.from('x')]));
    };
    expect(() => pinWbs({ repo, goldens, slugs: ['ddd-44-wbs444'], date: DATE, copy: corrupting })).toThrow(
      'ddd-44-wbs444: in.puml is not byte-identical to test-results/dot-cache/wbs/ddd-44-wbs444/in.puml',
    );
    expect(ratchetText()).toBe(before);
  });

  test('a missing cache file aborts before anything is written', () => {
    seedCache('eee-55-wbs555');
    rmSync(cacheFile('eee-55-wbs555', 'in.svg'));
    expect(() => pinWbs({ repo, goldens, slugs: ['eee-55-wbs555'], date: DATE })).toThrow(
      'eee-55-wbs555: missing test-results/dot-cache/wbs/eee-55-wbs555/in.svg',
    );
    expect(existsSync(join(goldens, 'eee-55-wbs555'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('no slugs, or a duplicate slug argument, is refused', () => {
    expect(() => pinWbs({ repo, goldens, slugs: [], date: DATE })).toThrow('no slugs given');
    expect(() => pinWbs({ repo, goldens, slugs: ['a', 'a'], date: DATE })).toThrow('duplicate slug in arguments: a');
  });
});

describe('parseArgs', () => {
  test('defaults --repo to the given toplevel and --goldens to <repo>/oracle/goldens/svg-wbs', () => {
    expect(parseArgs(['s1', 's2'], () => '/r')).toEqual({ repo: '/r', goldens: '/r/oracle/goldens/svg-wbs', slugs: ['s1', 's2'] });
  });

  test('accepts --repo and --goldens anywhere; a relative --goldens resolves against --repo', () => {
    expect(parseArgs(['--repo', '/x', 's1', '--goldens', 'g'], () => '/unused')).toEqual({ repo: '/x', goldens: '/x/g', slugs: ['s1'] });
    expect(parseArgs(['s1', '--goldens', '/abs/g'], () => '/r').goldens).toBe('/abs/g');
  });

  test('a flag with no value or an unknown flag is refused', () => {
    expect(() => parseArgs(['s1', '--repo'], () => '/r')).toThrow('--repo needs a value');
    expect(() => parseArgs(['--tree', 'x'], () => '/r')).toThrow('unknown option --tree');
  });

  test('the toplevel callback is not consulted when --repo is given', () => {
    let called = false;
    parseArgs(['--repo', '/x', 's1'], () => {
      called = true;
      return '/r';
    });
    expect(called).toBe(false);
  });
});
