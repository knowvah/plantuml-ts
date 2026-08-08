/**
 * @knowvah/plantuml-sprites-archimate — ArchiMate sprite artwork for
 * `<<$archimate/name>>` stereotypes and `sprite $x jar:archimate/name`.
 *
 * Ships DATA, not code: 139 artwork files under `assets/archimate/`, plus the
 * key-scheme helpers needed to feed them to `RenderOptions.assetStore`.
 * Deliberately browser-safe — no `fs`, no I/O. How the bytes reach the store
 * is the consumer's choice; this module only fixes the NAMING so every loader
 * agrees with the core resolver (`core/internal-sprite-store.ts`).
 *
 * Separate opt-in package so `@knowvah/plantuml-ts` stays a code-only install
 * and you pull only the icon libraries you actually use.
 */

/** Namespace prefix for internal sprite assets inside a shared `AssetStore` —
 *  the scheme `core/internal-sprite-store.ts#internalSpriteAssetKey` resolves. */
export const SPRITE_ASSET_PREFIX = 'sprite:';

/** The extensions `SpriteImage.fromInternal` probes, in upstream's order. */
export const SPRITE_EXTENSIONS = ['.svg', '.png'];

/**
 * `AssetStore` key for one sprite path, extension included.
 *
 * The extension is part of the key on purpose: upstream probes `.svg` before
 * `.png`, and that precedence belongs to the resolver, not the store.
 *
 * @param {string} path e.g. `"archimate/interface"` (no extension)
 * @param {string} extension e.g. `".svg"`
 * @returns {string} e.g. `"sprite:archimate/interface.svg"`
 */
export function spriteAssetKey(path, extension) {
  return `${SPRITE_ASSET_PREFIX}${path.toLowerCase()}${extension.toLowerCase()}`;
}

/** Package metadata and its attribution obligations (MIT, but the ArchiMate
 *  trademark notice and the Archi credit still travel with the bytes). */
export const archimateSprites = {
  name: 'archimate',
  assetsDir: 'assets',
  fileCount: 139,
  license: 'MIT',
  attribution: 'Archimate sprites are from Archi: http://www.archimatetool.com',
  trademark: 'ArchiMate is a registered trademark of The Open Group.',
  modifications: 'None — byte-for-byte copies of the upstream artwork.',
  assetKey: spriteAssetKey,
};
