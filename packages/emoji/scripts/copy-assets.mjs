#!/usr/bin/env node
/**
 * Copies the vendored Twemoji artwork from the repo-root `assets/emoji/`
 * tree into this package's `assets/` so the published tarball serves it.
 * Runs as `prepack`, so `npm pack` / `npm publish` always ship a fresh copy;
 * `assets/` here is gitignored — regenerable, exactly like
 * `packages/stdlib-aws/assets/`.
 *
 * Byte-for-byte copy, never a read-and-rewrite: the artwork is CC-BY 4.0 and
 * this package's notice states "modifications: none". Re-encoding would make
 * that statement false and would also change the geometry the conformance
 * oracle measures (the files are bare `<path>` fragments, not documents).
 *
 * LICENSES.md is copied alongside so the notice travels WITH the bytes.
 *
 * Usage: node scripts/copy-assets.mjs
 */
import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = join(__dirname, '..');
const REPO_ROOT = join(PACKAGE_ROOT, '..', '..');
const SOURCE_DIR = join(REPO_ROOT, 'assets', 'emoji');
const DEST_DIR = join(PACKAGE_ROOT, 'assets');

const SVG_SUFFIX = '.svg';

function svgFiles(root) {
  if (!existsSync(root)) return [];
  return readdirSync(root, { withFileTypes: true })
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(SVG_SUFFIX))
    .map((e) => e.name);
}

/**
 * Whether `DEST_DIR` already holds a complete copy. File COUNT is the
 * staleness signal (the source is a checksummed verbatim tree, guarded by
 * `scripts/vendor-emoji.ts --verify`), and skipping the rebuild also closes
 * the same pack/pack race `stdlib-aws`'s copier documents: two overlapping
 * `npm pack` runs, one walking `assets/` while the other had just `rmSync`'d
 * it, produce an ENOENT and a corrupt-tarball warning.
 */
function isUpToDate(expectedCount) {
  return existsSync(DEST_DIR) && svgFiles(DEST_DIR).length === expectedCount;
}

const sourceFiles = svgFiles(SOURCE_DIR);
if (sourceFiles.length === 0) {
  console.error(`no emoji artwork at ${SOURCE_DIR} — run: npx tsx scripts/vendor-emoji.ts`);
  process.exit(1);
}

if (!isUpToDate(sourceFiles.length)) {
  rmSync(DEST_DIR, { recursive: true, force: true });
  mkdirSync(DEST_DIR, { recursive: true });
  for (const name of sourceFiles) copyFileSync(join(SOURCE_DIR, name), join(DEST_DIR, name));
}

// The CC-BY notice ships beside the bytes it covers, not only at package root.
const notice = join(SOURCE_DIR, 'LICENSES.md');
if (existsSync(notice)) copyFileSync(notice, join(DEST_DIR, 'LICENSES.md'));
