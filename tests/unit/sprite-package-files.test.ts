/**
 * si11b T5 -- the packaging gate for `@knowvah/plantuml-stdlib`'s per-sprite
 * bootstrap1.13.1 fragments (`plans/si11b-bootstrap-sprite-splitting/
 * batch-2/T5-package-fragments.md`).
 *
 * Mirrors `tests/unit/stdlib-package-files.test.ts`'s technique exactly:
 * resolve what `npm pack --dry-run --json` would ACTUALLY publish and check
 * every manifest-named path against that resolved list, never against the
 * `package.json` `files` array by inspection. A `files` array that omits
 * `assets` passes every other test and 404s for every consumer after
 * publish (batch-2/overview.md, "the trap").
 *
 * CORRECTION (method rule 2 -- follow the code, not the brief's assumption):
 * the brief's Boundaries section says to check whether
 * `stdlib-package-files.test.ts` already packs `packages/stdlib` before
 * adding a second pack. It does not -- that file only packs `stdlib-aws`
 * and `stdlib-tupadr3`. The file that already packs `packages/stdlib` is
 * `tests/unit/stdlib-packages.test.ts` (`PACK_CEILINGS`, si11a), whose own
 * comment says "stdlib has no prepack and no assets, so it cannot race and
 * stays here." The "no assets" half of that premise is now stale (T1 added
 * `packages/stdlib/assets/bootstrap1.13.1/`), but the "no prepack" half is
 * still true -- `packages/stdlib/package.json` intentionally gained NO
 * `prepack`/`copy-assets` script (see this test's sibling `package.json`
 * comment below), because `scripts/build-stdlib-packages.ts#buildSpriteSplits`
 * already derives straight into the published `assets/` location as part of
 * the SAME root generator that produces `generated/` -- exactly the
 * no-prepack convention `generated/` itself already relies on, not the
 * stdlib-aws/stdlib-tupadr3 convention (whose root generator never touches
 * their `assets/`, forcing a per-package `prepack` copy). Packing a
 * directory nobody rebuilds is a pure read; two files doing that
 * concurrently cannot reproduce the `ENOENT`/corrupted-tarball race a
 * rebuilding `prepack` caused for stdlib-aws/stdlib-tupadr3. Flagged here,
 * not fixed in `stdlib-packages.test.ts` -- that file is outside this
 * task's write-set.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { emitModuleJs } from '../../scripts/build-stdlib-packages/emit-module.js';
import { BOOTSTRAP_SPRITE_SPLIT, PACKAGE_SPECS } from '../../scripts/build-stdlib-packages/package-specs.js';
import type { SpriteSplitManifest } from '../../scripts/split-sprite-bundle/split.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');

const PACKAGE_DIR = BOOTSTRAP_SPRITE_SPLIT.packageDir; // 'stdlib'
const BUNDLE_NAME = BOOTSTRAP_SPRITE_SPLIT.bundleName; // 'bootstrap1.13.1'
const BUNDLE_ASSETS_DIR = join(PACKAGES_DIR, PACKAGE_DIR, 'assets', BUNDLE_NAME);
const SPRITES_JSON_EXPORT_KEY = './bootstrap1.13.1/sprites.json';

interface PackedFile {
  readonly path: string;
}

interface PackResult {
  readonly unpackedSize: number;
  readonly files: readonly PackedFile[];
}

interface PackageJson {
  readonly files: readonly string[];
  readonly exports: Record<string, unknown>;
}

function readPackageJson(): PackageJson {
  const raw = readFileSync(join(PACKAGES_DIR, PACKAGE_DIR, 'package.json'), 'utf8');
  return JSON.parse(raw) as PackageJson;
}

/** Mirrors `stdlib-package-files.test.ts` / `stdlib-packages.test.ts`'s
 * `npmPackDryRun` -- resolves what `npm pack` would actually publish,
 * lifecycle scripts included (there are none for `packages/stdlib`; see the
 * file-header correction above for why that makes a second packer safe). */
function npmPackDryRun(): PackResult {
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: join(PACKAGES_DIR, PACKAGE_DIR),
    encoding: 'utf8',
  });
  const parsed = JSON.parse(stdout) as PackResult[];
  const result = parsed[0];
  if (result === undefined) {
    throw new Error(`npm pack --dry-run produced no output for packages/${PACKAGE_DIR}`);
  }
  return result;
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

function readRealManifest(): SpriteSplitManifest {
  const raw = readFileSync(join(BUNDLE_ASSETS_DIR, 'sprites.json'), 'utf8');
  return JSON.parse(raw) as SpriteSplitManifest;
}

// ---------------------------------------------------------------------------
// Acceptance 1: exports carries the split-manifest subpath; files ships the
// fragments directory. The eager subpaths (`./bootstrap`, `generated`) stay
// present -- additive only, never removed or renamed (ADR-1).
// ---------------------------------------------------------------------------

describe('acceptance 1: package.json carries the split-manifest subpath and ships assets', () => {
  it('exports the sprites.json subpath and lists assets in files', () => {
    const pkg = readPackageJson();

    expect(Object.keys(pkg.exports)).toContain(SPRITES_JSON_EXPORT_KEY);
    expect(pkg.files).toContain('assets');
    expect(pkg.files).toContain('generated');
    expect(Object.keys(pkg.exports)).toContain('./bootstrap');
  });
});

// ---------------------------------------------------------------------------
// Acceptance 2 (THE TRAP): every sprite name in the REAL split manifest
// resolves inside the package's published `files` globs -- proven by
// resolving `npm pack --dry-run --json`'s actual file list, never by reading
// the `files` array. A single pack call is reused for the ceiling and
// LICENSE checks below, per `stdlib-package-files.test.ts`'s pattern of
// folding assertions into one pack rather than invoking it twice.
// ---------------------------------------------------------------------------

// Measured 2026-07-31 (`npm pack --dry-run --json`, `packages/stdlib`,
// 2,099 entries): unpackedSize 2,934,653 B -- the 5 eager bundle modules plus
// 2,078 sprite fragments + `sprites.json`. Ceiling gives ~19% headroom: tight
// enough to catch an accidental doubling of the fragment tree (e.g. a stray
// second split writing into the same `assets/` dir), loose enough that
// routine per-fragment size drift doesn't flake this test.
const UNPACKED_SIZE_CEILING_BYTES = 3.5 * 1024 * 1024;

describe('acceptance 2: every sprite name in the real manifest is inside the resolved package contents', () => {
  it(
    'sprites/<name>.puml and sprites.json are all packed, under the size ceiling, with LICENSE files',
    () => {
      const manifest = readRealManifest();
      expect(manifest.name).toBe(BUNDLE_NAME);
      expect(manifest.sprites.length).toBeGreaterThan(0);

      const packed = npmPackDryRun();
      const packedPaths = new Set(packed.files.map((f) => f.path));

      expect(packedPaths.has(`assets/${BUNDLE_NAME}/sprites.json`)).toBe(true);
      for (const name of manifest.sprites) {
        const expectedPackedPath = `assets/${BUNDLE_NAME}/sprites/${name}.puml`;
        expect(packedPaths.has(expectedPackedPath)).toBe(true);
      }

      expect(packed.unpackedSize).toBeLessThan(UNPACKED_SIZE_CEILING_BYTES);
      expect(packedPaths.has('LICENSE')).toBe(true);
      expect(packedPaths.has('LICENSES.md')).toBe(true);
    },
    120_000,
  );
});

// ---------------------------------------------------------------------------
// Acceptance 3: the eager modules stay byte-identical -- re-emits each
// through the SAME pure emitter the build uses and compares sha256, rather
// than calling `buildStdlibPackages()` again (that function is a WRITER of
// `packages/*/generated/`, and vitest runs test files in parallel workers --
// see `stdlib-package-files.test.ts`'s acceptance 3 for the race this
// avoids). Neither this task's `package.json`/`.gitignore` edits nor T1's
// sprite split touch `emitModuleJs`'s inputs, so this proves the claim
// directly rather than by reasoning that "adding a file cannot change
// existing ones."
// ---------------------------------------------------------------------------

describe('acceptance 3: eager bundle modules are unaffected by the sprite-split packaging', () => {
  const spec = PACKAGE_SPECS.find((s) => s.packageDir === PACKAGE_DIR);
  if (spec === undefined) {
    throw new Error(`No PackageSpec found for packageDir '${PACKAGE_DIR}'`);
  }

  it.each(spec.modules.map((mod) => ({ label: `${mod.fileBaseName}.js`, mod })))(
    '$label is byte-identical to a fresh emit',
    ({ mod }) => {
      const onDisk = readFileSync(join(PACKAGES_DIR, PACKAGE_DIR, 'generated', `${mod.fileBaseName}.js`));
      const freshlyEmitted = Buffer.from(emitModuleJs(mod, ASSETS_STDLIB_DIR), 'utf8');

      expect(sha256Hex(onDisk)).toBe(sha256Hex(freshlyEmitted));
    },
  );
});

// ---------------------------------------------------------------------------
// Acceptance 5 (packaging-adjacent): the manifest on disk matches the
// fragment files on disk, one-to-one -- cross-checked against `readdirSync`
// rather than a hardcoded count, so this test does not drift from T1's own
// `split-sprite-bundle.test.ts` count assertion.
// ---------------------------------------------------------------------------

describe('acceptance 5: the split manifest matches the fragment files it names', () => {
  it('every manifest name has exactly one on-disk fragment, and vice versa', () => {
    const manifest = readRealManifest();
    const fragmentFiles = readdirSync(join(BUNDLE_ASSETS_DIR, 'sprites'));
    const fragmentNames = new Set(fragmentFiles.map((f) => f.replace(/\.puml$/, '')));

    expect(fragmentNames).toEqual(new Set(manifest.sprites));
    expect(manifest.sprites).toEqual([...manifest.sprites].sort());
  });
});
