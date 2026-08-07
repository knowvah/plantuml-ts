/** Namespace prefix for internal sprite assets inside a shared `AssetStore`. */
export declare const SPRITE_ASSET_PREFIX: 'sprite:';

/** Extensions `SpriteImage.fromInternal` probes, in upstream's order. */
export declare const SPRITE_EXTENSIONS: readonly ['.svg', '.png'];

/** `AssetStore` key for one sprite path, extension included. */
export declare function spriteAssetKey(path: string, extension: string): string;

export interface ArchimateSprites {
  readonly name: 'archimate';
  readonly assetsDir: 'assets';
  readonly fileCount: number;
  readonly license: 'MIT';
  readonly attribution: string;
  /** ArchiMate is a registered trademark of The Open Group. */
  readonly trademark: string;
  readonly modifications: string;
  readonly assetKey: (path: string, extension: string) => string;
}

export declare const archimateSprites: ArchimateSprites;
