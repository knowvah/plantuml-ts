/**
 * Fixture enumeration + canonical-SVG cache freshness for the DOT-sync report
 * (`scripts/dot-sync-report.ts`). Split out of that script when it crossed the
 * 500-line cap; the split boundary is "which fixtures exist, and is the cached
 * classification of them current".
 *
 * Two sources feed the corpus for a diagram type:
 *
 *   1. `tests/visual/data/<type>.json` — the committed, classifier-generated
 *      manifest (`{slug, markup}[]`).
 *   2. `oracle/goldens/svg-description/<type>/<slug>/in.puml` — fixtures
 *      authored by hand to cover a gap the upstream corpus has no fixture for
 *      (CLAUDE.md: "the corpus is a starting point, not a ceiling").
 *
 * Authored fixtures used to be invisible here, so they could never obtain a
 * `tests/oracle/svg-conformance/parity.json` row and could therefore never be
 * ratcheted — no regression guard, however conformant they were. See
 * `plans/si9-authored-fixture-registration/decisions.md` ADR-1 (enumerate them
 * from the golden directory rather than pasting markup into the manifest,
 * which six unrelated consumers read) and ADR-2 (per-slug canonical freshness,
 * without which `buildAgg` silently drops every newly-enumerated fixture).
 */
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  rmSync,
  existsSync,
  readdirSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

import { stripLayoutPragma } from './dot-sync-drilldown.js';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
/** execFileSync stdout cap for jar batch runs (256 MiB). */
const MAX_JAR_BUFFER_BYTES = 2 ** 28;

export const DATA_DIR = join(REPO, 'tests', 'visual', 'data');
export const CANON_DIR = join(REPO, 'test-results', 'visual-qa-svg', 'canonical');
export const GOLDEN_DIR = join(REPO, 'oracle', 'goldens', 'svg-description');
const CANON_PUML_DIR = join(REPO, 'test-results', 'visual-qa-svg', 'puml');

export interface Fixture { slug: string; markup: string }

// ---------------------------------------------------------------------------
// Enumeration (ADR-1)
// ---------------------------------------------------------------------------

/** Committed manifest entries for `type`, or undefined when there is no manifest. */
function manifestFixtures(dataDir: string, type: string): Fixture[] | undefined {
  const p = join(dataDir, type + '.json');
  if (!existsSync(p)) return undefined;
  return JSON.parse(readFileSync(p, 'utf-8')) as Fixture[];
}

/** Fixtures authored under `<goldenDir>/<type>/<slug>/in.puml`, slug-sorted.
 *  The golden directory is the single source of truth for their markup. */
export function authoredFixtures(goldenDir: string, type: string): Fixture[] {
  const dir = join(goldenDir, type);
  if (!existsSync(dir)) return [];
  const out: Fixture[] = [];
  for (const slug of [...readdirSync(dir)].sort()) {
    const puml = join(dir, slug, 'in.puml');
    if (!existsSync(puml)) continue;
    out.push({ slug, markup: readFileSync(puml, 'utf-8') });
  }
  return out;
}

/** Manifest entries followed by the authored fixtures the manifest lacks.
 *  On a slug collision the manifest entry wins — its markup is what every
 *  other consumer of `tests/visual/data/*.json` measures — and the collision
 *  is reported, because silently preferring either side is how a fixture ends
 *  up measured against the wrong source. */
export function mergeFixtures(type: string, manifest: Fixture[], authored: Fixture[]): Fixture[] {
  const known = new Set(manifest.map((f) => f.slug));
  const collisions: string[] = [];
  const merged = [...manifest];
  for (const f of authored) {
    if (known.has(f.slug)) collisions.push(f.slug);
    else merged.push(f);
  }
  if (collisions.length > 0) {
    console.error(
      '[dot-sync] ' + type + ': ' + collisions.length + ' authored fixture(s) also in the ' +
      'manifest — manifest markup wins: ' + collisions.join(', '),
    );
  }
  return merged;
}

/** Every fixture for `type`: the committed manifest plus authored goldens.
 *  undefined only when the type has neither. */
export function enumerateFixtures(
  type: string,
  dataDir: string = DATA_DIR,
  goldenDir: string = GOLDEN_DIR,
): Fixture[] | undefined {
  const manifest = manifestFixtures(dataDir, type);
  const authored = authoredFixtures(goldenDir, type);
  if (manifest === undefined) return authored.length > 0 ? authored : undefined;
  return mergeFixtures(type, manifest, authored);
}

export function findFixture(type: string, slug: string): Fixture {
  const fixtures = enumerateFixtures(type);
  if (fixtures === undefined) {
    throw new Error('No fixture manifest for "' + type + '" at tests/visual/data/' + type + '.json');
  }
  const f = fixtures.find((x) => x.slug === slug);
  if (f === undefined) throw new Error('Slug "' + slug + '" not found in ' + type + '.json');
  return f;
}

// ---------------------------------------------------------------------------
// Canonical SVG cache (ADR-2)
// ---------------------------------------------------------------------------

/** Slugs whose cached canonical SVG carries data-diagram-type="<tag>". */
export function taggedSlugs(type: string, tag: string): Set<string> {
  const dir = join(CANON_DIR, type);
  const out = new Set<string>();
  if (!existsSync(dir)) return out;
  for (const f of readdirSync(dir)) {
    if (!f.endsWith('.svg')) continue;
    if (readFileSync(join(dir, f), 'utf-8').includes('data-diagram-type="' + tag + '"')) {
      out.add(f.replace(/\.svg$/, ''));
    }
  }
  return out;
}

function freshDir(path: string): string {
  rmSync(path, { recursive: true, force: true });
  mkdirSync(path, { recursive: true });
  return path;
}

/** Batch-renders canonical SVGs for a type via the oracle jar. */
function generateCanonical(jar: string, type: string, fixtures: Fixture[]): void {
  const pumlDir = freshDir(join(CANON_PUML_DIR, type));
  const svgDir = freshDir(join(CANON_DIR, type));
  for (const f of fixtures) writeFileSync(join(pumlDir, f.slug + '.puml'), stripLayoutPragma(f.markup), 'utf-8');
  try {
    execFileSync('java', ['-DPLANTUML_DETERMINISTIC_TEXT=true', '-jar', jar, '-tsvg', '-nometadata', '-o', svgDir, pumlDir], {
      stdio: ['ignore', 'ignore', 'inherit'],
      maxBuffer: MAX_JAR_BUFFER_BYTES,
    });
  } catch {
    /* partial batch — valid SVGs are on disk */
  }
}

/** Reports every fixture the caller's tag filter dropped, split by why, plus
 *  the enumerated-vs-analysed totals.
 *
 *  A skip used to be silent, and that is exactly how a newly-enumerated fixture
 *  can enter the corpus, be dropped for want of a canonical SVG, and leave
 *  every gate green while nothing actually changed. "no canonical SVG" is the
 *  actionable bucket; "canonical but tagged as another diagram type" is the
 *  expected bulk, since a manifest classifies the whole corpus, not one type. */
export function reportSkips(
  type: string,
  tag: string,
  enumerated: number,
  analysed: number,
  skipped: string[],
  canonDir: string = join(CANON_DIR, type),
): void {
  const noCanon = new Set(skipped.filter((s) => !existsSync(join(canonDir, s + '.svg'))));
  console.error(
    '[dot-sync] ' + type + ': enumerated ' + enumerated + ', analysed ' + analysed +
    ', skipped ' + skipped.length + ' (' + noCanon.size + ' with no canonical SVG, ' +
    (skipped.length - noCanon.size) + ' canonical but not tagged ' + tag + ')',
  );
  for (const s of skipped) {
    console.error('  skip ' + type + '/' + s + ': ' + (noCanon.has(s) ? 'no canonical SVG' : 'not tagged ' + tag));
  }
}

/** Slugs in `fixtures` with no `<slug>.svg` under `dir`, in fixture order.
 *
 *  This is the whole of ADR-2's mechanism. The previous check was "the
 *  directory exists and holds at least one .svg", which is true the moment any
 *  earlier run populated it — so a newly-enumerated fixture got no canonical,
 *  hence no `data-diagram-type` tag, and `buildAgg` dropped it. Per-slug makes
 *  the cache self-healing for every future authored fixture. */
export function missingCanonicalSlugs(dir: string, fixtures: Fixture[]): string[] {
  if (!existsSync(dir)) return fixtures.map((f) => f.slug);
  const have = new Set(
    readdirSync(dir).filter((f) => f.endsWith('.svg')).map((f) => f.replace(/\.svg$/, '')),
  );
  return fixtures.filter((f) => !have.has(f.slug)).map((f) => f.slug);
}

/** Ensures `test-results/visual-qa-svg/canonical/<type>/` holds a canonical SVG
 *  for every fixture, rebuilding via the oracle jar when any is missing.
 *  Regeneration is all-or-nothing (`generateCanonical` uses `freshDir` on both
 *  directories) — deliberate, at this corpus size (ADR-2 rejected incremental). */
export function ensureCanonical(jar: string, type: string, fixtures: Fixture[]): void {
  const dir = join(CANON_DIR, type);
  const missing = missingCanonicalSlugs(dir, fixtures);
  if (missing.length === 0) return;
  console.error(
    '[dot-sync] canonical SVG cache for "' + type + '" is missing ' + missing.length + ' of ' +
    fixtures.length + ' fixture(s) (e.g. ' + missing.slice(0, 3).join(', ') + ') — ' +
    'regenerating via oracle jar…',
  );
  generateCanonical(jar, type, fixtures);
}
