#!/usr/bin/env node
/**
 * Copies the vendored `.puml` assets this package's remote manifests
 * reference (`generated/awslib14.remote.js`) into `assets/` so the
 * published tarball can serve them (SI11a T6; ADR-4 -- there is no default
 * CDN, so the assets must ship IN the package).
 *
 * Byte-for-byte copy, no read-and-rewrite: `awslib14` is CC BY-ND, and any
 * re-encode would void the grant (mission stop condition 5). Runs as this
 * package's `prepack` script, so `npm pack` / `npm publish` always ship a
 * fresh copy; `assets/` itself is gitignored (`.gitignore` in this
 * directory) -- regenerable, like `generated/`, never committed.
 *
 * Usage: node scripts/copy-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..', '..');
const ASSETS_STDLIB_DIR = join(REPO_ROOT, 'assets', 'stdlib');

/** One entry per bundle this package ships remote manifests for
 * (`scripts/build-stdlib-packages/package-specs.ts`'s `STDLIB_AWS_PACKAGE.
 * remoteModules`). `awslib` is an alias with no assets of its own. */
const ASSET_FOLDERS = ['awslib14'];

const PUML_SUFFIX = '.puml';

function isPumlFile(fileName) {
  return fileName.toLowerCase().endsWith(PUML_SUFFIX);
}

function toPosixRelPath(root, absPath) {
  return relative(root, absPath).split(sep).join('/');
}

/** Same walk+filter as `scripts/vendor-stdlib/walk.ts` +
 * `emit-remote-manifest.ts#isPumlFile`: every `.puml` file, recursively,
 * case preserved. */
function walkPumlFiles(root) {
  const entries = readdirSync(root, { recursive: true, withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (!entry.isFile() || !isPumlFile(entry.name)) {
      continue;
    }
    const absPath = join(entry.parentPath, entry.name);
    files.push({ relPath: toPosixRelPath(root, absPath), absPath });
  }
  return files;
}

/**
 * Whether `destDir` already holds a complete copy, so the destructive
 * rebuild below can be skipped entirely.
 *
 * This is not just a speed optimisation, it closes a RACE. `npm pack` runs
 * this script via `prepack` and then enumerates `assets/`; two packs of the
 * same package overlapping (which the test suite does -- vitest runs test
 * files in parallel workers) meant one pack was walking the tree while the
 * other had just `rmSync`'d it, producing an `ENOENT: lstat` on a vendored
 * `.puml` and npm's "tarball data seems to be corrupted" warning. With this
 * guard the second pack finds the copy current and never deletes anything.
 *
 * File COUNT is the staleness signal, not mtime: the vendored tree is a
 * verbatim checksummed copy, so a count match means the same set of files
 * (`vendor-stdlib.ts --verify` is what guards their CONTENT).
 */
function isUpToDate(destDir, expectedCount) {
  return existsSync(destDir) && walkPumlFiles(destDir).length === expectedCount;
}

function copyBundleAssets(assetFolder) {
  const sourceDir = join(ASSETS_STDLIB_DIR, assetFolder);
  const destDir = join(PACKAGE_ROOT, 'assets', assetFolder);

  const sourceFiles = walkPumlFiles(sourceDir);
  if (isUpToDate(destDir, sourceFiles.length)) return;

  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });

  for (const { relPath, absPath } of sourceFiles) {
    const destPath = join(destDir, ...relPath.split('/'));
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(absPath, destPath);
  }
}

for (const assetFolder of ASSET_FOLDERS) {
  copyBundleAssets(assetFolder);
}
