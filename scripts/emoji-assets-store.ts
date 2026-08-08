/**
 * Node-side {@link AssetStore} over the vendored Twemoji artwork
 * (`assets/emoji/`), for harnesses that render synchronously — the size
 * ratchet, `measure-description-size-deltas.ts`, and unit tests.
 *
 * Sibling of `scripts/sprite-assets-store.ts`; same eager-walk rationale.
 * Lives under `scripts/` because it uses Node `fs`, which `src/` may never do
 * (CLAUDE.md) — the BROWSER path is `@knowvah/plantuml-emoji`, which ships the
 * same bytes and the same key scheme but leaves loading to the consumer.
 *
 * Combine with the sprite store when a fixture needs both:
 *
 * ```ts
 * combineAssetStores(buildSpriteAssetsStore(), buildEmojiAssetsStore())
 * ```
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AssetPayload, AssetStore } from '../src/core/asset-store.js';
import { internalEmojiAssetKey } from '../src/core/internal-emoji-store.js';
import { walkFiles } from './vendor-stdlib/walk.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_ASSETS_EMOJI_DIR = join(REPO_ROOT, 'assets', 'emoji');

const SVG_MIME = 'image/svg+xml';
const SVG_SUFFIX = '.svg';

/**
 * Reads every `.svg` under `emojiDir` into an in-memory {@link AssetStore},
 * keyed `emoji:<codepoint>.svg`. Non-SVG files — this repo's own `LICENSES.md`
 * notice — are skipped.
 *
 * Eager: the tree is 4.8 MB across 1174 files, and the size harness renders
 * hundreds of fixtures in one process, so one walk beats per-lookup `statSync`.
 * Throws with a remediation hint when the directory is absent.
 */
export function readEmojiAssetsStore(emojiDir: string = DEFAULT_ASSETS_EMOJI_DIR): AssetStore {
  if (!existsSync(emojiDir)) {
    throw new Error(
      `${emojiDir} does not exist. Run \`npx tsx scripts/vendor-emoji.ts\` first, then re-run this command.`,
    );
  }
  const entries = new Map<string, AssetPayload>();
  for (const { relPath, absPath } of walkFiles(emojiDir)) {
    if (!relPath.toLowerCase().endsWith(SVG_SUFFIX)) continue;
    // `relPath` is `<codepoint>.svg`; the key scheme wants the bare codepoint.
    const unicode = relPath.slice(0, -SVG_SUFFIX.length);
    entries.set(internalEmojiAssetKey(unicode), {
      bytes: new Uint8Array(readFileSync(absPath)),
      mimeType: SVG_MIME,
    });
  }
  return {
    get: (key: string): AssetPayload | undefined => entries.get(key),
    has: (key: string): boolean => entries.has(key),
  };
}

let cached: AssetStore | undefined;

/** Process-wide cached {@link readEmojiAssetsStore} — the counterpart to
 *  `buildSpriteAssetsStore`, so a harness pays the 4.8 MB walk once. */
export function buildEmojiAssetsStore(): AssetStore {
  cached ??= readEmojiAssetsStore();
  return cached;
}
