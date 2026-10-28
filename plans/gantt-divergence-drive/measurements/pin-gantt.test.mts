/**
 * Unit tests for `pin-gantt.mts` (gantt-divergence-drive T7p, D7). Every test runs
 * against a temp fake repo (fake `test-results/dot-cache/gantt/` cache) and a
 * temp goldens dir — never the real `oracle/goldens/svg-gantt/`.
 *
 *   npx vitest run --config plans/gantt-divergence-drive/measurements/vitest.config.mts
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pinGantt, parseArgs } from './pin-gantt.mts';

const REAL_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const ACCEPTED_SLUG = 'lituri-55-caju105';
const DATE = '2026-10-12';
const SVG = '<svg>gantt-golden é</svg>\n';
const PUML = '@startgantt\nProject starts 2020-01-01\n[A] lasts 2 days\n@endgantt\n';

let repo: string;
let goldens: string;

const put = (abs: string, body: string): void => {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
};
const cacheFile = (slug: string, f: string): string => join(repo, 'test-results/dot-cache/gantt', slug, f);
const seedCache = (slug: string): void => {
  put(cacheFile(slug, 'in.svg'), SVG);
  put(cacheFile(slug, 'in.puml'), PUML);
};
const ratchetText = (): string => readFileSync(join(goldens, 'ratchet.json'), 'utf8');
const ratchet = (): { fixtures: { slug: string; addedAt: string; source: string }[] } => JSON.parse(ratchetText());

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'pin-gantt-repo-'));
  goldens = mkdtempSync(join(tmpdir(), 'pin-gantt-goldens-'));
  // An EMPTY ratchet in the committed schema (`{ "fixtures": [] }`), seeded
  // here rather than copied from the real file: the real one gains pins at
  // every close, and these cases assert exact slug lists (salt's b4 fix).
  writeFileSync(join(goldens, 'ratchet.json'), '{\n  "fixtures": []\n}\n');
  // The two records the refusal reads, empty in the fake repo.
  put(join(repo, 'oracle/accepted-divergences.json'), '{ "entries": [] }\n');
  put(join(repo, 'oracle/goldens/stock-error-pages.json'), '{ "errors": {} }\n');
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(goldens, { recursive: true, force: true });
});

describe('pinGantt — fresh pin', () => {
  test('copies byte-identical in.puml + golden.svg and appends one ratchet entry per slug', () => {
    seedCache('aaa-11-gantt111');
    seedCache('bbb-22-gantt222');
    const before = ratchet().fixtures;
    const result = pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111', 'bbb-22-gantt222'], date: DATE });
    expect(result).toEqual({ pinned: ['aaa-11-gantt111', 'bbb-22-gantt222'], alreadyPinned: [], refused: [] });
    for (const slug of ['aaa-11-gantt111', 'bbb-22-gantt222']) {
      expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(cacheFile(slug, 'in.svg')))).toBe(
        true,
      );
      expect(readFileSync(join(goldens, slug, 'in.puml'), 'utf8')).toBe(PUML);
    }
    expect(ratchet().fixtures).toEqual([
      ...before,
      { slug: 'aaa-11-gantt111', addedAt: DATE, source: 'dot-cache' },
      { slug: 'bbb-22-gantt222', addedAt: DATE, source: 'dot-cache' },
    ]);
    expect(ratchetText().endsWith('}\n')).toBe(true);
  });
});

describe('pinGantt — idempotent re-pin', () => {
  test('a repeated pin of the same slug is a no-op reported as already pinned', () => {
    seedCache('aaa-11-gantt111');
    pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111'], date: DATE });
    const afterFirst = ratchetText();
    const again = pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111'], date: '2026-10-13' });
    expect(again).toEqual({ pinned: [], alreadyPinned: ['aaa-11-gantt111'], refused: [] });
    expect(ratchetText()).toBe(afterFirst);
    expect(ratchet().fixtures.filter((f) => f.slug === 'aaa-11-gantt111')).toHaveLength(1);
  });

  test('a mixed run pins the new slug and reports the pinned one', () => {
    seedCache('aaa-11-gantt111');
    seedCache('ccc-33-gantt333');
    pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111'], date: DATE });
    const mixed = pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111', 'ccc-33-gantt333'], date: DATE });
    expect(mixed).toEqual({ pinned: ['ccc-33-gantt333'], alreadyPinned: ['aaa-11-gantt111'], refused: [] });
    expect(ratchet().fixtures.map((f) => f.slug)).toEqual(['aaa-11-gantt111', 'ccc-33-gantt333']);
  });
});

describe('pinGantt — refusals and mismatch', () => {
  test('a copy whose bytes differ from the cache fails loudly and leaves ratchet.json untouched', () => {
    seedCache('ddd-44-gantt444');
    const before = ratchetText();
    const corrupting = (src: string, dst: string): void => {
      writeFileSync(dst, Buffer.concat([readFileSync(src), Buffer.from('x')]));
    };
    expect(() => pinGantt({ repo, goldens, slugs: ['ddd-44-gantt444'], date: DATE, copy: corrupting })).toThrow(
      'ddd-44-gantt444: in.puml is not byte-identical to test-results/dot-cache/gantt/ddd-44-gantt444/in.puml',
    );
    expect(ratchetText()).toBe(before);
  });

  test('a missing cache file aborts before anything is written', () => {
    seedCache('eee-55-gantt555');
    rmSync(cacheFile('eee-55-gantt555', 'in.svg'));
    expect(() => pinGantt({ repo, goldens, slugs: ['eee-55-gantt555'], date: DATE })).toThrow(
      'eee-55-gantt555: missing test-results/dot-cache/gantt/eee-55-gantt555/in.svg',
    );
    expect(existsSync(join(goldens, 'eee-55-gantt555'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('no slugs, or a duplicate slug argument, is refused', () => {
    expect(() => pinGantt({ repo, goldens, slugs: [], date: DATE })).toThrow('no slugs given');
    expect(() => pinGantt({ repo, goldens, slugs: ['a', 'a'], date: DATE })).toThrow('duplicate slug in arguments: a');
  });
});

describe('pinGantt — dry run', () => {
  test('reports what would be pinned and writes nothing', () => {
    seedCache('aaa-11-gantt111');
    const before = ratchetText();
    const result = pinGantt({ repo, goldens, slugs: ['aaa-11-gantt111'], date: DATE, dryRun: true });
    expect(result).toEqual({ pinned: ['aaa-11-gantt111'], alreadyPinned: [], refused: [] });
    expect(existsSync(join(goldens, 'aaa-11-gantt111'))).toBe(false);
    expect(ratchetText()).toBe(before);
  });

  test('still refuses a missing cache file', () => {
    expect(() => pinGantt({ repo, goldens, slugs: ['zzz-99-gantt999'], date: DATE, dryRun: true })).toThrow(
      'zzz-99-gantt999: missing test-results/dot-cache/gantt/zzz-99-gantt999/in.puml',
    );
  });
});

describe('pinGantt — rule-conformant slugs are refused (T1d, D5)', () => {
  const stockSlug = (): string => {
    const keys = Object.keys(
      (JSON.parse(readFileSync(join(REAL_REPO, 'oracle/goldens/stock-error-pages.json'), 'utf8')) as {
        errors: Record<string, unknown>;
      }).errors,
    );
    return keys.find((k) => k.startsWith('gantt/') && existsSync(join(REAL_REPO, 'test-results/dot-cache', k, 'in.svg')))!.slice(6);
  };

  test('the real accepted slug is refused by name and nothing is written', () => {
    const before = ratchetText();
    const result = pinGantt({ repo: REAL_REPO, goldens, slugs: [ACCEPTED_SLUG], date: DATE });
    expect(result.pinned).toEqual([]);
    expect(result.refused.map((r) => r.slug)).toEqual([ACCEPTED_SLUG]);
    expect(existsSync(join(goldens, ACCEPTED_SLUG))).toBe(false);
    expect(ratchetText()).toBe(before);
  });

  test('an accepted-divergence id alone (not a stock error) is refused with the accepted reason', () => {
    seedCache('zzz-99-gantt999');
    put(join(repo, 'oracle/accepted-divergences.json'), JSON.stringify({ entries: [{ match: { id: 'svg-gantt/zzz-99-gantt999' } }] }));
    const result = pinGantt({ repo, goldens, slugs: ['zzz-99-gantt999'], date: DATE });
    expect(result.refused).toEqual([
      {
        slug: 'zzz-99-gantt999',
        reason: 'svg-gantt/zzz-99-gantt999 is an accepted divergence (oracle/accepted-divergences.json), not byte-equal',
      },
    ]);
    expect(existsSync(join(goldens, 'zzz-99-gantt999'))).toBe(false);
  });

  test('a stock-error-page slug is refused and nothing is written', () => {
    const slug = stockSlug();
    const before = ratchetText();
    const result = pinGantt({ repo: REAL_REPO, goldens, slugs: [slug], date: DATE });
    expect(result.pinned).toEqual([]);
    expect(result.refused).toEqual([
      {
        slug,
        reason: `gantt/${slug} is a stock jar error page (oracle/goldens/stock-error-pages.json), not byte-equal`,
      },
    ]);
    expect(existsSync(join(goldens, slug))).toBe(false);
    expect(ratchetText()).toBe(before);
  });

  test('a refusal does not block the other slugs in the same run', () => {
    seedCache('aaa-11-gantt111');
    put(join(repo, 'oracle/accepted-divergences.json'), JSON.stringify({ entries: [{ match: { id: 'svg-gantt/zzz-99-gantt999' } }] }));
    const result = pinGantt({ repo, goldens, slugs: ['zzz-99-gantt999', 'aaa-11-gantt111'], date: DATE });
    expect(result.pinned).toEqual(['aaa-11-gantt111']);
    expect(result.refused.map((r) => r.slug)).toEqual(['zzz-99-gantt999']);
    expect(ratchet().fixtures).toEqual([{ slug: 'aaa-11-gantt111', addedAt: DATE, source: 'dot-cache' }]);
  });

  test('a byte-conformant real slug pins a byte-equal golden and appends exactly one entry', () => {
    const real = JSON.parse(readFileSync(join(REAL_REPO, 'oracle/goldens/svg-gantt/ratchet.json'), 'utf8')) as {
      fixtures: { slug: string }[];
    };
    const slug = real.fixtures[0]!.slug;
    const result = pinGantt({ repo: REAL_REPO, goldens, slugs: [slug], date: DATE });
    expect(result).toEqual({ pinned: [slug], alreadyPinned: [], refused: [] });
    const cached = join(REAL_REPO, 'test-results/dot-cache/gantt', slug);
    expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(join(cached, 'in.svg')))).toBe(true);
    expect(readFileSync(join(goldens, slug, 'in.puml')).equals(readFileSync(join(cached, 'in.puml')))).toBe(true);
    expect(ratchet().fixtures).toEqual([{ slug, addedAt: DATE, source: 'dot-cache' }]);
  });
});

describe('parseArgs', () => {
  test('defaults --repo to the given toplevel, --goldens to <repo>/oracle/goldens/svg-gantt, and write to false', () => {
    expect(parseArgs(['s1', 's2'], () => '/r')).toEqual({
      repo: '/r',
      goldens: '/r/oracle/goldens/svg-gantt',
      slugs: ['s1', 's2'],
      write: false,
    });
  });

  test('--write is a boolean flag in any position and is not a slug', () => {
    expect(parseArgs(['--write', 's1'], () => '/r')).toMatchObject({ slugs: ['s1'], write: true });
    expect(parseArgs(['s1', '--write'], () => '/r')).toMatchObject({ slugs: ['s1'], write: true });
  });

  test('accepts --repo and --goldens anywhere; a relative --goldens resolves against --repo', () => {
    expect(parseArgs(['--repo', '/x', 's1', '--goldens', 'g'], () => '/unused')).toEqual({
      repo: '/x',
      goldens: '/x/g',
      slugs: ['s1'],
      write: false,
    });
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
