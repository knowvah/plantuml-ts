/**
 * Unit tests for the DOT-sync report's fixture enumeration and canonical-cache
 * freshness (`scripts/dot-sync-fixtures.ts`, mission SI9).
 *
 * The defect being covered is a *silent* one: before ADR-1 a fixture authored
 * under `oracle/goldens/svg-description/<type>/<slug>/in.puml` never entered
 * the corpus at all, and before ADR-2 one that did enter was dropped again by
 * the tag filter for want of a canonical SVG — with no output either way.
 * So these tests assert on the enumerated slugs AND on what reaches stderr.
 *
 * Enumeration is exercised against real temp directories rather than a mocked
 * `fs`, so the directory walk itself is under test.
 */
import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import {
  authoredFixtures,
  mergeFixtures,
  enumerateFixtures,
  missingCanonicalSlugs,
  reportSkips,
  DATA_DIR,
  GOLDEN_DIR,
  CLASS_GOLDEN_DIR,
  type Fixture,
} from '../../../scripts/dot-sync-fixtures.js';

/** The three fixtures authored by `svg-sprite-nanoparser`; SI9 exists so that
 *  fixtures like these can be measured and ratcheted. */
const AUTHORED_USECASE_SLUGS = [
  'sprite-svg-archimate-0',
  'sprite-svg-bootstrap-0',
  'sprite-svg-multiline-0',
];

/** The five fixtures authored under `oracle/goldens/svg-class/` (SI13), in
 *  the sorted order `authoredFixtures` returns them. */
const AUTHORED_CLASS_SLUGS = [
  'class-actor-bare-no-allowmixing',
  'class-allowmixing-usecase-mix',
  'class-missing-label-URL-SVG-0',
  'class-usecase-inline-img',
  'class-usecase-inline-sprite',
];

let tmp: string;

/** Writes `<root>/<type>/<slug>/in.puml` for each entry. */
function makeGoldens(root: string, type: string, entries: Record<string, string>): void {
  for (const [slug, markup] of Object.entries(entries)) {
    mkdirSync(join(root, type, slug), { recursive: true });
    writeFileSync(join(root, type, slug, 'in.puml'), markup, 'utf-8');
  }
}

function makeManifest(root: string, type: string, fixtures: Fixture[]): void {
  mkdirSync(root, { recursive: true });
  writeFileSync(join(root, type + '.json'), JSON.stringify(fixtures), 'utf-8');
}

beforeAll(() => {
  tmp = mkdtempSync(join(tmpdir(), 'si9-fixtures-'));
});

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

// ---------------------------------------------------------------------------
// authoredFixtures
// ---------------------------------------------------------------------------

describe('authoredFixtures', () => {
  it('reads each golden directory\'s in.puml as the fixture markup', () => {
    const golden = join(tmp, 'authored-basic');
    makeGoldens(golden, 'usecase', { bravo: '@startuml\nB\n@enduml\n', alpha: '@startuml\nA\n@enduml\n' });

    expect(authoredFixtures(golden, 'usecase')).toEqual([
      { slug: 'alpha', markup: '@startuml\nA\n@enduml\n' },
      { slug: 'bravo', markup: '@startuml\nB\n@enduml\n' },
    ]);
  });

  it('ignores directory entries with no in.puml, and files at the type level', () => {
    const golden = join(tmp, 'authored-noise');
    makeGoldens(golden, 'usecase', { real: '@startuml\nR\n@enduml\n' });
    mkdirSync(join(golden, 'usecase', 'golden-only'), { recursive: true });
    writeFileSync(join(golden, 'usecase', 'golden-only', 'golden.svg'), '<svg/>', 'utf-8');
    writeFileSync(join(golden, 'usecase', 'README.md'), '# notes\n', 'utf-8');

    expect(authoredFixtures(golden, 'usecase').map((f) => f.slug)).toEqual(['real']);
  });

  it('returns an empty list when the type has no golden directory', () => {
    expect(authoredFixtures(join(tmp, 'authored-basic'), 'state')).toEqual([]);
  });

  // -------------------------------------------------------------------------
  // Flat layout for "class" — SI13 ADR-1
  // -------------------------------------------------------------------------

  it('reads slugs directly under goldenDir for type "class" (flat layout, no <type> level)', () => {
    const golden = join(tmp, 'authored-class-flat');
    mkdirSync(join(golden, 'bravo'), { recursive: true });
    writeFileSync(join(golden, 'bravo', 'in.puml'), '@startuml\nB\n@enduml\n', 'utf-8');
    mkdirSync(join(golden, 'alpha'), { recursive: true });
    writeFileSync(join(golden, 'alpha', 'in.puml'), '@startuml\nA\n@enduml\n', 'utf-8');

    // Uses `golden` itself as the slug root — NOT `golden/class/` — proving
    // the flat resolution, without depending on the live golden set growing.
    expect(authoredFixtures(golden, 'class')).toEqual([
      { slug: 'alpha', markup: '@startuml\nA\n@enduml\n' },
      { slug: 'bravo', markup: '@startuml\nB\n@enduml\n' },
    ]);
  });

  it('skips the flat root\'s non-fixture entries (README.md, ratchet.json)', () => {
    const golden = join(tmp, 'authored-class-flat-noise');
    mkdirSync(join(golden, 'real'), { recursive: true });
    writeFileSync(join(golden, 'real', 'in.puml'), '@startuml\nR\n@enduml\n', 'utf-8');
    writeFileSync(join(golden, 'README.md'), '# notes\n', 'utf-8');
    writeFileSync(join(golden, 'ratchet.json'), '[]', 'utf-8');

    expect(authoredFixtures(golden, 'class').map((f) => f.slug)).toEqual(['real']);
  });

  it('keeps the <goldenDir>/<type>/ shape for every type other than "class" (regression guard)', () => {
    const golden = join(tmp, 'authored-shape-guard');
    makeGoldens(golden, 'usecase', { u1: 'U1' });
    // Would only be picked up if the "class" flat-resolution branch leaked
    // into other types — proves it does not.
    mkdirSync(join(golden, 'u1-flat-decoy'), { recursive: true });
    writeFileSync(join(golden, 'u1-flat-decoy', 'in.puml'), 'DECOY', 'utf-8');

    expect(authoredFixtures(golden, 'usecase')).toEqual([{ slug: 'u1', markup: 'U1' }]);
  });
});

// ---------------------------------------------------------------------------
// mergeFixtures — AC2
// ---------------------------------------------------------------------------

describe('mergeFixtures', () => {
  it('appends authored fixtures the manifest lacks, after the manifest, in order', () => {
    const manifest: Fixture[] = [{ slug: 'm1', markup: 'M1' }, { slug: 'm2', markup: 'M2' }];
    const authored: Fixture[] = [{ slug: 'a1', markup: 'A1' }];

    expect(mergeFixtures('usecase', manifest, authored)).toEqual([
      { slug: 'm1', markup: 'M1' },
      { slug: 'm2', markup: 'M2' },
      { slug: 'a1', markup: 'A1' },
    ]);
  });

  it('lets the manifest win a slug collision and names the collision on stderr', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const merged = mergeFixtures(
        'usecase',
        [{ slug: 'dup', markup: 'FROM-MANIFEST' }],
        [{ slug: 'dup', markup: 'FROM-GOLDEN' }],
      );

      expect(merged).toEqual([{ slug: 'dup', markup: 'FROM-MANIFEST' }]);
      expect(err).toHaveBeenCalledTimes(1);
      const msg = err.mock.calls[0]![0] as string;
      expect(msg).toContain('usecase');
      expect(msg).toContain('manifest markup wins');
      expect(msg).toContain('dup');
    } finally {
      err.mockRestore();
    }
  });

  it('counts identical-markup collisions but names only DIFFERING-markup ones (SI13: class collides 310x by design)', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      mergeFixtures(
        'class',
        [
          { slug: 'same1', markup: 'X' },
          { slug: 'same2', markup: 'Y' },
          { slug: 'drift', markup: 'MANIFEST-SIDE' },
        ],
        [
          { slug: 'same1', markup: 'X' },
          { slug: 'same2', markup: 'Y' },
          { slug: 'drift', markup: 'GOLDEN-SIDE' },
        ],
      );
      expect(err).toHaveBeenCalledTimes(1);
      const msg = err.mock.calls[0]![0] as string;
      expect(msg).toContain('manifest markup wins');
      expect(msg).toContain('2 identical-markup');
      expect(msg).toContain('1 DIFFERING-markup slug(s): drift');
      // Identical collisions are counted, never named.
      expect(msg).not.toContain('same1');
      expect(msg).not.toContain('same2');
    } finally {
      err.mockRestore();
    }
  });

  it('says nothing when there is no collision', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      mergeFixtures('usecase', [{ slug: 'm1', markup: 'M1' }], [{ slug: 'a1', markup: 'A1' }]);
      expect(err).toHaveBeenCalledTimes(0);
    } finally {
      err.mockRestore();
    }
  });
});

// ---------------------------------------------------------------------------
// enumerateFixtures — AC1, AC5
// ---------------------------------------------------------------------------

describe('enumerateFixtures', () => {
  it('merges manifest and authored fixtures for a type that has both', () => {
    const data = join(tmp, 'enum-both', 'data');
    const golden = join(tmp, 'enum-both', 'goldens');
    makeManifest(data, 'usecase', [{ slug: 'm1', markup: 'M1' }]);
    makeGoldens(golden, 'usecase', { a1: 'A1' });

    expect(enumerateFixtures('usecase', data, golden)).toEqual([
      { slug: 'm1', markup: 'M1' },
      { slug: 'a1', markup: 'A1' },
    ]);
  });

  it('returns the manifest verbatim for a type with no authored fixtures', () => {
    const data = join(tmp, 'enum-manifest-only', 'data');
    const golden = join(tmp, 'enum-manifest-only', 'goldens');
    const manifest: Fixture[] = [{ slug: 'm1', markup: 'M1' }, { slug: 'm2', markup: 'M2' }];
    makeManifest(data, 'state', manifest);

    expect(enumerateFixtures('state', data, golden)).toEqual(manifest);
  });

  it('returns authored fixtures alone when the type has no manifest', () => {
    const data = join(tmp, 'enum-authored-only', 'data');
    const golden = join(tmp, 'enum-authored-only', 'goldens');
    mkdirSync(data, { recursive: true });
    makeGoldens(golden, 'usecase', { a1: 'A1' });

    expect(enumerateFixtures('usecase', data, golden)).toEqual([{ slug: 'a1', markup: 'A1' }]);
  });

  it('returns undefined when the type has neither a manifest nor authored fixtures', () => {
    const data = join(tmp, 'enum-neither', 'data');
    const golden = join(tmp, 'enum-neither', 'goldens');
    mkdirSync(data, { recursive: true });

    expect(enumerateFixtures('sequence', data, golden)).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// enumerateFixtures against the real repo corpus — AC1, AC5
// ---------------------------------------------------------------------------

describe('enumerateFixtures over the committed corpus', () => {
  it('keeps the 351 usecase manifest entries unchanged in count and order, then appends the authored ones', () => {
    const manifest = JSON.parse(readFileSync(join(DATA_DIR, 'usecase.json'), 'utf-8')) as Fixture[];
    expect(manifest).toHaveLength(351);

    const enumerated = enumerateFixtures('usecase');
    expect(enumerated).toBeDefined();
    expect(enumerated!.slice(0, 351)).toEqual(manifest);
    expect(enumerated!.slice(351).map((f) => f.slug)).toEqual(AUTHORED_USECASE_SLUGS);
  });

  it('takes an authored fixture\'s markup from its golden in.puml', () => {
    const enumerated = enumerateFixtures('usecase')!;
    const sprite = enumerated.find((f) => f.slug === 'sprite-svg-bootstrap-0');
    const onDisk = readFileSync(
      join(GOLDEN_DIR, 'usecase', 'sprite-svg-bootstrap-0', 'in.puml'),
      'utf-8',
    );

    expect(sprite?.markup).toBe(onDisk);
  });

  it('leaves a type with no authored fixtures byte-identical to its manifest', () => {
    const manifest = JSON.parse(readFileSync(join(DATA_DIR, 'state.json'), 'utf-8')) as Fixture[];
    expect(enumerateFixtures('state')).toEqual(manifest);
  });

  it('adds nothing for component, whose authored slugs are all already in the manifest', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const manifest = JSON.parse(readFileSync(join(DATA_DIR, 'component.json'), 'utf-8')) as Fixture[];
      expect(enumerateFixtures('component')).toEqual(manifest);
      expect(err).toHaveBeenCalledTimes(1);
      expect(err.mock.calls[0]![0] as string).toContain('manifest markup wins');
    } finally {
      err.mockRestore();
    }
  });

  // ---------------------------------------------------------------------------
  // enumerateFixtures('class') — flat golden root — SI13 ADR-1
  //
  // `tests/visual/data/class.json` exists (768 entries, corpus-classified) —
  // ADR-1's "class has no manifest" premise does not hold on disk, so this
  // takes `mergeFixtures`' manifest branch, not the authored-only branch.
  // 309 of the 314 flat-root slugs are corpus-derived and already present in
  // the manifest by slug; of the five hand-authored `class-*` fixtures, one
  // (`class-missing-label-URL-SVG-0`) also collides (byte-identical markup on
  // both sides) and four are genuinely new. The flat-layout mechanism under
  // test — `enumerateFixtures('class')` reading `CLASS_GOLDEN_DIR` flat — is
  // unaffected either way; only which merge branch fires differs from ADR-1's
  // stated assumption.
  // ---------------------------------------------------------------------------

  it('keeps the class.json manifest unchanged, then appends the 4 authored fixtures new to it', () => {
    const manifest = JSON.parse(readFileSync(join(DATA_DIR, 'class.json'), 'utf-8')) as Fixture[];
    expect(manifest).toHaveLength(768);

    const enumerated = enumerateFixtures('class');
    expect(enumerated).toBeDefined();
    expect(enumerated!.slice(0, 768)).toEqual(manifest);
    expect(enumerated!.slice(768).map((f) => f.slug)).toEqual([
      'class-actor-bare-no-allowmixing',
      'class-allowmixing-usecase-mix',
      'class-usecase-inline-img',
      'class-usecase-inline-sprite',
    ]);
  });

  it('reads every one of the five authored class goldens\' markup from their in.puml', () => {
    const enumerated = enumerateFixtures('class')!;
    for (const slug of AUTHORED_CLASS_SLUGS) {
      const onDisk = readFileSync(join(CLASS_GOLDEN_DIR, slug, 'in.puml'), 'utf-8');
      expect(enumerated.find((f) => f.slug === slug)?.markup).toBe(onDisk);
    }
  });

  it('reports collisions with identical markup as a count only; identical slugs are never named (manifest wins)', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      const enumerated = enumerateFixtures('class')!;
      // The colliding authored golden dedupes to exactly one entry.
      expect(enumerated.filter((f) => f.slug === 'class-missing-label-URL-SVG-0')).toHaveLength(1);
      const msg = err.mock.calls.map((c) => c[0] as string).find((m) => m.startsWith('[dot-sync] class:'));
      expect(msg).toContain('manifest markup wins');
      // 310 corpus goldens collide by design (SI13) — identical-markup
      // collisions are counted, not named, so the message stays readable
      // and the DIFFERING list (the dangerous kind) stays visible.
      expect(msg).toContain('identical-markup');
      expect(msg).not.toContain('class-missing-label-URL-SVG-0');
      // The 8 known pragma-only drifts ARE named (see mergeFixtures' doc
      // comment; journal 2026-08-04).
      expect(msg).toContain('DIFFERING-markup');
      expect(msg).toContain('bemuvo-33-jofa419');
    } finally {
      err.mockRestore();
    }
  });

  it('skips the flat class root\'s README.md and ratchet.json entries', () => {
    const slugs = new Set(enumerateFixtures('class')!.map((f) => f.slug));
    expect(slugs.has('README.md')).toBe(false);
    expect(slugs.has('ratchet.json')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// missingCanonicalSlugs — AC3
// ---------------------------------------------------------------------------

describe('missingCanonicalSlugs', () => {
  const fixtures: Fixture[] = [
    { slug: 'have', markup: 'H' },
    { slug: 'lack', markup: 'L' },
  ];

  it('reports the missing slug for a POPULATED directory — the ADR-2 case', () => {
    const dir = join(tmp, 'canon-partial');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'have.svg'), '<svg/>', 'utf-8');

    // Pre-ADR-2 this directory early-returned "fresh" because it holds an .svg.
    expect(missingCanonicalSlugs(dir, fixtures)).toEqual(['lack']);
  });

  it('reports nothing once every fixture has a canonical', () => {
    const dir = join(tmp, 'canon-complete');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'have.svg'), '<svg/>', 'utf-8');
    writeFileSync(join(dir, 'lack.svg'), '<svg/>', 'utf-8');

    expect(missingCanonicalSlugs(dir, fixtures)).toEqual([]);
  });

  it('reports every slug when the directory does not exist', () => {
    expect(missingCanonicalSlugs(join(tmp, 'canon-absent'), fixtures)).toEqual(['have', 'lack']);
  });

  it('ignores non-SVG entries when deciding what is cached', () => {
    const dir = join(tmp, 'canon-nonsvg');
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, 'have.puml'), '@startuml\n@enduml\n', 'utf-8');
    writeFileSync(join(dir, 'lack.svg'), '<svg/>', 'utf-8');

    expect(missingCanonicalSlugs(dir, fixtures)).toEqual(['have']);
  });
});

// ---------------------------------------------------------------------------
// reportSkips — AC4
// ---------------------------------------------------------------------------

describe('reportSkips', () => {
  /** No canonical directory exists for this type, so every skipped slug lands
   *  in the "no canonical SVG" bucket deterministically. */
  const TYPE = 'si9-no-such-type';

  it('names every skipped slug and the enumerated-vs-analysed totals on stderr', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      reportSkips(TYPE, 'DESCRIPTION', 5, 3, ['alpha', 'bravo'], join(tmp, 'no-canon-dir'));

      const lines = err.mock.calls.map((c) => c[0] as string);
      expect(lines).toHaveLength(3);
      expect(lines[0]).toBe(
        '[dot-sync] ' + TYPE + ': enumerated 5, analysed 3, skipped 2 ' +
        '(2 with no canonical SVG, 0 canonical but not tagged DESCRIPTION)',
      );
      expect(lines[1]).toBe('  skip ' + TYPE + '/alpha: no canonical SVG');
      expect(lines[2]).toBe('  skip ' + TYPE + '/bravo: no canonical SVG');
    } finally {
      err.mockRestore();
    }
  });

  it('still reports the totals when nothing was skipped', () => {
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      reportSkips(TYPE, 'DESCRIPTION', 3, 3, [], join(tmp, 'no-canon-dir'));

      expect(err).toHaveBeenCalledTimes(1);
      expect(err.mock.calls[0]![0] as string).toBe(
        '[dot-sync] ' + TYPE + ': enumerated 3, analysed 3, skipped 0 ' +
        '(0 with no canonical SVG, 0 canonical but not tagged DESCRIPTION)',
      );
    } finally {
      err.mockRestore();
    }
  });

  it('separates a slug that has a canonical SVG but carries another diagram type\'s tag', () => {
    const canon = join(tmp, 'skip-mixed');
    mkdirSync(canon, { recursive: true });
    writeFileSync(join(canon, 'tagged-other.svg'), '<svg data-diagram-type="CLASS"/>', 'utf-8');
    const err = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    try {
      reportSkips('usecase', 'DESCRIPTION', 4, 1, ['tagged-other', 'never-rendered'], canon);

      const lines = err.mock.calls.map((c) => c[0] as string);
      expect(lines[0]).toBe(
        '[dot-sync] usecase: enumerated 4, analysed 1, skipped 2 ' +
        '(1 with no canonical SVG, 1 canonical but not tagged DESCRIPTION)',
      );
      expect(lines[1]).toBe('  skip usecase/tagged-other: not tagged DESCRIPTION');
      expect(lines[2]).toBe('  skip usecase/never-rendered: no canonical SVG');
    } finally {
      err.mockRestore();
    }
  });
});
