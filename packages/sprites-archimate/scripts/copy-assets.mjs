#!/usr/bin/env node
/**
 * Copies the vendored ArchiMate sprite artwork from the repo-root
 * `assets/sprites/` tree into this package's `assets/` so the published
 * tarball serves it. Runs as `prepack`; `assets/` here is gitignored —
 * regenerable, exactly like `packages/stdlib-aws/assets/`.
 *
 * Byte-for-byte copy, never a read-and-rewrite: F3-lic's obligation 4
 * (`plans/s1l-tail-fix/findings/sprite-licence-review.md` §5) is that the
 * vendored bytes are provably never re-encoded, optimised or re-exported.
 * `scripts/vendor-sprites.ts --verify` is what proves it, and a rewrite here
 * would break that proof.
 *
 * The tree is NESTED (`archimate/**`), unlike the flat emoji one, so this
 * walks recursively and preserves relative paths — the sprite key scheme is
 * `sprite:<path>.<ext>` with the folder included (`archimate/interface.svg`),
 * so flattening would break resolution.
 *
 * Usage: node scripts/copy-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..', '..');
const SOURCE_DIR = join(REPO_ROOT, 'assets', 'sprites');
const DEST_DIR = join(PACKAGE_ROOT, 'assets');

/** Every artwork file, recursively, as repo-relative posix paths. Excludes
 *  our own notice file — it is copied separately, to the package root too. */
function artworkFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { recursive: true, withFileTypes: true })
    .filter((e) => e.isFile() && e.name !== 'LICENSES.md')
    .map((e) => relative(root, join(e.parentPath, e.name)).split(sep).join('/'));
}

/** File COUNT is the staleness signal — the source is a checksummed verbatim
 *  tree guarded by `vendor-sprites.ts --verify`. Skipping the rebuild also
 *  closes the overlapping-`npm pack` race stdlib-aws's copier documents. */
function isUpToDate(expectedCount) {
  return existsSync(DEST_DIR) && artworkFiles(DEST_DIR).length === expectedCount;
}

const sourceFiles = artworkFiles(SOURCE_DIR);
if (sourceFiles.length === 0) {
  console.error(`no sprite artwork at ${SOURCE_DIR} — run: npx tsx scripts/vendor-sprites.ts`);
  process.exit(1);
}

if (!isUpToDate(sourceFiles.length)) {
  rmSync(DEST_DIR, { recursive: true, force: true });
  for (const relPath of sourceFiles) {
    const destPath = join(DEST_DIR, ...relPath.split('/'));
    mkdirSync(dirname(destPath), { recursive: true });
    copyFileSync(join(SOURCE_DIR, ...relPath.split('/')), destPath);
  }
}

// The licence notice ships beside the bytes it covers, not only at package root.
const notice = join(SOURCE_DIR, 'LICENSES.md');
if (existsSync(notice)) {
  mkdirSync(DEST_DIR, { recursive: true });
  copyFileSync(notice, join(DEST_DIR, 'LICENSES.md'));
}
