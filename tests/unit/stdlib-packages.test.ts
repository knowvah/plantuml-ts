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
let awslib14: BundleData;
let awslib: BundleData;
let tupadr3: BundleData;

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
  const awsAwslib14 = await importGenerated<{ awslib14: BundleData }>('stdlib-aws', 'awslib14.js');
  awslib14 = awsAwslib14.awslib14;
  const awsAwslib = await importGenerated<{ awslib: BundleData }>('stdlib-aws', 'awslib.js');
  awslib = awsAwslib.awslib;
  const tupadr3Mod = await importGenerated<{ tupadr3: BundleData }>('stdlib-tupadr3', 'tupadr3.js');
  tupadr3 = tupadr3Mod.tupadr3;
}, 30_000);

// ---------------------------------------------------------------------------
// 1. VERBATIM round-trip: runtime string bytes === disk bytes === manifest sha256.
// ---------------------------------------------------------------------------

interface RoundTripCase {
  readonly label: string;
  readonly bundle: () => BundleData;
  readonly bundleFolder: string;
  readonly bundleKey: string;
  readonly manifestFile: string;
}

const ROUND_TRIP_CASES: readonly RoundTripCase[] = [
  { label: 'c4/c4', bundle: () => c4, bundleFolder: 'C4', bundleKey: 'c4', manifestFile: 'C4.puml' },
  {
    label: 'c4/c4_context',
    bundle: () => c4,
    bundleFolder: 'C4',
    bundleKey: 'c4_context',
    manifestFile: 'C4_Context.puml',
  },
  {
    label: 'archimate/archimate',
    bundle: () => archimate,
    bundleFolder: 'archimate',
    bundleKey: 'archimate',
    manifestFile: 'Archimate.puml',
  },
  {
    // PNG-bearing: an `!function`-embedded `<img data:image/png;base64,...>`.
    label: 'awslib14/analytics/analytics (PNG-bearing)',
    bundle: () => awslib14,
    bundleFolder: 'awslib14',
    bundleKey: 'analytics/analytics',
    manifestFile: 'Analytics/Analytics.puml',
  },
  {
    label: 'tupadr3/font-awesome-5/ban',
    bundle: () => tupadr3,
    bundleFolder: 'tupadr3',
    bundleKey: 'font-awesome-5/ban',
    manifestFile: 'font-awesome-5/ban.puml',
  },
];

describe('VERBATIM round-trip: generated BundleData.files === vendored asset bytes', () => {
  it.each(ROUND_TRIP_CASES)('$label', ({ bundle, bundleFolder, bundleKey, manifestFile }) => {
    const content = bundle().files[bundleKey];
    expect(content).toBeDefined();

    const runtimeBytes = Buffer.from(content as string, 'utf8');
    const diskBytes = readFileSync(join(ASSETS_STDLIB_DIR, bundleFolder, manifestFile));
    const manifest = readManifest(bundleFolder);
    const manifestHash = manifest.files[manifestFile];
    expect(manifestHash).toBeDefined();

    expect(Buffer.compare(runtimeBytes, diskBytes)).toBe(0);
    expect(sha256Hex(runtimeBytes)).toBe(sha256Hex(diskBytes));
    expect('sha256:' + sha256Hex(runtimeBytes)).toBe(manifestHash);
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
  it('resolves <awslib/General/User> through the awslib14 target bundle', () => {
    const store = stdlibStore(awslib, awslib14);
    const resolved = store.getPumlResource('awslib/General/User');
    const direct = awslib14.files['general/user'];

    expect(resolved).toBeDefined();
    expect(resolved).toBe(direct);
  });

  it('the awslib alias itself carries no files (aliasOf is authoritative)', () => {
    expect(awslib.aliasOf).toBe('awslib14');
    expect(Object.keys(awslib.files)).toHaveLength(0);
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
