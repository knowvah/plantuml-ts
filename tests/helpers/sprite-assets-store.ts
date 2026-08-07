/**
 * Test-side re-export of the assets-backed sprite {@link AssetStore} builder
 * (F4-a). The implementation lives under `scripts/` (Node `fs`) — this file
 * exists only so harnesses can import it from `tests/helpers/` per
 * `~/.claude/rules/naming-conventions.md`, exactly as
 * `tests/helpers/stdlib-assets-store.ts` already does for `assets/stdlib/`.
 *
 * Wiring recipe for a synchronous harness (ADR-2):
 *
 * ```ts
 * import { combineAssetStores } from '../../src/core/asset-store.js';
 * renderSync(markup, { assetStore: buildSpriteAssetsStore(), ... });
 * ```
 */
export {
  buildSpriteAssetsStore,
  readSpriteAssetsStore,
  DEFAULT_ASSETS_SPRITES_DIR,
} from '../../scripts/sprite-assets-store.js';
