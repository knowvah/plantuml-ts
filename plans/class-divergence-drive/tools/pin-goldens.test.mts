/**
 * Unit tests for `pin-goldens.mts` (cdd3 T0; `--tree` added cdd5-T2, D4).
 * Run with the mission-local vitest config — see `tools/README.md`.
 */
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync, readFileSync, existsSync, copyFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { pinGoldens, findTwin, assertRoutedAsClass } from './pin-goldens.mts';

const RATCHET = 'oracle/goldens/svg-class/ratchet.json';
const ROUTING = 'oracle/goldens/svg-conformance/routing-baseline.json';
const REFUSAL = 'oracle/goldens/svg-conformance/refusal-baseline.json';
const OPTS = { tree: 'class' as const, sourceTag: 'cdd5-b0', closeLabel: 'close-b0', date: '2026-09-28', commit: 'abcd1234' };

let root: string;
const put = (rel: string, body: string): void => {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), body);
};
const json = (rel: string): any => JSON.parse(readFileSync(join(root, rel), 'utf8'));
const twin = (slug: string, status: string, type = 'class') => ({ tree: 'dot-cache', type, slug, status, measuredAt: 'x', measuredAgainstCommit: 'y' });
const routingRow = (slug: string, ourType: string, status = 'agree') => ({
  tree: 'dot-cache', type: 'unknown', slug, jarType: ourType, ourType, status, measuredAt: 'x', measuredAgainstCommit: 'y',
});
const refusalRow = (slug: string, status = 'ok') => ({
  tree: 'dot-cache', type: 'unknown', slug, jarRendered: true, weErrored: false, engine: 'class', status, measuredAt: 'x', measuredAgainstCommit: 'y',
});

function seed(slug: string, routingStatus = 'agree'): void {
  put(RATCHET, JSON.stringify({ fixtures: [{ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' }] }));
  put(ROUTING, JSON.stringify({ $comment: 'R.', fixtures: [twin(slug, routingStatus)] }));
  put(REFUSAL, JSON.stringify({ $comment: 'F.', fixtures: [twin(slug, 'ok')] }));
  put(`test-results/dot-cache/class/${slug}/in.svg`, '<svg>golden</svg>');
  put(`test-results/dot-cache/class/${slug}/in.puml`, '@startuml\nclass A\n@enduml\n');
}

/** cdd5-T2: seeds a `--tree unknown` fixture — the dot-cache twin rows carry
 *  `type: 'unknown'`, and the routing row additionally carries `ourType`
 *  (D4's CLASS-routing filter). */
function seedUnknown(slug: string, ourType: string): void {
  put(RATCHET, JSON.stringify({ fixtures: [{ slug: 'zzz-first', addedAt: '2026-07-18', source: 'dot-cache' }] }));
  put(ROUTING, JSON.stringify({ $comment: 'R.', fixtures: [routingRow(slug, ourType)] }));
  put(REFUSAL, JSON.stringify({ $comment: 'F.', fixtures: [refusalRow(slug)] }));
  put(`test-results/dot-cache/unknown/${slug}/in.svg`, '<svg>unknown-golden</svg>');
  put(`test-results/dot-cache/unknown/${slug}/in.puml`, '@startuml\nclass A\n@enduml\n');
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
    expect(r[1]).toEqual({ slug: 'aaa-slug', addedAt: '2026-09-28', source: 'cdd5-b0' });
    const rows = json(ROUTING).fixtures.filter((x: any) => x.tree === 'goldens');
    expect(rows).toEqual([{ tree: 'goldens', type: 'svg-class', slug: 'aaa-slug', status: 'agree', measuredAt: '2026-09-28', measuredAgainstCommit: 'abcd1234' }]);
    expect(json(REFUSAL).fixtures.filter((x: any) => x.tree === 'goldens')).toHaveLength(1);
    expect(json(ROUTING).$comment).toBe('R. Re-pinned 2026-09-28 at abcd1234 by class-divergence-drive-5 / close-b0, ADDITIVE ONLY (1 "svg-class" golden rows appended, clones of their byte-identical dot-cache twins).');
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
    expect(() => findTwin(b, 's', 'class', 'agree', 'f')).toThrow('already has a goldens row');
    expect(() => findTwin({ $comment: '', fixtures: [] }, 's', 'class', 'agree', 'f')).toThrow('0 dot-cache twins');
  });
});

describe('pinGoldens --tree unknown (D4)', () => {
  test('a CLASS-routed slug pins under svg-class/unknown/<slug>/ with tree: "unknown"', () => {
    seedUnknown('unk-slug', 'CLASS');
    expect(pinGoldens({ root, ...OPTS, tree: 'unknown', slugs: ['unk-slug'] })).toBe(1);
    const g = join(root, 'oracle/goldens/svg-class/unknown/unk-slug');
    expect(readFileSync(join(g, 'golden.svg'), 'utf8')).toBe('<svg>unknown-golden</svg>');
    expect(readFileSync(join(g, 'in.puml'), 'utf8')).toBe('@startuml\nclass A\n@enduml\n');
    const r = json(RATCHET).fixtures;
    expect(r[1]).toEqual({ slug: 'unk-slug', addedAt: '2026-09-28', source: 'cdd5-b0', tree: 'unknown' });
    const rows = json(ROUTING).fixtures.filter((x: any) => x.tree === 'goldens');
    expect(rows).toEqual([{ tree: 'goldens', type: 'svg-class', slug: 'unk-slug', jarType: 'CLASS', ourType: 'CLASS', status: 'agree', measuredAt: '2026-09-28', measuredAgainstCommit: 'abcd1234' }]);
  });

  test('a non-CLASS-routed slug aborts before any file is written', () => {
    seedUnknown('unk-bad-slug', 'ACTIVITY');
    expect(() => pinGoldens({ root, ...OPTS, tree: 'unknown', slugs: ['unk-bad-slug'] })).toThrow('not routed as CLASS');
    expect(existsSync(join(root, 'oracle/goldens/svg-class/unknown/unk-bad-slug'))).toBe(false);
    expect(json(RATCHET).fixtures).toHaveLength(1);
    expect(json(ROUTING).fixtures.filter((x: any) => x.tree === 'goldens')).toHaveLength(0);
  });

  test('a missing routing row is refused the same as a non-CLASS one', () => {
    seedUnknown('unk-nortow-slug', 'ACTIVITY');
    put(ROUTING, JSON.stringify({ $comment: 'R.', fixtures: [] }));
    expect(() => pinGoldens({ root, ...OPTS, tree: 'unknown', slugs: ['unk-nortow-slug'] })).toThrow('not routed as CLASS (ourType=missing)');
  });
});

describe('assertRoutedAsClass', () => {
  test('accepts CLASS, refuses everything else including a missing row', () => {
    const routing = { $comment: '', fixtures: [routingRow('ok-slug', 'CLASS')] };
    expect(() => assertRoutedAsClass(routing, 'ok-slug')).not.toThrow();
    expect(() => assertRoutedAsClass(routing, 'missing-slug')).toThrow('ourType=missing');
    const other = { $comment: '', fixtures: [routingRow('act-slug', 'ACTIVITY')] };
    expect(() => assertRoutedAsClass(other, 'act-slug')).toThrow('ourType=ACTIVITY');
  });
});

describe('acceptance on a temp copy of the real files', () => {
  const repo = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
  // cdd5-T2 (D4/cdd4 journal 23): a REAL corpus slug goes stale the moment it
  // is pinned for real -- the prior version of this test hardcoded
  // `gatula-10-bifu561`, which IS now pinned, so it silently skipped forever
  // (`test.runIf(cached)` was gating on the cache dir, not on "still
  // unpinned"). A synthetic slug appended to a TEMP COPY of the real
  // ratchet/baseline files exercises the exact same schema without ever
  // depending on the live corpus staying in any particular state.
  const slug = 'cdd5-t2-synthetic-acceptance-slug';

  test('a synthetic slug appended to a copy of the real baselines pins cleanly', () => {
    for (const rel of [RATCHET, ROUTING, REFUSAL]) {
      mkdirSync(dirname(join(root, rel)), { recursive: true });
      copyFileSync(join(repo, rel), join(root, rel));
    }
    const routing = json(ROUTING);
    routing.fixtures.push(twin(slug, 'agree'));
    writeFileSync(join(root, ROUTING), JSON.stringify(routing));
    const refusal = json(REFUSAL);
    refusal.fixtures.push(twin(slug, 'ok'));
    writeFileSync(join(root, REFUSAL), JSON.stringify(refusal));
    put(`test-results/dot-cache/class/${slug}/in.svg`, '<svg>synthetic</svg>');
    put(`test-results/dot-cache/class/${slug}/in.puml`, '@startuml\nclass Synthetic\n@enduml\n');

    const before = json(RATCHET).fixtures;
    const goldensBefore = [ROUTING, REFUSAL].map((f) => json(f).fixtures.filter((x: any) => x.tree === 'goldens').length);
    pinGoldens({ root, ...OPTS, slugs: [slug] });
    expect(readFileSync(join(root, 'oracle/goldens/svg-class', slug, 'golden.svg'), 'utf8')).toBe('<svg>synthetic</svg>');
    const after = json(RATCHET).fixtures;
    expect(after[0]).toEqual(before[0]);
    expect(after.slice(0, -1)).toEqual(before);
    [ROUTING, REFUSAL].forEach((f, i) => {
      expect(json(f).fixtures.filter((x: any) => x.tree === 'goldens').length).toBe(goldensBefore[i]! + 1);
    });
  });
});
