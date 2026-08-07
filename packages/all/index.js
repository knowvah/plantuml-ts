/**
 * @knowvah/plantuml-all — one install for every plantuml-ts asset package.
 *
 * Re-exports the stdlib meta-package plus the icon/emoji asset packages, so
 * `<<$archimate/...>>` stereotypes, `<:emoji:>` glyphs and the stdlib bundles
 * all resolve without hand-picking dependencies.
 *
 * ⚠️ **This package is not uniformly MIT.** `@knowvah/plantuml-emoji` ships
 * Twemoji artwork under **CC-BY 4.0**, which carries an attribution
 * requirement that flows to you when you redistribute. Installing this
 * meta-package opts you into it. If you need an MIT-only dependency tree,
 * install the individual packages and omit `@knowvah/plantuml-emoji`.
 * See LICENSES.md.
 */
export * from '@knowvah/plantuml-stdlib-all';
export { archimateSprites, spriteAssetKey, SPRITE_ASSET_PREFIX, SPRITE_EXTENSIONS } from '@knowvah/plantuml-sprites-archimate';
export { emojiAssets, emojiAssetKey, emojiAssetPath, EMOJI_ASSET_PREFIX } from '@knowvah/plantuml-emoji';

/** Every asset package this meta-package pulls, with its licence — so a
 *  consumer can enumerate obligations programmatically instead of reading
 *  three READMEs. */
export const assetPackages = [
  { name: '@knowvah/plantuml-stdlib', license: 'MIT' },
  { name: '@knowvah/plantuml-stdlib-aws', license: 'CC-BY-ND-2.0' },
  { name: '@knowvah/plantuml-stdlib-tupadr3', license: 'MIT' },
  { name: '@knowvah/plantuml-sprites-archimate', license: 'MIT' },
  { name: '@knowvah/plantuml-emoji', license: 'CC-BY-4.0' },
];
