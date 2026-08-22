/**
 * stdlib-build-race, T2 -- the content-derived up-to-date skip half of the
 * fix (`plans/stdlib-build-race/decisions.md` D3/D4). Proves, for BOTH
 * destructive rebuild paths `buildStdlibPackages()` guards
 * (`generated/` via `writeOutputs`, and `assets/<bundle>/sprites/` via
 * `buildSpriteSplits`):
 *
 *  1. The predicate (`isGeneratedDirUpToDate` / `isSpriteSplitUpToDate`) is
 *     pure, read-only, content-derived -- never a file count, never an
 *     mtime (D4) -- and any failure to compute a hash or a fresh split
 *     (missing dir, missing file, unreadable path, a refused license) is
 *     treated as "not up to date" (uncertain always means rebuild, never
 *     skip).
 *  2. `computePackageOutputs` / the sprite split are pure functions of
 *     their spec plus the current `.puml` content under an assets
 *     directory -- changing either flips the predicate from up-to-date to
 *     stale.
 *  3. Wiring the predicate in front of a destructive rebuild (mirroring
 *     `writeOutputs`/`buildSpriteSplits`'s shape in
 *     `scripts/build-stdlib-packages.ts`, both module-private) really does
 *     skip the `rmSync` on a match, and really does run it on a mismatch --
 *     verified on the filesystem via a sentinel file, not a log line.
 *
 * All fixtures below are synthetic, isolated `mkdtempSync` directories --
 * deliberately NOT the real `packages/*\/generated/` or
 * `packages/*\/assets/*\/sprites/` trees, and this file never calls the real
 * `buildStdlibPackages()`/`buildSpriteSplits()` a second time. Even after
 * this task's fix, calling either from inside a vitest worker would still
 * be unsafe in general (a genuinely stale tree still triggers a real
 * `rmSync`, and other workers concurrently read these same shared paths) --
 * exactly the class of bug `tests/unit/split-sprite-bundle.test.ts` and
 * `tests/helpers/build-stdlib-globalsetup.ts` document and deliberately
 * avoid by never re-invoking those functions from a test file. This suite
 * follows that same discipline, calling the real, unmodified
 * `splitSpriteBundle` (owned by `split.ts`) only against throwaway temp
 * directories it fully controls.
 *
 * One exception per predicate, read-only and therefore safe: acceptance 4
 * calls `isGeneratedDirUpToDate` (never a writer) against the REAL,
 * already-built `packages/*\/generated/` tree to prove this refactor emits
 * byte-identical content to what shipped before it.
 */
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it } from 'vitest';

import {
  computePackageOutputs,
  isGeneratedDirUpToDate,
  isSpriteSplitUpToDate,
} from '../../scripts/build-stdlib-packages.js';
import { PACKAGE_SPECS } from '../../scripts/build-stdlib-packages/package-specs.js';
import type { SpriteSplitBundleSpec } from '../../scripts/build-stdlib-packages/package-specs.js';
import type { PackageSpec } from '../../scripts/build-stdlib-packages/types.js';
import { splitSpriteBundle } from '../../scripts/split-sprite-bundle/split.js';
import { LOCK_PRESSURE_BUDGET_MS } from '../helpers/lock-pressure-budget.js';
import { withStdlibBuildLock } from '../helpers/with-stdlib-build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const REAL_ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');
const REAL_PACKAGES_DIR = join(REPO_ROOT, 'packages');

function sha256Hex(content: string): string {
  return createHash('sha256').update(content, 'utf8').digest('hex');
}

// ---------------------------------------------------------------------------
// Fixture helpers -- every directory this file creates is tracked here and
// removed in `afterEach`, so a failing test never leaks a temp dir.
// ---------------------------------------------------------------------------

const tempDirs: string[] = [];

function makeTempDir(prefix: string): string {
  const dir = mkdtempSync(join(tmpdir(), prefix));
  tempDirs.push(dir);
  return dir;
}

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

/** A minimal `PackageSpec` with one concrete module reading from
 * `assetsDir/<assetFolder>/greeting.puml`, plus the `index.{js,d.ts}` every
 * spec gets. `packageDir` is irrelevant here: `computePackageOutputs` never
 * reads it, only `writeOutputs`/`buildPackage` (module-private) do. */
function syntheticSpec(assetFolder: string): PackageSpec {
  return {
    packageDir: 'synthetic-unused',
    modules: [
      {
        fileBaseName: 'greeting',
        exports: [{ kind: 'concrete', exportName: 'greeting', bundleName: 'Greeting', assetFolder }],
      },
    ],
  };
}

function writeAssetContent(assetsDir: string, assetFolder: string, content: string): void {
  const bundleDir = join(assetsDir, assetFolder);
  mkdirSync(bundleDir, { recursive: true });
  writeFileSync(join(bundleDir, 'greeting.puml'), content, 'utf8');
}

function writeOutputsToDir(generatedDir: string, outputs: ReadonlyMap<string, string>): void {
  mkdirSync(generatedDir, { recursive: true });
  for (const [fileName, content] of outputs) {
    writeFileSync(join(generatedDir, fileName), content, 'utf8');
  }
}

// ---------------------------------------------------------------------------
// Acceptance 1: up-to-date content -> skip; any content change -> rebuild.
// ---------------------------------------------------------------------------

describe('isGeneratedDirUpToDate: content-derived skip/rebuild decision', () => {
  it('returns true when every file on disk is byte-identical to the fresh outputs', () => {
    const assetsDir = makeTempDir('build-race-assets-match-');
    const generatedDir = makeTempDir('build-race-generated-match-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputs);

    expect(isGeneratedDirUpToDate(generatedDir, outputs)).toBe(true);
  });

  it('returns false when one on-disk file differs from the fresh output', () => {
    const assetsDir = makeTempDir('build-race-assets-diff-');
    const generatedDir = makeTempDir('build-race-generated-diff-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputs);
    writeFileSync(join(generatedDir, 'index.js'), 'this is not what the build would emit', 'utf8');

    expect(isGeneratedDirUpToDate(generatedDir, outputs)).toBe(false);
  });

  it('returns false when a change to the build INPUT (the .puml content) changes the fresh output', () => {
    const assetsDir = makeTempDir('build-race-assets-input-change-');
    const generatedDir = makeTempDir('build-race-generated-input-change-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputsV1 = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputsV1);
    expect(isGeneratedDirUpToDate(generatedDir, outputsV1)).toBe(true);

    // The input changes (a new vendored .puml lands); recompute what a build
    // would now emit and confirm the SAME on-disk tree is no longer current.
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob : hello\n@enduml\n');
    const outputsV2 = computePackageOutputs(syntheticSpec('greeting'), assetsDir);

    expect(sha256Hex([...outputsV2.values()].join('\0'))).not.toBe(sha256Hex([...outputsV1.values()].join('\0')));
    expect(isGeneratedDirUpToDate(generatedDir, outputsV2)).toBe(false);

    // Rebuilding restores agreement.
    writeOutputsToDir(generatedDir, outputsV2);
    expect(isGeneratedDirUpToDate(generatedDir, outputsV2)).toBe(true);
  });

  it('returns false when an expected file is missing entirely', () => {
    const assetsDir = makeTempDir('build-race-assets-missing-');
    const generatedDir = makeTempDir('build-race-generated-missing-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    // Deliberately omit 'greeting.d.ts' -- simulates a partially-deleted
    // tree, e.g. a race caught mid-`rmSync`.
    const partial = new Map(outputs);
    partial.delete('greeting.d.ts');
    writeOutputsToDir(generatedDir, partial);

    expect(isGeneratedDirUpToDate(generatedDir, outputs)).toBe(false);
  });

  it('returns false when generatedDir does not exist at all', () => {
    const assetsDir = makeTempDir('build-race-assets-nodir-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');
    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);

    const neverCreated = join(tmpdir(), 'build-race-never-created-dir');
    expect(existsSync(neverCreated)).toBe(false);

    expect(isGeneratedDirUpToDate(neverCreated, outputs)).toBe(false);
  });

  it('returns false (rebuilds) when a hash cannot be computed -- never skips on uncertainty', () => {
    const assetsDir = makeTempDir('build-race-assets-eisdir-');
    const generatedDir = makeTempDir('build-race-generated-eisdir-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputs);
    // Replace 'index.js' with a DIRECTORY of the same name: reading it as a
    // file throws EISDIR, so the hash cannot be computed at all.
    rmSync(join(generatedDir, 'index.js'), { force: true });
    mkdirSync(join(generatedDir, 'index.js'));

    expect(isGeneratedDirUpToDate(generatedDir, outputs)).toBe(false);
  });

  it('is content-derived by construction: its source never mentions a count or an mtime signal', () => {
    const source = isGeneratedDirUpToDate.toString();
    for (const banned of ['mtime', 'birthtime', 'readdirSync', 'statSync', 'expectedCount', '.length ===']) {
      expect(source).not.toContain(banned);
    }
    // Positive control: the function DOES do content hashing.
    expect(source).toContain('sha256Hex');
    expect(source).toContain('readFileSync');
  });
});

// ---------------------------------------------------------------------------
// Acceptance 2: wiring the predicate in front of a destructive rebuild skips
// the `rmSync` on a match, verified on the filesystem via a sentinel file --
// and really does run it (destroying the sentinel) on a mismatch, so the
// contrast proves the guard is load-bearing rather than vacuous.
//
// `writeOutputs`/`freshGeneratedDir` (`scripts/build-stdlib-packages.ts`) are
// module-private by design (pre-loaded observation, unchanged by this task),
// so this mirrors their exact shape locally against an isolated temp dir
// instead of calling the real, shared-state `buildStdlibPackages()` -- see
// this file's header comment for why that call is unsafe to make here.
// ---------------------------------------------------------------------------

const SENTINEL_FILE = '__sentinel__.txt';

/** Same shape as `scripts/build-stdlib-packages.ts#writeOutputs`: skip the
 * destructive rebuild when the predicate says the tree already matches;
 * otherwise `rmSync` the whole directory, recreate it, and write `outputs`. */
function writeOutputsMirroringProduction(generatedDir: string, outputs: ReadonlyMap<string, string>): void {
  if (isGeneratedDirUpToDate(generatedDir, outputs)) {
    return;
  }
  rmSync(generatedDir, { recursive: true, force: true });
  mkdirSync(generatedDir, { recursive: true });
  for (const [fileName, content] of outputs) {
    writeFileSync(join(generatedDir, fileName), content, 'utf8');
  }
}

describe('writeOutputs-shaped wiring: skip avoids rmSync, rebuild performs it', () => {
  it('skips (sentinel survives, real content unchanged) when the tree already matches', () => {
    const assetsDir = makeTempDir('build-race-assets-wire-skip-');
    const generatedDir = makeTempDir('build-race-generated-wire-skip-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputs);
    writeFileSync(join(generatedDir, SENTINEL_FILE), 'do not delete me', 'utf8');
    const inodeBefore = statSync(join(generatedDir, 'index.js')).ino;

    writeOutputsMirroringProduction(generatedDir, outputs);

    expect(existsSync(join(generatedDir, SENTINEL_FILE))).toBe(true);
    expect(readFileSync(join(generatedDir, SENTINEL_FILE), 'utf8')).toBe('do not delete me');
    expect(statSync(join(generatedDir, 'index.js')).ino).toBe(inodeBefore);
  });

  it('rebuilds (sentinel destroyed by the real rmSync) when inputs changed', () => {
    const assetsDir = makeTempDir('build-race-assets-wire-rebuild-');
    const generatedDir = makeTempDir('build-race-generated-wire-rebuild-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');

    const outputsV1 = computePackageOutputs(syntheticSpec('greeting'), assetsDir);
    writeOutputsToDir(generatedDir, outputsV1);
    writeFileSync(join(generatedDir, SENTINEL_FILE), 'stale leftover', 'utf8');

    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob : hello\n@enduml\n');
    const outputsV2 = computePackageOutputs(syntheticSpec('greeting'), assetsDir);

    writeOutputsMirroringProduction(generatedDir, outputsV2);

    // rmSync ran: the sentinel that predates the rebuild is gone.
    expect(existsSync(join(generatedDir, SENTINEL_FILE))).toBe(false);
    // The tree now matches the NEW inputs.
    expect(isGeneratedDirUpToDate(generatedDir, outputsV2)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Acceptance 3: `computePackageOutputs` never writes to disk -- calling it
// alone must not create the directory it reads from, let alone `generated/`.
// ---------------------------------------------------------------------------

describe('computePackageOutputs: pure, no filesystem writes', () => {
  it('produces the expected file set without creating any directory', () => {
    const assetsDir = makeTempDir('build-race-assets-pure-');
    writeAssetContent(assetsDir, 'greeting', '@startuml\nAlice -> Bob\n@enduml\n');
    const neverWrittenDir = join(assetsDir, 'never-written-generated');

    const outputs = computePackageOutputs(syntheticSpec('greeting'), assetsDir);

    expect([...outputs.keys()].sort()).toEqual(['greeting.d.ts', 'greeting.js', 'index.d.ts', 'index.js']);
    expect(existsSync(neverWrittenDir)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Acceptance 4: byte-identical to the real, already-built tree (read-only --
// `isGeneratedDirUpToDate` never writes, so this is safe to run against the
// shared `packages/*\/generated/` tree `globalSetup` built before any worker
// started; see this file's header for why a WRITE against that tree is not
// attempted here).
// ---------------------------------------------------------------------------

describe('acceptance 4: refactor emits byte-identical content to the pre-existing real tree', () => {
  it.each(PACKAGE_SPECS.map((spec) => ({ label: spec.packageDir, spec })))(
    'packages/$label/generated matches a fresh computePackageOutputs() exactly',
    ({ spec }) => {
      const generatedDir = join(REAL_PACKAGES_DIR, spec.packageDir, 'generated');
      const outputs = computePackageOutputs(spec, REAL_ASSETS_STDLIB_DIR);

      // stdlib-run-isolation T4: the only read against the REAL, shared
      // `packages/*/generated/` tree in this file -- every other fixture
      // above uses an isolated `mkdtempSync` scratch dir and is left alone.
      const upToDate = withStdlibBuildLock(() => isGeneratedDirUpToDate(generatedDir, outputs));

      expect(upToDate).toBe(true);
    },
    LOCK_PRESSURE_BUDGET_MS,
  );
});

// ---------------------------------------------------------------------------
// Sprite-split predicate (`isSpriteSplitUpToDate`) -- guards
// `buildSpriteSplits`'s call into `splitSpriteBundle`, whose own
// unconditional `rmSync` (`split.ts:144`) is the sibling race Item 1
// (coordinator review) identified: `generated/` was fixed, but
// `assets/<bundle>/sprites/` was not, and it has a concurrent reader
// (`tests/unit/sprite-package-files.test.ts`).
//
// Fixtures use the single-line SVG sprite grammar
// (`sprite NAME <svg ...></svg>`, `src/core/sprite-commands.ts`'s
// `SVG_SINGLE_LINE_RE`) -- the simplest form the runtime's own
// `matchSpriteCommand` recognizes, so `splitSpriteBundle` (unmodified,
// called for real against throwaway temp dirs) needs no multi-line
// scanning to produce a valid split.
// ---------------------------------------------------------------------------

function syntheticSpriteSpec(bundleName: string, license = 'MIT License'): SpriteSplitBundleSpec {
  return { packageDir: 'synthetic-unused', bundleName, sourceFile: 'source.puml', license };
}

function writeSpriteSource(assetsDir: string, bundleName: string, content: string): void {
  const dir = join(assetsDir, bundleName);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'source.puml'), content, 'utf8');
}

const SPRITE_SOURCE_V1 = 'sprite alpha <svg width="4" height="4">A</svg>\nsprite beta <svg width="4" height="4">B</svg>\n';
const SPRITE_SOURCE_V2 = 'sprite alpha <svg width="4" height="4">A2</svg>\nsprite beta <svg width="4" height="4">B</svg>\n';

/** A real (not scratch) split, simulating "a prior successful build" of
 * `bundleAssetsDir` -- same two writes `buildSpriteSplits` performs. */
function realSplitInto(bundleAssetsDir: string, assetsDir: string, spec: SpriteSplitBundleSpec): void {
  const manifest = splitSpriteBundle({
    sourcePumlPath: join(assetsDir, spec.bundleName, spec.sourceFile),
    outDir: join(bundleAssetsDir, 'sprites'),
    bundleName: spec.bundleName,
    license: spec.license,
  });
  writeFileSync(join(bundleAssetsDir, 'sprites.json'), JSON.stringify(manifest), 'utf8');
}

describe('isSpriteSplitUpToDate: content-derived skip/rebuild decision for the sprite split', () => {
  it('returns true when bundleAssetsDir already matches a fresh split of the current source', () => {
    const assetsDir = makeTempDir('sprite-assets-match-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-match-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);
    realSplitInto(bundleAssetsDir, assetsDir, spec);

    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(true);
  });

  it('returns false when the source .puml content changes, true again after rebuilding', () => {
    const assetsDir = makeTempDir('sprite-assets-change-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-change-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);
    realSplitInto(bundleAssetsDir, assetsDir, spec);
    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(true);

    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V2);
    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(false);

    realSplitInto(bundleAssetsDir, assetsDir, spec);
    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(true);
  });

  it('returns false when bundleAssetsDir does not exist at all', () => {
    const assetsDir = makeTempDir('sprite-assets-nodir-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);

    const neverCreated = join(tmpdir(), 'sprite-bundle-never-created-dir');
    expect(existsSync(neverCreated)).toBe(false);

    expect(isSpriteSplitUpToDate(neverCreated, spec, assetsDir)).toBe(false);
  });

  it('returns false when sprites.json is missing (a partially-built tree)', () => {
    const assetsDir = makeTempDir('sprite-assets-partial-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-partial-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);
    realSplitInto(bundleAssetsDir, assetsDir, spec);
    rmSync(join(bundleAssetsDir, 'sprites.json'), { force: true });

    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(false);
  });

  it('returns false (rebuild) when computing the fresh split throws -- a non-MIT license', () => {
    const assetsDir = makeTempDir('sprite-assets-refused-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-refused-');
    const spec = syntheticSpriteSpec('greeting-sprites', 'GPL');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);

    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Wiring proof: `buildSpriteSplits`'s shape (predicate check, then either
// return or run the real, unconditionally-destructive `splitSpriteBundle` +
// `writeFileSync`) is module-private, so this mirrors it locally against an
// isolated temp dir -- same discipline as the `writeOutputs`-mirroring
// wrapper above.
// ---------------------------------------------------------------------------

const SPRITE_SENTINEL_FILE = '__sentinel__.txt';

function buildSpriteSplitsMirroringProduction(
  bundleAssetsDir: string,
  spec: SpriteSplitBundleSpec,
  assetsDir: string,
): void {
  if (isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)) {
    return;
  }
  realSplitInto(bundleAssetsDir, assetsDir, spec);
}

describe('buildSpriteSplits-shaped wiring: skip avoids rmSync, rebuild performs it', () => {
  it('skips (sentinel inside sprites/ survives, fragment inode unchanged) when the source is unchanged', () => {
    const assetsDir = makeTempDir('sprite-assets-wire-skip-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-wire-skip-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);

    // First call: bundleAssetsDir is empty, so this performs a real,
    // rmSync-guarded build (mirrors buildStdlibPackages()'s FIRST run).
    buildSpriteSplitsMirroringProduction(bundleAssetsDir, spec, assetsDir);
    const spritesDir = join(bundleAssetsDir, 'sprites');
    writeFileSync(join(spritesDir, SPRITE_SENTINEL_FILE), 'do not delete me', 'utf8');
    const inodeBefore = statSync(join(spritesDir, 'alpha.puml')).ino;

    // Second call: source unchanged -> must skip, never touching `sprites/`.
    buildSpriteSplitsMirroringProduction(bundleAssetsDir, spec, assetsDir);

    expect(existsSync(join(spritesDir, SPRITE_SENTINEL_FILE))).toBe(true);
    expect(readFileSync(join(spritesDir, SPRITE_SENTINEL_FILE), 'utf8')).toBe('do not delete me');
    expect(statSync(join(spritesDir, 'alpha.puml')).ino).toBe(inodeBefore);
  });

  it('rebuilds (sentinel destroyed by the real rmSync) when the source changed', () => {
    const assetsDir = makeTempDir('sprite-assets-wire-rebuild-');
    const bundleAssetsDir = makeTempDir('sprite-bundle-wire-rebuild-');
    const spec = syntheticSpriteSpec('greeting-sprites');
    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V1);

    buildSpriteSplitsMirroringProduction(bundleAssetsDir, spec, assetsDir);
    const spritesDir = join(bundleAssetsDir, 'sprites');
    writeFileSync(join(spritesDir, SPRITE_SENTINEL_FILE), 'stale leftover', 'utf8');

    writeSpriteSource(assetsDir, spec.bundleName, SPRITE_SOURCE_V2);
    buildSpriteSplitsMirroringProduction(bundleAssetsDir, spec, assetsDir);

    // splitSpriteBundle's own rmSync ran on `sprites/`: the pre-rebuild
    // sentinel is gone.
    expect(existsSync(join(spritesDir, SPRITE_SENTINEL_FILE))).toBe(false);
    expect(isSpriteSplitUpToDate(bundleAssetsDir, spec, assetsDir)).toBe(true);
  });
});
