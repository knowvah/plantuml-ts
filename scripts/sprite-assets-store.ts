/**
 * An {@link AssetStore} (ADR-2's synchronous seam, `src/core/asset-store.ts`)
 * built from the vendored jar-internal sprite bundle in `assets/sprites/`.
 *
 * This is the Node-side loader half of F4-a. It is the ONLY thing that reads
 * the vendored bytes off disk, and it lives under `scripts/` — never `src/` —
 * so no sprite byte can reach the default library bundle (ADR-9(b), stop
 * condition 8). A host that wants jar-internal sprites in a browser builds an
 * equivalent store from its own fetch/bundler channel and passes it as
 * `RenderOptions.assetStore`; the key scheme
 * (`internal-sprite-store.ts#internalSpriteAssetKey`) is the whole contract.
 *
 * Same shape and rationale as `scripts/stdlib-assets-store.ts`, which does
 * this for `assets/stdlib/`.
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { walkFiles } from './vendor-stdlib/walk.js';
import type { AssetPayload, AssetStore } from '../src/core/asset-store.js';
import { internalSpriteAssetKey } from '../src/core/internal-sprite-store.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
export const DEFAULT_ASSETS_SPRITES_DIR = join(REPO_ROOT, 'assets', 'sprites');

const MIME_TYPES: Readonly<Record<string, string>> = {
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
};

function mimeTypeOf(relPath: string): string | undefined {
  const dot = relPath.lastIndexOf('.');
  return dot === -1 ? undefined : MIME_TYPES[relPath.slice(dot).toLowerCase()];
}

/**
 * Reads every `.svg`/`.png` under `spritesDir` into an in-memory
 * {@link AssetStore}, keyed `sprite:<path>.<ext>` (lowercased). Non-image
 * files — this repo's own `LICENSES.md` notice, for one — are skipped.
 *
 * Eager, not lazy: the whole tree is 600 KB and the size-conformance harness
 * renders hundreds of fixtures in one process, so one walk beats a per-lookup
 * `statSync`. Throws with a remediation hint when the directory is absent.
 */
export function readSpriteAssetsStore(spritesDir: string = DEFAULT_ASSETS_SPRITES_DIR): AssetStore {
  if (!existsSync(spritesDir)) {
    throw new Error(
      `${spritesDir} does not exist. Run \`npx tsx scripts/vendor-sprites.ts\` first, then re-run this command.`,
    );
  }
  const entries = new Map<string, AssetPayload>();
  for (const { relPath, absPath } of walkFiles(spritesDir)) {
    const mimeType = mimeTypeOf(relPath);
    if (mimeType === undefined) continue;
    entries.set(internalSpriteAssetKey(relPath), {
      bytes: new Uint8Array(readFileSync(absPath)),
      mimeType,
    });
  }
  return {
    get: (key: string): AssetPayload | undefined => entries.get(key),
    has: (key: string): boolean => entries.has(key),
  };
}

let cached: AssetStore | undefined;

/** Process-wide cached {@link readSpriteAssetsStore} — the counterpart to
 *  `buildStdlibAssetsStore`, shared by every harness that renders many
 *  fixtures in one process. */
export function buildSpriteAssetsStore(): AssetStore {
  cached ??= readSpriteAssetsStore();
  return cached;
}
