/**
 * Unit tests for `pin-goldens.mts` (cdd3 T0). Run with the mission-local
 * vitest config — see `tools/README.md`.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pinGoldens, findTwin } from './pin-goldens.mts';

const RATCHET = 'oracle/goldens/svg-class/ratchet.json';
const ROUTING = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const OPTS = { sourceTag: 'cdd3-b0', closeLabel: 'close-b0', date: '2026-09-25', commit: 'abcd1234' };

let root: string;
const put = (rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};
const json = (rel: string): any => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const twin = (slug: string, status: string) => ({ tree: 'dot-cache', type: 'class', slug, status, measuredAt: 'x', measuredAgainstCommit: 'y' });

function seed(slug: string, routingStatus = 'agree'): void {
  put(RATCHET, JSON.stringify({ fixtures: [{ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' }] }));
  put(ROUTING, JSON.stringify({ $comment: 'R.', fixtures: [twin(slug, routingStatus)] }));
  put(REFUSAL, JSON.stringify({ $comment: 'F.', fixtures: [twin(slug, 'ok')] }));
  put(`test-results/dot-cache/class/${slug}/in.svg`, '<svg>golden</svg>');
  put(`test-results/dot-cache/class/${slug}/in.puml`, '@startuml\nclass A\n@enduml\n');
}

beforeEach(() => { root = mkdtempSync(join(tmpdir(), 'pin-goldens-')); });
afterEach(() => { rmSync(root, { recursive: true, force: true }); });

describe('pinGoldens', () => {
  test('copies byte-identical files, appends ratchet unsorted, clones one goldens row per baseline', () => {
    seed('aaa-slug');
    expect(pinGoldens({ root, ...OPTS, slugs: ['aaa-slug'] })).toBe(1);
    const g = join(root, 'oracle/goldens/svg-class/aaa-slug');
    expect(readFileSync(join(g, 'golden.svg'), 'utf8')).toBe('<svg>golden</svg>');
    expect(readFileSync(join(g, 'in.puml'), 'utf8')).toBe('@startuml\nclass A\n@enduml\n');
    const r = json(RATCHET).fixtures;
    expect(r[0]).toEqual({ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' });
    expect(r[1]).toEqual({ slug: 'aaa-slug', addedAt: '2026-09-25', source: 'cdd3-b0' });
    const rows = json(ROUTING).fixtures.filter((x: any) => x.tree === 'goldens');
    expect(rows).toEqual([{ tree: 'goldens', type: 'svg-class', slug: 'aaa-slug', status: 'agree', measuredAt: '2026-09-25', measuredAgainstCommit: 'abcd1234' }]);
    expect(json(REFUSAL).fixtures.filter((x: any) => x.tree === 'goldens')).toHaveLength(1);
    expect(json(ROUTING).$comment).toBe('R. Re-pinned 2026-09-25 at abcd1234 by class-divergence-drive-3 / close-b0, ADDITIVE ONLY (1 "svg-class" golden rows appended, clones of their byte-identical dot-cache twins).');
    expect(readFileSync(join(root, RATCHET), 'utf8').endsWith('}\n')).toBe(true);
  });

  test('an unhealthy twin aborts before any file is written', () => {
    seed('bad-slug', 'disagree');
    expect(() => pinGoldens({ root, ...OPTS, slugs: ['bad-slug'] })).toThrow('twin status disagree');
    expect(existsSync(join(root, 'oracle/goldens/svg-class/bad-slug'))).toBe(false);
    expect(json(RATCHET).fixtures).toHaveLength(1);
  });

  test('an already-ratcheted slug, a duplicate argument, or no slugs is refused', () => {
    seed('zzz-first');
    expect(() => pinGoldens({ root, ...OPTS, slugs: ['zzz-first'] })).toThrow('already in the ratchet');
    expect(() => pinGoldens({ root, ...OPTS, slugs: ['a', 'a'] })).toThrow('duplicate slug');
    expect(() => pinGoldens({ root, ...OPTS, slugs: [] })).toThrow('no slugs');
  });

  test('a missing cache file is refused', () => {
    seed('ccc-slug');
    rmSync(join(root, 'test-results/dot-cache/class/ccc-slug/in.puml'));
    expect(() => pinGoldens({ root, ...OPTS, slugs: ['ccc-slug'] })).toThrow('missing in.puml');
  });
});

describe('findTwin', () => {
  test('refuses an existing goldens row and a missing twin', () => {
    const b = { $comment: '', fixtures: [{ ...twin('s', 'agree'), tree: 'goldens' }] };
    expect(() => findTwin(b, 's', 'agree', 'f')).toThrow('already has a goldens row');
    expect(() => findTwin({ $comment: '', fixtures: [] }, 's', 'agree', 'f')).toThrow('0 dot-cache twins');
  });
});

describe('acceptance on a temp copy of the real files', () => {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  const slug = 'gatula-10-bifu561';
  const cached = existsSync(join(repo, 'test-results/dot-cache/class', slug, 'in.svg'));

  test.runIf(cached)('one real slug: golden byte-identical, fixtures[0] unchanged, one goldens row per baseline', () => {
    for (const rel of [RATCHET, ROUTING, REFUSAL, `test-results/dot-cache/class/${slug}/in.svg`, `test-results/dot-cache/class/${slug}/in.puml`]) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      copyFileSync(join(repo, rel), join(root, rel));
    }
    const before = json(RATCHET).fixtures;
    const goldensBefore = [ROUTING, REFUSAL].map((f) => json(f).fixtures.filter((x: any) => x.tree === 'goldens').length);
    pinGoldens({ root, ...OPTS, slugs: [slug] });
    expect(readFileSync(join(root, 'oracle/goldens/svg-class', slug, 'golden.svg')).equals(readFileSync(join(repo, 'test-results/dot-cache/class', slug, 'in.svg')))).toBe(true);
    const after = json(RATCHET).fixtures;
    expect(after[0]).toEqual(before[0]);
    expect(after.slice(0, -1)).toEqual(before);
    [ROUTING, REFUSAL].forEach((f, i) => {
      expect(json(f).fixtures.filter((x: any) => x.tree === 'goldens').length).toBe(goldensBefore[i]! + 1);
    });
  });
});
