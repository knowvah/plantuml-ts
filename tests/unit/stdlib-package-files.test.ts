/**
 * SI11a T6 -- the packaging gate.
 *
 * A package whose `files` array omits the per-resource `.puml` assets
 * passes every other test and 404s for every consumer after publish
 * (`plans/si11a-per-resource-stdlib-fetch/batch-2/overview.md`, "The trap
 * in T6"). This suite catches it by RESOLVING what `npm pack --dry-run
 * --json` would actually publish -- the same technique
 * `tests/unit/stdlib-packages.test.ts` already uses -- and asserting every
 * path named by the remote manifest is present in that resolved file list.
 * It never eyeballs the `files` array in `package.json`.
 *
 * `npm pack` runs each package's `prepack` lifecycle script even in
 * `--dry-run` mode (verified empirically), so this also proves the
 * `assets/` copy step (`packages/*\/scripts/copy-assets.mjs`) is wired up
 * for real publication, not just runnable by hand.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { emitModuleJs } from '../../scripts/build-stdlib-packages/emit-module.js';
import { PACKAGE_SPECS } from '../../scripts/build-stdlib-packages/package-specs.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');

interface RemoteManifestLike {
  readonly name: string;
  readonly aliasOf?: string;
  readonly files: Record<string, string>;
}

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

function readPackageJson(packageDir: string): PackageJson {
  const raw = readFileSync(join(PACKAGES_DIR, packageDir, 'package.json'), 'utf8');
  return JSON.parse(raw) as PackageJson;
}

/** Mirrors `tests/unit/stdlib-packages.test.ts`'s `npmPackDryRun` --
 * resolves what `npm pack` would actually publish, lifecycle scripts
 * (`prepack`) included. */
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

async function importGenerated<T>(packageDir: string, moduleFile: string): Promise<T> {
  const path = join(PACKAGES_DIR, packageDir, 'generated', moduleFile);
  return (await import(pathToFileURL(path).href)) as T;
}

function sha256Hex(bytes: Buffer): string {
  return createHash('sha256').update(bytes).digest('hex');
}

// ---------------------------------------------------------------------------
// Acceptance 1: exports carries the remote subpath, files carries `assets`.
// ---------------------------------------------------------------------------

interface RemoteExportsCase {
  readonly label: string;
  readonly packageDir: string;
  readonly exportSubpaths: readonly string[];
}

const REMOTE_EXPORTS_CASES: readonly RemoteExportsCase[] = [
  { label: 'stdlib-aws', packageDir: 'stdlib-aws', exportSubpaths: ['./awslib14.remote', './awslib.remote'] },
  { label: 'stdlib-tupadr3', packageDir: 'stdlib-tupadr3', exportSubpaths: ['./tupadr3.remote'] },
];

describe('acceptance 1: package.json carries the remote subpath and ships assets', () => {
  it.each(REMOTE_EXPORTS_CASES)('packages/$packageDir', ({ packageDir, exportSubpaths }) => {
    const pkg = readPackageJson(packageDir);

    for (const subpath of exportSubpaths) {
      expect(Object.keys(pkg.exports)).toContain(subpath);
    }
    expect(pkg.files).toContain('assets');
    // ADR-1: the eager subpaths and `generated` must still be present --
    // additive only, never removed or renamed.
    expect(pkg.files).toContain('generated');
  });
});

// ---------------------------------------------------------------------------
// Acceptance 2 (THE TRAP): every manifest path resolves inside the
// package's published `files` globs, proven by resolving `npm pack
// --dry-run --json`'s actual file list -- not by reading the `files` array.
// ---------------------------------------------------------------------------

interface ManifestPackagingCase {
  readonly label: string;
  readonly packageDir: string;
  readonly manifestModuleFile: string;
  readonly manifestExportName: string;
  readonly assetFolder: string;
  /**
   * Unpacked-size ceiling, asserted HERE rather than in
   * `stdlib-packages.test.ts`, so that exactly ONE test file ever runs
   * `npm pack` against an asset-bearing package.
   *
   * That is a correctness requirement, not tidiness. `npm pack` triggers
   * each package's `prepack` -> `copy-assets.mjs`, and vitest runs test
   * files in parallel workers: two files packing the same package had one
   * enumerating `assets/` while the other rebuilt it, surfacing as
   * `ENOENT: lstat .../assets/tupadr3/font-awesome/address_card_o.puml`
   * plus npm's "tarball data seems to be corrupted" warning. The
   * `isUpToDate` guard in `copy-assets.mjs` closes the window; keeping the
   * packs in one file removes the contention that opened it.
   *
   * The packages roughly DOUBLED in si11a: ADR-1 keeps the eager inlined
   * module byte-identical for offline consumers while ADR-4 additionally
   * ships the raw `.puml` files, so each bundle's content exists twice, in
   * two encodings, deliberately. Measured 2026-07-31: stdlib-aws
   * 16,665,500 B, stdlib-tupadr3 40,780,091 B.
   */
  readonly ceilingMb: number;
}

const BYTES_PER_MB = 1024 * 1024;

const MANIFEST_PACKAGING_CASES: readonly ManifestPackagingCase[] = [
  {
    label: 'stdlib-aws/awslib14',
    packageDir: 'stdlib-aws',
    manifestModuleFile: 'awslib14.remote.js',
    manifestExportName: 'awslib14Remote',
    assetFolder: 'awslib14',
    ceilingMb: 18,
  },
  {
    label: 'stdlib-tupadr3/tupadr3',
    packageDir: 'stdlib-tupadr3',
    manifestModuleFile: 'tupadr3.remote.js',
    manifestExportName: 'tupadr3Remote',
    assetFolder: 'tupadr3',
    ceilingMb: 45,
  },
];

describe('acceptance 2: every emitted manifest path is inside the resolved package contents', () => {
  it.each(MANIFEST_PACKAGING_CASES)(
    '$label',
    async ({ packageDir, manifestModuleFile, manifestExportName, assetFolder, ceilingMb }) => {
      const manifestModule = await importGenerated<Record<string, RemoteManifestLike>>(
        packageDir,
        manifestModuleFile,
      );
      const manifest = manifestModule[manifestExportName];
      expect(manifest).toBeDefined();
      const keys = Object.keys(manifest?.files ?? {});
      expect(keys.length).toBeGreaterThan(0);

      const packed = npmPackDryRun(packageDir);
      const packedPaths = new Set(packed.files.map((f) => f.path));

      for (const key of keys) {
        const relPath = manifest?.files[key] as string;
        const expectedPackedPath = `assets/${assetFolder}/${relPath}`;
        expect(packedPaths.has(expectedPackedPath)).toBe(true);
      }

      // Folded in from `stdlib-packages.test.ts` so only one test file packs
      // this package -- see `ceilingMb`'s comment for the race that motivated
      // it. Reuses the pack result already computed above rather than
      // invoking `npm pack` a second time.
      expect(packed.unpackedSize).toBeLessThan(ceilingMb * BYTES_PER_MB);
      expect(packedPaths.has('LICENSE')).toBe(true);
      expect(packedPaths.has('LICENSES.md')).toBe(true);
    },
    120_000,
  );
});

// ---------------------------------------------------------------------------
// Acceptance 3: the eager modules are byte-identical across regenerations
// (regression guard -- the manual before/after sha256 comparison for THIS
// task's own change is documented in the task's return report, since a
// vitest run started after the task lands cannot see pre-task bytes).
// ---------------------------------------------------------------------------

interface EagerModuleCase {
  readonly label: string;
  readonly packageDir: string;
  readonly fileBaseName: string;
}

const EAGER_MODULE_CASES: readonly EagerModuleCase[] = [
  { label: 'stdlib-aws/awslib14.js', packageDir: 'stdlib-aws', fileBaseName: 'awslib14' },
  { label: 'stdlib-aws/awslib.js', packageDir: 'stdlib-aws', fileBaseName: 'awslib' },
  { label: 'stdlib-tupadr3/tupadr3.js', packageDir: 'stdlib-tupadr3', fileBaseName: 'tupadr3' },
];

/**
 * Re-emits each eager module through the SAME pure emitter the build uses and
 * compares bytes, rather than calling `buildStdlibPackages()` again.
 *
 * The rebuild-and-compare version of this test was itself a race: it is a
 * WRITER of `packages/*&#47;generated/`, and vitest runs test files in parallel
 * workers, so it deleted and rewrote the tree while other files were
 * `import()`ing out of it (`Failed to load url .../awslib14.remote.js`).
 * `emitModuleJs` is a pure function of the spec plus the vendored assets, so
 * re-emitting proves the same property -- regeneration yields byte-identical
 * eager modules -- with no filesystem mutation at all.
 *
 * The before/after sha256 comparison against PRE-task bytes is recorded in
 * si11a T6's return report and the decision journal; a vitest run starting
 * after the task landed cannot observe those bytes.
 */
describe('acceptance 3: eager modules are unaffected by asset packaging', () => {
  it.each(EAGER_MODULE_CASES)('$label is byte-identical to a fresh emit', ({ packageDir, fileBaseName }) => {
    const spec = PACKAGE_SPECS.find((s) => s.packageDir === packageDir);
    expect(spec).toBeDefined();
    const mod = spec?.modules.find((m) => m.fileBaseName === fileBaseName);
    expect(mod).toBeDefined();

    const onDisk = readFileSync(join(PACKAGES_DIR, packageDir, 'generated', `${fileBaseName}.js`));
    const freshlyEmitted = Buffer.from(emitModuleJs(mod!, ASSETS_STDLIB_DIR), 'utf8');

    expect(sha256Hex(onDisk)).toBe(sha256Hex(freshlyEmitted));
  });
});

// ---------------------------------------------------------------------------
// Acceptance 5: each manifest module parses; `files` is non-empty for
// concrete bundles, and the alias carries `aliasOf` with empty `files`.
// ---------------------------------------------------------------------------

describe('acceptance 5: manifest modules parse with the expected shape', () => {
  it('awslib14Remote (concrete) has non-empty files', async () => {
    const mod = await importGenerated<Record<string, RemoteManifestLike>>('stdlib-aws', 'awslib14.remote.js');
    expect(mod.awslib14Remote?.name).toBe('awslib14');
    expect(Object.keys(mod.awslib14Remote?.files ?? {}).length).toBeGreaterThan(0);
  });

  it('awslibRemote (alias) carries aliasOf and empty files', async () => {
    const mod = await importGenerated<Record<string, RemoteManifestLike>>('stdlib-aws', 'awslib.remote.js');
    expect(mod.awslibRemote?.aliasOf).toBe('awslib14');
    expect(Object.keys(mod.awslibRemote?.files ?? { placeholder: '' })).toHaveLength(0);
  });

  it('tupadr3Remote (concrete) has non-empty files', async () => {
    const mod = await importGenerated<Record<string, RemoteManifestLike>>('stdlib-tupadr3', 'tupadr3.remote.js');
    expect(mod.tupadr3Remote?.name).toBe('tupadr3');
    expect(Object.keys(mod.tupadr3Remote?.files ?? {}).length).toBeGreaterThan(0);
  });
});
