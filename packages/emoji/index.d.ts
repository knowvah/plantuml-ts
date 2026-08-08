/** Namespace prefix for emoji assets inside a shared `AssetStore`. */
export declare const EMOJI_ASSET_PREFIX: 'emoji:';

/** `AssetStore` key for one emoji, by unicode codepoint (e.g. `"1f680"`). */
export declare function emojiAssetKey(unicode: string): string;

/** Path of one emoji's artwork relative to this package's `assets/` dir. */
export declare function emojiAssetPath(unicode: string): string;

export interface EmojiAssets {
  readonly name: 'emoji';
  readonly assetsDir: 'assets';
  readonly fileCount: number;
  readonly license: 'CC-BY-4.0';
  readonly licenseUrl: string;
  /** Attribution CC-BY 4.0 requires you to carry when redistributing. */
  readonly attribution: string;
  readonly modifications: string;
  readonly assetKey: (unicode: string) => string;
  readonly assetPath: (unicode: string) => string;
}

export declare const emojiAssets: EmojiAssets;
