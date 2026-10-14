/**
 * Test-side `AssetStore` serving the vendored dedication PNGs
 * (`assets/dedication/<resource>.png`) under `DEDICATION_IMAGES`' keys —
 * what a host wires through `RenderOptions.assetStore` (ADR-2). Delegates to
 * the utility assets store (T1i).
 */
import type { AssetPayload, AssetStore } from '../../../src/core/asset-store.js';
import { buildUtilityAssetsStore } from '../../helpers/utility-assets-store.js';

/** Every dedication PNG (and the egg pictures), keyed `dedication:<resource>.png` -- the
 *  one source of truth is `scripts/utility-assets-store.ts` (T1i). */
export function dedicationAssetStore(): AssetStore {
  return buildUtilityAssetsStore();
}

/** A store holding `key` with the given bytes only. */
export function storeOf(key: string, bytes: Uint8Array): AssetStore {
  const payload: AssetPayload = { bytes, mimeType: 'image/png' };
  return { get: (k) => (k === key ? payload : undefined), has: (k) => k === key };
}
