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
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { describe, expect, it } from 'vitest';

import { LOCK_PRESSURE_BUDGET_MS } from '../helpers/lock-pressure-budget.js';
import { withStdlibBuildLock } from '../helpers/with-stdlib-build-lock.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const PACKAGES_DIR = join(REPO_ROOT, 'packages');

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
 * (`prepack`) included.
 *
 * stdlib-run-isolation T4 (option D, `planning/adr/ADR-003-stdlib-run-isolation.md`):
 * `npm pack` resolves `files` against the real package directory -- D3's
 * hard case a read seam cannot reach. Held for exactly the `execFileSync`
 * call, the narrowest span that touches the canonical tree. */
function npmPackDryRun(packageDir: string): PackResult {
  return withStdlibBuildLock(() => {
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
  });
}

/** stdlib-run-isolation T4: the dynamic import resolves an absolute path
 * under `packages/<pkg>/generated/`, so it is held inside the build lock --
 * the narrowest span is exactly this one `import()`. */
async function importGenerated<T>(packageDir: string, moduleFile: string): Promise<T> {
  return withStdlibBuildLock(() => {
    const path = join(PACKAGES_DIR, packageDir, 'generated', moduleFile);
    return import(pathToFileURL(path).href) as Promise<T>;
  });
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
    // `generated` must still be present -- SI12 ADR-1 kept it (the index
    // re-exports the remote manifests now, not an eager module), additive
    // only, never removed or renamed.
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
   * si11a roughly DOUBLED these packages: ADR-1 kept the eager inlined
   * module byte-identical for offline consumers while ADR-4 additionally
   * shipped the raw `.puml` files, so each bundle's content existed twice,
   * in two encodings, deliberately. SI12 ADR-2/ADR-5 stopped generating the
   * eager module for these two packages entirely -- `assets/` is now the
   * ONLY encoding they ship, so the ceiling drops back toward roughly half
   * of si11a's value. This is the mission's one automated regression
   * signal (`plans/si12-eager-module-removal/batch-2/overview.md`): if the
   * eager module ever comes back, or `assets/` stops shipping, this
   * ceiling (or acceptance 1's `exports`/`files` assertions) is what
   * notices.
   *
   * Measured 2026-08-01 via `npm pack --dry-run --json` in each package
   * directory (this task, T4): stdlib-aws unpackedSize 8,346,761 B
   * (~7.96 MiB), stdlib-tupadr3 unpackedSize 20,292,598 B (~19.35 MiB) --
   * both roughly HALVED from si11a's 16,665,500 B / 40,780,091 B, consistent
   * with dropping exactly one of the two encodings. Ceilings below add
   * ~25-26% headroom over the measured figure, not si11a's stale value.
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
    // Measured 8,346,761 B (~7.96 MiB unpacked) -- ~26% headroom.
    ceilingMb: 10,
  },
  {
    label: 'stdlib-tupadr3/tupadr3',
    packageDir: 'stdlib-tupadr3',
    manifestModuleFile: 'tupadr3.remote.js',
    manifestExportName: 'tupadr3Remote',
    assetFolder: 'tupadr3',
    // Measured 20,292,598 B (~19.35 MiB unpacked) -- ~24% headroom.
    ceilingMb: 24,
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
    LOCK_PRESSURE_BUDGET_MS,
  );
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
  },
    LOCK_PRESSURE_BUDGET_MS);

  it('awslibRemote (alias) carries aliasOf and empty files', async () => {
    const mod = await importGenerated<Record<string, RemoteManifestLike>>('stdlib-aws', 'awslib.remote.js');
    expect(mod.awslibRemote?.aliasOf).toBe('awslib14');
    expect(Object.keys(mod.awslibRemote?.files ?? { placeholder: '' })).toHaveLength(0);
  },
    LOCK_PRESSURE_BUDGET_MS);

  it('tupadr3Remote (concrete) has non-empty files', async () => {
    const mod = await importGenerated<Record<string, RemoteManifestLike>>('stdlib-tupadr3', 'tupadr3.remote.js');
    expect(mod.tupadr3Remote?.name).toBe('tupadr3');
    expect(Object.keys(mod.tupadr3Remote?.files ?? {}).length).toBeGreaterThan(0);
  },
    LOCK_PRESSURE_BUDGET_MS);
});
