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

import { beforeAll, describe, expect, it } from 'vitest';

import { buildStdlibPackages } from '../../scripts/build-stdlib-packages.js';

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

beforeAll(() => {
  buildStdlibPackages();
}, 30_000);

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
}

const MANIFEST_PACKAGING_CASES: readonly ManifestPackagingCase[] = [
  {
    label: 'stdlib-aws/awslib14',
    packageDir: 'stdlib-aws',
    manifestModuleFile: 'awslib14.remote.js',
    manifestExportName: 'awslib14Remote',
    assetFolder: 'awslib14',
  },
  {
    label: 'stdlib-tupadr3/tupadr3',
    packageDir: 'stdlib-tupadr3',
    manifestModuleFile: 'tupadr3.remote.js',
    manifestExportName: 'tupadr3Remote',
    assetFolder: 'tupadr3',
  },
];

describe('acceptance 2: every emitted manifest path is inside the resolved package contents', () => {
  it.each(MANIFEST_PACKAGING_CASES)(
    '$label',
    async ({ packageDir, manifestModuleFile, manifestExportName, assetFolder }) => {
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
    },
    60_000,
  );
});

// ---------------------------------------------------------------------------
// Acceptance 3: the eager modules are byte-identical across regenerations
// (regression guard -- the manual before/after sha256 comparison for THIS
// task's own change is documented in the task's return report, since a
// vitest run started after the task lands cannot see pre-task bytes).
// ---------------------------------------------------------------------------

describe('acceptance 3: eager modules are unaffected by asset packaging', () => {
  it('awslib14.js, awslib.js, tupadr3.js are byte-identical across repeated regeneration', () => {
    const files = [
      join(PACKAGES_DIR, 'stdlib-aws', 'generated', 'awslib14.js'),
      join(PACKAGES_DIR, 'stdlib-aws', 'generated', 'awslib.js'),
      join(PACKAGES_DIR, 'stdlib-tupadr3', 'generated', 'tupadr3.js'),
    ];
    const before = files.map((f) => sha256Hex(readFileSync(f)));

    buildStdlibPackages();

    const after = files.map((f) => sha256Hex(readFileSync(f)));
    expect(after).toEqual(before);
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
