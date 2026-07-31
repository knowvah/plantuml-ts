/**
 * si11b T1 -- the bootstrap sprite splitter, its ADR-2 allowlist gate, and
 * its `build-stdlib-packages.ts` wiring.
 *
 * `plans/si11b-bootstrap-sprite-splitting/batch-1/T1-sprite-splitter.md`'s
 * five acceptance criteria, in order:
 *
 *   1. 2,078 fragments, each parsing as exactly one sprite block via the
 *      runtime's own parser; the name-list manifest gzips to <= 8 KB.
 *   2. A non-allowlisted `license` (absent or otherwise) refuses the split
 *      -- asserted specifically against `awslib14`.
 *   3. The split never writes under `assets/stdlib/` (ADR-1) -- proven by a
 *      byte-identical hash of the vendored source before/after.
 *   4. `npm run build:stdlib` actually emits fragments + manifest to disk
 *      -- asserted by reading `packages/stdlib/assets/**` as vitest's
 *      `globalSetup` (`tests/helpers/build-stdlib-globalsetup.ts`) already
 *      built it, never by calling `splitSpriteBundle`/`buildStdlibPackages`
 *      from this file (that race is documented in that helper's own
 *      comment; SI11a lost a stop-condition-12 escalation to the emit-
 *      without-wiring version of this exact mistake).
 *   5. Concatenating every fragment reproduces the same 2,078 sprite names
 *      the source declares -- none dropped, none duplicated. Verified
 *      against an INDEPENDENT name scan of the source (not by re-running
 *      `splitSpriteBundle`'s own logic).
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, readdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

import { beforeAll, describe, expect, it } from 'vitest';

import { BOOTSTRAP_SPRITE_SPLIT } from '../../scripts/build-stdlib-packages/package-specs.js';
import { isMitAllowed } from '../../scripts/split-sprite-bundle/allowlist.js';
import { splitSpriteBundle, type SpriteSplitManifest } from '../../scripts/split-sprite-bundle/split.js';
import { createSpriteRegistry, matchSpriteCommand } from '../../src/core/sprite-commands.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const BOOTSTRAP_SOURCE = join(ASSETS_STDLIB_DIR, 'bootstrap1.13.1', 'bootstrap.puml');
const EXPECTED_SPRITE_COUNT = 2078;
const GZIP_CEILING_BYTES = 8 * 1024;

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/**
 * Independent oracle for "which sprite names does the source declare",
 * deliberately NOT reusing `split.ts`'s own name-extraction regex or its
 * `matchSpriteCommand`-driven block walk -- this exists to catch a bug in
 * `splitSpriteBundle` itself, so it must not share its implementation.
 * Bootstrap's sprites are one-open-line-per-name (confirmed: every
 * `sprite ` line opens with `<svg` and there is exactly one `</svg>` per
 * sprite), so a plain per-line scan is a sufficient independent check.
 */
function independentSpriteNames(source: string): string[] {
  const names: string[] = [];
  for (const rawLine of source.split('\n')) {
    const m = /^sprite\s+([-.\w]+)\s+<svg\b/i.exec(rawLine.trim());
    if (m?.[1] !== undefined) names.push(m[1]);
  }
  return names;
}

// ---------------------------------------------------------------------------
// splitSpriteBundle direct-call tests (acceptance 1, 2, 5) -- own throwaway
// tmp dir, run once and shared across the `it`s below.
// ---------------------------------------------------------------------------

describe('splitSpriteBundle: bootstrap1.13.1', () => {
  let outDir: string;
  let manifest: SpriteSplitManifest;
  let sourceBytesBefore: Buffer;

  beforeAll(() => {
    sourceBytesBefore = readFileSync(BOOTSTRAP_SOURCE);
    outDir = mkdtempSync(join(tmpdir(), 'sprite-split-bootstrap-'));
    manifest = splitSpriteBundle({
      sourcePumlPath: BOOTSTRAP_SOURCE,
      outDir,
      bundleName: 'bootstrap1.13.1',
      license: 'MIT License',
    });
  });

  it('acceptance 1: returns exactly 2,078 sorted, lowercase names', () => {
    expect(manifest.name).toBe('bootstrap1.13.1');
    expect(manifest.sprites).toHaveLength(EXPECTED_SPRITE_COUNT);
    expect(manifest.sprites).toEqual([...manifest.sprites].sort());
    expect(manifest.sprites.every((name) => name === name.toLowerCase())).toBe(true);
  });

  it('acceptance 1: the manifest gzips to <= 8 KB (measured, logged)', () => {
    const rawJson = JSON.stringify(manifest);
    const gzipBytes = gzipSync(Buffer.from(rawJson, 'utf8')).length;

    console.log(`bootstrap1.13.1 sprite manifest: ${rawJson.length} raw bytes, ${gzipBytes} gzip bytes`);
    expect(gzipBytes).toBeLessThanOrEqual(GZIP_CEILING_BYTES);
  });

  it('acceptance 1: every fragment parses as exactly one sprite block via the runtime parser', () => {
    const failures: string[] = [];

    for (const name of manifest.sprites) {
      const fragment = readFileSync(join(outDir, `${name}.puml`), 'utf8');
      // `writeFragment` always appends exactly one trailing '\n', so the
      // last split element is the empty string after it -- drop it to
      // recover the original block lines exactly.
      const lines = fragment.split('\n').slice(0, -1);
      const registry = createSpriteRegistry();
      const result = matchSpriteCommand(lines, 0, registry);

      const isSingleBlock = result !== null && result.consumed === lines.length && registry.byName.size === 1;
      if (!isSingleBlock) failures.push(name);
    }

    expect(failures).toEqual([]);
  });

  it('acceptance 5: fragments reproduce exactly the source-declared sprite set (no drop, no dup)', () => {
    const source = readFileSync(BOOTSTRAP_SOURCE, 'utf8');
    const expectedNames = independentSpriteNames(source);

    expect(expectedNames).toHaveLength(EXPECTED_SPRITE_COUNT);
    expect(new Set(expectedNames).size).toBe(EXPECTED_SPRITE_COUNT);

    const fragmentFiles = readdirSync(outDir);
    expect(fragmentFiles).toHaveLength(EXPECTED_SPRITE_COUNT);
    const fragmentNames = fragmentFiles.map((f) => f.replace(/\.puml$/, ''));

    expect(new Set(fragmentNames)).toEqual(new Set(expectedNames));
    expect(new Set(manifest.sprites)).toEqual(new Set(expectedNames));
  });

  it('acceptance 3: the vendored source file is byte-identical after the split runs (ADR-1)', () => {
    const sourceBytesAfter = readFileSync(BOOTSTRAP_SOURCE);

    expect(Buffer.compare(sourceBytesBefore, sourceBytesAfter)).toBe(0);
    expect(sha256Hex(sourceBytesAfter)).toBe(sha256Hex(sourceBytesBefore));
  });
});

// ---------------------------------------------------------------------------
// ADR-2 allowlist gate (acceptance 2).
// ---------------------------------------------------------------------------

describe('ADR-2: fail-closed MIT allowlist', () => {
  it('accepts the exact MIT spellings observed in assets/stdlib.manifest.json', () => {
    expect(isMitAllowed('MIT')).toBe(true);
    expect(isMitAllowed('MIT License')).toBe(true);
  });

  it('refuses undefined and every non-MIT license string', () => {
    expect(isMitAllowed(undefined)).toBe(false);
    expect(isMitAllowed('GPL')).toBe(false);
    expect(isMitAllowed('Apache License, Version 2.0')).toBe(false);
    expect(isMitAllowed('mit')).toBe(false);
    expect(isMitAllowed('MIT-0')).toBe(false);
  });

  it('the manifest confirms awslib14 carries NO license field', () => {
    const manifest = JSON.parse(readFileSync(join(ASSETS_STDLIB_DIR, '..', 'stdlib.manifest.json'), 'utf8')) as {
      bundles: Record<string, { license?: string }>;
    };
    const awslib14License = manifest.bundles.awslib14?.license;

    expect(awslib14License).toBeUndefined();
    expect(isMitAllowed(awslib14License)).toBe(false);
  });

  it('splitSpriteBundle refuses awslib14 (no license field) before touching the filesystem', () => {
    const refusedOutDir = join(mkdtempSync(join(tmpdir(), 'sprite-split-refused-')), 'sprites');

    expect(() =>
      splitSpriteBundle({
        sourcePumlPath: join(ASSETS_STDLIB_DIR, 'awslib14', 'does-not-need-to-exist.puml'),
        outDir: refusedOutDir,
        bundleName: 'awslib14',
        license: undefined,
      }),
    ).toThrow(/MIT allowlist/);

    expect(existsSync(refusedOutDir)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Build wiring (acceptance 4) -- reads the tree vitest's globalSetup already
// built via `buildStdlibPackages()`. Never rebuilds it here: two writers of
// `packages/*/generated|assets/` racing is the exact failure documented in
// `tests/helpers/build-stdlib-globalsetup.ts`.
// ---------------------------------------------------------------------------

describe('build-stdlib-packages.ts wiring emits fragments + manifest to disk', () => {
  const bundleAssetsDir = join(PACKAGES_DIR, BOOTSTRAP_SPRITE_SPLIT.packageDir, 'assets', BOOTSTRAP_SPRITE_SPLIT.bundleName);
  const spritesDir = join(bundleAssetsDir, 'sprites');

  it('BOOTSTRAP_SPRITE_SPLIT declares the MIT-allowlisted bootstrap bundle', () => {
    expect(BOOTSTRAP_SPRITE_SPLIT.bundleName).toBe('bootstrap1.13.1');
    expect(BOOTSTRAP_SPRITE_SPLIT.packageDir).toBe('stdlib');
    expect(isMitAllowed(BOOTSTRAP_SPRITE_SPLIT.license)).toBe(true);
  });

  it('acceptance 4: the built package tree carries sprites.json with the full manifest', () => {
    const manifest = JSON.parse(readFileSync(join(bundleAssetsDir, 'sprites.json'), 'utf8')) as SpriteSplitManifest;

    expect(manifest.name).toBe('bootstrap1.13.1');
    expect(manifest.sprites).toHaveLength(EXPECTED_SPRITE_COUNT);
    expect(manifest.sprites).toEqual([...manifest.sprites].sort());
  });

  it('acceptance 4: the built package tree carries exactly 2,078 fragment files matching the manifest', () => {
    const manifest = JSON.parse(readFileSync(join(bundleAssetsDir, 'sprites.json'), 'utf8')) as SpriteSplitManifest;
    const fragmentFiles = readdirSync(spritesDir);

    expect(fragmentFiles).toHaveLength(EXPECTED_SPRITE_COUNT);
    const fragmentNames = new Set(fragmentFiles.map((f) => f.replace(/\.puml$/, '')));
    expect(fragmentNames).toEqual(new Set(manifest.sprites));
  });

  it('acceptance 4: a built fragment is a self-contained, single-sprite block', () => {
    const manifest = JSON.parse(readFileSync(join(bundleAssetsDir, 'sprites.json'), 'utf8')) as SpriteSplitManifest;
    const sampleName = manifest.sprites[0];
    expect(sampleName).toBeDefined();

    const fragment = readFileSync(join(spritesDir, `${sampleName}.puml`), 'utf8');
    const lines = fragment.split('\n').slice(0, -1); // drop the trailing '' from the final '\n'
    const registry = createSpriteRegistry();
    const result = matchSpriteCommand(lines, 0, registry);

    expect(result).not.toBeNull();
    expect(result?.consumed).toBe(lines.length);
    expect(registry.byName.size).toBe(1);
  });
});
