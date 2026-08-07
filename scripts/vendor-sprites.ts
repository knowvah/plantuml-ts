/**
 * Vendors upstream PlantUML's jar-internal `/sprites/**` resource root into
 * `assets/sprites/`, byte-verbatim, and emits `assets/sprites.manifest.json`.
 *
 * Mirrors `scripts/vendor-stdlib.ts`'s shape (copy + manifest + pinned source
 * SHA), with two differences forced by
 * `plans/s1l-tail-fix/findings/sprite-licence-review.md` §5:
 *
 *  - The payload is COMMITTED, not gitignored like `assets/stdlib/`. Its
 *    source is a local `~/git/plantuml` checkout at a pinned SHA, not a
 *    fetchable package, so a CI runner cannot regenerate it — and a committed
 *    licensed asset is exactly what the review's notice obligations attach to.
 *  - The manifest records a per-file SHA-256, so `--verify` can prove the
 *    vendored bytes were never re-encoded, optimised or re-exported
 *    (obligation 4; SI5b D3's rule).
 *
 * Usage:
 *   npx tsx scripts/vendor-sprites.ts [--source <plantuml-checkout>]  # copy + manifest
 *   npx tsx scripts/vendor-sprites.ts --verify                        # bytes vs manifest
 *
 * Node `fs` is fine here — this module lives under `scripts/`, never `src/`
 * (plantuml-ts must stay browser-safe, CLAUDE.md).
 */

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { walkFiles } from './vendor-stdlib/walk.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const SPRITES_DIR = join(REPO_ROOT, 'assets', 'sprites');
export const SPRITES_MANIFEST = join(REPO_ROOT, 'assets', 'sprites.manifest.json');

/** The upstream commit these bytes were taken at — obligation 5 of the
 *  licence review (`de1f986f092`, `snapshot-61-gde1f986f092`). */
export const UPSTREAM_SHA = 'de1f986f09253edb9bf6351808e1cdba99ec9e74';
const UPSTREAM_REPO = 'https://github.com/plantuml/plantuml';
const UPSTREAM_PATH = 'src/main/resources/sprites';

export interface SpriteFileEntry {
  readonly bytes: number;
  readonly sha256: string;
}

export interface SpritesManifest {
  readonly sourceRepo: string;
  readonly sourceSha: string;
  readonly sourcePath: string;
  readonly generatedBy: string;
  readonly licenses: string;
  readonly licenceReview: string;
  readonly attribution: string;
  readonly trademark: string;
  readonly sets: Readonly<Record<string, unknown>>;
  readonly files: Readonly<Record<string, SpriteFileEntry>>;
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

/** Per-file size + digest for every vendored file, sorted (walkFiles sorts),
 *  so the manifest diff is meaningful and regeneration is idempotent. */
export function hashTree(root: string): Record<string, SpriteFileEntry> {
  const files: Record<string, SpriteFileEntry> = {};
  for (const { relPath, absPath } of walkFiles(root)) {
    if (relPath === 'LICENSES.md') continue; // our own notice file, not upstream's bytes
    const bytes = readFileSync(absPath);
    files[relPath] = { bytes: bytes.byteLength, sha256: sha256(bytes) };
  }
  return files;
}

function countBy(files: Readonly<Record<string, SpriteFileEntry>>, extension: string): number {
  return Object.keys(files).filter((p) => p.endsWith(extension)).length;
}

export function buildManifest(files: Readonly<Record<string, SpriteFileEntry>>): SpritesManifest {
  return {
    sourceRepo: UPSTREAM_REPO,
    sourceSha: UPSTREAM_SHA,
    sourcePath: UPSTREAM_PATH,
    generatedBy: 'scripts/vendor-sprites.ts',
    licenses: 'assets/sprites/LICENSES.md',
    licenceReview: 'plans/s1l-tail-fix/findings/sprite-licence-review.md',
    attribution: 'Archimate sprites are from Archi: http://www.archimatetool.com',
    trademark: 'ArchiMate is a registered trademark of The Open Group.',
    sets: {
      archimate: {
        license: 'MIT',
        fileCount: Object.keys(files).length,
        svgCount: countBy(files, '.svg'),
        pngCount: countBy(files, '.png'),
        lineage: {
          svg: 'Original Inkscape drawings contributed to plantuml/plantuml by Jean-Marc van Leerdam (PRs #2316, #2327); MIT via upstream LICENSES.md / plantuml-mit.',
          png: 'Derived from the Archi modelling tool (com.archimatetool.editor/img/archimate), imported 2016-01-09 (703a77ee1c3); MIT, (c) 2013-2015 Phillip Beauvoir, and today Phillip Beauvoir, Jean-Baptiste Sarrodie, The Open Group.',
        },
      },
    },
    files,
  };
}

function copyTree(sourceRoot: string): void {
  for (const { relPath, absPath } of walkFiles(sourceRoot)) {
    const target = join(SPRITES_DIR, relPath);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(absPath, target); // byte-for-byte; never re-encoded
  }
}

/** Every vendored path whose bytes no longer hash to the manifest entry, plus
 *  paths present in exactly one of the two. Empty ⇒ byte-verbatim intact. */
export function verifyTree(): string[] {
  const manifest = JSON.parse(readFileSync(SPRITES_MANIFEST, 'utf8')) as SpritesManifest;
  const actual = hashTree(SPRITES_DIR);
  const drift: string[] = [];
  for (const [path, entry] of Object.entries(manifest.files)) {
    const found = actual[path];
    if (found === undefined) drift.push(`missing: ${path}`);
    else if (found.sha256 !== entry.sha256) drift.push(`modified: ${path}`);
  }
  for (const path of Object.keys(actual))
    if (manifest.files[path] === undefined) drift.push(`unexpected: ${path}`);
  return drift;
}

function main(argv: readonly string[]): number {
  if (argv.includes('--verify')) {
    const drift = verifyTree();
    drift.forEach((line) => process.stdout.write(line + '\n'));
    process.stdout.write(`${drift.length} file(s) drifted from assets/sprites.manifest.json\n`);
    return drift.length === 0 ? 0 : 1;
  }
  const sourceIdx = argv.indexOf('--source');
  const source =
    sourceIdx === -1
      ? join(process.env.HOME ?? '', 'git', 'plantuml', UPSTREAM_PATH)
      : argv[sourceIdx + 1]!;
  copyTree(source);
  const manifest = buildManifest(hashTree(SPRITES_DIR));
  writeFileSync(SPRITES_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write(`vendored ${Object.keys(manifest.files).length} sprite files from ${source}\n`);
  return 0;
}

if (process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
