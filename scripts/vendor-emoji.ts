/**
 * Vendors upstream PlantUML's jar-internal Twemoji artwork
 * (`net/sourceforge/plantuml/emoji/data/*.svg`) into `assets/emoji/`,
 * byte-verbatim, and emits `assets/emoji.manifest.json`.
 *
 * Sibling of `scripts/vendor-sprites.ts` — same copy + per-file SHA-256 +
 * `--verify` shape, and the same reason for COMMITTING the payload rather
 * than gitignoring it like `assets/stdlib/`: the source is a local
 * `~/git/plantuml` checkout at a pinned SHA, not a fetchable package, so CI
 * cannot regenerate it, and the licence notices attach to committed bytes.
 *
 * TWO deliberate differences from the sprites vendor:
 *
 *  - **`.svg` only.** The upstream `data/` directory also holds `emoji.txt`
 *    (the name→codepoint registry). That file is PlantUML's own MIT data and
 *    is already ported inline as `src/core/klimt/creole/Emoji.ts#EMOJI_DATA`.
 *    Excluding it keeps this tree — and the package built from it —
 *    **CC-BY-4.0 material only**, with no mixed-licence ambiguity for anyone
 *    reading the manifest or the notice file.
 *  - **The licence is CC BY 4.0, not MIT.** See
 *    `plans/s1l-tail-fix/findings/emoji-artwork-licence-review.md`. The
 *    manifest carries the attribution, licence URL and modification statement
 *    CC-BY 4.0 requires; `assets/emoji/LICENSES.md` carries the full notice.
 *
 * These files are bare `<path>`/`<circle>` fragments with NO `<svg>` root —
 * upstream feeds them to `SvgSpriteParserFactory.create(data, null, null)`
 * (`Emoji.java:167-172`), i.e. the same parser family as sprites but with no
 * declared box. Do not "repair" them into well-formed SVG documents: that
 * would be a modification of a CC-BY work AND would change the geometry the
 * oracle measures.
 *
 * Usage:
 *   npx tsx scripts/vendor-emoji.ts [--source <plantuml-checkout>]  # copy + manifest
 *   npx tsx scripts/vendor-emoji.ts --verify                        # bytes vs manifest
 *
 * Node `fs` is fine here — this module lives under `scripts/`, never `src/`.
 */

import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { walkFiles } from './vendor-stdlib/walk.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const EMOJI_DIR = join(REPO_ROOT, 'assets', 'emoji');
export const EMOJI_MANIFEST = join(REPO_ROOT, 'assets', 'emoji.manifest.json');

/** The upstream commit these bytes were taken at (oracle/pin.json:seamCommit). */
export const UPSTREAM_SHA = 'de1f986f09253edb9bf6351808e1cdba99ec9e74';
const UPSTREAM_REPO = 'https://github.com/plantuml/plantuml';
const UPSTREAM_PATH = 'src/main/resources/net/sourceforge/plantuml/emoji/data';

const SVG_SUFFIX = '.svg';

export interface EmojiFileEntry {
  readonly bytes: number;
  readonly sha256: string;
}

export interface EmojiManifest {
  readonly sourceRepo: string;
  readonly sourceSha: string;
  readonly sourcePath: string;
  readonly generatedBy: string;
  readonly licenses: string;
  readonly licenceReview: string;
  readonly license: string;
  readonly licenseUrl: string;
  readonly attribution: string;
  readonly modifications: string;
  readonly excluded: string;
  readonly fileCount: number;
  readonly files: Readonly<Record<string, EmojiFileEntry>>;
}

function sha256(bytes: Uint8Array): string {
  return createHash('sha256').update(bytes).digest('hex');
}

export function hashTree(root: string): Record<string, EmojiFileEntry> {
  const files: Record<string, EmojiFileEntry> = {};
  for (const { relPath, absPath } of walkFiles(root)) {
    if (relPath === 'LICENSES.md') continue; // our own notice file, not upstream's bytes
    if (!relPath.toLowerCase().endsWith(SVG_SUFFIX)) continue;
    const bytes = readFileSync(absPath);
    files[relPath] = { bytes: bytes.byteLength, sha256: sha256(bytes) };
  }
  return files;
}

export function buildManifest(files: Readonly<Record<string, EmojiFileEntry>>): EmojiManifest {
  return {
    sourceRepo: UPSTREAM_REPO,
    sourceSha: UPSTREAM_SHA,
    sourcePath: UPSTREAM_PATH,
    generatedBy: 'scripts/vendor-emoji.ts',
    licenses: 'assets/emoji/LICENSES.md',
    licenceReview: 'plans/s1l-tail-fix/findings/emoji-artwork-licence-review.md',
    license: 'CC-BY-4.0',
    licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
    attribution: 'Twemoji (c) by Twitter at https://twemoji.twitter.com/ — graphics licensed CC-BY 4.0; maintained fork: https://github.com/jdecked/twemoji',
    modifications:
      'None. Copied byte-for-byte from the upstream PlantUML checkout at sourceSha; never re-encoded, optimised, minified or re-exported. Verify with `npx tsx scripts/vendor-emoji.ts --verify`.',
    excluded:
      "emoji.txt (upstream PlantUML's own MIT name registry) is deliberately NOT vendored here — it is ported inline as src/core/klimt/creole/Emoji.ts#EMOJI_DATA, so this tree stays CC-BY-4.0 material only.",
    fileCount: Object.keys(files).length,
    files,
  };
}

function copyTree(sourceRoot: string): void {
  for (const { relPath, absPath } of walkFiles(sourceRoot)) {
    if (!relPath.toLowerCase().endsWith(SVG_SUFFIX)) continue;
    const target = join(EMOJI_DIR, relPath);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(absPath, target); // byte-for-byte; never re-encoded
  }
}

/** Every vendored path whose bytes no longer hash to the manifest entry, plus
 *  paths present in exactly one of the two. Empty ⇒ byte-verbatim intact. */
export function verifyTree(): string[] {
  const manifest = JSON.parse(readFileSync(EMOJI_MANIFEST, 'utf8')) as EmojiManifest;
  const actual = hashTree(EMOJI_DIR);
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
    process.stdout.write(`${drift.length} file(s) drifted from assets/emoji.manifest.json\n`);
    return drift.length === 0 ? 0 : 1;
  }
  const sourceIdx = argv.indexOf('--source');
  const source =
    sourceIdx === -1
      ? join(process.env.HOME ?? '', 'git', 'plantuml', UPSTREAM_PATH)
      : argv[sourceIdx + 1]!;
  copyTree(source);
  const manifest = buildManifest(hashTree(EMOJI_DIR));
  writeFileSync(EMOJI_MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
  process.stdout.write(`vendored ${manifest.fileCount} emoji files from ${source}\n`);
  return 0;
}

if (process.argv[1] !== undefined && import.meta.url === `file://${process.argv[1]}`) {
  process.exit(main(process.argv.slice(2)));
}
