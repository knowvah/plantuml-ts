/**
 * Test-side re-export of the assets-backed emoji {@link AssetStore} builder.
 * The implementation lives under `scripts/` (Node `fs`); this file exists so
 * harnesses import it from `tests/helpers/` per
 * `~/.claude/rules/naming-conventions.md`, exactly as
 * `tests/helpers/sprite-assets-store.ts` does.
 */
export {
  buildEmojiAssetsStore,
  readEmojiAssetsStore,
  DEFAULT_ASSETS_EMOJI_DIR,
} from '../../scripts/emoji-assets-store.js';
