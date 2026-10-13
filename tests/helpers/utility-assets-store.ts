/**
 * Test-side re-export of the assets-backed utility {@link AssetStore} builder
 * (dedication + egg pictures). The implementation lives under `scripts/` (Node
 * `fs`); this file exists so harnesses import it from `tests/helpers/`, exactly
 * as `tests/helpers/emoji-assets-store.ts` does.
 */
export {
  buildUtilityAssetsStore,
  readUtilityAssetsStore,
  DEFAULT_ASSETS_DEDICATION_DIR,
  DEFAULT_ASSETS_EGGS_DIR,
} from '../../scripts/utility-assets-store.js';
