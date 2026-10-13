/**
 * Test-side `AssetStore` serving the vendored dedication PNGs
 * (`assets/dedication/<resource>.png`) under `DEDICATION_IMAGES`' keys —
 * what a host wires through `RenderOptions.assetStore` (ADR-2). No production
 * store serves them yet (T0e journal row 10).
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { AssetPayload, AssetStore } from '../../../src/core/asset-store.js';
import { DEDICATION_IMAGES } from '../../../src/diagrams/dedication/dedication-images.js';

const ASSETS = join(import.meta.dirname, '..', '..', '..', 'assets', 'dedication');

/** Every dedication PNG, read once, keyed `dedication:<resource>.png`. */
export function dedicationAssetStore(): AssetStore {
  const payloads = new Map<string, AssetPayload>();
  for (const { resource, assetKey } of Object.values(DEDICATION_IMAGES))
    payloads.set(assetKey, { bytes: readFileSync(join(ASSETS, `${resource}.png`)), mimeType: 'image/png' });
  return { get: (key) => payloads.get(key), has: (key) => payloads.has(key) };
}

/** A store holding `key` with the given bytes only. */
export function storeOf(key: string, bytes: Uint8Array): AssetStore {
  const payload: AssetPayload = { bytes, mimeType: 'image/png' };
  return { get: (k) => (k === key ? payload : undefined), has: (k) => k === key };
}
