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
import { copyFileSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
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

function copyBundleAssets(assetFolder) {
  const sourceDir = join(ASSETS_STDLIB_DIR, assetFolder);
  const destDir = join(PACKAGE_ROOT, 'assets', assetFolder);

  rmSync(destDir, { recursive: true, force: true });
  mkdirSync(destDir, { recursive: true });

  for (const { relPath, absPath } of walkPumlFiles(sourceDir)) {
    const destPath = join(destDir, ...relPath.split('/'));
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(absPath, destPath);
  }
}

for (const assetFolder of ASSET_FOLDERS) {
  copyBundleAssets(assetFolder);
}
