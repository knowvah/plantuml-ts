/**
 * Node-side {@link AssetStore} over the vendored utility-diagram pictures --
 * the ten dedication PNGs (`assets/dedication/`) and the two egg pictures
 * (`assets/eggs/`) -- for harnesses that render synchronously: the survey, the
 * utility conformance harness and unit tests (ufp T1i, ADR-2).
 *
 * Sibling of `scripts/emoji-assets-store.ts`. Lives under `scripts/` because it
 * uses Node `fs`, which `src/` may never do (CLAUDE.md). Keys are the modules'
 * own `assetKey`s (`dedication:<resource>.png`, `eggs:<name>.png`).
 *
 * ```ts
 * combineAssetStores(buildSpriteAssetsStore(), buildUtilityAssetsStore())
 * ```
 */

import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { AssetPayload, AssetStore } from '../src/core/asset-store.js';
import { DEDICATION_IMAGES } from '../src/diagrams/dedication/dedication-images.js';
import { APPLE2_PNG } from '../src/diagrams/eggs/apple2-image.js';
import { RIP_PNG } from '../src/diagrams/eggs/rip-image.js';

const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

export const DEFAULT_ASSETS_DEDICATION_DIR = join(REPO_ROOT, 'assets', 'dedication');
export const DEFAULT_ASSETS_EGGS_DIR = join(REPO_ROOT, 'assets', 'eggs');

const PNG_MIME = 'image/png';
const PNG_SUFFIX = '.png';

/** `assets/eggs/<file>` per egg picture, keyed by the module's `assetKey`. */
const EGG_FILES: readonly { readonly assetKey: string; readonly file: string }[] = [
  { assetKey: APPLE2_PNG.assetKey, file: 'apple2' + PNG_SUFFIX },
  { assetKey: RIP_PNG.assetKey, file: 'rip' + PNG_SUFFIX },
];

/**
 * Reads every dedication and egg PNG into an in-memory {@link AssetStore}.
 * Eager (12 small files), so the store is a pure lookup afterwards. Throws with
 * a remediation hint when either directory is absent.
 */
export function readUtilityAssetsStore(
  dedicationDir: string = DEFAULT_ASSETS_DEDICATION_DIR,
  eggsDir: string = DEFAULT_ASSETS_EGGS_DIR,
): AssetStore {
  for (const dir of [dedicationDir, eggsDir]) {
    if (!existsSync(dir)) throw new Error(`${dir} does not exist. Restore it from git (\`git checkout -- assets\`).`);
  }
  const entries = new Map<string, AssetPayload>();
  const add = (assetKey: string, path: string): void => {
    entries.set(assetKey, { bytes: new Uint8Array(readFileSync(path)), mimeType: PNG_MIME });
  };
  for (const { resource, assetKey } of Object.values(DEDICATION_IMAGES))
    add(assetKey, join(dedicationDir, resource + PNG_SUFFIX));
  for (const { assetKey, file } of EGG_FILES) add(assetKey, join(eggsDir, file));
  return {
    get: (key: string): AssetPayload | undefined => entries.get(key),
    has: (key: string): boolean => entries.has(key),
  };
}

let cached: AssetStore | undefined;

/** Process-wide cached {@link readUtilityAssetsStore}. */
export function buildUtilityAssetsStore(): AssetStore {
  cached ??= readUtilityAssetsStore();
  return cached;
}
