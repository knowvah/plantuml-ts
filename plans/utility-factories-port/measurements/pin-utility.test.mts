/**
 * Unit tests for `pin-utility.mts` (utility-factories-port T0b, D9). Every test runs
 * against a temp fake repo (fake `test-results/dot-cache/unknown/` cache) and a
 * temp goldens dir — never the real `oracle/goldens/svg-utility/`.
 *
 *   npx vitest run --config plans/utility-factories-port/measurements/vitest.config.mts
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';

import { pinUtility, parseArgs } from './pin-utility.mts';
import {
  HELP_RIGHT_CLAUSE,
  HELP_WRONG_CLAUSE,
  KUBUJU_REASON,
  KUBUJU_SLUG,
  fixRecords,
  rebuild,
  refusalRow,
  routingRow,
  type Baseline,
  type Row,
} from './repin-utility-routing.mts';
import type { MeasuredFixture } from '../../../scripts/pin-corpus-tree-measure.js';

const DATE = '2026-10-12';
const SVG = '<svg>utility-golden é</svg>\n';
const PUML = '@startuml\nlistopeniconic\n@enduml\n';

let repo: string;
let goldens: string;

const put = (abs: string, body: string): void => {
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, body);
};
const cacheFile = (slug: string, f: string): string => join(repo, 'test-results/dot-cache/unknown', slug, f);
const seedCache = (slug: string): void => {
  put(cacheFile(slug, 'in.svg'), SVG);
  put(cacheFile(slug, 'in.puml'), PUML);
};
const ratchetText = (): string => readFileSync(join(goldens, 'ratchet.json'), 'utf8');
const ratchet = (): { fixtures: { slug: string; addedAt: string; source: string }[] } => JSON.parse(ratchetText());

beforeEach(() => {
  repo = mkdtempSync(join(tmpdir(), 'pin-utility-repo-'));
  goldens = mkdtempSync(join(tmpdir(), 'pin-utility-goldens-'));
  // An EMPTY ratchet in the committed schema (`{ "fixtures": [] }`), seeded
  // here rather than copied from the real file: the real one gains pins at
  // every close, and these cases assert exact slug lists (salt's b4 fix).
  writeFileSync(join(goldens, 'ratchet.json'), '{\n  "fixtures": []\n}\n');
});
afterEach(() => {
  rmSync(repo, { recursive: true, force: true });
  rmSync(goldens, { recursive: true, force: true });
});

describe('pinUtility — fresh pin', () => {
  test('copies byte-identical in.puml + golden.svg and appends one ratchet entry per slug', () => {
    seedCache('fotete-48-viga126');
    seedCache('bamudi-49-caxo996');
    const before = ratchet().fixtures;
    const result = pinUtility({ repo, goldens, slugs: ['fotete-48-viga126', 'bamudi-49-caxo996'], date: DATE });
    expect(result).toEqual({ pinned: ['fotete-48-viga126', 'bamudi-49-caxo996'], alreadyPinned: [] });
    for (const slug of ['fotete-48-viga126', 'bamudi-49-caxo996']) {
      expect(readFileSync(join(goldens, slug, 'golden.svg')).equals(readFileSync(cacheFile(slug, 'in.svg')))).toBe(true);
      expect(readFileSync(join(goldens, slug, 'in.puml'), 'utf8')).toBe(PUML);
    }
    expect(ratchet().fixtures).toEqual([
      ...before,
      { slug: 'fotete-48-viga126', addedAt: DATE, source: 'dot-cache' },
      { slug: 'bamudi-49-caxo996', addedAt: DATE, source: 'dot-cache' },
    ]);
    expect(ratchetText().endsWith('}\n')).toBe(true);
  });
});

describe('pinUtility — idempotent re-pin', () => {
  test('a repeated pin of the same slug is a no-op reported as already pinned', () => {
    seedCache('fotete-48-viga126');
    pinUtility({ repo, goldens, slugs: ['fotete-48-viga126'], date: DATE });
    const afterFirst = ratchetText();
    const again = pinUtility({ repo, goldens, slugs: ['fotete-48-viga126'], date: '2026-10-13' });
    expect(again).toEqual({ pinned: [], alreadyPinned: ['fotete-48-viga126'] });
    expect(ratchetText()).toBe(afterFirst);
    expect(ratchet().fixtures.filter((f) => f.slug === 'fotete-48-viga126')).toHaveLength(1);
  });

  test('a mixed run pins the new slug and reports the pinned one', () => {
    seedCache('fotete-48-viga126');
    seedCache('jigemu-90-titu666');
    pinUtility({ repo, goldens, slugs: ['fotete-48-viga126'], date: DATE });
    const mixed = pinUtility({ repo, goldens, slugs: ['fotete-48-viga126', 'jigemu-90-titu666'], date: DATE });
    expect(mixed).toEqual({ pinned: ['jigemu-90-titu666'], alreadyPinned: ['fotete-48-viga126'] });
    expect(ratchet().fixtures.map((f) => f.slug)).toEqual(['fotete-48-viga126', 'jigemu-90-titu666']);
  });
});

describe('pinUtility — refusals and mismatch', () => {
  test('a copy whose bytes differ from the cache fails loudly and leaves ratchet.json untouched', () => {
    seedCache('kenari-17-dajo806');
    const before = ratchetText();
    const corrupting = (src: string, dst: string): void => {
      writeFileSync(dst, Buffer.concat([readFileSync(src), Buffer.from('x')]));
    };
    expect(() => pinUtility({ repo, goldens, slugs: ['kenari-17-dajo806'], date: DATE, copy: corrupting })).toThrow(
      'kenari-17-dajo806: in.puml is not byte-identical to test-results/dot-cache/unknown/kenari-17-dajo806/in.puml',
    );
    expect(ratchetText()).toBe(before);
  });

  test('a missing cache file aborts before anything is written', () => {
    seedCache('vedine-65-rafo449');
    rmSync(cacheFile('vedine-65-rafo449', 'in.svg'));
    expect(() => pinUtility({ repo, goldens, slugs: ['vedine-65-rafo449'], date: DATE })).toThrow(
      'vedine-65-rafo449: missing test-results/dot-cache/unknown/vedine-65-rafo449/in.svg',
    );
    expect(existsSync(join(goldens, 'vedine-65-rafo449'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('a slug outside UTILITY_SLUGS is refused before anything is written', () => {
    seedCache('zzz-00-stray000');
    expect(() => pinUtility({ repo, goldens, slugs: ['zzz-00-stray000'], date: DATE })).toThrow(
      'zzz-00-stray000: not one of the 17 UTILITY_SLUGS',
    );
    expect(existsSync(join(goldens, 'zzz-00-stray000'))).toBe(false);
    expect(ratchet().fixtures).toEqual([]);
  });

  test('no slugs, or a duplicate slug argument, is refused', () => {
    expect(() => pinUtility({ repo, goldens, slugs: [], date: DATE })).toThrow('no slugs given');
    expect(() => pinUtility({ repo, goldens, slugs: ['fotete-48-viga126', 'fotete-48-viga126'], date: DATE })).toThrow(
      'duplicate slug in arguments: fotete-48-viga126',
    );
  });
});

describe('parseArgs', () => {
  test('defaults --repo to the given toplevel and --goldens to <repo>/oracle/goldens/svg-utility', () => {
    expect(parseArgs(['s1', 's2'], () => '/r')).toEqual({ repo: '/r', goldens: '/r/oracle/goldens/svg-utility', slugs: ['s1', 's2'] });
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

describe('repin-utility-routing — pure record logic', () => {
  const STAMP = { measuredAt: '2026-10-13', measuredAgainstCommit: 'abc12345' };
  const measured = (o: Partial<MeasuredFixture> = {}): MeasuredFixture => ({
    slug: 'fotete-48-viga126',
    jarType: 'NONE',
    ourType: 'NONE',
    jarErrored: false,
    jarRendered: true,
    weErrored: false,
    engine: 'none',
    ...o,
  });
  const cacheRow = (slug: string, o: Partial<Row> = {}): Row => ({
    tree: 'dot-cache',
    type: 'unknown',
    slug,
    status: 'known-gap',
    measuredAt: '2026-09-20',
    measuredAgainstCommit: '31f579dd',
    ...o,
  });

  test('refusalRow re-pins ok and drops the old reason; a still-erroring row is refused', () => {
    const row = refusalRow(measured(), cacheRow('fotete-48-viga126', { reason: 'unported' }), STAMP);
    expect(row).toEqual({
      tree: 'dot-cache',
      type: 'unknown',
      slug: 'fotete-48-viga126',
      jarRendered: true,
      weErrored: false,
      engine: 'none',
      status: 'ok',
      ...STAMP,
    });
    expect(() => refusalRow(measured({ weErrored: true }), cacheRow('fotete-48-viga126'), STAMP)).toThrow(
      'refusal: fotete-48-viga126 errors on our side where the jar renders; no ledger excuse here',
    );
  });

  test('routingRow agrees, keeps a jar-error row, and refuses a misroute', () => {
    expect(routingRow(measured(), cacheRow('fotete-48-viga126'), STAMP).status).toBe('agree');
    const jarError = cacheRow('fotete-48-viga126', { status: 'jar-error' });
    expect(routingRow(measured({ ourType: 'CLASS' }), jarError, STAMP)).toBe(jarError);
    expect(() => routingRow(measured({ jarType: 'HELP' }), cacheRow('fotete-48-viga126'), STAMP)).toThrow(
      'routing: fotete-48-viga126 still misroutes (HELP -> NONE); no ledger excuse here',
    );
  });

  test('rebuild touches only utility rows and clones a pinned twin as a svg-utility golden', () => {
    const other = cacheRow('zzz-00-stray000');
    const base: Baseline = { $comment: 'c', fixtures: [cacheRow('fotete-48-viga126'), other] };
    const out = rebuild(base, [measured()], ['fotete-48-viga126'], routingRow, STAMP);
    expect(out.replaced).toBe(1);
    expect(out.fixtures[1]).toBe(other);
    expect(out.fixtures.at(-1)).toMatchObject({ tree: 'goldens', type: 'svg-utility', slug: 'fotete-48-viga126', status: 'agree' });
  });

  test('fixRecords rewrites only the HELP clause and the kubuju reason', () => {
    const help = cacheRow('cikoge-60-riti614', { reason: `no plugin registers HELP: ${HELP_WRONG_CLAUSE}; rest` });
    const kubuju = cacheRow(KUBUJU_SLUG, { reason: 'T9 fixed the state-seam over-claim' });
    const untouched = cacheRow('fotete-48-viga126', { reason: 'unported' });
    const { fixtures, fixed } = fixRecords({ $comment: 'c', fixtures: [help, kubuju, untouched] });
    expect(fixed).toBe(2);
    expect(fixtures[0]!.reason).toBe(`no plugin registers HELP: ${HELP_RIGHT_CLAUSE}; rest`);
    expect(fixtures[1]!.reason).toBe(KUBUJU_REASON);
    expect(fixtures[2]).toBe(untouched);
  });
});
