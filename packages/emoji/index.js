/**
 * @knowvah/plantuml-emoji — Twemoji artwork for `<:name:>` creole emoji.
 *
 * Ships DATA, not code: 1174 SVG artwork files under `assets/`, plus the
 * key-scheme helpers needed to feed them to `RenderOptions.assetStore`.
 * Deliberately browser-safe — no `fs`, no I/O. How the bytes reach the store
 * is the consumer's choice (bundler glob, fetch from a served path, or the
 * repo's own Node-side helper); this module only fixes the NAMING so every
 * loader agrees with the core resolver.
 *
 * Separate package because the artwork is **CC-BY 4.0**, not MIT like
 * `@knowvah/plantuml-ts` itself. See LICENSE and LICENSES.md — attribution is
 * required when you ship it.
 */

/** Namespace prefix for emoji assets inside a shared `AssetStore`. Mirrors
 *  the `sprite:` prefix the internal sprite bundle uses, so one store can
 *  carry both without collision. */
export const EMOJI_ASSET_PREFIX = 'emoji:';

/**
 * `AssetStore` key for one emoji, by unicode codepoint (`Emoji.ts`'s registry
 * key — e.g. `1f680` for `<:rocket:>`). Lowercased, matching upstream's own
 * `Emoji.retrieve` behaviour.
 *
 * @param {string} unicode hex codepoint, e.g. `"1f680"`
 * @returns {string} e.g. `"emoji:1f680.svg"`
 */
export function emojiAssetKey(unicode) {
  return `${EMOJI_ASSET_PREFIX}${unicode.toLowerCase()}.svg`;
}

/**
 * Path of one emoji's artwork RELATIVE to this package's `assets/` directory.
 *
 * @param {string} unicode hex codepoint, e.g. `"1f680"`
 * @returns {string} e.g. `"1f680.svg"`
 */
export function emojiAssetPath(unicode) {
  return `${unicode.toLowerCase()}.svg`;
}

/** Package metadata, including the attribution CC-BY 4.0 requires you to
 *  carry when redistributing these assets. */
export const emojiAssets = {
  name: 'emoji',
  assetsDir: 'assets',
  fileCount: 1174,
  license: 'CC-BY-4.0',
  licenseUrl: 'https://creativecommons.org/licenses/by/4.0/',
  attribution: 'Twemoji (c) by Twitter at https://twemoji.twitter.com/',
  modifications: 'None — byte-for-byte copies of the upstream artwork.',
  assetKey: emojiAssetKey,
  assetPath: emojiAssetPath,
};
