export * from '@knowvah/plantuml-stdlib-all';
export {
  archimateSprites,
  spriteAssetKey,
  SPRITE_ASSET_PREFIX,
  SPRITE_EXTENSIONS,
} from '@knowvah/plantuml-sprites-archimate';
export {
  emojiAssets,
  emojiAssetKey,
  emojiAssetPath,
  EMOJI_ASSET_PREFIX,
} from '@knowvah/plantuml-emoji';

export interface AssetPackageLicence {
  readonly name: string;
  readonly license: string;
}

/** Every asset package this meta-package pulls, with its licence. */
export declare const assetPackages: readonly AssetPackageLicence[];
