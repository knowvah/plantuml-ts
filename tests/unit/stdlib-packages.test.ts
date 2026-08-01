/**
 * SI5b batch-3 T8 -- the four `@knowvah/plantuml-stdlib*` npm packages.
 *
 * Runs the generator (`scripts/build-stdlib-packages.ts`) directly (no
 * shelling out), then proves:
 *
 *   1. VERBATIM round-trip: the generated `BundleData.files` string for a
 *      sample of files (including an awslib14 PNG-bearing `.puml`) re-encodes
 *      to UTF-8 bytes identical to both the vendored asset file on disk and
 *      the committed manifest's sha256 (`plans/si5b-stdlib/decisions.md` D1/D3
 *      VERBATIM constraint).
 *   2. Alias resolution: `stdlibStore(awslib, awslib14)` resolves
 *      `<awslib/...>` through to `awslib14`'s files (`Stdlib.java`'s `link:`
 *      semantics, `StdlibStore.ts`).
 *   3. `renderSync()` end-to-end with the GENERATED `c4` bundle, resolving
 *      `!include <C4/C4_Context>`.
 *   4. `npm pack --dry-run` per package: tarball size ceilings
 *      (`batch-3/overview.md` T8) and LICENSE presence.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { gzipSync } from 'node:zlib';

import { beforeAll, describe, expect, it } from 'vitest';

import { emitRemoteManifestJs } from '../../scripts/build-stdlib-packages/emit-remote-manifest.js';
import { PACKAGE_SPECS } from '../../scripts/build-stdlib-packages/package-specs.js';
import type { GeneratedModule } from '../../scripts/build-stdlib-packages/types.js';
import { FormulaMeasurer } from '../../src/core/measurer.js';
import { MapIncludeStore } from '../../src/core/tim/IncludeStore.js';
import { stdlibStore, withStdlib, type BundleData } from '../../src/core/tim/StdlibStore.js';
import { renderSync } from '../../src/index.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');
const ASSETS_MANIFESTS_DIR = join(REPO_ROOT, 'assets', 'manifests');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

interface ManifestBundle {
  files: Record<string, string>;
}

function readManifest(bundleFolder: string): ManifestBundle {
  return JSON.parse(readFileSync(join(ASSETS_MANIFESTS_DIR, `${bundleFolder}.json`), 'utf8')) as ManifestBundle;
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

async function importGenerated<T>(packageDir: string, moduleFile: string): Promise<T> {
  const path = join(PACKAGES_DIR, packageDir, 'generated', moduleFile);
  return (await import(pathToFileURL(path).href)) as T;
}

// ---------------------------------------------------------------------------
// Generate once for the whole suite.
// ---------------------------------------------------------------------------

let c4: BundleData;
let archimate: BundleData;

// `packages/*/generated/` is built ONCE by vitest's globalSetup
// (`tests/helpers/build-stdlib-globalsetup.ts`), not here. Rebuilding it in a
// per-file `beforeAll` raced with the other test files reading the same tree,
// because the build `rmSync`s it first and vitest runs files in parallel
// workers (si11a T8).
beforeAll(async () => {
  const stdlibC4 = await importGenerated<{ c4: BundleData }>('stdlib', 'c4.js');
  c4 = stdlibC4.c4;
  const stdlibArchimate = await importGenerated<{ archimate: BundleData }>('stdlib', 'archimate.js');
  archimate = stdlibArchimate.archimate;

  // awslib14/awslib/tupadr3 no longer have an eager `generated/*.js` module
  // (SI12 ADR-2/ADR-5) -- their VERBATIM round-trip and alias-resolution
  // cases below read the shipped `packages/*/assets/` copy instead.
  // Populate it directly via each package's own `copy-assets.mjs`, NOT
  // `npm pack` (that stays reserved to `stdlib-package-files.test.ts`, one
  // invocation per package) and NOT a rebuild of `generated/`. The script's
  // own `isUpToDate()` guard makes this safe even if another test file's
  // `npm pack` triggers the same `prepack` step concurrently in a parallel
  // vitest worker.
  execFileSync('node', [join(PACKAGES_DIR, 'stdlib-aws', 'scripts', 'copy-assets.mjs')]);
  execFileSync('node', [join(PACKAGES_DIR, 'stdlib-tupadr3', 'scripts', 'copy-assets.mjs')]);
}, 30_000);

// ---------------------------------------------------------------------------
// 1. VERBATIM round-trip: runtime string bytes === disk bytes === manifest sha256.
// ---------------------------------------------------------------------------

interface RoundTripCase {
  readonly label: string;
  readonly bundleFolder: string;
  readonly manifestFile: string;
  /**
   * Runtime bytes source. `stdlib`'s c4/archimate still generate an eager
   * `BundleData.files` string; awslib14/tupadr3 no longer do (SI12
   * ADR-2/ADR-5), so their bytes come from the package's shipped `assets/`
   * copy instead -- the same bytes `npm pack` publishes.
   */
  readonly runtimeBytes: () => Buffer;
}

function eagerBundleBytes(bundle: () => BundleData, bundleKey: string): () => Buffer {
  return () => {
    const content = bundle().files[bundleKey];
    expect(content).toBeDefined();
    return Buffer.from(content as string, 'utf8');
  };
}

function shippedAssetBytes(packageDir: string, assetFolder: string, relPath: string): () => Buffer {
  return () => readFileSync(join(PACKAGES_DIR, packageDir, 'assets', assetFolder, relPath));
}

const ROUND_TRIP_CASES: readonly RoundTripCase[] = [
  {
    label: 'c4/c4',
    bundleFolder: 'C4',
    manifestFile: 'C4.puml',
    runtimeBytes: eagerBundleBytes(() => c4, 'c4'),
  },
  {
    label: 'c4/c4_context',
    bundleFolder: 'C4',
    manifestFile: 'C4_Context.puml',
    runtimeBytes: eagerBundleBytes(() => c4, 'c4_context'),
  },
  {
    label: 'archimate/archimate',
    bundleFolder: 'archimate',
    manifestFile: 'Archimate.puml',
    runtimeBytes: eagerBundleBytes(() => archimate, 'archimate'),
  },
  {
    // PNG-bearing: an `!function`-embedded `<img data:image/png;base64,...>`.
    // Read from the shipped `assets/` copy -- awslib14 has no eager module
    // (SI12 ADR-5).
    label: 'awslib14/analytics/analytics (PNG-bearing)',
    bundleFolder: 'awslib14',
    manifestFile: 'Analytics/Analytics.puml',
    runtimeBytes: shippedAssetBytes('stdlib-aws', 'awslib14', 'Analytics/Analytics.puml'),
  },
  {
    // Read from the shipped `assets/` copy -- tupadr3 has no eager module
    // (SI12 ADR-5).
    label: 'tupadr3/font-awesome-5/ban',
    bundleFolder: 'tupadr3',
    manifestFile: 'font-awesome-5/ban.puml',
    runtimeBytes: shippedAssetBytes('stdlib-tupadr3', 'tupadr3', 'font-awesome-5/ban.puml'),
  },
];

describe('VERBATIM round-trip: generated BundleData.files === vendored asset bytes', () => {
  it.each(ROUND_TRIP_CASES)('$label', ({ bundleFolder, manifestFile, runtimeBytes }) => {
    const runtime = runtimeBytes();
    const diskBytes = readFileSync(join(ASSETS_STDLIB_DIR, bundleFolder, manifestFile));
    const manifest = readManifest(bundleFolder);
    const manifestHash = manifest.files[manifestFile];
    expect(manifestHash).toBeDefined();

    expect(Buffer.compare(runtime, diskBytes)).toBe(0);
    expect(sha256Hex(runtime)).toBe(sha256Hex(diskBytes));
    expect('sha256:' + sha256Hex(runtime)).toBe(manifestHash);
  });
});

// ---------------------------------------------------------------------------
// 1b. Remote manifest emission (SI11a T5). These tests invoke the emitter
// DIRECTLY and dynamic-import the result from a throwaway tmpdir, rather than
// reading `packages/*/generated/*.remote.js`, so they pin the emitter's own
// output independently of whether the generator happens to have run.
// (`buildStdlibPackages()` does call these emitters -- wired in `fix(T5)` --
// and `stdlib-package-files.test.ts` covers the generated artifacts.)
//
// The tmpdir MUST live under `REPO_ROOT` (not `os.tmpdir()`): Vite's dev
// server denies module loads outside its `fs.allow` root, which defaults to
// the workspace root -- an `os.tmpdir()` path (`/private/var/folders/...`
// on macOS) is outside it and every dynamic `import()` 404s.
// ---------------------------------------------------------------------------

const REMOTE_MANIFEST_TMP_ROOT = join(REPO_ROOT, 'node_modules', '.tmp-stdlib-remote-manifest-test');

/** Loose shape of an emitted remote export -- deliberately NOT importing
 * T1's `StdlibRemoteManifest` (parallel task, `src/`-side; this suite stays
 * in `scripts/`/`tests/` and has no runtime dependency on it per T5's
 * interface contract). */
interface RemoteManifestLike {
  readonly name: string;
  readonly aliasOf?: string;
  readonly files: Record<string, string>;
}

function findRemoteModule(packageDir: string, fileBaseName: string): GeneratedModule {
  const spec = PACKAGE_SPECS.find((s) => s.packageDir === packageDir);
  if (spec?.remoteModules === undefined) {
    throw new Error(`packages/${packageDir} declares no remoteModules`);
  }
  const mod = spec.remoteModules.find((m) => m.fileBaseName === fileBaseName);
  if (mod === undefined) {
    throw new Error(`packages/${packageDir} has no remote module '${fileBaseName}'`);
  }
  return mod;
}

async function loadRemoteManifest(mod: GeneratedModule): Promise<Record<string, RemoteManifestLike>> {
  const js = emitRemoteManifestJs(mod, ASSETS_STDLIB_DIR);
  mkdirSync(REMOTE_MANIFEST_TMP_ROOT, { recursive: true });
  const tmpDir = mkdtempSync(join(REMOTE_MANIFEST_TMP_ROOT, 'run-'));
  const tmpFile = join(tmpDir, `${mod.fileBaseName}.remote.mjs`);
  writeFileSync(tmpFile, js, 'utf8');
  try {
    return (await import(pathToFileURL(tmpFile).href)) as Record<string, RemoteManifestLike>;
  } finally {
    rmSync(tmpDir, { recursive: true, force: true });
  }
}

describe('remote manifest emission (SI11a T5)', () => {
  it('acceptance 1: awslib14 keys map to their real, case-preserved relative path', async () => {
    const mod = findRemoteModule('stdlib-aws', 'awslib14');
    const manifest = await loadRemoteManifest(mod);
    const awslib14Remote = manifest.awslib14Remote;

    expect(awslib14Remote).toBeDefined();
    expect(awslib14Remote?.name).toBe('awslib14');
    expect(awslib14Remote?.files['storage/simplestorageservice']).toBe('Storage/SimpleStorageService.puml');
  });

  it('acceptance 2: the tupadr3 remote manifest module gzips to <= 60 KB', () => {
    const mod = findRemoteModule('stdlib-tupadr3', 'tupadr3');
    const js = emitRemoteManifestJs(mod, ASSETS_STDLIB_DIR);
    const gzipBytes = gzipSync(Buffer.from(js, 'utf8')).length;

    // Measured (not cited from the brief, per T5's method rule 2) against
    // the CURRENT assets/stdlib/tupadr3 tree.
    console.log(`tupadr3 remote manifest: ${js.length} raw bytes, ${gzipBytes} gzip bytes`);
    expect(gzipBytes).toBeLessThanOrEqual(60 * 1024);
  });

  it('acceptance 3: every emitted awslib14 path resolves to a real vendored file', async () => {
    const mod = findRemoteModule('stdlib-aws', 'awslib14');
    const manifest = await loadRemoteManifest(mod);
    const files = manifest.awslib14Remote?.files ?? {};
    const keys = Object.keys(files);

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const relPath = files[key];
      expect(existsSync(join(ASSETS_STDLIB_DIR, 'awslib14', relPath as string))).toBe(true);
    }
  });

  it('acceptance 3: every emitted tupadr3 path resolves to a real vendored file', async () => {
    const mod = findRemoteModule('stdlib-tupadr3', 'tupadr3');
    const manifest = await loadRemoteManifest(mod);
    const files = manifest.tupadr3Remote?.files ?? {};
    const keys = Object.keys(files);

    expect(keys.length).toBeGreaterThan(0);
    for (const key of keys) {
      const relPath = files[key];
      expect(existsSync(join(ASSETS_STDLIB_DIR, 'tupadr3', relPath as string))).toBe(true);
    }
  });

  it('acceptance 4: the awslib alias remote manifest carries aliasOf and empty files', async () => {
    const mod = findRemoteModule('stdlib-aws', 'awslib');
    const manifest = await loadRemoteManifest(mod);
    const awslibRemote = manifest.awslibRemote;

    expect(awslibRemote).toBeDefined();
    expect(awslibRemote?.aliasOf).toBe('awslib14');
    expect(Object.keys(awslibRemote?.files ?? { placeholder: '' })).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Alias resolution: stdlibStore(awslib, awslib14) resolves <awslib/...>.
// ---------------------------------------------------------------------------

describe('alias resolution -- @knowvah/plantuml-stdlib-aws', () => {
  it('resolves <awslib/General/User> through the awslib14 target bundle (real shipped bytes)', () => {
    // awslib14 has no eager `BundleData` module (SI12 ADR-2/ADR-5); build one
    // from the same shipped `assets/` bytes the round-trip cases above use,
    // so this still proves `stdlibStore`'s alias chain against real vendored
    // content -- the generic alias-chain mechanism (synthetic fixtures) is
    // already covered by `stdlib-resolution.test.ts`, and the alias
    // metadata itself (`aliasOf`, empty `files`) by this file's "remote
    // manifest emission" acceptance 4 below.
    const userPuml = readFileSync(
      join(PACKAGES_DIR, 'stdlib-aws', 'assets', 'awslib14', 'General', 'User.puml'),
      'utf8',
    );
    const awslib14Bundle: BundleData = { name: 'awslib14', files: { 'general/user': userPuml } };
    const awslibAlias: BundleData = { name: 'awslib', aliasOf: 'awslib14', files: {} };

    const store = stdlibStore(awslibAlias, awslib14Bundle);
    const resolved = store.getPumlResource('awslib/General/User');

    expect(resolved).toBeDefined();
    expect(resolved).toBe(userPuml);
  });
});

// ---------------------------------------------------------------------------
// 3. renderSync() end-to-end with the generated c4 bundle.
// ---------------------------------------------------------------------------

describe('renderSync() end-to-end with the generated c4 bundle', () => {
  it('!include <C4/C4_Context> resolves and Person() renders into the diagram', () => {
    const source = ['@startuml', '!include <C4/C4_Context>', 'Person(customer, "Customer")', '@enduml'].join('\n');

    const svg = renderSync(source, {
      includeStore: withStdlib(new MapIncludeStore(), stdlibStore(c4)),
      // jsdom has no <canvas> backend -- FormulaMeasurer avoids CanvasMeasurer
      // failing per-call (see measurer.ts, matches stdlib-resolution.test.ts).
      measurer: new FormulaMeasurer(),
    });

    expect(svg).toContain('<svg');
    expect(svg).toMatch(/Customer/);
  });
});

// ---------------------------------------------------------------------------
// 4. npm pack --dry-run: tarball ceilings + LICENSE presence.
// ---------------------------------------------------------------------------

interface PackResult {
  size: number;
  unpackedSize: number;
  files: readonly { path: string }[];
}

function npmPackDryRun(packageDir: string): PackResult {
  const stdout = execFileSync('npm', ['pack', '--dry-run', '--json'], {
    cwd: join(PACKAGES_DIR, packageDir),
    encoding: 'utf8',
  });
  const parsed = JSON.parse(stdout) as PackResult[];
  const result = parsed[0];
  if (result === undefined) {
    throw new Error(`npm pack --dry-run produced no output for packages/${packageDir}`);
  }
  return result;
}

const BYTES_PER_MB = 1024 * 1024;

interface PackCeiling {
  readonly packageDir: string;
  readonly ceilingMb: number;
}

/**
 * Only `stdlib` is packed HERE. The two asset-bearing packages
 * (`stdlib-aws`, `stdlib-tupadr3`) moved their ceiling + LICENSE assertions
 * to `stdlib-package-files.test.ts`, which already packs them for the
 * manifest-path check.
 *
 * That split is a correctness requirement, not tidiness. si11a T6 gave those
 * two packages a `prepack` hook (`copy-assets.mjs`) that rebuilds their
 * `assets/` tree, and vitest runs test files in parallel workers -- so two
 * files packing the same package had one enumerating `assets/` while the
 * other rebuilt it, surfacing as `ENOENT: lstat .../address_card_o.puml` and
 * npm's "tarball data seems to be corrupted" warning. `stdlib` has no
 * `prepack`, so nothing mutates the tree during a pack: it cannot race and
 * stays here, even though `sprite-package-files.test.ts` also packs it.
 *
 * si11b UPDATE: `stdlib` DOES have assets now -- 2,078 derived bootstrap
 * sprite fragments under `assets/bootstrap1.13.1/` (T1/T5). The conclusion
 * above is unchanged, but the reason narrowed: it is the ABSENCE OF A
 * PREPACK that makes packing read-only here, not the absence of assets.
 * Those fragments are written once by the root generator
 * (`build-stdlib-packages.ts#buildSpriteSplits`) via vitest `globalSetup`,
 * so no per-package copy step re-creates them mid-run. Give `stdlib` a
 * `prepack` and this file must consolidate with the other two again.
 */
const PACK_CEILINGS: readonly PackCeiling[] = [{ packageDir: 'stdlib', ceilingMb: 8 }];

describe('npm pack --dry-run: tarball ceilings + LICENSE presence', () => {
  it.each(PACK_CEILINGS)(
    'packages/$packageDir stays under $ceilingMb MB unpacked and ships a LICENSE',
    ({ packageDir, ceilingMb }) => {
      const result = npmPackDryRun(packageDir);

      expect(result.unpackedSize).toBeLessThan(ceilingMb * BYTES_PER_MB);
      expect(result.files.some((f) => f.path === 'LICENSE')).toBe(true);
      expect(result.files.some((f) => f.path === 'LICENSES.md')).toBe(true);
    },
    // si11a T6 made `npm pack` genuinely slower: each of these packages now
    // runs a `prepack` hook that byte-copies its vendored `.puml` assets
    // (6,849 files for tupadr3) before packing. Measured standalone at 12.1 s
    // for stdlib-tupadr3; under the full suite's parallel worker load that
    // overran the previous 30 s budget and surfaced as a bare
    // 'Command failed: npm pack --dry-run --json' -- a TIMEOUT wearing the
    // costume of a packaging failure. The ceiling assertion itself passes
    // (40,780,091 B < 45 MB). Raised with headroom for a loaded machine.
    120_000,
  );

  it('packages/stdlib-all ships a LICENSE and no vendored data of its own', () => {
    const result = npmPackDryRun('stdlib-all');

    expect(result.files.some((f) => f.path === 'LICENSE')).toBe(true);
    expect(result.files.some((f) => f.path.startsWith('generated/'))).toBe(true);
    expect(result.files.some((f) => f.path.includes('assets'))).toBe(false);
  });
});
