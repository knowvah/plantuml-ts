/**
 * Unit tests for `pin-json-family.mts` (json-style-engine T0a, D1).
 * Every test runs against a temp fake repo (fake `test-results/dot-cache/<type>/`
 * cache) and a temp goldens dir — never the real `oracle/goldens/svg-<type>/`.
 *
 *   npx vitest run --config plans/json-family-followons/measurements/vitest.config.mts
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pinFamily, parseArgs, type FamilyType } from './pin-json-family.mts';

const REAL_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const DATE = '2026-10-28';
const SVG = '<svg>json-golden é</svg>\n';
const PUML = '@startjson\n{"a": 1}\n@endjson\n';

let repo: string;
let goldens: string;

const put = (abs: string, body: string): void => {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
};
const cacheFile = (type: FamilyType, slug: string, f: string): string =>
  join(repo, 'test-results/dot-cache', type, slug, f);
const seedCache = (slug: string, type: FamilyType = 'json'): void => {
  put(cacheFile(type, slug, 'in.svg'), SVG);
  put(cacheFile(type, slug, 'in.puml'), PUML);
};
const ratchetText = (): string => readFileSync(join(goldens, 'ratchet.json'), 'utf8');
const ratchet = (): { fixtures: { slug: string; addedAt: string; source: string }[] } => JSON.parse(ratchetText());
const pin = (slugs: string[], extra: Partial<Parameters<typeof pinFamily>[0]> = {}) =>
  pinFamily({ type: 'json', repo, goldens, slugs, date: DATE, ...extra });

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'pin-family-repo-'));
  goldens = mkdtempSync(join(tmpdir(), 'pin-family-goldens-'));
  writeFileSync(join(goldens, 'ratchet.json'), '{\n  "fixtures": []\n}\n');
  put(join(repo, 'oracle/accepted-divergences.json'), '{ "entries": [] }\n');
  put(join(repo, 'oracle/goldens/stock-error-pages.json'), '{ "errors": {} }\n');
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(goldens, { recursive: true, force: true });
});

describe('pinFamily — fresh pin', () => {
  test('copies byte-identical in.puml + golden.svg and appends one ratchet entry per slug', () => {
    seedCache('aaa-11-json111');
    seedCache('bbb-22-json222');
    const result = pin(['aaa-11-json111', 'bbb-22-json222']);
    expect(result).toEqual({ pinned: ['aaa-11-json111', 'bbb-22-json222'], alreadyPinned: [], refused: [] });
    for (const slug of ['aaa-11-json111', 'bbb-22-json222']) {
      expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(cacheFile('json', slug, 'in.svg')))).toBe(true);
      expect(readFileSync(join(goldens, slug, 'in.puml'), 'utf8')).toBe(PUML);
    }
    expect(ratchet().fixtures).toEqual([
      { slug: 'aaa-11-json111', addedAt: DATE, source: 'dot-cache' },
      { slug: 'bbb-22-json222', addedAt: DATE, source: 'dot-cache' },
    ]);
    expect(ratchetText().endsWith('}\n')).toBe(true);
  });

  test('the type selects the cache directory: a yaml pin reads dot-cache/yaml, and files reads dot-cache/files', () => {
    seedCache('ccc-33-yaml333', 'yaml');
    seedCache('ddd-44-files44', 'files');
    expect(pin(['ccc-33-yaml333'], { type: 'yaml' }).pinned).toEqual(['ccc-33-yaml333']);
    expect(() => pin(['ddd-44-files44'], { type: 'yaml' })).toThrow(
      'ddd-44-files44: missing test-results/dot-cache/yaml/ddd-44-files44/in.puml',
    );
    expect(pin(['ddd-44-files44'], { type: 'files' }).pinned).toEqual(['ddd-44-files44']);
  });
});

describe('pinFamily — idempotent re-pin', () => {
  test('a repeated pin of the same slug is a no-op reported as already pinned', () => {
    seedCache('aaa-11-json111');
    pin(['aaa-11-json111']);
    const afterFirst = ratchetText();
    const again = pin(['aaa-11-json111'], { date: '2026-10-29' });
    expect(again).toEqual({ pinned: [], alreadyPinned: ['aaa-11-json111'], refused: [] });
    expect(ratchetText()).toBe(afterFirst);
  });

  test('a mixed run pins the new slug and reports the pinned one', () => {
    seedCache('aaa-11-json111');
    seedCache('ccc-33-json333');
    pin(['aaa-11-json111']);
    const mixed = pin(['aaa-11-json111', 'ccc-33-json333']);
    expect(mixed).toEqual({ pinned: ['ccc-33-json333'], alreadyPinned: ['aaa-11-json111'], refused: [] });
    expect(ratchet().fixtures.map((f) => f.slug)).toEqual(['aaa-11-json111', 'ccc-33-json333']);
  });
});

describe('pinFamily — refusals and mismatch', () => {
  test('a copy whose bytes differ from the cache fails loudly and leaves ratchet.json untouched', () => {
    seedCache('ddd-44-json444');
    const before = ratchetText();
    const corrupting = (src: string, dst: string): void => {
      writeFileSync(dst, Buffer.concat([readFileSync(src), Buffer.from('x')]));
    };
    expect(() => pin(['ddd-44-json444'], { copy: corrupting })).toThrow(
      'ddd-44-json444: in.puml is not byte-identical to test-results/dot-cache/json/ddd-44-json444/in.puml',
    );
    expect(ratchetText()).toBe(before);
  });

  test('a missing cache file aborts before anything is written', () => {
    seedCache('eee-55-json555');
    rmSync(cacheFile('json', 'eee-55-json555', 'in.svg'));
    expect(() => pin(['eee-55-json555'])).toThrow(
      'eee-55-json555: missing test-results/dot-cache/json/eee-55-json555/in.svg',
    );
    expect(existsSync(join(goldens, 'eee-55-json555'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('no slugs, or a duplicate slug argument, is refused', () => {
    expect(() => pin([])).toThrow('no slugs given');
    expect(() => pin(['a', 'a'])).toThrow('duplicate slug in arguments: a');
  });

  test('an accepted-divergence id is refused with the typed prefix and nothing is written', () => {
    seedCache('zzz-99-hcl999', 'hcl');
    put(join(repo, 'oracle/accepted-divergences.json'), JSON.stringify({ entries: [{ match: { id: 'svg-hcl/zzz-99-hcl999' } }] }));
    const result = pin(['zzz-99-hcl999'], { type: 'hcl' });
    expect(result.refused).toEqual([
      { slug: 'zzz-99-hcl999', reason: 'svg-hcl/zzz-99-hcl999 is an accepted divergence (oracle/accepted-divergences.json), not byte-equal' },
    ]);
    expect(existsSync(join(goldens, 'zzz-99-hcl999'))).toBe(false);
  });

  test('a stock-error-page slug is refused with the typed prefix', () => {
    seedCache('yyy-88-files88', 'files');
    put(
      join(repo, 'oracle/goldens/stock-error-pages.json'),
      JSON.stringify({ errors: { 'files/yyy-88-files88': { line: 1, message: 'Syntax Error?' } } }),
    );
    const result = pin(['yyy-88-files88'], { type: 'files' });
    expect(result.refused).toEqual([
      { slug: 'yyy-88-files88', reason: 'files/yyy-88-files88 is a stock jar error page (oracle/goldens/stock-error-pages.json), not byte-equal' },
    ]);
    expect(result.pinned).toEqual([]);
  });

  test('a refusal does not block the other slugs in the same run', () => {
    seedCache('aaa-11-json111');
    put(join(repo, 'oracle/accepted-divergences.json'), JSON.stringify({ entries: [{ match: { id: 'svg-json/zzz-99-json999' } }] }));
    const result = pin(['zzz-99-json999', 'aaa-11-json111']);
    expect(result.pinned).toEqual(['aaa-11-json111']);
    expect(result.refused.map((r) => r.slug)).toEqual(['zzz-99-json999']);
    expect(ratchet().fixtures).toEqual([{ slug: 'aaa-11-json111', addedAt: DATE, source: 'dot-cache' }]);
  });
});

describe('pinFamily — dry run', () => {
  test('reports what would be pinned and writes nothing', () => {
    seedCache('aaa-11-json111');
    const before = ratchetText();
    const result = pin(['aaa-11-json111'], { dryRun: true });
    expect(result).toEqual({ pinned: ['aaa-11-json111'], alreadyPinned: [], refused: [] });
    expect(existsSync(join(goldens, 'aaa-11-json111'))).toBe(false);
    expect(ratchetText()).toBe(before);
  });

  test('still refuses a missing cache file', () => {
    expect(() => pin(['zzz-99-json999'], { dryRun: true })).toThrow(
      'zzz-99-json999: missing test-results/dot-cache/json/zzz-99-json999/in.puml',
    );
  });
});

describe('pinFamily — the real repo', () => {
  test('a byte-conformant real json slug pins a byte-equal golden and appends exactly one entry', () => {
    const real = JSON.parse(readFileSync(join(REAL_REPO, 'oracle/goldens/svg-json/ratchet.json'), 'utf8')) as {
      fixtures: { slug: string }[];
    };
    const slug = real.fixtures[0]!.slug;
    const result = pinFamily({ type: 'json', repo: REAL_REPO, goldens, slugs: [slug], date: DATE });
    expect(result).toEqual({ pinned: [slug], alreadyPinned: [], refused: [] });
    const cached = join(REAL_REPO, 'test-results/dot-cache/json', slug);
    expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(join(cached, 'in.svg')))).toBe(true);
    expect(readFileSync(join(goldens, slug, 'in.puml')).equals(readFileSync(join(cached, 'in.puml')))).toBe(true);
    expect(ratchet().fixtures).toEqual([{ slug, addedAt: DATE, source: 'dot-cache' }]);
  });
});

describe('parseArgs', () => {
  test('the first positional is the type; --repo defaults to the toplevel, --goldens to <repo>/oracle/goldens/svg-<type>', () => {
    expect(parseArgs(['yaml', 's1', 's2'], () => '/r')).toEqual({
      type: 'yaml',
      repo: '/r',
      goldens: '/r/oracle/goldens/svg-yaml',
      slugs: ['s1', 's2'],
      write: false,
    });
  });

  test('a fixed type (pin-files.mts) takes no type positional', () => {
    expect(parseArgs(['s1'], () => '/r', 'files')).toEqual({
      type: 'files',
      repo: '/r',
      goldens: '/r/oracle/goldens/svg-files',
      slugs: ['s1'],
      write: false,
    });
  });

  test('an unknown or missing type is refused', () => {
    expect(() => parseArgs(['gantt', 's1'], () => '/r')).toThrow('first argument must be one of json|yaml|hcl|files');
    expect(() => parseArgs([], () => '/r')).toThrow('first argument must be one of json|yaml|hcl|files');
  });

  test('--write is a boolean flag in any position; --repo/--goldens anywhere; relative --goldens resolves against --repo', () => {
    expect(parseArgs(['--write', 'json', 's1'], () => '/r')).toMatchObject({ slugs: ['s1'], write: true });
    expect(parseArgs(['json', 's1', '--write'], () => '/r')).toMatchObject({ slugs: ['s1'], write: true });
    expect(parseArgs(['--repo', '/x', 'hcl', 's1', '--goldens', 'g'], () => '/unused')).toEqual({
      type: 'hcl',
      repo: '/x',
      goldens: '/x/g',
      slugs: ['s1'],
      write: false,
    });
  });

  test('a flag with no value or an unknown flag is refused', () => {
    expect(() => parseArgs(['json', 's1', '--repo'], () => '/r')).toThrow('--repo needs a value');
    expect(() => parseArgs(['json', '--tree', 'x'], () => '/r')).toThrow('unknown option --tree');
  });
});
