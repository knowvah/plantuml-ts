/**
 * Unit tests for `pin-salt.mts` (salt-engine-port T0b, D6). Every test runs
 * against a temp fake repo (fake `test-results/dot-cache/salt/` cache) and a
 * temp goldens dir — never the real `oracle/goldens/svg-salt/`.
 *
 *   npx vitest run --config plans/salt-engine-port/measurements/vitest.config.mts
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pinSalt, parseArgs, DEFAULT_GOLDENS } from './pin-salt.mts';

const DATE = '2026-10-12';
const SVG = '<svg>salt-golden é</svg>\n';
const PUML = '@startsalt\n{\n[OK]\n}\n@endsalt\n';
const REAL_REPO = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

let repo: string;
let goldens: string;

const put = (abs: string, body: string): void => {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
};
const cacheFile = (slug: string, f: string): string => join(repo, 'test-results/dot-cache/salt', slug, f);
const seedCache = (slug: string): void => {
  put(cacheFile(slug, 'in.svg'), SVG);
  put(cacheFile(slug, 'in.puml'), PUML);
};
const ratchetText = (): string => readFileSync(join(goldens, 'ratchet.json'), 'utf8');
const ratchet = (): { fixtures: { slug: string; addedAt: string; source: string }[] } => JSON.parse(ratchetText());

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'pin-salt-repo-'));
  goldens = mkdtempSync(join(tmpdir(), 'pin-salt-goldens-'));
  // A temp COPY of the real (empty at T0b) salt ratchet, so the schema the
  // tool reads and writes is the committed one.
  copyFileSync(join(REAL_REPO, DEFAULT_GOLDENS, 'ratchet.json'), join(goldens, 'ratchet.json'));
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(goldens, { recursive: true, force: true });
});

describe('pinSalt — fresh pin', () => {
  test('copies byte-identical in.puml + golden.svg and appends one ratchet entry per slug', () => {
    seedCache('aaa-11-salt111');
    seedCache('bbb-22-salt222');
    const before = ratchet().fixtures;
    const result = pinSalt({ repo, goldens, slugs: ['aaa-11-salt111', 'bbb-22-salt222'], date: DATE });
    expect(result).toEqual({ pinned: ['aaa-11-salt111', 'bbb-22-salt222'], alreadyPinned: [] });
    for (const slug of ['aaa-11-salt111', 'bbb-22-salt222']) {
      expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(cacheFile(slug, 'in.svg')))).toBe(true);
      expect(readFileSync(join(goldens, slug, 'in.puml'), 'utf8')).toBe(PUML);
    }
    expect(ratchet().fixtures).toEqual([
      ...before,
      { slug: 'aaa-11-salt111', addedAt: DATE, source: 'dot-cache' },
      { slug: 'bbb-22-salt222', addedAt: DATE, source: 'dot-cache' },
    ]);
    expect(ratchetText().endsWith('}\n')).toBe(true);
  });
});

describe('pinSalt — idempotent re-pin', () => {
  test('a repeated pin of the same slug is a no-op reported as already pinned', () => {
    seedCache('aaa-11-salt111');
    pinSalt({ repo, goldens, slugs: ['aaa-11-salt111'], date: DATE });
    const afterFirst = ratchetText();
    const again = pinSalt({ repo, goldens, slugs: ['aaa-11-salt111'], date: '2026-10-13' });
    expect(again).toEqual({ pinned: [], alreadyPinned: ['aaa-11-salt111'] });
    expect(ratchetText()).toBe(afterFirst);
    expect(ratchet().fixtures.filter((f) => f.slug === 'aaa-11-salt111')).toHaveLength(1);
  });

  test('a mixed run pins the new slug and reports the pinned one', () => {
    seedCache('aaa-11-salt111');
    seedCache('ccc-33-salt333');
    pinSalt({ repo, goldens, slugs: ['aaa-11-salt111'], date: DATE });
    const mixed = pinSalt({ repo, goldens, slugs: ['aaa-11-salt111', 'ccc-33-salt333'], date: DATE });
    expect(mixed).toEqual({ pinned: ['ccc-33-salt333'], alreadyPinned: ['aaa-11-salt111'] });
    expect(ratchet().fixtures.map((f) => f.slug)).toEqual(['aaa-11-salt111', 'ccc-33-salt333']);
  });
});

describe('pinSalt — refusals and mismatch', () => {
  test('a copy whose bytes differ from the cache fails loudly and leaves ratchet.json untouched', () => {
    seedCache('ddd-44-salt444');
    const before = ratchetText();
    const corrupting = (src: string, dst: string): void => {
      writeFileSync(dst, Buffer.concat([readFileSync(src), Buffer.from('x')]));
    };
    expect(() => pinSalt({ repo, goldens, slugs: ['ddd-44-salt444'], date: DATE, copy: corrupting })).toThrow(
      'ddd-44-salt444: in.puml is not byte-identical to test-results/dot-cache/salt/ddd-44-salt444/in.puml',
    );
    expect(ratchetText()).toBe(before);
  });

  test('a missing cache file aborts before anything is written', () => {
    seedCache('eee-55-salt555');
    rmSync(cacheFile('eee-55-salt555', 'in.svg'));
    expect(() => pinSalt({ repo, goldens, slugs: ['eee-55-salt555'], date: DATE })).toThrow(
      'eee-55-salt555: missing test-results/dot-cache/salt/eee-55-salt555/in.svg',
    );
    expect(existsSync(join(goldens, 'eee-55-salt555'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('no slugs, or a duplicate slug argument, is refused', () => {
    expect(() => pinSalt({ repo, goldens, slugs: [], date: DATE })).toThrow('no slugs given');
    expect(() => pinSalt({ repo, goldens, slugs: ['a', 'a'], date: DATE })).toThrow('duplicate slug in arguments: a');
  });
});

describe('parseArgs', () => {
  test('defaults --repo to the given toplevel and --goldens to <repo>/oracle/goldens/svg-salt', () => {
    expect(parseArgs(['s1', 's2'], () => '/r')).toEqual({ repo: '/r', goldens: '/r/oracle/goldens/svg-salt', slugs: ['s1', 's2'] });
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
