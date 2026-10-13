/**
 * `APPLE2_PNG` -- the image `apple //e` draws under its text (`PSystemAppleTwo.java:55`,
 * `PSystemVersion.getApple2Image`, java:124-126: `version/apple2.png`, a header-stripped WebP read
 * by `SFile.getImageFromWebpButHeader`), as the pinned jar re-encodes it in SVG (the D4 approach).
 * The PNG is the jar's own decode + re-encode, copied byte for byte from the authored jar oracle
 * `tests/fixtures/utility/apple.svg` (`scripts/oracle-render.sh`).
 *
 * The bytes are NOT here (T1i, stop 12): they ship as `assets/eggs/apple2.png`, reached through the
 * `AssetStore` seam (ADR-2) under `assetKey`, as `dedication/dedication-images.ts` does. `sha256`
 * pins the asset bytes. This module also holds the two pieces `rip-image.ts` shares: `EggImage`
 * and `eggRasterImage`.
 *
 * @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/eggs/PSystemAppleTwo.java
 */
import type { AssetStore } from '../../core/asset-store.js';
import type { RasterImage } from '../../core/error/raster-image.js';
import { toBase64DataUri } from '../../core/klimt/sprite/png-encoder.js';

/** One egg picture: asset key, drawn size, and the sha256 of the asset bytes. */
export interface EggImage {
  readonly assetKey: string;
  readonly width: number;
  readonly height: number;
  readonly sha256: string;
}

/** The `IOException` the egg constructors declare (`PSystemAppleTwo.java:50`, `PSystemRIP.java:50`):
 *  the picture could not be read. Its factories catch it and return null (java:56-59, :55-58). */
export class EggImageUnavailableError extends Error {
  constructor(assetKey: string) {
    super(`Egg image ${assetKey} is not served by the asset store`);
    this.name = 'EggImageUnavailableError';
  }
}

/** The picture as a `RasterImage` (a PNG data URI), read through the store; throws
 *  {@link EggImageUnavailableError} when the store does not serve it (upstream's failed read).
 *  @see ~/git/plantuml/src/main/java/net/sourceforge/plantuml/version/PSystemVersion.java:124-126 */
export function eggRasterImage(image: EggImage, assetStore: AssetStore | undefined): RasterImage {
  const payload = assetStore?.get(image.assetKey);
  if (payload === undefined) throw new EggImageUnavailableError(image.assetKey);
  return { width: image.width, height: image.height, href: toBase64DataUri(payload.bytes) };
}

/** 389x269, `assets/eggs/apple2.png`. */
export const APPLE2_PNG: EggImage = {
  assetKey: 'eggs:apple2.png',
  width: 389,
  height: 269,
  sha256: '821ab7b446be69cb630bdff123de107dd7c5dd488e0f1d417bf9023d28102bca',
};
